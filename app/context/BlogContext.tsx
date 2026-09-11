// app/context/BlogContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
} from "react";

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
    throw new Error("useBlog must be used within BlogProvider");
  }
  return context;
};

interface BlogProviderProps {
  children: ReactNode;
}

const CACHE_KEY = "blog_cache_data";
const COOLDOWN_MS = 5 * 60 * 1000;
const FETCH_TIMEOUT_MS = 15 * 1000;
const SAFETY_LOADING_TIMEOUT_MS = 20 * 1000;

// Module-level caches — persist across remounts within the same JS session
let globalData: {
  allPosts: BlogPost[];
  recentPosts: BlogPost[];
  popularPosts: BlogPost[];
  categories: BlogCategory[];
} | null = null;

let globalFetchPromise: Promise<void> | null = null;

export const BlogProvider: React.FC<BlogProviderProps> = ({ children }) => {
  const [posts, setPosts] = useState<BlogPost[]>(globalData?.allPosts || []);
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>(
    globalData?.recentPosts || [],
  );
  const [popularPosts, setPopularPosts] = useState<BlogPost[]>(
    globalData?.popularPosts || [],
  );
  const [categories, setCategories] = useState<BlogCategory[]>(
    globalData?.categories || [],
  );
  const [isLoading, setIsLoading] = useState(!globalData);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(!!globalData);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const isMountedRef = useRef(true);

  // ─────────────────────────────────────────
  // Cache helpers
  // ─────────────────────────────────────────
  const readCache = useCallback(() => {
    try {
      if (typeof window === "undefined") return null;
      const stored = localStorage.getItem(CACHE_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      if (Date.now() - parsed.timestamp > COOLDOWN_MS) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }
      return parsed.data;
    } catch {
      return null;
    }
  }, []);

  const writeCache = useCallback((data: any) => {
    try {
      if (typeof window === "undefined") return;
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ data, timestamp: Date.now() }),
      );
    } catch (err) {
      console.warn("Failed to save cache:", err);
    }
  }, []);

  const getRemainingCooldown = useCallback(() => {
    if (typeof window === "undefined") return 0;
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (!stored) return 0;
      const parsed = JSON.parse(stored);
      return Math.max(0, COOLDOWN_MS - (Date.now() - parsed.timestamp));
    } catch {
      return 0;
    }
  }, []);

  // ─────────────────────────────────────────
  // Transform
  // ─────────────────────────────────────────
  const transformPosts = useCallback((data: any): BlogPost[] => {
    const list = data?.posts || data;
    if (!Array.isArray(list)) return [];

    return list.map((post: any) => ({
      id: post.id || "",
      title: post.title || "Untitled",
      slug: post.slug || "",
      excerpt: post.excerpt || null,
      content: post.content || "",
      categories: post.categories || [],
      tags: post.tags || [],
      featured_image: post.featured_image || null,
      is_published: post.is_published || false,
      author_id: post.author_id || "",
      author: {
        id: post.author?.id || post.author_id || "",
        name: post.author?.name || post.author_name || "Unknown Author",
        avatar: post.author?.avatar || post.author_avatar || null,
        bio: post.author?.bio || post.author_bio || null,
      },
      published_at: post.published_at || null,
      created_at: post.created_at || new Date().toISOString(),
      updated_at:
        post.updated_at || post.created_at || new Date().toISOString(),
      view_count: post.view_count || 0,
      likes_count: post.likes_count || 0,
      comments_count: post.comments_count || post.comment_count || 0,
    }));
  }, []);

  const extractCategories = useCallback(
    (posts: BlogPost[]): BlogCategory[] => {
      const map = new Map<string, number>();
      posts.forEach((post) => {
        if (Array.isArray(post.categories)) {
          post.categories.forEach((cat: string) => {
            if (cat && cat.trim()) {
              const name = cat.trim();
              map.set(name, (map.get(name) || 0) + 1);
            }
          });
        }
      });
      return Array.from(map.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    },
    [],
  );

  // ─────────────────────────────────────────
  // Apply data (to state + global)
  // ─────────────────────────────────────────
  const applyData = useCallback(
    (data: {
      allPosts: BlogPost[];
      recentPosts: BlogPost[];
      popularPosts: BlogPost[];
      categories: BlogCategory[];
    }) => {
      globalData = data;
      if (!isMountedRef.current) return;
      setPosts(data.allPosts);
      setRecentPosts(data.recentPosts);
      setPopularPosts(data.popularPosts);
      setCategories(data.categories);
      setIsInitialized(true);
      setIsLoading(false);
    },
    [],
  );

  // ─────────────────────────────────────────
  // Core fetch
  // ─────────────────────────────────────────
  const runFetch = useCallback(async (): Promise<void> => {
    console.log("🔄 runFetch starting…");

    if (isMountedRef.current) {
      setIsLoading(true);
      setError(null);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn("⏱️ fetch timeout hit — aborting");
      controller.abort();
    }, FETCH_TIMEOUT_MS);

    try {
      const [allRes, recentRes, popularRes] = await Promise.all([
        fetch("/api/blog/posts?limit=100&published=true", {
          signal: controller.signal,
        }),
        fetch(
          "/api/blog/posts?limit=5&sort_by=created_at&sort_order=desc&published=true",
          { signal: controller.signal },
        ),
        fetch(
          "/api/blog/posts?limit=5&sort_by=view_count&sort_order=desc&published=true",
          { signal: controller.signal },
        ),
      ]);

      console.log("📥 responses:", {
        all: allRes.status,
        recent: recentRes.status,
        popular: popularRes.status,
      });

      if (!allRes.ok || !recentRes.ok || !popularRes.ok) {
        throw new Error(
          `Fetch failed: all=${allRes.status} recent=${recentRes.status} popular=${popularRes.status}`,
        );
      }

      const [allJson, recentJson, popularJson] = await Promise.all([
        allRes.json(),
        recentRes.json(),
        popularRes.json(),
      ]);

      const allPosts = transformPosts(allJson);
      const data = {
        allPosts,
        recentPosts: transformPosts(recentJson),
        popularPosts: transformPosts(popularJson),
        categories: extractCategories(allPosts),
      };

      console.log(`✅ fetch complete — ${data.allPosts.length} posts`);

      writeCache(data);
      applyData(data);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        console.warn("🛑 fetch aborted");
      } else {
        console.error("❌ fetch error:", err);
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : "Failed to fetch");
        }
      }
      // ✅ Always end in a resolved state
      if (isMountedRef.current) {
        setIsInitialized(true);
        setIsLoading(false);
      }
    } finally {
      clearTimeout(timeoutId);
      if (isMountedRef.current) {
        setIsLoading(false);
      }
      console.log("🏁 runFetch finished");
    }
  }, [transformPosts, extractCategories, writeCache, applyData]);

  // ─────────────────────────────────────────
  // Public fetch (dedupes via globalFetchPromise)
  // ─────────────────────────────────────────
  const fetchAllPosts = useCallback(async (): Promise<void> => {
    if (globalFetchPromise) {
      console.log("⏳ Awaiting in-flight global fetch…");
      try {
        await globalFetchPromise;
      } catch {
        /* ignore */
      }
      if (globalData) applyData(globalData);
      return;
    }

    const promise = runFetch();
    globalFetchPromise = promise;

    try {
      await promise;
    } finally {
      globalFetchPromise = null;
    }
  }, [runFetch, applyData]);

  // ─────────────────────────────────────────
  // Public refresh
  // ─────────────────────────────────────────
  const refreshPosts = useCallback(async () => {
    const remaining = getRemainingCooldown();
    if (remaining > 0) {
      console.log(
        `⏳ Cooldown active (${Math.ceil(remaining / 1000)}s) — using cache`,
      );
      const cached = readCache();
      if (cached) applyData(cached);
      return;
    }
    await fetchAllPosts();
  }, [getRemainingCooldown, readCache, applyData, fetchAllPosts]);

  const forceRefresh = useCallback(async () => {
    console.log("🔄 Force refresh");
    if (typeof window !== "undefined") {
      localStorage.removeItem(CACHE_KEY);
    }
    globalData = null;
    globalFetchPromise = null;
    if (isMountedRef.current) {
      setIsInitialized(false);
      setPosts([]);
      setRecentPosts([]);
      setPopularPosts([]);
      setCategories([]);
    }
    await fetchAllPosts();
  }, [fetchAllPosts]);

  // ─────────────────────────────────────────
  // Cooldown ticker
  // ─────────────────────────────────────────
  useEffect(() => {
    setCooldownRemaining(getRemainingCooldown());
    const id = setInterval(() => {
      setCooldownRemaining(getRemainingCooldown());
    }, 1000);
    return () => clearInterval(id);
  }, [getRemainingCooldown]);

  // ─────────────────────────────────────────
  // MOUNT — the critical effect
  // ─────────────────────────────────────────
  useEffect(() => {
    isMountedRef.current = true;

    // 1. Module-level data already loaded in this JS session → use it instantly
    if (globalData) {
      console.log("📦 globalData in memory — hydrating");
      applyData(globalData);
      return;
    }

    // 2. localStorage cache → use it instantly (no network needed)
    const cached = readCache();
    if (cached) {
      console.log("📦 Cache hit — hydrating from localStorage");
      applyData(cached);
      return;
    }

    // 3. A fetch is already running somewhere → wait for it
    if (globalFetchPromise) {
      console.log("⏳ Global fetch in flight — waiting…");
      setIsLoading(true);
      globalFetchPromise
        .catch(() => {})
        .finally(() => {
          if (isMountedRef.current) {
            if (globalData) applyData(globalData);
            else setIsInitialized(true);
            setIsLoading(false);
          }
        });
      return;
    }

    // 4. Cold start → fetch now
    console.log("📡 Cold start — fetching now");
    fetchAllPosts();
  }, [applyData, readCache, fetchAllPosts]);

  // ─────────────────────────────────────────
  // Track unmount
  // ─────────────────────────────────────────
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ─────────────────────────────────────────
  // SAFETY NET
  // ─────────────────────────────────────────
  useEffect(() => {
    if (!isLoading) return;
    const t = setTimeout(() => {
      console.warn("⚠️ Safety: isLoading stuck — forcing resolved state");
      setIsLoading(false);
      setIsInitialized(true);
      if (globalData) applyData(globalData);
    }, SAFETY_LOADING_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [isLoading, applyData]);

  const value: BlogContextType = {
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
  };

  return <BlogContext.Provider value={value}>{children}</BlogContext.Provider>;
};