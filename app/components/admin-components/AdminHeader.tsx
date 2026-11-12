// app/components/admin-components/AdminHeader.tsx
"use client";

import React, { useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import useSWR from "swr";
import Swal from "sweetalert2";
import fetcher from "@/app/lib/fetcher";

interface AdminProfile {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  admin_role?: string | null;
  role_display?: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  operations_admin: "Operations Admin",
  finance_admin: "Finance Admin",
  support_admin: "Support Admin",
  legal_admin: "Legal Admin",
  blog_admin: "Blog Admin",
};

function resolveDisplayName(p?: AdminProfile | null): string {
  if (!p) return "Admin";
  const full = (p.full_name ?? "").trim();
  if (full) return full;
  const combined = [p.first_name, p.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (combined) return combined;
  if (p.email && p.email.includes("@")) {
    const local = p.email.split("@")[0];
    return local.charAt(0).toUpperCase() + local.slice(1);
  }
  return "Admin";
}

export default function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const logoutInProgress = useRef(false);

  const segment = pathname.split("/").filter(Boolean).pop() ?? "Dashboard";
  const title = segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  // ✅ No generic on useSWR — let TS infer from fetcher
  // ✅ Explicit cast on the fetcher result keeps types strict downstream
  const { data: me } = useSWR("/api/user/me", fetcher) as {
    data: AdminProfile | undefined;
  };

  const displayName = resolveDisplayName(me);
  const roleLabel =
    me?.role_display ??
    (me?.admin_role ? ROLE_LABELS[me.admin_role] ?? me.admin_role : "Admin");

  const handleLogout = async () => {
    if (logoutInProgress.current || isLoggingOut) return;

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You will be logged out of the admin panel",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#FDC020",
      cancelButtonColor: "#6b6b6b",
      confirmButtonText: "Yes, logout",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    logoutInProgress.current = true;
    setIsLoggingOut(true);

    Swal.fire({
      title: "Logging out...",
      text: "Please wait",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      await fetch("/api/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      Swal.close();
      logoutInProgress.current = false;
      setIsLoggingOut(false);

      Swal.fire({
        icon: "success",
        title: "Logged Out!",
        text: "You have been successfully logged out",
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
        timerProgressBar: true,
      }).then(() => {
        router.replace("/auth/login");
      });
    } catch (error) {
      console.error("Logout error:", error);
      Swal.close();
      logoutInProgress.current = false;
      setIsLoggingOut(false);

      await Swal.fire({
        icon: "error",
        title: "Logout Failed",
        text: "Please try again",
        confirmButtonColor: "#FDC020",
      });
    }
  };

  return (
    <header className="h-16 shrink-0 flex items-center justify-between px-4 sm:px-6 border-b border-(--border-color) bg-(--bg-primary) gap-3">
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-semibold uppercase tracking-widest text-(--text-secondary)">
          Admin
        </span>
        <h1 className="text-base sm:text-lg font-semibold font-(--font-space-grotesk) text-(--text-primary) leading-tight truncate">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden sm:flex flex-col items-end min-w-0">
          <span className="text-sm font-medium text-(--text-primary) truncate max-w-[180px]">
            {displayName}
          </span>
          <span className="text-xs text-(--text-secondary) truncate max-w-[180px]">
            {roleLabel}
          </span>
        </div>

        <div className="w-9 h-9 squircle-sm bg-[--color-accent-yellow] text-(--color-ink) flex items-center justify-center font-semibold shrink-0">
          {displayName.charAt(0).toUpperCase()}
        </div>

        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="squircle-md flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-destructive text-white hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Logout"
        >
          <span className="hidden sm:inline">
            {isLoggingOut ? "Logging out..." : "Logout"}
          </span>
          <span className="sm:hidden">⎋</span>
        </button>
      </div>
    </header>
  );
}