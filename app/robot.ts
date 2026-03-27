// app/api/debug/blog-posts/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Get all published posts with their featured images
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('id, slug, title, featured_image, is_published, updated_at')
      .eq('is_published', true)
      .limit(10);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Test each post's image URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://zidwell.com';
    const imageTests = await Promise.all(
      posts.map(async (post) => {
        let imageUrl = null;
        let imageStatus = null;
        
        if (post.featured_image) {
          // Try to fetch the image
          try {
            const imageRes = await fetch(`${baseUrl}/api/blog/images/${post.slug}`);
            imageStatus = imageRes.status;
            imageUrl = post.featured_image;
          } catch (err) {
            imageStatus = 'error';
          }
        }
        
        return {
          slug: post.slug,
          title: post.title,
          has_featured_image: !!post.featured_image,
          featured_image: post.featured_image,
          image_endpoint_status: imageStatus,
          post_url: `${baseUrl}/blog/post-blog/${post.slug}`,
          og_image_url: `${baseUrl}/api/og-image/${post.slug}`,
        };
      })
    );
    
    return NextResponse.json({
      total_posts: posts.length,
      posts: imageTests,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}