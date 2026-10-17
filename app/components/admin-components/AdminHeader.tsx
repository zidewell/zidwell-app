// app/components/admin-components/AdminHeader.tsx
"use client";

import React from "react";
import { usePathname } from "next/navigation";

export default function AdminHeader() {
  const pathname = usePathname();
  const segment = pathname.split("/").filter(Boolean).pop() ?? "Dashboard";
  const title = segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <header className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-(--border-color) bg-(--bg-primary)">
      <div className="flex flex-col">
        <span className="text-xs font-semibold uppercase tracking-widest text-(--text-secondary)">
          Admin
        </span>
        <h1 className="text-lg font-semibold font-(--font-space-grotesk) text-(--text-primary) leading-tight">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-sm font-medium text-(--text-primary)">
            Admin
          </span>
          <span className="text-xs text-(--text-secondary)">
            Zidwell Internal
          </span>
        </div>
        <div className="w-9 h-9 squircle-sm bg-[--color-accent-yellow] text-(--color-ink) flex items-center justify-center font-semibold">
          A
        </div>
      </div>
    </header>
  );
}
