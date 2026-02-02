import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
 const supabaseBlog = createClient(
  process.env.BLOG_SUPABASE_URL!,
  process.env.BLOG_SUPABASE_SERVICE_ROLE_KEY!,
 
);
// Simple in-memory cache for server-side
const postsCache = new Map();
const STATS_CACHE_KEY = "blog_stats";
const POSTS_CACHE_KEY = "blog_posts";
const CACHE_TTL = 300000; // 5 minutes in milliseconds

// Validate API key from request headers
function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get("x-api-key");
  return apiKey === process.env.ADMIN_API_KEY;
}

// Helper function to generate slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .trim();
}

// Helper function to check if slug exists
async function checkSlugExists(
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  let query = supabaseBlog.from("blog_posts").select("id").eq("slug", slug);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data } = await query.single();
  return !!data;
}

// Helper function to invalidate cache
function invalidatePostsCache() {
  // Clear all posts cache
  for (const key of postsCache.keys()) {
    if (key.startsWith(POSTS_CACHE_KEY)) {
      postsCache.delete(key);
    }
  }

  // Clear stats cache
  postsCache.delete(STATS_CACHE_KEY);
}

// Transform post data to match expected interface
function transformPost(post: any) {
  return {
    ...post,
    // Create author object from the fields in blog_posts table
    author: {
      id: post.author_id,
      name: post.author_name || "Unknown Author",
      avatar: null,
      bio: null,
    },
    // Map field names to match expected interface
    featured_image: post.featured_image,
    audio_file: post.audio_file,
    is_published: post.is_published,
    published_at: post.published_at,
    created_at: post.created_at,
    updated_at: post.updated_at,
    view_count: post.view_count || 0,
    likes_count: 0, // Default value if not in table
    comments_count: post.comment_count || 0, // Map comment_count to comments_count
  };
}

