import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseBlog = createClient(
  process.env.BLOG_SUPABASE_URL!,
  process.env.BLOG_SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const slug = searchParams.get("slug");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

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

      return NextResponse.json(formatPost(post));
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

      return NextResponse.json(formatPost(post));
    }

    // Get all posts with pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabaseBlog
      .from("blog_posts")
      .select("*, author_name, author_avatar, author_bio", { 
        count: "exact" 
      })
      .order("created_at", { ascending: false })
      .range(from, to);

    const { data: posts, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Format posts
    const formattedPosts = posts.map(formatPost);

    return NextResponse.json({
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

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
    const { 
      title, 
      content, 
      excerpt, 
      categories = [], 
      tags = [], 
      featuredImage,
      audioFile, 
      authorId,
      authorName,
      authorAvatar,
      authorBio,
      isPublished = false
    } = body;

    if (!title || !content || !authorId) {
      return NextResponse.json(
        { error: "Title, content, and authorId are required" },
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
      categories: Array.isArray(categories) ? categories : [],
      tags: Array.isArray(tags) ? tags : [],
      featured_image: featuredImage || null,
      audio_file: audioFile || null,
      is_published: isPublished || false,
      is_featured: false,
      author_id: authorId,
      author_name: authorName || "Unknown Author",
      author_avatar: authorAvatar || null,
      author_bio: authorBio || null,
      view_count: 0,
      likes_count: 0,
      comment_count: 0,
      published_at: isPublished ? new Date().toISOString() : null
    };

    const { data: post, error } = await supabaseBlog
      .from("blog_posts")
      .insert([postData])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

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

    // Handle all possible fields
    if (body.title !== undefined) {
      updateData.title = body.title;
      updateData.slug = body.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/--+/g, "-")
        .trim();
    }
    
    if (body.content !== undefined) updateData.content = body.content;
    if (body.excerpt !== undefined) updateData.excerpt = body.excerpt;
    
    if (body.categories !== undefined) {
      updateData.categories = Array.isArray(body.categories) ? body.categories : [];
    }
    
    if (body.tags !== undefined) {
      updateData.tags = Array.isArray(body.tags) ? body.tags : [];
    }
    
    if (body.featuredImage !== undefined) updateData.featured_image = body.featuredImage;
    if (body.audioFile !== undefined) updateData.audio_file = body.audioFile;
    
    if (body.authorName !== undefined) updateData.author_name = body.authorName;
    if (body.authorAvatar !== undefined) updateData.author_avatar = body.authorAvatar;
    if (body.authorBio !== undefined) updateData.author_bio = body.authorBio;
    
    if (body.isPublished !== undefined) {
      updateData.is_published = body.isPublished;
      if (body.isPublished && !body.published_at) {
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

    // Accept both camelCase and snake_case
    if (body.view_count !== undefined) updateData.view_count = body.view_count;
    if (body.viewCount !== undefined) updateData.view_count = body.viewCount;
    
    if (body.likes_count !== undefined) updateData.likes_count = body.likes_count;
    if (body.likesCount !== undefined) updateData.likes_count = body.likesCount;
    
    if (body.comment_count !== undefined) updateData.comment_count = body.comment_count;
    if (body.commentCount !== undefined) updateData.comment_count = body.commentCount;
    
    if (body.is_published !== undefined || body.isPublished !== undefined) {
      const isPublished = body.is_published !== undefined ? body.is_published : body.isPublished;
      updateData.is_published = isPublished;
      if (isPublished) {
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
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(formatPost(post));

  } catch (error) {
    console.error('Error:', error);
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

// Helper function to format post data with all required fields
function formatPost(post: any) {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    featured_image: post.featured_image,
    audio_file: post.audio_file,
    categories: post.categories || [],
    tags: post.tags || [],
    is_published: post.is_published,
    is_featured: post.is_featured || false,
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