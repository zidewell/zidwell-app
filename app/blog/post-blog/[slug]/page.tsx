// app/blog/post-blog/[slug]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import BlogPostClient from "./client";
import { getPostBySlug } from "@/lib/blog";

type Props = {
  params: Promise<{ slug: string }>;
};

const baseUrl = "https://zidwell.com";

// ✅ Memoize so generateMetadata and the page share one fetch
// (per Next.js docs "Memoizing data requests")
const getPostCached = cache(async (slug: string) => getPostBySlug(slug));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostCached(slug);

  if (!post || !post.is_published) {
    return {
      title: "Post Not Found",
      description: "The requested blog post could not be found.",
      robots: { index: false, follow: false },
    };
  }

  const excerpt =
    post.excerpt?.trim() ||
    `Read "${post.title}" on Zidwell Blog. Business tips for Nigerian SMEs.`;

  // Trim to WhatsApp's preferred description length (~160 chars)
  const shortDescription =
    excerpt.length > 160 ? excerpt.slice(0, 157).trimEnd() + "..." : excerpt;

  const url = `${baseUrl}/blog/post-blog/${slug}`;

  return {
    metadataBase: new URL(baseUrl),
    title: post.title,
    description: shortDescription,
    keywords: [...(post.categories || []), ...(post.tags || [])].join(", "),
    authors: [{ name: post.author_name || "Zidwell" }],

    // ─────────────────────────────────────────────────────────
    // NOTE: We do NOT include `images` here.
    //
    // Per Next.js docs: "The more specific image will take
    // precedence over any OG images above it in the folder
    // structure."
    //
    // The colocated opengraph-image.tsx file handles og:image
    // automatically and guarantees Content-Type: image/png.
    // Declaring `images` here too would create duplicate tags.
    // ─────────────────────────────────────────────────────────
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
    },

    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: shortDescription,
      creator: "@zidwell",
    },

    alternates: {
      canonical: url,
    },

    other: {
      "article:published_time": post.published_at || post.created_at,
      "article:modified_time": post.updated_at,
      "article:author": post.author_name || "Zidwell",
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostCached(slug);

  if (!post || !post.is_published) {
    notFound();
  }

  const url = `${baseUrl}/blog/post-blog/${slug}`;
  // Points to the colocated opengraph-image.tsx route
  const ogImage = `${url}/opengraph-image`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || post.title,
    image: ogImage,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
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