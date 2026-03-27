// app/blog/[slug]/page.tsx
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
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://zidwell.com";
    
    // Use absolute URL with the correct domain
    const url = `${baseUrl}/api/blog/posts/slug/${slug}`;
    console.log('Fetching metadata from:', url);
    
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



  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://zidwell.com";
  
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

  // Determine the correct image URL
  let imageUrl: string;
  
  if (post.featured_image && post.featured_image.startsWith('http')) {
    imageUrl = post.featured_image;
  } else if (post.featured_image) {
    imageUrl = `${baseUrl}/api/og-image/${slug}`;
  } else {
    imageUrl = `${baseUrl}/images/og-image.png`;
  }
  
  
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
    
    // Add these to ensure proper indexing
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