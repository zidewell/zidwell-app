// app/components/admin-components/AdminSideBar.tsx
'use client';

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  FileSpreadsheet,
  FileText,
  ClipboardList,
  Users,
  Menu,
  X,
  FileChartColumnIncreasing,
  Headphones,
  Bell,
  Key,
  Wallet,
  CreditCard,
  RefreshCw,
  History,
  LogOut,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import Image from "next/image";
import { useUserContextData } from "@/app/context/userData";
import Swal from "sweetalert2";
import { Button } from "../ui/button";

const navSections = [
  {
    title: "Overview",
    icon: LayoutDashboard,
    links: [
      { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { name: "Admin Management", href: "/admin/admin-management", icon: Users },
    ],
  },
  {
    title: "User Management",
    icon: Users,
    links: [
      { name: "Users", href: "/admin/users", icon: Users },
      { name: "KYC Users", href: "/admin/kyc", icon: Key },
    ],
  },
  {
    title: "Wallet Management",
    icon: Wallet,
    links: [
      { name: "Wallets", href: "/admin/wallets", icon: Wallet },
      { name: "Transactions", href: "/admin/transactions", icon: FileChartColumnIncreasing },
      { name: "Funding Logs", href: "/admin/funding-logs", icon: CreditCard },
      { name: "Reconciliation", href: "/admin/reconciliation", icon: RefreshCw },
    ],
  },
  {
    title: "Documents",
    icon: FileText,
    links: [
      { name: "Receipts", href: "/admin/receipts", icon: Receipt },
      { name: "Invoices", href: "/admin/invoices", icon: FileSpreadsheet },
      { name: "Contracts", href: "/admin/contracts", icon: FileText },
      { name: "Tax Manager", href: "/admin/tax-filings", icon: ClipboardList },
    ],
  },
  {
    title: "Support & System",
    icon: Headphones,
    links: [
      { name: "Support & Disputes", href: "/admin/disputes-supports", icon: Headphones },
      { name: "Notifications", href: "/admin/notifications", icon: Bell },
      { name: "Audit logs", href: "/admin/audit-logs", icon: History },
    ],
  },
];

export default function AdminSidebar() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const logoutInProgress = useRef(false);
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const router = useRouter();
  const { userData, setUserData } = useUserContextData();

  useEffect(() => {
    const currentSection = navSections.find((section) =>
      section.links.some(
        (link) => pathname === link.href || pathname.startsWith(link.href + "/"),
      ),
    );
    if (currentSection) {
      setExpandedSections((prev) => new Set(prev).add(currentSection.title));
    }
  }, [pathname]);

  const handleLogout = async () => {
    if (logoutInProgress.current || isLoggingOut) return;
    logoutInProgress.current = true;
    setIsLoggingOut(true);

    try {
      console.log("🔵 Attempting logout...");
      const response = await fetch("/api/logout", { method: "POST" });
      const data = await response.json();
      console.log("🔵 Logout response:", data);

      if (userData) {
        try {
          await fetch("/api/activity/last-logout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: userData.id,
              email: userData.email,
              login_history_id: userData.currentLoginSession,
            }),
          });
        } catch (activityError) {
          console.error("Error tracking logout activity:", activityError);
        }
      }

      if (typeof window !== "undefined") {
        localStorage.removeItem("userData");
      }
      setUserData(null);

      await Swal.fire({
        icon: "success",
        title: "Logged Out",
        text: "You have been signed out successfully.",
        timer: 1500,
        showConfirmButton: false,
      });

      setTimeout(() => {
        router.push("/auth/login");
      }, 1500);
    } catch (error: any) {
      console.error("Logout error:", error);
      localStorage.removeItem("userData");
      setUserData(null);

      await Swal.fire({
        icon: "error",
        title: "Logout Failed",
        text: error?.message || "An error occurred during logout. You have been logged out locally.",
        timer: 2000,
        showConfirmButton: false,
      });

      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } finally {
      setTimeout(() => {
        logoutInProgress.current = false;
        setIsLoggingOut(false);
      }, 2000);
    }
  };

  const handleBackToUserDashboard = () => {
    setIsMobileMenuOpen(false);
    router.push("/dashboard");
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(title)) {
        newSet.delete(title);
      } else {
        newSet.add(title);
      }
      return newSet;
    });
  };

  const isLinkActive = (href: string) => {
    if (href === "/admin") {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  const NavItem = ({ name, href, icon: Icon }: { name: string; href: string; icon: any }) => (
    <Link
      href={href}
      className={`flex items-center gap-3 p-2 squircle-md text-sm font-medium transition-all duration-200 group ${
        isLinkActive(href)
          ? "bg-[var(--color-accent-yellow)] text-[var(--color-ink)] shadow-soft"
          : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
      }`}
    >
      <Icon
        className={`w-4 h-4 ${
          isLinkActive(href)
            ? "text-[var(--color-ink)]"
            : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"
        }`}
      />
      <span className="truncate">{name}</span>
    </Link>
  );

  const SectionHeader = ({ title, icon: Icon }: { title: string; icon: any }) => {
    const isExpanded = expandedSections.has(title);
    return (
      <button
        onClick={() => toggleSection(title)}
        className="flex items-center justify-between w-full px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide hover:bg-[var(--bg-secondary)] squircle-md transition-colors duration-200 group"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]" />
          <span className="truncate">{title}</span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-[var(--text-secondary)] transition-transform duration-200" />
        ) : (
          <ChevronRight className="w-4 h-4 text-[var(--text-secondary)] transition-transform duration-200" />
        )}
      </button>
    );
  };

  return (
    <>
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[var(--color-ink)] text-[var(--color-white)] squircle-md shadow-soft hover:bg-[var(--color-ink)]/80 transition-colors duration-200"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <div
        className={`fixed inset-y-0 left-0 z-40 w-[280px] bg-[var(--bg-primary)] border-r border-[var(--border-color)] shadow-soft transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        // ✅ Custom scrollbar styling
        style={{
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'thin',
          scrollbarColor: `var(--color-accent-yellow) transparent`,
        }}
      >
        {/* ✅ Custom scrollbar styles via style tag */}
        <style jsx>{`
          /* For WebKit browsers (Chrome, Safari, Edge) */
          .fixed.inset-y-0::-webkit-scrollbar {
            width: 4px;
            height: 4px;
          }
          .fixed.inset-y-0::-webkit-scrollbar-track {
            background: transparent;
            border-radius: 9999px;
          }
          .fixed.inset-y-0::-webkit-scrollbar-thumb {
            background: var(--color-accent-yellow);
            border-radius: 9999px;
            transition: background 0.2s ease;
          }
          .fixed.inset-y-0::-webkit-scrollbar-thumb:hover {
            background: var(--color-accent-yellow);
            opacity: 0.8;
          }
          /* For Firefox */
          .fixed.inset-y-0 {
            scrollbar-width: thin;
            scrollbar-color: var(--color-accent-yellow) transparent;
          }
        `}</style>

        <div className="p-6 border-b border-[var(--border-color)] flex items-center gap-3 shrink-0 bg-[var(--bg-primary)]">
          <div className="relative w-8 h-8">
            <Image
              src="/logo.png"
              alt="Logo"
              width={32}
              height={32}
              className="rounded object-contain"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          </div>
          <div className="flex flex-col">
            <Link
              href="/admin"
              className="text-xl font-bold text-[var(--text-primary)] hover:text-[var(--text-primary)]/80 transition-colors font-[var(--font-space-grotesk)]"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Admin Panel
            </Link>
            <span className="text-xs text-[var(--text-secondary)]">Management Console</span>
          </div>
        </div>

        <div className="p-4 border-b border-[var(--border-color)] bg-[var(--color-accent-yellow)]/10">
          <Button
            onClick={handleBackToUserDashboard}
            className="w-full cursor-pointer flex items-center justify-center gap-2 bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90 squircle-md transition-all duration-200 font-[var(--font-be-vietnam)]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to User Dashboard</span>
          </Button>
        </div>

        <nav className="flex-1 p-3 space-y-2">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <SectionHeader title={section.title} icon={section.icon} />
              {expandedSections.has(section.title) && (
                <div className="ml-3 space-y-1 border-l-2 border-[var(--border-color)] pl-2">
                  {section.links.map((link) => (
                    <NavItem key={link.href} name={link.name} href={link.href} icon={link.icon} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] shrink-0">
          <div className="flex items-center gap-3 mb-4 p-3 squircle-lg bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-soft">
            <div className="w-8 h-8 bg-[var(--color-accent-yellow)] squircle-full flex items-center justify-center">
              <span className="text-[var(--color-ink)] text-sm font-semibold">
                {userData?.email?.charAt(0).toUpperCase() || "A"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                {userData?.email || "Admin User"}
              </p>
              <p className="text-xs text-[var(--text-secondary)] truncate">Administrator</p>
            </div>
          </div>

          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full cursor-pointer flex items-center justify-center gap-2 bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-secondary)] transition-all duration-200 squircle-md"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}