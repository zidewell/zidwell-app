import { ImageResponse } from 'next/og';
import { getPostBySlug } from './post-data';

export const runtime = 'edge';
export const alt = 'Zidwell Blog Post';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  // Use the post's featured image if available
  const imageUrl = post?.featured_image || null;
  
  // If there's a featured image, try to use it
  if (imageUrl && imageUrl.startsWith('http')) {
    try {
      // Fetch the image
      const response = await fetch(imageUrl);
      if (response.ok) {
        const imageBuffer = await response.arrayBuffer();
        return new Response(imageBuffer, {
          headers: {
            'Content-Type': response.headers.get('content-type') || 'image/jpeg',
            'Cache-Control': 'public, max-age=86400',
          },
        });
      }
    } catch (error) {
      console.error('Error fetching featured image:', error);
    }
  }

  // Fallback: Generate dynamic OG image with text
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
          backgroundColor: '#0A0A0A',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          position: 'relative',
        }}
      >
        {/* Background gradient */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
          }}
        />
        
        {/* Decorative elements */}
        <div
          style={{
            position: 'absolute',
            top: '10%',
            left: '5%',
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(43,130,91,0.1) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '10%',
            right: '5%',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(43,130,91,0.08) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />
        
        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px',
            maxWidth: '90%',
            zIndex: 1,
            backgroundColor: 'rgba(10,10,10,0.8)',
            borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {/* Logo/Badge */}
          <div
            style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#2b825b',
              marginBottom: '40px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span>📝</span>
            <span>Zidwell Blog</span>
          </div>
          
          {/* Title */}
          <div
            style={{
              fontSize: '64px',
              fontWeight: 'bold',
              color: '#ffffff',
              textAlign: 'center',
              marginBottom: '24px',
              lineHeight: 1.2,
              maxWidth: '900px',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            {title.length > 80 ? title.substring(0, 80) + '...' : title}
          </div>
          
          {/* Description */}
          {description && (
            <div
              style={{
                fontSize: '28px',
                color: '#b0b0b0',
                textAlign: 'center',
                marginBottom: '48px',
                maxWidth: '800px',
                lineHeight: 1.3,
              }}
            >
              {description.length > 120 ? description.substring(0, 120) + '...' : description}
            </div>
          )}
          
          {/* Footer */}
          <div
            style={{
              fontSize: '20px',
              color: '#2b825b',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              paddingTop: '32px',
              display: 'flex',
              gap: '32px',
            }}
          >
            <span>💼 Business Tools</span>
            <span>📊 Financial Management</span>
            <span>🚀 Nigerian SMEs</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      headers: {
        'Cache-Control': 'public, max-age=86400',
      },
    }
  );
}