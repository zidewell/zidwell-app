import { Metadata } from "next";
import { notFound } from "next/navigation";
import PaymentPageClient from "./client";

type Props = {
  params: Promise<{ slug: string }>;
};

// Generate metadata for social sharing
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const baseUrl = process.env.NODE_ENV === "development" 
    ? "http://localhost:3000" 
    : "https://zidwell.com";
  
  try {
    const response = await fetch(`${baseUrl}/api/payment-page/public/${slug}`, {
      cache: "no-store"
    });
    
    if (!response.ok) {
      return {
        title: "Payment Page | Zidwell",
        description: "Secure payment page on Zidwell",
      };
    }
    
    const data = await response.json();
    const page = data.page;
    
    if (!page) {
      return {
        title: "Payment Page | Zidwell",
        description: "Secure payment page on Zidwell",
      };
    }

    // Determine the featured image
    let featuredImage = page.coverImage;
    if (!featuredImage && page.productImages && page.productImages.length > 0) {
      featuredImage = page.productImages[0];
    }
    
    const defaultImage = `${baseUrl}/zidwell-og-image.png`;
    const imageUrl = featuredImage || defaultImage;

    // Determine page type label
    const typeLabels: Record<string, string> = {
      school: "School Fees",
      donation: "Donation",
      physical: "Product",
      digital: "Digital Product",
      services: "Service",
      real_estate: "Real Estate",
      stock: "Investment",
      savings: "Savings",
      crypto: "Crypto",
    };

    const pageTypeLabel = typeLabels[page.pageType] || "Payment";
    
    const description = page.description 
      ? `${page.title} - ${page.description.substring(0, 150)}...` 
      : `Pay for ${page.title} securely on Zidwell. ${pageTypeLabel} payment made easy.`;

    return {
      title: `${page.title} | Zidwell Payment`,
      description: description,
      openGraph: {
        title: `${page.title} | Pay Securely on Zidwell`,
        description: description,
        url: `${baseUrl}/pay/${page.slug}`,
        siteName: "Zidwell",
        type: "website",
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: page.title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: `${page.title} | Zidwell Payment`,
        description: description,
        images: [imageUrl],
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Payment Page | Zidwell",
      description: "Secure payment page on Zidwell",
    };
  }
}

// Server component that renders the client component
export default async function PaymentPage({ params }: Props) {
  const { slug } = await params;
  
  try {
    const baseUrl = process.env.NODE_ENV === "development" 
      ? "http://localhost:3000" 
      : "https://zidwell.com";
    
    const response = await fetch(`${baseUrl}/api/payment-page/public/${slug}`, {
      cache: "no-store"
    });
    
    if (!response.ok) {
      notFound();
    }
    
    const data = await response.json();
    const page = data.page;
    
    if (!page) {
      notFound();
    }
    
    return <PaymentPageClient slug={slug} />;
  } catch (error) {
    console.error("Error loading payment page:", error);
    notFound();
  }
}