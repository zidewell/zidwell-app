import DashboardHeader from "@/app/components/dashboard-hearder";
import DashboardSidebar from "@/app/components/dashboard-sidebar";
import { JournalDashboard } from "@/app/components/journal/JournalDashboard";
import { JournalProvider } from "@/app/context/JournalContext";
import React from "react";

function page() {
  return (
    <JournalProvider>
      <div className="min-h-screen bg-gray-50">
        <DashboardSidebar />

        <div className="lg:ml-64">
          <DashboardHeader />

          <main className="p-6">
            <div className="max-w-6xl mx-auto">
              <JournalDashboard />
            </div>
          </main>
        </div>
      </div>
    </JournalProvider>
  );
}

export default page;
