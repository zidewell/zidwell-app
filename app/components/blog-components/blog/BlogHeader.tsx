
"use client";

import { useState } from "react";
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

interface BlogHeaderProps {
  onSearch?: (query: string) => void;
}

const BlogHeader = ({ onSearch }: BlogHeaderProps) => {
  const { stats, refreshPosts, isLoading } = useBlog();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Get top 3 categories for navigation
  const topCategories = stats?.categories
    .sort((a, b) => b.count - a.count)
    .slice(0, 3) || [];

  const handleRefresh = () => {
    refreshPosts();
  };

  return (
    <header className="border-b border-border bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-semibold tracking-tight">Zidwell</span>
            <span className="text-accent font-medium">Blog</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/blog"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              All Articles
            </Link>
            {topCategories.map((category) => (
              <Link
                key={category.name}
                href={`/blog?category=${encodeURIComponent(category.name)}`}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {category.name} ({category.count})
              </Link>
            ))}
            <Link
              href="/blog/admin"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Write
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isLoading}
              className="h-8 w-8"
              title="Refresh posts"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </nav>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/blog" className="cursor-pointer">
                    All Articles
                  </Link>
                </DropdownMenuItem>
                {topCategories.map((category) => (
                  <DropdownMenuItem key={category.name} asChild>
                    <Link
                      href={`/blog?category=${encodeURIComponent(category.name)}`}
                      className="cursor-pointer"
                    >
                      {category.name} ({category.count})
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem asChild>
                  <Link href="/blog/admin" className="cursor-pointer">
                    Write Article
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleRefresh}
                  disabled={isLoading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Subscribe Button */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/blog/subscribe">
              <Button className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-opacity">
                Subscribe
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Categories Bar (optional) */}
      <div className="md:hidden border-t border-border bg-background">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center gap-4 overflow-x-auto pb-2">
            <Link
              href="/blog"
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
            >
              All
            </Link>
            {topCategories.map((category) => (
              <Link
                key={category.name}
                href={`/blog?category=${encodeURIComponent(category.name)}`}
                className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
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