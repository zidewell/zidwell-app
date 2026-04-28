import { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogPostClient from "./client"; 
import { getPostBySlug } from "@/lib/blog"; 

type Props = {
  params: Promise<{ slug: string }>;
};

// Generate metadata for SEO and social sharing
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  const baseUrl = "https://zidwell.com";

  if (!post || !post.is_published) {
    return {
      title: "Zidwell Blog | Finance & Business Tools for Nigerian SMEs",
      description: "Create invoices, receipts, contracts, manage finances, and grow your business with Zidwell.",
      openGraph: {
        title: "Zidwell Blog",
        description: "Finance & Business Tools for Nigerian SMEs",
        url: `${baseUrl}/blog/post-blog/${slug}`,
        images: [{ url: `${baseUrl}/images/og-image.png`, width: 1200, height: 630 }],
      },
      twitter: {
        card: "summary_large_image",
        title: "Zidwell Blog",
        description: "Finance & Business Tools for Nigerian SMEs",
        images: [`${baseUrl}/images/og-image.png`],
      },
    };
  }

  // Use featured image for OG image if available
  const ogImage = post.featured_image || `${baseUrl}/images/og-image.png`;

  return {
    title: `${post.title} | Zidwell Blog`,
    description: post.excerpt || `Read "${post.title}" on Zidwell Blog`,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: `${baseUrl}/blog/post-blog/${slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt || `Read "${post.title}" on Zidwell Blog`,
      url: `${baseUrl}/blog/post-blog/${slug}`,
      siteName: "Zidwell",
      type: "article",
      publishedTime: post.published_at || post.created_at,
      authors: post.author_name ? [post.author_name] : ["Zidwell"],
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
      description: post.excerpt || `Read "${post.title}" on Zidwell Blog`,
      images: [ogImage],
      creator: "@zidwellapp",
      site: "@zidwellapp",
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post || !post.is_published) {
    notFound();
  }

  return <BlogPostClient post={post} />;
}