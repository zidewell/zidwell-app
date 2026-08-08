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
  Radio,
  Youtube,
  PenLine,
  Eye,
  EyeOff,
  Sun,
  Moon,
} from "lucide-react";
import Image from "next/image";
import { useUserContextData } from "@/app/context/userData";
import { useTheme } from "../ThemeProvider";

const formatNumber = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const navItems = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard", sub: ["Overview", "Today's Money", "Future Money"] },
  { title: "Payments", icon: ArrowLeftRight, href: "/dashboard/fund-account", sub: ["Send Money", "Add Money", "Beneficiaries", "Cards"] },
  { title: "Bookkeeping", icon: BookOpen, href: "/dashboard/services/bookkeeping", sub: ["Journal", "Income", "Expenses"] },
  { title: "Invoicing", icon: FileText, href: "/dashboard/services/create-invoice", sub: ["Invoices", "Receipts", "Bills"] },
  { title: "Contracts", icon: FileSignature, href: "/dashboard/services/contract", sub: ["Active", "Templates", "Archive"] },
  { 
    title: "Reports", 
    icon: BarChart3, 
    href: "#", 
    sub: ["Profit & Loss", "Cash Flow", "Tax"],
    comingSoon: true 
  },
  { title: "Settings", icon: Settings, href: "/dashboard/settings", sub: ["Profile", "Team", "Security"] },
];

const extraItems = [
  { title: "Work Radio", icon: Radio, href: "#", comingSoon: true },
  { title: "YouTube", icon: Youtube, href: "#", comingSoon: true },
  { title: "Blog", icon: PenLine, href: "/blog" },
];

interface DashboardSidebarProps {
  open: boolean;
  onClose: () => void;
}

