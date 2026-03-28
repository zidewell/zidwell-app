// app/sitemap.ts
import { MetadataRoute } from "next";

interface BlogPost {
  id: string;
  slug: string;
  updated_at?: string;
  created_at: string;
  is_published: boolean;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://zidwell.com";
  
  let blogPosts: BlogPost[] = [];
  try {
    // Use your blog API endpoint
    const response = await fetch(`${baseUrl}/api/blog/posts?published=true&limit=100`, {
      next: { revalidate: 3600 }
    });
    
    if (response.ok) {
      const data = await response.json();
      // Handle different response structures
      blogPosts = data.posts || data || [];
      console.log(`Fetched ${blogPosts.length} blog posts for sitemap`);
    } else {
      console.error('Failed to fetch blog posts for sitemap:', response.status);
    }
  } catch (error) {
    console.error('Error fetching blog posts for sitemap:', error);
  }
  
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];
  
  const blogPages: MetadataRoute.Sitemap = blogPosts
    .filter(post => post.is_published)
    .map((post) => ({
      url: `${baseUrl}/blog/post-blog/${post.slug}`,
      lastModified: post.updated_at ? new Date(post.updated_at) : new Date(post.created_at),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  
  return [...staticPages, ...blogPages];
}