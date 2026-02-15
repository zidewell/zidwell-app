import { Metadata } from "next";
import { notFound } from "next/navigation";
import ClientPostPage from "./client-page";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  featured_image?: string | null; // This contains Base64 data
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

  const baseUrl =
    process.env.NODE_ENV === "development"
      ? process.env.NEXT_PUBLIC_DEV_URL || "http://localhost:3000"
      : process.env.NEXT_PUBLIC_BASE_URL || "https://zidwell.com";

  if (!post || !post.is_published) {
    return {
      title: "Post Not Found | Zidwell Blog",
      description: "The requested blog post could not be found.",
      openGraph: {
        title: "Post Not Found | Zidwell Blog",
        description: "The requested blog post could not be found.",
        images: [
          {
            url: `${baseUrl}/images/og-image.png`,
            width: 1200,
            height: 630,
            alt: "Zidwell Blog",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: "Post Not Found | Zidwell Blog",
        description: "The requested blog post could not be found.",
        images: [`${baseUrl}/images/og-image.png`],
      },
    };
  }

  // Check if featured_image is Base64
  let imageUrl = `${baseUrl}/images/og-image.png`; // Default fallback
  
  if (post.featured_image) {
    if (post.featured_image.startsWith('http')) {
      // It's already a URL
      imageUrl = post.featured_image;
    } else if (isBase64Image(post.featured_image)) {
      // It's Base64 - we need to serve it through an API endpoint
      // We'll create a proxy endpoint to serve Base64 images
      imageUrl = `${baseUrl}/api/blog/images/${post.id}`;
      console.log("Base64 image detected, using proxy URL:", imageUrl);
    } else {
      // It might be a relative path
      const imagePath = post.featured_image.startsWith('/') 
        ? post.featured_image 
        : `/${post.featured_image}`;
      imageUrl = `${baseUrl}${imagePath}`;
    }
  }

  return {
    title: `${post.title} | Zidwell Blog`,
    description: post.excerpt || "Read this blog post on Zidwell",
    
    openGraph: {
      title: post.title,
      description: post.excerpt || "Read this blog post on Zidwell",
      url: `${baseUrl}/blog/${post.slug}`,
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
      modifiedTime: post.updated_at,
      authors: post.author?.name ? [post.author.name] : undefined,
      tags: post.categories || [],
    },

    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt || "Read this blog post on Zidwell",
      images: [imageUrl],
    },

    alternates: {
      canonical: `${baseUrl}/blog/${post.slug}`,
    },

    keywords: [...(post.categories || []), ...(post.tags || [])],
    
    authors: post.author?.name ? [{ name: post.author.name }] : undefined,
    category: post.categories?.[0],
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