// app/components/admin-components/AdminSideBar.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "▦" },
  { href: "/admin/users", label: "Users", icon: "◉" },
  { href: "/admin/wallets", label: "Wallets", icon: "◫" },
  { href: "/admin/transactions", label: "Transactions", icon: "⇄" },
  { href: "/admin/contracts", label: "Contracts", icon: "✎" },
  { href: "/admin/invoices", label: "Invoices", icon: "▤" },
  { href: "/admin/receipts", label: "Receipts", icon: "▣" },
  { href: "/admin/tax-filings", label: "Tax Filings", icon: "◈" },
  { href: "/admin/online-stores", label: "Online Stores", icon: "🏪" },
  { href: "/admin/kyc", label: "KYC", icon: "✓" },
  { href: "/admin/disputes-supports", label: "Disputes & Support", icon: "⚑" },
  { href: "/admin/notifications", label: "Notifications", icon: "◆" },
  { href: "/admin/funding-logs", label: "Funding Logs", icon: "◎" },
  { href: "/admin/reconciliation", label: "Reconciliation", icon: "⇌" },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: "▤" },
  { href: "/admin/admins", label: "Admins", icon: "★" },
];

export default function AdminSideBar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`hidden md:flex flex-col shrink-0 border-r border-(--border-color) bg-(--bg-primary) transition-all duration-200 ${
        collapsed ? "w-[72px]" : "w-[248px]"
      }`}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-(--border-color)">
        {!collapsed && (
          <span className="font-semibold tracking-tight font-(--font-space-grotesk) text-(--text-primary)">
            Zidwell
          </span>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label="Toggle sidebar"
          className="squircle-sm p-2 text-(--text-secondary) hover:bg-(--bg-secondary) transition-colors"
        >
          {collapsed ? "»" : "«"}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`squircle-md flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-[--color-accent-yellow]/15 text-(--text-primary) font-medium"
                  : "text-(--text-secondary) hover:bg-(--bg-secondary) hover:text-(--text-primary)"
              }`}
            >
              <span className="w-5 text-center shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
