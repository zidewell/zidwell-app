// app/components/zidwell-shell.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Store,
  Package,
  Wallet,
  CreditCard,
  Users,
  BarChart3,
  BookOpen,
  Settings,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import DashboardSidebar from "@/app/components/dashboard-component/DashboardSidebar";
import DashboardHeader from "@/app/components/dashboard-component/DashboardHeader";

export const STORE_LINKS = [
  {
    label: "Overview",
    href: "/dashboard/payment/dashboard",
    icon: Store,
  },
  {
    label: "Products",
    href: "/dashboard/services/payment/store/products",
    icon: Package,
  },
  {
    label: "Store Wallet",
    href: "/dashboard/services/payment/store/wallet",
    icon: Wallet,
  },
  {
    label: "Transactions",
    href: "/dashboard/services/payment/store/transactions",
    icon: CreditCard,
  },
  {
    label: "Customers",
    href: "/dashboard/services/payment/store/customers",
    icon: Users,
  },
  {
    label: "Analytics",
    href: "/dashboard/services/payment/store/analytics",
    icon: BarChart3,
  },
  {
    label: "Bookkeeping",
    href: "/dashboard/services/payment/store/bookkeeping",
    icon: BookOpen,
  },
  { label: "Settings", href: "#", icon: Settings },
] as const;

export function StoreNav({ pathname }: { pathname: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);

  // Auto-scroll the active link into view on mount and when it changes.
  useEffect(() => {
    const scroller = scrollRef.current;
    const active = activeRef.current;
    if (!scroller || !active) return;

    const scrollerRect = scroller.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();

    // Off-screen to the right?
    if (activeRect.right > scrollerRect.right) {
      scroller.scrollBy({
        left: activeRect.right - scrollerRect.right + 24,
        behavior: "smooth",
      });
    }
    // Off-screen to the left?
    else if (activeRect.left < scrollerRect.left) {
      scroller.scrollBy({
        left: activeRect.left - scrollerRect.left - 24,
        behavior: "smooth",
      });
    }
  }, [pathname]);

  return (
    <div className="sticky top-16 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center px-5 sm:px-8">
        {/* Fixed label */}
        <div className="flex shrink-0 items-center gap-2 border-r border-border pr-4">
          <Store
            className="size-4 text-muted-foreground"
            strokeWidth={2.4}
          />
          <span className="eyebrow whitespace-nowrap text-muted-foreground">
            Online Store
          </span>
        </div>

        {/* Scroll region: the div carries the fade on both edges,
            the inner div does the actual scrolling. */}
        <div className="relative min-w-0 flex-1">
          <div
            ref={scrollRef}
            className="nav-scroll flex items-center gap-1 overflow-x-auto px-3"
            role="tablist"
            aria-label="Store sections"
          >
            {STORE_LINKS.map((link) => {
              const active =
                pathname === link.href ||
                pathname?.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  ref={active ? activeRef : undefined}
                  href={link.href}
                  role="tab"
                  aria-selected={active}
                  className={cn(
                    "flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 font-display text-[13px] font-bold uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                    active &&
                      "bg-foreground text-background hover:bg-foreground hover:text-background"
                  )}
                >
                  <link.icon className="size-4 shrink-0" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Fade edges — always visible while the row can scroll.
              `pointer-events-none` so clicks pass through to the links. */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-background to-transparent" />
        </div>

        {/* Fixed help button */}
        <div className="flex shrink-0 items-center pl-4">
          <button
            type="button"
            aria-label="Help"
            className="rounded-full p-2 transition-colors hover:bg-muted"
          >
            <HelpCircle className="size-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Scrollbar styles: hidden but scrollable. */}
      <style>{`
        .nav-scroll {
          scrollbar-width: none;              /* Firefox */
          -ms-overflow-style: none;           /* legacy Edge/IE */
          scroll-behavior: smooth;
          overscroll-behavior-x: contain;
          -webkit-overflow-scrolling: touch;
        }
        .nav-scroll::-webkit-scrollbar {
          display: none;                      /* Chrome, Safari, Edge */
        }
        @media (prefers-reduced-motion: reduce) {
          .nav-scroll {
            scroll-behavior: auto;
          }
        }
      `}</style>
    </div>
  );
}

export function ZidwellShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="lg:pl-72 min-h-screen flex flex-col">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
        <StoreNav pathname={pathname || ""} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}