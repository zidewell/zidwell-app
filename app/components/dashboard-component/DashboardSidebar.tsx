"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  BookOpen,
  FileText,
  FileSignature,
  BarChart3,
  Settings,
  X,
  ChevronRight,
  ChevronDown,
  Radio,
  Youtube,
  PenLine,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Wallet,
  Send,
  Receipt,
  CreditCard,
  Calculator,
  Newspaper,
  User,
  Smartphone,
  Wifi,
  Tv,
  Lightbulb,
  Captions,
  Users,
  FileSpreadsheet,
  Menu,
} from "lucide-react";
import Image from "next/image";
import { useUserContextData } from "@/app/context/userData";
import { ProtectedLink } from "../ProtectedLink";
import { useTheme } from "../ThemeProvider";

const formatNumber = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const ALLOWED_PAYMENT_EMAILS = new Set([
  "characterinternational@gmail.com",
  "abdullahtimilehin15@gmail.com",
  "ebrusikefavour@gmail.com",
  "skillfidelafrica@gmail.com",
  "abbalolo360@gmail.com",
]);

const canAccessPaymentPage = (userEmail?: string | null) => {
  if (!userEmail) return false;
  return ALLOWED_PAYMENT_EMAILS.has(userEmail.toLowerCase());
};

interface DashboardSidebarProps {
  open: boolean;
  onClose: () => void;
}

