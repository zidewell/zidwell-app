import { Metadata } from "next";
import { notFound } from "next/navigation";
import ClientPostPage from "./client-page";
import { getPostBySlug } from "./post-data";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const baseUrl = "https://zidwell.com";
    
    const post = await getPostBySlug(slug);

    
    if (!post || !post.is_published) {
      return {
        title: "Zidwell | Finance & Business Tools for Nigerian SMEs",
        description: "Create invoices, receipts, contracts, manage finances, and grow your business with Zidwell.",
        openGraph: {
          title: "Zidwell",
          description: "Finance & Business Tools for Nigerian SMEs",
          url: `${baseUrl}/blog/post-blog/${slug}`,
          siteName: "Zidwell",
          type: "website",
          images: [
            {
              url: `${baseUrl}/api/og/${slug}`,
              width: 1200,
              height: 630,
              alt: "Zidwell Blog",
            },
          ],
        },
        twitter: {
          card: "summary_large_image",
          title: "Zidwell",
          description: "Finance & Business Tools for Nigerian SMEs",
          images: [`${baseUrl}/api/og/${slug}`],
        },
      };
    }

    const ogImageUrl = `${baseUrl}/api/og/${slug}`;
    
    // Optional: Remove the image existence check to improve performance
    // or keep it with a timeout to prevent hanging
    let imageExists = true;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const imageCheck = await fetch(ogImageUrl, { 
        method: 'HEAD',
        signal: controller.signal 
      });
      clearTimeout(timeoutId);
      imageExists = imageCheck.ok;
    } catch (error) {
      console.warn('Image check failed:', error);
      imageExists = false;
    }
    
    // You might want to use a fallback image if the OG image doesn't exist
    const finalOgImage = imageExists ? ogImageUrl : `${baseUrl}/default-og-image.png`;

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
            url: finalOgImage,
            width: 1200,
            height: 630,
            alt: post.title,
            type: 'image/png',
          },
        ],
      },
      
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description: post.excerpt || `Read this insightful article on Zidwell Blog`,
        images: [finalOgImage],
        creator: "@zidwellapp",
        site: "@zidwellapp",
      },
      
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
      
      verification: {
        google: process.env.GOOGLE_SITE_VERIFICATION,
      },
    };
    
  } catch (error) {
    console.error('Unexpected error in generateMetadata:', error);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://zidwell.com";
    
    return {
      title: "Zidwell Blog",
      description: "Finance & Business Tools for Nigerian SMEs",
      openGraph: {
        title: "Zidwell Blog",
        description: "Finance & Business Tools for Nigerian SMEs",
        // Fixed: removed reference to undefined 'slug' variable in catch block
        images: [`${baseUrl}/default-og-image.png`],
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
    
    // Try to fetch the post
    let post = null;
    try {
      post = await getPostBySlug(slug);
    } catch (fetchError) {
      console.error('Error fetching post for page:', fetchError);
      return notFound();
    }
    
    // If post doesn't exist or isn't published, return 404
    if (!post || !post.is_published) {
      return notFound();
    }

    // Return the client component with the post data
    // Fixed: You were not passing the post data to ClientPostPage
    return <ClientPostPage post={post} />;
    
  } catch (error) {
    console.error('Error in Page component:', error);
    return notFound();
  }
}