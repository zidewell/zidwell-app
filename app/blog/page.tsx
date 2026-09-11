// app/blog/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useBlog } from "@/app/context/BlogContext";
import BlogHeader from "../components/blog-components/blog/BlogHeader";
import BlogSidebar from "../components/blog-components/blog/BlogSideBar";
import BlogCard from "../components/blog-components/blog/BlogCard";
import AdPlaceholder from "../components/blog-components/blog/Adpaceholder";
import { Button } from "../components/ui/button";
import { Loader2 } from "lucide-react";
import { BlogPost as BlogPostType } from "../components/blog-components/blog/types/blog";

const POSTS_PER_PAGE = 4;
const INITIAL_POSTS_COUNT = 4;

function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default function BlogPage() {
  const { posts, isLoading, refreshPosts, isInitialized } = useBlog();

  const [displayedPosts, setDisplayedPosts] = useState<BlogPostType[]>([]);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Safety: reset isSearching if stuck
  useEffect(() => {
    if (!isSearching) return;
    const t = setTimeout(() => setIsSearching(false), 4000);
    return () => clearTimeout(t);
  }, [isSearching]);

  const transformApiPostToBlogPost = useCallback(
    (apiPost: any): BlogPostType => {
      return {
        id: apiPost.id,
        title: apiPost.title,
        slug: apiPost.slug,
        excerpt: apiPost.excerpt || "",
        content: apiPost.content || "",
        featuredImage:
          apiPost.featured_image ||
          apiPost.featuredImage ||
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBF9jAdhX2MuVy2aLW60NI0D7FZn5LdFs1LY9CXyweMw&s=10",
        author: {
          id: apiPost.author_id || apiPost.author?.id || "default-author-id",
          name: apiPost.author_name || apiPost.author?.name || "Author",
          avatar:
            apiPost.author_avatar ||
            apiPost.author?.avatar ||
            "https://icon2.cleanpng.com/20180508/pfw/kisspng-tate-service-sponsor-art-museum-gift-5af21e7628b0d1.6451268315258169501667.jpg",
          bio: apiPost.author_bio || apiPost.author?.bio || null,
        },
        categories: Array.isArray(apiPost.categories)
          ? apiPost.categories.map((cat: string | any, index: number) => ({
              id: typeof cat === "object" ? cat.id : `cat-${index}`,
              name: typeof cat === "object" ? cat.name : cat,
              slug:
                typeof cat === "object"
                  ? cat.slug
                  : cat.toLowerCase().replace(/\s+/g, "-"),
              postCount: 0,
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
    },
    [],
  );

  const publishedPosts = useMemo(() => {
    if (!isClient || !isInitialized) return [];
    return posts
      .filter((post) => post.is_published)
      .map(transformApiPostToBlogPost);
  }, [posts, isClient, isInitialized, transformApiPostToBlogPost]);

  const searchPosts = useCallback(
    (query: string) => {
      if (!query.trim()) return publishedPosts;
      const lc = query.toLowerCase();
      return publishedPosts.filter(
        (post) =>
          post.title?.toLowerCase().includes(lc) ||
          post.excerpt?.toLowerCase().includes(lc) ||
          post.content?.toLowerCase().includes(lc) ||
          post.author?.name?.toLowerCase().includes(lc) ||
          post.categories?.some((cat: any) =>
            typeof cat === "string"
              ? cat.toLowerCase().includes(lc)
              : cat.name?.toLowerCase().includes(lc),
          ),
      );
    },
    [publishedPosts],
  );

  const filteredPosts = useMemo(() => {
    if (!isClient || !isInitialized) return [];
    if (!searchQuery.trim()) return publishedPosts;
    return searchPosts(searchQuery);
  }, [publishedPosts, searchQuery, searchPosts, isClient, isInitialized]);

  // Seed / re-slice displayed posts
  useEffect(() => {
    if (!isClient || !isInitialized) return;

    const slice = filteredPosts.slice(0, INITIAL_POSTS_COUNT);

    if (!hasInitializedRef.current) {
      setDisplayedPosts(slice);
      setPage(2);
      setHasMore(INITIAL_POSTS_COUNT < filteredPosts.length);
      hasInitializedRef.current = true;
      return;
    }

    // Search change → reset
    setDisplayedPosts(slice);
    setPage(2);
    setHasMore(INITIAL_POSTS_COUNT < filteredPosts.length);
  }, [filteredPosts, isClient, isInitialized]);

  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        setIsSearching(false);
        const source = !query.trim() ? publishedPosts : searchPosts(query);
        setDisplayedPosts(source.slice(0, INITIAL_POSTS_COUNT));
        setPage(2);
        setHasMore(INITIAL_POSTS_COUNT < source.length);
      }, 300),
    [publishedPosts, searchPosts],
  );

  const handleSearch = useCallback(
    (query: string) => {
      if (!isClient) return;
      setSearchQuery(query);
      if (query.trim()) setIsSearching(true);
      debouncedSearch(query);
    },
    [isClient, debouncedSearch],
  );

  const loadMorePosts = useCallback(() => {
    if (!isClient || loadingMore || !hasMore || isSearching) return;

    setLoadingMore(true);
    setTimeout(() => {
      try {
        const start = (page - 1) * POSTS_PER_PAGE;
        const end = start + POSTS_PER_PAGE;
        const slice = filteredPosts.slice(start, end);

        if (slice.length === 0) {
          setHasMore(false);
        } else {
          setDisplayedPosts((prev) => [...prev, ...slice]);
          setPage((p) => p + 1);
          setHasMore(end < filteredPosts.length);
        }
      } finally {
        setLoadingMore(false);
      }
    }, 300);
  }, [page, loadingMore, hasMore, filteredPosts, isSearching, isClient]);

  const handleRefresh = useCallback(() => {
    if (!isClient) return;
    refreshPosts();
    setDisplayedPosts([]);
    setPage(1);
    setSearchQuery("");
    setHasMore(true);
    setIsSearching(false);
    hasInitializedRef.current = false;
  }, [isClient, refreshPosts]);

  // Infinite scroll
  useEffect(() => {
    if (!isClient || loadingMore || !hasMore || isSearching) return;

    const onScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 500
      ) {
        loadMorePosts();
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [loadMorePosts, isClient, loadingMore, hasMore, isSearching]);

  const featuredPost = displayedPosts.length > 0 ? displayedPosts[0] : null;
  const regularPosts = displayedPosts.slice(1);

  const calculateReadTime = useCallback((content: string) => {
    const wpm = 200;
    const words = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(words / wpm));
  }, []);

  // ✅ Full-page loader ONLY on cold start (no client, no data, not initialized)
  const showFullPageLoader =
    !isClient ||
    (!isInitialized && posts.length === 0 && displayedPosts.length === 0);

  if (showFullPageLoader) {
    return (
      <div className="min-h-screen bg-(--bg-primary)">
        <BlogHeader onSearch={() => {}} />
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="text-center">
              <Loader2 className="w-16 h-16 text-[var(--color-accent-yellow)] animate-spin mx-auto mb-4" />
              <p className="text-[var(--text-secondary)]">Loading articles…</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--bg-primary)">
      <BlogHeader onSearch={handleSearch} />

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[1fr_320px] gap-12">
          {/* Main Content */}
          <div className="min-w-0">
            {searchQuery && (
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2
                    className="text-xl font-semibold text-(--text-primary)"
                    style={{ fontFamily: "'Clash Display', sans-serif" }}
                  >
                    Search Results for &quot;{searchQuery}&quot;
                  </h2>
                  <p
                    className="text-(--text-secondary) text-sm mt-1"
                    style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
                  >
                    Found {filteredPosts.length} article
                    {filteredPosts.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => handleSearch("")}
                  className="text-(--text-primary) hover:bg-(--bg-secondary)"
                  style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
                >
                  Clear Search
                </Button>
              </div>
            )}

            {featuredPost && !searchQuery && !isSearching && (
              <div className="mb-12">
                <BlogCard
                  post={{
                    ...featuredPost,
                    readTime: calculateReadTime(featuredPost.content || ""),
                  }}
                  variant="featured"
                />
              </div>
            )}

            {!searchQuery && !isSearching && displayedPosts.length > 0 && (
              <AdPlaceholder variant="horizontal" />
            )}

            {isSearching ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 text-[var(--color-accent-yellow)] animate-spin" />
              </div>
            ) : displayedPosts.length > 0 ? (
              (searchQuery ? displayedPosts : regularPosts).length > 0 && (
                <div className="grid md:grid-cols-2 gap-8 mt-12">
                  {(searchQuery ? displayedPosts : regularPosts).map(
                    (post, index) => (
                      <div key={post.id}>
                        <BlogCard
                          post={{
                            ...post,
                            readTime: calculateReadTime(post.content || ""),
                          }}
                        />
                        {(index + 1) % 4 === 0 && (
                          <div className="mt-8">
                            <AdPlaceholder variant="inline" />
                          </div>
                        )}
                      </div>
                    ),
                  )}
                </div>
              )
            ) : (
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <h3
                    className="text-xl font-semibold mb-4 text-(--text-primary)"
                    style={{ fontFamily: "'Clash Display', sans-serif" }}
                  >
                    No articles published yet
                  </h3>
                  <p
                    className="text-(--text-secondary) mb-6"
                    style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
                  >
                    Check back soon for new content or contact the
                    administrator.
                  </p>
                  <Button
                    onClick={handleRefresh}
                    className="bg-(--color-accent-yellow) hover:bg-(--color-accent-yellow)/90 text-(--color-ink)"
                    style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
                  >
                    Refresh
                  </Button>
                </div>
              </div>
            )}

            {loadingMore && (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 text-[var(--color-accent-yellow)] animate-spin" />
              </div>
            )}

            {hasMore &&
              !loadingMore &&
              !isSearching &&
              displayedPosts.length > 0 && (
                <div className="flex justify-center mt-8">
                  <Button
                    onClick={loadMorePosts}
                    variant="outline"
                    className="border-(--border-color) text-(--text-primary) hover:bg-(--bg-secondary)"
                    style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
                  >
                    Load More Articles
                  </Button>
                </div>
              )}

            {!hasMore && displayedPosts.length > 0 && !isSearching && (
              <p
                className="text-center text-(--text-secondary) py-8"
                style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
              >
                You&apos;ve reached the end
              </p>
            )}

            {!loadingMore &&
              !isSearching &&
              searchQuery &&
              filteredPosts.length === 0 && (
                <div className="text-center py-16">
                  <h3
                    className="text-xl font-semibold mb-4 text-(--text-primary)"
                    style={{ fontFamily: "'Clash Display', sans-serif" }}
                  >
                    No articles found for &quot;{searchQuery}&quot;
                  </h3>
                  <p
                    className="text-(--text-secondary) mb-6"
                    style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
                  >
                    Try different keywords or browse our categories.
                  </p>
                  <Button
                    onClick={() => handleSearch("")}
                    className="bg-(--color-accent-yellow) hover:bg-(--color-accent-yellow)/90 text-(--color-ink)"
                    style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
                  >
                    View All Articles
                  </Button>
                </div>
              )}
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <BlogSidebar onSearch={handleSearch} isSearching={isSearching} />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}