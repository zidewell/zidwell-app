// app/blog/layout.tsx
import type { Metadata } from "next";

const baseUrl = "https://zidwell.com";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "Blog",
  description:
    "Business tips, growth strategies and insights for Nigerian SMEs.",
  openGraph: {
    title: "Zidwell Blog",
    description:
      "Business tips, growth strategies and insights for Nigerian SMEs.",
    url: `${baseUrl}/blog`,
    siteName: "Zidwell Blog",
    type: "website",
    locale: "en_NG",
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
    title: "Zidwell Blog",
    description:
      "Business tips, growth strategies and insights for Nigerian SMEs.",
    images: [`${baseUrl}/images/og-image.png`],
  },
  alternates: {
    canonical: `${baseUrl}/blog`,
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}