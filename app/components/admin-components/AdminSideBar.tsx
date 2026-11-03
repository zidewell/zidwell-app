// app/components/admin-components/AdminSideBar.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import fetcher from "@/app/lib/fetcher";
import {
  LayoutDashboard,
  Users,
  ChartLine,
  UserCheck,
  Wallet,
  ArrowLeftRight,
  FileSignature,
  FileText,
  Receipt,
  FileSpreadsheet,
  ShieldCheck,
  TrendingUp,
  ClipboardList,
  ShieldAlert,
  MessageSquare,   // for future Disputes
  Bell,            // for future Notifications
  RefreshCw,       // for future Reconciliation
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin",                     label: "Dashboard",          icon: LayoutDashboard },
  { href: "/admin/users",               label: "Users",              icon: Users },
  { href: "/admin/analytics/users",     label: "Users Analytics",    icon: ChartLine },
  { href: "/admin/subscribers",         label: "Subscribers",        icon: UserCheck },
  { href: "/admin/wallets",             label: "Wallets",            icon: Wallet },
  { href: "/admin/transactions",        label: "Transactions",       icon: ArrowLeftRight },
  { href: "/admin/contracts",           label: "Contracts",          icon: FileSignature },
  { href: "/admin/invoices",            label: "Invoices",           icon: FileText },
  { href: "/admin/receipts",            label: "Receipts",           icon: Receipt },
  { href: "/admin/tax-filings",         label: "Tax Filings",        icon: FileSpreadsheet },
  { href: "/admin/kyc",                 label: "KYC",                icon: ShieldCheck },

  // ❌ Temporarily disabled — uncomment to re-enable
  // { href: "/admin/disputes-supports", label: "Disputes & Support", icon: MessageSquare },
  // { href: "/admin/notifications",     label: "Notifications",      icon: Bell },

  { href: "/admin/funding-logs",        label: "Funding Logs",       icon: TrendingUp },

  // ❌ Temporarily disabled — uncomment to re-enable
  // { href: "/admin/reconciliation",    label: "Reconciliation",     icon: RefreshCw },

  { href: "/admin/audit-logs",          label: "Audit Logs",         icon: ClipboardList },
  { href: "/admin/admins",              label: "Admins",             icon: ShieldAlert },
];

