// app/components/blog-components/blog/BlogSidebar.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Mail, TrendingUp, Clock } from "lucide-react";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Skeleton } from "../../ui/skeleton";
import Link from "next/link";
import { useBlog } from "@/app/context/BlogContext";

interface BlogSidebarProps {
  onSearch: (query: string) => void;
  isSearching?: boolean;
}

const BlogSidebar = ({ onSearch, isSearching }: BlogSidebarProps) => {
  const { stats, posts, isLoading } = useBlog();
  const [searchQuery, setSearchQuery] = useState("");
  const [email, setEmail] = useState("");

  // Get recent posts (published only)
  const recentPosts = useMemo(() => {
    if (!stats) return [];
    return stats.recentPosts.slice(0, 5).filter(post => post.is_published);
  }, [stats]);

  // Get popular posts (published only)
  const popularPosts = useMemo(() => {
    if (!stats) return [];
    return stats.popularPosts.slice(0, 5).filter(post => post.is_published);
  }, [stats]);

  // Get all categories with counts
  const categories = useMemo(() => {
    if (!stats) return [];
    return stats.categories;
  }, [stats]);

  // Calculate archive data from posts
  const archives = useMemo(() => {
    if (!posts.length) return [];
    
    const archiveMap = new Map<string, number>();
    
    posts.forEach(post => {
      if (post.is_published && post.published_at) {
        const date = new Date(post.published_at);
        const year = date.getFullYear();
        const month = date.toLocaleString('default', { month: 'long' });
        const key = `${year}-${month}`;
        archiveMap.set(key, (archiveMap.get(key) || 0) + 1);
      }
    });
    
    return Array.from(archiveMap.entries())
      .map(([key, count]) => {
        const [year, month] = key.split('-');
        return {
          label: `${month} ${year}`,
          year,
          month,
          count,
        };
      })
      .sort((a, b) => {
        // Sort by year and month descending
        if (a.year !== b.year) return parseInt(b.year) - parseInt(a.year);
        const months = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months.indexOf(b.month) - months.indexOf(a.month);
      })
      .slice(0, 6); // Limit to 6 archives
  }, [posts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      if (response.ok) {
        alert("Thank you for subscribing!");
        setEmail("");
      } else {
        alert("Subscription failed. Please try again.");
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert("An error occurred. Please try again.");
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <aside className="space-y-8">
        {/* Search Skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        
        {/* Subscribe Skeleton */}
        <div className="bg-secondary/50 rounded-lg p-5 space-y-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        
        {/* Recent Posts Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-5 w-32" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-16 h-16 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
        
        {/* Categories Skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-5 w-24" />
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className="space-y-8">
      {/* Search */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Search
        </h3>
        <form onSubmit={handleSearch} className="relative">
          <Input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
            disabled={isSearching}
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            disabled={isSearching}
          >
            <Search className={`w-4 h-4 ${isSearching ? 'animate-spin' : ''}`} />
          </button>
        </form>
      </div>

      {/* Subscribe */}
      <div className="bg-secondary/50 rounded-lg p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Get Updates
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Subscribe to receive the latest financial insights directly in your
          inbox.
        </p>
        <form onSubmit={handleSubscribe} className="space-y-2">
          <Input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isSearching}
          />
          <Button
            type="submit"
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
            disabled={isSearching}
          >
            Subscribe
          </Button>
        </form>
      </div>

      {/* Popular Posts */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Popular Posts
          </h3>
        </div>
        {popularPosts.length > 0 ? (
          <div className="space-y-4">
            {popularPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="flex gap-3 group"
              >
                {post.featured_image && (
                  <img
                    src={post.featured_image}
                    alt={post.title}
                    className="w-16 h-16 object-cover rounded shrink-0"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                )}
                <div className="hidden w-16 h-16 bg-muted rounded shrink-0 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">No Image</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium line-clamp-2 group-hover:text-accent transition-colors">
                    {post.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {post.author?.name || 'Unknown Author'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No popular posts yet</p>
        )}
      </div>

      {/* Recent Posts */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Recent Posts
          </h3>
        </div>
        {recentPosts.length > 0 ? (
          <div className="space-y-4">
            {recentPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="flex gap-3 group"
              >
                {post.featured_image && (
                  <img
                    src={post.featured_image}
                    alt={post.title}
                    className="w-16 h-16 object-cover rounded shrink-0"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                )}
                <div className="hidden w-16 h-16 bg-muted rounded shrink-0 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">No Image</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium line-clamp-2 group-hover:text-accent transition-colors">
                    {post.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {post.author?.name || 'Unknown Author'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No recent posts yet</p>
        )}
      </div>

      {/* Categories */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Categories
        </h3>
        {categories.length > 0 ? (
          <ul className="space-y-2">
            {categories.map((category) => (
              <li key={category.name}>
                <Link
                  href={`/blog?category=${encodeURIComponent(category.name)}`}
                  className="flex items-center justify-between text-sm hover:text-accent transition-colors"
                >
                  <span className="capitalize">{category.name}</span>
                  <span className="text-muted-foreground text-xs">
                    ({category.count})
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No categories yet</p>
        )}
      </div>

      {/* Archives */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Archives
        </h3>
        {archives.length > 0 ? (
          <ul className="space-y-2">
            {archives.map((archive) => (
              <li key={archive.label}>
                <Link
                  href={`/blog?archive=${archive.year}-${archive.month.toLowerCase()}`}
                  className="flex items-center justify-between text-sm hover:text-accent transition-colors"
                >
                  <span>{archive.label}</span>
                  <span className="text-muted-foreground text-xs">
                    ({archive.count})
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No archives yet</p>
        )}
      </div>

      {/* Ad Placeholder */}
      <div className="bg-muted rounded-lg p-6 text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
          Advertisement
        </p>
        <div className="h-48 bg-border/50 rounded flex items-center justify-center">
          <span className="text-sm text-muted-foreground">Ad Space</span>
        </div>
      </div>
    </aside>
  );
};

export default BlogSidebar;