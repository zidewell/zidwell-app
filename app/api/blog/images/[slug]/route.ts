// app/api/blog/image/[slug]/route.ts - SIMPLIFIED VERSION
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const params = await context.params;
    const slug = params.slug;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://zidwell.com";
    
    console.log('Image request for slug:', slug);
    
    // Fetch the post data
    const res = await fetch(`${baseUrl}/api/blog/posts/slug/${slug}`, {
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!res.ok) {
      console.log('Post not found, redirecting to default');
      return NextResponse.redirect(`${baseUrl}/images/og-image.png`);
    }
    
    const post = await res.json();
    
    // If there's a featured image URL, redirect to it directly
    if (post.featured_image) {
      console.log('Redirecting to featured image:', post.featured_image);
      // Return a 302 redirect to the actual image
      return NextResponse.redirect(post.featured_image, 302);
    }
    
    // No image found, redirect to default
    console.log('No featured image, redirecting to default');
    return NextResponse.redirect(`${baseUrl}/images/og-image.png`);
    
  } catch (error) {
    console.error('Error in image proxy:', error);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://zidwell.com";
    return NextResponse.redirect(`${baseUrl}/images/og-image.png`);
  }
}