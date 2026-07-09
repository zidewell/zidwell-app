// app/context/BlogContext.tsx
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
  cooldownRemaining: number;
  forceRefresh: () => Promise<void>;
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

// ✅ Global state to prevent multiple initializations
let globalInitialized = false;
let globalFetchPromise: Promise<void> | null = null;
let globalLastFetchTime = 0;
let globalCooldownInterval: NodeJS.Timeout | null = null;

export const BlogProvider: React.FC<BlogProviderProps> = ({ children }) => {
  const pathname = usePathname();
  
  // State
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [popularPosts, setPopularPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  
  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const isFetchingRef = useRef(false);
  
  const CACHE_KEY = 'blog_cache_data';
  const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

  // ✅ Load from localStorage
  const loadFromCache = useCallback(() => {
    try {
      if (typeof window === 'undefined') return null;
      const stored = localStorage.getItem(CACHE_KEY);
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      const isExpired = Date.now() - parsed.timestamp > COOLDOWN_MS;
      
      if (isExpired) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }
      
      return parsed.data;
    } catch {
      return null;
    }
  }, []);

  // ✅ Save to localStorage
  const saveToCache = useCallback((data: any) => {
    try {
      if (typeof window === 'undefined') return;
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to save cache:', error);
    }
  }, []);

  // ✅ Check if we can fetch (cooldown check)
  const canFetch = useCallback(() => {
    const stored = localStorage.getItem(CACHE_KEY);
    if (!stored) return true;
    
    try {
      const parsed = JSON.parse(stored);
      return Date.now() - parsed.timestamp >= COOLDOWN_MS;
    } catch {
      return true;
    }
  }, []);

  // ✅ Get remaining cooldown time
  const getRemainingCooldown = useCallback(() => {
    const stored = localStorage.getItem(CACHE_KEY);
    if (!stored) return 0;
    
    try {
      const parsed = JSON.parse(stored);
      return Math.max(0, COOLDOWN_MS - (Date.now() - parsed.timestamp));
    } catch {
      return 0;
    }
  }, []);

  // ✅ Load data from cache into state
  const loadDataFromCache = useCallback(() => {
    const cached = loadFromCache();
    if (cached) {
      setPosts(cached.allPosts || []);
      setRecentPosts(cached.recentPosts || []);
      setPopularPosts(cached.popularPosts || []);
      setCategories(cached.categories || []);
      setIsInitialized(true);
      setCooldownRemaining(getRemainingCooldown());
      return true;
    }
    return false;
  }, [loadFromCache, getRemainingCooldown]);

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

  // ✅ Main fetch function with cooldown and deduplication
  const fetchAllPosts = useCallback(async () => {
    // ✅ Check cooldown FIRST
    if (!canFetch()) {
      const remaining = getRemainingCooldown();
      const seconds = Math.ceil(remaining / 1000);
      console.log(`⏳ Cooldown active. ${seconds}s remaining. Using cache.`);
      
      // Load from cache
      const cached = loadFromCache();
      if (cached) {
        setPosts(cached.allPosts || []);
        setRecentPosts(cached.recentPosts || []);
        setPopularPosts(cached.popularPosts || []);
        setCategories(cached.categories || []);
        setIsInitialized(true);
        setCooldownRemaining(remaining);
      }
      return;
    }
    
    // ✅ Prevent concurrent fetches
    if (isFetchingRef.current || !isMountedRef.current) {
      console.log('⏳ Fetch already in progress');
      return;
    }
    
    // ✅ Load from cache if available
    if (loadDataFromCache()) {
      console.log('✅ Using cached data');
      return;
    }
    
    // ✅ Check if there's already a global fetch in progress
    if (globalFetchPromise) {
      console.log('⏳ Waiting for existing fetch...');
      await globalFetchPromise;
      // After waiting, load from cache
      loadDataFromCache();
      return;
    }
    
    console.log('🔄 Fetching fresh data...');
    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);
    
    // Cancel any ongoing fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    // ✅ Create the fetch promise and store it globally
    const fetchPromise = (async () => {
      try {
        // Fetch all data
        const [allResponse, recentResponse, popularResponse] = await Promise.all([
          fetch('/api/blog/posts?limit=100&published=true', { signal: controller.signal }),
          fetch('/api/blog/posts?limit=5&sort_by=created_at&sort_order=desc&published=true', { signal: controller.signal }),
          fetch('/api/blog/posts?limit=5&sort_by=view_count&sort_order=desc&published=true', { signal: controller.signal })
        ]);

        // Check responses
        const errors = [];
        if (!allResponse.ok) errors.push('All posts');
        if (!recentResponse.ok) errors.push('Recent posts');
        if (!popularResponse.ok) errors.push('Popular posts');
        
        if (errors.length > 0) {
          throw new Error(`Failed to fetch: ${errors.join(', ')}`);
        }

        // Parse responses
        const [allData, recentData, popularData] = await Promise.all([
          allResponse.json(),
          recentResponse.json(),
          popularResponse.json()
        ]);

        // Transform data
        const allPosts = transformPosts(allData);
        const recent = transformPosts(recentData);
        const popular = transformPosts(popularData);
        const extractedCategories = extractCategories(allPosts);

        // Data to cache
        const cacheData = {
          allPosts,
          recentPosts: recent,
          popularPosts: popular,
          categories: extractedCategories
        };

        // Save to cache with timestamp
        saveToCache(cacheData);
        globalLastFetchTime = Date.now();
        
        // Update state
        setPosts(allPosts);
        setRecentPosts(recent);
        setPopularPosts(popular);
        setCategories(extractedCategories);
        setIsInitialized(true);
        setCooldownRemaining(COOLDOWN_MS);

        console.log('✅ Data fetched and cached. Next fetch available in 5 minutes.');

      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          console.log('🛑 Fetch aborted');
          return;
        }
        
        console.error('❌ Error fetching posts:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch posts');
        
        // Try to load from cache on error
        const cached = loadFromCache();
        if (cached) {
          console.log('📦 Using cached data after error');
          setPosts(cached.allPosts || []);
          setRecentPosts(cached.recentPosts || []);
          setPopularPosts(cached.popularPosts || []);
          setCategories(cached.categories || []);
          setIsInitialized(true);
        }
      } finally {
        setIsLoading(false);
        isFetchingRef.current = false;
        globalFetchPromise = null;
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    })();
    
    // Store the promise globally
    globalFetchPromise = fetchPromise;
    await fetchPromise;
    
    // After fetch completes, update cooldown
    setCooldownRemaining(getRemainingCooldown());
    
  }, [canFetch, getRemainingCooldown, loadFromCache, loadDataFromCache, transformPosts, extractCategories, saveToCache]);

  // ✅ Force refresh (bypass cooldown)
  const forceRefresh = useCallback(async () => {
    console.log('🔄 Force refresh triggered');
    // Clear cache
    localStorage.removeItem(CACHE_KEY);
    globalLastFetchTime = 0;
    globalFetchPromise = null;
    
    // Reset state
    setPosts([]);
    setRecentPosts([]);
    setPopularPosts([]);
    setCategories([]);
    setIsInitialized(false);
    
    // Fetch fresh
    await fetchAllPosts();
  }, [fetchAllPosts]);

  // ✅ Refresh with cooldown check
  const refreshPosts = useCallback(async () => {
    console.log('🔄 Refresh triggered');
    
    // Check cooldown
    if (!canFetch()) {
      const remaining = getRemainingCooldown();
      const minutes = Math.ceil(remaining / 60000);
      console.log(`⏳ Cannot refresh. ${minutes} minutes remaining.`);
      
      // Still load from cache
      const cached = loadFromCache();
      if (cached) {
        setPosts(cached.allPosts || []);
        setRecentPosts(cached.recentPosts || []);
        setPopularPosts(cached.popularPosts || []);
        setCategories(cached.categories || []);
        setIsInitialized(true);
        setCooldownRemaining(remaining);
      }
      return;
    }
    
    // Clear cache and fetch fresh
    localStorage.removeItem(CACHE_KEY);
    await fetchAllPosts();
  }, [canFetch, getRemainingCooldown, loadFromCache, fetchAllPosts]);

  // ✅ Initialize cooldown timer
  useEffect(() => {
    if (globalCooldownInterval) {
      clearInterval(globalCooldownInterval);
    }

    globalCooldownInterval = setInterval(() => {
      const remaining = getRemainingCooldown();
      setCooldownRemaining(remaining);
      
      if (remaining === 0 && globalCooldownInterval) {
        clearInterval(globalCooldownInterval);
        globalCooldownInterval = null;
      }
    }, 1000);

    return () => {
      if (globalCooldownInterval) {
        clearInterval(globalCooldownInterval);
        globalCooldownInterval = null;
      }
    };
  }, [getRemainingCooldown]);

  // ✅ Initial load - runs once globally
  useEffect(() => {
    // Skip if already initialized globally
    if (globalInitialized) {
      console.log('⏭️ Already initialized globally, loading from cache...');
      loadDataFromCache();
      return;
    }
    
    console.log('🚀 Initializing BlogProvider');
    isMountedRef.current = true;
    
    // Try to load from cache
    const hasCache = loadDataFromCache();
    
    // Only fetch if no cache and we're on a blog page
    if (!hasCache && shouldFetchBlogData()) {
      // Check if we can fetch (not on cooldown)
      if (canFetch()) {
        console.log('📡 No cache found, fetching...');
        fetchAllPosts();
      } else {
        console.log('⏳ On cooldown, waiting...');
        setCooldownRemaining(getRemainingCooldown());
      }
    } else if (hasCache) {
      console.log('📦 Using cached data');
    }
    
    globalInitialized = true;
    
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // ✅ Cleanup
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
    isInitialized,
    cooldownRemaining,
    forceRefresh
  };

  return (
    <BlogContext.Provider value={contextValue}>
      {children}
    </BlogContext.Provider>
  );
};