import { Metadata } from "next";
import { notFound } from "next/navigation";
import ClientPostPage from "./client-page";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  featured_image?: string | null;
  is_published: boolean;
  published_at?: string | null;
  created_at: string;
  updated_at?: string;
  categories?: string[];
  tags?: string[];
  author?: {
    name?: string;
    avatar?: string | null;
  };
}

async function getPostForMetadata(slug: string): Promise<BlogPost | null> {
  try {
    // Determine the base URL for API calls
    // In production, use the production URL with HTTPS
    // In development, use localhost
    const isProduction = process.env.NODE_ENV === 'production';
    
    let baseUrl: string;
    
    if (isProduction) {
      // Use HTTPS for production
      baseUrl = 'https://zidwell.com';
    } else {
      // Use localhost for development
      baseUrl = process.env.NEXT_PUBLIC_DEV_URL || 'http://localhost:3000';
    }
    
    // Construct the full URL
    const url = `${baseUrl}/api/blog/posts/slug/${slug}`;
    
    console.log('Fetching metadata from:', url);
    console.log('Environment:', process.env.NODE_ENV);
    
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!res.ok) {
      console.log('Failed to fetch post:', res.status);
      return null;
    }

    const post = await res.json();
    console.log('Post fetched:', post.title);
    console.log('Featured image:', post.featured_image);
    return post;
  } catch (error) {
    console.error("Metadata fetch error:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  console.log('Generating metadata for slug:', slug);
  
  const post = await getPostForMetadata(slug);

  // Determine the base URL for OG images
  const isProduction = process.env.NODE_ENV === 'production';
  const baseUrl = isProduction 
    ? 'https://zidwell.com' 
    : (process.env.NEXT_PUBLIC_DEV_URL || 'http://localhost:3000');
  
  if (!post || !post.is_published) {
    console.log('Post not found or not published');
    return {
      title: "Post Not Found | Zidwell Blog",
      description: "The requested blog post could not be found.",
      openGraph: {
        title: "Post Not Found | Zidwell Blog",
        description: "The requested blog post could not be found.",
        images: [`${baseUrl}/images/og-image.png`],
      },
    };
  }

  // Determine the correct image URL for social sharing
  let imageUrl: string;
  
  if (post.featured_image) {
    // If it's already a full URL, use it directly
    if (post.featured_image.startsWith('http://') || post.featured_image.startsWith('https://')) {
      imageUrl = post.featured_image;
    } 
    // If it's a relative path starting with /, prepend base URL
    else if (post.featured_image.startsWith('/')) {
      imageUrl = `${baseUrl}${post.featured_image}`;
    }
    // If it's just a filename or path without leading slash
    else {
      imageUrl = `${baseUrl}/${post.featured_image}`;
    }
  } else {
    // Fallback to default OG image if no featured image
    imageUrl = `${baseUrl}/images/og-image.png`;
  }
  
  // Ensure we're using HTTPS in production
  if (isProduction && imageUrl.startsWith('http://')) {
    imageUrl = imageUrl.replace('http://', 'https://');
  }
  
  console.log('Final OG image URL:', imageUrl);
  console.log('Base URL used:', baseUrl);
  
  return {
    title: `${post.title} | Zidwell Blog`,
    description: post.excerpt || `Read "${post.title}" on Zidwell Blog`,
    
    openGraph: {
      title: post.title,
      description: post.excerpt || `Read this insightful article on Zidwell Blog`,
      url: `${baseUrl}/blog/${slug}`,
      siteName: "Zidwell",
      type: "article",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      publishedTime: post.published_at || post.created_at,
      authors: [post.author?.name || "Zidwell"],
    },
    
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt || `Read this insightful article on Zidwell Blog`,
      images: [imageUrl],
      creator: "@zidwell",
    },
    
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
      },
    },
    
    alternates: {
      canonical: `${baseUrl}/blog/${slug}`,
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  
  if (!slug) return notFound();

  return <ClientPostPage />;
}