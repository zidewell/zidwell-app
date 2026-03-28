// app/api/og-image/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Simple function to generate a basic OG image using HTML/CSS
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const params = await context.params;
    const slug = params.slug;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://zidwell.com";
    
    // Fetch post data
    const supabase = createClient(
      process.env.BLOG_SUPABASE_URL!,
      process.env.BLOG_SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('title, featured_image, excerpt')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (error || !post) {
      // Return default OG image
      return NextResponse.redirect(`${baseUrl}/images/og-image-default.png`);
    }

    // If there's a featured image, redirect directly to it (no chain)
    if (post.featured_image && post.featured_image.startsWith('http')) {
      return NextResponse.redirect(post.featured_image, 302);
    }

    // Otherwise, generate a simple text-based OG image
    // You can use a service like @vercel/og or return a default
    return NextResponse.redirect(`${baseUrl}/images/og-image-default.png`);
    
  } catch (error) {
    console.error('OG Image error:', error);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://zidwell.com";
    return NextResponse.redirect(`${baseUrl}/images/og-image-default.png`);
  }
}