import { format } from "date-fns";
import Link from "next/link";
import { BlogPost } from "./types/blog";
import Image from "next/image";

interface BlogCardProps {
  post: BlogPost;
  variant?: "default" | "featured" | "compact";
}

const BlogCard = ({ post, variant = "default" }: BlogCardProps) => {
  if (variant === "featured") {
    return (
      <Link href={`/post/${post.slug}`} className="group block">
        <article className="grid md:grid-cols-2 gap-6 animate-fade-in">
          <div className="aspect-16/10 overflow-hidden rounded-lg">
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-3">
              {post.categories.slice(0, 2).map((cat) => (
                <span
                  key={cat.id}
                  className="text-xs font-medium text-accent uppercase tracking-wider"
                >
                  {cat.name}
                </span>
              ))}
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold mb-3 group-hover:text-accent transition-colors">
              {post.title}
            </h2>
            <p className="text-muted-foreground mb-4 line-clamp-3">
              {post.excerpt}
            </p>
            <div className="flex items-center gap-3">
              <Image
                src={post.author.avatar || "/default-avatar.png"}
                alt={post.author.name}
                className="w-8 h-8 rounded-full object-cover"
                width={32}
                height={32}
              />
              <div className="text-sm">
                <span className="font-medium">{post.author.name}</span>
                <span className="text-muted-foreground"> · </span>
                <span className="text-muted-foreground">
                  {format(new Date(post.createdAt), "MMM d, yyyy")}
                </span>
                <span className="text-muted-foreground"> · </span>
                <span className="text-muted-foreground">
                  {post.readTime} min read
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
      <Link href={`/post/${post.slug}`} className="group block">
        <article className="flex gap-4 animate-fade-in">
          <div className="w-24 h-24 shrink-0 overflow-hidden rounded">
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium line-clamp-2 group-hover:text-accent transition-colors">
              {post.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {format(new Date(post.createdAt), "MMM d, yyyy")} ·{" "}
              {post.readTime} min
            </p>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link href={`/post/${post.slug}`} className="group block">
      <article className="animate-fade-in">
        <div className="aspect-16/10 overflow-hidden rounded-lg mb-4">
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="flex items-center gap-2 mb-2">
          {post.categories.slice(0, 1).map((cat) => (
            <span
              key={cat.id}
              className="text-xs font-medium text-accent uppercase tracking-wider"
            >
              {cat.name}
            </span>
          ))}
        </div>
        <h2 className="text-xl font-semibold mb-2 group-hover:text-accent transition-colors line-clamp-2">
          {post.title}
        </h2>
        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
          {post.excerpt}
        </p>
        <div className="flex items-center gap-2">
          <Image
            src={post.author.avatar || "/default-avatar.png"}
            alt={post.author.name}
            className="w-6 h-6 rounded-full object-cover"
            width={24}
            height={24}
          />
          <span className="text-sm text-muted-foreground">
            {post.author.name} · {format(new Date(post.createdAt), "MMM d")} ·{" "}
            {post.readTime} min
          </span>
        </div>
      </article>
    </Link>
  );
};

export default BlogCard;
