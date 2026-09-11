// app/blog/rss.xml/route.ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const baseUrl = "https://zidwell.com";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function absoluteImage(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
}

export async function GET() {
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(20);

  const items = (posts || [])
    .map((post) => {
      const link = `${baseUrl}/blog/post-blog/${post.slug}`;
      const image = absoluteImage(post.featured_image);
      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${escapeXml(post.excerpt || "")}</description>
      <pubDate>${new Date(post.created_at).toUTCString()}</pubDate>
      ${image ? `<enclosure url="${image}" type="image/jpeg" />` : ""}
    </item>`;
    })
    .join("");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Zidwell Blog</title>
    <link>${baseUrl}/blog</link>
    <description>Business tips for Nigerian SMEs</description>
    <language>en-NG</language>
    <atom:link href="${baseUrl}/blog/rss.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}