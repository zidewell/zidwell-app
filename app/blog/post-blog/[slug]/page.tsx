import { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import ClientPostPage from "./client-page";

// Cache the post fetching function to avoid duplicate requests
export const getPostBySlug = cache(async (slug: string) => {
  try {
    const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
    
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !post) {
      console.error('Error fetching post:', error);
      return null;
    }

    // Only return if published
    if (!post.is_published) {
      return null;
    }

    return post;
  } catch (error) {
    console.error('Error in getPostBySlug:', error);
    return null;
  }
});

type Props = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { slug } = await params;
  
  // Fetch post directly from database (server-side)
  const post = await getPostBySlug(slug);
  
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://zidwell.com' 
    : process.env.NEXT_PUBLIC_DEV_URL || 'http://localhost:3000';
  
  if (!post) {
    return {
      title: "Post Not Found | Zidwell Blog",
      description: "The requested blog post could not be found.",
      openGraph: {
        title: "Post Not Found | Zidwell Blog",
        description: "The requested blog post could not be found.",
        images: [`${baseUrl}/images/og-image.png`],
      },
    };
  }

  // Determine the image URL for social sharing
  let imageUrl: string;
  
  if (post.featured_image) {
    if (post.featured_image.startsWith('http://') || post.featured_image.startsWith('https://')) {
      imageUrl = post.featured_image;
    } else if (post.featured_image.startsWith('/')) {
      imageUrl = `${baseUrl}${post.featured_image}`;
    } else {
      imageUrl = `${baseUrl}/${post.featured_image}`;
    }
  } else {
    imageUrl = `${baseUrl}/images/og-image.png`;
  }

  // Force HTTPS in production
  if (process.env.NODE_ENV === 'production' && imageUrl.startsWith('http://')) {
    imageUrl = imageUrl.replace('http://', 'https://');
  }

  return {
    title: `${post.title} | Zidwell Blog`,
    description: post.excerpt || `Read "${post.title}" on Zidwell Blog`,
    
    openGraph: {
      title: post.title,
      description: post.excerpt || `Read this insightful article on Zidwell Blog`,
      url: `${baseUrl}/blog/${slug}`,
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
      authors: [post.author_name || "Zidwell"],
    },
    
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt || `Read this insightful article on Zidwell Blog`,
      images: [imageUrl],
      creator: "@zidwell",
    },
    
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
      },
    },
    
    alternates: {
      canonical: `${baseUrl}/blog/${slug}`,
    },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  
  if (!slug) return notFound();
  
  // Verify post exists and is published
  const post = await getPostBySlug(slug);
  
  if (!post) {
    return notFound();
  }

  // Pass the post data to the client component if needed
  return <ClientPostPage />;
}