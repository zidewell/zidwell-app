"use client";

import { ArrowRight } from "lucide-react";
import { useBlog } from "@/app/context/BlogContext";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

// Cache configuration
const CACHE_DURATION = 10 * 60 * 1000;
const CACHE_KEY = "recent_articles_cache";

interface CachedData {
  articles: any[];
  timestamp: number;
}

// Helper function to transform API post to display format
const transformPostForDisplay = (post: any) => {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt || post.content?.substring(0, 120) + "...",
    date: post.published_at || post.created_at,
    image: post.featured_image || post.featuredImage,
    author: post.author?.name || post.author_name || "Author",
  };
};

// Cache utility functions
const getCachedArticles = (): CachedData | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.warn("Failed to read from cache:", error);
  }
  return null;
};

const setCachedArticles = (articles: any[]) => {
  try {
    const cacheData: CachedData = {
      articles,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.warn("Failed to write to cache:", error);
  }
};

const isCacheValid = (cachedData: CachedData | null): boolean => {
  if (!cachedData) return false;
  const now = Date.now();
  return now - cachedData.timestamp < CACHE_DURATION;
};

const RecentArticles = () => {
  const { posts, recentPosts, isLoading: blogLoading, error: blogError } = useBlog();
  const [displayArticles, setDisplayArticles] = useState<any[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFromCache, setIsFromCache] = useState(false);
  const [hasError, setHasError] = useState(false);
  const initialLoadRef = useRef(false);

  // Mark when client is ready
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load articles with cache
  useEffect(() => {
    if (!isClient || initialLoadRef.current) return;
    initialLoadRef.current = true;

    const loadArticles = async () => {
      try {
        // Try to get from cache first
        const cached = getCachedArticles();

        if (cached && isCacheValid(cached) && cached.articles.length > 0) {
          console.log("Loading articles from cache");
          setDisplayArticles(cached.articles);
          setIsFromCache(true);
          setIsLoading(false);
          return;
        }

        console.log("Cache miss or expired, loading from context");

        // Check if there's an error or no data
        if (blogError) {
          console.log("Blog error detected:", blogError);
          setHasError(true);
          setIsLoading(false);
          return;
        }

        // If no valid cache, wait for context data
        if (recentPosts && recentPosts.length > 0) {
          const articles = recentPosts.slice(0, 3).map(transformPostForDisplay);
          setDisplayArticles(articles);
          setCachedArticles(articles);
          setIsFromCache(false);
        } else if (posts && posts.length > 0) {
          const sortedPosts = [...posts]
            .filter((post) => post.is_published)
            .sort((a, b) => {
              const dateA = new Date(a.published_at || a.created_at);
              const dateB = new Date(b.published_at || b.created_at);
              return dateB.getTime() - dateA.getTime();
            })
            .slice(0, 3)
            .map(transformPostForDisplay);

          if (sortedPosts.length > 0) {
            setDisplayArticles(sortedPosts);
            setCachedArticles(sortedPosts);
            setIsFromCache(false);
          } else {
            // No published posts found
            setHasError(true);
          }
        } else if (!blogLoading && (!posts || posts.length === 0) && (!recentPosts || recentPosts.length === 0)) {
          // Context loaded but no data available
          setHasError(true);
        }
      } catch (error) {
        console.error("Error loading articles:", error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    // Don't load if we're still loading and have no cache
    if (blogLoading && !getCachedArticles()) {
      // Still loading, wait
      return;
    }

    loadArticles();
  }, [posts, recentPosts, isClient, blogLoading, blogError]);

  // Update cache when context data changes (background refresh)
  useEffect(() => {
    if (!isClient || (!recentPosts?.length && !posts?.length) || hasError) return;

    const refreshCache = () => {
      try {
        let articles: any[] = [];

        if (recentPosts && recentPosts.length > 0) {
          articles = recentPosts.slice(0, 3).map(transformPostForDisplay);
        } else if (posts && posts.length > 0) {
          const sortedPosts = [...posts]
            .filter((post) => post.is_published)
            .sort((a, b) => {
              const dateA = new Date(a.published_at || a.created_at);
              const dateB = new Date(b.published_at || b.created_at);
              return dateB.getTime() - dateA.getTime();
            })
            .slice(0, 3)
            .map(transformPostForDisplay);
          articles = sortedPosts;
        }

        if (articles.length > 0) {
          // Only update if articles have changed
          const currentCache = getCachedArticles();
          const currentIds = currentCache?.articles.map((a) => a.id).join(",");
          const newIds = articles.map((a) => a.id).join(",");

          if (currentIds !== newIds) {
            console.log("Background cache refresh");
            setCachedArticles(articles);
            setDisplayArticles(articles);
            setHasError(false); // Clear error state if we got data
          }
        }
      } catch (error) {
        console.warn("Background cache refresh failed:", error);
      }
    };

    // Debounce the refresh to avoid too frequent updates
    const timeoutId = setTimeout(refreshCache, 2000);
    return () => clearTimeout(timeoutId);
  }, [posts, recentPosts, isClient, hasError]);

  // Format date helper
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Recent";
    }
  };

  // Return null if blog is not available (error or no data after loading)
  if (hasError || (!isLoading && !blogLoading && displayArticles.length === 0 && !isFromCache)) {
    return null;
  }

  // Return null during SSR to prevent hydration mismatch (but check error state first)
  if (!isClient) {
    return null;
  }

  if (isLoading || (blogLoading && !isFromCache)) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-[#141414] dark:text-[#f5f5f5] uppercase tracking-wide">
            Recent Articles
          </h3>
          <div className="text-sm font-bold text-[#2b825b] dark:text-[#2b825b] flex items-center gap-2 uppercase tracking-wide">
            View All <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-[#ffffff] dark:bg-[#171717] border-2 border-[#242424] dark:border-[#474747] rounded-md overflow-hidden shadow-[4px_4px_0px_#242424] dark:shadow-[4px_4px_0px_#000000]"
            >
              <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div className="p-6">
                <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 animate-pulse mb-3" />
                <div className="h-6 w-full bg-gray-200 dark:bg-gray-700 animate-pulse mb-3" />
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 animate-pulse mb-2" />
                <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 animate-pulse mb-4" />
                <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
        {isFromCache && (
          <p className="text-xs text-gray-400 text-center mt-2">
            Loading fresh content...
          </p>
        )}
      </div>
    );
  }

  if (!displayArticles || displayArticles.length === 0) {
    return null; // Return null instead of showing "No articles available" message
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 mt-5">
        <h3 className="text-xl font-bold text-[#141414] dark:text-[#f5f5f5] uppercase tracking-wide">
          Recent Articles
        </h3>
        <Link
          href="/blog"
          className="text-sm font-bold text-[#2b825b] dark:text-[#2b825b] hover:underline flex items-center gap-2 uppercase tracking-wide"
        >
          View All <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayArticles.map((article) => (
          <Link
            key={article.id}
            href={`/blog/post-blog/${article.slug}`}
            className="block bg-[#ffffff] dark:bg-[#171717] border-2 border-[#242424] dark:border-[#474747] rounded-md overflow-hidden shadow-[4px_4px_0px_#242424] dark:shadow-[4px_4px_0px_#000000]
                       hover:shadow-[6px_6px_0px_#242424] dark:hover:shadow-[6px_6px_0px_rgba(43,130,91,0.4)] hover:-translate-x-px hover:-translate-y-px
                       active:shadow-none active:translate-x-0.5 active:translate-y-0.5
                       transition-all duration-150 group cursor-pointer"
          >
            <div className="w-full h-48 overflow-hidden border-b-2 border-[#242424] dark:border-[#474747]">
              <Image
                src={article.image}
                alt={article.title}
                width={500}
                height={300}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                priority={false}
              />
            </div>

            <div className="p-6">
              <p className="text-xs text-[#6b6b6b] dark:text-[#a6a6a6] font-bold uppercase tracking-widest mb-3">
                {formatDate(article.date)}
              </p>
              <h4 className="font-bold text-lg text-[#141414] dark:text-[#f5f5f5] leading-snug mb-3 group-hover:text-[#2b825b] dark:group-hover:text-[#2b825b] transition-colors line-clamp-2">
                {article.title}
              </h4>
              <p className="text-sm text-[#6b6b6b] dark:text-[#a6a6a6] leading-relaxed font-['Be_Vietnam_Pro'] line-clamp-3">
                {article.excerpt}
              </p>
              <div className="mt-4 text-sm font-bold text-[#2b825b] dark:text-[#2b825b] flex items-center gap-2 uppercase tracking-wide">
                Read More <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RecentArticles;