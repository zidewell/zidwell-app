// BlogCard.tsx
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
        console.warn("Error formatting date:", error);
        setFormattedDate("Recent");
      }
    }
  }, [isClient, post.createdAt, variant]);

  const getInitials = (name: string): string => {
    if (!name || name === "Unknown Author") return "U";

    const names = name.trim().split(" ");
    if (names.length === 1) return names[0].charAt(0).toUpperCase();

    return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
  };

  const getAvatarColor = (name: string): string => {
    if (!name) return "var(--color-accent-yellow)";

    const colors = [
      "#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444", "#06B6D4", "#EC4899", "#8B4513",
    ];

    const hash = name.split("").reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

    return colors[Math.abs(hash) % colors.length];
  };

  const featuredImage = post.featuredImage || "/default-blog-image.png";
  const authorAvatar = post.author?.avatar;
  const authorName = post.author?.name || "Unknown Author";
  const readTime = post.readTime || "5";
  const excerpt = post.excerpt || "";
  const categories = post.categories || [];
  const title = post.title || "Untitled Post";
  const slug = post.slug || "";

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
                  className="text-xs font-medium text-[var(--color-accent-yellow)] uppercase tracking-wider"
                >
                  {cat.name}
                </span>
              ))}
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold mb-3 text-[var(--text-primary)] group-hover:text-[var(--color-accent-yellow)] transition-colors">
              {title}
            </h2>
            <p className="text-[var(--text-secondary)] mb-4 line-clamp-3">{excerpt}</p>
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8 rounded-full overflow-hidden flex items-center justify-center border border-[var(--border-color)]">
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
                      target.style.display = "none";
                      target.parentElement
                        ?.querySelector(".avatar-initials")
                        ?.classList.remove("hidden");
                    }}
                  />
                ) : null}
                <div
                  className={`avatar-initials ${authorAvatar ? "hidden" : "flex"} items-center justify-center w-full h-full`}
                  style={{ backgroundColor: avatarColor }}
                >
                  <span className="text-white text-xs font-semibold">
                    {initials}
                  </span>
                </div>
              </div>
              <div className="text-sm">
                <span className="font-medium text-[var(--text-primary)]">{authorName}</span>
                {isClient && formattedDate && (
                  <>
                    <span className="text-[var(--text-secondary)]"> · </span>
                    <span className="text-[var(--text-secondary)]">
                      {formattedDate}
                    </span>
                  </>
                )}
                <span className="text-[var(--text-secondary)]"> · </span>
                <span className="text-[var(--text-secondary)]">
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
            <h3 className="font-medium text-[var(--text-primary)] line-clamp-2 group-hover:text-[var(--color-accent-yellow)] transition-colors">
              {title}
            </h3>
            {isClient && formattedDate && (
              <p className="text-sm text-[var(--text-secondary)] mt-1">
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
              className="text-xs font-medium text-[var(--color-accent-yellow)] uppercase tracking-wider"
            >
              {cat.name}
            </span>
          ))}
        </div>
        <h2 className="text-xl font-semibold mb-2 text-[var(--text-primary)] group-hover:text-[var(--color-accent-yellow)] transition-colors line-clamp-2">
          {title}
        </h2>
        <p className="text-[var(--text-secondary)] text-sm mb-3 line-clamp-2">
          {excerpt}
        </p>
        <div className="flex items-center gap-2">
          <div className="relative w-6 h-6 rounded-full overflow-hidden flex items-center justify-center border border-[var(--border-color)]">
            {authorAvatar ? (
              <Image
                src={authorAvatar}
                alt={authorName}
                className="w-full h-full object-cover"
                width={24}
                height={24}
                loading="lazy"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.style.display = "none";
                  target.parentElement
                    ?.querySelector(".avatar-initials")
                    ?.classList.remove("hidden");
                }}
              />
            ) : null}
            <div
              className={`avatar-initials ${authorAvatar ? "hidden" : "flex"} items-center justify-center w-full h-full`}
              style={{ backgroundColor: avatarColor }}
            >
              <span className="text-white text-xs font-semibold">
                {initials}
              </span>
            </div>
          </div>
          {isClient && formattedDate && (
            <span className="text-sm text-[var(--text-secondary)]">
              {authorName} · {formattedDate} · {readTime} min
            </span>
          )}
        </div>
      </article>
    </Link>
  );
};

export default BlogCard;