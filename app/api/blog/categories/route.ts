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

// GET - Get all categories (from categories table + from posts)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    console.log("Fetching categories from both 'categories' table and posts...");

    // 1. Get categories from categories table
    let query = supabaseBlog
      .from("categories")
      .select("*", { count: "exact" })
      .order("name", { ascending: true });

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: tableCategories, error: tableError, count: tableCount } = await query
      .range(offset, offset + limit - 1);

    if (tableError && tableError.code !== 'PGRST205') {
      console.error("Error fetching from categories table:", tableError);
    }

    // 2. Get all posts to extract categories from their arrays
    const { data: posts, error: postsError } = await supabaseBlog
      .from("blog_posts")
      .select("categories")
      .eq("is_published", true);

    if (postsError) {
      console.error("Error fetching posts:", postsError);
    }

    // 3. Extract unique categories from posts
    const postCategorySet = new Map<string, number>();
    
    posts?.forEach(post => {
      if (post.categories && Array.isArray(post.categories)) {
        post.categories.forEach((category: string) => {
          if (category && typeof category === 'string' && category.trim()) {
            const categoryName = category.trim();
            const count = postCategorySet.get(categoryName) || 0;
            postCategorySet.set(categoryName, count + 1);
          }
        });
      }
    });

    // 4. Convert post categories to array format
    const postCategories = Array.from(postCategorySet.entries()).map(([name, postCount]) => ({
      id: `post-${generateSlug(name)}`,
      name,
      slug: generateSlug(name),
      description: null,
      post_count: postCount,
      source: "posts",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // 5. Combine both sources, remove duplicates
    const allCategoriesMap = new Map<string, any>();
    
    // Add table categories first
    (tableCategories || []).forEach(cat => {
      allCategoriesMap.set(cat.name, {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        post_count: cat.post_count || 0,
        source: "table",
        created_at: cat.created_at,
        updated_at: cat.updated_at
      });
    });
    
    // Add post categories (if not already in table)
    postCategories.forEach(cat => {
      if (!allCategoriesMap.has(cat.name)) {
        allCategoriesMap.set(cat.name, cat);
      } else {
        // Update post count for existing category
        const existing = allCategoriesMap.get(cat.name);
        existing.post_count = (existing.post_count || 0) + cat.post_count;
        allCategoriesMap.set(cat.name, existing);
      }
    });
    
    // Convert map to array and sort by name
    let allCategories = Array.from(allCategoriesMap.values())
      .sort((a, b) => a.name.localeCompare(b.name));
    
    // Apply search filter if provided
    if (search) {
      const lowerSearch = search.toLowerCase();
      allCategories = allCategories.filter(cat => 
        cat.name.toLowerCase().includes(lowerSearch)
      );
    }
    
    // Apply pagination
    const total = allCategories.length;
    const paginatedCategories = allCategories.slice(offset, offset + limit);
    
    console.log(`Found ${tableCategories?.length || 0} categories in table, ${postCategories.length} from posts, total ${allCategories.length} unique categories`);
    
    return NextResponse.json({
      categories: paginatedCategories,
      total: total,
      limit,
      offset,
      sources: {
        table: tableCategories?.length || 0,
        posts: postCategories.length,
        total: allCategories.length
      }
    });

  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new category (saves to categories table)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    const categoryName = name.trim();
    const slug = generateSlug(categoryName);

    // Check if category already exists in categories table
    const { data: existingCategory } = await supabaseBlog
      .from("categories")
      .select("id")
      .or(`name.eq.${categoryName},slug.eq.${slug}`)
      .maybeSingle();

    if (existingCategory) {
      return NextResponse.json(
        { error: "Category already exists", id: existingCategory.id },
        { status: 409 }
      );
    }

    // Check if category exists in posts (as a fallback)
    const { data: postsWithCategory } = await supabaseBlog
      .from("blog_posts")
      .select("id")
      .contains("categories", [categoryName])
      .limit(1);

    if (postsWithCategory && postsWithCategory.length > 0) {
      return NextResponse.json(
        { error: "Category already exists in posts", id: `post-${slug}` },
        { status: 409 }
      );
    }

    // Create category in categories table
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
      
      // If categories table doesn't exist, we need to create it
      if (error.code === 'PGRST205' || error.message.includes('Could not find the table')) {
        return NextResponse.json(
          { 
            error: "Categories table not found. Please create the 'categories' table in Supabase.",
            hint: "CREATE TABLE categories (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, name VARCHAR(100) NOT NULL UNIQUE, slug VARCHAR(100) NOT NULL UNIQUE, description TEXT, post_count INTEGER DEFAULT 0, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW())"
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