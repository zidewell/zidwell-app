// app/api/og-image/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const params = await context.params;
    const slug = params.slug;
    
    const baseUrl = process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : process.env.NEXT_PUBLIC_BASE_URL || "https://zidwell.com";
    
    // First, try to get the featured image
    const postRes = await fetch(`${baseUrl}/api/blog/posts/slug/${slug}`, {
      next: { revalidate: 60 }
    });
    
    if (postRes.ok) {
      const post = await postRes.json();
      
      // If there's a featured image, redirect to it
      if (post.featured_image) {
        console.log('OG Image - Redirecting to:', post.featured_image);
        
        // If it's already a full URL, redirect there
        if (post.featured_image.startsWith('http')) {
          return NextResponse.redirect(post.featured_image);
        }
        
        // Otherwise, use the image proxy
        return NextResponse.redirect(`${baseUrl}/api/blog/images/${slug}`);
      }
    }
    
    // Fallback to default OG image
    console.log('OG Image - Using default image');
    return NextResponse.redirect(`${baseUrl}/images/og-image.png`);
    
  } catch (error) {
    console.error('Error in OG image route:', error);
    const baseUrl = process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://zidwell.com";
    return NextResponse.redirect(`${baseUrl}/images/og-image.png`);
  }
}