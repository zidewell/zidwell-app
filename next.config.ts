/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: "export", // Only enable for static export
  reactStrictMode: true,
  images: {
    unoptimized: true,
    domains: ["zidwell.com"],
    formats: ["image/webp", "image/avif"],
  },

  // SEO Optimizations
  trailingSlash: false,
  poweredByHeader: false, // Remove X-Powered-By header
  compress: true, // Enable compression

  // Headers for security and SEO
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

  // Environment variables for SEO
  env: {
    SITE_URL: process.env.SITE_URL || "zidwell.com",
    SITE_NAME: "Zidwell",
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

module.exports = nextConfig;
