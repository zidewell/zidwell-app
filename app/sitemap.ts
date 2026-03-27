// app/sitemap.ts
import { MetadataRoute } from "next";

// Define the BlogPost type
interface BlogPost {
  id: string;
  slug: string;
  updated_at?: string;
  created_at: string;
  is_published: boolean;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://zidwell.com";
  
  // Fetch all published blog posts
  let blogPosts: BlogPost[] = [];
  try {
    const response = await fetch(`${baseUrl}/api/blog/posts?published=true&limit=100`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (response.ok) {
      const data = await response.json();
      blogPosts = data.posts || [];
      console.log(`Fetched ${blogPosts.length} blog posts for sitemap`);
    } else {
      console.error('Failed to fetch blog posts for sitemap:', response.status);
    }
  } catch (error) {
    console.error('Error fetching blog posts for sitemap:', error);
  }
  
  // Static pages
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
      url: `${baseUrl}/auth/signup`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/auth/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/sitemap`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.2,
    },
  ];
  
  // Dynamic blog posts
  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.updated_at ? new Date(post.updated_at) : new Date(post.created_at),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));
  
  return [...staticPages, ...blogPages];
}