// app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { UserProvider } from "./context/userData";
import SessionWatcher from "./components/SessionWatcher";
import FloatingHelpButton from "./components/FloatingHelpButton";
import NotificationToast from "./components/NotificationToast";
import FloatingWhatsApp from "./components/FloatingWhatsapp";
import Script from "next/script";
import DashboardFooter from "./components/dashboardFooter";


export const viewport: Viewport = {
  themeColor: "#C29307",
  width: "device-width",
  initialScale: 1,
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Zidwell",
  alternateName: "Zidwell Finance Platform",
  url: "https://zidwell.com",
  logo: "https://zidwell.com/logo.png",
  image: "https://zidwell.com/logo.png",
  description: "All-in-one finance and business management platform for Nigerian SMEs. Professional accounting, invoicing, contracts, receipts, and financial tools.",
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
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://zidwell.com/search?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Zidwell",
  url: "https://zidwell.com",
  description: "Professional finance and business tools for Nigerian SMEs. Create invoices, receipts, contracts, manage accounting, and grow your business.",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://zidwell.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

// UPDATED BREADCRUMB WITH ALL PAGES INCLUDED
const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://zidwell.com",
      description: "Business Finance & Management Platform"
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "App Dashboard",
      item: "https://zidwell.com/app",
      description: "All-in-One Business Tools Dashboard"
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Invoice Generator",
      item: "https://zidwell.com/features/invoice",
      description: "Professional Invoice Generator for Nigerian Businesses"
    },
    {
      "@type": "ListItem",
      position: 4,
      name: "Receipt Maker",
      item: "https://zidwell.com/features/receipt",
      description: "Digital Receipt Creation & Management"
    },
    {
      "@type": "ListItem",
      position: 5,
      name: "Contract Creator",
      item: "https://zidwell.com/features/contract",
      description: "Legal Contract Templates for Businesses"
    },
    {
      "@type": "ListItem",
      position: 6,
      name: "Blog",
      item: "https://zidwell.com/blog",
      description: "Business & Finance Tips for Nigerian Entrepreneurs"
    },
    {
      "@type": "ListItem",
      position: 7,
      name: "FAQ",
      item: "https://zidwell.com/faq",
      description: "Frequently Asked Questions about Zidwell"
    },
    {
      "@type": "ListItem",
      position: 8,
      name: "Contact",
      item: "https://zidwell.com/contact",
      description: "Contact Zidwell Support Team"
    },
    {
      "@type": "ListItem",
      position: 9,
      name: "Sign Up",
      item: "https://zidwell.com/auth/signup",
      description: "Create Your Free Zidwell Account"
    },
    {
      "@type": "ListItem",
      position: 10,
      name: "Login",
      item: "https://zidwell.com/auth/login",
      description: "Login to Your Zidwell Account"
    },
    {
      "@type": "ListItem",
      position: 11,
      name: "Pricing",
      item: "https://zidwell.com/pricing",
      description: "Zidwell Pricing Plans & Packages"
    }
  ],
};

// ADDITIONAL SCHEMA FOR SIGNUP/LOGIN PAGES
const signupPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Sign Up for Zidwell",
  "url": "https://zidwell.com/auth/signup",
  "description": "Create your free Zidwell account to access business finance tools, invoicing, contracts, and accounting services.",
  "mainEntity": {
    "@type": "CreateAccountAction",
    "name": "Create Account",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://zidwell.com/auth/signup",
      "actionPlatform": [
        "http://schema.org/DesktopWebPlatform",
        "http://schema.org/IOSPlatform",
        "http://schema.org/AndroidPlatform"
      ]
    }
  }
};

