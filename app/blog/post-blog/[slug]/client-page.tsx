"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Share2, Bookmark, Heart, Eye, Clock, Menu, X } from "lucide-react";
import Swal from "sweetalert2";
// Components
import BlogHeader from "@/app/components/blog-components/blog/BlogHeader";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import AudioPlayer from "@/app/components/blog-components/blog/AudioPlayer";
import ArticleContent from "@/app/components/blog-components/blog/AticleContent"; 
import CommentSection from "@/app/components/blog-components/blog/CommentSection";
import BlogCard from "@/app/components/blog-components/blog/BlogCard";
import BlogSidebar from "@/app/components/blog-components/blog/BlogSideBar";
import InlineSubscribe from "@/app/components/blog-components/blog/InlineSubscribe";
import AdPlaceholder from "@/app/components/blog-components/blog/Adpaceholder";
import Image from "next/image";
import BlogPostSkeleton from "@/app/components/blog-components/blog/BlogPostSkeleton";

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
  author: {
    id: string;
    name: string;
    avatar: string | null;
    bio: string | null;
  };
  published_at: string | null;
  created_at: string;
  updated_at: string;
  view_count: number;
  likes_count: number;
  comments_count: number;
  author_name?: string;
  audio_file?: string | null;
  comment_count?: number;
}

const calculateReadTime = (content: string): number => {
  if (!content) return 3;
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
};

