// app/blog/post-blog/[slug]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogPostClient from "./client";
import { getPostBySlug } from "@/lib/blog";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  const baseUrl = "https://zidwell.com";

  if (!post || !post.is_published) {
    return {
      title: "Post Not Found | Zidwell Blog",
      description: "The requested blog post could not be found.",
    };
  }

  const ogImage = post.featured_image || `${baseUrl}/images/og-image.png`;
  const excerpt = post.excerpt || `Read "${post.title}" on Zidwell Blog`;

  return {
    title: `${post.title} | Zidwell Blog`,
    description: excerpt,
    keywords: [...(post.categories || []), ...(post.tags || [])].join(", "),
    openGraph: {
      title: `${post.title} | Zidwell Blog`,
      description: excerpt,
      url: `${baseUrl}/blog/post-blog/${slug}`,
      type: "article",
      publishedTime: post.published_at || post.created_at,
      authors: [post.author_name || "Zidwell"],
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} | Zidwell Blog`,
      description: excerpt,
      images: [ogImage],
    },
    alternates: {
      canonical: `${baseUrl}/blog/post-blog/${slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post || !post.is_published) {
    notFound();
  }

  // Add JSON-LD for better SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: post.featured_image,
    datePublished: post.published_at || post.created_at,
    author: {
      "@type": "Person",
      name: post.author_name || "Zidwell Team",
    },
    publisher: {
      "@type": "Organization",
      name: "Zidwell",
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