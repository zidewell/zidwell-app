// app/blog/post-blog/[slug]/opengraph-image.tsx
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

  // If post has featured image, use it
  if (post?.featured_image && post.featured_image.startsWith('http')) {
    try {
      const imageResponse = await fetch(post.featured_image);
      if (imageResponse.ok) {
        const imageBuffer = await imageResponse.arrayBuffer();
        return new Response(imageBuffer, {
          headers: {
            'Content-Type': imageResponse.headers.get('content-type') || 'image/jpeg',
            'Cache-Control': 'public, max-age=86400',
          },
        });
      }
    } catch (error) {
      console.error('Error fetching featured image:', error);
    }
  }

  // Fallback: Generate custom OG image with title
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
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        }}
      >
        {/* Decorative background */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)',
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
          }}
        >
          {/* Logo/Badge */}
          <div
            style={{
              fontSize: 32,
              fontWeight: 'bold',
              color: '#2b825b',
              marginBottom: 40,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span>📝</span>
            <span>Zidwell</span>
          </div>
          
          {/* Title */}
          <div
            style={{
              fontSize: 64,
              fontWeight: 'bold',
              color: '#1a1a1a',
              textAlign: 'center',
              marginBottom: 24,
              lineHeight: 1.2,
              maxWidth: '1000px',
            }}
          >
            {title}
          </div>
          
          {/* Description */}
          {description && (
            <div
              style={{
                fontSize: 28,
                color: '#666666',
                textAlign: 'center',
                marginBottom: 48,
                maxWidth: '900px',
                lineHeight: 1.3,
              }}
            >
              {description}
            </div>
          )}
          
          {/* Footer */}
          <div
            style={{
              fontSize: 20,
              color: '#2b825b',
              borderTop: '2px solid #e0e0e0',
              paddingTop: 32,
              display: 'flex',
              gap: 24,
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