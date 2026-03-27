// app/api/blog/image/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for authentication
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Make sure this is set in your .env
);

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
    
    // Fetch the post data
    const res = await fetch(`${baseUrl}/api/blog/posts/slug/${id}`);
    
    if (!res.ok) {
      console.log('Post not found for ID:', id);
      return new NextResponse('Post not found', { status: 404 });
    }
    
    const post = await res.json();
    
    // Check if there's a featured image
    if (!post.featured_image) {
      console.log('No featured image for post:', id);
      // Return default image
      const defaultImage = await fetch(`${baseUrl}/images/og-image.png`);
      const defaultBuffer = await defaultImage.arrayBuffer();
      return new NextResponse(Buffer.from(defaultBuffer), {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }
    
    // CASE 1: Handle Base64 images
    if (post.featured_image.startsWith('data:image/')) {
      console.log('Processing Base64 image for post:', id);
      
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
    }
    
    // CASE 2: Handle Supabase storage URLs
    if (post.featured_image.includes('supabase.co')) {
      console.log('Processing Supabase image for post:', id);
      console.log('Image URL:', post.featured_image);
      
      try {
        // Extract the path from the Supabase URL
        const url = new URL(post.featured_image);
        // Path format: /storage/v1/object/public/blog-images/featured-images/filename.jpg
        const path = url.pathname.replace('/storage/v1/object/public/', '');
        
        console.log('Extracted path:', path);
        
        // Download the image using Supabase storage with service role
        const { data, error } = await supabase.storage
          .from('blog-images')
          .download(path);
        
        if (error) {
          console.error('Supabase download error:', error);
          throw error;
        }
        
        // Convert to buffer
        const buffer = Buffer.from(await data.arrayBuffer());
        
        // Get content type from the blob
        const contentType = data.type || 'image/jpeg';
        
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
            'Access-Control-Allow-Origin': '*',
          },
        });
        
      } catch (storageError) {
        console.error('Error fetching from Supabase storage:', storageError);
        
        // Fallback: Try to fetch the URL directly (might work if bucket is public)
        try {
          const directFetch = await fetch(post.featured_image);
          if (directFetch.ok) {
            const buffer = await directFetch.arrayBuffer();
            return new NextResponse(Buffer.from(buffer), {
              headers: {
                'Content-Type': directFetch.headers.get('content-type') || 'image/jpeg',
                'Cache-Control': 'public, max-age=86400',
                'Access-Control-Allow-Origin': '*',
              },
            });
          }
        } catch (fetchError) {
          console.error('Direct fetch also failed:', fetchError);
        }
        
        // If all else fails, return default image
        const defaultImage = await fetch(`${baseUrl}/images/og-image.png`);
        const defaultBuffer = await defaultImage.arrayBuffer();
        return new NextResponse(Buffer.from(defaultBuffer), {
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    }
    
    // CASE 3: Handle regular HTTP URLs (CDN, external, etc.)
    if (post.featured_image.startsWith('http')) {
      console.log('Processing external image for post:', id);
      
      try {
        const imageResponse = await fetch(post.featured_image);
        if (imageResponse.ok) {
          const buffer = await imageResponse.arrayBuffer();
          return new NextResponse(Buffer.from(buffer), {
            headers: {
              'Content-Type': imageResponse.headers.get('content-type') || 'image/jpeg',
              'Cache-Control': 'public, max-age=86400',
              'Access-Control-Allow-Origin': '*',
            },
          });
        }
      } catch (error) {
        console.error('Error fetching external image:', error);
      }
    }
    
    // CASE 4: Handle relative paths
    if (post.featured_image.startsWith('/')) {
      console.log('Processing relative path image for post:', id);
      
      try {
        const fullUrl = `${baseUrl}${post.featured_image}`;
        const imageResponse = await fetch(fullUrl);
        if (imageResponse.ok) {
          const buffer = await imageResponse.arrayBuffer();
          return new NextResponse(Buffer.from(buffer), {
            headers: {
              'Content-Type': imageResponse.headers.get('content-type') || 'image/jpeg',
              'Cache-Control': 'public, max-age=86400',
              'Access-Control-Allow-Origin': '*',
            },
          });
        }
      } catch (error) {
        console.error('Error fetching relative path image:', error);
      }
    }
    
    // FALLBACK: Return default image if all else fails
    console.log('Using fallback default image for post:', id);
    const defaultImage = await fetch(`${baseUrl}/images/og-image.png`);
    const defaultBuffer = await defaultImage.arrayBuffer();
    return new NextResponse(Buffer.from(defaultBuffer), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
    
  } catch (error) {
    console.error('Error in image proxy:', error);
    // Return a default image even on error
    try {
      const baseUrl = process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : "https://zidwell.com";
      const defaultImage = await fetch(`${baseUrl}/images/og-image.png`);
      const defaultBuffer = await defaultImage.arrayBuffer();
      return new NextResponse(Buffer.from(defaultBuffer), {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch {
      // If even default fails, return a simple 1x1 pixel PNG
      const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
      return new NextResponse(pixel, {
        headers: {
          'Content-Type': 'image/png',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  }
}