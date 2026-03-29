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
  
  try {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    // Default metadata for unpublished or missing posts
    if (!post || !post.is_published) {
      return {
        title: "Zidwell | Finance & Business Tools for Nigerian SMEs",
        description: "Create invoices, receipts, contracts, manage finances, and grow your business with Zidwell.",
        openGraph: {
          title: "Zidwell Blog",
          description: "Finance & Business Tools for Nigerian SMEs",
          url: `${baseUrl}/blog/post-blog/${slug}`,
          siteName: "Zidwell",
          type: "article",
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
          title: "Zidwell Blog",
          description: "Finance & Business Tools for Nigerian SMEs",
          images: [`${baseUrl}/images/og-image.png`],
        },
      };
    }

    // Use the dynamic OG image generator
    const ogImageUrl = `${baseUrl}/api/og/${slug}`;

    return {
      title: `${post.title} | Zidwell Blog`,
      description: post.excerpt || `Read "${post.title}" on Zidwell Blog`,
      metadataBase: new URL(baseUrl),
      alternates: {
        canonical: `${baseUrl}/blog/post-blog/${slug}`,
      },
      openGraph: {
        title: post.title,
        description: post.excerpt || `Read this insightful article on Zidwell Blog`,
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
        description: post.excerpt || `Read this insightful article on Zidwell Blog`,
        images: [ogImageUrl],
        creator: "@zidwellapp",
        site: "@zidwellapp",
      },
    };
    
  } catch (error) {
    console.error('Error generating metadata:', error);
    
    // Fallback metadata
    return {
      title: "Zidwell Blog",
      description: "Finance & Business Tools for Nigerian SMEs",
      openGraph: {
        title: "Zidwell Blog",
        description: "Finance & Business Tools for Nigerian SMEs",
        url: `${baseUrl}/blog`,
        siteName: "Zidwell",
        type: "website",
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
        title: "Zidwell Blog",
        description: "Finance & Business Tools for Nigerian SMEs",
        images: [`${baseUrl}/images/og-image.png`],
      },
    };
  }
}

export default async function Page({ params }: Props) {
  try {
    const { slug } = await params;
    
    if (!slug) {
      return notFound();
    }
    
    const post = await getPostBySlug(slug);
    
    if (!post || !post.is_published) {
      return notFound();
    }

    return <ClientPostPage post={post} />;
    
  } catch (error) {
    console.error('Error in Page component:', error);
    return notFound();
  }
}