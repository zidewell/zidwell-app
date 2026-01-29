// app/api/posts/slug/[slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseBlog } from "@/app/supabase/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const { slug } = params;

    const { data: post, error } = await supabaseBlog
      .from("blog_posts")
      .select(
        `
        *,
        author:profiles(*)
      `,
      )
      .eq("slug", slug)
      .eq("is_published", true)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("Error fetching post by slug:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
