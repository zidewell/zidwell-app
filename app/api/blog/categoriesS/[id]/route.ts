import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseBlog = createClient(
  process.env.BLOG_SUPABASE_URL!,
  process.env.BLOG_SUPABASE_SERVICE_ROLE_KEY!
);

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .trim();
}

// GET - Get single category by ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;

    const { data: category, error } = await supabaseBlog
      .from("categories")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Supabase error:", error);

      // Handle generated categories
      if (id.startsWith("generated-")) {
        const categoryName = id.replace("generated-", "").replace(/-/g, " ");
        
        // Count posts with this category
        const { data: posts } = await supabaseBlog
          .from("blog_posts")
          .select("id")
          .contains("categories", [categoryName])
          .eq("is_published", true);

        const generatedCategory = {
          id: id,
          name: categoryName,
          slug: id.replace("generated-", ""),
          description: null,
          post_count: posts?.length || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        return NextResponse.json(generatedCategory);
      }
      
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(category);

  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update category
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;

    const body = await request.json();
    const { name, description } = body;

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
      slug = generateSlug(name.trim());

      // Check if new slug already exists (excluding current category)
      const { data: duplicateSlug } = await supabaseBlog
        .from("categories")
        .select("id")
        .eq("slug", slug)
        .neq("id", id)
        .maybeSingle();

      if (duplicateSlug) {
        return NextResponse.json(
          { error: "Slug already exists" },
          { status: 409 }
        );
      }
    }

    // Update category
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (name) {
      updateData.name = name.trim();
      updateData.slug = slug;
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    const { data: category, error } = await supabaseBlog
      .from("categories")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to update category" },
        { status: 500 }
      );
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

// DELETE - Delete category
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;

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

    // Delete category
    const { error } = await supabaseBlog
      .from("categories")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to delete category" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Category deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}