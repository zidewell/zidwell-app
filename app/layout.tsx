// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { UserProvider } from "./context/userData";
import SessionWatcher from "./components/SessionWatcher";
import { SessionRestore } from "./components/SessionRestore";
import NotificationToast from "./components/NotificationToast";
import FloatingWhatsApp from "./components/FloatingWhatsapp";
import Script from "next/script";
import { InstallPrompt } from "./components/PushNotificationManager";
import GlobalVerificationModal from "./components/GlobalVerificationModal";
import { VerificationModalProvider } from "./context/verificationModalContext";
import AuthChecker from "./components/AuthChecker";
import { StoreProvider } from "./hooks/useStore";
import { ThemeProvider } from "./components/ThemeProvider";
import { ThemeWrapper } from "./components/ThemeWrapper";
import {
  generateOrganizationSchema,
  generateWebsiteSchema,
  generateSoftwareAppSchema,
  generateLocalBusinessSchema,
} from "@/lib/seo";
import { BlogProvider } from "./context/BlogContext";

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

// ✅ FIXED: Removed maximumScale and userScalable lock (accessibility + SEO penalty)
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FDC020" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },
  ],
  width: "device-width",
  initialScale: 1,
  // REMOVED: maximumScale: 1, userScalable: false (bad for a11y & SEO)
};

// ✅ FIXED: Root metadata only contains GLOBAL tags.
// Page-specific metadata (title, canonical, OG, etc.) is set in each page.tsx.
export const metadata: Metadata = {
  metadataBase: new URL("https://zidwell.com"),
  applicationName: "Zidwell",
  authors: [{ name: "Zidwell Team", url: "https://zidwell.com" }],
  creator: "Zidwell Technologies",
  publisher: "Zidwell",
  category: "Finance & Business Management",
  classification: "Business, Finance, Accounting, SME Tools",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Zidwell",
    startupImage: "/splash/launch.png",
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
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png" },
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.json",
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
  const organizationSchema = generateOrganizationSchema();
  const websiteSchema = generateWebsiteSchema();
  const softwareAppSchema = generateSoftwareAppSchema();
  const localBusinessSchema = generateLocalBusinessSchema();

  return (
    <html
      lang="en-NG"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${beVietnamPro.variable}`}
    >
      <head>
        {/* Theme initialization — prevents flash of wrong theme */}
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

        {/* Service Worker Registration for PWA */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('ServiceWorker registration successful');
                    })
                    .catch(function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    });
                });
              }
            `,
          }}
        />

        {/* ✅ GLOBAL Structured Data (valid on every page) */}
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />

        {/* Sitemap */}
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
        <link rel="alternate" type="application/rss+xml" href="/blog/rss.xml" />

        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://cdn.zidwell.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Preload critical resources */}
        <link rel="preload" href="/logo.png" as="image" type="image/png" />
        <link rel="preload" href="/images/og-image.png" as="image" type="image/png" />

        {/* iOS launch image */}
        <link rel="apple-touch-startup-image" href="/splash/launch.png" />
      </head>
      <body
        className="bg-(--bg-primary) text-(--text-primary) antialiased"
        suppressHydrationWarning={true}
      >
        {/* Google Analytics */}
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

        {/* Google AdSense */}
        <Script
          id="adsbygoogle-init"
          strategy="afterInteractive"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3255896105120976"
          crossOrigin="anonymous"
        />

        <ThemeProvider>
          <ThemeWrapper>
            <UserProvider>
                <BlogProvider>
              <SessionRestore>
                <SessionWatcher>
                  <AuthChecker>
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
                  </AuthChecker>
                </SessionWatcher>
              </SessionRestore>
              </BlogProvider>
            </UserProvider>
          </ThemeWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}