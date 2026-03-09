"use client";
import DashboardHeader from "@/app/components/dashboard-hearder";
import DashboardSidebar from "@/app/components/dashboard-sidebar";
import TaxCalculator from "@/app/components/tax-filling-components/TaxCalculator";
import { Button } from "@/app/components/ui/button";
import { SubscriptionPageGuard } from "@/app/components/subscription-components/SubscriptionGuard"; 
import { useSubscription } from "@/app/hooks/useSubscripion"; 
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import Link from "next/link";

function TaxFilingPage() {
  const router = useRouter();
  const { subscription } = useSubscription();

  return (
    <SubscriptionPageGuard
      requiredTier="premium"
      featureKey="tax_support"
      title="Tax Manager Services"
      description="Professional tax filing, calculations, and compliance tools for your business"
    >
      <div className="min-h-screen bg-gray-50 fade-in">
        <DashboardSidebar />

        <div className="lg:ml-64">
          <DashboardHeader />

          <main className="md:max-w-5xl md:mx-auto md:p-6">
            {/* Elite Banner */}
            {subscription?.tier === 'elite' && (
              <div className="mb-6 p-4 bg-purple-100 border-2 border-purple-600 rounded-lg">
                <p className="text-purple-800 font-medium flex items-center gap-2">
                  <span className="bg-purple-600 text-white px-2 py-1 rounded text-xs">ELITE</span>
                  You have access to full tax filing including VAT, PAYE, and WHT!
                </p>
              </div>
            )}

            <div className="mb-6 md:p-0 p-6">
              <div className="flex items-start space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="text-[#C29307] hover:bg-white/10 text-sm md:text-base"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  <span className="hidden md:block">Back</span>
                </Button>

                <div className="">
                  <h1 className="md:text-3xl text-xl font-bold mb-2">
                    Tax Manager Services
                  </h1>
                  <p className="text-muted-foreground">
                    Choose your filing option based on your tax history with us
                  </p>
                </div>
              </div>
            </div>

            {/* Tax Calculator - Available to Growth and above */}
            <TaxCalculator userTier={subscription?.tier} />

            {/* Premium Features */}
            {subscription?.tier === 'premium' && (
              <div className="mt-8 grid md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                  <h3 className="font-bold text-lg mb-3">Tax Filing Support</h3>
                  <p className="text-gray-600 mb-4">Get help filing your taxes with our experts</p>
                  <Link href="/dashboard/services/tax-filing/support">
                    <Button className="bg-[#C29307] hover:bg-[#b38606] text-white w-full">
                      Start Filing
                    </Button>
                  </Link>
                </div>
                <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                  <h3 className="font-bold text-lg mb-3">Financial Statements</h3>
                  <p className="text-gray-600 mb-4">Generate P&L, Balance Sheet, and Cash Flow</p>
                  <Link href="/dashboard/services/financial-statements">
                    <Button className="bg-[#C29307] hover:bg-[#b38606] text-white w-full">
                      View Statements
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Elite Features */}
            {subscription?.tier === 'elite' && (
              <div className="mt-8 grid md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg border-2 border-purple-200">
                  <h3 className="font-bold text-lg mb-3">VAT Filing</h3>
                  <p className="text-gray-600 mb-4">File your VAT returns</p>
                  <Link href="/dashboard/services/tax-filing/vat">
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white w-full">
                      File VAT
                    </Button>
                  </Link>
                </div>
                <div className="bg-white p-6 rounded-lg border-2 border-purple-200">
                  <h3 className="font-bold text-lg mb-3">PAYE Filing</h3>
                  <p className="text-gray-600 mb-4">File employee taxes</p>
                  <Link href="/dashboard/services/tax-filing/paye">
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white w-full">
                      File PAYE
                    </Button>
                  </Link>
                </div>
                <div className="bg-white p-6 rounded-lg border-2 border-purple-200">
                  <h3 className="font-bold text-lg mb-3">WHT Filing</h3>
                  <p className="text-gray-600 mb-4">Withholding tax filing</p>
                  <Link href="/dashboard/services/tax-filing/wht">
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white w-full">
                      File WHT
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </SubscriptionPageGuard>
  );
}

export default TaxFilingPage;