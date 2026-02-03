"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useBlog } from "@/app/context/BlogContext";
import BlogHeader from "../components/blog-components/blog/BlogHeader"; 
import BlogSidebar from "../components/blog-components/blog/BlogSideBar";
import BlogCard from "../components/blog-components/blog/BlogCard"; 
import AdPlaceholder from "../components/blog-components/blog/Adpaceholder"; 
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";

// Types
interface Author {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  isZidwellUser?: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  postCount: number;
}

interface BlogPostType {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  author: Author;
  categories: Category[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  readTime: number;
  isPublished: boolean;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
}

interface SidebarCategory {
  name: string;
  count: number;
}

interface SidebarPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  featured_image?: string;
  author_name?: string;
  author?: {
    name: string;
  };
  published_at?: string;
  view_count?: number;
  comment_count?: number;
}

const POSTS_PER_PAGE = 4;
const INITIAL_POSTS_COUNT = 4;

const BlogPage = () => {
  const { posts, isLoading, refreshPosts } = useBlog();
  const [displayedPosts, setDisplayedPosts] = useState<BlogPostType[]>([]);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Transform API posts to BlogPost format
  const transformApiPostToBlogPost = useCallback((apiPost: any): BlogPostType => {
    return {
      id: apiPost.id || '',
      title: apiPost.title || 'Untitled',
      slug: apiPost.slug || '',
      excerpt: apiPost.excerpt || '',
      content: apiPost.content || '',
      featuredImage: apiPost.featured_image || "/default-blog-image.png",
      author: {
        id: apiPost.author_id || apiPost.author?.id || 'default-author-id',
        name: apiPost.author?.name || apiPost.author_name || 'Author',
        avatar: apiPost.author?.avatar || apiPost.author_avatar || "/default-avatar.png",
        bio: apiPost.author?.bio || apiPost.author_bio || null,
        isZidwellUser: apiPost.author?.isZidwellUser || false,
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
      createdAt: apiPost.created_at || new Date().toISOString(),
      updatedAt: apiPost.updated_at || apiPost.created_at || new Date().toISOString(),
      readTime: apiPost.readTime || 5,
      isPublished: apiPost.is_published || false,
      viewCount: apiPost.view_count || 0,
      likeCount: apiPost.likes_count || 0,
      commentCount: apiPost.comments_count || 0,
    };
  }, []);

  // Get published posts
  const publishedPosts = useMemo(() => {
    return posts
      .filter(post => post.is_published)
      .map(transformApiPostToBlogPost)
      .filter((post): post is BlogPostType => post !== null);
  }, [posts, transformApiPostToBlogPost]);

  // Filter posts based on search
  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return publishedPosts;
    
    const query = searchQuery.toLowerCase();
    return publishedPosts.filter(post => {
      return (
        post.title.toLowerCase().includes(query) ||
        post.excerpt.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query) ||
        post.categories.some(cat => cat.name.toLowerCase().includes(query)) ||
        post.tags.some(tag => tag.toLowerCase().includes(query)) ||
        post.author.name.toLowerCase().includes(query)
      );
    });
  }, [publishedPosts, searchQuery]);

  // Initial load
  useEffect(() => {
    if (publishedPosts.length > 0) {
      const initialPosts = filteredPosts.slice(0, INITIAL_POSTS_COUNT);
      setDisplayedPosts(initialPosts);
      setPage(2);
      setHasMore(INITIAL_POSTS_COUNT < filteredPosts.length);
    }
  }, [filteredPosts, publishedPosts.length]);

  // Load more posts
  const loadMorePosts = useCallback(() => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    
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
  }, [page, loadingMore, hasMore, filteredPosts]);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setIsSearching(true);
    
    setTimeout(() => {
      const filtered = query 
        ? publishedPosts.filter(post => {
            const q = query.toLowerCase();
            return (
              post.title.toLowerCase().includes(q) ||
              post.excerpt.toLowerCase().includes(q) ||
              post.content.toLowerCase().includes(q) ||
              post.categories.some(cat => cat.name.toLowerCase().includes(q)) ||
              post.tags.some(tag => tag.toLowerCase().includes(q)) ||
              post.author.name.toLowerCase().includes(q)
            );
          })
        : publishedPosts;
      
      setDisplayedPosts(filtered.slice(0, INITIAL_POSTS_COUNT));
      setPage(2);
      setHasMore(INITIAL_POSTS_COUNT < filtered.length);
      setIsSearching(false);
    }, 200);
  }, [publishedPosts]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refreshPosts();
    setDisplayedPosts([]);
    setPage(1);
    setSearchQuery("");
    setHasMore(true);
    setIsSearching(false);
  }, [refreshPosts]);

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

  // Calculate read time
  const calculateReadTime = useCallback((content: string): number => {
    if (!content) return 5;
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  }, []);

  // Prepare sidebar data
  const sidebarData = useMemo(() => {
    // Recent posts (last 5 published)
    const recentPosts: SidebarPost[] = publishedPosts
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(post => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        featured_image: post.featuredImage,
        author_name: post.author.name,
        author: { name: post.author.name },
        published_at: post.createdAt,
        view_count: post.viewCount,
        comment_count: post.commentCount,
      }));

    // Popular posts (by view count)
    const popularPosts: SidebarPost[] = publishedPosts
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, 5)
      .map(post => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        featured_image: post.featuredImage,
        author_name: post.author.name,
        author: { name: post.author.name },
        published_at: post.createdAt,
        view_count: post.viewCount,
        comment_count: post.commentCount,
      }));

    // Categories with counts
    const categoryMap = new Map<string, number>();
    publishedPosts.forEach(post => {
      post.categories.forEach(cat => {
        const currentCount = categoryMap.get(cat.name) || 0;
        categoryMap.set(cat.name, currentCount + 1);
      });
    });

    const categories: SidebarCategory[] = Array.from(categoryMap.entries())
      .map(([name, count]) => ({
        name,
        count
      }))
      .sort((a, b) => b.count - a.count);

    return {
      recentPosts,
      popularPosts,
      categories,
    };
  }, [publishedPosts]);

  const featuredPost = displayedPosts[0];
  const regularPosts = displayedPosts.slice(1);

  // Loading skeleton
  if (isLoading && posts.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header Skeleton */}
        <div className="border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex justify-between items-center">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-64" />
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

            {/* Load More Button */}
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

          {/* Sidebar - Pass data as props */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <BlogSidebar 
                onSearch={handleSearch} 
                isSearching={isSearching}
                recentPosts={sidebarData.recentPosts}
                popularPosts={sidebarData.popularPosts}
                categories={sidebarData.categories}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BlogPage;