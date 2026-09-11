// app/blog/post-blog/[slug]/opengraph-image.tsx
import { ImageResponse } from "next/og";
import { cache } from "react";
import { getPostBySlug } from "@/lib/blog";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Zidwell Blog Post";

const baseUrl = "https://zidwell.com";
const getPostCached = cache(async (slug: string) => getPostBySlug(slug));

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostCached(slug);

  // If the post has a featured image, proxy it directly.
  // No text, no overlay, no dimming — just the image.
  if (post?.featured_image) {
    try {
      const imageUrl = post.featured_image.startsWith("http")
        ? post.featured_image
        : `${baseUrl}${post.featured_image.startsWith("/") ? "" : "/"}${post.featured_image}`;

      const res = await fetch(imageUrl, { cache: "force-cache" });
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        const upstreamType = res.headers.get("content-type") || "image/jpeg";

        return new Response(buffer, {
          headers: {
            "Content-Type": upstreamType,
            "Cache-Control": "public, max-age=86400, immutable",
          },
        });
      }
    } catch (err) {
      console.error("Failed to proxy featured image for OG:", err);
    }
  }

  // Fallback for posts without a featured image:
  // generate a plain branded card (no excerpt, minimal text).
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0A0A0A",
          padding: "60px",
        }}
      >
        <div
          style={{
            fontSize: 56,
            fontWeight: "bold",
            color: "white",
            textAlign: "center",
            maxWidth: "85%",
            lineHeight: 1.2,
          }}
        >
          {post?.title || "Zidwell Blog"}
        </div>
        <div style={{ marginTop: 48, fontSize: 24, color: "#FDC020" }}>
          zidwell.com/blog
        </div>
      </div>
    ),
    size
  );
}