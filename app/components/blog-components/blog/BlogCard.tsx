"use client";

import { format } from "date-fns";
import Link from "next/link";
import { BlogPost } from "./types/blog";
import Image from "next/image";
import { useEffect, useState } from "react";

interface BlogCardProps {
  post: BlogPost;
  variant?: "default" | "featured" | "compact";
}

const BlogCard = ({ post, variant = "default" }: BlogCardProps) => {
  const [isClient, setIsClient] = useState(false);
  const [formattedDate, setFormattedDate] = useState("");
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && post.createdAt) {
      try {
        const date = new Date(post.createdAt);
        if (!isNaN(date.getTime())) {
          if (variant === "compact") {
            setFormattedDate(format(date, "MMM d, yyyy"));
          } else if (variant === "featured") {
            setFormattedDate(format(date, "MMM d, yyyy"));
          } else {
            setFormattedDate(format(date, "MMM d"));
          }
        } else {
          setFormattedDate("Recent");
        }
      } catch (error) {
        console.warn('Error formatting date:', error);
        setFormattedDate("Recent");
      }
    }
  }, [isClient, post.createdAt, variant]);

  // Helper function to get user initials
  const getInitials = (name: string): string => {
    if (!name || name === "Unknown Author") return "U";
    
    const names = name.trim().split(" ");
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    
    return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
  };

  // Helper function to get a consistent color based on name
  const getAvatarColor = (name: string): string => {
    if (!name) return "#C29307";
    
    const colors = [
      "#3B82F6", // Blue
      "#10B981", // Green
      "#8B5CF6", // Purple
      "#F59E0B", // Amber
      "#EF4444", // Red
      "#06B6D4", // Cyan
      "#EC4899", // Pink
      "#8B4513", // Brown
    ];
    
    const hash = name.split("").reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  // Fallback for featured image
  const featuredImage = post.featuredImage || "/default-blog-image.png";
  const authorAvatar = post.author?.avatar;
  const authorName = post.author?.name || "Unknown Author";
  const readTime = post.readTime || "5";
  const excerpt = post.excerpt || "";
  const categories = post.categories || [];
  const title = post.title || "Untitled Post";
  const slug = post.slug || "";
  
  // Avatar initials and color
  const initials = getInitials(authorName);
  const avatarColor = getAvatarColor(authorName);

  if (variant === "featured") {
    return (
      <Link href={`/blog/post-blog/${slug}`} className="group block">
        <article className="grid md:grid-cols-2 gap-6 animate-fade-in">
          <div className="aspect-16/10 overflow-hidden rounded-lg">
            <Image
              src={featuredImage}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              width={800}
              height={500}
            />
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-3">
              {categories.slice(0, 2).map((cat) => (
                <span
                  key={cat.id}
                  className="text-xs font-medium text-[#C29307] uppercase tracking-wider"
                >
                  {cat.name}
                </span>
              ))}
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold mb-3 group-hover:text-[#C29307] transition-colors">
              {title}
            </h2>
            <p className="text-muted-foreground mb-4 line-clamp-3">
              {excerpt}
            </p>
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8 rounded-full overflow-hidden flex items-center justify-center border border-gray-200 dark:border-gray-700">
                {authorAvatar ? (
                  <Image
                    src={authorAvatar}
                    alt={authorName}
                    className="w-full h-full object-cover"
                    width={32}
                    height={32}
                    loading="lazy"
                    onError={(e) => {
                 
                      const target = e.currentTarget as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement?.querySelector('.avatar-initials')?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div 
                  className={`avatar-initials ${authorAvatar ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}
                  style={{ backgroundColor: avatarColor }}
                >
                  <span className="text-white text-xs font-semibold">
                    {initials}
                  </span>
                </div>
              </div>
              <div className="text-sm">
                <span className="font-medium">{authorName}</span>
                {isClient && formattedDate && (
                  <>
                    <span className="text-muted-foreground"> · </span>
                    <span className="text-muted-foreground">
                      {formattedDate}
                    </span>
                  </>
                )}
                <span className="text-muted-foreground"> · </span>
                <span className="text-muted-foreground">
                  {readTime} min read
                </span>
              </div>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  if (variant === "compact") {
    return (
      <Link href={`/blog/post-blog/${slug}`} className="group block">
        <article className="flex gap-4 animate-fade-in">
          <div className="w-24 h-24 shrink-0 overflow-hidden rounded">
            <Image
              src={featuredImage}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              width={96}
              height={96}
              loading="lazy"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium line-clamp-2 group-hover:text-[#C29307] transition-colors">
              {title}
            </h3>
            {isClient && formattedDate && (
              <p className="text-sm text-muted-foreground mt-1">
                {formattedDate} · {readTime} min
              </p>
            )}
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link href={`/blog/post-blog/${slug}`} className="group block">
      <article className="animate-fade-in">
        <div className="aspect-16/10 overflow-hidden rounded-lg mb-4">
          <Image
            src={featuredImage}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            width={500}
            height={500}
          />
        </div>
        <div className="flex items-center gap-2 mb-2">
          {categories.slice(0, 1).map((cat) => (
            <span
              key={cat.id}
              className="text-xs font-medium text-[#C29307] uppercase tracking-wider"
            >
              {cat.name}
            </span>
          ))}
        </div>
        <h2 className="text-xl font-semibold mb-2 group-hover:text-[#C29307] transition-colors line-clamp-2">
          {title}
        </h2>
        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
          {excerpt}
        </p>
        <div className="flex items-center gap-2">
          <div className="relative w-6 h-6 rounded-full overflow-hidden flex items-center justify-center border border-gray-200 dark:border-gray-700">
            {authorAvatar ? (
              <Image
                src={authorAvatar}
                alt={authorName}
                className="w-full h-full object-cover"
                width={24}
                height={24}
                loading="lazy"
                onError={(e) => {
                  // If image fails to load, fallback to initials
                  const target = e.currentTarget as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement?.querySelector('.avatar-initials')?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div 
              className={`avatar-initials ${authorAvatar ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}
              style={{ backgroundColor: avatarColor }}
            >
              <span className="text-white text-xs font-semibold">
                {initials}
              </span>
            </div>
          </div>
          {isClient && formattedDate && (
            <span className="text-sm text-muted-foreground">
              {authorName} · {formattedDate} · {readTime} min
            </span>
          )}
        </div>
      </article>
    </Link>
  );
};

export default BlogCard;