// GET - Get all posts or single post by ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    // If ID is provided, get single post
    if (id) {
      return await getPostById(id);
    }

    // Check cache for posts
    const cacheKey = `${POSTS_CACHE_KEY}_${searchParams.toString()}`;
    const skipCache = searchParams.get("skipCache") === "true";

    if (!skipCache && postsCache.has(cacheKey)) {
      const cachedData = postsCache.get(cacheKey);
      const now = Date.now();

      // Return cached data if not expired
      if (now - cachedData.timestamp < CACHE_TTL) {
        return NextResponse.json(cachedData.data);
      }
    }

    // Otherwise, fetch from database
    const response = await getAllPosts(request);
    const data = await response.json();

    // Cache the result
    if (!skipCache) {
      postsCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });

      // Limit cache size
      if (postsCache.size > 100) {
        const firstKey = postsCache.keys().next().value;
        postsCache.delete(firstKey);
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in GET request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Get single post by ID
async function getPostById(id: string) {
  const { data: post, error } = await supabaseBlog
    .from("blog_posts")
    .select("*") // Changed from author:profiles(*) to just *
    .eq("id", id)
    .single();

  if (error) {
    console.error("Supabase error:", error);
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const transformedPost = transformPost(post);
  return NextResponse.json(transformedPost);
}

// Get all posts with filtering and pagination
async function getAllPosts(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const isPublished = searchParams.get("published");
  const category = searchParams.get("category");
  const tag = searchParams.get("tag");
  const authorId = searchParams.get("author_id");
  const search = searchParams.get("search");
  const sortBy = searchParams.get("sort_by") || "created_at";
  const sortOrder = searchParams.get("sort_order") || "desc";

  let query = supabaseBlog.from("blog_posts").select(
    "*", // Changed from author:profiles(*) to just *
    { count: "exact" },
  );

  // Apply sorting
  query = query.order(sortBy, { ascending: sortOrder === "asc" });

  // Apply filters
  if (isPublished !== null) {
    query = query.eq("is_published", isPublished === "true");
  }

  if (category) {
    query = query.contains("categories", [category]);
  }

  if (tag) {
    query = query.contains("tags", [tag]);
  }

  if (authorId) {
    query = query.eq("author_id", authorId);
  }

  if (search) {
    query = query.or(
      `title.ilike.%${search}%,content.ilike.%${search}%,excerpt.ilike.%${search}%`,
    );
  }

  // Pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data: posts, error, count } = await query.range(from, to);

  if (error) {
    console.error("Supabase error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Transform posts to match expected interface
  const transformedPosts = (posts || []).map((post) => transformPost(post));

  return NextResponse.json({
    posts: transformedPosts || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  });
}

// POST - Create new post
export async function POST(request: NextRequest) {
  try {
    // Validate API key
    // if (!validateApiKey(request)) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const body = await request.json();
    const {
      title,
      content,
      excerpt,
      categories = [],
      featuredImage,
      audioFile,
      isPublished = false,
      tags = [],
      authorId,
      authorName = "Author",
      slug: customSlug,
    } = body;

    // Validate required fields
    if (!title || !content || !authorId) {
      return NextResponse.json(
        { error: "Title, content, and authorId are required" },
        { status: 400 },
      );
    }

    // Generate or use custom slug
    const slug = customSlug || generateSlug(title);

    // Check if slug already exists
    if (await checkSlugExists(slug)) {
      return NextResponse.json(
        { error: "Slug already exists. Please use a different title." },
        { status: 409 },
      );
    }

    // Insert post
    const { data: post, error } = await supabaseBlog
      .from("blog_posts")
      .insert([
        {
          title,
          slug,
          content,
          excerpt: excerpt || null,
          categories,
          featured_image: featuredImage || null,
          audio_file: audioFile || null,
          is_published: isPublished,
          tags,
          author_id: authorId,
          author_name: authorName, // Add author_name from request
          published_at: isPublished ? new Date().toISOString() : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select("*") // Changed from author:profiles(*) to just *
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Invalidate cache
    invalidatePostsCache();

    const transformedPost = transformPost(post);
    return NextResponse.json(transformedPost, { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT - Update post
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
        { error: "Post ID is required" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const {
      title,
      content,
      excerpt,
      categories,
      featuredImage,
      audioFile,
      isPublished,
      tags,
      authorName, // Optional author name update
      slug: customSlug,
    } = body;

    // Check if post exists
    const { data: existingPost, error: fetchError } = await supabaseBlog
      .from("blog_posts")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Generate new slug if title changed
    let slug = existingPost.slug;
    if (title && title !== existingPost.title) {
      slug = customSlug || generateSlug(title);

      // Check if new slug already exists (excluding current post)
      if (await checkSlugExists(slug, id)) {
        return NextResponse.json(
          { error: "Slug already exists. Please use a different title." },
          { status: 409 },
        );
      }
    }

    // Build update data
    const updateData: any = {
      ...(title && { title }),
      ...(content && { content }),
      ...(excerpt !== undefined && { excerpt }),
      ...(categories && { categories }),
      ...(featuredImage !== undefined && { featured_image: featuredImage }),
      ...(audioFile !== undefined && { audio_file: audioFile }),
      ...(tags && { tags }),
      ...(authorName !== undefined && { author_name: authorName }),
      slug,
      updated_at: new Date().toISOString(),
    };

    // Handle publish status
    if (isPublished !== undefined) {
      updateData.is_published = isPublished;
      if (isPublished && !existingPost.published_at) {
        updateData.published_at = new Date().toISOString();
      } else if (!isPublished) {
        updateData.published_at = null;
      }
    }

    // Update post
    const { data: post, error } = await supabaseBlog
      .from("blog_posts")
      .update(updateData)
      .eq("id", id)
      .select("*") // Changed from author:profiles(*) to just *
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Invalidate cache
    invalidatePostsCache();

    const transformedPost = transformPost(post);
    return NextResponse.json(transformedPost);
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE - Delete post
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
        { error: "Post ID is required" },
        { status: 400 },
      );
    }

    // Check if post exists
    const { data: existingPost, error: fetchError } = await supabaseBlog
      .from("blog_posts")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Delete post
    const { error } = await supabaseBlog
      .from("blog_posts")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Invalidate cache
    invalidatePostsCache();

    return NextResponse.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH - Partial update (e.g., publish/unpublish)
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
        { error: "Post ID is required" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { isPublished, featuredImage, categories, tags, authorName } = body;

    // Check if post exists
    const { data: existingPost, error: fetchError } = await supabaseBlog
      .from("blog_posts")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Build update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Handle specific fields
    if (isPublished !== undefined) {
      updateData.is_published = isPublished;
      if (isPublished && !existingPost.published_at) {
        updateData.published_at = new Date().toISOString();
      } else if (!isPublished) {
        updateData.published_at = null;
      }
    }

    if (featuredImage !== undefined) {
      updateData.featured_image = featuredImage;
    }

    if (categories) {
      updateData.categories = categories;
    }

    if (tags) {
      updateData.tags = tags;
    }

    if (authorName !== undefined) {
      updateData.author_name = authorName;
    }

    // Update post
    const { data: post, error } = await supabaseBlog
      .from("blog_posts")
      .update(updateData)
      .eq("id", id)
      .select("*") // Changed from author:profiles(*) to just *
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Invalidate cache
    invalidatePostsCache();

    const transformedPost = transformPost(post);
    return NextResponse.json(transformedPost);
  } catch (error) {
    console.error("Error patching post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
