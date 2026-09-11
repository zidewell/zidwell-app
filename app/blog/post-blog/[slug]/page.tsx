// app/blog/post-blog/[slug]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogPostClient from "./client";
import { getPostBySlug } from "@/lib/blog";

type Props = {
  params: Promise<{ slug: string }>;
};

const baseUrl = "https://zidwell.com";

/**
 * Build an absolute, publicly-fetchable OG image URL.
 * - Forces https:// prefix if the featured_image is relative
 * - Appends Supabase transform params so the image is a JPEG
 *   (WhatsApp doesn't render .webp previews reliably)
 */
function buildOgImage(featuredImage: string | null | undefined, title: string): string {
  if (!featuredImage) {
    return `${baseUrl}/images/og-image.png`;
  }

  let url = featuredImage.startsWith("http")
    ? featuredImage
    : `${baseUrl}${featuredImage.startsWith("/") ? "" : "/"}${featuredImage}`;

  // Force JPEG for WhatsApp compatibility (Supabase storage transform)
  if (url.includes("supabase.co") && !url.includes("format=")) {
    url += (url.includes("?") ? "&" : "?") + "format=jpeg&width=1200&height=630&resize=cover";
  }

  return url;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post || !post.is_published) {
    return {
      title: "Post Not Found | Zidwell Blog",
      description: "The requested blog post could not be found.",
      robots: { index: false, follow: false },
    };
  }

  const ogImage = buildOgImage(post.featured_image, post.title);
  const excerpt =
    post.excerpt?.trim() ||
    `Read "${post.title}" on Zidwell Blog. Business tips for Nigerian SMEs.`;

  // Trim excerpt to WhatsApp's preferred length (~160 chars for description)
  const shortDescription =
    excerpt.length > 160 ? excerpt.slice(0, 157).trimEnd() + "..." : excerpt;

  const url = `${baseUrl}/blog/post-blog/${slug}`;

  return {
    metadataBase: new URL(baseUrl),
    title: post.title,
    description: shortDescription,
    keywords: [...(post.categories || []), ...(post.tags || [])].join(", "),
    authors: [{ name: post.author_name || "Zidwell" }],

    openGraph: {
      title: post.title,
      description: shortDescription,
      url,
      siteName: "Zidwell Blog",
      type: "article",
      locale: "en_NG",
      publishedTime: post.published_at || post.created_at,
      modifiedTime: post.updated_at,
      authors: [post.author_name || "Zidwell"],
      images: [
        {
          url: ogImage,
          secureUrl: ogImage, // WhatsApp/Facebook like this
          width: 1200,
          height: 630,
          alt: post.title,
          type: "image/jpeg",
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: shortDescription,
      images: [ogImage],
      creator: "@zidwell",
    },

    alternates: {
      canonical: url,
    },

    // Extra tags WhatsApp/Facebook respect
    other: {
      "og:image:secure_url": ogImage,
      "og:image:width": "1200",
      "og:image:height": "630",
      "og:image:type": "image/jpeg",
      "article:published_time": post.published_at || post.created_at,
      "article:modified_time": post.updated_at,
      "article:author": post.author_name || "Zidwell",
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post || !post.is_published) {
    notFound();
  }

  const url = `${baseUrl}/blog/post-blog/${slug}`;
  const ogImage = buildOgImage(post.featured_image, post.title);

  // JSON-LD for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || post.title,
    image: ogImage,
    url,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at,
    author: {
      "@type": "Person",
      name: post.author_name || "Zidwell Team",
    },
    publisher: {
      "@type": "Organization",
      name: "Zidwell",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/images/logo.png`,
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogPostClient post={post} />
    </>
  );
}