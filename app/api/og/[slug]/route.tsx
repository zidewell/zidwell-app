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
    
    // Fetch post data from blog Supabase
    const supabaseBlog = createClient(
      process.env.BLOG_SUPABASE_URL!,
      process.env.BLOG_SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: post } = await supabaseBlog
      .from('blog_posts')
      .select('title, featured_image, excerpt')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    // If there's a featured image that's accessible, redirect to it directly
    if (post?.featured_image && post.featured_image.startsWith('http')) {
      // Check if image is accessible (optional, but helps with debugging)
      try {
        const imageCheck = await fetch(post.featured_image, { method: 'HEAD' });
        if (imageCheck.ok) {
          // Return 302 redirect to the actual image
          return new Response(null, {
            status: 302,
            headers: {
              'Location': post.featured_image,
              'Cache-Control': 'public, max-age=3600',
            },
          });
        }
      } catch (error) {
        console.error('Image check failed:', error);
        // Fall through to generate OG image
      }
    }

    // Generate OG image with text
    const title = post?.title || "Zidwell Blog";
    const description = post?.excerpt || "Finance & Business Tools for Nigerian SMEs";
    const logoUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://zidwell.com'}/images/zidwell-logo.png`;
    
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
          
          {/* Content container */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '20px',
              maxWidth: '90%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            }}
          >
            {/* Logo */}
            <div
              style={{
                fontSize: 32,
                fontWeight: 'bold',
                color: '#242424',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span>📝</span>
              <span>Zidwell</span>
            </div>
            
            {/* Title */}
            <div
              style={{
                fontSize: 48,
                fontWeight: 'bold',
                color: '#242424',
                textAlign: 'center',
                maxWidth: '100%',
                marginBottom: 20,
                lineHeight: 1.2,
              }}
            >
              {title.length > 80 ? `${title.substring(0, 77)}...` : title}
            </div>
            
            {/* Description */}
            {description && (
              <div
                style={{
                  fontSize: 24,
                  color: '#6B6B6B',
                  textAlign: 'center',
                  maxWidth: '80%',
                  marginBottom: 30,
                  lineHeight: 1.3,
                }}
              >
                {description.length > 120 ? `${description.substring(0, 117)}...` : description}
              </div>
            )}
            
            {/* Footer */}
            <div
              style={{
                fontSize: 18,
                color: '#242424',
                borderTop: '1px solid #E6E6E6',
                paddingTop: 20,
                display: 'flex',
                gap: 20,
              }}
            >
              <span>💡 Financial Tools</span>
              <span>📊 Business Growth</span>
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
            backgroundColor: '#242424',
          }}
        >
          <div
            style={{
              fontSize: 60,
              fontWeight: 'bold',
              color: 'white',
              textAlign: 'center',
              padding: '40px',
            }}
          >
            Zidwell Blog
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