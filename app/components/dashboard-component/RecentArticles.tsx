"use client";

import { ArrowRight } from "lucide-react";
import { useBlog } from "@/app/context/BlogContext";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

const CACHE_DURATION = 10 * 60 * 1000;
const CACHE_KEY = "recent_articles_cache";

interface CachedData {
  articles: any[];
  timestamp: number;
}

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

const getCachedArticles = (): CachedData | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch (error) {}
  return null;
};

const setCachedArticles = (articles: any[]) => {
  try {
    const cacheData: CachedData = { articles, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {}
};

const isCacheValid = (cachedData: CachedData | null): boolean => {
  if (!cachedData) return false;
  return Date.now() - cachedData.timestamp < CACHE_DURATION;
};

const RecentArticles = () => {
  const { posts, recentPosts, isLoading: blogLoading, error: blogError } = useBlog();
  const [displayArticles, setDisplayArticles] = useState<any[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFromCache, setIsFromCache] = useState(false);
  const [hasError, setHasError] = useState(false);
  const initialLoadRef = useRef(false);

  useEffect(() => { setIsClient(true); }, []);

  useEffect(() => {
    if (!isClient || initialLoadRef.current) return;
    initialLoadRef.current = true;

    const loadArticles = async () => {
      try {
        const cached = getCachedArticles();
        if (cached && isCacheValid(cached) && cached.articles.length > 0) {
          setDisplayArticles(cached.articles);
          setIsFromCache(true);
          setIsLoading(false);
          return;
        }

        if (blogError) {
          setHasError(true);
          setIsLoading(false);
          return;
        }

        if (recentPosts && recentPosts.length > 0) {
          const articles = recentPosts.slice(0, 3).map(transformPostForDisplay);
          setDisplayArticles(articles);
          setCachedArticles(articles);
          setIsFromCache(false);
        } else if (posts && posts.length > 0) {
          const sortedPosts = [...posts]
            .filter((post) => post.is_published)
            .sort((a, b) => new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime())
            .slice(0, 3)
            .map(transformPostForDisplay);
          if (sortedPosts.length > 0) {
            setDisplayArticles(sortedPosts);
            setCachedArticles(sortedPosts);
            setIsFromCache(false);
          } else {
            setHasError(true);
          }
        } else if (!blogLoading && (!posts || posts.length === 0) && (!recentPosts || recentPosts.length === 0)) {
          setHasError(true);
        }
      } catch (error) {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (blogLoading && !getCachedArticles()) return;
    loadArticles();
  }, [posts, recentPosts, isClient, blogLoading, blogError]);

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
            .sort((a, b) => new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime())
            .slice(0, 3)
            .map(transformPostForDisplay);
          articles = sortedPosts;
        }
        if (articles.length > 0) {
          const currentCache = getCachedArticles();
          const currentIds = currentCache?.articles.map((a) => a.id).join(",");
          const newIds = articles.map((a) => a.id).join(",");
          if (currentIds !== newIds) {
            setCachedArticles(articles);
            setDisplayArticles(articles);
            setHasError(false);
          }
        }
      } catch (error) {}
    };
    const timeoutId = setTimeout(refreshCache, 2000);
    return () => clearTimeout(timeoutId);
  }, [posts, recentPosts, isClient, hasError]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    } catch { return "Recent"; }
  };

  if (hasError || (!isLoading && !blogLoading && displayArticles.length === 0 && !isFromCache)) return null;
  if (!isClient) return null;

  if (isLoading || (blogLoading && !isFromCache)) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6 mt-5">
          <h3 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-wide">Recent Articles</h3>
          <div className="text-sm font-bold text-[var(--color-accent-yellow)] flex items-center gap-2 uppercase tracking-wide">
            View All <ArrowRight className="w-4 h-4" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[var(--bg-primary)] border-2 border-[var(--border-color)] rounded-md overflow-hidden shadow-[4px_4px_0px_var(--border-color)]">
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
        {isFromCache && <p className="text-xs text-gray-400 text-center mt-2">Loading fresh content...</p>}
      </div>
    );
  }

  if (!displayArticles || displayArticles.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 mt-5">
        <h3 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-wide">Recent Articles</h3>
        <Link href="/blog" className="text-sm font-bold text-[var(--color-accent-yellow)] hover:underline flex items-center gap-2 uppercase tracking-wide">
          View All <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayArticles.map((article) => (
          <Link
            key={article.id}
            href={`/blog/post-blog/${article.slug}`}
            className="block bg-[var(--bg-primary)] border-2 border-[var(--border-color)] rounded-md overflow-hidden shadow-[4px_4px_0px_var(--border-color)]
                       hover:shadow-[6px_6px_0px_var(--border-color)] dark:hover:shadow-[6px_6px_0px_rgba(253,192,32,0.4)] hover:-translate-x-px hover:-translate-y-px
                       active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all duration-150 group cursor-pointer"
          >
            <div className="w-full h-48 overflow-hidden border-b-2 border-[var(--border-color)]">
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
              <p className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-widest mb-3">
                {formatDate(article.date)}
              </p>
              <h4 className="font-bold text-lg text-[var(--text-primary)] leading-snug mb-3 group-hover:text-[var(--color-accent-yellow)] transition-colors line-clamp-2">
                {article.title}
              </h4>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-['Be_Vietnam_Pro'] line-clamp-3">
                {article.excerpt}
              </p>
              <div className="mt-4 text-sm font-bold text-[var(--color-accent-yellow)] flex items-center gap-2 uppercase tracking-wide">
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