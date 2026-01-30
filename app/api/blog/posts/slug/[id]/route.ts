// app/api/blog/posts/slug/[slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseBlog } from "@/app/supabase/supabase";

export async function GET(
  request: NextRequest,
 context: { params: Promise<{ id: string }> }

) {
  try {
    const params = await context.params;
    const slug = params.id;

    if (!slug || slug === "undefined") {
      console.error("Invalid slug:", slug);
      return NextResponse.json({ 
        error: "Invalid slug parameter",
        message: "Slug parameter is missing or undefined"
      }, { status: 400 });
    }

    const decodedSlug = decodeURIComponent(slug);
    console.log("Decoded slug:", decodedSlug);

    // Fetch the post
    const { data: posts, error } = await supabaseBlog
      .from("blog_posts")
      .select("*")
      .eq("slug", decodedSlug)
      .eq("is_published", true)
      .single(); // Use single() instead of checking array length

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ 
        error: "Database error",
        details: error.message 
      }, { status: 500 });
    }

    // If no post found (single() will throw, but just in case)
    if (!posts) {
      return NextResponse.json({ 
        error: "Post not found",
        message: "No published post found with this slug"
      }, { status: 404 });
    }

    const post = posts;

    // Transform the response
    const transformedPost = {
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      featured_image: post.featured_image,
      categories: post.categories || [],
      tags: post.tags || [],
      is_published: post.is_published,
      author_id: post.author_id,
      author: {
        id: post.author_id,
        name: post.author_name || "Unknown Author",
        avatar: post.author_avatar || null,
        bio: post.author_bio || null,
      },
      published_at: post.published_at,
      created_at: post.created_at,
      updated_at: post.updated_at,
      view_count: post.view_count || 0,
      likes_count: post.likes_count || 0,
      comments_count: post.comment_count || 0,
      audio_file: post.audio_file,
    };

    return NextResponse.json(transformedPost);

  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 },
    );
  }
}