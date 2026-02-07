"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useBlog } from "@/app/context/BlogContext";
import BlogHeader from "../components/blog-components/blog/BlogHeader"; 
import BlogSidebar from "../components/blog-components/blog/BlogSideBar";
import BlogCard from "../components/blog-components/blog/BlogCard"; 
import AdPlaceholder from "../components/blog-components/blog/Adpaceholder"; 
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { BlogPost as BlogPostType } from "../components/blog-components/blog/types/blog";

const POSTS_PER_PAGE = 4;
const INITIAL_POSTS_COUNT = 4;

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

const BlogPage = () => {
  const { 
    posts, 
    isLoading, 
    refreshPosts, 
    isInitialized 
  } = useBlog();
  const [displayedPosts, setDisplayedPosts] = useState<BlogPostType[]>([]);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const hasInitializedRef = useRef(false);

  // Mark when client is ready
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Transform API posts to BlogPost format
  const transformApiPostToBlogPost = useCallback((apiPost: any): BlogPostType => {
    return {
      id: apiPost.id,
      title: apiPost.title,
      slug: apiPost.slug,
      excerpt: apiPost.excerpt || "",
      content: apiPost.content || "",
      featuredImage: apiPost.featured_image || apiPost.featuredImage || "/default-blog-image.png",
      author: {
        id: apiPost.author_id || apiPost.author?.id || "default-author-id",
        name: apiPost.author_name || apiPost.author?.name || "Author",
        avatar: apiPost.author_avatar || apiPost.author?.avatar || "/default-avatar.png",
        bio: apiPost.author_bio || apiPost.author?.bio || null,
      },
      categories: Array.isArray(apiPost.categories) 
        ? apiPost.categories.map((cat: string | any, index: number) => ({
            id: typeof cat === 'object' ? cat.id : `cat-${index}`,
            name: typeof cat === 'object' ? cat.name : cat,
            slug: typeof cat === 'object' ? cat.slug : cat.toLowerCase().replace(/\s+/g, '-'),
            postCount: 0
          }))
        : [],
      tags: apiPost.tags || [],
      createdAt: apiPost.created_at || apiPost.createdAt,
      updatedAt: apiPost.updated_at || apiPost.updatedAt,
      readTime: apiPost.readTime || apiPost.read_time || 5,
      isPublished: apiPost.is_published,
      viewCount: apiPost.view_count,
      likeCount: apiPost.likes_count,
      commentCount: apiPost.comments_count,
    };
  }, []);

  // Filter published posts only and transform to BlogPost format
  const publishedPosts = useMemo(() => {
    if (!isClient || !isInitialized) return [];
    
    return posts
      .filter(post => post.is_published)
      .map(transformApiPostToBlogPost);
  }, [posts, isClient, isInitialized, transformApiPostToBlogPost]);

  // Search function
  const searchPosts = useCallback((query: string) => {
    if (!query.trim()) return publishedPosts;
    
    const lowercaseQuery = query.toLowerCase();
    return publishedPosts.filter(post => 
      post.title?.toLowerCase().includes(lowercaseQuery) ||
      post.excerpt?.toLowerCase().includes(lowercaseQuery) ||
      post.content?.toLowerCase().includes(lowercaseQuery) ||
      post.author?.name?.toLowerCase().includes(lowercaseQuery) ||
      post.categories?.some((cat: any) => 
        typeof cat === 'string' 
          ? cat.toLowerCase().includes(lowercaseQuery)
          : cat.name?.toLowerCase().includes(lowercaseQuery)
      )
    );
  }, [publishedPosts]);

  // Filter posts based on search
  const filteredPosts = useMemo(() => {
    if (!isClient || !isInitialized) return [];
    
    if (!searchQuery.trim()) return publishedPosts;
    
    return searchPosts(searchQuery);
  }, [publishedPosts, searchQuery, searchPosts, isClient, isInitialized]);

  // Update displayed posts when filteredPosts changes
  useEffect(() => {
    if (isClient && filteredPosts.length > 0) {
      const initialPosts = filteredPosts.slice(0, INITIAL_POSTS_COUNT);
      setDisplayedPosts(initialPosts);
      setPage(2);
      setHasMore(INITIAL_POSTS_COUNT < filteredPosts.length);
    } else if (isClient && !searchQuery) {
      // Handle empty state when no search
      setDisplayedPosts([]);
      setPage(1);
      setHasMore(false);
    }
  }, [filteredPosts, isClient, searchQuery]);

  // Debounced search handler
  const debouncedSearch = useMemo(() => 
    debounce((query: string) => {
      setIsSearching(false);
      if (!query.trim()) {
        setDisplayedPosts(publishedPosts.slice(0, INITIAL_POSTS_COUNT));
        setPage(2);
        setHasMore(INITIAL_POSTS_COUNT < publishedPosts.length);
      } else {
        const filtered = searchPosts(query);
        setDisplayedPosts(filtered.slice(0, INITIAL_POSTS_COUNT));
        setPage(2);
        setHasMore(INITIAL_POSTS_COUNT < filtered.length);
      }
    }, 300),
    [publishedPosts, searchPosts]
  );

  // Handle search
  const handleSearch = useCallback((query: string) => {
    if (!isClient) return;
    
    setSearchQuery(query);
    
    if (query.trim()) {
      setIsSearching(true);
    }
    
    debouncedSearch(query);
  }, [isClient, debouncedSearch]);

  // Load more posts
  const loadMorePosts = useCallback(() => {
    if (!isClient || loadingMore || !hasMore || isSearching) return;
    
    setLoadingMore(true);
    
    // Simulate network delay
    setTimeout(() => {
      const start = (page - 1) * POSTS_PER_PAGE;
      const end = start + POSTS_PER_PAGE;
      const newPosts = filteredPosts.slice(start, end);
      
      if (newPosts.length === 0) {
        setHasMore(false);
      } else {
        setDisplayedPosts(prev => [...prev, ...newPosts]);
        setPage(prev => prev + 1);
        setHasMore(end < filteredPosts.length);
      }
      setLoadingMore(false);
    }, 300);
  }, [page, loadingMore, hasMore, filteredPosts, isSearching, isClient]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    if (!isClient) return;
    
    refreshPosts();
    setDisplayedPosts([]);
    setPage(1);
    setSearchQuery("");
    setHasMore(true);
    setIsSearching(false);
  }, [isClient, refreshPosts]);

  // Infinite scroll - only on client
  useEffect(() => {
    if (!isClient || loadingMore || !hasMore || isSearching) return;
    
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 500
      ) {
        loadMorePosts();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadMorePosts, isClient, loadingMore, hasMore, isSearching]);

  const featuredPost = displayedPosts.length > 0 ? displayedPosts[0] : null;
  const regularPosts = displayedPosts.slice(1);

  // Calculate read time for posts (helper function)
  const calculateReadTime = useCallback((content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  }, []);

  // Initialize displayed posts once when data is ready
  useEffect(() => {
    if (isClient && isInitialized && !hasInitializedRef.current && publishedPosts.length > 0) {
      const initialPosts = publishedPosts.slice(0, INITIAL_POSTS_COUNT);
      setDisplayedPosts(initialPosts);
      setPage(2);
      setHasMore(INITIAL_POSTS_COUNT < publishedPosts.length);
      hasInitializedRef.current = true;
    }
  }, [isClient, isInitialized, publishedPosts]);

  // Loading skeleton - show during SSR and initial client load
  if (isLoading || !isClient || !isInitialized) {
    return (
      <div className="min-h-screen bg-background">
        {/* Simple static header for SSR */}
        <div className="border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex justify-between items-center">
              <div className="h-10 w-32 bg-muted rounded animate-pulse" />
              <div className="h-10 w-64 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
        
        <main className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-[1fr_320px] gap-12">
            <div>
              {/* Featured Post Skeleton */}
              <div className="mb-12">
                <div className="bg-card rounded-lg overflow-hidden shadow-lg">
                  <Skeleton className="h-64 w-full" />
                  <div className="p-6">
                    <Skeleton className="h-8 w-3/4 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              </div>
              
              {/* Ad Skeleton */}
              <Skeleton className="h-32 w-full mb-8" />
              
              {/* Posts Grid Skeleton */}
              <div className="grid md:grid-cols-2 gap-8">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i}>
                    <div className="bg-card rounded-lg overflow-hidden shadow">
                      <Skeleton className="h-48 w-full" />
                      <div className="p-4">
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Sidebar Skeleton */}
            <div className="hidden lg:block">
              <div className="sticky top-24 space-y-8">
                <div className="space-y-3">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <BlogHeader onSearch={handleSearch} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[1fr_320px] gap-12">
          {/* Main Content */}
          <div>
            {/* Search Results Info */}
            {searchQuery && (
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">
                    Search Results for &quot;{searchQuery}&quot;
                  </h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Found {filteredPosts.length} article{filteredPosts.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => handleSearch("")}
                >
                  Clear Search
                </Button>
              </div>
            )}

            {/* Featured Post */}
            {featuredPost && !searchQuery && !isSearching && (
              <div className="mb-12">
                <BlogCard 
                  post={{
                    ...featuredPost,
                    readTime: calculateReadTime(featuredPost.content || "")
                  }} 
                  variant="featured" 
                />
              </div>
            )}

            {/* Ad after featured */}
            {!searchQuery && !isSearching && displayedPosts.length > 0 && (
              <AdPlaceholder variant="horizontal" />
            )}

            {/* Post Grid */}
            {isSearching ? (
              <div className="grid md:grid-cols-2 gap-8 mt-12">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i}>
                    <div className="bg-card rounded-lg overflow-hidden shadow animate-pulse">
                      <div className="h-48 bg-muted" />
                      <div className="p-4">
                        <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                        <div className="h-4 bg-muted rounded w-full mb-2" />
                        <div className="h-4 bg-muted rounded w-2/3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : displayedPosts.length > 0 ? (
              <>
                {(searchQuery ? displayedPosts : regularPosts).length > 0 && (
                  <div className="grid md:grid-cols-2 gap-8 mt-12">
                    {(searchQuery ? displayedPosts : regularPosts).map((post, index) => (
                      <div key={post.id}>
                        <BlogCard 
                          post={{
                            ...post,
                            readTime: calculateReadTime(post.content || "")
                          }} 
                        />
                        {/* Insert ad every 4 posts */}
                        {(index + 1) % 4 === 0 && (
                          <div className="mt-8">
                            <AdPlaceholder variant="inline" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              !isLoading && !isSearching && (
                <div className="text-center py-16">
                  <div className="max-w-md mx-auto">
                    <h3 className="text-xl font-semibold mb-4">No articles published yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Check back soon for new content or contact the administrator.
                    </p>
                    <Button onClick={handleRefresh}>
                      Refresh
                    </Button>
                  </div>
                </div>
              )
            )}

            {/* Loading more indicator */}
            {loadingMore && (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Load More Button (alternative to infinite scroll) */}
            {hasMore && !loadingMore && !isSearching && displayedPosts.length > 0 && (
              <div className="flex justify-center mt-8">
                <Button onClick={loadMorePosts} variant="outline">
                  Load More Articles
                </Button>
              </div>
            )}

            {/* No more posts */}
            {!hasMore && displayedPosts.length > 0 && !isSearching && (
              <p className="text-center text-muted-foreground py-8">
                You&apos;ve reached the end
              </p>
            )}

            {/* No search results */}
            {!loadingMore && !isSearching && searchQuery && filteredPosts.length === 0 && (
              <div className="text-center py-16">
                <h3 className="text-xl font-semibold mb-4">
                  No articles found for &quot;{searchQuery}&quot;
                </h3>
                <p className="text-muted-foreground mb-6">
                  Try different keywords or browse our categories.
                </p>
                <Button onClick={() => handleSearch("")}>
                  View All Articles
                </Button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <BlogSidebar 
                onSearch={handleSearch} 
                isSearching={isSearching}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BlogPage;