const DashboardSidebar = ({ open, onClose }: DashboardSidebarProps) => {
  const [showBalance, setShowBalance] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const pathname = usePathname();
  const { userData, balance } = useUserContextData();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (open) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [open]);

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

  const showComingSoonNotification = (title: string) => {
    // Close sidebar first
    onClose();
    
    const notification = document.createElement("div");
    notification.className =
      "fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-(--color-accent-yellow) text-(--color-ink) px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 text-sm font-semibold";
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
    const content = (
      <>
        <item.icon
          className={`h-[1.15rem] w-[1.15rem] transition-colors ${isActive ? "text-(--color-accent-yellow)" : "group-hover:text-(--color-accent-yellow)"}`}
          strokeWidth={1.4}
        />
        <span className="flex-1 text-left">{item.title}</span>
        {item.comingSoon && (
          <span className="text-[0.6rem] font-bold uppercase tracking-wider text-(--color-accent-yellow) bg-(--color-accent-yellow)/10 px-2 py-0.5 rounded-full">
            Coming Soon
          </span>
        )}
        {item.sub && (
          <ChevronRight
            className={`h-4 w-4 opacity-40 transition-transform duration-200 ${hovered === item.title ? "rotate-90" : ""}`}
            strokeWidth={1.4}
          />
        )}
      </>
    );

    const className = `group flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-[0.95rem] font-medium transition-all duration-200 ${
      isActive
        ? "bg-(--bg-secondary) text-(--text-primary) shadow-[2px_2px_0px_var(--border-color)]"
        : "text-(--text-secondary) hover:bg-(--bg-secondary) hover:text-(--text-primary)"
    }`;

    // If it's a "coming soon" item or has href="#", render as button with tooltip
    if (item.comingSoon || item.href === "#") {
      return (
        <button
          onClick={(e) => {
            e.preventDefault();
            showComingSoonNotification(item.title);
          }}
          className={`${className} cursor-not-allowed opacity-70`}
        >
          {content}
        </button>
      );
    }

    return (
      <Link href={item.href} onClick={() => onClose()} className={className}>
        {content}
      </Link>
    );
  };

  const ThemeToggle = () => (
    <div className="flex items-center gap-2 p-1 bg-(--bg-secondary) rounded-xl">
      <button
        onClick={() => setTheme("light")}
        className={`p-2 rounded-lg transition-all ${
          theme === "light"
            ? "bg-(--color-accent-yellow) text-(--color-ink)"
            : "text-(--text-secondary) hover:bg-(--bg-secondary)"
        }`}
        aria-label="Light mode"
      >
        <Sun size={18} />
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`p-2 rounded-lg transition-all ${
          theme === "dark"
            ? "bg-(--color-accent-yellow) text-(--color-ink)"
            : "text-(--text-secondary) hover:bg-(--bg-secondary)"
        }`}
        aria-label="Dark mode"
      >
        <Moon size={18} />
      </button>
    </div>
  );

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-(--color-ink)/20 backdrop-blur-sm lg:hidden"
          onClick={() => onClose()}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 flex h-full w-72 flex-col bg-(--bg-primary) border-r-2 border-(--border-color) transition-transform duration-300 ease-out lg:sticky lg:h-screen lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-24 items-center justify-between px-8 border-b-2 border-(--border-color)">
          <Link href="/dashboard" className="flex items-center gap-3" onClick={() => onClose()}>
            <Image
              src="/logo.png"
              alt="Zidwell Logo"
              width={36}
              height={36}
              className="w-9 h-9 object-contain"
            />
            <span className="text-xl font-extrabold tracking-tight text-(--text-primary)">
              Zidwell
            </span>
          </Link>
          <button
            onClick={() => onClose()}
            className="text-(--text-secondary) hover:text-(--text-primary) lg:hidden"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        {userData && userData.fullName && (
          <div className="p-5 border-b-2 border-(--border-color)">
            <div className="space-y-2">
              <p className="text-(--text-secondary) text-sm">
                Welcome Back, {userData.fullName}
              </p>
              {balance != null && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-(--text-secondary) text-xs">
                      Wallet Balance
                    </p>
                    <div className="flex items-center gap-1">
                      <span className="text-(--text-primary) text-sm font-bold">
                        ₦{formatBalance()}
                      </span>
                      <button
                        onClick={() => setShowBalance(!showBalance)}
                        className="p-1 hover:bg-(--bg-secondary) rounded-md transition-colors duration-200"
                        aria-label={showBalance ? "Hide balance" : "Show balance"}
                      >
                        {showBalance ? (
                          <Eye className="w-4 h-4 text-(--text-secondary)" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-(--text-secondary)" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 pb-8 pt-4">
          {navItems.map((item) => {
            const isActive = isActiveRoute(item.href);
            const isOpen = hovered === item.title;
            return (
              <div
                key={item.title}
                onMouseEnter={() => setHovered(item.title)}
                onMouseLeave={() => setHovered(null)}
              >
                <NavItem item={item} isActive={isActive} />

                {item.sub && (
                  <div
                    className={`grid transition-all duration-300 ease-out ${
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className={`ml-[2.1rem] mt-1 space-y-0.5 border-l pl-4 ${
                        item.comingSoon 
                          ? "border-(--border-color)/30 opacity-50" 
                          : "border-(--border-color)"
                      }`}>
                        {item.sub.map((s: string) => (
                          item.comingSoon ? (
                            <div
                              key={s}
                              className="block w-full rounded-lg px-3 py-1.5 text-left text-sm text-(--text-secondary) cursor-not-allowed"
                            >
                              {s}
                            </div>
                          ) : (
                            <button
                              key={s}
                              className="block w-full rounded-lg px-3 py-1.5 text-left text-sm text-(--text-secondary) transition-colors hover:text-(--color-accent-yellow)"
                              onClick={() => onClose()}
                            >
                              {s}
                            </button>
                          )
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div className="my-4 border-t border-(--border-color)" />
          <p className="px-4 pb-2 text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-(--text-secondary)/60">
            More
          </p>
          {extraItems.map((item) => {
            const isActive = isActiveRoute(item.href);
            
            if (item.comingSoon || item.href === "#") {
              return (
                <button
                  key={item.title}
                  onClick={(e) => {
                    e.preventDefault();
                    showComingSoonNotification(item.title);
                  }}
                  className={`group flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-[0.95rem] font-medium transition-all duration-200 cursor-not-allowed opacity-70 ${
                    isActive
                      ? "bg-(--bg-secondary) text-(--text-primary) shadow-[2px_2px_0px_var(--border-color)]"
                      : "text-(--text-secondary) hover:bg-(--bg-secondary) hover:text-(--text-primary)"
                  }`}
                >
                  <item.icon
                    className={`h-[1.15rem] w-[1.15rem] transition-colors ${isActive ? "text-(--color-accent-yellow)" : "group-hover:text-(--color-accent-yellow)"}`}
                    strokeWidth={1.4}
                  />
                  <span className="flex-1 text-left">{item.title}</span>
                  <span className="text-[0.6rem] font-bold uppercase tracking-wider text-(--color-accent-yellow) bg-(--color-accent-yellow)/10 px-2 py-0.5 rounded-full">
                    Coming Soon
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={item.title}
                href={item.href}
                onClick={() => onClose()}
                className={`group flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-[0.95rem] font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-(--bg-secondary) text-(--text-primary) shadow-[2px_2px_0px_var(--border-color)]"
                    : "text-(--text-secondary) hover:bg-(--bg-secondary) hover:text-(--text-primary)"
                }`}
              >
                <item.icon
                  className={`h-[1.15rem] w-[1.15rem] transition-colors ${isActive ? "text-(--color-accent-yellow)" : "group-hover:text-(--color-accent-yellow)"}`}
                  strokeWidth={1.4}
                />
                <span className="flex-1 text-left">{item.title}</span>
              </Link>
            );
          })}

          <div className="mt-4 pt-4 border-t border-(--border-color)">
            <div className="flex items-center justify-between px-4 py-2">
              <span className="text-sm font-medium text-(--text-primary)">
                Theme
              </span>
              <ThemeToggle />
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default DashboardSidebar;