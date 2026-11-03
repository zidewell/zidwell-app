// app/components/admin-components/layout.tsx
"use client";

import React from "react";
import AdminSideBar from "./AdminSideBar";
import AdminHeader from "./AdminHeader";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen flex bg-(--bg-primary) text-(--text-primary)">
      <AdminSideBar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader />
        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}