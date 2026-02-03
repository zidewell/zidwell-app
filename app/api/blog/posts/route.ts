// app/api/blog/posts/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseBlog = createClient(
  process.env.BLOG_SUPABASE_URL!,
  process.env.BLOG_SUPABASE_SERVICE_ROLE_KEY!
);

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 60 * 1000; // 1 minute

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const slug = searchParams.get("slug");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skipCache = searchParams.get("cache") === "false";

    // Generate cache key
    const cacheKey = `posts:${id || slug || 'all'}:${page}:${limit}`;

    // Return cached data if available and not skipped
    if (!skipCache) {
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('Cache HIT for:', cacheKey);
        return NextResponse.json({
          ...cached.data,
          cached: true
        });
      }
    }

    console.log('Cache MISS for:', cacheKey);

    // Single post by ID
    if (id) {
      const { data: post, error } = await supabaseBlog
        .from("blog_posts")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }

      const response = formatPost(post);
      cache.set(cacheKey, { data: response, timestamp: Date.now() });
      return NextResponse.json(response);
    }

    // Single post by slug
    if (slug) {
      const { data: post, error } = await supabaseBlog
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();

      if (error) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }

      const response = formatPost(post);
      cache.set(cacheKey, { data: response, timestamp: Date.now() });
      return NextResponse.json(response);
    }

    // Get all posts
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: posts, error, count } = await supabaseBlog
      .from("blog_posts")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const response = {
      posts: posts.map(formatPost),
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };

    cache.set(cacheKey, { data: response, timestamp: Date.now() });
    return NextResponse.json(response);

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, excerpt, categories = [], tags = [], featured_image, author_id } = body;

    if (!title || !content || !author_id) {
      return NextResponse.json(
        { error: "Title, content, and author_id are required" },
        { status: 400 }
      );
    }

    // Generate slug
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/--+/g, "-")
      .trim();

    const postData = {
      title,
      slug,
      content,
      excerpt: excerpt || null,
      categories,
      tags,
      featured_image: featured_image || null,
      is_published: false,
      author_id,
      author_name: "Author",
      view_count: 0,
      likes_count: 0,
      comment_count: 0
    };

    const { data: post, error } = await supabaseBlog
      .from("blog_posts")
      .insert([postData])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Clear cache after creating new post
    cache.clear();
    console.log('Cache cleared after POST');

    return NextResponse.json(formatPost(post), { status: 201 });

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (body.title) {
      updateData.title = body.title;
      updateData.slug = body.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/--+/g, "-")
        .trim();
    }
    
    if (body.content) updateData.content = body.content;
    if (body.excerpt !== undefined) updateData.excerpt = body.excerpt;
    if (body.categories) updateData.categories = body.categories;
    if (body.tags) updateData.tags = body.tags;
    if (body.featured_image !== undefined) updateData.featured_image = body.featured_image;
    if (body.is_published !== undefined) {
      updateData.is_published = body.is_published;
      if (body.is_published) {
        updateData.published_at = new Date().toISOString();
      }
    }

    const { data: post, error } = await supabaseBlog
      .from("blog_posts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Clear cache after update
    cache.clear();
    console.log('Cache cleared after PUT');

    return NextResponse.json(formatPost(post));

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Update only specific fields
    if (body.view_count !== undefined) updateData.view_count = body.view_count;
    if (body.likes_count !== undefined) updateData.likes_count = body.likes_count;
    if (body.comment_count !== undefined) updateData.comment_count = body.comment_count;
    if (body.is_published !== undefined) {
      updateData.is_published = body.is_published;
      if (body.is_published) {
        updateData.published_at = new Date().toISOString();
      }
    }

    const { data: post, error } = await supabaseBlog
      .from("blog_posts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Clear cache after patch
    cache.clear();
    console.log('Cache cleared after PATCH');

    return NextResponse.json(formatPost(post));

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabaseBlog
      .from("blog_posts")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Clear cache after delete
    cache.clear();
    console.log('Cache cleared after DELETE');

    return NextResponse.json({ 
      success: true, 
      message: "Post deleted successfully" 
    });

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to format post data
function formatPost(post: any) {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    featured_image: post.featured_image,
    categories: post.categories || [],
    tags: post.tags || [],
    is_published: post.is_published,
    author_id: post.author_id,
    author: {
      id: post.author_id,
      name: post.author_name || "Unknown Author",
      avatar: post.author_avatar,
      bio: post.author_bio
    },
    published_at: post.published_at,
    created_at: post.created_at,
    updated_at: post.updated_at,
    view_count: post.view_count || 0,
    likes_count: post.likes_count || 0,
    comments_count: post.comment_count || 0
  };
}