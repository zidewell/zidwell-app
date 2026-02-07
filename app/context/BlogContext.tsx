"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content?: string;
  categories: string[];
  tags?: string[];
  featured_image: string | null;
  is_published: boolean;
  author_id: string;
  author: {
    id: string;
    name: string;
    avatar: string | null;
    bio: string | null;
  };
  published_at: string | null;
  created_at: string;
  updated_at: string;
  view_count: number;
  likes_count: number;
  comments_count: number;
  comment_count?: number;
}

interface BlogCategory {
  name: string;
  count: number;
}

interface BlogContextType {
  posts: BlogPost[];
  recentPosts: BlogPost[];
  popularPosts: BlogPost[];
  categories: BlogCategory[];
  isLoading: boolean;
  error: string | null;
  refreshPosts: () => Promise<void>;
  isInitialized: boolean;
}

const BlogContext = createContext<BlogContextType | undefined>(undefined);

export const useBlog = () => {
  const context = useContext(BlogContext);
  if (!context) {
    throw new Error('useBlog must be used within BlogProvider');
  }
  return context;
};

interface BlogProviderProps {
  children: ReactNode;
}

export const BlogProvider: React.FC<BlogProviderProps> = ({ children }) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [popularPosts, setPopularPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const transformPosts = useCallback((data: any): BlogPost[] => {
    const posts = data.posts || data;
    if (!Array.isArray(posts)) return [];
    
    return posts.map((post: any) => ({
      id: post.id || '',
      title: post.title || 'Untitled',
      slug: post.slug || '',
      excerpt: post.excerpt || null,
      content: post.content || '',
      categories: post.categories || [],
      tags: post.tags || [],
      featured_image: post.featured_image || null,
      is_published: post.is_published || false,
      author_id: post.author_id || '',
      author: {
        id: post.author?.id || post.author_id || '',
        name: post.author?.name || post.author_name || 'Unknown Author',
        avatar: post.author?.avatar || post.author_avatar || null,
        bio: post.author?.bio || post.author_bio || null
      },
      published_at: post.published_at || null,
      created_at: post.created_at || new Date().toISOString(),
      updated_at: post.updated_at || post.created_at || new Date().toISOString(),
      view_count: post.view_count || 0,
      likes_count: post.likes_count || 0,
      comments_count: post.comments_count || post.comment_count || 0
    }));
  }, []);

  const extractCategories = useCallback((posts: BlogPost[]): BlogCategory[] => {
    const categoryMap = new Map<string, number>();
    
    posts.forEach((post) => {
      if (post.categories && Array.isArray(post.categories)) {
        post.categories.forEach((category: string) => {
          if (category && category.trim()) {
            const catName = category.trim();
            categoryMap.set(catName, (categoryMap.get(catName) || 0) + 1);
          }
        });
      }
    });
    
    return Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, []);

  const fetchAllPosts = async () => {
    // Prevent multiple simultaneous fetches
    if (isFetching) return;
    
    setIsFetching(true);
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch all needed data in parallel
      const [allResponse, recentResponse, popularResponse] = await Promise.all([
        fetch('/api/blog/posts?limit=100'),
        fetch('/api/blog/posts?limit=5&sort_by=created_at&sort_order=desc'),
        fetch('/api/blog/posts?limit=5&sort_by=view_count&sort_order=desc')
      ]);

      // Check all responses
      const errors = [];
      if (!allResponse.ok) errors.push('All posts');
      if (!recentResponse.ok) errors.push('Recent posts');
      if (!popularResponse.ok) errors.push('Popular posts');
      
      if (errors.length > 0) {
        throw new Error(`Failed to fetch: ${errors.join(', ')}`);
      }

      // Parse all responses
      const [allData, recentData, popularData] = await Promise.all([
        allResponse.json(),
        recentResponse.json(),
        popularResponse.json()
      ]);

      // Transform data
      const allPosts = transformPosts(allData);
      const recent = transformPosts(recentData);
      const popular = transformPosts(popularData);
      
      // Extract categories from all posts
      const extractedCategories = extractCategories(allPosts);

      // Update state
      setPosts(allPosts);
      setRecentPosts(recent);
      setPopularPosts(popular);
      setCategories(extractedCategories);
      setLastFetchTime(Date.now());
      setIsInitialized(true);

    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch posts');
      
      // Clear data on error
      if (!isInitialized) {
        setPosts([]);
        setRecentPosts([]);
        setPopularPosts([]);
        setCategories([]);
      }
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  };

  const refreshPosts = useCallback(async () => {
    await fetchAllPosts();
  }, []);

  // Fetch posts on initial load with cache check
  useEffect(() => {
    // Check if we should fetch (not initialized OR data is stale > 5 minutes)
    const shouldFetch = !isInitialized || (Date.now() - lastFetchTime > 5 * 60 * 1000);
    
    if (shouldFetch && !isFetching) {
      fetchAllPosts();
    }
  }, [isInitialized, lastFetchTime, isFetching]);

  const contextValue = {
    posts,
    recentPosts,
    popularPosts,
    categories,
    isLoading,
    error,
    refreshPosts,
    isInitialized
  };

  return (
    <BlogContext.Provider value={contextValue}>
      {children}
    </BlogContext.Provider>
  );
};