const DashboardSidebar = ({ open, onClose }: DashboardSidebarProps) => {
  const [showBalance, setShowBalance] = useState(false);
  const [active, setActive] = useState("Dashboard");
  const [hovered, setHovered] = useState<string | null>(null);
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const { userData, balance } = useUserContextData();
  const { theme, setTheme } = useTheme();

  // Check screen size for responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handle body scroll lock when sidebar is open on mobile
  useEffect(() => {
    if (open && isMobile) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [open, isMobile]);

  const formatBalance = () => {
    if (!showBalance) return "*****";
    if (balance != null) return formatNumber(balance);
    return "0.00";
  };

  const isActiveRoute = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "#") return false;
    return pathname.startsWith(href);
  };

  // Toggle dropdown on mobile
  const toggleDropdown = (title: string) => {
    if (isMobile) {
      setOpenDropdowns((prev) => ({
        ...prev,
        [title]: !prev[title],
      }));
    }
  };

  // Check if dropdown is open
  const isDropdownOpen = (title: string) => {
    if (isMobile) {
      return openDropdowns[title] || false;
    }
    return hovered === title;
  };

  // Navigation items with sub-items
  const navItems = [
    { 
      title: "Dashboard", 
      icon: LayoutDashboard, 
      href: "/dashboard", 
      sub: ["Overview", "Today's Money", "Future Money"] 
    },
    { 
      title: "Payments", 
      icon: ArrowLeftRight, 
      href: "/dashboard/fund-account", 
      sub: ["Send Money", "Add Money", "Beneficiaries", "Cards"] 
    },
    { 
      title: "Bookkeeping", 
      icon: BookOpen, 
      href: "/dashboard/services/bookkeeping", 
      sub: ["Journal", "Income", "Expenses"] 
    },
    { 
      title: "Invoicing", 
      icon: FileText, 
      href: "/dashboard/services/create-invoice", 
      sub: ["Invoices", "Receipts"] 
    },
    { 
      title: "Bills", 
      icon: FileSpreadsheet, 
      href: "/dashboard/bills", 
      sub: [
        // "Electricity",
        //  "Cable TV", 
         "Airtime",
          "Data"] 
    },
    { 
      title: "Contracts", 
      icon: FileSignature, 
      href: "/dashboard/services/contract", 
      sub: ["Active", "Templates", "Archive"] 
    },
    { 
      title: "Reports", 
      icon: BarChart3, 
      href: "/dashboard/reports", 
      sub: ["Profit & Loss", "Cash Flow", "Tax"] 
    },
    { 
      title: "Settings", 
      icon: Settings, 
      href: "/dashboard/profile", 
      sub: ["Profile", "Team", "Security"] 
    },
  ];

  const extraItems = [
    { title: "Work Radio", icon: Radio, href: "#", comingSoon: true },
    { title: "YouTube", icon: Youtube, href: "#", comingSoon: true },
    { title: "Blog", icon: PenLine, href: "/blog" },
  ];

  const showPaymentPage = canAccessPaymentPage(userData?.email);

  const ThemeToggle = () => (
    <div className="flex items-center gap-2 p-1 bg-(--bg-secondary) rounded-xl">
      <button
        onClick={() => setTheme("light")}
        className={`p-1.5 sm:p-2 rounded-lg transition-all ${
          theme === "light"
            ? "bg-(--color-accent-yellow) text-(--color-ink)"
            : "text-(--text-secondary) hover:bg-(--bg-secondary)"
        }`}
        aria-label="Light mode"
      >
        <Sun size={16} className="sm:w-[18px] sm:h-[18px]" />
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`p-1.5 sm:p-2 rounded-lg transition-all ${
          theme === "dark"
            ? "bg-(--color-accent-yellow) text-(--color-ink)"
            : "text-(--text-secondary) hover:bg-(--bg-secondary)"
        }`}
        aria-label="Dark mode"
      >
        <Moon size={16} className="sm:w-[18px] sm:h-[18px]" />
      </button>
    </div>
  );

  const showComingSoonNotification = (title: string) => {
    onClose();
    const notification = document.createElement("div");
    notification.className =
      "fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-(--color-accent-yellow) text-(--color-ink) px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-lg z-50 transition-all duration-300 text-xs sm:text-sm font-semibold";
    notification.innerHTML = `
      <div class="flex items-center gap-2">
        <span>🚀</span>
        <span>${title} is coming soon!</span>
      </div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.opacity = "0";
      notification.style.transform = "translateX(-50%) translateY(-20px)";
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 2000);
  };

  const NavItem = ({ item, isActive }: { item: any; isActive: boolean }) => {
    const protectedLinks = [
      "/dashboard/fund-account",
      "/dashboard/fund-account/transfer-page",
      "/dashboard/services/buy-airtime",
      "/dashboard/services/buy-data",
      "/dashboard/services/buy-power",
      "/dashboard/services/buy-cable-tv",
      "/dashboard/services/create-invoice",
    ];

    const isProtected = protectedLinks.includes(item.href);

    const commonClassName = `group flex w-full items-center gap-2 sm:gap-3.5 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 text-[0.85rem] sm:text-[0.95rem] font-medium transition-all duration-200 ${
      isActive
        ? "bg-(--bg-secondary) text-(--text-primary) shadow-[2px_2px_0px_var(--border-color)]"
        : "text-(--text-secondary) hover:bg-(--bg-secondary) hover:text-(--text-primary)"
    }`;

    const content = (
      <>
        <item.icon
          className={`h-[1rem] w-[1rem] sm:h-[1.15rem] sm:w-[1.15rem] transition-colors ${isActive ? "text-(--color-accent-yellow)" : "group-hover:text-(--color-accent-yellow)"}`}
          strokeWidth={1.4}
        />
        <span className="flex-1 text-left text-xs sm:text-sm">{item.title}</span>
        {item.comingSoon && (
          <span className="text-[0.5rem] sm:text-[0.6rem] font-bold uppercase tracking-wider text-(--color-accent-yellow) bg-(--color-accent-yellow)/10 px-1.5 sm:px-2 py-0.5 rounded-full">
            Coming Soon
          </span>
        )}
      </>
    );

    if (item.comingSoon) {
      return (
        <button
          onClick={() => showComingSoonNotification(item.title)}
          className={`${commonClassName} cursor-not-allowed opacity-70`}
        >
          {content}
        </button>
      );
    }

    if (isProtected) {
      return (
        <ProtectedLink href={item.href} onClick={onClose} className={commonClassName}>
          {content}
        </ProtectedLink>
      );
    }

    return (
      <Link href={item.href} onClick={onClose} className={commonClassName}>
        {content}
      </Link>
    );
  };

  // Sub-item routes mapping
  const subRoutes: Record<string, string> = {
    // Dashboard sub-items
    "Overview": "/dashboard",
    "Today's Money": "/dashboard#today",
    "Future Money": "/dashboard#future",
    // Payments sub-items
    "Send Money": "/dashboard/fund-account/transfer-page",
    "Add Money": "/dashboard/fund-account",
    "Beneficiaries": "/dashboard/beneficiaries",
    "Cards": "/dashboard/cards",
    // Bookkeeping sub-items
    "Journal": "/dashboard/services/bookkeeping",
    "Income": "/dashboard/services/bookkeeping/income",
    "Expenses": "/dashboard/services/bookkeeping/expenses",
    // Invoicing sub-items
    "Invoices": "/dashboard/services/create-invoice",
    "Receipts": "/dashboard/services/receipt",
    // Bills sub-items
    "Airtime": "/dashboard/services/buy-airtime",
    "Data": "/dashboard/services/buy-data",
    // Contracts sub-items
    "Active": "/dashboard/services/contract",
    "Templates": "/dashboard/contracts/templates",
    "Archive": "/dashboard/contracts/archive",
    // Reports sub-items
    "Profit & Loss": "/dashboard/reports/profit-loss",
    "Cash Flow": "/dashboard/reports/cash-flow",
    "Tax": "/dashboard/services/tax-filing",
    // Settings sub-items
    "Profile": "/dashboard/profile",
    "Team": "/dashboard/team",
    "Security": "/dashboard/security",
  };

  return (
    <>
      {/* Mobile Overlay */}
      {open && isMobile && (
        <div
          className="fixed inset-0 z-40 bg-(--color-ink)/40 backdrop-blur-sm lg:hidden"
          onClick={() => onClose()}
        />
      )}

      <aside
       className={`fixed top-0 left-0 z-50 flex h-full w-[280px] sm:w-72 flex-col bg-(--bg-primary) border-r-2 border-(--border-color) transition-transform duration-300 ease-out lg:translate-x-0 ${
    open ? "translate-x-0" : "-translate-x-full"
  }`}
>
        {/* Header - Fixed height */}
        <div className="flex h-14 sm:h-16 lg:h-[72px] items-center justify-between px-4 sm:px-6 lg:px-8 border-b-2 border-(--border-color) shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2 sm:gap-3" onClick={() => onClose()}>
            <Image
              src="/logo.png"
              alt="Zidwell Logo"
              width={28}
              height={28}
              className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 object-contain"
            />
            <span className="text-base sm:text-lg lg:text-xl font-extrabold tracking-tight text-(--text-primary)">
              Zidwell
            </span>
          </Link>
          <button
            onClick={() => onClose()}
            className="lg:hidden text-(--text-secondary) hover:text-(--text-primary) p-1"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.5} />
          </button>
        </div>

        {/* User Info - Compact */}
        {userData && userData.fullName && (
          <div className="px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4 border-b-2 border-(--border-color) shrink-0">
            <p className="text-(--text-secondary) text-xs sm:text-sm truncate">
              Welcome Back, <span className="font-medium text-(--text-primary)">{userData.fullName}</span>
            </p>
            {balance != null && (
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-1">
                  <span className="text-(--text-secondary) text-[10px] sm:text-xs">Wallet:</span>
                  <span className="text-(--text-primary) text-xs sm:text-sm font-bold">
                    ₦{formatBalance()}
                  </span>
                  <button
                    onClick={() => setShowBalance(!showBalance)}
                    className="p-0.5 hover:bg-(--bg-secondary) rounded transition-colors"
                    aria-label={showBalance ? "Hide balance" : "Show balance"}
                  >
                    {showBalance ? (
                      <Eye className="w-3 h-3 text-(--text-secondary)" />
                    ) : (
                      <EyeOff className="w-3 h-3 text-(--text-secondary)" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 sm:space-y-1 overflow-y-auto px-2 sm:px-3 lg:px-4 pb-4 sm:pb-6 lg:pb-8 pt-2 sm:pt-3 lg:pt-4">
          {navItems.map((item) => {
            const isActive = active === item.title || isActiveRoute(item.href);
            const isOpen = isDropdownOpen(item.title);
            
            return (
              <div
                key={item.title}
                onMouseEnter={() => {
                  if (!isMobile) {
                    setHovered(item.title);
                  }
                }}
                onMouseLeave={() => {
                  if (!isMobile) {
                    setHovered(null);
                  }
                }}
              >
                <button
                  onClick={() => {
                    setActive(item.title);
                    if (isMobile) {
                      toggleDropdown(item.title);
                    } else {
                      if (item.href && item.href !== "#") {
                        onClose();
                        window.location.href = item.href;
                      }
                    }
                  }}
                  className={`group flex w-full items-center gap-2 sm:gap-3.5 rounded-xl sm:rounded-2xl px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-2.5 text-[0.8rem] sm:text-[0.9rem] lg:text-[0.95rem] font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-(--bg-secondary) text-(--text-primary) shadow-[2px_2px_0px_var(--border-color)]"
                      : "text-(--text-secondary) hover:bg-(--bg-secondary) hover:text-(--text-primary)"
                  }`}
                >
                  <item.icon
                    className={`h-[0.9rem] w-[0.9rem] sm:h-[1rem] sm:w-[1rem] lg:h-[1.15rem] lg:w-[1.15rem] transition-colors ${isActive ? "text-(--color-accent-yellow)" : "group-hover:text-(--color-accent-yellow)"}`}
                    strokeWidth={1.4}
                  />
                  <span className="flex-1 text-left text-xs sm:text-sm">{item.title}</span>
                  {isMobile ? (
                    isOpen ? (
                      <ChevronDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 opacity-40 transition-transform duration-200" strokeWidth={1.4} />
                    ) : (
                      <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 opacity-40 transition-transform duration-200" strokeWidth={1.4} />
                    )
                  ) : (
                    <ChevronRight
                      className={`h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 opacity-40 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
                      strokeWidth={1.4}
                    />
                  )}
                </button>

                {/* Sub-items */}
                <div
                  className={`grid transition-all duration-300 ease-out ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="ml-[1.8rem] sm:ml-[2.1rem] mt-0.5 sm:mt-1 space-y-0.5 border-l border-(--border-color) pl-2 sm:pl-3 lg:pl-4">
                      {item.sub.map((s) => {
                        const route = subRoutes[s] || "#";
                        const isSubActive = isActiveRoute(route);
                        return (
                          <Link
                            key={s}
                            href={route}
                            onClick={() => {
                              onClose();
                              if (isMobile) {
                                setOpenDropdowns((prev) => ({
                                  ...prev,
                                  [item.title]: false,
                                }));
                              }
                            }}
                            className={`block w-full rounded-lg px-2 sm:px-3 py-0.5 sm:py-1 lg:py-1.5 text-left text-[0.65rem] sm:text-xs lg:text-sm transition-colors ${
                              isSubActive
                                ? "text-(--color-accent-yellow) font-medium"
                                : "text-(--text-secondary) hover:text-(--color-accent-yellow)"
                            }`}
                          >
                            {s}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* More Section */}
          <div className="my-2 sm:my-3 lg:my-4 border-t border-(--border-color)" />
          <p className="px-2 sm:px-3 lg:px-4 pb-1 sm:pb-2 text-[0.6rem] sm:text-[0.65rem] lg:text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-(--text-secondary)/60">
            More
          </p>
          {extraItems.map((item) => {
            const isActive = active === item.title || isActiveRoute(item.href);
            if (item.comingSoon) {
              return (
                <button
                  key={item.title}
                  onClick={() => showComingSoonNotification(item.title)}
                  className={`group flex w-full items-center gap-2 sm:gap-3.5 rounded-xl sm:rounded-2xl px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-2.5 text-[0.8rem] sm:text-[0.9rem] lg:text-[0.95rem] font-medium transition-all duration-200 cursor-not-allowed opacity-70 ${
                    isActive
                      ? "bg-(--bg-secondary) text-(--text-primary) shadow-[2px_2px_0px_var(--border-color)]"
                      : "text-(--text-secondary) hover:bg-(--bg-secondary) hover:text-(--text-primary)"
                  }`}
                >
                  <item.icon
                    className={`h-[0.9rem] w-[0.9rem] sm:h-[1rem] sm:w-[1rem] lg:h-[1.15rem] lg:w-[1.15rem] transition-colors ${isActive ? "text-(--color-accent-yellow)" : "group-hover:text-(--color-accent-yellow)"}`}
                    strokeWidth={1.4}
                  />
                  <span className="flex-1 text-left text-xs sm:text-sm">{item.title}</span>
                  <span className="text-[0.5rem] sm:text-[0.6rem] font-bold uppercase tracking-wider text-(--color-accent-yellow) bg-(--color-accent-yellow)/10 px-1.5 sm:px-2 py-0.5 rounded-full">
                    Coming Soon
                  </span>
                </button>
              );
            }
            return (
              <Link
                key={item.title}
                href={item.href}
                onClick={() => {
                  setActive(item.title);
                  onClose();
                }}
                className={`group flex w-full items-center gap-2 sm:gap-3.5 rounded-xl sm:rounded-2xl px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-2.5 text-[0.8rem] sm:text-[0.9rem] lg:text-[0.95rem] font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-(--bg-secondary) text-(--text-primary) shadow-[2px_2px_0px_var(--border-color)]"
                    : "text-(--text-secondary) hover:bg-(--bg-secondary) hover:text-(--text-primary)"
                }`}
              >
                <item.icon
                  className={`h-[0.9rem] w-[0.9rem] sm:h-[1rem] sm:w-[1rem] lg:h-[1.15rem] lg:w-[1.15rem] transition-colors ${isActive ? "text-(--color-accent-yellow)" : "group-hover:text-(--color-accent-yellow)"}`}
                  strokeWidth={1.4}
                />
                <span className="flex-1 text-left text-xs sm:text-sm">{item.title}</span>
              </Link>
            );
          })}

          {/* Theme Toggle & Admin Links */}
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-(--border-color)">
            <div className="flex items-center justify-between px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2">
              <span className="text-xs sm:text-sm font-medium text-(--text-primary)">
                Theme
              </span>
              <ThemeToggle />
            </div>

            {/* Admin Links - Role based */}
            {userData && (
              <div className="mt-1 sm:mt-2 space-y-0.5">
                {[
                  "super_admin",
                  "finance_admin",
                  "operations_admin",
                  "support_admin",
                  "legal_admin",
                ].includes(userData?.role) && (
                  <Link
                    href="/admin"
                    onClick={onClose}
                    className={`group flex w-full items-center gap-2 sm:gap-3.5 rounded-xl sm:rounded-2xl px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-2.5 text-[0.8rem] sm:text-[0.9rem] lg:text-[0.95rem] font-medium transition-all duration-200 ${
                      isActiveRoute("/admin")
                        ? "bg-(--bg-secondary) text-(--text-primary) shadow-[2px_2px_0px_var(--border-color)]"
                        : "text-(--text-secondary) hover:bg-(--bg-secondary) hover:text-(--text-primary)"
                    }`}
                  >
                    <Settings
                      className={`h-[0.9rem] w-[0.9rem] sm:h-[1rem] sm:w-[1rem] lg:h-[1.15rem] lg:w-[1.15rem] transition-colors ${isActiveRoute("/admin") ? "text-(--color-accent-yellow)" : "group-hover:text-(--color-accent-yellow)"}`}
                      strokeWidth={1.4}
                    />
                    <span className="flex-1 text-left text-xs sm:text-sm">Admin Panel</span>
                  </Link>
                )}
                {["super_admin", "operations_admin", "blog_admin"].includes(
                  userData?.role,
                ) && (
                  <Link
                    href="/blog/admin"
                    onClick={onClose}
                    className={`group flex w-full items-center gap-2 sm:gap-3.5 rounded-xl sm:rounded-2xl px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-2.5 text-[0.8rem] sm:text-[0.9rem] lg:text-[0.95rem] font-medium transition-all duration-200 ${
                      isActiveRoute("/blog/admin")
                        ? "bg-(--bg-secondary) text-(--text-primary) shadow-[2px_2px_0px_var(--border-color)]"
                        : "text-(--text-secondary) hover:bg-(--bg-secondary) hover:text-(--text-primary)"
                    }`}
                  >
                    <Captions
                      className={`h-[0.9rem] w-[0.9rem] sm:h-[1rem] sm:w-[1rem] lg:h-[1.15rem] lg:w-[1.15rem] transition-colors ${isActiveRoute("/blog/admin") ? "text-(--color-accent-yellow)" : "group-hover:text-(--color-accent-yellow)"}`}
                      strokeWidth={1.4}
                    />
                    <span className="flex-1 text-left text-xs sm:text-sm">Blog Admin</span>
                  </Link>
                )}
              </div>
            )}
          </div>
        </nav>
      </aside>
    </>
  );
};

export default DashboardSidebar;