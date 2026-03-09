// app/dashboard/services/create-invoice/create/page.tsx
"use client";

import DashboardSidebar from "@/app/components/dashboard-sidebar";
import DashboardHeader from "@/app/components/dashboard-hearder";
import CreateInvoice from "@/app/components/Invoice-components/CreateInvoice";

export default function CreateInvoicePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar />
      <div className="lg:ml-64">
        <DashboardHeader />
        <main className="p-6">
          <div className="max-w-6xl mx-auto">
            <CreateInvoice />
          </div>
        </main>
      </div>
    </div>
  );
}