"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import { usePathname } from 'next/navigation';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  categories: string[];
  tags: string[];
  featured_image: string | null;
  audio_file: string | null;
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
}

export interface BlogStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalAuthors: number;
  totalComments: number;
  totalViews: number;
  recentPosts: BlogPost[];
  popularPosts: BlogPost[];
  categories: Array<{ name: string; count: number }>;
  tags: Array<{ name: string; count: number }>;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  post_count: number;
  created_at?: string;
  updated_at?: string;
}

interface BlogContextType {
  posts: BlogPost[];
  stats: BlogStats | null;
  categories: BlogCategory[];
  isLoading: boolean;
  error: string | null;
  refreshPosts: () => Promise<void>;
  refreshStats: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  getPost: (id: string) => BlogPost | null;
  getPostBySlug: (slug: string) => BlogPost | null;
  getPostsByCategory: (category: string) => BlogPost[];
  getPostsByTag: (tag: string) => BlogPost[];
  searchPosts: (query: string) => BlogPost[];
  getRelatedPosts: (post: BlogPost, limit?: number) => BlogPost[];
  invalidateCache: () => void;
}

const BlogContext = createContext<BlogContextType | undefined>(undefined);

// Cache structure
interface BlogCache {
  posts: BlogPost[];
  stats: BlogStats | null;
  categories: BlogCategory[];
  timestamp: number;
  categoriesMap: Map<string, BlogPost[]>;
  tagsMap: Map<string, BlogPost[]>;
}

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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
  const pathname = usePathname();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [stats, setStats] = useState<BlogStats | null>(null);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Cache state
  const [cache, setCache] = useState<BlogCache>({
    posts: [],
    stats: null,
    categories: [],
    timestamp: 0,
    categoriesMap: new Map(),
    tagsMap: new Map(),
  });

  // Refs to prevent multiple calls
  const isInitialLoadRef = useRef(false);
  const isFetchingRef = useRef(false);

  // Check if we should load blog data based on pathname
  const shouldLoadBlogData = useMemo(() => {
    return pathname?.startsWith('/blog') || pathname?.startsWith('/blog/admin');
  }, [pathname]);

  // Check if cache is valid
  const isCacheValid = useCallback(() => {
    if (!shouldLoadBlogData) return false;
    const now = Date.now();
    return cache.timestamp > 0 && now - cache.timestamp < CACHE_DURATION;
  }, [cache.timestamp, shouldLoadBlogData]);

  // Build indices from posts
  const buildIndices = useCallback((postsList: BlogPost[]) => {
    const categoriesMap = new Map<string, BlogPost[]>();
    const tagsMap = new Map<string, BlogPost[]>();
    
    postsList.forEach(post => {
      // Index by categories
      if (post.categories && Array.isArray(post.categories)) {
        post.categories.forEach(category => {
          if (category && typeof category === 'string') {
            const trimmedCategory = category.trim();
            if (trimmedCategory) {
              if (!categoriesMap.has(trimmedCategory)) {
                categoriesMap.set(trimmedCategory, []);
              }
              categoriesMap.get(trimmedCategory)!.push(post);
            }
          }
        });
      }
      
      // Index by tags
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(tag => {
          if (tag && typeof tag === 'string') {
            const trimmedTag = tag.trim();
            if (trimmedTag) {
              if (!tagsMap.has(trimmedTag)) {
                tagsMap.set(trimmedTag, []);
              }
              tagsMap.get(trimmedTag)!.push(post);
            }
          }
        });
      }
    });
    
    return { categoriesMap, tagsMap };
  }, []);

  // Helper function to generate categories from posts
  const generateCategoriesFromPosts = useCallback((postsData: BlogPost[]): BlogCategory[] => {
    const categoryMap = new Map<string, number>();
    
    postsData.forEach(post => {
      if (post.categories && Array.isArray(post.categories)) {
        post.categories.forEach(category => {
          if (category && typeof category === 'string') {
            const trimmedCategory = category.trim();
            if (trimmedCategory) {
              categoryMap.set(trimmedCategory, (categoryMap.get(trimmedCategory) || 0) + 1);
            }
          }
        });
      }
    });
    
    const categoriesList: BlogCategory[] = Array.from(categoryMap.entries())
      .map(([name, post_count], index) => {
        const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
        return {
          id: `generated-${index}`,
          name,
          slug,
          post_count,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      });
    
    // Sort by post count descending
    categoriesList.sort((a, b) => b.post_count - a.post_count);
    
    return categoriesList;
  }, []);

  // Fetch all posts - optimized to match your API response
  const fetchPosts = useCallback(async (forceRefresh = false): Promise<BlogPost[]> => {
    if (!shouldLoadBlogData) {
      return [];
    }
    
    // Check cache first (unless force refresh)
    if (!forceRefresh && isCacheValid() && cache.posts.length > 0) {
      setPosts(cache.posts);
      return cache.posts;
    }
    
    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      return cache.posts;
    }
    
    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/blog/posts?limit=100&skipCache=true');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Extract posts from the response
      let fetchedPosts: BlogPost[] = [];
      if (data.posts && Array.isArray(data.posts)) {
        fetchedPosts = data.posts;
      } else if (Array.isArray(data)) {
        fetchedPosts = data; // Fallback if API returns array directly
      }
      
      // Build indices
      const { categoriesMap, tagsMap } = buildIndices(fetchedPosts);
      
      // Generate categories from posts (don't call categories API)
      const generatedCategories = generateCategoriesFromPosts(fetchedPosts);
      
      // Update cache
      setCache(prev => ({
        ...prev,
        posts: fetchedPosts,
        categories: generatedCategories,
        categoriesMap,
        tagsMap,
        timestamp: Date.now(),
      }));
      
      setPosts(fetchedPosts);
      setCategories(generatedCategories);
      return fetchedPosts;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch posts';
      setError(errorMessage);
      console.error('Error fetching posts:', err);
      
      // Keep existing posts on error
      return cache.posts;
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [shouldLoadBlogData, isCacheValid, cache.posts, buildIndices, generateCategoriesFromPosts]);

  // Fetch categories - SIMPLIFIED: Just generate from cached posts, NO API CALL
  const fetchCategories = useCallback(async (forceRefresh = false): Promise<BlogCategory[]> => {
    if (!shouldLoadBlogData) return [];
    
    // Check cache first (unless force refresh)
    if (!forceRefresh && isCacheValid() && cache.categories.length > 0) {
      setCategories(cache.categories);
      return cache.categories;
    }
    
    // NO API CALL - just generate from cached posts
    const categoriesList = generateCategoriesFromPosts(cache.posts);
    
    // Update cache and state
    setCache(prev => ({ ...prev, categories: categoriesList }));
    setCategories(categoriesList);
    return categoriesList;
  }, [shouldLoadBlogData, isCacheValid, cache.categories, cache.posts, generateCategoriesFromPosts]);

  // Fetch blog statistics - optimized
  const fetchStats = useCallback(async (forceRefresh = false): Promise<BlogStats | null> => {
    if (!shouldLoadBlogData) return null;
    
    // Check cache first (unless force refresh)
    if (!forceRefresh && isCacheValid() && cache.stats) {
      setStats(cache.stats);
      return cache.stats;
    }
    
    try {
      // Use cached posts for stats calculation
      const allPosts = cache.posts;
      
      if (!allPosts || allPosts.length === 0) {
        const defaultStats: BlogStats = {
          totalPosts: 0,
          publishedPosts: 0,
          draftPosts: 0,
          totalAuthors: 0,
          totalComments: 0,
          totalViews: 0,
          recentPosts: [],
          popularPosts: [],
          categories: [],
          tags: [],
        };
        setStats(defaultStats);
        setCache(prev => ({ ...prev, stats: defaultStats }));
        return defaultStats;
      }
      
      // Calculate statistics from cached posts
      const publishedPosts = allPosts.filter(post => post.is_published);
      const draftPosts = allPosts.filter(post => !post.is_published);
      const authors = new Set(allPosts.map(post => post.author_id));
      
      // Get category counts
      const categoryCounts = new Map<string, number>();
      allPosts.forEach(post => {
        post.categories?.forEach(category => {
          if (category && typeof category === 'string') {
            const trimmedCategory = category.trim();
            if (trimmedCategory) {
              categoryCounts.set(trimmedCategory, (categoryCounts.get(trimmedCategory) || 0) + 1);
            }
          }
        });
      });
      
      // Get tag counts
      const tagCounts = new Map<string, number>();
      allPosts.forEach(post => {
        post.tags?.forEach(tag => {
          if (tag && typeof tag === 'string') {
            const trimmedTag = tag.trim();
            if (trimmedTag) {
              tagCounts.set(trimmedTag, (tagCounts.get(trimmedTag) || 0) + 1);
            }
          }
        });
      });
      
      // Get recent posts (last 10 published)
      const recentPosts = allPosts
        .filter(post => post.is_published)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);
      
      // Get popular posts (by view count, published only)
      const popularPosts = allPosts
        .filter(post => post.is_published)
        .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
        .slice(0, 10);
      
      const statsData: BlogStats = {
        totalPosts: allPosts.length,
        publishedPosts: publishedPosts.length,
        draftPosts: draftPosts.length,
        totalAuthors: authors.size,
        totalComments: allPosts.reduce((sum, post) => sum + (post.comments_count || 0), 0),
        totalViews: allPosts.reduce((sum, post) => sum + (post.view_count || 0), 0),
        recentPosts,
        popularPosts,
        categories: Array.from(categoryCounts.entries()).map(([name, count]) => ({ name, count })),
        tags: Array.from(tagCounts.entries()).map(([name, count]) => ({ name, count })),
      };
      
      setStats(statsData);
      setCache(prev => ({ ...prev, stats: statsData }));
      return statsData;
    } catch (err) {
      console.error('Error calculating stats:', err);
      return null;
    }
  }, [shouldLoadBlogData, isCacheValid, cache.stats, cache.posts]);

  // Initial data loading - runs only once when shouldLoadBlogData changes
  useEffect(() => {
    if (shouldLoadBlogData && !isInitialLoadRef.current) {
      const loadData = async () => {
        isInitialLoadRef.current = true;
        setIsLoading(true);
        
        try {
          // Fetch posts only - categories will be generated from them
          await fetchPosts(true);
          // Stats will be calculated from posts
          await fetchStats(true);
        } catch (err) {
          console.error('Error loading blog data:', err);
          setError('Failed to load blog data');
        } finally {
          setIsLoading(false);
        }
      };
      
      loadData();
    }
    
    // Reset initial load flag when not on blog pages
    if (!shouldLoadBlogData) {
      isInitialLoadRef.current = false;
    }
  }, [shouldLoadBlogData, fetchPosts, fetchStats]);

  // Utility functions - all use cache, no API calls
  const getPost = useCallback((id: string): BlogPost | null => {
    return cache.posts.find(post => post.id === id) || null;
  }, [cache.posts]);

  const getPostBySlug = useCallback((slug: string): BlogPost | null => {
    return cache.posts.find(post => post.slug === slug) || null;
  }, [cache.posts]);

  const getPostsByCategory = useCallback((category: string): BlogPost[] => {
    if (!category) return [];
    return cache.categoriesMap.get(category) || [];
  }, [cache.categoriesMap]);

  const getPostsByTag = useCallback((tag: string): BlogPost[] => {
    if (!tag) return [];
    return cache.tagsMap.get(tag) || [];
  }, [cache.tagsMap]);

  const searchPosts = useCallback((query: string): BlogPost[] => {
    if (!query.trim()) return [];
    
    const searchTerm = query.toLowerCase();
    return cache.posts.filter(post => 
      post.title.toLowerCase().includes(searchTerm) ||
      (post.excerpt && post.excerpt.toLowerCase().includes(searchTerm)) ||
      post.content.toLowerCase().includes(searchTerm) ||
      (post.author?.name && post.author.name.toLowerCase().includes(searchTerm))
    );
  }, [cache.posts]);

  const getRelatedPosts = useCallback((currentPost: BlogPost, limit = 3): BlogPost[] => {
    const relatedPosts: Set<BlogPost> = new Set();
    
    // Add posts with same categories
    currentPost.categories?.forEach(category => {
      if (category) {
        getPostsByCategory(category)
          .filter(post => post.id !== currentPost.id)
          .forEach(post => relatedPosts.add(post));
      }
    });
    
    // Add posts with same tags
    currentPost.tags?.forEach(tag => {
      if (tag) {
        getPostsByTag(tag)
          .filter(post => post.id !== currentPost.id)
          .forEach(post => relatedPosts.add(post));
      }
    });
    
    // Add posts by same author
    cache.posts
      .filter(post => post.author_id === currentPost.author_id && post.id !== currentPost.id)
      .forEach(post => relatedPosts.add(post));
    
    // Convert to array, sort by relevance
    return Array.from(relatedPosts)
      .sort((a, b) => {
        // Sort by number of matching categories + tags
        const aScore = 
          (a.categories?.filter(c => currentPost.categories?.includes(c)).length || 0) +
          (a.tags?.filter(t => currentPost.tags?.includes(t)).length || 0);
        const bScore = 
          (b.categories?.filter(c => currentPost.categories?.includes(c)).length || 0) +
          (b.tags?.filter(t => currentPost.tags?.includes(t)).length || 0);
        return bScore - aScore;
      })
      .slice(0, limit);
  }, [cache.posts, getPostsByCategory, getPostsByTag]);

  const refreshPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      await fetchPosts(true);
    } finally {
      setIsLoading(false);
    }
  }, [fetchPosts]);

  const refreshStats = useCallback(async () => {
    await fetchStats(true);
  }, [fetchStats]);

  const refreshCategories = useCallback(async () => {
    // NO API CALL - just refresh from current posts
    await fetchCategories(true);
  }, [fetchCategories]);

  const invalidateCache = useCallback(() => {
    // Clear the cache
    setCache({
      posts: [],
      stats: null,
      categories: [],
      timestamp: 0,
      categoriesMap: new Map(),
      tagsMap: new Map(),
    });
    
    // Reset initial load flag to allow fresh data loading
    isInitialLoadRef.current = false;
    
    // Only fetch posts if we're on blog pages
    if (shouldLoadBlogData) {
      refreshPosts();
    }
  }, [shouldLoadBlogData, refreshPosts]);

  const contextValue: BlogContextType = useMemo(() => ({
    posts,
    stats,
    categories,
    isLoading,
    error,
    refreshPosts,
    refreshStats,
    refreshCategories,
    getPost,
    getPostBySlug,
    getPostsByCategory,
    getPostsByTag,
    searchPosts,
    getRelatedPosts,
    invalidateCache,
  }), [
    posts,
    stats,
    categories,
    isLoading,
    error,
    refreshPosts,
    refreshStats,
    refreshCategories,
    getPost,
    getPostBySlug,
    getPostsByCategory,
    getPostsByTag,
    searchPosts,
    getRelatedPosts,
    invalidateCache,
  ]);

  return (
    <BlogContext.Provider value={contextValue}>
      {children}
    </BlogContext.Provider>
  );
};