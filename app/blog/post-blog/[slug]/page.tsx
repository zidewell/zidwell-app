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


export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  // Await the params
  const { slug } = await params;

  const post = await getPostForMetadata(slug);

  const baseUrl =
    process.env.NODE_ENV === "development"
      ? process.env.NEXT_PUBLIC_DEV_URL || "http://localhost:3000"
      : process.env.NEXT_PUBLIC_BASE_URL || "https://zidwell.com";

  if (!post || !post.is_published) {
    return {
      title: "Post Not Found",
      description: "The requested blog post could not be found.",
    };
  }

  const imageUrl =
    post.featured_image?.startsWith("http")
      ? post.featured_image
      : `${baseUrl}${post.featured_image || "/default-blog-image.png"}`;

  return {
    title: post.title,
    description: post.excerpt || "Read this blog post",

    openGraph: {
      title: post.title,
      description: post.excerpt || "Read this blog post",
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
      description: post.excerpt || "Read this blog post",
      images: [imageUrl],
    },

    alternates: {
      canonical: `${baseUrl}/blog/${post.slug}`,
    },

    keywords: [...(post.categories || []), ...(post.tags || [])],
  };
}


export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // Await the params
  const { slug } = await params;
  
  if (!slug) return notFound();

  return <ClientPostPage />;
}