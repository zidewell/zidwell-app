"use client";

import { useState, useMemo } from "react";
import { Search, Mail, TrendingUp, Clock, Hash } from "lucide-react";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Skeleton } from "../../ui/skeleton";
import Link from "next/link";
import Swal from "sweetalert2";
import { useBlog } from "@/app/context/BlogContext";

interface BlogSidebarProps {
  onSearch?: (query: string) => void;
  isSearching?: boolean;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  author_name: string;
  published_at: string | null;
  created_at: string;
  view_count: number;
  likes_count: number;
  categories: string[];
}

interface BlogCategory {
  name: string;
  count: number;
}

const BlogSidebar = ({ 
  onSearch, 
  isSearching = false,
}: BlogSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  
  // Get data from context
  const { 
    recentPosts, 
    popularPosts, 
    categories, 
    isLoading 
  } = useBlog();

  // Initialize SweetAlert
  const showAlert = Swal.mixin({
    customClass: {
      confirmButton: "bg-[#C29307] text-white hover:bg-[#C29307]/90 px-4 py-2 rounded",
    },
    buttonsStyling: false,
  });

  // Calculate archive data from recent posts
  const archives = useMemo(() => {
    if (!recentPosts.length) return [];
    
    const archiveMap = new Map<string, number>();
    
    recentPosts.forEach(post => {
      if (post.published_at) {
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
  }, [recentPosts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery);
    } else if (searchQuery.trim()) {
      // Navigate to search results page
      window.location.href = `/blog/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      showAlert.fire({
        title: 'Email Required',
        text: 'Please enter your email address',
        icon: 'warning',
      });
      return;
    }

    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      showAlert.fire({
        title: 'Invalid Email',
        text: 'Please enter a valid email address',
        icon: 'warning',
      });
      return;
    }

    setIsSubscribing(true);

    try {
      // Simulate API call (replace with actual API)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For now, simulate success
      await showAlert.fire({
        title: 'Subscribed Successfully!',
        text: 'Thank you for subscribing to our newsletter.',
        icon: 'success',
        timer: 3000,
        showConfirmButton: false,
      });
      
      setEmail("");
      
    } catch (error) {
      console.error('Subscription error:', error);
      await showAlert.fire({
        title: 'Subscription Failed',
        text: 'An error occurred. Please try again.',
        icon: 'error',
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  // Helper function to get author name
  const getAuthorName = (post: BlogPost) => {
    if (post.author_name) return post.author_name;
    return 'Unknown Author';
  };

  // Helper function for image error handling
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    img.style.display = 'none';
    
    // Find or create the fallback div
    const parent = img.parentElement;
    if (parent) {
      let fallbackDiv = parent.querySelector('.image-fallback') as HTMLElement;
      if (!fallbackDiv) {
        fallbackDiv = document.createElement('div');
        fallbackDiv.className = 'image-fallback w-16 h-16 bg-muted rounded shrink-0 flex items-center justify-center';
        fallbackDiv.innerHTML = '<span class="text-xs text-muted-foreground">No Image</span>';
        parent.appendChild(fallbackDiv);
      }
      fallbackDiv.style.display = 'flex';
    }
  };

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
        
        {/* Popular Posts Skeleton */}
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
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSearching}
            aria-label="Search"
          >
            <Search className={`w-4 h-4 ${isSearching ? 'animate-spin' : ''}`} />
          </button>
        </form>
      </div>

      {/* Subscribe */}
      <div className="bg-secondary/50 rounded-lg p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-[#C29307]" />
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
            disabled={isSubscribing}
            className="w-full"
          />
          <Button
            type="submit"
            className="w-full bg-[#C29307] hover:bg-[#C29307]/90 text-white"
            disabled={isSubscribing}
          >
            {isSubscribing ? "Subscribing..." : "Subscribe"}
          </Button>
        </form>
      </div>

      {/* Popular Posts */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#C29307]" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Popular Posts
          </h3>
        </div>
        {popularPosts.length > 0 ? (
          <div className="space-y-4">
            {popularPosts.slice(0, 5).map((post:any) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="flex gap-3 group hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors"
              >
                {post.featured_image ? (
                  <img
                    src={post.featured_image}
                    alt={post.title}
                    className="w-16 h-16 object-cover rounded shrink-0"
                    onError={handleImageError}
                    loading="lazy"
                  />
                ) : (
                  <div className="w-16 h-16 bg-muted rounded shrink-0 flex items-center justify-center">
                    <Hash className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium line-clamp-2 group-hover:text-[#C29307] transition-colors">
                    {post.title}
                  </h4>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-muted-foreground">
                      {getAuthorName(post)}
                    </p>
                    <span className="text-xs text-gray-500">
                      {post.view_count || 0} views
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">No popular posts yet</p>
        )}
      </div>

      {/* Recent Posts */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#C29307]" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Recent Posts
          </h3>
        </div>
        {recentPosts.length > 0 ? (
          <div className="space-y-4">
            {recentPosts.slice(0, 5).map((post:any) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="flex gap-3 group hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors"
              >
                {post.featured_image ? (
                  <img
                    src={post.featured_image}
                    alt={post.title}
                    className="w-16 h-16 object-cover rounded shrink-0"
                    onError={handleImageError}
                    loading="lazy"
                  />
                ) : (
                  <div className="w-16 h-16 bg-muted rounded shrink-0 flex items-center justify-center">
                    <Hash className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium line-clamp-2 group-hover:text-[#C29307] transition-colors">
                    {post.title}
                  </h4>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-muted-foreground">
                      {getAuthorName(post)}
                    </p>
                    <span className="text-xs text-gray-500">
                      {new Date(post.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">No recent posts yet</p>
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
                  className="flex items-center justify-between text-sm hover:text-[#C29307] transition-colors px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded"
                >
                  <span className="capitalize">{category.name}</span>
                  <span className="text-muted-foreground text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                    {category.count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground italic">No categories yet</p>
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
                  className="flex items-center justify-between text-sm hover:text-[#C29307] transition-colors px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded"
                >
                  <span>{archive.label}</span>
                  <span className="text-muted-foreground text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                    {archive.count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground italic">No archives yet</p>
        )}
      </div>

      {/* Ad Placeholder */}
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 text-center border border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          Advertisement
        </p>
        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded flex flex-col items-center justify-center">
          <span className="text-sm text-gray-500 dark:text-gray-400 mb-2">Ad Space Available</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">300x250</span>
        </div>
      </div>
    </aside>
  );
};

export default BlogSidebar;