"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import DashboardSidebar from "@/app/components/dashboard-component/DashboardSidebar";
import DashboardHeader from "@/app/components/dashboard-component/DashboardHeader";
import {
  Plus,
  Eye,
  CreditCard,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  MoreHorizontal,
  Pencil,
  ExternalLink,
  QrCode,
  Link2,
  Trash2,
  EyeOff,
  Store,
  Package,
  Coins,
  Users,
  BarChart3,
  Settings,
  HelpCircle,
  RefreshCw,
  Waves,
} from "lucide-react";

export const STORE_LINKS = [
 { label: "Overview", href: "/dashboard/services/payment/dashboard", icon: Store },
  { label: "Products", href: "/store/products", icon: Package },
  { label: "Transactions", href: "/store/transactions", icon: CreditCard },
  { label: "Customers", href: "/store/customers", icon: Users },
  { label: "Analytics", href: "/store/analytics", icon: BarChart3 },
  { label: "Settings", href: "/store/settings", icon: Settings },
] as const;

export function StoreNav({ pathname }: { pathname: string }) {
  return (
    <div className="flex items-center gap-6 overflow-x-auto px-5 py-3 sm:px-8">
      <div className="flex shrink-0 items-center gap-2 pr-4 sm:border-r sm:border-border">
        <Store className="size-4 text-muted-foreground" strokeWidth={2.4} />
        <span className="eyebrow whitespace-nowrap text-muted-foreground">Online Store</span>
      </div>
      <nav className="flex items-center gap-1">
        {STORE_LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "whitespace-nowrap rounded-full px-4 py-2 font-display text-[13px] font-bold uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                active && "bg-foreground text-background hover:bg-foreground hover:text-background",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function ZidwellShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-72 min-h-screen flex flex-col">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
        <StoreNav pathname={pathname || ""} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">{children}</main>
      </div>
    </div>
  );
}
