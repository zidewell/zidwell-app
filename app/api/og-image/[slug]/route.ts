// app/api/og-image/[slug]/route.ts
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

    const baseUrl = process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://zidwell.com";
    
    // Fetch the post data
    const res = await fetch(`${baseUrl}/api/blog/posts/slug/${slug}`);
    
    if (!res.ok) {
      // Return default OG image if post not found
      const defaultImage = await fetch(`${baseUrl}/images/og-image.png`);
      const defaultBuffer = await defaultImage.arrayBuffer();
      return new NextResponse(Buffer.from(defaultBuffer), {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }
    
    const post = await res.json();
    
    // If there's a featured image and it's a full URL, redirect to it
    if (post.featured_image && post.featured_image.startsWith('http')) {
      return NextResponse.redirect(post.featured_image, 302);
    }
    
    // If it's a Supabase URL or other, use the image proxy
    if (post.featured_image) {
      return NextResponse.redirect(`${baseUrl}/api/blog/image/${slug}`, 302);
    }
    
    // Fallback to default OG image
    const defaultImage = await fetch(`${baseUrl}/images/og-image.png`);
    const defaultBuffer = await defaultImage.arrayBuffer();
    return new NextResponse(Buffer.from(defaultBuffer), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    });
    
  } catch (error) {
    console.error('Error in OG image route:', error);
    // Return default image on error
    const baseUrl = process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://zidwell.com";
    const defaultImage = await fetch(`${baseUrl}/images/og-image.png`);
    const defaultBuffer = await defaultImage.arrayBuffer();
    return new NextResponse(Buffer.from(defaultBuffer), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }
}