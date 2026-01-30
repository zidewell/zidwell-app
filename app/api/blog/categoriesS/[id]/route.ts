// app/api/categories/[id]/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
 const supabaseBlog = createClient(
  process.env.BLOG_SUPABASE_URL!,
  process.env.BLOG_SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if categories table exists
    const { data: tableExists } = await supabaseBlog
      .from("categories")
      .select("id")
      .limit(1);

    const categoriesTableExists =
      !tableExists || tableExists.length === 0 ? false : true;

    if (categoriesTableExists) {
      // Get from categories table
      const { data: category, error } = await supabaseBlog
        .from("categories")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        // If not found, generate from posts
        const match = id.match(/^generated-(.+)$/);
        if (match) {
          const slug = match[1];
          const categoryName = slug.replace(/-/g, " ");
          
          const { data: posts } = await supabaseBlog
            .from("blog_posts")
            .select("*")
            .contains("categories", [categoryName])
            .eq("is_published", true);

          if (posts && posts.length > 0) {
            const generatedCategory = {
              id: id,
              name: categoryName,
              slug: slug,
              description: null,
              post_count: posts.length,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            return NextResponse.json(generatedCategory);
          }
        }
        
        return NextResponse.json(
          { error: "Category not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(category);
    } else {
      // Generate category from posts
      const match = id.match(/^generated-(.+)$/);
      if (!match) {
        return NextResponse.json(
          { error: "Invalid category ID format" },
          { status: 400 }
        );
      }

      const slug = match[1];
      const categoryName = slug.replace(/-/g, " ");
      
      const { data: posts } = await supabaseBlog
        .from("blog_posts")
        .select("*")
        .contains("categories", [categoryName])
        .eq("is_published", true);

      if (!posts || posts.length === 0) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 404 }
        );
      }

      const generatedCategory = {
        id: id,
        name: categoryName,
        slug: slug,
        description: null,
        post_count: posts.length,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return NextResponse.json(generatedCategory);
    }
  } catch (error) {
    console.error("Error fetching category by ID:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, slug: customSlug } = body;

    // Check if category exists
    const { data: existingCategory, error: fetchError } = await supabaseBlog
      .from("categories")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Generate new slug if name changed
    let slug = existingCategory.slug;
    if (name && name !== existingCategory.name) {
      slug = customSlug?.trim() || generateSlug(name.trim());

      // Check if new slug already exists (excluding current category)
      const { data: duplicateSlug } = await supabaseBlog
        .from("categories")
        .select("id")
        .eq("slug", slug)
        .neq("id", id)
        .single();

      if (duplicateSlug) {
        return NextResponse.json(
          { error: "Slug already exists" },
          { status: 409 }
        );
      }
    }

    // Update category
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (name) {
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (slug) {
      updateData.slug = slug;
    }

    const { data: category, error } = await supabaseBlog
      .from("categories")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Add generateSlug function here if needed
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .trim();
}