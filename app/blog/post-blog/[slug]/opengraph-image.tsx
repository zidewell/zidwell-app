// app/blog/post-blog/[slug]/opengraph-image.tsx
import { ImageResponse } from "next/og";
import { getPostBySlug } from "@/lib/blog";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Zidwell Blog Post";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  // If the post has a featured image, proxy it as a PNG response.
  // (Next.js will set correct content-type headers automatically.)
  if (post?.featured_image) {
    try {
      const imageUrl = post.featured_image.startsWith("http")
        ? post.featured_image
        : `https://zidwell.com${post.featured_image}`;

      const response = await fetch(imageUrl, { cache: "force-cache" });
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        return new Response(buffer, {
          headers: {
            "Content-Type":
              response.headers.get("content-type") || "image/jpeg",
            "Cache-Control": "public, max-age=86400, immutable",
          },
        });
      }
    } catch (error) {
      console.error("Error fetching featured image for OG:", error);
    }
  }

  // Fallback: generate a branded card with text
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
            marginBottom: 24,
            maxWidth: "80%",
            lineHeight: 1.2,
          }}
        >
          {post?.title || "Zidwell Blog"}
        </div>
        {post?.excerpt && (
          <div
            style={{
              fontSize: 28,
              color: "#B0B0B0",
              textAlign: "center",
              maxWidth: "80%",
              lineHeight: 1.4,
            }}
          >
            {post.excerpt.length > 120
              ? post.excerpt.substring(0, 120) + "..."
              : post.excerpt}
          </div>
        )}
        <div style={{ marginTop: 48, fontSize: 24, color: "#FDC020" }}>
          zidwell.com/blog
        </div>
      </div>
    ),
    size
  );
}