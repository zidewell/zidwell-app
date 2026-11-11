// app/layout.tsx
import type { Metadata, Viewport } from "next";
import {
  Space_Grotesk,
  Be_Vietnam_Pro,
  Oswald,
  Archivo_Narrow,
} from "next/font/google";
import "./globals.css";
import { UserProvider } from "./context/userData";
import SessionWatcher from "./components/SessionWatcher";
import NotificationToast from "./components/NotificationToast";
import FloatingWhatsApp from "./components/FloatingWhatsapp";
import Script from "next/script";
import { InstallPrompt } from "./components/PushNotificationManager";
import { VerificationModalProvider } from "./context/verificationModalContext";
import { StoreProvider } from "./hooks/useStore";
import { ThemeProvider } from "./components/ThemeProvider";
import { ThemeWrapper } from "./components/ThemeWrapper";
import {
  generateOrganizationSchema,
  generateWebsiteSchema,
  generateSoftwareAppSchema,
  generateLocalBusinessSchema,
  generateZidStoreMetadata,
  generpZELkorMwhkkpShF5PvT8YnqRCupnLTNG,
  ZIDSTORE_HOST,
  ZIDSTORE_OG_IMAGE,
} from "@/lib/seo";
import { BlogProvider } from "./context/BlogContext";
import { headers } from "next/headers";
import { ToasterProvider } from "./components/ToasterProvider";
import { Toaster } from "./components/ui/sonner";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-be-vietnam",
  display: "swap",
});

const archivoNarrow = Archivo_Narrow({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-agrandir-narrow",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5B800" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get("host")?.split(":")[0]?.toLowerCase();
  const isZidStore = Boolean(ZIDSTORE_HOST && host === ZIDSTORE_HOST);

  const shared: Metadata = {
    applicationName: isZidStore ? "ZidStore" : "Zidwell",
    authors: [{ name: "Zidwell Team", url: "https://zidwell.com" }],
    creator: "Zidwell Technologies",
    publisher: "Zidwell",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: isZidStore ? "ZidStore" : "Zidwell",
    },
    formatDetection: {
      telephone: false,
      email: false,
      address: false,
    },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
        { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [
        { url: "/apple-touch-icon.png" },
        { url: "/icon-152x152.png", sizes: "152x152", type: "image/png" },
        { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      ],
      shortcut: "/favicon.ico",
    },
    manifest: "/manifest.json",
    other: {
      ...(isZidStore
        ? {}
        : {
            "google-site-verification":
              "google-site-verification=rBgRfj247s1PVKZyJC6VRnl_xJxFOo2exemDkjUxEm4",
          }),
    },
  };

  if (isZidStore) {
    const zidStoreMeta = generateZidStoreMetadata();
    return {
      ...shared,
      ...zidStoreMeta,
      metadataBase: zidStoreMeta.metadataBase,
      title: zidStoreMeta.title,
      description: zidStoreMeta.description,
      alternates: zidStoreMeta.alternates,
      openGraph: zidStoreMeta.openGraph,
      twitter: zidStoreMeta.twitter,
    };
  }

  // ── Zidwell (main site) — now includes openGraph + twitter ────────────────
  const zidwellTitle =
    "Zidwell — Finance & Business Management for Nigerian SMEs";
  const zidwellDescription =
    "All-in-one finance and business management platform for Nigerian SMEs. Professional accounting, invoicing, contracts, receipts, and financial tools.";
  const zidwellOgImage = "https://zidwell.com/zidwell-cover-meta.png";

  return {
    ...shared,
    metadataBase: new URL("https://zidwell.com"),
    category: "Finance & Business Management",
    classification: "Business, Finance, Accounting, SME Tools",
    title: {
      default: zidwellTitle,
      template: "%s | Zidwell",
    },
    description: zidwellDescription,
    alternates: {
      canonical: "https://zidwell.com",
    },
    openGraph: {
      type: "website",
      locale: "en_NG",
      url: "https://zidwell.com",
      siteName: "Zidwell",
      title: zidwellTitle,
      description: zidwellDescription,
      images: [
        {
          url: zidwellOgImage,
          width: 1200,
          height: 630,
          alt: "Zidwell — Finance & Business Management for Nigerian SMEs",
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@zidwellapp",
      creator: "@zidwellapp",
      title: zidwellTitle,
      description: zidwellDescription,
      images: [zidwellOgImage],
    },
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
  };
}

const THEME_INIT_SCRIPT = `
  try {
    var theme = localStorage.getItem('zidwell-theme');
    var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    var resolved = theme === 'system' ? systemTheme : (theme || systemTheme);
    if (resolved === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {}
`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const host = (await headers()).get("host")?.split(":")[0]?.toLowerCase();
  const isZidStore = Boolean(ZIDSTORE_HOST && host === ZIDSTORE_HOST);

  const zidwellSchemas = isZidStore
    ? []
    : [
        generateOrganizationSchema(),
        generateWebsiteSchema(),
        generateSoftwareAppSchema(),
        generateLocalBusinessSchema(),
      ];

  const zidStoreSchemas = isZidStore
    ? generpZELkorMwhkkpShF5PvT8YnqRCupnLTNG()
    : [];

  const allSchemas = [...zidwellSchemas, ...zidStoreSchemas];

  return (
    <html
      lang="en-NG"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${beVietnamPro.variable} ${archivoNarrow.variable}`}
    >
      <head>
        {allSchemas.map((schema, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}

        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
        {!isZidStore && (
          <link
            rel="alternate"
            type="application/rss+xml"
            href="/blog/rss.xml"
          />
        )}

        <link rel="preconnect" href="https://cdn.zidwell.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        <link rel="preload" href="/logo.png" as="image" type="image/png" />
        <link
          rel="preload"
          href={isZidStore ? ZIDSTORE_OG_IMAGE : "/zidwell-cover-meta.png"}
          as="image"
          type="image/png"
        />

        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/tubeplayer@0.4.0/dist/style.css"
        />
      </head>
      <body
        className="bg-(--bg-primary) text-(--text-primary) antialiased"
        suppressHydrationWarning={true}
      >
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />

        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');
          `}
        </Script>

        {!isZidStore && (
          <Script
            id="adsbygoogle-init"
            strategy="afterInteractive"
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3255896105120976"
            crossOrigin="anonymous"
          />
        )}

        <ThemeProvider>
          <Toaster richColors position="top-center" />
          <ThemeWrapper>
            <UserProvider>
              <BlogProvider>
                <SessionWatcher>
<<<<<<< HEAD
               
                    <VerificationModalProvider>
                      <StoreProvider>
                        {children}
                        <IdentityVerificationModal />
                        {/* <div className="fixed bottom-4 right-4 z-50">
                          <InstallPrompt />
                        </div> */}
=======
                  <VerificationModalProvider>
                    <StoreProvider>
                      {children}
                      <GlobalVerificationModal />
>>>>>>> 99ce893ff767696abfe1d4ced95064a061765be2
                      <FloatingWhatsApp />
                      <ToasterProvider />
                    </StoreProvider>
                  </VerificationModalProvider>
                </SessionWatcher>
              </BlogProvider>
            </UserProvider>
          </ThemeWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}