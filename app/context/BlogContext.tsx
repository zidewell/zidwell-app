"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';

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

// Cache storage with TTL
class BlogCache {
  private static instance: BlogCache;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): BlogCache {
    if (!BlogCache.instance) {
      BlogCache.instance = new BlogCache();
    }
    return BlogCache.instance;
  }

  set(key: string, data: any, ttl: number = this.DEFAULT_TTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    const isExpired = Date.now() - item.timestamp > item.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    const isExpired = Date.now() - item.timestamp > item.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  clear() {
    this.cache.clear();
  }

  remove(key: string) {
    this.cache.delete(key);
  }
}

export const BlogProvider: React.FC<BlogProviderProps> = ({ children }) => {
  const pathname = usePathname();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [popularPosts, setPopularPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  
  const cache = BlogCache.getInstance();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check if current page needs blog data
  const shouldFetchBlogData = useCallback(() => {
    if (!pathname) return false;
    
    return pathname.startsWith('/blog') || pathname === '/dashboard';
  }, [pathname]);

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

  // Load from cache immediately on mount
  const loadFromCache = useCallback(() => {
    const cachedAllPosts = cache.get('all_posts');
    const cachedRecentPosts = cache.get('recent_posts');
    const cachedPopularPosts = cache.get('popular_posts');
    const cachedCategories = cache.get('categories');
    const cachedTimestamp = cache.get('timestamp');
    
    if (cachedAllPosts && cachedRecentPosts && cachedPopularPosts && cachedCategories) {
      setPosts(cachedAllPosts);
      setRecentPosts(cachedRecentPosts);
      setPopularPosts(cachedPopularPosts);
      setCategories(cachedCategories);
      if (cachedTimestamp) setLastFetchTime(cachedTimestamp as number);
      setIsInitialized(true);
      return true;
    }
    return false;
  }, [cache]);

  const fetchAllPosts = async () => {
    // Cancel any ongoing fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Prevent multiple simultaneous fetches
    if (isFetching) return;
    
    setIsFetching(true);
    setIsLoading(true);
    setError(null);
    
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    try {
      const cacheKey = 'all_blog_data';
      
      // Try to load from cache first
      const cachedData = cache.get(cacheKey);
      if (cachedData && !shouldRefreshData()) {
        // Use cached data immediately
        setPosts(cachedData.allPosts);
        setRecentPosts(cachedData.recentPosts);
        setPopularPosts(cachedData.popularPosts);
        setCategories(cachedData.categories);
        setLastFetchTime(cachedData.timestamp);
        setIsInitialized(true);
        setIsLoading(false);
        return;
      }
      
      // Fetch all needed data in parallel with abort signal
      const [allResponse, recentResponse, popularResponse] = await Promise.all([
        fetch('/api/blog/posts?limit=100', { signal: controller.signal }),
        fetch('/api/blog/posts?limit=5&sort_by=created_at&sort_order=desc', { signal: controller.signal }),
        fetch('/api/blog/posts?limit=5&sort_by=view_count&sort_order=desc', { signal: controller.signal })
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

      const newTimestamp = Date.now();
      
      // Cache all data together
      cache.set(cacheKey, {
        allPosts,
        recentPosts: recent,
        popularPosts: popular,
        categories: extractedCategories,
        timestamp: newTimestamp
      }, 5 * 60 * 1000); // 5 minutes TTL
      
      // Also store individual pieces for quick access
      cache.set('all_posts', allPosts);
      cache.set('recent_posts', recent);
      cache.set('popular_posts', popular);
      cache.set('categories', extractedCategories);
      cache.set('timestamp', newTimestamp);

      // Update state
      setPosts(allPosts);
      setRecentPosts(recent);
      setPopularPosts(popular);
      setCategories(extractedCategories);
      setLastFetchTime(newTimestamp);
      setIsInitialized(true);

    } catch (err) {
      // Don't set error if it's an abort error
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Fetch aborted');
        return;
      }
      
      console.error('Error fetching posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch posts');
      
      // Try to load from cache on error
      const cachedData = cache.get('all_blog_data');
      if (cachedData) {
        setPosts(cachedData.allPosts);
        setRecentPosts(cachedData.recentPosts);
        setPopularPosts(cachedData.popularPosts);
        setCategories(cachedData.categories);
        setLastFetchTime(cachedData.timestamp);
        setIsInitialized(true);
      } else if (!isInitialized) {
        setPosts([]);
        setRecentPosts([]);
        setPopularPosts([]);
        setCategories([]);
      }
    } finally {
      setIsLoading(false);
      setIsFetching(false);
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  };

  // Check if data should be refreshed
  const shouldRefreshData = useCallback(() => {
    return Date.now() - lastFetchTime > 5 * 60 * 1000; // 5 minutes
  }, [lastFetchTime]);

  const refreshPosts = useCallback(async () => {
    // Clear cache for this specific data
    cache.remove('all_blog_data');
    cache.remove('all_posts');
    cache.remove('recent_posts');
    cache.remove('popular_posts');
    cache.remove('categories');
    cache.remove('timestamp');
    
    if (shouldFetchBlogData()) {
      await fetchAllPosts();
    }
  }, [shouldFetchBlogData]);

  // Preload data on mount
  useEffect(() => {
    // Try to load from cache first (synchronous)
    const hasCache = loadFromCache();
    
    // If no cache or cache expired, fetch fresh data
    if (!hasCache || shouldRefreshData()) {
      if (shouldFetchBlogData() && !isFetching) {
        fetchAllPosts();
      }
    }
  }, []);

  // Fetch posts only on blog or exact dashboard page
  useEffect(() => {
    // Skip if not on allowed routes
    if (!shouldFetchBlogData()) {
      // Clear data when leaving blog/dashboard pages but keep cache
      if (isInitialized) {
        setPosts([]);
        setRecentPosts([]);
        setPopularPosts([]);
        setCategories([]);
        setIsInitialized(false);
      }
      return;
    }
    
    // Check if we should fetch (not initialized OR data is stale > 5 minutes)
    const shouldFetch = !isInitialized || shouldRefreshData();
    
    if (shouldFetch && !isFetching) {
      fetchAllPosts();
    }
  }, [pathname, isInitialized, shouldRefreshData, isFetching, shouldFetchBlogData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

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