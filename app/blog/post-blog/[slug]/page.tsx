// app/blog/post-blog/[slug]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import ClientPostPage from "./client-page";
import { getPostBySlug } from "./post-data";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post || !post.is_published) {
    return {
      title: "Zidwell Blog",
      description: "Finance & Business Tools for Nigerian SMEs",
    };
  }

  return {
    title: post.title,
    description: post.excerpt || `Read "${post.title}" on Zidwell Blog`,
    openGraph: {
      title: post.title,
      description: post.excerpt || `Read "${post.title}" on Zidwell Blog`,
      type: "article",
      publishedTime: post.published_at || post.created_at,
      authors: post.author_name ? [post.author_name] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt || `Read "${post.title}" on Zidwell Blog`,
      creator: "@zidwellapp",
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