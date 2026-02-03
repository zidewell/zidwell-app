"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  MessageSquare,
  Settings,
  Sun,
  Moon,
  Menu,
  X,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "../../ui/button";
import Link from "next/link";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/blog/admin" },
  { icon: FileText, label: "Posts", path: "/blog/admin/post" },
  { icon: FolderOpen, label: "Categories", path: "/blog/admin/categories" },
  { icon: MessageSquare, label: "Comments", path: "/blog/admin/comments" },
  { icon: Settings, label: "Settings", path: "/blog/admin/settings" },
];

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const router = useRouter();
  const pathname = usePathname(); 

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <div className={cn("min-h-screen bg-background", darkMode && "dark")}>
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu className="w-5 h-5" />
        </Button>
        <span className="font-semibold">Zidwell CMS</span>
        <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
          {darkMode ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </Button>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <motion.aside
          initial={false}
          animate={{ width: sidebarOpen ? 256 : 0 }}
          className={cn(
            "fixed lg:sticky top-0 left-0 z-40 h-screen bg-card border-r border-border overflow-hidden",
            "lg:translate-x-0",
            !sidebarOpen && "lg:w-0"
          )}
          style={{ width: sidebarOpen ? "256px" : "0px" }}
        >
          <div className="flex flex-col h-full w-64">
            {/* Logo */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <Link href="/admin" className="flex items-center gap-2">
                <span className="text-lg font-semibold">Zidwell</span>
                <span className="text-sm text-accent">CMS</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-[#C29307]"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                    onClick={() => {
                      // Close sidebar on mobile after clicking a link
                      if (window.innerWidth < 1024) {
                        setSidebarOpen(false);
                      }
                    }}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-border space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3"
                onClick={toggleDarkMode}
              >
                {darkMode ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
                {darkMode ? "Light Mode" : "Dark Mode"}
              </Button>
              <Link href="/">
                <Button variant="outline" className="w-full justify-start gap-3">
                  <ChevronLeft className="w-5 h-5" />
                  Back to Blog
                </Button>
              </Link>
            </div>
          </div>
        </motion.aside>

        {/* Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          <div className="hidden lg:flex items-center justify-between p-4 border-b border-border bg-card">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
              {darkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>
          </div>
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;