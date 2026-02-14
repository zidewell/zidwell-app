import { Metadata } from "next";
import { notFound } from "next/navigation";
import ClientPostPage from "./client-page";

// Fetch post data for metadata
async function getPostForMetadata(slug: string) {
  try {

    const res = await fetch(`/api/blog/posts/slug/${slug}`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Error fetching post for metadata:", error);
    return null;
  }
}

// Generate metadata for Open Graph tags
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  // Await the params promise
  const { slug } = await params;

  const post = await getPostForMetadata(slug);

  const baseUrl =
      process.env.NODE_ENV === "development"
        ? process.env.NEXT_PUBLIC_DEV_URL
        : process.env.NEXT_PUBLIC_BASE_URL;
        
  if (!post || !post.is_published) {
    return {
      title: "Post Not Found",
      description: "The requested blog post could not be found.",
    };
  }

  // Construct absolute URL for the featured image
  const imageUrl = post.featured_image?.startsWith("http")
    ? post.featured_image
    : `${baseUrl}${post.featured_image || "/default-blog-image.png"}`;

  return {
    title: post.title,
    description: post.excerpt || "Read this blog post",

    // Open Graph metadata (for WhatsApp, Facebook, LinkedIn)
    openGraph: {
      title: post.title,
      description: post.excerpt || "Read this blog post",
      url: `${baseUrl}/blog/post-blog/${post.slug}`,
      siteName: "Your Website Name",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      type: "article",
      publishedTime: post.published_at || post.created_at,
      modifiedTime: post.updated_at,
      authors: post.author?.name ? [post.author.name] : ["Unknown Author"],
      tags: post.categories || [],
    },

    // Twitter Card metadata
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt || "Read this blog post",
      images: [imageUrl],
    },

    // Additional metadata
    authors: post.author?.name ? [{ name: post.author.name }] : undefined,
    keywords: [...(post.categories || []), ...(post.tags || [])].join(", "),

    // Canonical URL
    alternates: {
      canonical: `${baseUrl}/blog/post-blog/${post.slug}`,
    },
  };
}

// This is a server component that renders the client component
export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  try {
    // Await the params promise
    const { slug } = await params;

    if (!slug) {
      return notFound();
    }

    // You can also fetch the post here if needed for validation
    const baseUrl =
      process.env.NODE_ENV === "development"
        ? process.env.NEXT_PUBLIC_DEV_URL || "http://localhost:3000"
        : process.env.NEXT_PUBLIC_BASE_URL || "https://yourwebsite.com";

    const res = await fetch(`${baseUrl}/api/blog/posts/slug/${slug}`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return notFound();
    }

    const post = await res.json();

    if (!post || !post.is_published) {
      return notFound();
    }

    // Render the client component
    return <ClientPostPage />;
  } catch (error) {
    console.error("Error in PostPage:", error);
    return notFound();
  }
}
