"use client";

import DashboardHeader from "@/app/components/dashboard-component/DashboardHeader";
import DashboardSidebar from "@/app/components/dashboard-component/DashboardSidebar";
import CreateReceipt from "@/app/components/Receipt-component/CreateReciept";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useRouter } from "next/navigation";

export default function CreateReceiptPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f7f7f7] dark:bg-[#0e0e0e] fade-in relative">
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:pl-72 min-h-screen flex flex-col">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto">
            {/* Back button and header */}
            <div className="flex items-start gap-4 mb-6 md:mb-8">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="text-(--color-accent-yellow) hover:text-[#1e5d42] hover:bg-[#f0efe7] dark:hover:bg-[#242424] p-2 md:p-2.5 rounded-md border-2 border-transparent hover:border-[#242424] dark:hover:border-[#474747] transition-all"
              >
                <ArrowLeft className="w-5 h-5 md:mr-2" />
                <span className="hidden md:inline text-sm font-medium">
                  Back
                </span>
              </Button>

              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#141414] dark:text-[#f5f5f5] mb-2">
                  Create Receipt
                </h1>
                <p className="text-sm md:text-base text-[#6b6b6b] dark:text-[#a6a6a6]">
                  Create and manage professional receipts for your business
                  transactions
                </p>
              </div>
            </div>

            {/* Receipt Form */}
            <CreateReceipt />
          </div>
        </main>
      </div>
    </div>
  );
}