// Convert role to display label
function formatRole(role: string | null | undefined): string {
  if (!role) return "Admin";
  return role
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Get initials from a name
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "A";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function AdminSideBar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Fetch admin user info
  const { data: userData } = useSWR("/api/user/me", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 5 * 60 * 1000,
  });

  const adminUser =
    userData?.user ?? userData?.data?.user ?? userData?.data ?? userData ?? null;

  const adminName =
    adminUser?.full_name ||
    (adminUser?.first_name && adminUser?.last_name
      ? `${adminUser.first_name} ${adminUser.last_name}`
      : null) ||
    adminUser?.first_name ||
    adminUser?.email?.split("@")[0] ||
    "Admin";

  const adminRole = adminUser?.admin_role ?? adminUser?.role ?? "admin";
  const adminInitials = getInitials(String(adminName));

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <aside
      className={`hidden md:flex flex-col shrink-0 transition-all duration-200 ${
        collapsed ? "w-[72px]" : "w-[248px]"
      }`}
      style={{
        background: "linear-gradient(180deg, #0a0a0a 0%, #111111 100%)",
        borderRight: "1px solid rgba(253, 192, 32, 0.12)",
        fontFamily:
          "var(--font-inter), var(--font-geist-sans), Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
      }}
    >
      {/* ── Brand ───────────────────────────────── */}
      <div
        className="h-16 flex items-center justify-between px-4 shrink-0"
        style={{ borderBottom: "1px solid rgba(253, 192, 32, 0.12)" }}
      >
        {!collapsed && (
          <Link href="/admin" className="flex items-center gap-2.5 min-w-0">
            <span
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: "linear-gradient(135deg, #FDC020 0%, #a87e06 100%)",
                color: "#0a0a0a",
                fontSize: "14px",
                fontWeight: 700,
                letterSpacing: "-0.02em",
              }}
            >
              Z
            </span>
            <span
              className="truncate"
              style={{
                color: "#f5f5f5",
                fontSize: "15px",
                fontWeight: 600,
                letterSpacing: "-0.01em",
              }}
            >
              Zidwell
            </span>
          </Link>
        )}
        {collapsed && (
          <span
            className="w-7 h-7 rounded-lg flex items-center justify-center mx-auto"
            style={{
              background: "linear-gradient(135deg, #FDC020 0%, #a87e06 100%)",
              color: "#0a0a0a",
              fontSize: "14px",
              fontWeight: 700,
            }}
          >
            Z
          </span>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label="Toggle sidebar"
          className="p-1.5 rounded-md transition-colors shrink-0"
          style={{ color: "rgba(245, 245, 245, 0.5)", fontSize: "14px" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(253, 192, 32, 0.1)";
            e.currentTarget.style.color = "#FDC020";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "rgba(245, 245, 245, 0.5)";
          }}
        >
          {collapsed ? "»" : "«"}
        </button>
      </div>

      {/* ── Navigation ──────────────────────────── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              aria-current={active ? "page" : undefined}
              className={`group relative flex items-center gap-3 rounded-lg transition-all duration-150 ${
                collapsed ? "justify-center px-3 py-2.5" : "px-3 py-2.5"
              }`}
              style={{
                color: active ? "#0a0a0a" : "rgba(245, 245, 245, 0.7)",
                background: active
                  ? "linear-gradient(90deg, #FDC020 0%, #e6a800 100%)"
                  : "transparent",
                fontSize: "13.5px",
                fontWeight: active ? 600 : 450,
                letterSpacing: "-0.005em",
                boxShadow: active
                  ? "0 2px 8px rgba(253, 192, 32, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                  : "none",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background =
                    "rgba(255, 255, 255, 0.05)";
                  e.currentTarget.style.color = "#f5f5f5";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "rgba(245, 245, 245, 0.7)";
                }
              }}
            >
              {/* Active indicator — left bar */}
              {active && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full"
                  style={{
                    background: "#0a0a0a",
                    boxShadow: "0 0 8px rgba(10, 10, 10, 0.5)",
                  }}
                />
              )}

              {/* Icon */}
              <Icon
                size={18}
                strokeWidth={active ? 2.25 : 2}
                className={`shrink-0 transition-transform duration-150 ${
                  active ? "scale-110" : "group-hover:scale-110"
                }`}
              />

              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}

              {/* Active dot on right (only when not collapsed) */}
              {active && !collapsed && (
                <span
                  className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                  style={{
                    background: "#0a0a0a",
                    boxShadow: "0 0 4px rgba(10, 10, 10, 0.5)",
                  }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Footer — Admin Name ──────────────────── */}
      <div
        className="p-3 shrink-0"
        style={{ borderTop: "1px solid rgba(253, 192, 32, 0.12)" }}
      >
        {!collapsed ? (
          <div
            className="flex items-center gap-2.5 px-2 py-2 rounded-lg"
            style={{ background: "rgba(255, 255, 255, 0.03)" }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: "linear-gradient(135deg, #FDC020 0%, #a87e06 100%)",
                color: "#0a0a0a",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "-0.02em",
              }}
              title={String(adminName)}
            >
              {adminInitials}
            </div>
            <div className="min-w-0 flex-1">
              <div
                className="truncate"
                style={{
                  color: "#f5f5f5",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  letterSpacing: "-0.005em",
                }}
                title={String(adminName)}
              >
                {adminName}
              </div>
              <div
                className="truncate capitalize"
                style={{
                  color: "rgba(245, 245, 245, 0.5)",
                  fontSize: "10.5px",
                  fontWeight: 400,
                  letterSpacing: "0.02em",
                }}
                title={formatRole(String(adminRole))}
              >
                {formatRole(String(adminRole))}
              </div>
            </div>
          </div>
        ) : (
          <div
            className="w-9 h-9 mx-auto rounded-full flex items-center justify-center cursor-pointer"
            style={{
              background: "linear-gradient(135deg, #FDC020 0%, #a87e06 100%)",
              color: "#0a0a0a",
              fontSize: "12px",
              fontWeight: 700,
            }}
            title={`${adminName} — ${formatRole(String(adminRole))}`}
          >
            {adminInitials}
          </div>
        )}
      </div>
    </aside>
  );
}