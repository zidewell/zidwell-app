// app/components/blog-components/BlogSection.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Newspaper, TrendingUp, Loader2, RefreshCw } from "lucide-react";
import { Button } from "../../ui/button"; 
import { useBlog } from "@/app/context/BlogContext";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string;
  createdAt: string;
  readTime: number;
  author: {
    name: string;
    avatar?: string;
  };
  categories: Array<{ id: string; name: string } | string>;
}

export function BlogSection() {
  const { 
    posts, 
    isLoading, 
    isInitialized, 
    refreshPosts,
    forceRefresh,
    error 
  } = useBlog();
  
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Transform posts from context
  useEffect(() => {
    if (posts.length > 0) {
      const published = posts.filter(post => post.is_published);
      
      const transformed = published.slice(0, 6).map((post: any) => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || "",
        featuredImage: post.featured_image || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBF9jAdhX2MuVy2aLW60NI0D7FZn5LdFs1LY9CXyweMw&s=10",
        createdAt: post.created_at || new Date().toISOString(),
        readTime: post.read_time || post.readTime || 5,
        author: {
          name: post.author?.name || post.author_name || "Unknown Author",
          avatar: post.author?.avatar || post.author_avatar || null,
        },
        categories: Array.isArray(post.categories)
          ? post.categories.map((cat: any) => {
              if (typeof cat === "string") {
                return { id: `cat-${cat}`, name: cat };
              }
              return cat;
            })
          : [],
      }));
      
      setRecentPosts(transformed);
    } else if (isInitialized && posts.length === 0) {
      setRecentPosts([]);
    }
  }, [posts, isInitialized]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Recent";
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Recent";
    }
  };

  const getInitials = (name: string): string => {
    if (!name || name === "Unknown Author") return "U";
    const names = name.trim().split(" ");
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
  };

  const getAvatarColor = (name: string): string => {
    const colors = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444", "#06B6D4", "#EC4899", "#8B4513"];
    const hash = name.split("").reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
    return colors[Math.abs(hash) % colors.length];
  };

  const getImageUrl = (imageUrl: string | undefined): string => {
    if (!imageUrl) return "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBF9jAdhX2MuVy2aLW60NI0D7FZn5LdFs1LY9CXyweMw&s=10";
    if (imageUrl.startsWith("http") || imageUrl.startsWith("data:")) return imageUrl;
    if (imageUrl.startsWith("/")) return imageUrl;
    return `/${imageUrl}`;
  };

  const handleImageError = (postId: string) => {
    setImageErrors((prev) => ({ ...prev, [postId]: true }));
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await forceRefresh();
    setIsRefreshing(false);
  };

  // Show loading state
  if ((isLoading || !isInitialized) && recentPosts.length === 0) {
    return (
      <div className="mt-20 md:mt-32 pt-12 md:pt-20 border-t border-[var(--border-color)]">
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[var(--color-accent-yellow)]/10 rounded-full mb-4">
            <Newspaper className="w-4 h-4 text-[var(--color-accent-yellow)]" />
            <span className="text-xs font-semibold text-[var(--color-accent-yellow)] uppercase tracking-wider">
              Latest Updates
            </span>
          </div>
          <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[var(--text-primary)]">
            Loading <span className="text-[var(--color-accent-yellow)]">Insights</span>...
          </h3>
          <p className="text-[var(--text-secondary)] text-sm md:text-base mt-2 max-w-2xl mx-auto">
            Please wait while we load the latest articles
          </p>
        </div>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-12 h-12 text-[var(--color-accent-yellow)] animate-spin" />
        </div>
      </div>
    );
  }

  // Show error state
  if (error && recentPosts.length === 0) {
    return (
      <div className="mt-20 md:mt-32 pt-12 md:pt-20 border-t border-[var(--border-color)]">
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-100 rounded-full mb-4">
            <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">
              Error
            </span>
          </div>
          <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[var(--text-primary)]">
            Failed to Load <span className="text-red-500">Posts</span>
          </h3>
          <p className="text-[var(--text-secondary)] text-sm md:text-base mt-2 max-w-2xl mx-auto">
            {error}
          </p>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="mt-4 bg-[var(--color-accent-yellow)] hover:bg-[var(--color-accent-yellow)]/90 text-[var(--color-ink)]"
          >
            {isRefreshing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-20 md:mt-32 pt-12 md:pt-20 border-t border-[var(--border-color)]">
      <div className="text-center mb-8 md:mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[var(--color-accent-yellow)]/10 rounded-full mb-4">
          <Newspaper className="w-4 h-4 text-[var(--color-accent-yellow)]" />
          <span className="text-xs font-semibold text-[var(--color-accent-yellow)] uppercase tracking-wider">
            Latest Updates
          </span>
        </div>
        <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[var(--text-primary)]">
          Explore <span className="text-[var(--color-accent-yellow)]">Insights</span> &{" "}
          <span className="text-[var(--color-accent-yellow)]">News</span>
        </h3>
        <p className="text-[var(--text-secondary)] text-sm md:text-base mt-2 max-w-2xl mx-auto">
          Discover expert insights, financial tips, and the latest updates from Zidwell
        </p>
        {/* Refresh Button */}
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="ghost"
          size="sm"
          className="mt-4 text-[var(--text-secondary)] hover:text-[var(--color-accent-yellow)]"
        >
          {isRefreshing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Posts
            </>
          )}
        </Button>
      </div>

      {recentPosts.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {recentPosts.map((post) => {
              const imageUrl = getImageUrl(post.featuredImage);
              const hasError = imageErrors[post.id];
              const categoryName = post.categories && post.categories.length > 0
                ? typeof post.categories[0] === "string"
                  ? post.categories[0]
                  : post.categories[0]?.name || "Uncategorized"
                : "Uncategorized";

              return (
                <Link
                  key={post.id}
                  href={`/blog/post-blog/${post.slug}`}
                  className="group block bg-[var(--bg-primary)] rounded-lg overflow-hidden border border-[var(--border-color)] hover:border-[var(--color-accent-yellow)] transition-all duration-300 hover:shadow-lg"
                >
                  <div className="aspect-16/10 overflow-hidden bg-[var(--bg-secondary)] relative">
                    <Image
                      src={hasError ? "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBF9jAdhX2MuVy2aLW60NI0D7FZn5LdFs1LY9CXyweMw&s=10" : imageUrl}
                      alt={post.title || "Blog post"}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      onError={() => handleImageError(post.id)}
                    />
                  </div>
                  <div className="p-4 md:p-5">
                    <span className="text-xs font-medium text-[var(--color-accent-yellow)] uppercase tracking-wider">
                      {categoryName}
                    </span>
                    <h4 className="font-semibold text-base md:text-lg text-[var(--text-primary)] mt-1 mb-2 line-clamp-2 group-hover:text-[var(--color-accent-yellow)] transition-colors">
                      {post.title}
                    </h4>
                    <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-3">
                      {post.excerpt || "Read more about this topic..."}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                      <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center border border-[var(--border-color)] shrink-0">
                        {post.author?.avatar ? (
                          <Image
                            src={getImageUrl(post.author.avatar)}
                            alt={post.author.name || "Author"}
                            width={20}
                            height={20}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              target.style.display = "none";
                              const parent = target.parentElement;
                              if (parent) {
                                const initialsDiv = document.createElement("div");
                                initialsDiv.className = "w-full h-full flex items-center justify-center";
                                initialsDiv.style.backgroundColor = getAvatarColor(post.author?.name || "Unknown");
const span = document.createElement("span");
                              span.className = "text-background text-[8px] font-semibold";
                                span.textContent = getInitials(post.author?.name || "Unknown");
                                initialsDiv.appendChild(span);
                                parent.appendChild(initialsDiv);
                              }
                            }}
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={{ backgroundColor: getAvatarColor(post.author?.name || "Unknown") }}
                          >
                            <span className="text-background text-[8px] font-semibold">
                              {getInitials(post.author?.name || "Unknown")}
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="truncate max-w-[60px]">{post.author?.name || "Unknown"}</span>
                      <span>·</span>
                      <span>{formatDate(post.createdAt)}</span>
                      {post.readTime && (
                        <>
                          <span>·</span>
                          <span>{post.readTime} min</span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="text-center mt-10">
            <Link href="/blog">
              <Button
                variant="outline"
                size="lg"
                className="border-[var(--color-accent-yellow)] text-[var(--color-accent-yellow)] hover:bg-[var(--color-accent-yellow)]/10 hover:border-[var(--color-accent-yellow)] transition-all duration-300 group"
              >
                <TrendingUp className="w-4 h-4 mr-2 transition-transform group-hover:rotate-12" />
                View All Articles
                <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </>
      ) : (
        <div className="text-center py-12 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)]">
          <div className="max-w-md mx-auto">
            <Newspaper className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-4 opacity-50" />
            <p className="text-[var(--text-secondary)] text-lg font-medium">No blog posts available yet</p>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Check back soon for updates!</p>
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="mt-4 bg-[var(--color-accent-yellow)] hover:bg-[var(--color-accent-yellow)]/90 text-[var(--color-ink)]"
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}