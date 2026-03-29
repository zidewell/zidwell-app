// app/api/og/[slug]/route.tsx
import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    // Fetch post data from Supabase
    const supabaseBlog = createClient(
      process.env.BLOG_SUPABASE_URL!,
      process.env.BLOG_SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: post, error } = await supabaseBlog
      .from('blog_posts')
      .select('title, featured_image, excerpt')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (error) {
      console.error('Error fetching post:', error);
    }

    // If there's a featured image, use it
    if (post?.featured_image && post.featured_image.startsWith('http')) {
      try {
        // Fetch the image to ensure it exists
        const imageResponse = await fetch(post.featured_image);
        if (imageResponse.ok) {
          const imageBuffer = await imageResponse.arrayBuffer();
          
          // Return the actual image
          return new Response(imageBuffer, {
            headers: {
              'Content-Type': imageResponse.headers.get('content-type') || 'image/jpeg',
              'Cache-Control': 'public, max-age=86400',
              'Content-Length': imageBuffer.byteLength.toString(),
            },
          });
        }
      } catch (error) {
        console.error('Error fetching featured image:', error);
      }
    }

    // Fallback: Generate text-based OG image
    const title = post?.title || "Zidwell Blog";
    const description = post?.excerpt || "Finance & Business Tools for Nigerian SMEs";
    
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#FFFFFF',
            position: 'relative',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          }}
        >
          {/* Background pattern */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: 'radial-gradient(circle at 25px 25px, #E6E6E6 2px, transparent 2px)',
              backgroundSize: '50px 50px',
              opacity: 0.3,
            }}
          />
          
          {/* Gradient overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(43,130,91,0.05) 0%, rgba(0,0,0,0) 100%)',
            }}
          />
          
          {/* Content container */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 80px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '30px',
              maxWidth: '90%',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              border: '1px solid #E6E6E6',
            }}
          >
            {/* Logo/Brand */}
            <div
              style={{
                fontSize: 48,
                fontWeight: 'bold',
                color: '#2b825b',
                marginBottom: 40,
                display: 'flex',
                alignItems: 'center',
                gap: 15,
              }}
            >
              <span style={{ fontSize: 56 }}>📝</span>
              <span style={{ fontFamily: 'system-ui' }}>Zidwell</span>
            </div>
            
            {/* Title */}
            <div
              style={{
                fontSize: 56,
                fontWeight: 'bold',
                color: '#242424',
                textAlign: 'center',
                maxWidth: '90%',
                marginBottom: 30,
                lineHeight: 1.2,
              }}
            >
              {title.length > 70 ? `${title.substring(0, 67)}...` : title}
            </div>
            
            {/* Description */}
            {description && (
              <div
                style={{
                  fontSize: 28,
                  color: '#6B6B6B',
                  textAlign: 'center',
                  maxWidth: '85%',
                  marginBottom: 40,
                  lineHeight: 1.3,
                }}
              >
                {description.length > 100 ? `${description.substring(0, 97)}...` : description}
              </div>
            )}
            
            {/* Footer */}
            <div
              style={{
                fontSize: 22,
                color: '#2b825b',
                borderTop: '2px solid #E6E6E6',
                paddingTop: 30,
                display: 'flex',
                gap: 30,
              }}
            >
              <span>💡 Business Tools</span>
              <span>📊 Financial Management</span>
              <span>🚀 Nigerian SMEs</span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          'Cache-Control': 'public, max-age=86400, s-maxage=86400',
          'Content-Type': 'image/png',
        },
      }
    );
  } catch (error) {
    console.error('OG Image generation error:', error);
    
    // Fallback image
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #2b825b 0%, #1e5e43 100%)',
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 'bold',
              color: 'white',
              textAlign: 'center',
              padding: '40px',
            }}
          >
            Zidwell
            <div style={{ fontSize: 36, marginTop: 20, color: '#E6E6E6' }}>
              Business & Finance Tools
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          'Cache-Control': 'public, max-age=3600',
          'Content-Type': 'image/png',
        },
      }
    );
  }
}