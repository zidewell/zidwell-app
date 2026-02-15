import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
 context: { params: Promise<{ id: string }> }

) {
  try {
    const params = await context.params;
    const id = params.id;

    const baseUrl = process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://zidwell.com";
    
    const res = await fetch(`${baseUrl}/api/blog/posts/slug/${id}`);
    
    if (!res.ok) {
      return new NextResponse('Post not found', { status: 404 });
    }
    
    const post = await res.json();
    
    if (!post.featured_image || !post.featured_image.startsWith('data:image/')) {
      return new NextResponse('No image found', { status: 404 });
    }
    
    // Extract the Base64 data and convert to buffer
    const base64Data = post.featured_image.split(',')[1];
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Determine content type from the Base64 header
    const contentType = post.featured_image.split(';')[0].split(':')[1];
    
    // Return the image
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return new NextResponse('Error serving image', { status: 500 });
  }
}