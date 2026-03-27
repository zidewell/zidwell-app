// app/api/og-image/[slug]/route.ts - SIMPLIFIED VERSION
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const params = await context.params;
    const slug = params.slug;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://zidwell.com";
    
    console.log('OG Image request for slug:', slug);
    
    // Just redirect to the image proxy
    return NextResponse.redirect(`${baseUrl}/api/blog/image/${slug}`);
    
  } catch (error) {
    console.error('Error in OG image route:', error);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://zidwell.com";
    return NextResponse.redirect(`${baseUrl}/images/og-image.png`);
  }
}