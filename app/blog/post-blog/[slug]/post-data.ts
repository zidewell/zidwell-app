



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
     process.env.BLOG_SUPABASE_URL!,
     process.env.BLOG_SUPABASE_SERVICE_ROLE_KEY!,
     {
       auth: {
         autoRefreshToken: false,
         persistSession: false
       }
     }
   );
 
    // Use maybeSingle to avoid 406 errors when no record is found
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      console.error('Supabase error fetching post:', error);
      return null;
    }

    if (!post) {
      console.log('No post found with slug:', slug);
      return null;
    }

    // Log success
    console.log('Post fetched successfully:', post.title);
    console.log('Featured image:', post.featured_image);
    
    return post as BlogPost;
    
  } catch (error) {
    console.error('Error in getPostBySlug:', error);
    return null;
  }
});