// app/blog/post-blog/[slug]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogPostClient from "./client";
import { getPostBySlug } from "@/lib/blog";

type Props = {
  params: Promise<{ slug: string }>;
};

const baseUrl = "https://zidwell.com";

function buildOgImage(featuredImage: string | null | undefined): string {
  if (!featuredImage) {
    return `${baseUrl}/images/og-image.png`;
  }

  let url = featuredImage.startsWith("http")
    ? featuredImage
    : `${baseUrl}${featuredImage.startsWith("/") ? "" : "/"}${featuredImage}`;

  // Force JPEG via Supabase transform (WhatsApp needs jpeg/png)
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
      robots: { index: false, follow: false },
    };
  }

  const ogImage = buildOgImage(post.featured_image);
  const excerpt =
    post.excerpt?.trim() ||
    `Read "${post.title}" on Zidwell Blog. Business tips for Nigerian SMEs.`;

  const shortDescription =
    excerpt.length > 160 ? excerpt.slice(0, 157).trimEnd() + "..." : excerpt;

  const url = `${baseUrl}/blog/post-blog/${slug}`;

  return {
    metadataBase: new URL(baseUrl),
    title: post.title,
    description: shortDescription,
    keywords: [...(post.categories || []), ...(post.tags || [])].join(", "),

    // ─────────────────────────────────────────────
    // CRITICAL: Keep this EXACT shape. Do NOT add
    // secureUrl, type, or other fields inside the
    // image object — Next.js may drop them silently.
    // ─────────────────────────────────────────────
    openGraph: {
      title: post.title,
      description: shortDescription,
      url,
      siteName: "Zidwell Blog",
      type: "article",
      publishedTime: post.published_at || post.created_at,
      modifiedTime: post.updated_at,
      authors: [post.author_name || "Zidwell"],
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: post.title,
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

    // Only use `other` for tags Next.js doesn't natively support.
    // Do NOT duplicate og:image here — it will conflict.
    other: {
      "og:image:width": "1200",
      "og:image:height": "630",
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
  const ogImage = buildOgImage(post.featured_image);

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