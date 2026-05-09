"use client";
import DashboardSidebar from "@/app/components/dashboard-component/DashboardSidebar";
import DashboardHeader from "@/app/components/dashboard-component/DashboardHeader";
import TransactionHistory from "@/app/components/transaction-history";
import { Button } from "@/app/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TransactionsPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-(--bg-primary) relative">
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:pl-72 min-h-screen flex flex-col">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto">
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
                  Transaction History
                </h1>
                <p className="text-sm md:text-base text-(--text-secondary)">
                  View and manage all your transactions
                </p>
              </div>
            </div>

            <div className="">
              <TransactionHistory />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
