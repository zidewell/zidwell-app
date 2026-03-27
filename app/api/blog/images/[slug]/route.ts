// app/api/blog/image/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const params = await context.params;
    const slug = params.slug;
    
    console.log('Fetching image for slug:', slug);

    const baseUrl = process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : process.env.NEXT_PUBLIC_BASE_URL || "https://zidwell.com";
    
    // Fetch the post data
    const res = await fetch(`${baseUrl}/api/blog/posts/slug/${slug}`, {
      next: { revalidate: 60 }
    });
    
    if (!res.ok) {
      console.error('Post not found:', slug);
      // Return a default image as a redirect instead of serving it directly
      return NextResponse.redirect(`${baseUrl}/images/og-image.png`);
    }
    
    const post = await res.json();
    
    // If no featured image, redirect to default
    if (!post.featured_image) {
      console.log('No featured image for post:', slug);
      return NextResponse.redirect(`${baseUrl}/images/og-image.png`);
    }
    
    // For external URLs, redirect to them
    if (post.featured_image.startsWith('http')) {
      console.log('Redirecting to external image:', post.featured_image);
      return NextResponse.redirect(post.featured_image);
    }
    
    // For Supabase storage URLs
    if (post.featured_image.includes('supabase.co')) {
      console.log('Fetching from Supabase storage');
      
      try {
        // Extract the path from the Supabase URL
        const url = new URL(post.featured_image);
        // Get the path after /storage/v1/object/public/
        const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/(.+)/);
        
        if (!pathMatch) {
          console.error('Could not extract path from URL:', post.featured_image);
          return NextResponse.redirect(`${baseUrl}/images/og-image.png`);
        }
        
        const fullPath = pathMatch[1];
        console.log('Full storage path:', fullPath);
        
        // Download the image
        const { data, error } = await supabase.storage
          .from('blog-images')
          .download(fullPath);
        
        if (error || !data) {
          console.error('Storage download error:', error);
          return NextResponse.redirect(`${baseUrl}/images/og-image.png`);
        }
        
        // Convert to buffer
        const buffer = Buffer.from(await data.arrayBuffer());
        
        // Get content type
        const contentType = data.type || 'image/jpeg';
        
        // Return the image with proper headers
        return new NextResponse(buffer, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Access-Control-Allow-Origin': '*',
          },
        });
        
      } catch (error) {
        console.error('Error fetching from Supabase:', error);
        return NextResponse.redirect(`${baseUrl}/images/og-image.png`);
      }
    }
    
    // For any other case, redirect to default
    console.log('Falling back to default image');
    return NextResponse.redirect(`${baseUrl}/images/og-image.png`);
    
  } catch (error) {
    console.error('Error in image proxy:', error);
    const baseUrl = process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://zidwell.com";
    return NextResponse.redirect(`${baseUrl}/images/og-image.png`);
  }
}