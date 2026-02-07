"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Home,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "../../ui/button";
import Link from "next/link";
import Image from "next/image";
import { useUserContextData } from "@/app/context/userData";

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
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { userData } = useUserContextData();
  const router = useRouter();
  const pathname = usePathname();

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setCollapsed(true);
      }
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setCollapsed(!collapsed);
    }
  };

  // Function to check if a nav item is active
  const isNavItemActive = (itemPath: string) => {
    if (itemPath === "/blog/admin") {
      // For dashboard, check exact match
      return pathname === itemPath;
    }
    
    // For other items, check if the current path starts with the item path
    // This handles nested routes like /blog/admin/post/edit, /blog/admin/categories/new, etc.
    return pathname.startsWith(itemPath);
  };

  const sidebarWidth = collapsed ? 80 : 256;

  return (
    <div className={cn("min-h-screen bg-background transition-colors", darkMode && "dark")}>
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card sticky top-0 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <div className="flex items-center">
          <Link href="/blog/admin" className="flex items-center">
            <Image
              src="/logo.png"
              alt="Zidwell Logo"
              width={32}
              height={32}
              className="mr-2 w-10 object-contain"
            />
            <h1 className="font-bold text-lg text-gray-900 dark:text-white">Zidwell</h1>
          </Link>
        </div>
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
          animate={{ 
            width: sidebarOpen ? sidebarWidth : 0,
            x: sidebarOpen ? 0 : -sidebarWidth
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={cn(
            "fixed lg:relative top-0 left-0 z-40 h-screen bg-card border-r border-border overflow-hidden",
            "flex flex-col shadow-lg"
          )}
          style={{ zIndex: 40 }}
        >
          <div className="flex flex-col h-full w-full">
            {/* Logo Section */}
            <div className={cn(
              "flex items-center justify-between p-4 border-b border-border",
              collapsed ? "flex-col gap-2" : "flex-row"
            )}>
              {!collapsed ? (
                <Link href="/blog/admin" className="flex items-center">
                  <Image
                    src="/logo.png"
                    alt="Zidwell Logo"
                    width={32}
                    height={32}
                    className="mr-2 w-10 object-contain"
                  />
                  <h1 className="font-bold text-lg text-gray-900 dark:text-white">Zidwell</h1>
                </Link>
              ) : (
                <Link href="/blog/admin" className="flex justify-center">
                  <Image
                    src="/logo.png"
                    alt="Zidwell Logo"
                    width={32}
                    height={32}
                    className="w-10 object-contain"
                  />
                </Link>
              )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = isNavItemActive(item.path);
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-[#C29307]/10 text-[#C29307] border border-[#C29307]/20"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                      collapsed && "justify-center"
                    )}
                    onClick={() => {
                      if (isMobile) {
                        setSidebarOpen(false);
                      }
                    }}
                  >
                    <item.icon className={cn(
                      "w-5 h-5 flex-shrink-0",
                      isActive && "text-[#C29307]"
                    )} />
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 1 }}
                        animate={{ opacity: collapsed ? 0 : 1 }}
                        className="whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Footer Section */}
            <div className="p-4 border-t border-border space-y-2">
              {/* Dark Mode Toggle */}
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 hover:bg-secondary/50",
                  collapsed && "justify-center px-2"
                )}
                onClick={toggleDarkMode}
              >
                {darkMode ? (
                  <Sun className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <Moon className="w-5 h-5 flex-shrink-0" />
                )}
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 1 }}
                    animate={{ opacity: collapsed ? 0 : 1 }}
                    className="whitespace-nowrap"
                  >
                    {darkMode ? "Light Mode" : "Dark Mode"}
                  </motion.span>
                )}
              </Button>

              {/* Back to Blog */}
              <Link href="/blog">
                <Button 
                  variant="outline" 
                  className={cn(
                    "w-full justify-start gap-3",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <Home className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 1 }}
                      animate={{ opacity: collapsed ? 0 : 1 }}
                      className="whitespace-nowrap"
                    >
                      Back to Blog
                    </motion.span>
                  )}
                </Button>
              </Link>

              <div className={cn(
                "flex items-center gap-3 p-2 rounded-lg border border-border/50",
                collapsed && "justify-center"
              )}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center overflow-hidden">
                  {userData?.profilePicture ? (
                    <Image
                      src={userData.profilePicture}
                      alt="Profile Picture"
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-white" />
                  )}
                </div>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 1 }}
                    animate={{ opacity: collapsed ? 0 : 1 }}
                    className="flex-1 min-w-0"
                  >
                    <p className="text-sm font-medium truncate">
                      {userData?.firstName ? `${userData.firstName} ${userData?.lastName || ""}`.trim() : "Admin User"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {userData?.email || "admin@example.com"}
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </motion.aside>

        {/* Mobile Overlay */}
        <AnimatePresence>
          {sidebarOpen && isMobile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className={cn(
          "flex-1 min-h-screen transition-all duration-300",
          !collapsed && "lg:ml-0"
        )}>
          {/* Desktop Header */}
          <div className="hidden lg:flex items-center justify-between p-4 border-b border-border bg-card sticky top-0 z-30">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="hover:bg-secondary/50"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <Link href="/blog/admin" className="flex items-center">
                  <Image
                    src="/logo.png"
                    alt="Zidwell Logo"
                    width={32}
                    height={32}
                    className="mr-2 w-10 object-contain"
                  />
                  <div>
                    <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Zidwell</h1>
                    <p className="text-xs text-muted-foreground">Content Management System</p>
                  </div>
                </Link>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
                {darkMode ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-4 md:p-6 lg:p-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;