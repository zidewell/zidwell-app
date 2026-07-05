// app/blog/rss.xml/route.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const baseUrl = "https://zidwell.com";
  
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(20);

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Zidwell Blog</title>
    <link>${baseUrl}/blog</link>
    <description>Business tips for Nigerian SMEs</description>
    ${posts?.map(post => `
    <item>
      <title>${post.title}</title>
      <link>${baseUrl}/blog/post-blog/${post.slug}</link>
      <description>${post.excerpt || ''}</description>
      <pubDate>${new Date(post.created_at).toUTCString()}</pubDate>
    </item>
    `).join('')}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: { 'Content-Type': 'application/rss+xml' },
  });
}