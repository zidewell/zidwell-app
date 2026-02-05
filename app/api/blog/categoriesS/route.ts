import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseBlog = createClient(
  process.env.BLOG_SUPABASE_URL!,
  process.env.BLOG_SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to generate slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .trim();
}

// GET - Get all categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    console.log("Fetching categories from 'categories' table...");

    let query = supabaseBlog
      .from("categories")
      .select("*", { count: "exact" })
      .order("name", { ascending: true });

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply pagination
    const { data: categories, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Supabase error:", error);
      
      // If categories table doesn't exist, generate from blog_posts
      if (error.code === 'PGRST205' || error.message.includes('Could not find the table')) {
        console.log("Categories table not found, generating from blog_posts...");
        const generatedCategories = await generateCategoriesFromPosts();
        return NextResponse.json({
          categories: generatedCategories,
          total: generatedCategories.length,
          limit,
          offset,
          note: "Generated from posts"
        });
      }
      
      return NextResponse.json(
        { error: "Failed to fetch categories" },
        { status: 500 }
      );
    }

    console.log(`Found ${categories?.length || 0} categories`);
    
    return NextResponse.json({
      categories: categories || [],
      total: count || 0,
      limit,
      offset
    });

  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = body;

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    const categoryName = name.trim();
    const slug = generateSlug(categoryName);

    // Check if category already exists (by name or slug)
    const { data: existingCategory } = await supabaseBlog
      .from("categories")
      .select("id")
      .or(`name.eq.${categoryName},slug.eq.${slug}`)
      .maybeSingle();

    if (existingCategory) {
      return NextResponse.json(
        { error: "Category already exists" },
        { status: 409 }
      );
    }

    // Create category
    const { data: category, error } = await supabaseBlog
      .from("categories")
      .insert([{
        name: categoryName,
        slug,
        description: description?.trim() || null,
        post_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      
      // If categories table doesn't exist, we need to create it first
      if (error.code === 'PGRST205' || error.message.includes('Could not find the table')) {
        return NextResponse.json(
          { 
            error: "Categories table not found. Please create the 'categories' table in Supabase.",
            hint: "Run: CREATE TABLE categories (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, name VARCHAR(100) NOT NULL UNIQUE, slug VARCHAR(100) NOT NULL UNIQUE, description TEXT, post_count INTEGER DEFAULT 0, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW())"
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: error.message || "Failed to create category" },
        { status: 500 }
      );
    }

    return NextResponse.json(category, { status: 201 });

  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to generate categories from posts
async function generateCategoriesFromPosts() {
  try {
    const { data: posts, error } = await supabaseBlog
      .from("blog_posts")
      .select("categories")
      .eq("is_published", true);

    if (error) {
      console.error("Error fetching posts:", error);
      return [];
    }

    // Extract unique categories from posts
    const categoryMap = new Map<string, number>();
    
    posts?.forEach(post => {
      if (post.categories && Array.isArray(post.categories)) {
        post.categories.forEach((category: string) => {
          if (category && typeof category === 'string' && category.trim()) {
            const categoryName = category.trim();
            const count = categoryMap.get(categoryName) || 0;
            categoryMap.set(categoryName, count + 1);
          }
        });
      }
    });

    // Convert to array format
    const categories = Array.from(categoryMap.entries()).map(([name, post_count]) => ({
      id: `generated-${generateSlug(name)}`,
      name,
      slug: generateSlug(name),
      description: null,
      post_count,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    return categories;
  } catch (error) {
    console.error("Error generating categories:", error);
    return [];
  }
}