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

  // Main fetch function - fetches fresh data every time
  const fetchAllPosts = useCallback(async () => {
    // Prevent concurrent fetches
    if (isFetchingRef.current || !isMountedRef.current) {
      return;
    }
    
    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);
    
    // Cancel any ongoing fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
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

      // Update state immediately
      setPosts(allPosts);
      setRecentPosts(recent);
      setPopularPosts(popular);
      setCategories(extractedCategories);
      setIsInitialized(true);
      setIsLoading(false);

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      
      console.error('Error fetching blog posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch posts');
      setIsLoading(false);
    } finally {
      isFetchingRef.current = false;
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [transformPosts, extractCategories]);

  // Refresh posts
  const refreshPosts = useCallback(async () => {
    await fetchAllPosts();
  }, [fetchAllPosts]);

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
    isMountedRef.current = true;
    fetchAllPosts();
    
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
    getPostBySlug,
    getRelatedPosts
  };

  return (
    <BlogContext.Provider value={contextValue}>
      {children}
    </BlogContext.Provider>
  );
};