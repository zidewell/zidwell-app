// app/api/categories/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseBlog } from "@/app/supabase/supabase";

// Cache for categories
const categoriesCache = new Map();
const CATEGORIES_CACHE_KEY = "blog_categories";
const CACHE_TTL = 300000; // 5 minutes

// Validate API key from request headers
function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get("x-api-key");
  return apiKey === process.env.ADMIN_API_KEY;
}

// Generate slug from category name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .trim();
}

// Invalidate categories cache
function invalidateCategoriesCache() {
  categoriesCache.clear();
}

// Helper function to sync categories from posts
async function syncCategoriesFromPosts() {
  try {
    // Get all published posts to extract categories
    const { data: posts, error } = await supabaseBlog
      .from("blog_posts")
      .select("categories, is_published")
      .eq("is_published", true);

    if (error) {
      console.error("Error fetching posts for category sync:", error);
      return;
    }

    // Count categories from posts
    const categoryCounts = new Map<string, number>();
    posts?.forEach((post) => {
      if (post.categories && Array.isArray(post.categories)) {
        post.categories.forEach((category) => {
          if (category && typeof category === "string") {
            const trimmedCategory = category.trim();
            if (trimmedCategory) {
              categoryCounts.set(
                trimmedCategory,
                (categoryCounts.get(trimmedCategory) || 0) + 1,
              );
            }
          }
        });
      }
    });

    // Check if categories table exists
    const { data: tableExists } = await supabaseBlog
      .from("categories")
      .select("id")
      .limit(1);

    const categoriesTableExists =
      !tableExists || tableExists.length === 0 ? false : true;

    if (categoriesTableExists) {
      // Update existing categories with post counts
      const { data: existingCategories } = await supabaseBlog
        .from("categories")
        .select("*");

      if (existingCategories) {
        for (const category of existingCategories) {
          const postCount = categoryCounts.get(category.name) || 0;
          if (category.post_count !== postCount) {
            await supabaseBlog
              .from("categories")
              .update({
                post_count: postCount,
                updated_at: new Date().toISOString(),
              })
              .eq("id", category.id);
          }
          // Remove from map to track which categories still exist
          categoryCounts.delete(category.name);
        }
      }

      // Create new categories that don't exist yet
      for (const [name, postCount] of categoryCounts.entries()) {
        const slug = generateSlug(name);
        
        try {
          // First, check if the category already exists
          const { data: existingCategory } = await supabaseBlog
            .from("categories")
            .select("id")
            .eq("slug", slug)
            .maybeSingle();

          if (existingCategory) {
            // Update existing category
            await supabaseBlog
              .from("categories")
              .update({
                name,
                post_count: postCount,
                updated_at: new Date().toISOString(),
              })
              .eq("slug", slug);
          } else {
            // Insert new category
            await supabaseBlog
              .from("categories")
              .insert({
                name,
                slug,
                post_count: postCount,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
          }
        } catch (error) {
          console.error(`Error upserting category ${name}:`, error);
        }
      }
    }
  } catch (error) {
    console.error("Error syncing categories from posts:", error);
  }
}

// GET - Get all categories or single category
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const slug = searchParams.get("slug");
    const includePosts = searchParams.get("include_posts") === "true";
    const skipCache = searchParams.get("skipCache") === "true";

    // If ID is provided, get single category
    if (id) {
      return await getCategoryById(id, includePosts);
    }

    // If slug is provided, get category by slug
    if (slug) {
      return await getCategoryBySlug(slug, includePosts);
    }

    // Check cache for categories list
    const cacheKey = `${CATEGORIES_CACHE_KEY}_${searchParams.toString()}`;

    if (!skipCache && categoriesCache.has(cacheKey)) {
      const cachedData = categoriesCache.get(cacheKey);
      const now = Date.now();

      // Return cached data if not expired
      if (now - cachedData.timestamp < CACHE_TTL) {
        return NextResponse.json(cachedData.data);
      }
    }

    // Otherwise, fetch from database
    const response = await getAllCategories(request);
    const data = await response.json();

    // Cache the result
    if (!skipCache) {
      categoriesCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in categories GET request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Get single category by ID
async function getCategoryById(id: string, includePosts: boolean = false) {
  try {
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
        return await getGeneratedCategoryById(id, includePosts);
      }

      // Include posts if requested
      if (includePosts && category) {
        const posts = await getPostsByCategory(category.name);
        return NextResponse.json({
          ...category,
          posts,
          post_count: posts.length,
        });
      }

      return NextResponse.json(category);
    } else {
      // Generate category from posts
      return await getGeneratedCategoryById(id, includePosts);
    }
  } catch (error) {
    console.error("Error fetching category by ID:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Get single category by slug
async function getCategoryBySlug(slug: string, includePosts: boolean = false) {
  try {
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
        .eq("slug", slug)
        .single();

      if (error) {
        // If not found, try to find by name (slug converted to name)
        const categoryName = slug.replace(/-/g, " ");
        const posts = await getPostsByCategory(categoryName);

        if (posts.length > 0) {
          const generatedCategory = {
            id: `generated-${slug}`,
            name: categoryName,
            slug: slug,
            description: null,
            post_count: posts.length,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...(includePosts && { posts }),
          };
          return NextResponse.json(generatedCategory);
        }

        return NextResponse.json(
          { error: "Category not found" },
          { status: 404 },
        );
      }

      // Include posts if requested
      if (includePosts && category) {
        const posts = await getPostsByCategory(category.name);
        return NextResponse.json({
          ...category,
          posts,
          post_count: posts.length,
        });
      }

      return NextResponse.json(category);
    } else {
      // Generate category from posts
      const categoryName = slug.replace(/-/g, " ");
      const posts = await getPostsByCategory(categoryName);

      if (posts.length > 0) {
        const generatedCategory = {
          id: `generated-${slug}`,
          name: categoryName,
          slug: slug,
          description: null,
          post_count: posts.length,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...(includePosts && { posts }),
        };
        return NextResponse.json(generatedCategory);
      }

      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }
  } catch (error) {
    console.error("Error fetching category by slug:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Get generated category from posts
async function getGeneratedCategoryById(
  id: string,
  includePosts: boolean = false,
) {
  try {
    // Extract category name from generated ID (format: generated-slug)
    const match = id.match(/^generated-(.+)$/);
    if (!match) {
      return NextResponse.json(
        { error: "Invalid category ID format" },
        { status: 400 },
      );
    }

    const slug = match[1];
    const categoryName = slug.replace(/-/g, " ");
    const posts = await getPostsByCategory(categoryName);

    if (posts.length === 0) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
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
      ...(includePosts && { posts }),
    };

    return NextResponse.json(generatedCategory);
  } catch (error) {
    console.error("Error getting generated category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Get posts by category name
async function getPostsByCategory(categoryName: string) {
  try {
    const { data: posts, error } = await supabaseBlog
      .from("blog_posts")
      .select(
        `
        *,
        author:profiles(*)
      `,
      )
      .contains("categories", [categoryName])
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error getting posts by category:", error);
      return [];
    }

    return posts || [];
  } catch (error) {
    console.error("Error in getPostsByCategory:", error);
    return [];
  }
}

// Get all categories
async function getAllCategories(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includePosts = searchParams.get("include_posts") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const sortBy = searchParams.get("sort_by") || "post_count";
    const sortOrder = searchParams.get("sort_order") || "desc";
    const search = searchParams.get("search");
    const minPosts = parseInt(searchParams.get("min_posts") || "0");

    // Sync categories from posts first
    await syncCategoriesFromPosts();

    // Check if categories table exists
    const { data: tableExists } = await supabaseBlog
      .from("categories")
      .select("id")
      .limit(1);

    const categoriesTableExists =
      !tableExists || tableExists.length === 0 ? false : true;

    let categories: any[] = [];

    if (categoriesTableExists) {
      // Get from categories table
      let query = supabaseBlog
        .from("categories")
        .select("*", { count: "exact" })
        .order(sortBy, { ascending: sortOrder === "asc" });

      if (search) {
        query = query.or(
          `name.ilike.%${search}%,description.ilike.%${search}%`,
        );
      }

      if (minPosts > 0) {
        query = query.gte("post_count", minPosts);
      }

      const { data, error } = await query.range(offset, offset + limit - 1);

      if (error) {
        console.error("Error fetching categories from table:", error);
        // Fallback to generating from posts
        categories = await generateCategoriesFromPosts();
      } else {
        categories = data || [];
      }
    } else {
      // Generate categories from posts
      categories = await generateCategoriesFromPosts();
    }

    // Apply filters to generated categories if not already filtered
    if (!categoriesTableExists || search || minPosts > 0) {
      if (search) {
        const searchLower = search.toLowerCase();
        categories = categories.filter(
          (cat) =>
            cat.name.toLowerCase().includes(searchLower) ||
            (cat.description &&
              cat.description.toLowerCase().includes(searchLower)),
        );
      }

      if (minPosts > 0) {
        categories = categories.filter((cat) => cat.post_count >= minPosts);
      }

      // Sort generated categories
      categories.sort((a, b) => {
        if (sortBy === "name") {
          return sortOrder === "asc"
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        } else if (sortBy === "post_count") {
          return sortOrder === "asc"
            ? a.post_count - b.post_count
            : b.post_count - a.post_count;
        } else if (sortBy === "created_at") {
          return sortOrder === "asc"
            ? new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime()
            : new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime();
        }
        return 0;
      });

      // Apply pagination
      categories = categories.slice(offset, offset + limit);
    }

    // Include posts if requested
    if (includePosts && categories.length > 0) {
      await Promise.all(
        categories.map(async (category) => {
          const posts = await getPostsByCategory(category.name);
          category.posts = posts;
        }),
      );
    }

    return NextResponse.json({
      categories,
      pagination: {
        limit,
        offset,
        total: categories.length,
        hasMore: categories.length === limit,
      },
    });
  } catch (error) {
    console.error("Error fetching all categories:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Generate categories from posts
async function generateCategoriesFromPosts() {
  try {
    const { data: posts, error } = await supabaseBlog
      .from("blog_posts")
      .select("categories, is_published, created_at")
      .eq("is_published", true);

    if (error) {
      console.error("Error fetching posts for category generation:", error);
      return [];
    }

    // Count categories from posts
    const categoryCounts = new Map<string, number>();
    const categoryFirstSeen = new Map<string, string>();

    posts?.forEach((post) => {
      if (post.categories && Array.isArray(post.categories)) {
        post.categories.forEach((category) => {
          if (category && typeof category === "string") {
            const trimmedCategory = category.trim();
            if (trimmedCategory) {
              categoryCounts.set(
                trimmedCategory,
                (categoryCounts.get(trimmedCategory) || 0) + 1,
              );
              if (!categoryFirstSeen.has(trimmedCategory)) {
                categoryFirstSeen.set(
                  trimmedCategory,
                  post.created_at || new Date().toISOString(),
                );
              }
            }
          }
        });
      }
    });

    // Convert to category objects
    const categories = Array.from(categoryCounts.entries()).map(
      ([name, post_count]) => ({
        id: `generated-${generateSlug(name)}`,
        name,
        slug: generateSlug(name),
        description: null,
        post_count,
        created_at: categoryFirstSeen.get(name) || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
    );

    return categories;
  } catch (error) {
    console.error("Error generating categories from posts:", error);
    return [];
  }
}

// POST - Create new category
export async function POST(request: NextRequest) {
  try {
    // Validate API key
    // if (!validateApiKey(request)) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const body = await request.json();
    const { name, description, slug: customSlug } = body;

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 },
      );
    }

    const categoryName = name.trim();

    // Generate slug
    const slug = customSlug?.trim() || generateSlug(categoryName);

    // Check if category already exists (by name or slug)
    const { data: existingCategory } = await supabaseBlog
      .from("categories")
      .select("id")
      .or(`name.eq.${categoryName},slug.eq.${slug}`)
      .single();

    if (existingCategory) {
      return NextResponse.json(
        { error: "Category already exists" },
        { status: 409 },
      );
    }

    // Create category
    const { data: category, error } = await supabaseBlog
      .from("categories")
      .insert([
        {
          name: categoryName,
          slug,
          description: description?.trim() || null,
          post_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Invalidate cache
    invalidateCategoriesCache();

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT - Update category
export async function PUT(request: NextRequest) {
  try {
    // Validate API key
    // if (!validateApiKey(request)) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 },
      );
    }

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
        { status: 404 },
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
          { status: 409 },
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

    // Invalidate cache
    invalidateCategoriesCache();

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE - Delete category
export async function DELETE(request: NextRequest) {
  try {
    // Validate API key
    // if (!validateApiKey(request)) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 },
      );
    }

    // Check if category exists
    const { data: existingCategory, error: fetchError } = await supabaseBlog
      .from("categories")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }

    // Delete category
    const { error } = await supabaseBlog
      .from("categories")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Invalidate cache
    invalidateCategoriesCache();

    return NextResponse.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH - Update category post count
export async function PATCH(request: NextRequest) {
  try {
    // Validate API key
    // if (!validateApiKey(request)) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { post_count } = body;

    // Check if category exists
    const { data: existingCategory, error: fetchError } = await supabaseBlog
      .from("categories")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }

    // Update post count
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (post_count !== undefined) {
      updateData.post_count = parseInt(post_count) || 0;
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

    // Invalidate cache
    invalidateCategoriesCache();

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error updating category post count:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}