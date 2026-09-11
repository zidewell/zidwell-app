// app/blog/post-blog/[slug]/opengraph-image.tsx
import { ImageResponse } from "next/og";
import { getPostBySlug } from "@/lib/blog";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png"; // ← Guaranteed correct MIME
export const alt = "Zidwell Blog Post";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  const title = post?.title || "Zidwell Blog";
  const excerpt = post?.excerpt || "";
  const trimmedExcerpt =
    excerpt.length > 120 ? excerpt.substring(0, 120).trimEnd() + "..." : excerpt;

  // Optionally try to render the featured image inside the card.
  // If it fails to fetch or is not a valid image, we fall back to
  // text-only. `ImageResponse` will throw on bad images, so wrap in try.
  let featuredImageDataUrl: string | null = null;
  if (post?.featured_image) {
    try {
      const imageUrl = post.featured_image.startsWith("http")
        ? post.featured_image
        : `https://zidwell.com${
            post.featured_image.startsWith("/") ? "" : "/"
          }${post.featured_image}`;

      const res = await fetch(imageUrl, { cache: "force-cache" });
      if (res.ok) {
        const contentTypeHeader = res.headers.get("content-type") || "";
        // Only embed if it's actually an image — otherwise skip
        if (contentTypeHeader.startsWith("image/")) {
          const buffer = await res.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");
          featuredImageDataUrl = `data:${contentTypeHeader};base64,${base64}`;
        }
      }
    } catch {
      // Silent fail — we'll just render the text card
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0A0A0A",
          padding: "60px",
          position: "relative",
        }}
      >
        {featuredImageDataUrl ? (
          // Background image + dark overlay + text on top
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={featuredImageDataUrl}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: 0.35,
              }}
            />
          </div>
        ) : null}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: 56,
              fontWeight: "bold",
              color: "white",
              textAlign: "center",
              marginBottom: 24,
              maxWidth: "90%",
              lineHeight: 1.2,
            }}
          >
            {title}
          </div>

          {trimmedExcerpt ? (
            <div
              style={{
                fontSize: 28,
                color: "#D0D0D0",
                textAlign: "center",
                maxWidth: "85%",
                lineHeight: 1.4,
              }}
            >
              {trimmedExcerpt}
            </div>
          ) : null}

          <div
            style={{
              marginTop: 48,
              fontSize: 24,
              color: "#FDC020",
              fontWeight: "bold",
            }}
          >
            zidwell.com/blog
          </div>
        </div>
      </div>
    ),
    size
  );
}