export const metadata: Metadata = {
  title: {
    default: "Zidwell | All-in-One Finance & Business Management Platform for Nigerian SMEs",
    template: "%s | Zidwell Business Tools",
  },
  description: "Zidwell helps Nigerian businesses with invoicing, receipts, contracts, accounting, tax filing, and financial management. All-in-one platform for SMEs, freelancers, and entrepreneurs.",
  keywords: [
    // ALL YOUR PAGES KEYWORDS
    "Zidwell sign up", "Zidwell login", "create Zidwell account",
    
    // INVOICE PAGE KEYWORDS
    "invoice generator Nigeria", "online invoice maker Nigeria", "professional invoice Nigeria",
    "business invoice software Nigeria", "free invoice generator Nigeria",
    
    // RECEIPT PAGE KEYWORDS
    "digital receipt Nigeria", "receipt maker online Nigeria", "business receipt generator",
    "proof of payment Nigeria", "digital receipt creator",
    
    // CONTRACT PAGE KEYWORDS
    "contract creator Nigeria", "business contract templates Nigeria", "legal contracts Nigeria",
    "simple contract maker Nigeria", "freelance contract Nigeria",
    
    // BLOG PAGE KEYWORDS
    "business blog Nigeria", "SME tips Nigeria", "entrepreneur blog Nigeria",
    "finance education Nigeria", "business growth blog",
    
    // ACCOUNTING KEYWORDS
    "accounting services for small businesses in Nigeria",
    "small business accounting Nigeria", "online accounting services in Nigeria",
    
    // HIGH-INTENT CONVERSION
    "sign up for Zidwell", "create free account", "try Zidwell free",
    "Zidwell pricing", "Zidwell features", "how to use Zidwell",
    
    // ORIGINAL KEYWORDS
    "business bill payment Nigeria", "SME financial management",
    "pay electricity bills online", "business tax filing Nigeria",
    "business banking Nigeria", "fintech platform Nigeria",
    "business tools Nigeria", "digital finance Nigeria",
  ],
  authors: [{ name: "Zidwell Team", url: "https://zidwell.com" }],
  creator: "Zidwell Technologies",
  publisher: "Zidwell",
  applicationName: "Zidwell",
  metadataBase: new URL("https://zidwell.com"),
  alternates: {
    canonical: "https://zidwell.com",
    languages: {
      "en-US": "https://zidwell.com",
      "en-NG": "https://zidwell.com",
    },
  },
  openGraph: {
    title: "Zidwell | Finance & Business Tools for Nigerian SMEs",
    description: "Create invoices, receipts, contracts, manage finances, and grow your business with Zidwell. All-in-one platform for Nigerian entrepreneurs.",
    url: "https://zidwell.com",
    siteName: "Zidwell",
    locale: "en_NG",
    type: "website",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Zidwell - Business Finance & Management Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@zidwellapp",
    creator: "@zidwellapp",
    title: "Zidwell | Business Finance Platform Nigeria",
    description: "Invoicing, contracts, receipts, accounting & financial tools for Nigerian businesses. Start free today.",
    images: ["/images/twitter-card.jpg"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      {
        url: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
  manifest: "/site.webmanifest",
  robots: {
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
  category: "Finance & Business Management",
  other: {
    "google-site-verification": "google-site-verification=rBgRfj247s1PVKZyJC6VRnl_xJxFOo2exemDkjUxEm4",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-NG">
      <head>
        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(signupPageSchema) }}
        />

        {/* IMPORTANT: Add sitemap.xml and navigation links */}
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
        <link rel="alternate" type="application/rss+xml" href="/blog/rss.xml" />
        
        {/* Navigation links for search engines */}
        <link rel="canonical" href="https://zidwell.com" />
        <link rel="alternate" href="https://zidwell.com/app" hrefLang="en-NG" />
        <link rel="alternate" href="https://zidwell.com/features/invoice" hrefLang="en-NG" />
        <link rel="alternate" href="https://zidwell.com/features/receipt" hrefLang="en-NG" />
        <link rel="alternate" href="https://zidwell.com/features/contract" hrefLang="en-NG" />
        <link rel="alternate" href="https://zidwell.com/blog" hrefLang="en-NG" />
        <link rel="alternate" href="https://zidwell.com/faq" hrefLang="en-NG" />
        <link rel="alternate" href="https://zidwell.com/contact" hrefLang="en-NG" />
        <link rel="alternate" href="https://zidwell.com/auth/signup" hrefLang="en-NG" />
        <link rel="alternate" href="https://zidwell.com/auth/login" hrefLang="en-NG" />
        <link rel="alternate" href="https://zidwell.com/pricing" hrefLang="en-NG" />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />

        {/* Preload critical resources */}
        <link rel="preload" href="/logo.png" as="image" />
        <link rel="preload" href="/hero-image.jpg" as="image" />
        
        {/* Preconnect to CDNs */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.zidwell.com" />
      </head>
      <body className={``}>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-53ERCPQ8HD"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-53ERCPQ8HD');
          `}
        </Script>

        <UserProvider>

          <SessionWatcher>
            {children}

            <FloatingWhatsApp />
            {/* <FloatingHelpButton /> */}
            <NotificationToast />
            <DashboardFooter />
          </SessionWatcher>
        </UserProvider>
      </body>
    </html>
  );
}