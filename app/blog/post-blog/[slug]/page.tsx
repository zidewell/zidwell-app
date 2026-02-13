// app/blog/post-blog/[slug]/page.tsx (Server Component)
import { Metadata } from 'next';
import ClientPostPage from './client-page';

    const baseUrl =
      process.env.NODE_ENV === "development"
        ? process.env.NEXT_PUBLIC_DEV_URL
        : process.env.NEXT_PUBLIC_BASE_URL;

// Fetch post data for metadata
async function getPostForMetadata(slug: string) {
  try {
    const res = await fetch(`/api/blog/posts/slug/${slug}`, {
      next: { revalidate: 3600 } 
    });
    
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Error fetching post for metadata:', error);
    return null;
  }
}

// Generate metadata for Open Graph tags
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPostForMetadata(params.slug);
  
  if (!post || !post.is_published) {
    return {
      title: 'Post Not Found',
      description: 'The requested blog post could not be found.'
    };
  }
  
  
  // Construct absolute URL for the featured image
  const imageUrl = post.featured_image?.startsWith('http') 
    ? post.featured_image 
    : `${baseUrl}${post.featured_image || '/default-blog-image.png'}`;
  
  return {
    title: post.title,
    description: post.excerpt || 'Read this blog post',
    
    // Open Graph metadata (for WhatsApp, Facebook, LinkedIn)
    openGraph: {
      title: post.title,
      description: post.excerpt || 'Read this blog post',
      url: `${baseUrl}/blog/post-blog/${post.slug}`,
      siteName: 'Your Website Name',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      type: 'article',
      publishedTime: post.published_at || post.created_at,
      modifiedTime: post.updated_at,
      authors: post.author?.name ? [post.author.name] : ['Unknown Author'],
      tags: post.categories || [],
    },
    
    // Twitter Card metadata
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt || 'Read this blog post',
      images: [imageUrl],
    },
    
    // Additional metadata
    authors: post.author?.name ? [{ name: post.author.name }] : undefined,
    keywords: [...(post.categories || []), ...(post.tags || [])].join(', '),
    
    // Canonical URL
    alternates: {
      canonical: `${baseUrl}/blog/post-blog/${post.slug}`,
    },
  };
}

// This is a server component that renders the client component
export default function PostPage({ params }: { params: { slug: string } }) {
  return <ClientPostPage params={params} />;
}