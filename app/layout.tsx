// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Be_Vietnam_Pro, Oswald } from "next/font/google";
import "./globals.css";
import { UserProvider } from "./context/userData";
import SessionWatcher from "./components/SessionWatcher";
import NotificationToast from "./components/NotificationToast";
import FloatingWhatsApp from "./components/FloatingWhatsapp";
import Script from "next/script";
import { InstallPrompt } from "./components/PushNotificationManager";
import GlobalVerificationModal from "./components/GlobalVerificationModal";
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
  generateZidStorePageSchemaArray,
  ZIDSTORE_HOST,
  ZIDSTORE_OG_IMAGE,
} from "@/lib/seo";
import { BlogProvider } from "./context/BlogContext";
import { headers } from "next/headers";

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

// ─── Narrow display font for h1 (Oswald = free stand-in for Agrandir Narrow) ───
// The CSS variable is named `--font-agrandir-narrow` on purpose so that
// globals.css can keep its `h1 { font-family: var(--font-agrandir-narrow), ... }`
// rule unchanged. Swapping to the real licensed Agrandir Narrow later means
// only replacing this block with `next/font/local` — nothing else changes.
const oswald = Oswald({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-agrandir-narrow",
  display: "swap",
});

// ✅ FIXED: Removed maximumScale and userScalable lock (accessibility + SEO penalty)
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FDC020" },
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

  return {
    ...shared,
    metadataBase: new URL("https://zidwell.com"),
    category: "Finance & Business Management",
    classification: "Business, Finance, Accounting, SME Tools",
    title: {
      default: "Zidwell — Finance & Business Management for Nigerian SMEs",
      template: "%s | Zidwell",
    },
    description:
      "All-in-one finance and business management platform for Nigerian SMEs. Professional accounting, invoicing, contracts, receipts, and financial tools.",
  };
}

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
    ? generateZidStorePageSchemaArray()
    : [];

  const allSchemas = [...zidwellSchemas, ...zidStoreSchemas];

  return (
    <html
      lang="en-NG"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${beVietnamPro.variable} ${oswald.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                let theme = localStorage.getItem('zidwell-theme');
                let systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                let resolved = theme === 'system' ? systemTheme : (theme || systemTheme);
                if (resolved === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />

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
          href={isZidStore ? ZIDSTORE_OG_IMAGE : "/images/og-image.png"}
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
          <ThemeWrapper>
            <UserProvider>
              <BlogProvider>
                <SessionWatcher>
                  <VerificationModalProvider>
                    <StoreProvider>
                      {children}
                      <GlobalVerificationModal />
                      {/* <div className="fixed bottom-4 right-4 z-50">
                        <InstallPrompt />
                      </div> */}
                      <FloatingWhatsApp />
                      {/* <NotificationToast /> */}
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