// app/blog/post-blog/[slug]/opengraph-image.tsx
import { ImageResponse } from "next/og";
import { cache } from "react";
import { getPostBySlug } from "@/lib/blog";

// ✅ Required exports per Next.js docs
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Zidwell Blog Post";

const baseUrl = "https://zidwell.com";

// Memoize so this doesn't re-fetch if page already fetched it
const getPostCached = cache(async (slug: string) => getPostBySlug(slug));

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostCached(slug);

  const title = post?.title || "Zidwell Blog";
  const excerpt = post?.excerpt || "";
  const trimmedExcerpt =
    excerpt.length > 120
      ? excerpt.substring(0, 120).trimEnd() + "..."
      : excerpt;

  // Try to embed the featured image as a background.
  // Use base64 data URL so ImageResponse doesn't need network access
  // at render time (which can fail on serverless cold starts).
  let featuredImageDataUrl: string | null = null;
  if (post?.featured_image) {
    try {
      const imageUrl = post.featured_image.startsWith("http")
        ? post.featured_image
        : `${baseUrl}${post.featured_image.startsWith("/") ? "" : "/"}${post.featured_image}`;

      const res = await fetch(imageUrl, { cache: "force-cache" });
      if (res.ok) {
        const contentTypeHeader = res.headers.get("content-type") || "";
        // Only embed if it's actually an image — else fall back to text card
        if (contentTypeHeader.startsWith("image/")) {
          const buffer = await res.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");
          featuredImageDataUrl = `data:${contentTypeHeader};base64,${base64}`;
        }
      }
    } catch {
      // Silent fail → text-only card
    }
  }

  return new ImageResponse(
    (
      // ⚠️ Only flexbox is supported — no grid, no advanced CSS.
      // See: https://nextjs.org/docs/app/api-reference/functions/image-response
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
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
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