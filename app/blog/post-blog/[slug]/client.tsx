"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Share2, Bookmark, Heart, Eye, Clock } from "lucide-react";
import Swal from "sweetalert2";
import Image from "next/image";
import CommentSection from "@/app/components/blog-components/blog/CommentSection";

// Types
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featured_image: string | null;
  categories: string[];
  tags: string[];
  is_published: boolean;
  author_id: string;
  author_name: string | null;
  author_avatar: string | null;
  author_bio: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  view_count: number;
  likes_count: number;
  comments_count: number;
  audio_file?: string | null;
}

// Simple alert helper
const showAlert = (
  title: string,
  text: string,
  icon: "success" | "error" | "info",
) => {
  Swal.fire({
    title,
    text,
    icon,
    timer: 1500,
    showConfirmButton: false,
    confirmButtonColor: "var(--color-accent-yellow)",
  });
};

const calculateReadTime = (content: string): number => {
  if (!content) return 3;
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
};

export default function BlogPostClient({
  post: initialPost,
}: {
  post: BlogPost;
}) {
  const router = useRouter();
  const [post] = useState(initialPost);

  const [viewCount, setViewCount] = useState(initialPost.view_count || 0);
  const [likeCount, setLikeCount] = useState(initialPost.likes_count || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const readTime = calculateReadTime(post.content);
  const publishDate = post.published_at || post.created_at;

  // Load likes/bookmarks and increment view
  useEffect(() => {
    // Load from localStorage
    const likedPosts = JSON.parse(localStorage.getItem("likedPosts") || "[]");
    setIsLiked(likedPosts.includes(post.id));

    const bookmarks = JSON.parse(localStorage.getItem("blogBookmarks") || "[]");
    setIsBookmarked(bookmarks.includes(post.id));

    // Increment view count (only once per session)
    const viewedKey = `viewed_post_${post.id}`;
    if (!sessionStorage.getItem(viewedKey)) {
      fetch(`/api/blog/posts?id=${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ increment_view: true }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.view_count) setViewCount(data.view_count);
        })
        .catch(console.error);
      sessionStorage.setItem(viewedKey, "true");
    }
  }, [post.id]);

  const handleShare = async () => {
    try {
      setIsSharing(true);
      const url = window.location.href;

      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text: post.excerpt || post.title,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        showAlert("Link Copied!", "Post link copied to clipboard", "success");
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("Share failed:", err);
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleBookmark = () => {
    const bookmarks = JSON.parse(localStorage.getItem("blogBookmarks") || "[]");
    if (!isBookmarked) {
      bookmarks.push(post.id);
      showAlert("Bookmarked!", "Post added to bookmarks", "success");
    } else {
      const index = bookmarks.indexOf(post.id);
      if (index > -1) bookmarks.splice(index, 1);
      showAlert("Removed!", "Post removed from bookmarks", "info");
    }
    localStorage.setItem("blogBookmarks", JSON.stringify(bookmarks));
    setIsBookmarked(!isBookmarked);
  };

  const handleLike = async () => {
    const newIsLiked = !isLiked;
    const newLikeCount = newIsLiked ? likeCount + 1 : likeCount - 1;

    // Optimistic update
    setLikeCount(newLikeCount);
    setIsLiked(newIsLiked);

    // Update localStorage
    const likedPosts = JSON.parse(localStorage.getItem("likedPosts") || "[]");
    if (newIsLiked) {
      likedPosts.push(post.id);
      showAlert("Liked!", "You liked this post", "success");
    } else {
      const index = likedPosts.indexOf(post.id);
      if (index > -1) likedPosts.splice(index, 1);
    }
    localStorage.setItem("likedPosts", JSON.stringify(likedPosts));

    // Update server
    try {
      await fetch(`/api/blog/posts?id=${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ likes_count: newLikeCount }),
      });
    } catch (err) {
      console.error("Error updating like:", err);
      // Rollback on error
      setLikeCount(likeCount);
      setIsLiked(isLiked);
    }
  };

  // Process content to ensure links open in new tab and have proper styling
  const processContent = (html: string): string => {
    if (!html) return "";
    
    // Add target="_blank" and rel="noopener noreferrer" to all links
    let processed = html.replace(
      /<a\s+(?:[^>]*?\s+)?href="([^"]*)"([^>]*)>/gi,
      (match, href, rest) => {
        // Skip if already has target attribute
        if (rest.includes('target=')) {
          return match;
        }
        return `<a href="${href}" target="_blank" rel="noopener noreferrer"${rest}>`;
      }
    );
    
    return processed;
  };

  // Simple content renderer
  const renderContent = () => {
    const processedContent = processContent(post.content);
    return { __html: processedContent };
  };

  return (
    <div className="min-h-screen bg-(--bg-primary)">
      {/* Simple Header */}
      <header className="border-b border-(--border-color) bg-(--bg-primary) sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 max-w-6xl">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/blog")}
              className="flex items-center gap-2 text-(--text-secondary) hover:text-(--text-primary) transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Blog</span>
            </button>
            <div className="text-sm text-(--text-secondary)">Zidwell Blog</div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <article>
          {/* Categories */}
          {post.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.categories.map((cat, i) => (
                <span
                  key={i}
                  className="text-xs uppercase tracking-wider text-(--color-accent-yellow) font-medium"
                >
                  {cat}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-(--text-primary) mb-4 leading-tight">
            {post.title}
          </h1>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-lg text-(--text-secondary) mb-6 italic border-l-4 border-(--color-accent-yellow) pl-4">
              {post.excerpt}
            </p>
          )}

          {/* Author & Meta */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-(--border-color)">
            <div className="w-12 h-12 rounded-full bg-(--bg-secondary) overflow-hidden shrink-0">
              {post.author_avatar && (
                <Image
                  src={post.author_avatar}
                  alt={post.author_name || "Author"}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div>
              <div className="font-semibold text-(--text-primary)">
                {post.author_name || "Zidwell"}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-(--text-secondary)">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {readTime} min read
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" /> {viewCount.toLocaleString()} views
                </span>
                <span>{format(new Date(publishDate), "MMM d, yyyy")}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 py-4 border-b border-(--border-color) mb-8">
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-(--bg-secondary) hover:bg-(--bg-secondary)/80 transition-colors text-(--text-primary)"
            >
              <Share2 className="w-4 h-4" />
              <span>{isSharing ? "Sharing..." : "Share"}</span>
            </button>
            <button
              onClick={handleBookmark}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isBookmarked
                  ? "bg-(--color-accent-yellow) text-(--color-ink)"
                  : "bg-(--bg-secondary) hover:bg-(--bg-secondary)/80 text-(--text-primary)"
              }`}
            >
              <Bookmark
                className={`w-4 h-4 ${isBookmarked ? "fill-(--color-ink)" : ""}`}
              />
              <span>{isBookmarked ? "Bookmarked" : "Bookmark"}</span>
            </button>
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isLiked
                  ? "bg-red-500 text-white"
                  : "bg-(--bg-secondary) hover:bg-(--bg-secondary)/80 text-(--text-primary)"
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? "fill-white" : ""}`} />
              <span>
                {likeCount} {isLiked ? "Liked" : "Like"}
              </span>
            </button>
          </div>

          {/* Featured Image */}
          {post.featured_image && (
            <div className="mb-8 rounded-xl overflow-hidden shadow-soft">
              <Image
                src={post.featured_image}
                alt={post.title}
                width={1200}
                height={630}
                className="w-full h-auto object-cover"
                priority
                unoptimized={post.featured_image.startsWith("http")}
              />
            </div>
          )}

          {/* Content with editor-like spacing */}
          <div className="blog-content" dangerouslySetInnerHTML={renderContent()} />

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="pt-6 border-t border-(--border-color)">
              <h3 className="font-semibold text-(--text-primary) mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-(--bg-secondary) rounded-full text-sm text-(--text-secondary)"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Stats Footer */}
          <div className="mt-8 pt-6 border-t border-(--border-color)">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-(--bg-secondary) rounded-lg">
                <div className="text-xl font-bold text-(--text-primary)">
                  {viewCount.toLocaleString()}
                </div>
                <div className="text-xs text-(--text-secondary)">Views</div>
              </div>
              <div className="p-3 bg-(--bg-secondary) rounded-lg">
                <div className="text-xl font-bold text-(--text-primary)">
                  {likeCount.toLocaleString()}
                </div>
                <div className="text-xs text-(--text-secondary)">Likes</div>
              </div>
              <div className="p-3 bg-(--bg-secondary) rounded-lg">
                <div className="text-xl font-bold text-(--text-primary)">
                  {post.comments_count || 0}
                </div>
                <div className="text-xs text-(--text-secondary)">Comments</div>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <CommentSection postId={post.id} />
        </article>
      </main>

      {/* Custom styles to match editor spacing exactly */}
      <style jsx global>{`
        .blog-content {
          font-size: 1.125rem;
          line-height: 1.75;
    
        }
        
        /* Paragraph spacing - matches editor */
        .blog-content p {
          margin-bottom: 1rem;
          margin-top: 0;
        }
        
        /* Headings */
        .blog-content h1 {
          font-size: 2rem;
          font-weight: 700;
          margin-top: 2rem;
          margin-bottom: 1rem;
        }
        
        .blog-content h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 1.75rem;
          margin-bottom: 0.875rem;
        }
        
        .blog-content h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }
        
        .blog-content h4 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
        }
        
        /* Lists */
        .blog-content ul,
        .blog-content ol {
          margin-bottom: 1.5rem;
          padding-left: 1.75rem;
        }
        
        .blog-content li {
          margin-bottom: 0.5rem;
        }
        
        /* Links - BLUE and visible */
        .blog-content a {
          color: #2563eb;
          text-decoration: underline;
          text-decoration-thickness: 2px;
          text-decoration-color: #bfdbfe;
        }
        
        .blog-content a:hover {
          color: #1d4ed8;
          text-decoration-color: #2563eb;
        }
        
        /* Images */
        .blog-content img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 2rem auto;
          display: block;
        }
        
        /* Blockquotes */
        .blog-content blockquote {
          border-left: 4px solid #eab308;
          padding-left: 1.25rem;
          margin: 1.5rem 0;
          font-style: italic;
          color: #6b7280;
        }
        
        /* Code */
        .blog-content code {
          background-color: #f3f4f6;
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-size: 0.875em;
        }
        
        .blog-content pre {
          background-color: #1f2937;
          color: #f3f4f6;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1.5rem 0;
        }
        
        .blog-content pre code {
          background-color: transparent;
          padding: 0;
          color: inherit;
        }
        
        /* Horizontal rule */
        .blog-content hr {
          margin: 2rem 0;
          border: 0;
          border-top: 1px solid #e5e7eb;
        }
        
        /* Tables */
        .blog-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
        }
        
        .blog-content th,
        .blog-content td {
          border: 1px solid #e5e7eb;
          padding: 0.75rem;
          text-align: left;
        }
        
        .blog-content th {
          background-color: #f9fafb;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}