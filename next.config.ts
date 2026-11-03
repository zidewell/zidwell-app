/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: process.env.NODE_ENV === "production",
  images: {
    unoptimized: true,
    domains: ["zidwell.com"],
    formats: ["image/webp", "image/avif"],
  },

  trailingSlash: false,
  poweredByHeader: false,
  compress: true,

  // 👇 ADD THIS — silences the Turbopack-vs-webpack warning
  turbopack: {},

  webpack: (config) => {
    if (!config.ignoreWarnings) {
      config.ignoreWarnings = [];
    }
    config.ignoreWarnings.push(
      { module: /@supabase\/realtime-js/ },
      {
        message:
          /Critical dependency: the request of a dependency is an expression/,
      }
    );
    return config;
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "origin-when-cross-origin" },
        ],
      },
      {
        source: "/sitemap.xml",
        headers: [{ key: "Content-Type", value: "application/xml; charset=utf-8" }],
      },
      {
        source: "/robots.txt",
        headers: [{ key: "Content-Type", value: "text/plain; charset=utf-8" }],
      },
    ];
  },

  async redirects() {
    return [
      { source: "/home", destination: "/", permanent: true },
      { source: "/signin", destination: "/auth/login", permanent: true },
      { source: "/register", destination: "/auth/signup", permanent: true },
    ];
  },

  env: {
    SITE_URL: process.env.SITE_URL || "zidwell.com",
    SITE_NAME: "Zidwell",
  },
};

module.exports = nextConfig;