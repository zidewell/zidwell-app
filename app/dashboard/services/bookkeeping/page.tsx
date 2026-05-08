"use client";

import { useState } from "react";
import DashboardHeader from "@/app/components/dashboard-component/DashboardHeader";
import DashboardSidebar from "@/app/components/dashboard-component/DashboardSidebar";
import { JournalDashboard } from "@/app/components/journal/JournalDashboard";
import { JournalProvider } from "@/app/context/JournalContext";

function BookkeepingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <JournalProvider>
      <div className="min-h-screen bg-[#f7f7f7] dark:bg-[#0e0e0e]">
        <DashboardSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="lg:pl-72 min-h-screen flex flex-col">
          <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
              <JournalDashboard />
            </div>
          </main>
        </div>
      </div>
    </JournalProvider>
  );
}

export default BookkeepingPage;