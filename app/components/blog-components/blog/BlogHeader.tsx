// BlogHeader.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { RefreshCw, Menu } from "lucide-react";
import { Button } from "../../ui/button";
import { useBlog } from "@/app/context/BlogContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import Image from "next/image";
import { useUserContextData } from "@/app/context/userData";

interface BlogHeaderProps {
  onSearch?: (query: string) => void;
  categories?: Array<{ name: string; count: number }>;
}

const BlogHeader = ({ onSearch, categories }: BlogHeaderProps) => {
  const { posts, refreshPosts, isLoading } = useBlog();
  const { userData } = useUserContextData();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const topCategories = useMemo(() => {
    if (categories && categories.length > 0) {
      return categories.sort((a, b) => b.count - a.count).slice(0, 3);
    }

    const categoryMap = new Map<string, number>();

    posts.forEach((post) => {
      if (post.categories && Array.isArray(post.categories)) {
        post.categories.forEach((category) => {
          if (typeof category === "string") {
            const trimmed = category.trim();
            if (trimmed) {
              categoryMap.set(trimmed, (categoryMap.get(trimmed) || 0) + 1);
            }
          }
        });
      }
    });

    return Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [posts, categories]);

  const handleRefresh = () => {
    refreshPosts();
  };

  return (
    <header className="border-b border-(--border-color) bg-(--bg-primary) sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="Zidwell Logo"
              width={32}
              height={32}
              className="mr-2 w-16 object-contain"
            />
            <h1 className="font-bold text-lg text-(--text-primary)">Zidwell</h1>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/blog"
              className="text-sm font-medium text-(--text-secondary) hover:text-(--text-primary) transition-colors"
            >
              All Articles
            </Link>
            {topCategories.map((category: any) => (
              <Link
                key={category.name}
                href={`/blog?category=${encodeURIComponent(category.name)}`}
                className="text-sm font-medium text-(--text-secondary) hover:text-(--text-primary) transition-colors"
              >
                {category.name} {category.count > 0 && `(${category.count})`}
              </Link>
            ))}

            {userData &&
              [
                "super_admin",
                "finance_admin",
                "operations_admin",
                "support_admin",
                "legal_admin",
              ].includes(userData?.role) && (
                <Link
                  href="/blog/admin"
                  className="text-sm font-medium text-(--text-secondary) hover:text-(--text-primary) transition-colors"
                >
                  Write
                </Link>
              )}

            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isLoading}
              className="h-8 w-8 text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-secondary)"
              title="Refresh posts"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </nav>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-(--text-secondary)"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-(--bg-primary) border border-(--border-color)"
              >
                <DropdownMenuItem asChild>
                  <Link
                    href="/blog"
                    className="cursor-pointer text-(--text-primary)"
                  >
                    All Articles
                  </Link>
                </DropdownMenuItem>
                {topCategories.map((category: any) => (
                  <DropdownMenuItem key={category.name} asChild>
                    <Link
                      href={`/blog?category=${encodeURIComponent(category.name)}`}
                      className="cursor-pointer text-(--text-primary)"
                    >
                      {category.name}{" "}
                      {category.count > 0 && `(${category.count})`}
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem asChild>
                  <Link
                    href="/blog/admin"
                    className="cursor-pointer text-(--text-primary)"
                  >
                    Write Article
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="text-(--text-primary)"
                >
                  <RefreshCw
                    className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Subscribe Button */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/blog/subscribe">
              <Button className="px-4 py-2 text-sm font-medium bg-(--color-accent-yellow) text-(--color-ink) rounded-full hover:opacity-90 transition-opacity">
                Subscribe
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Categories Bar */}
      <div className="md:hidden border-t border-(--border-color) bg-(--bg-primary)">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center gap-4 overflow-x-auto pb-2">
            <Link
              href="/blog"
              className="text-xs font-medium text-(--text-secondary) hover:text-(--text-primary) transition-colors whitespace-nowrap"
            >
              All
            </Link>
            {topCategories.map((category: any) => (
              <Link
                key={category.name}
                href={`/blog?category=${encodeURIComponent(category.name)}`}
                className="text-xs font-medium text-(--text-secondary) hover:text-(--text-primary) transition-colors whitespace-nowrap"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};

export default BlogHeader;
