// app/blog/post-blog/[slug]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import ClientPostPage from "./client-page";
import { getPostBySlug } from "./post-data";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const baseUrl = "https://zidwell.com";
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post || !post.is_published) {
    return {
      title: "Zidwell Blog | Finance & Business Tools for Nigerian SMEs",
      description: "Create invoices, receipts, contracts, manage finances, and grow your business with Zidwell.",
      openGraph: {
        title: "Zidwell Blog",
        description: "Finance & Business Tools for Nigerian SMEs",
        url: `${baseUrl}/blog/post-blog/${slug}`,
        images: [
          {
            url: `${baseUrl}/blog/post-blog/${slug}/opengraph-image`,
            width: 1200,
            height: 630,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: "Zidwell Blog",
        description: "Finance & Business Tools for Nigerian SMEs",
        images: [`${baseUrl}/blog/post-blog/${slug}/opengraph-image`],
      },
    };
  }

  // The OG image is automatically available at this URL
  const ogImageUrl = `${baseUrl}/blog/post-blog/${slug}/opengraph-image`;

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
          url: ogImageUrl,
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
      images: [ogImageUrl],
      creator: "@zidwellapp",
      site: "@zidwellapp",
    },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post || !post.is_published) {
    notFound();
  }

  return <ClientPostPage post={post} />;
}