"use client";
import DashboardSidebar from "@/app/components/dashboard-component/DashboardSidebar";
import DashboardHeader from "@/app/components/dashboard-component/DashboardHeader";
import FundAccountMethods from "@/app/components/FundAccount";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function FundAccountPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-(--bg-primary) fade-in relative">
      {/* Sidebar - handles mobile and desktop */}
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content - adjusted for sidebar */}
      <div className="lg:pl-72 min-h-screen flex flex-col">
        {/* Header with menu button */}
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />

        {/* Main content area */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            {/* Header with back button */}
            <div className="flex items-start gap-4 mb-6 md:mb-8">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="text-(--color-accent-yellow) hover:bg-(--bg-secondary) p-2 md:p-2.5 rounded-md border-2 border-transparent hover:border-(--border-color) transition-all"
              >
                <ArrowLeft className="w-5 h-5 md:mr-2" />
                <span className="hidden md:inline text-sm font-medium">
                  Back
                </span>
              </Button>

              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-(--text-primary) mb-2">
                  Fund Account
                </h1>
                <p className="text-sm md:text-base text-(--text-secondary)">
                  Add money to your Zidwell Wallet instantly and securely
                </p>
              </div>
            </div>

            {/* Fund account methods */}
            <div className="mt-4 md:mt-6">
              <FundAccountMethods />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
