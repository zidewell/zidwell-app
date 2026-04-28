import { cache } from "react";
import { createClient } from "@supabase/supabase-js";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featured_image: string | null;
  categories: string[];
  tags: string[];
  is_published: boolean;
  author_id: string;
  author_name: string | null;
  author_avatar: string | null;
  author_bio: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  view_count: number;
  likes_count: number;
  comments_count: number;
  audio_file?: string | null;
}

// Single Supabase client instance
function getSupabaseClient() {
  return createClient(
    process.env.BLOG_SUPABASE_URL!,
    process.env.BLOG_SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

// Cache the post fetching
export const getPostBySlug = cache(async (slug: string): Promise<BlogPost | null> => {
  try {
    const supabase = getSupabaseClient();
    
    const { data: post, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      console.error("Supabase error:", error);
      return null;
    }

    if (!post) {
      return null;
    }

    return post as BlogPost;
  } catch (error) {
    console.error("Error in getPostBySlug:", error);
    return null;
  }
});

// For listing posts
export const getPublishedPosts = cache(async (limit = 10, offset = 0) => {
  try {
    const supabase = getSupabaseClient();
    
    const { data: posts, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching posts:", error);
      return [];
    }

    return posts as BlogPost[];
  } catch (error) {
    console.error("Error in getPublishedPosts:", error);
    return [];
  }
});