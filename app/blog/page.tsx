// app/blog/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useBlog } from "@/app/context/BlogContext";
import BlogHeader from "../components/blog-components/blog/BlogHeader"; 
import BlogSidebar from "../components/blog-components/blog/BlogSideBar";
import BlogCard from "../components/blog-components/blog/BlogCard"; 
import AdPlaceholder from "../components/blog-components/blog/Adpaceholder"; 
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";

const POSTS_PER_PAGE = 4;
const INITIAL_POSTS_COUNT = 4;

const BlogPage = () => {
  const { posts, isLoading, searchPosts, refreshPosts } = useBlog();
  const [displayedPosts, setDisplayedPosts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Filter published posts only
  const publishedPosts = useMemo(() => {
    return posts.filter(post => post.is_published);
  }, [posts]);

  // Filter posts based on search
  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return publishedPosts;
    return searchPosts(searchQuery).filter(post => post.is_published);
  }, [publishedPosts, searchQuery, searchPosts]);

  // Initial load
  useEffect(() => {
    if (publishedPosts.length > 0 && !isSearching) {
      const initialPosts = filteredPosts.slice(0, INITIAL_POSTS_COUNT);
      setDisplayedPosts(initialPosts);
      setPage(2);
      setHasMore(INITIAL_POSTS_COUNT < filteredPosts.length);
    }
  }, [filteredPosts, publishedPosts.length, isSearching]);

  // Load more posts
  const loadMorePosts = useCallback(() => {
    if (loadingMore || !hasMore || isSearching) return;
    
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
  }, [page, loadingMore, hasMore, filteredPosts, isSearching]);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearching(true);
    
    setTimeout(() => {
      const filtered = query ? searchPosts(query).filter(post => post.is_published) : publishedPosts;
      setDisplayedPosts(filtered.slice(0, INITIAL_POSTS_COUNT));
      setPage(2);
      setHasMore(INITIAL_POSTS_COUNT < filtered.length);
      setIsSearching(false);
    }, 200);
  };

  // Handle refresh
  const handleRefresh = () => {
    refreshPosts();
    setDisplayedPosts([]);
    setPage(1);
    setSearchQuery("");
    setHasMore(true);
    setIsSearching(false);
  };

  // Infinite scroll
  useEffect(() => {
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
  }, [loadMorePosts]);

  const featuredPost = displayedPosts[0];
  const regularPosts = displayedPosts.slice(1);

  // Calculate read time for posts (helper function)
  const calculateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  // Loading skeleton
  if (isLoading && displayedPosts.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <BlogHeader onSearch={handleSearch} />
        
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
                    Search Results for "{searchQuery}"
                  </h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Found {filteredPosts.length} article{filteredPosts.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearchQuery("");
                    handleSearch("");
                  }}
                >
                  Clear Search
                </Button>
              </div>
            )}

            {/* Featured Post */}
            {featuredPost && !isSearching && (
              <div className="mb-12">
                <BlogCard 
                  post={{
                    ...featuredPost,
                    readTime: calculateReadTime(featuredPost.content)
                  }} 
                  variant="featured" 
                />
              </div>
            )}

            {/* Ad after featured */}
            {!isSearching && <AdPlaceholder variant="horizontal" />}

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
                {regularPosts.length > 0 && (
                  <div className="grid md:grid-cols-2 gap-8 mt-12">
                    {regularPosts.map((post, index) => (
                      <div key={post.id}>
                        <BlogCard 
                          post={{
                            ...post,
                            readTime: calculateReadTime(post.content)
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
                You've reached the end
              </p>
            )}

            {/* No search results */}
            {!loadingMore && isSearching === false && searchQuery && filteredPosts.length === 0 && (
              <div className="text-center py-16">
                <h3 className="text-xl font-semibold mb-4">
                  No articles found for "{searchQuery}"
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