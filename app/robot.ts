// app/robots.ts
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/_next/",
          "/admin/",
          "/dashboard/",
          "/auth/",
          "/private/",
          "/blog/admin/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/", "/admin/", "/dashboard/", "/blog/admin/"],
      },
    ],
    sitemap: "https://zidwell.com/sitemap.xml",
    host: "https://zidwell.com",
  };
}