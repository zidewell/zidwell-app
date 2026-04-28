"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Share2, Bookmark, Heart, Eye, Clock } from "lucide-react";
import Swal from "sweetalert2";
import Image from "next/image";

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
const showAlert = (title: string, text: string, icon: "success" | "error" | "info") => {
  Swal.fire({
    title,
    text,
    icon,
    timer: 1500,
    showConfirmButton: false,
  });
};

const calculateReadTime = (content: string): number => {
  if (!content) return 3;
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
};

export default function BlogPostClient({ post: initialPost }: { post: BlogPost }) {
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
        .then(res => res.json())
        .then(data => {
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

  // Simple content renderer (assumes HTML content)
  const renderContent = () => {
    return { __html: post.content };
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Simple Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 max-w-6xl">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/blog")}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Blog</span>
            </button>
            <div className="text-sm text-gray-500">Zidwell Blog</div>
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
                  className="text-xs uppercase tracking-wider text-[#2b825b] font-medium"
                >
                  {cat}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            {post.title}
          </h1>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-lg text-gray-600 mb-6 italic border-l-4 border-[#2b825b] pl-4">
              {post.excerpt}
            </p>
          )}

          {/* Author & Meta */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
            <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
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
              <div className="font-semibold text-gray-900">
                {post.author_name || "Zidwell"}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
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
          <div className="flex flex-wrap gap-3 py-4 border-b border-gray-200 mb-8">
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700"
            >
              <Share2 className="w-4 h-4" />
              <span>{isSharing ? "Sharing..." : "Share"}</span>
            </button>
            <button
              onClick={handleBookmark}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isBookmarked
                  ? "bg-[#2b825b] text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-white" : ""}`} />
              <span>{isBookmarked ? "Bookmarked" : "Bookmark"}</span>
            </button>
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isLiked
                  ? "bg-red-500 text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? "fill-white" : ""}`} />
              <span>{likeCount} {isLiked ? "Liked" : "Like"}</span>
            </button>
          </div>

          {/* Featured Image */}
          {post.featured_image && (
            <div className="mb-8 rounded-xl overflow-hidden shadow-lg">
              <Image
                src={post.featured_image}
                alt={post.title}
                width={1200}
                height={630}
                className="w-full h-auto object-cover"
                priority
                unoptimized={post.featured_image.startsWith('http')}
              />
            </div>
          )}

          {/* Content */}
          <div
            className="prose prose-lg prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-[#2b825b] prose-img:rounded-lg prose-img:shadow-md max-w-none mb-8"
            dangerouslySetInnerHTML={renderContent()}
          />

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Stats Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xl font-bold text-gray-900">{viewCount.toLocaleString()}</div>
                <div className="text-xs text-gray-500">Views</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xl font-bold text-gray-900">{likeCount.toLocaleString()}</div>
                <div className="text-xs text-gray-500">Likes</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xl font-bold text-gray-900">{post.comments_count || 0}</div>
                <div className="text-xs text-gray-500">Comments</div>
              </div>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}