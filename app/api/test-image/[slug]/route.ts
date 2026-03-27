// app/api/test-image/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const params = await context.params;
  const slug = params.slug;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://zidwell.com";
  
  try {
    // First, get the post data
    const postRes = await fetch(`${baseUrl}/api/blog/posts/slug/${slug}`);
    if (!postRes.ok) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    
    const post = await postRes.json();
    
    // Return debug info about the image
    return NextResponse.json({
      slug,
      has_featured_image: !!post.featured_image,
      featured_image_url: post.featured_image,
      is_absolute_url: post.featured_image?.startsWith('http'),
      is_base64: post.featured_image?.startsWith('data:image'),
      suggested_og_url: `${baseUrl}/api/og-image/${slug}`,
      suggested_image_proxy: `${baseUrl}/api/blog/image/${slug}`,
      // Test both endpoints
      endpoints: {
        og_image: `${baseUrl}/api/og-image/${slug}`,
        image_proxy: `${baseUrl}/api/blog/image/${slug}`,
        direct_image: post.featured_image
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 });
  }
}