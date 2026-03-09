"use client";

import Link from "next/link";
import { FileText, ArrowRight, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import DashboardSidebar from "@/app/components/dashboard-sidebar";
import DashboardHeader from "@/app/components/dashboard-hearder";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import InvoiceGen from "@/app/components/Invoice-components/InvoiceGen";
import { SubscriptionPageGuard } from "@/app/components/subscription-components/SubscriptionGuard"; 
import { useSubscription } from "@/app/hooks/useSubscripion";
import { SubscriptionBadge } from "@/app/components/subscription-components/subscriptionBadges";
import { useUserContextData } from "@/app/context/userData";

export default function InvoicePage() {
  const router = useRouter();
  const { subscription, userTier } = useSubscription();
  const { userData } = useUserContextData();
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      if (!userData?.id) return;
      
      try {
        const res = await fetch("/api/user/usage");
        
        if (res.ok) {
          const data = await res.json();
          setUsage(data);
        }
      } catch (error) {
        console.error("Error fetching usage:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsage();
  }, [userData]);

  const isPremium = userTier === 'premium' || userTier === 'elite';
  const usedInvoices = usage?.invoices?.used || 0;
  const limit = usage?.invoices?.limit || 5;
  const remaining = usage?.invoices?.remaining || 0;
  const hasReachedLimit = !isPremium && remaining <= 0;

  return (
    <SubscriptionPageGuard
      requiredTier="free"
      featureKey="invoices_per_month"
      title="Invoice & Payment System"
      description="Create professional invoices and accept payments seamlessly. Get paid faster with our elegant payment links."
    >
      <div className="min-h-screen bg-background fade-in">
        <DashboardSidebar />

        <div className="lg:ml-64">
          <DashboardHeader />

          <main className="p-6">
            <div className="md:max-w-5xl md:mx-auto">
              {/* Add Subscription Badge at the top */}
              <div className="flex justify-end mb-4">
                <SubscriptionBadge 
                  showIcon={true} 
                  size="md"
                  showTrial={true}
                  featureKey="invoices_per_month"
                />
              </div>

              {/* Usage Stats Bar */}
              {!isPremium && (
                <div className="mb-6 bg-white p-4 rounded-lg border-2 border-gray-200">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700">Monthly Invoice Usage:</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        hasReachedLimit ? 'bg-red-100 text-red-600' : 
                        remaining <= 2 ? 'bg-yellow-100 text-yellow-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                        {usedInvoices}/{limit} used
                      </span>
                    </div>
                    
                    {hasReachedLimit && (
                      <Link href="/pricing?upgrade=growth">
                        <Button size="sm" className="bg-[#C29307] hover:bg-[#b38606] text-white">
                          Upgrade for more invoices
                        </Button>
                      </Link>
                    )}
                  </div>
                  
                  {/* Progress bar for visual feedback */}
                  <div className="w-full mt-3">
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          hasReachedLimit ? 'bg-red-500' :
                          remaining <= 2 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${(usedInvoices / limit) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {remaining} invoice{remaining !== 1 ? 's' : ''} remaining this month
                    </p>
                  </div>
                </div>
              )}

              {/* Premium Badge */}
              {isPremium && (
                <div className="mb-6 p-4 bg-[#C29307]/10 border-2 border-[#C29307] rounded-lg">
                  <p className="text-[#C29307] font-medium flex items-center gap-2">
                    <span className="bg-[#C29307] text-white px-2 py-1 rounded text-xs">PREMIUM</span>
                    You have unlimited invoices! Create as many as you need.
                  </p>
                </div>
              )}

              <div className="flex items-start space-x-4 mb-4">
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
                  <h1 className="md:text-3xl text-xl font-bold mb-2 flex items-center gap-3">
                    Invoice & Payment System{" "}
                    <span className="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded-md">
                      2% fee (max ₦2,000)
                    </span>
                  </h1>
                  <p className="text-muted-foreground">
                    Create professional invoices and accept payments seamlessly.
                    Get paid faster with our elegant payment links.
                  </p>
                </div>
              </div>

              {/* CTA Section */}
              <div className="max-w-4xl mx-auto">
                <Card className="p-8 md:p-12">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="h-12 w-12 rounded-lg bg-[#C29307]/10 flex items-center justify-center mb-4">
                        <FileText className="h-6 w-6 text-[#C29307]" />
                      </div>

                      <h3 className="text-2xl font-bold text-foreground">
                        Create Invoice
                      </h3>
                      <p className="text-muted-foreground">
                        Generate professional invoices with itemized billing,
                        automatic calculations, and instant payment links.
                      </p>

                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-[#C29307] mr-2" />
                          Live preview as you create
                        </li>
                        <li className="flex items-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-[#C29307] mr-2" />
                          Custom business branding
                        </li>
                        <li className="flex items-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-[#C29307] mr-2" />
                          Shareable payment links
                        </li>
                        <li className="flex items-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-[#C29307] mr-2" />
                          PDF download option
                        </li>
                      </ul>

                      <Link href="/dashboard/services/create-invoice/create">
                        <Button
                          className="bg-[#C29307] hover:bg-[#b38606] text-white"
                          size="lg"
                          disabled={!isPremium && hasReachedLimit}
                        >
                          {!isPremium && hasReachedLimit 
                            ? 'Limit Reached' 
                            : 'Create Invoice'}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-muted/50 rounded-lg p-6 border border-border">
                        <h4 className="font-semibold text-foreground mb-3">
                          How it works
                        </h4>

                        <ol className="space-y-3 text-sm text-muted-foreground">
                          {[
                            "Fill in your business details and add invoice items",
                            "Generate invoice and copy the payment link",
                            "Share via WhatsApp or email with your client",
                            "Client pays securely and you get instant notification",
                          ].map((text, i) => (
                            <li key={i} className="flex gap-3">
                              <span className="shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-[#C29307] text-white text-xs font-bold">
                                {i + 1}
                              </span>
                              <span>{text}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      <div className="bg-[#C29307]/10 rounded-lg p-4 border border-[#C29307]/20">
                        <p className="text-sm text-foreground">
                          <span className="font-semibold">Platform fee:</span>{" "}
                          Only 2% per transaction, capped at ₦2,000,
                          transferable to the customer.
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Invoice History */}
              <div className="max-w-4xl mx-auto mt-16">
                <InvoiceGen />
              </div>
            </div>
          </main>
        </div>
      </div>
    </SubscriptionPageGuard>
  );
}