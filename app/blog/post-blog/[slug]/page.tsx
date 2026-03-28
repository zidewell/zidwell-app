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
    
    // Default base URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.zidwell.com";
    
    // Try to fetch the post
    let post = null;
    try {
      post = await getPostBySlug(slug);
    } catch (fetchError) {
      console.error('Error fetching post for metadata:', fetchError);
    }
    
    // If post doesn't exist or isn't published, return default metadata
    if (!post || !post.is_published) {
      console.log('Post not found or not published for metadata:', slug);
      return {
        title: "Zidwell | Finance & Business Tools for Nigerian SMEs",
        description: "Create invoices, receipts, contracts, manage finances, and grow your business with Zidwell. All-in-one platform for Nigerian entrepreneurs.",
        openGraph: {
          title: "Zidwell | Finance & Business Tools for Nigerian SMEs",
          description: "Create invoices, receipts, contracts, manage finances, and grow your business with Zidwell. All-in-one platform for Nigerian entrepreneurs.",
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
          title: "Zidwell | Business Finance Platform Nigeria",
          description: "Invoicing, contracts, receipts, accounting & financial tools for Nigerian businesses.",
          images: [`${baseUrl}/images/twitter-card.jpg`],
          creator: "@zidwellapp",
          site: "@zidwellapp",
        },
      };
    }

    // Determine the image URL - use your OG image API route
    let imageUrl: string;
    
    if (post.featured_image) {
      // Use your OG image API route to generate the social card
      imageUrl = `${baseUrl}/api/og-image/${slug}`;
    } else {
      // Fallback to default image
      imageUrl = `${baseUrl}/images/og-image.png`;
    }

    console.log('Generating metadata for:', post.title);
    console.log('Image URL:', imageUrl);

    // Return blog post specific metadata
    return {
      title: `${post.title} | Zidwell Blog`,
      description: post.excerpt || `Read "${post.title}" on Zidwell Blog`,
      
      openGraph: {
        title: post.title,
        description: post.excerpt || `Read this insightful article on Zidwell Blog`,
        url: `${baseUrl}/blog/post-blog/${slug}`,
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
        creator: "@zidwellapp",
        site: "@zidwellapp",
      },
      
      alternates: {
        canonical: `${baseUrl}/blog/post-blog/${slug}`,
      },
    };
    
  } catch (error) {
    // Catch any unexpected errors and return default metadata
    console.error('Unexpected error in generateMetadata:', error);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.zidwell.com";
    
    return {
      title: "Zidwell | Finance & Business Tools for Nigerian SMEs",
      description: "Create invoices, receipts, contracts, manage finances, and grow your business with Zidwell.",
      openGraph: {
        title: "Zidwell | Finance & Business Tools for Nigerian SMEs",
        description: "Create invoices, receipts, contracts, manage finances, and grow your business with Zidwell.",
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

    // Return the client component
    return <ClientPostPage />;
    
  } catch (error) {
    console.error('Error in Page component:', error);
    return notFound();
  }
}