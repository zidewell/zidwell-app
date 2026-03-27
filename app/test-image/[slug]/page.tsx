// app/test-image/[slug]/page.tsx
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function TestImagePage({ params }: Props) {
  const { slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://zidwell.com";
  
  // Fetch post data
  const res = await fetch(`${baseUrl}/api/blog/posts/slug/${slug}`, {
    cache: 'no-store'
  });
  
  if (!res.ok) {
    notFound();
  }
  
  const post = await res.json();
  
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Image Debug Page</h1>
      <h2>Post: {post.title}</h2>
      
      <div style={{ margin: '20px 0', padding: '10px', background: '#f0f0f0' }}>
        <h3>Featured Image URL:</h3>
        <code>{post.featured_image || 'No image'}</code>
      </div>
      
      <div style={{ margin: '20px 0' }}>
        <h3>OG Image URL:</h3>
        <code>{`${baseUrl}/api/og-image/${slug}`}</code>
        <div style={{ marginTop: '10px' }}>
          <a href={`${baseUrl}/api/og-image/${slug}`} target="_blank">
            View OG Image Endpoint
          </a>
        </div>
      </div>
      
      <div style={{ margin: '20px 0' }}>
        <h3>Image Proxy URL:</h3>
        <code>{`${baseUrl}/api/blog/image/${slug}`}</code>
        <div style={{ marginTop: '10px' }}>
          <a href={`${baseUrl}/api/blog/image/${slug}`} target="_blank">
            View Image Proxy Endpoint
          </a>
        </div>
      </div>
      
      <div style={{ margin: '20px 0' }}>
        <h3>Direct Image Test:</h3>
        {post.featured_image && (
          <div>
            <img 
              src={post.featured_image} 
              alt={post.title}
              style={{ maxWidth: '100%', maxHeight: '300px', border: '1px solid #ccc' }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                console.error('Image failed to load');
              }}
            />
            <p>If image doesn't load above, the URL is invalid or not accessible</p>
          </div>
        )}
      </div>
      
      <div style={{ margin: '20px 0' }}>
        <h3>OG Image Preview:</h3>
        <img 
          src={`${baseUrl}/api/og-image/${slug}`}
          alt="OG Image"
          style={{ maxWidth: '100%', maxHeight: '300px', border: '1px solid #ccc' }}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            console.error('OG image failed to load');
          }}
        />
      </div>
      
      <div style={{ margin: '20px 0' }}>
        <h3>Facebook Debugger Link:</h3>
        <a 
          href={`https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(`${baseUrl}/blog/${slug}`)}`}
          target="_blank"
        >
          Open in Facebook Debugger
        </a>
      </div>
    </div>
  );
}