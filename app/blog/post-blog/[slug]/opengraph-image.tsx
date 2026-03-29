// app/blog/post-blog/[slug]/opengraph-image.tsx
import { ImageResponse } from 'next/og';
import { getPostBySlug } from './post-data';

export const runtime = 'edge';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  // Fallback for missing post
  if (!post || !post.is_published) {
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
            background: 'linear-gradient(135deg, #2b825b 0%, #1e5e43 100%)',
          }}
        >
          <div style={{ fontSize: 72, fontWeight: 'bold', color: 'white' }}>Zidwell</div>
          <div style={{ fontSize: 36, marginTop: 20, color: '#E6E6E6' }}>
            Business & Finance Tools
          </div>
        </div>
      ),
      size
    );
  }

  // If post has featured image, use it
  if (post.featured_image && post.featured_image.startsWith('http')) {
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

  // Generate custom OG image with title
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
        }}
      >
        {/* Background pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle at 25px 25px, #E6E6E6 2px, transparent 2px)',
            backgroundSize: '50px 50px',
            opacity: 0.3,
          }}
        />
        
        {/* Content */}
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
          }}
        >
          <div style={{ fontSize: 48, fontWeight: 'bold', color: '#2b825b', marginBottom: 40 }}>
            📝 Zidwell
          </div>
          
          <div
            style={{
              fontSize: 56,
              fontWeight: 'bold',
              color: '#242424',
              textAlign: 'center',
              marginBottom: 30,
              lineHeight: 1.2,
            }}
          >
            {post.title.length > 70 ? `${post.title.substring(0, 67)}...` : post.title}
          </div>
          
          {post.excerpt && (
            <div
              style={{
                fontSize: 28,
                color: '#6B6B6B',
                textAlign: 'center',
                marginBottom: 40,
              }}
            >
              {post.excerpt.length > 100 ? `${post.excerpt.substring(0, 97)}...` : post.excerpt}
            </div>
          )}
          
          <div style={{ fontSize: 22, color: '#2b825b', borderTop: '2px solid #E6E6E6', paddingTop: 30 }}>
            Business Tools for Nigerian SMEs
          </div>
        </div>
      </div>
    ),
    size
  );
}