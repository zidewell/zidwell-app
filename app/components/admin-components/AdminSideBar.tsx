"use client";

import { useState, useEffect } from "react";
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
      {
        name: "Admin Management",
        href: "/admin/admin-management",
        icon: Users,
      },
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
      {
        name: "Transactions",
        href: "/admin/transactions",
        icon: FileChartColumnIncreasing,
      },
      { name: "Funding Logs", href: "/admin/funding-logs", icon: CreditCard },
      {
        name: "Reconciliation",
        href: "/admin/reconciliation",
        icon: RefreshCw,
      },
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
      {
        name: "Support & Disputes",
        href: "/admin/disputes-supports",
        icon: Headphones,
      },
      { name: "Notifications", href: "/admin/notifications", icon: Bell },
      { name: "Audit logs", href: "/admin/audit-logs", icon: History },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(),
  );
  const router = useRouter();
  const { userData, setUserData } = useUserContextData();

  // Auto-expand sections based on current route
  useEffect(() => {
    const currentSection = navSections.find((section) =>
      section.links.some(
        (link) =>
          pathname === link.href || pathname.startsWith(link.href + "/"),
      ),
    );

    if (currentSection) {
      setExpandedSections((prev) => new Set(prev).add(currentSection.title));
    }
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });

      if (userData) {
        await fetch("/api/activity/last-logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userData.id,
            email: userData.email,
            login_history_id: userData.currentLoginSession,
          }),
        });
      }

      if (typeof window !== "undefined") {
        localStorage.removeItem("userData");
        localStorage.clear();
      }

      setUserData(null);

      Swal.fire({
        icon: "success",
        title: "Logged Out",
        text: "You have been signed out successfully.",
        timer: 1500,
        showConfirmButton: false,
      });

      router.push("/auth/login");
    } catch (error: any) {
      console.error("Logout error:", error);
      Swal.fire({
        icon: "error",
        title: "Logout Failed",
        text: error?.message || "An error occurred during logout.",
      });
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

  // Close mobile menu when route changes
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

  const NavItem = ({
    name,
    href,
    icon: Icon,
  }: {
    name: string;
    href: string;
    icon: any;
  }) => (
    <Link
      href={href}
      className={`flex items-center gap-3 p-2 rounded-lg text-sm font-medium transition-all duration-200 group ${
        isLinkActive(href)
          ? "bg-[#2b825b] text-white shadow-sm"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      }`}
    >
      <Icon
        className={`w-4 h-4 ${
          isLinkActive(href)
            ? "text-white"
            : "text-gray-400 group-hover:text-gray-600"
        }`}
      />
      <span className="truncate">{name}</span>
    </Link>
  );

  const SectionHeader = ({
    title,
    icon: Icon,
  }: {
    title: string;
    icon: any;
  }) => {
    const isExpanded = expandedSections.has(title);

    return (
      <button
        onClick={() => toggleSection(title)}
        className="flex items-center justify-between w-full px-4 py-3 text-sm font-semibold text-gray-700 uppercase tracking-wide hover:bg-gray-50 rounded-lg transition-colors duration-200 group"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
          <span className="truncate">{title}</span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400 transition-transform duration-200" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400 transition-transform duration-200" />
        )}
      </button>
    );
  };

  return (
    <>
      {/* 📱 Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 text-white rounded-lg shadow-lg hover:bg-gray-800 transition-colors duration-200"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
      </button>

      {/* 🧭 Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-[280px] bg-white border-r border-gray-200 shadow-lg overflow-y-auto transform transition-transform duration-300 ease-in-out lg:translate-x-0  ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* 🔝 Logo Section */}
        <div className="p-6 border-b border-gray-200 flex items-center gap-3 shrink-0 bg-white">
          <div className="relative w-8 h-8">
            <Image
              src="/logo.png"
              alt="Logo"
              width={32}
              height={32}
              className="rounded object-contain"
              onError={(e) => {
                // Fallback if logo doesn't exist
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
          <div className="flex flex-col">
            <Link
              href="/admin"
              className="text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Admin Panel
            </Link>
            <span className="text-xs text-gray-500">Management Console</span>
          </div>
        </div>

        {/* 🔙 Back to User Dashboard Button */}
        <div className="p-4 border-b border-gray-200 bg-blue-50">
          <Button
            onClick={handleBackToUserDashboard}
            className="w-full cursor-pointer flex items-center justify-center gap-2 border  bg-white text-black  hover:text-white hover:bg-[#2b825b]  transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to User Dashboard</span>
          </Button>
        </div>

        {/* 📂 Navigation Section */}
        <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <SectionHeader title={section.title} icon={section.icon} />

              {expandedSections.has(section.title) && (
                <div className="ml-3 space-y-1 border-l-2 border-gray-100 ">
                  {section.links.map((link) => (
                    <NavItem
                      key={link.href}
                      name={link.name}
                      href={link.href}
                      icon={link.icon}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* 👤 User & Logout Section */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 shrink-0">
          <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-white border border-gray-200">
            <div className="w-8 h-8 bg-[#2b825b] rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">
                {userData?.email?.charAt(0).toUpperCase() || "A"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {userData?.email || "Admin User"}
              </p>
              <p className="text-xs text-gray-500 truncate">Administrator</p>
            </div>
          </div>

          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full cursor-pointer flex items-center justify-center gap-2 bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>

      {/* 📱 Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
