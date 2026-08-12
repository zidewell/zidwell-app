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

// Global state to prevent multiple initializations
let globalInitialized = false;
let globalFetchPromise: Promise<void> | null = null;
let globalLastFetchTime = 0;
let globalCooldownInterval: NodeJS.Timeout | null = null;

// Debug mode
const DEBUG = process.env.NODE_ENV === 'development';
const debugLog = (...args: any[]) => {
  if (DEBUG) {
    console.log('[BLOG CONTEXT]', new Date().toISOString(), ...args);
  }
};

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
  const hasInitializedRef = useRef(false);
  
  const CACHE_KEY = 'blog_cache_data';
  const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

  debugLog('🔧 BlogProvider initializing');

  // Load from localStorage
  const loadFromCache = useCallback(() => {
    try {
      if (typeof window === 'undefined') return null;
      const stored = localStorage.getItem(CACHE_KEY);
      if (!stored) {
        debugLog('No cache found');
        return null;
      }
      
      const parsed = JSON.parse(stored);
      const isExpired = Date.now() - parsed.timestamp > COOLDOWN_MS;
      
      if (isExpired) {
        debugLog('Cache expired');
        localStorage.removeItem(CACHE_KEY);
        return null;
      }
      
      debugLog(`Cache found with ${parsed.data.allPosts?.length || 0} posts`);
      return parsed.data;
    } catch (error) {
      console.error('Error loading cache:', error);
      return null;
    }
  }, []);

  // Save to localStorage
  const saveToCache = useCallback((data: any) => {
    try {
      if (typeof window === 'undefined') return;
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      debugLog('Cache saved');
    } catch (error) {
      console.warn('Failed to save cache:', error);
    }
  }, []);

  // Check if we can fetch
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

  // Get remaining cooldown time
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

  // Load data from cache into state
  const loadDataFromCache = useCallback(() => {
    const cached = loadFromCache();
    if (cached) {
      debugLog('Loading data from cache');
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

  // Main fetch function
  const fetchAllPosts = useCallback(async () => {
    debugLog('🔄 fetchAllPosts called');
    
    // Check cooldown
    if (!canFetch()) {
      const remaining = getRemainingCooldown();
      debugLog(`⏳ Cooldown active: ${Math.ceil(remaining / 1000)}s remaining`);
      loadDataFromCache();
      return;
    }
    
    // Prevent concurrent fetches
    if (isFetchingRef.current || !isMountedRef.current) {
      debugLog('⏳ Fetch already in progress or component unmounted');
      return;
    }
    
    // Load from cache if available
    if (loadDataFromCache()) {
      debugLog('✅ Using cached data');
      return;
    }
    
    // Check for global fetch
    if (globalFetchPromise) {
      debugLog('⏳ Waiting for existing global fetch...');
      await globalFetchPromise;
      loadDataFromCache();
      return;
    }
    
    debugLog('🔄 Fetching fresh blog data...');
    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);
    
    // Cancel any ongoing fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    const fetchPromise = (async () => {
      try {
        const [allResponse, recentResponse, popularResponse] = await Promise.all([
          fetch('/api/blog/posts?limit=100&published=true', { signal: controller.signal }),
          fetch('/api/blog/posts?limit=5&sort_by=created_at&sort_order=desc&published=true', { signal: controller.signal }),
          fetch('/api/blog/posts?limit=5&sort_by=view_count&sort_order=desc&published=true', { signal: controller.signal })
        ]);

        const errors = [];
        if (!allResponse.ok) errors.push('All posts');
        if (!recentResponse.ok) errors.push('Recent posts');
        if (!popularResponse.ok) errors.push('Popular posts');
        
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

        const cacheData = {
          allPosts,
          recentPosts: recent,
          popularPosts: popular,
          categories: extractedCategories
        };

        saveToCache(cacheData);
        globalLastFetchTime = Date.now();
        
        setPosts(allPosts);
        setRecentPosts(recent);
        setPopularPosts(popular);
        setCategories(extractedCategories);
        setIsInitialized(true);
        setCooldownRemaining(COOLDOWN_MS);

        debugLog(`✅ Fetched: ${allPosts.length} posts, ${recent.length} recent, ${popular.length} popular`);

      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          debugLog('🛑 Fetch aborted');
          return;
        }
        
        console.error('❌ Error fetching blog posts:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch posts');
        
        const cached = loadFromCache();
        if (cached) {
          debugLog('📦 Using cached data after error');
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
    
    globalFetchPromise = fetchPromise;
    await fetchPromise;
    setCooldownRemaining(getRemainingCooldown());
    
  }, [canFetch, getRemainingCooldown, loadFromCache, loadDataFromCache, transformPosts, extractCategories, saveToCache]);

  // Force refresh
  const forceRefresh = useCallback(async () => {
    debugLog('🔄 Force refresh');
    localStorage.removeItem(CACHE_KEY);
    globalLastFetchTime = 0;
    globalFetchPromise = null;
    
    setPosts([]);
    setRecentPosts([]);
    setPopularPosts([]);
    setCategories([]);
    setIsInitialized(false);
    
    await fetchAllPosts();
  }, [fetchAllPosts]);

  // Refresh with cooldown
  const refreshPosts = useCallback(async () => {
    debugLog('🔄 Refresh triggered');
    
    if (!canFetch()) {
      const remaining = getRemainingCooldown();
      debugLog(`⏳ Cannot refresh. ${Math.ceil(remaining / 60000)} minutes remaining.`);
      loadDataFromCache();
      return;
    }
    
    localStorage.removeItem(CACHE_KEY);
    await fetchAllPosts();
  }, [canFetch, getRemainingCooldown, loadDataFromCache, fetchAllPosts]);

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

  // Cooldown timer
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

  // Initial load
  useEffect(() => {
    debugLog('🚀 Initializing BlogProvider');
    isMountedRef.current = true;
    
    if (globalInitialized && hasInitializedRef.current) {
      debugLog('⏭️ Already initialized globally');
      loadDataFromCache();
      return;
    }
    
    const hasCache = loadDataFromCache();
    
    if (!hasCache && !globalInitialized) {
      if (canFetch()) {
        debugLog('📡 No cache, fetching...');
        fetchAllPosts();
      } else {
        debugLog('⏳ On cooldown');
        setCooldownRemaining(getRemainingCooldown());
      }
    }
    
    globalInitialized = true;
    hasInitializedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
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
    forceRefresh,
    getPostBySlug,
    getRelatedPosts
  };

  return (
    <BlogContext.Provider value={contextValue}>
      {children}
    </BlogContext.Provider>
  );
};