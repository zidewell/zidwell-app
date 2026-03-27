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

// Cache the post fetching function to avoid duplicate requests
export const getPostBySlug = cache(async (slug: string): Promise<BlogPost | null> => {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !post) {
      console.error('Error fetching post:', error);
      return null;
    }

    // Only return if published
    if (!post.is_published) {
      return null;
    }

    return post as BlogPost;
  } catch (error) {
    console.error('Error in getPostBySlug:', error);
    return null;
  }
});