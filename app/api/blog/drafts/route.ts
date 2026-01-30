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

// Transform post data to match expected interface
function transformPost(post: any) {
  return {
    ...post,
    author: {
      id: post.author_id,
      name: post.author_name || "Unknown Author",
      avatar: null,
      bio: null,
    },
    featured_image: post.featured_image,
    audio_file: post.audio_file,
    is_published: post.is_published,
    published_at: post.published_at,
    created_at: post.created_at,
    updated_at: post.updated_at,
    view_count: post.view_count || 0,
    likes_count: 0,
    comments_count: post.comment_count || 0,
  };
}

// GET - Get draft posts
export async function GET(request: NextRequest) {
  try {
    // Validate API key for draft access
    // if (!validateApiKey(request)) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sort_by") || "updated_at";
    const sortOrder = searchParams.get("sort_order") || "desc";

    // Query for draft posts only
    let query = supabaseBlog
      .from("blog_posts")
      .select("*", { count: "exact" })
      .eq("is_published", false);

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    // Apply search filter
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

    // Transform posts
    const transformedPosts = (posts || []).map((post) => transformPost(post));

    return NextResponse.json({
      drafts: transformedPosts || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching drafts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST - Save a draft
export async function POST(request: NextRequest) {
  try {
    // Validate API key
    // if (!validateApiKey(request)) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const body = await request.json();
    const {
      title = "Untitled Draft",
      content = "",
      excerpt = "",
      categories = [],
      featuredImage = "",
      audioFile = "",
      tags = [],
      authorId,
      authorName = "Author",
      slug: customSlug,
    } = body;

    // Validate required fields
    if (!authorId) {
      return NextResponse.json(
        { error: "authorId is required" },
        { status: 400 },
      );
    }

    // Generate slug from title or use custom
    const slug = customSlug || generateSlug(title);

    // Check if slug already exists (only for published posts)
    const slugExists = await checkSlugExists(slug);
    let finalSlug = slug;

    // If slug exists, append timestamp to make it unique
    if (slugExists) {
      const timestamp = Date.now();
      finalSlug = `${slug}-${timestamp}`;
    }

    // Insert draft post
    const { data: post, error } = await supabaseBlog
      .from("blog_posts")
      .insert([
        {
          title,
          slug: finalSlug,
          content,
          excerpt: excerpt || null,
          categories,
          featured_image: featuredImage || null,
          audio_file: audioFile || null,
          is_published: false, // Always false for drafts
          tags,
          author_id: authorId,
          author_name: authorName,
          published_at: null, // No publish date for drafts
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select("*")
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const transformedPost = transformPost(post);
    return NextResponse.json(transformedPost, { status: 201 });
  } catch (error) {
    console.error("Error creating draft:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT - Update a draft
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
        { error: "Draft ID is required" },
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
      tags,
      authorName,
      slug: customSlug,
    } = body;

    // Check if draft exists
    const { data: existingDraft, error: fetchError } = await supabaseBlog
      .from("blog_posts")
      .select("*")
      .eq("id", id)
      .eq("is_published", false) // Ensure it's a draft
      .single();

    if (fetchError) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    // Generate new slug if title changed
    let slug = existingDraft.slug;
    if (title && title !== existingDraft.title) {
      slug = customSlug || generateSlug(title);

      // Check if new slug already exists (excluding current draft)
      const slugExists = await checkSlugExists(slug, id);
      if (slugExists) {
        const timestamp = Date.now();
        slug = `${slug}-${timestamp}`;
      }
    }

    // Build update data
    const updateData: any = {
      ...(title && { title }),
      ...(content !== undefined && { content }),
      ...(excerpt !== undefined && { excerpt }),
      ...(categories !== undefined && { categories }),
      ...(featuredImage !== undefined && { featured_image: featuredImage }),
      ...(audioFile !== undefined && { audio_file: audioFile }),
      ...(tags !== undefined && { tags }),
      ...(authorName !== undefined && { author_name: authorName }),
      slug,
      updated_at: new Date().toISOString(),
    };

    // Update draft
    const { data: post, error } = await supabaseBlog
      .from("blog_posts")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const transformedPost = transformPost(post);
    return NextResponse.json(transformedPost);
  } catch (error) {
    console.error("Error updating draft:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH - Publish a draft
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
        { error: "Draft ID is required" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const {
      isPublished = true, // Default to publish
      title, // Optional title update during publish
      excerpt,
      categories,
      featuredImage,
      tags,
      slug: customSlug,
    } = body;

    // Check if draft exists
    const { data: existingDraft, error: fetchError } = await supabaseBlog
      .from("blog_posts")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    // Generate new slug if title changed
    let slug = existingDraft.slug;
    if (title && title !== existingDraft.title) {
      slug = customSlug || generateSlug(title);

      // Check if new slug already exists (excluding current post)
      const slugExists = await checkSlugExists(slug, id);
      if (slugExists) {
        return NextResponse.json(
          { error: "Slug already exists. Please use a different title." },
          { status: 409 },
        );
      }
    }

    // Build update data for publishing
    const updateData: any = {
      is_published: isPublished,
      published_at: isPublished ? new Date().toISOString() : null,
      ...(title && { title }),
      ...(excerpt !== undefined && { excerpt }),
      ...(categories !== undefined && { categories }),
      ...(featuredImage !== undefined && { featured_image: featuredImage }),
      ...(tags !== undefined && { tags }),
      slug,
      updated_at: new Date().toISOString(),
    };

    // Update draft to published
    const { data: post, error } = await supabaseBlog
      .from("blog_posts")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const transformedPost = transformPost(post);
    return NextResponse.json(transformedPost);
  } catch (error) {
    console.error("Error publishing draft:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
