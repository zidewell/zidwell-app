// components/CTA.tsx
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Sparkles,
  ChevronRight,
  Newspaper,
  TrendingUp,
} from "lucide-react";
import { Button } from "../ui/button";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

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

// Cache key for localStorage
const CACHE_KEY = "zidwell_recent_posts_cta";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const CTA = () => {
  const router = useRouter();
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchRecentPosts = async () => {
      try {
        // Check cache first
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
          try {
            const { data, timestamp } = JSON.parse(cachedData);
            const now = Date.now();
            // Use cache if it's still fresh
            if (now - timestamp < CACHE_DURATION && data && data.length > 0) {
              setRecentPosts(data);
              setLoading(false);
              // Still fetch in background to update cache
              fetchFreshPosts(true);
              return;
            }
          } catch (e) {
            console.warn("Error parsing cached data:", e);
          }
        }

        // No valid cache, fetch fresh
        await fetchFreshPosts(false);
      } catch (error) {
        console.error("Error fetching recent posts:", error);
        setLoading(false);
      }
    };

    const fetchFreshPosts = async (isBackground: boolean) => {
      try {
        if (!isBackground) {
          setLoading(true);
        }

        const response = await fetch("/api/blog/posts?limit=6&published=true");
        if (response.ok) {
          const data = await response.json();
          const posts = data.posts || [];

          // Transform posts to ensure categories are in the right format
          const transformedPosts = posts.map((post: any) => ({
            ...post,
            categories: Array.isArray(post.categories)
              ? post.categories.map((cat: any) => {
                  if (typeof cat === "string") {
                    return { id: `cat-${cat}`, name: cat };
                  }
                  return cat;
                })
              : [],
            featuredImage:
              post.featured_image ||
              post.featuredImage ||
              "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBF9jAdhX2MuVy2aLW60NI0D7FZn5LdFs1LY9CXyweMw&s=10",
            createdAt:
              post.created_at || post.createdAt || new Date().toISOString(),
            readTime: post.read_time || post.readTime || 5,
            author: {
              name: post.author?.name || post.author_name || "Unknown Author",
              avatar: post.author?.avatar || post.author_avatar || null,
            },
          }));

          // Update state
          setRecentPosts(transformedPosts);

          // Cache the data
          try {
            localStorage.setItem(
              CACHE_KEY,
              JSON.stringify({
                data: transformedPosts,
                timestamp: Date.now(),
              }),
            );
          } catch (e) {
            console.warn("Error caching data:", e);
          }
        }
      } catch (error) {
        console.error("Error fetching fresh posts:", error);
      } finally {
        if (!isBackground) {
          setLoading(false);
        }
      }
    };

    fetchRecentPosts();
  }, []);

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
    const colors = [
      "#3B82F6",
      "#10B981",
      "#8B5CF6",
      "#F59E0B",
      "#EF4444",
      "#06B6D4",
      "#EC4899",
      "#8B4513",
    ];
    const hash = name.split("").reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  // Helper to get image URL with fallback
  const getImageUrl = (imageUrl: string | undefined): string => {
    if (!imageUrl)
      return "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBF9jAdhX2MuVy2aLW60NI0D7FZn5LdFs1LY9CXyweMw&s=10";
    if (imageUrl.startsWith("http") || imageUrl.startsWith("data:")) {
      return imageUrl;
    }
    if (imageUrl.startsWith("/")) {
      return imageUrl;
    }
    return `/${imageUrl}`;
  };

  const handleImageError = (postId: string) => {
    setImageErrors((prev) => ({ ...prev, [postId]: true }));
  };

  return (
    <section className="relative py-20 md:py-32 overflow-hidden bg-(--bg-secondary)/30">
      <div className="container mx-auto px-4 relative z-10">
        {/* Main CTA Content */}
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-(--color-accent-yellow)/10 border-2 border-(--border-color) rounded-xl mb-8">
            <Sparkles className="w-4 h-4 text-(--color-accent-yellow)" />
            <span className="text-sm font-semibold text-(--text-primary)">
              The Future of Zidwell
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6 text-balance text-(--text-primary)">
            We're building toward a future where Africans have{" "}
            <span className="relative inline-block">
              <span className="relative z-10">full visibility</span>
              <span className="absolute bottom-2 left-0 right-0 h-4 bg-(--color-accent-yellow)/40 z-0" />
            </span>{" "}
            and control over their money
          </h2>
          <p className="text-lg text-(--text-secondary) mb-8 max-w-2xl mx-auto">
            Savings, spending, records, and growth — all in one place. Zidwell
            is just getting started.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              variant="default"
              size="lg"
              onClick={() => router.push("/auth/signup")}
              className="bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90 rounded-xl"
            >
              Get Started Free
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
          <div className="mt-16 flex justify-center gap-4">
            <div className="w-4 h-4 bg-(--color-accent-yellow) border-2 border-(--border-color) rounded-sm" />
            <div className="w-4 h-4 bg-(--border-color) rounded-sm" />
            <div className="w-4 h-4 bg-(--color-accent-yellow) border-2 border-(--border-color) rounded-sm" />
          </div>
        </div>

        {/* Recent Blog Posts Section */}
        <div className="mt-20 md:mt-32 pt-12 md:pt-20 border-t border-(--border-color)">
          {/* Centered Heading */}
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-(--color-accent-yellow)/10 rounded-full mb-4">
              <Newspaper className="w-4 h-4 text-(--color-accent-yellow)" />
              <span className="text-xs font-semibold text-(--color-accent-yellow) uppercase tracking-wider">
                Latest Updates
              </span>
            </div>
            <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-(--text-primary)">
              Explore{" "}
              <span className="text-(--color-accent-yellow)">Insights</span> &{" "}
              <span className="text-(--color-accent-yellow)">News</span>
            </h3>
            <p className="text-(--text-secondary) text-sm md:text-base mt-2 max-w-2xl mx-auto">
              Discover expert insights, financial tips, and the latest updates
              from Zidwell
            </p>
          </div>

          {loading ? (
            // Loading skeleton
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-(--bg-primary) rounded-lg overflow-hidden border border-(--border-color) animate-pulse"
                >
                  <div className="h-48 bg-(--bg-secondary)" />
                  <div className="p-4">
                    <div className="h-4 bg-(--bg-secondary) rounded w-1/4 mb-2" />
                    <div className="h-6 bg-(--bg-secondary) rounded w-3/4 mb-2" />
                    <div className="h-4 bg-(--bg-secondary) rounded w-full mb-1" />
                    <div className="h-4 bg-(--bg-secondary) rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentPosts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {recentPosts.slice(0, 6).map((post) => {
                  const imageUrl = getImageUrl(post.featuredImage);
                  const hasError = imageErrors[post.id];
                  const categoryName =
                    post.categories && post.categories.length > 0
                      ? typeof post.categories[0] === "string"
                        ? post.categories[0]
                        : post.categories[0]?.name || "Uncategorized"
                      : "Uncategorized";

                  return (
                    <Link
                      key={post.id}
                      href={`/blog/post-blog/${post.slug}`}
                      className="group block bg-(--bg-primary) rounded-lg overflow-hidden border border-(--border-color) hover:border-(--color-accent-yellow) transition-all duration-300 hover:shadow-lg"
                    >
                      <div className="aspect-16/10 overflow-hidden bg-(--bg-secondary) relative">
                        <Image
                          src={
                            hasError
                              ? "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBF9jAdhX2MuVy2aLW60NI0D7FZn5LdFs1LY9CXyweMw&s=10"
                              : imageUrl
                          }
                          alt={post.title || "Blog post"}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                          onError={() => handleImageError(post.id)}
                        />
                      </div>
                      <div className="p-4 md:p-5">
                        <span className="text-xs font-medium text-(--color-accent-yellow) uppercase tracking-wider">
                          {categoryName}
                        </span>
                        <h4 className="font-semibold text-base md:text-lg text-(--text-primary) mt-1 mb-2 line-clamp-2 group-hover:text-(--color-accent-yellow) transition-colors">
                          {post.title}
                        </h4>
                        <p className="text-sm text-(--text-secondary) line-clamp-2 mb-3">
                          {post.excerpt || "Read more about this topic..."}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-(--text-secondary)">
                          <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center border border-(--border-color) shrink-0">
                            {post.author?.avatar ? (
                              <Image
                                src={getImageUrl(post.author.avatar)}
                                alt={post.author.name || "Author"}
                                width={20}
                                height={20}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                onError={(e) => {
                                  const target =
                                    e.currentTarget as HTMLImageElement;
                                  target.style.display = "none";
                                  const parent = target.parentElement;
                                  if (parent) {
                                    const initialsDiv =
                                      document.createElement("div");
                                    initialsDiv.className =
                                      "w-full h-full flex items-center justify-center";
                                    initialsDiv.style.backgroundColor =
                                      getAvatarColor(
                                        post.author?.name || "Unknown",
                                      );
                                    const span = document.createElement("span");
                                    span.className =
                                      "text-white text-[8px] font-semibold";
                                    span.textContent = getInitials(
                                      post.author?.name || "Unknown",
                                    );
                                    initialsDiv.appendChild(span);
                                    parent.appendChild(initialsDiv);
                                  }
                                }}
                              />
                            ) : (
                              <div
                                className="w-full h-full flex items-center justify-center"
                                style={{
                                  backgroundColor: getAvatarColor(
                                    post.author?.name || "Unknown",
                                  ),
                                }}
                              >
                                <span className="text-white text-[8px] font-semibold">
                                  {getInitials(post.author?.name || "Unknown")}
                                </span>
                              </div>
                            )}
                          </div>
                          <span className="truncate max-w-[60px]">
                            {post.author?.name || "Unknown"}
                          </span>
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

              {/* See All Button - Bottom */}
              <div className="text-center mt-10">
                <Link href="/blog">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-(--color-accent-yellow) text-(--color-accent-yellow) hover:bg-(--color-accent-yellow)/10 hover:border-(--color-accent-yellow) transition-all duration-300 group"
                  >
                    <TrendingUp className="w-4 h-4 mr-2 transition-transform group-hover:rotate-12" />
                    View All Articles
                    <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-12 bg-(--bg-primary) rounded-lg border border-(--border-color)">
              <p className="text-(--text-secondary)">
                No blog posts available yet.
              </p>
              <p className="text-sm text-(--text-secondary) mt-1">
                Check back soon for updates!
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CTA;
