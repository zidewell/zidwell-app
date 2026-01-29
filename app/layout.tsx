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
import { BlogProvider } from "./context/BlogContext";

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
  description:
    "All-in-one finance and business management platform for Nigerian SMEs and professionals",
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
  description:
    "All-in-one finance and business management platform for Nigerian SMEs and professionals",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://zidwell.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://zidwell.com",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Sign Up",
      item: "https://zidwell.com/auth/signup",
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Login",
      item: "https://zidwell.com/auth/login",
    },
    {
      "@type": "ListItem",
      position: 4,
      name: "Pricing",
      item: "https://zidwell.com/#pricing",
    },
    {
      "@type": "ListItem",
      position: 5,
      name: "Features",
      item: "https://zidwell.com/#features",
    },
  ],
};

export const metadata: Metadata = {
  title: {
    default:
      "Zidwell | Business Bill Payment & Financial Management Platform Nigeria",
    template: "%s | Zidwell - SME Finance Platform",
  },
  description:
    "Zidwell helps Nigerian businesses pay electricity bills, buy data, manage finances, file taxes, create contracts & invoices. All-in-one SME financial management platform.",
  keywords: [
    "Zidwell sign up",
    "Zidwell",
    "zidwell",
    "Zidwell login",
    "business bill payment Nigeria",
    "SME financial management",
    "pay electricity bills online",
    "business tax filing Nigeria",
    "invoice generator Nigeria",
    "contract creator Nigeria",
    "business banking Nigeria",
    "fintech platform Nigeria",
    "Zidwell pricing",
    "Zidwell features",
    "business tools Nigeria",
    "digital finance Nigeria",
    "business bill payment platform Nigeria",
    "pay electricity bills online Nigeria",
    "SME financial management tools",
    "business finance app Nigeria",
    "AI-powered bookkeeping Nigeria",
    "business tax filing app Nigeria",
    "contract creator Nigeria",
    "invoice generator online Nigeria",
    "business investment platform Nigeria",
    "savings for business owners Nigeria",
    "fintech Nigeria",
    "small business tools Nigeria",
    "digital banking Nigeria",
    "business automation Nigeria",
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
    title:
      "Zidwell | Business Bill Payment & Financial Management Platform Nigeria",
    description:
      "Pay bills, manage finances, file taxes, create contracts. All-in-one platform for Nigerian SMEs. Simplify your business financial management.",
    url: "https://zidwell.com",
    siteName: "Zidwell",
    locale: "en_NG",
    type: "website",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Zidwell - Business Finance & Bill Payment Platform for Nigerian SMEs",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@zidwellapp",
    creator: "@zidwellapp",
    title: "Zidwell | Business Finance Platform Nigeria",
    description:
      "All-in-one financial management for Nigerian businesses. Bill payments, tax filing, contracts & more.",
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
    "google-site-verification":
      "google-site-verification=rBgRfj247s1PVKZyJC6VRnl_xJxFOo2exemDkjUxEm4",
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

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />

        {/* Preload critical resources */}
        <link rel="preload" href="/logo.png" as="image" />
        {/* <link rel="preload" href="/og-image.jpg" as="image" />
         */}
        {/* Sitemap and RSS feeds */}
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
        <link rel="alternate" type="application/rss+xml" href="/blog/rss.xml" />
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
           <BlogProvider>
          <SessionWatcher>
            {children}

            <FloatingWhatsApp />
            {/* <FloatingHelpButton /> */}
            <NotificationToast />
            <DashboardFooter />
          </SessionWatcher>
          </BlogProvider>
        </UserProvider>
      </body>
    </html>
  );
}