export default function ClientPostPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const router = useRouter();
  
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [baseUrl, setBaseUrl] = useState("");

  // Get base URL on client side
  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  const showAlert = Swal.mixin({
    customClass: {
      confirmButton: "bg-[#242424] text-white hover:bg-[#242424]/90 px-4 py-2 rounded",
    },
    buttonsStyling: false,
  });

  // Fetch post data
  useEffect(() => {
    if (!slug) return;

    const fetchPost = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/blog/posts/slug/${slug}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Post not found");
          }
          throw new Error(`Failed to fetch post: ${response.statusText}`);
        }
        
        const postData = await response.json();
        
        if (!postData.is_published) {
          setError("This post is not published yet. It may be in draft mode.");
          setPost(null);
          setIsLoading(false);
          return;
        }
        
        setPost(postData);
        setViewCount(postData.view_count || 0);
        setLikeCount(postData.likes_count || 0);
        
        const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]');
        setIsLiked(likedPosts.includes(postData.id));
        
        // Update view count
        try {
          await fetch(`/api/blog/posts?id=${postData.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              view_count: (postData.view_count || 0) + 1
            }),
          });
        } catch (err) {
          // Silently fail view count update
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load post');
        setPost(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  // Fetch related posts
  useEffect(() => {
    if (!post) return;

    const fetchRelatedPosts = async () => {
      try {
        setIsLoadingRelated(true);
        
        // Fetch recent posts
        const recentResponse = await fetch('/api/blog/posts?limit=6&sort_by=created_at&sort_order=desc');
        if (recentResponse.ok) {
          const recentData = await recentResponse.json();
          const recentPostsList = recentData.posts || recentData;
          const filteredRecent = Array.isArray(recentPostsList)
            ? recentPostsList
                .filter((p: any) => p.id !== post.id && p.is_published)
                .slice(0, 6)
            : [];
          setRecentPosts(filteredRecent);
        }

        // Fetch related posts by category
        if (post.categories && post.categories.length > 0) {
          const category = post.categories[0];
          const relatedResponse = await fetch(
            `/api/blog/posts?category=${encodeURIComponent(category)}&limit=4`
          );
          if (relatedResponse.ok) {
            const relatedData = await relatedResponse.json();
            const relatedPostsList = relatedData.posts || relatedData;
            const filteredRelated = Array.isArray(relatedPostsList)
              ? relatedPostsList
                  .filter((p: any) => p.id !== post.id && p.is_published)
                  .slice(0, 4)
              : [];
            setRelatedPosts(filteredRelated);
          }
        }
      } catch (err) {
        // Silently fail related posts fetch
      } finally {
        setIsLoadingRelated(false);
      }
    };

    fetchRelatedPosts();
  }, [post]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = "/images/placeholder.jpg";
    e.currentTarget.onerror = null;
  };

  const handleShare = async () => {
    if (!post) return;
    
    try {
      setIsSharing(true);
      
      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text: post.excerpt || post.title,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        await showAlert.fire({
          title: 'Link Copied!',
          text: 'Post link has been copied to clipboard.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      // Ignore abort errors
    } finally {
      setIsSharing(false);
    }
  };

  const handleBookmark = () => {
    if (!post) return;
    
    setIsBookmarked(!isBookmarked);
    
    const bookmarks = JSON.parse(localStorage.getItem('blogBookmarks') || '[]');
    if (!isBookmarked) {
      bookmarks.push(post.id);
      showAlert.fire({
        title: 'Bookmarked!',
        text: 'Post added to your bookmarks.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
    } else {
      const index = bookmarks.indexOf(post.id);
      if (index > -1) {
        bookmarks.splice(index, 1);
      }
      showAlert.fire({
        title: 'Removed!',
        text: 'Post removed from bookmarks.',
        icon: 'info',
        timer: 1500,
        showConfirmButton: false,
      });
    }
    localStorage.setItem('blogBookmarks', JSON.stringify(bookmarks));
  };

  const handleLike = async () => {
    if (!post) return;
    
    try {
      const newLikeCount = isLiked ? likeCount - 1 : likeCount + 1;
      const newIsLiked = !isLiked;
      
      // Optimistic update
      setLikeCount(newLikeCount);
      setIsLiked(newIsLiked);
      
      // Update localStorage
      const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]');
      if (newIsLiked) {
        likedPosts.push(post.id);
      } else {
        const index = likedPosts.indexOf(post.id);
        if (index > -1) {
          likedPosts.splice(index, 1);
        }
      }
      localStorage.setItem('likedPosts', JSON.stringify(likedPosts));
      
      // Send update to server
      const response = await fetch(`/api/blog/posts?id=${post.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          likes_count: newLikeCount
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update likes');
      }

      showAlert.fire({
        title: newIsLiked ? 'Liked!' : 'Unliked!',
        text: newIsLiked ? 'You liked this post' : 'You unliked this post',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });

    } catch (err) {
      console.error('Error updating like:', err);
      
      // Rollback optimistic update
      setLikeCount(isLiked ? likeCount + 1 : likeCount - 1);
      setIsLiked(!isLiked);
      
      showAlert.fire({
        title: 'Error!',
        text: 'Failed to update like. Please try again.',
        icon: 'error',
      });
    }
  };

  useEffect(() => {
    if (post) {
      const bookmarks = JSON.parse(localStorage.getItem('blogBookmarks') || '[]');
      setIsBookmarked(bookmarks.includes(post.id));
    }
  }, [post]);

  // Close mobile sidebar on escape key
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showMobileSidebar) {
        setShowMobileSidebar(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [showMobileSidebar]);

  // Add font links to head
  useEffect(() => {
    // Add Be Vietnam font
    const beVietnamLink = document.createElement('link');
    beVietnamLink.href = 'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700&display=swap';
    beVietnamLink.rel = 'stylesheet';
    document.head.appendChild(beVietnamLink);

    // Add Neue Machina from Fontshare (free alternative)
    const neueMachinaLink = document.createElement('link');
    neueMachinaLink.href = 'https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap';
    neueMachinaLink.rel = 'stylesheet';
    document.head.appendChild(neueMachinaLink);

    return () => {
      // Clean up if needed
      document.head.removeChild(beVietnamLink);
      document.head.removeChild(neueMachinaLink);
    };
  }, []);

  // Show skeleton while loading
  if (isLoading) {
    return <BlogPostSkeleton />;
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-[#FFFFFF]">
        <BlogHeader />
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-16 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 bg-[#E6E6E6] rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 sm:w-12 sm:h-12 text-[#6B6B6B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-[#242424]" style={{ fontFamily: "'Clash Display', sans-serif" }}>
              Article Not Found
            </h1>
            <p className="text-[#6B6B6B] mb-4 sm:mb-6 px-4 sm:px-0 text-sm sm:text-base" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>
              {error || "The article you're looking for doesn't exist or hasn't been published yet."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center px-4 sm:px-0">
              <Button 
                variant="outline" 
                onClick={() => router.push('/blog')}
                className="gap-2 w-full sm:w-auto border-[#E6E6E6] text-[#242424] hover:bg-[#E6E6E6]" 
                style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Blog
              </Button>
              <Button 
                onClick={() => window.location.reload()}
                className="bg-[#242424] hover:bg-[#242424]/90 text-white gap-2 w-full sm:w-auto"
                style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const readTime = calculateReadTime(post.content);
  const publishDate = post.published_at || post.created_at;
  
  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <BlogHeader />

      <main className="mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-12 lg:py-16 max-w-7xl">
        {/* Mobile Sidebar Toggle */}
        <div className="lg:hidden mb-6 flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={() => router.push('/blog')}
            className="gap-2 hover:bg-[#E6E6E6] text-[#242424]"
            size="sm"
            style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden xs:inline">Back to Blog</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMobileSidebar(!showMobileSidebar)}
            className="gap-2 border-[#E6E6E6] text-[#242424]"
            style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
          >
            {showMobileSidebar ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            <span className="hidden xs:inline">Sidebar</span>
          </Button>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-8 lg:gap-20">
          <div className="max-w-4xl mx-auto lg:mx-0">
            <article>
              <div className="hidden lg:block">
                <Button
                  variant="ghost"
                  onClick={() => router.push('/blog')}
                  className="mb-6 gap-2 hover:bg-[#E6E6E6] text-[#242424]"
                  style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Blog
                </Button>
              </div>

              <header className="mb-6 sm:mb-8">
                <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-4">
                  {post.categories.map((category, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-[#E6E6E6] text-[#242424] hover:bg-[#E6E6E6]/80 uppercase text-xs tracking-wider px-2 py-0.5 sm:px-3 sm:py-1"
                      style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>

                <h1 
                  className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight mb-4 sm:mb-6 text-[#242424]"
                  style={{ fontFamily: "'Clash Display', sans-serif" }}
                >
                  {post.title}
                </h1>

                {post.excerpt && (
                  <p 
                    className="text-lg sm:text-xl text-[#6B6B6B] mb-4 sm:mb-6 italic border-l-2 sm:border-l-4 border-[#E6E6E6] pl-3 sm:pl-4 py-1 sm:py-2"
                    style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
                  >
                    {post.excerpt}
                  </p>
                )}

                <div className="flex flex-col gap-4 sm:gap-6 mb-4 sm:mb-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="relative flex-shrink-0">
                      <Image
                        src={post.author?.avatar || "https://images.unsplash.com/photo-1463453091185-61582044d556?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fHVzZXIlMjBwcm9maWxlfGVufDB8fDB8fHww"}
                        alt={post.author?.name || "Author"}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-[#E6E6E6]"
                        onError={handleImageError}
                        loading="lazy"
                        width={40}
                        height={40}
                      />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-[#242424] rounded-full border-2 border-[#FFFFFF]"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 
                        className="font-semibold text-[#242424] text-sm sm:text-base truncate"
                        style={{ fontFamily: "'Clash Display', sans-serif" }}
                      >
                        {post.author?.name || "Unknown Author"}
                      </h3>
                      <div 
                        className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-[#6B6B6B] mt-1"
                        style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
                      >
                        <span className="flex items-center gap-1 whitespace-nowrap">
                          <Clock className="w-3 h-3" />
                          {readTime} min read
                        </span>
                        <span className="hidden xs:inline">•</span>
                        <span className="flex items-center gap-1 whitespace-nowrap">
                          <Eye className="w-3 h-3" />
                          {viewCount} views
                        </span>
                        <span>•</span>
                        <time dateTime={publishDate} className="whitespace-nowrap">
                          {format(new Date(publishDate), "MMM d, yyyy")}
                        </time>
                      </div>
                    </div>
                  </div>
                  
                  {post.author?.bio && (
                    <div 
                      className="hidden lg:block text-sm text-[#6B6B6B] border-l border-[#E6E6E6] pl-6"
                      style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
                    >
                      {post.author.bio}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-4 sm:mb-6 border-t border-b border-[#E6E6E6] py-3 sm:py-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                    disabled={isSharing}
                    className="gap-2 hover:bg-[#E6E6E6] text-[#242424] border-[#E6E6E6] flex-1 sm:flex-none"
                    style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="hidden xs:inline">{isSharing ? "Sharing..." : "Share"}</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBookmark}
                    className={`gap-2 hover:bg-[#E6E6E6] text-[#242424] border-[#E6E6E6] flex-1 sm:flex-none ${isBookmarked ? 'bg-[#E6E6E6]' : ''}`}
                    style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
                  >
                    <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-[#242424] text-[#242424]' : ''}`} />
                    <span className="hidden xs:inline">{isBookmarked ? "Bookmarked" : "Bookmark"}</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLike}
                    className={`gap-2 hover:bg-[#E6E6E6] text-[#242424] border-[#E6E6E6] flex-1 sm:flex-none ${isLiked ? 'bg-[#E6E6E6]' : ''}`}
                    style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-[#242424] text-[#242424]' : ''}`} />
                    <span className="hidden xs:inline">{likeCount} {isLiked ? 'Liked' : 'Like'}</span>
                  </Button>
                </div>

                {post.content && (
                  <div className="mb-6 sm:mb-8">
                    <AudioPlayer content={post.content} />
                  </div>
                )}
              </header>

              {post.featured_image && (
                <div className="aspect-video overflow-hidden rounded-lg sm:rounded-xl mb-6 sm:mb-8 border border-[#E6E6E6] shadow-sm">
                  <Image
                    src={post.featured_image}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    onError={handleImageError}
                    loading="lazy"
                    width={800}
                    height={450}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 800px, 1000px"
                  />
                </div>
              )}

              {/* RENDER FULL CONTENT HERE */}
              <div 
                className="mb-6 sm:mb-8 text-[#242424]"
                style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
              >
                <ArticleContent content={post.content} />
              </div>

              <div className="my-8 sm:my-12">
                <InlineSubscribe />
              </div>

              <div className="my-8 sm:my-12">
                <AdPlaceholder variant="inline" />
              </div>

              {post.tags && post.tags.length > 0 && (
                <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-[#E6E6E6]">
                  <h4 
                    className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-[#242424]"
                    style={{ fontFamily: "'Clash Display', sans-serif" }}
                  >
                    Tags
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="text-xs sm:text-sm px-3 py-1 hover:bg-[#E6E6E6] cursor-pointer transition-colors border-[#E6E6E6] text-[#242424]"
                        style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
                        onClick={() => router.push(`/blog/tag/${tag.toLowerCase().replace(/\s+/g, '-')}`)}
                      >
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-[#E6E6E6]">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-center">
                  <div className="p-3 sm:p-4 bg-[#E6E6E6] rounded-lg">
                    <div 
                      className="text-xl sm:text-2xl font-bold text-[#242424]"
                      style={{ fontFamily: "'Clash Display', sans-serif" }}
                    >
                      {viewCount}
                    </div>
                    <div 
                      className="text-xs sm:text-sm text-[#6B6B6B] mt-1"
                      style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
                    >
                      Views
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 bg-[#E6E6E6] rounded-lg">
                    <div 
                      className="text-xl sm:text-2xl font-bold text-[#242424]"
                      style={{ fontFamily: "'Clash Display', sans-serif" }}
                    >
                      {likeCount}
                    </div>
                    <div 
                      className="text-xs sm:text-sm text-[#6B6B6B] mt-1"
                      style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
                    >
                      Likes
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 bg-[#E6E6E6] rounded-lg">
                    <div 
                      className="text-xl sm:text-2xl font-bold text-[#242424]"
                      style={{ fontFamily: "'Clash Display', sans-serif" }}
                    >
                      {post.comments_count || 0}
                    </div>
                    <div 
                      className="text-xs sm:text-sm text-[#6B6B6B] mt-1"
                      style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
                    >
                      Comments
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 bg-[#E6E6E6] rounded-lg">
                    <div 
                      className="text-xl sm:text-2xl font-bold text-[#242424]"
                      style={{ fontFamily: "'Clash Display', sans-serif" }}
                    >
                      {readTime}
                    </div>
                    <div 
                      className="text-xs sm:text-sm text-[#6B6B6B] mt-1"
                      style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
                    >
                      Min Read
                    </div>
                  </div>
                </div>
                <div 
                  className="text-center text-xs sm:text-sm text-[#6B6B6B] mt-3 sm:mt-4 px-2"
                  style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
                >
                  Published on {format(new Date(publishDate), "MMMM d, yyyy 'at' h:mm a")}
                  {post.updated_at && post.updated_at !== post.created_at && (
                    <span className="block sm:inline"> • Updated {format(new Date(post.updated_at), "MMMM d, yyyy")}</span>
                  )}
                </div>
              </div>
            </article>

            <div className="mt-12 sm:mt-16">
              <CommentSection postId={post.id} />
            </div>

            {relatedPosts.length > 0 && (
              <section className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-[#E6E6E6]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-3">
                  <h3 
                    className="text-xl sm:text-2xl font-semibold text-[#242424]"
                    style={{ fontFamily: "'Clash Display', sans-serif" }}
                  >
                    Related Articles
                  </h3>
                </div>
                
                {isLoadingRelated ? (
                  <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
                    {[1, 2].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="aspect-video bg-[#E6E6E6] rounded-lg mb-3 sm:mb-4"></div>
                        <div className="h-4 bg-[#E6E6E6] rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-[#E6E6E6] rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
                    {relatedPosts.map((relatedPost) => (
                      <BlogCard 
                        key={relatedPost.id} 
                        post={{
                          id: relatedPost.id,
                          title: relatedPost.title,
                          slug: relatedPost.slug,
                          excerpt: relatedPost.excerpt || relatedPost.content.substring(0, 150) + '...',
                          featuredImage: relatedPost.featured_image || '/images/placeholder.jpg',
                          categories: relatedPost.categories.map(cat => ({ 
                            id: cat.toLowerCase().replace(/\s+/g, '-'), 
                            name: cat,
                            slug: cat.toLowerCase().replace(/\s+/g, '-'),
                            postCount: 0
                          })),
                          tags: relatedPost.tags,
                          author: {
                            id: relatedPost.author?.id || relatedPost.author_id,
                            name: relatedPost.author?.name || relatedPost.author_name || "Unknown Author",
                            avatar: relatedPost.author?.avatar || '',
                            bio: relatedPost.author?.bio || '',
                            isZidwellUser: false
                          },
                          createdAt: relatedPost.created_at,
                          updatedAt: relatedPost.updated_at,
                          readTime: calculateReadTime(relatedPost.content),
                          isPublished: relatedPost.is_published,
                          content: relatedPost.content,
                          comments: []
                        }} 
                      />
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>

          {/* Desktop Sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-8">
              <BlogSidebar />
            </div>
          </div>

          {/* Mobile Sidebar Overlay */}
          {showMobileSidebar && (
            <>
              <div 
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={() => setShowMobileSidebar(false)}
              />
              <div className="fixed inset-y-0 right-0 w-[300px] max-w-[85vw] bg-[#FFFFFF] z-50 lg:hidden overflow-y-auto shadow-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 
                    className="text-lg font-semibold text-[#242424]"
                    style={{ fontFamily: "'Clash Display', sans-serif" }}
                  >
                    Sidebar
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMobileSidebar(false)}
                    className="p-2 hover:bg-[#E6E6E6] text-[#242424]"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <BlogSidebar />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}