import { Metadata, ResolvingMetadata } from "next";
import PaymentPageClient from "./client";

// Server component for metadata generation
async function getPageData(slug: string) {
  try {
    const baseUrl = process.env.NODE_ENV === "development" 
      ? "http://localhost:3000" 
      : "https://zidwell.com";
    
    const response = await fetch(`${baseUrl}/api/payment-page/public/${slug}`, {
      cache: "no-store"
    });
    
    if (!response.ok) return null;
    const data = await response.json();
    return data.page;
  } catch (error) {
    console.error("Error fetching page:", error);
    return null;
  }
}

// Generate metadata for social sharing
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageData(slug);
  
  if (!page) {
    return {
      title: "Page Not Found | Zidwell",
      description: "The requested payment page could not be found.",
    };
  }

  // Determine the featured image (cover image or first product image)
  let featuredImage = page.coverImage;
  if (!featuredImage && page.productImages && page.productImages.length > 0) {
    featuredImage = page.productImages[0];
  }

  // If still no image, use a default image
  const defaultImage = `https://zidwell.com/zidwell-og-image.png`;
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
  
  // Create description
  const description = page.description 
    ? `${page.title} - ${page.description.substring(0, 150)}...` 
    : `Pay for ${page.title} securely on Zidwell. ${pageTypeLabel} payment made easy.`;

  return {
    title: `${page.title} | Zidwell Payment`,
    description: description,
    openGraph: {
      title: `${page.title} | Pay Securely on Zidwell`,
      description: description,
      url: `https://zidwell.com/pay/${page.slug}`,
      siteName: "Zidwell",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: page.title,
        },
      ],
      locale: "en_NG",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${page.title} | Zidwell Payment`,
      description: description,
      images: [imageUrl],
      creator: "@zidwell",
      site: "@zidwell",
    },
    robots: {
      index: true,
      follow: true,
    },
    keywords: [`${page.title}`, pageTypeLabel, "payment", "Zidwell", "online payment"],
  };
}

// Server component that renders the client component
export default async function PaymentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PaymentPageClient slug={slug} />;
}