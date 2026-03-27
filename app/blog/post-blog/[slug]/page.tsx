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
    const baseUrl =
      process.env.NODE_ENV === "development"
        ? process.env.NEXT_PUBLIC_DEV_URL || "http://localhost:3000"
        : process.env.NEXT_PUBLIC_BASE_URL || "https://zidwell.com";

    const res = await fetch(`${baseUrl}/api/blog/posts/slug/${slug}`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return null;

    return await res.json();
  } catch (error) {
    console.error("Metadata fetch error:", error);
    return null;
  }
}

// Helper function to check if string is Base64 image
function isBase64Image(str: string): boolean {
  return str.startsWith('data:image/');
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostForMetadata(slug);
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://zidwell.com";
  
  if (!post || !post.is_published) {
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

  // Determine the correct image URL for Open Graph
  let imageUrl: string;
  
  if (post.featured_image && post.featured_image.startsWith('http')) {
    // If it's already a full URL (CDN, external, etc.), use it directly
    imageUrl = post.featured_image;
  } else if (post.featured_image) {
    // If it's a relative path or stored in Supabase, use the dedicated OG image route
    imageUrl = `${baseUrl}/api/og-image/${slug}`;
  } else {
    // Fallback to default image
    imageUrl = `${baseUrl}/images/og-image.png`;
  }
  
  console.log('Generated OG image URL:', imageUrl);
  
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