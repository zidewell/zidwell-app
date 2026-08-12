// app/context/BlogContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';

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
  forceRefresh: () => Promise<void>;
  isInitialized: boolean;
  getPostBySlug: (slug: string) => BlogPost | undefined;
  getRelatedPosts: (postId: string, limit?: number) => BlogPost[];
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

const FETCH_TIMEOUT = 15000; // 15 seconds

export const BlogProvider: React.FC<BlogProviderProps> = ({ children }) => {
  // State
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [popularPosts, setPopularPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const isFetchingRef = useRef(false);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  // Transform posts from API
  const transformPosts = useCallback((data: any): BlogPost[] => {
    let posts = data;
    
    if (data && data.posts && Array.isArray(data.posts)) {
      posts = data.posts;
    } else if (Array.isArray(data)) {
      posts = data;
    } else if (data && data.data && Array.isArray(data.data)) {
      posts = data.data;
    } else if (data && data.results && Array.isArray(data.results)) {
      posts = data.results;
    } else if (data && data.id && data.title) {
      posts = [data];
    } else if (!Array.isArray(data)) {
      posts = [];
    }
    
    if (!Array.isArray(posts)) {
      return [];
    }
    
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

  // Extract categories from posts
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

  // Clear timeout
  const clearFetchTimeout = useCallback(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  }, []);

  // Main fetch function
  const fetchAllPosts = useCallback(async (skipLoadingState: boolean = false) => {
    // Prevent concurrent fetches
    if (isFetchingRef.current || !isMountedRef.current) {
      return;
    }
    
    isFetchingRef.current = true;
    if (!skipLoadingState) {
      setIsLoading(true);
    }
    setError(null);
    
    // Clear any existing timeout
    clearFetchTimeout();
    
    // Cancel any ongoing fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    // Safety timeout
    timeoutIdRef.current = setTimeout(() => {
      if (isMountedRef.current && isFetchingRef.current) {
        console.warn('⚠️ Fetch timeout - forcing stop');
        setIsLoading(false);
        setError('Request timed out. Please try again.');
        setIsInitialized(true);
        isFetchingRef.current = false;
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
        }
      }
    }, FETCH_TIMEOUT);
    
    try {
      console.log('🔍 Fetching blog posts...');
      
      const [allResponse, recentResponse, popularResponse] = await Promise.all([
        fetch('/api/blog/posts?limit=100&published=true', { signal: controller.signal }),
        fetch('/api/blog/posts?limit=5&sort_by=created_at&sort_order=desc&published=true', { signal: controller.signal }),
        fetch('/api/blog/posts?limit=5&sort_by=view_count&sort_order=desc&published=true', { signal: controller.signal })
      ]);

      const errors = [];
      if (!allResponse.ok) errors.push(`All posts (${allResponse.status})`);
      if (!recentResponse.ok) errors.push(`Recent posts (${recentResponse.status})`);
      if (!popularResponse.ok) errors.push(`Popular posts (${popularResponse.status})`);
      
      if (errors.length > 0) {
        throw new Error(`Failed to fetch: ${errors.join(', ')}`);
      }

      const [allData, recentData, popularData] = await Promise.all([
        allResponse.json(),
        recentResponse.json(),
        popularResponse.json()
      ]);

      const allPosts = transformPosts(allData);
      const recent = transformPosts(recentData);
      const popular = transformPosts(popularData);
      const extractedCategories = extractCategories(allPosts);

      console.log(`✅ Fetched ${allPosts.length} posts`);

      // Update state
      setPosts(allPosts);
      setRecentPosts(recent);
      setPopularPosts(popular);
      setCategories(extractedCategories);
      setIsInitialized(true);
      setIsLoading(false);
      
      // Clear timeout on success
      clearFetchTimeout();

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('🛑 Fetch aborted');
        return;
      }
      
      console.error('❌ Error fetching blog posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch posts');
      setIsLoading(false);
      setIsInitialized(true); // Still mark as initialized even on error
      
      // Clear timeout on error
      clearFetchTimeout();
    } finally {
      isFetchingRef.current = false;
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [transformPosts, extractCategories, clearFetchTimeout]);

  // Refresh posts (respects loading state)
  const refreshPosts = useCallback(async () => {
    console.log('🔄 Refreshing posts...');
    await fetchAllPosts(false);
  }, [fetchAllPosts]);

  // Force refresh (bypasses loading state)
  const forceRefresh = useCallback(async () => {
    console.log('⚡ Force refreshing posts...');
    // Reset state
    setPosts([]);
    setRecentPosts([]);
    setPopularPosts([]);
    setCategories([]);
    setIsInitialized(false);
    setIsLoading(true);
    setError(null);
    
    // Cancel any ongoing fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Clear timeout
    clearFetchTimeout();
    
    // Fetch with loading state
    await fetchAllPosts(false);
  }, [fetchAllPosts, clearFetchTimeout]);

  // Get post by slug
  const getPostBySlug = useCallback((slug: string) => {
    return posts.find(post => post.slug === slug);
  }, [posts]);

  // Get related posts
  const getRelatedPosts = useCallback((postId: string, limit: number = 3) => {
    const currentPost = posts.find(p => p.id === postId);
    if (!currentPost) return [];
    
    const related = posts.filter(post => 
      post.id !== postId && 
      post.is_published &&
      post.categories.some(cat => currentPost.categories.includes(cat))
    );
    
    return related.slice(0, limit);
  }, [posts]);

  // Initial load - fetch immediately on mount
  useEffect(() => {
    console.log('🚀 BlogProvider mounted, fetching posts...');
    isMountedRef.current = true;
    
    // Fetch posts immediately
    fetchAllPosts(false);
    
    return () => {
      console.log('🧹 BlogProvider unmounting');
      isMountedRef.current = false;
      clearFetchTimeout();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
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
    forceRefresh,
    isInitialized,
    getPostBySlug,
    getRelatedPosts
  };

  return (
    <BlogContext.Provider value={contextValue}>
      {children}
    </BlogContext.Provider>
  );
};