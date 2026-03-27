// app/api/debug/metadata/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const params = await context.params;
  const slug = params.slug;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://zidwell.com";
  
  try {
    // Fetch the actual page and get its headers
    const response = await fetch(`${baseUrl}/blog/${slug}`);
    const html = await response.text();
    
    // Extract meta tags
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    const ogTitleMatch = html.match(/<meta property="og:title" content="(.*?)"/);
    const ogImageMatch = html.match(/<meta property="og:image" content="(.*?)"/);
    const ogUrlMatch = html.match(/<meta property="og:url" content="(.*?)"/);
    const twitterImageMatch = html.match(/<meta name="twitter:image" content="(.*?)"/);
    
    // Fetch the OG image URL directly to check if it's accessible
    let imageStatus = 'not_found';
    let imageContentType = null;
    
    if (ogImageMatch && ogImageMatch[1]) {
      try {
        const imageResponse = await fetch(ogImageMatch[1]);
        imageStatus = imageResponse.status.toString();
        imageContentType = imageResponse.headers.get('content-type');
      } catch (err) {
        imageStatus = 'error';
      }
    }
    
    return NextResponse.json({
      url: `${baseUrl}/blog/${slug}`,
      title: titleMatch ? titleMatch[1] : null,
      og_title: ogTitleMatch ? ogTitleMatch[1] : null,
      og_image: ogImageMatch ? ogImageMatch[1] : null,
      og_url: ogUrlMatch ? ogUrlMatch[1] : null,
      twitter_image: twitterImageMatch ? twitterImageMatch[1] : null,
      image_status: imageStatus,
      image_content_type: imageContentType,
      html_preview: html.substring(0, 500) // First 500 chars for debugging
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}