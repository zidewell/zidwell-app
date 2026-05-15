import { ImageResponse } from "next/og";
import { getPostBySlug } from "@/lib/blog";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  // If post has a featured image, use it directly
  if (post?.featured_image) {
    try {
      const response = await fetch(post.featured_image);
      if (response.ok) {
        return new Response(await response.arrayBuffer(), {
          headers: {
            "Content-Type":
              response.headers.get("content-type") || "image/jpeg",
            "Cache-Control": "public, max-age=86400",
          },
        });
      }
    } catch (error) {
      console.error("Error fetching featured image:", error);
    }
  }

  // Fallback: Generate image with text
  return new ImageResponse(
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
          fontSize: "56px",
          fontWeight: "bold",
          color: "white",
          textAlign: "center",
          marginBottom: "24px",
          maxWidth: "80%",
        }}
      >
        {post?.title || "Zidwell Blog"}
      </div>
      {post?.excerpt && (
        <div
          style={{
            fontSize: "28px",
            color: "#B0B0B0",
            textAlign: "center",
            maxWidth: "80%",
          }}
        >
          {post.excerpt.length > 120
            ? post.excerpt.substring(0, 120) + "..."
            : post.excerpt}
        </div>
      )}
      <div
        style={{
          marginTop: "48px",
          fontSize: "24px",
          color: "#FDC020",
        }}
      >
        zidwell.com/blog
      </div>
    </div>,
    size,
  );
}
