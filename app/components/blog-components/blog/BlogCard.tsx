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

  console.log("BlogCard rendering for post:", post);
  // Fallback for featured image
  const featuredImage = post.featuredImage || "/default-blog-image.png";
  const authorAvatar = post.author?.avatar || "/default-avatar.png";
  const authorName = post.author?.name || "Unknown Author";
  const readTime = post.readTime || "5";
  const excerpt = post.excerpt || "";
  const categories = post.categories || [];
  const title = post.title || "Untitled Post";
  const slug = post.slug || "";

  if (variant === "featured") {
    return (
      <Link href={`/post/${slug}`} className="group block">
        <article className="grid md:grid-cols-2 gap-6 animate-fade-in">
          <div className="aspect-16/10 overflow-hidden rounded-lg">
            {/* Use regular img tag for better control */}
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
              <div className="relative w-8 h-8 rounded-full overflow-hidden">
                <img
                  src={authorAvatar}
                  alt={authorName}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
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
      <Link href={`/post/${slug}`} className="group block">
        <article className="flex gap-4 animate-fade-in">
          <div className="w-24 h-24 shrink-0 overflow-hidden rounded">
            <img
              src={featuredImage}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
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
    <Link href={`/post/${slug}`} className="group block">
      <article className="animate-fade-in">
        <div className="aspect-16/10 overflow-hidden rounded-lg mb-4">
          <img
            src={featuredImage}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
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
          <div className="relative w-6 h-6 rounded-full overflow-hidden">
            <img
              src={authorAvatar}
              alt={authorName}
              className="w-full h-full object-cover"
              loading="lazy"
            />
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