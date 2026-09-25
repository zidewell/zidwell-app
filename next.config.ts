
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Image optimization
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "zidwell.com",
      },
    ],
    formats: ["image/webp", "image/avif"],
  },

  // SEO / Performance
  trailingSlash: false,
  poweredByHeader: false,
  compress: true,

  // Remove unnecessary console output in production.
  // Keep warn/error available for debugging.
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },

  // Webpack configuration
  webpack: (config) => {
    if (!config.ignoreWarnings) {
      config.ignoreWarnings = [];
    }

    config.ignoreWarnings.push(
      {
        module: /@supabase\/realtime-js/,
      },
      {
        message:
          /Critical dependency: the request of a dependency is an expression/,
      },
    );

    return config;
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },

      {
        source: "/sitemap.xml",
        headers: [
          {
            key: "Content-Type",
            value: "application/xml; charset=utf-8",
          },
        ],
      },

      {
        source: "/robots.txt",
        headers: [
          {
            key: "Content-Type",
            value: "text/plain; charset=utf-8",
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: "/home",
        destination: "/",
        permanent: true,
      },

      {
        source: "/signin",
        destination: "/auth/login",
        permanent: true,
      },

      {
        source: "/register",
        destination: "/auth/signup",
        permanent: true,
      },
    ];
  },

  // Environment variables
  env: {
    SITE_URL: process.env.SITE_URL || "zidwell.com",
    SITE_NAME: "Zidwell",
  },
};

export default nextConfig;
