// app/api/categories/slug/[slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseBlog } from "@/app/supabase/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const { slug } = params;
    const { searchParams } = new URL(request.url);
    const includePosts = searchParams.get("include_posts") === "true";

    // Try to get category from categories table first
    const { data: category, error: categoryError } = await supabaseBlog
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .single();

    if (categoryError) {
      // If not found in categories table, check posts
      const categoryName = slug.replace(/-/g, " ");

      const { data: posts, error: postsError } = await supabaseBlog
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

      if (postsError || !posts || posts.length === 0) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 404 },
        );
      }

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

    // Include posts if requested
    if (includePosts && category) {
      const { data: posts } = await supabaseBlog
        .from("blog_posts")
        .select(
          `
          *,
          author:profiles(*)
        `,
        )
        .contains("categories", [category.name])
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      category.posts = posts || [];
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error fetching category by slug:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
