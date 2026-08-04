// app/lib/seo.ts
import { Metadata } from "next";

export const siteConfig = {
  name: "Zidwell",
  description:
    "All-in-one finance and business management platform for Nigerian SMEs. Professional accounting, invoicing, contracts, receipts, and financial tools.",
  url: "https://zidwell.com",
  ogImage: "https://zidwell.com/images/og-image.png",
  twitterImage: "https://zidwell.com/images/twitter-card.jpg",
  locale: "en_NG",
  type: "website" as const,
};

// ─── Schema.org Generators ───

export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Zidwell",
    alternateName: "Zidwell Finance Platform",
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    image: `${siteConfig.url}/logo.png`,
    description: siteConfig.description,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Lagos",
      addressCountry: "NG",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+234-7069175399",
      contactType: "customer service",
      areaServed: "NG",
      availableLanguage: "en",
    },
    sameAs: [
      "https://twitter.com/zidwellapp",
      "https://linkedin.com/company/zidwell",
      "https://facebook.com/zidwellapp",
    ],
  };
}

export function generateWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Zidwell",
    url: siteConfig.url,
    description: siteConfig.description,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteConfig.url}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function generateBreadcrumbSchema(
  items: { name: string; item: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.item.startsWith("http") ? item.item : `${siteConfig.url}${item.item}`,
    })),
  };
}

export function generateSignupPageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Sign Up for Zidwell",
    url: `${siteConfig.url}/auth/signup`,
    description:
      "Create your free Zidwell account to access business finance tools, invoicing, contracts, and accounting services.",
    mainEntity: {
      "@type": "CreateAccountAction",
      name: "Create Account",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/auth/signup`,
        actionPlatform: [
          "http://schema.org/DesktopWebPlatform",
          "http://schema.org/IOSPlatform",
          "http://schema.org/AndroidPlatform",
        ],
      },
    },
  };
}

export function generateSoftwareAppSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Zidwell",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web, iOS, Android",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "NGN",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "1250",
    },
    description: siteConfig.description,
    url: siteConfig.url,
    image: `${siteConfig.url}/logo.png`,
    author: {
      "@type": "Organization",
      name: "Zidwell Technologies",
    },
  };
}

export function generateLocalBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Zidwell",
    image: `${siteConfig.url}/logo.png`,
    url: siteConfig.url,
    telephone: "+234-7069175399",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Lagos",
      addressCountry: "NG",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "6.5244",
      longitude: "3.3792",
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "17:00",
    },
    priceRange: "$$",
    areaServed: "Nigeria",
  };
}

// ─── Metadata Generator ───

interface PageMetaOptions {
  title: string;
  description?: string;
  keywords?: string[];
  pathname: string;
  ogImage?: string;
  ogType?: "website" | "article";
  noIndex?: boolean;
  canonical?: string;
}

export function generatePageMetadata(options: PageMetaOptions): Metadata {
  const {
    title,
    description = siteConfig.description,
    keywords = [],
    pathname,
    ogImage = siteConfig.ogImage,
    ogType = "website",
    noIndex = false,
    canonical,
  } = options;

  const url = `${siteConfig.url}${pathname}`;
  const canonicalUrl = canonical ? `${siteConfig.url}${canonical}` : url;

  return {
    title: `${title} | Zidwell Business Tools`,
    description,
    keywords: [
      "Zidwell",
      "Nigeria",
      "SME",
      "business finance",
      "invoicing",
      "accounting",
      ...keywords,
    ],
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${title} | Zidwell`,
      description,
      url,
      siteName: "Zidwell",
      locale: siteConfig.locale,
      type: ogType,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${title} - Zidwell Business Finance Platform`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@zidwellapp",
      creator: "@zidwellapp",
      title: `${title} | Zidwell`,
      description,
      images: [ogImage],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
  };
}