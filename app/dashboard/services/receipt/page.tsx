"use client";
import DashboardHeader from "@/app/components/dashboard-hearder";
import DashboardSidebar from "@/app/components/dashboard-sidebar";
import ReceiptCta from "@/app/components/Receipt-component/ReceiptCta";
import ReceiptFeature from "@/app/components/Receipt-component/ReceiptFeature";
import ReceiptFooter from "@/app/components/Receipt-component/ReceiptFooter";
import ReceiptGen from "@/app/components/Receipt-component/ReceiptGen";
import ReceiptHero from "@/app/components/Receipt-component/ReceiptHero";
import ReceiptHowItsWork from "@/app/components/Receipt-component/ReceiptHowItsWork";
import { Button } from "@/app/components/ui/button";
import { useUserContextData } from "@/app/context/userData";
import { SubscriptionPageGuard } from "@/app/components/subscription-components/SubscriptionGuard"; 
import { useSubscription } from "@/app/hooks/useSubscripion"; 
import { ArrowLeft, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import Link from "next/link";

const RECEIPT_FEE = 100; // ₦100 per receipt after limit

export default function ReceiptPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [receipts, setReceipts] = useState<any[]>([]);
  const { userData, balance } = useUserContextData();
  const { subscription, userTier, isPremium } = useSubscription();

  const fetchReceipts = async (email: string) => {
    try {
      setLoading(true);
      const res = await fetch("/api/receipt/get-receipts-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: email }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch receipts");
      }

      const data = await res.json();
      setReceipts(data.receipts || []);
    } catch (error) {
      console.error("Error fetching receipts:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load receipts. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData?.email) {
      fetchReceipts(userData.email);
    }
  }, [userData]);

  const hasReceipts = receipts.length > 0;
  const receiptCount = receipts.length;
  
  const receiptLimit = useMemo(() => {
    if (isPremium) return 'unlimited';
    if (userTier === 'growth') return 'unlimited';
    return 5; // free tier
  }, [userTier, isPremium]);

  const hasReachedLimit = useMemo(() => {
    if (isPremium) return false;
    if (userTier === 'growth') return false;
    return receiptCount >= 5; // free tier
  }, [userTier, isPremium, receiptCount]);

  const remainingReceipts = useMemo(() => {
    if (isPremium) return 'unlimited';
    if (userTier === 'growth') return 'unlimited';
    return Math.max(0, 5 - receiptCount);
  }, [userTier, isPremium, receiptCount]);

  const requiresPayment = hasReachedLimit && !isPremium;
  const hasSufficientBalance = (balance || 0) >= RECEIPT_FEE;

  return (
    <SubscriptionPageGuard
      requiredTier="free"
      featureKey="receipts_per_month"
      title="Receipt Management"
      description="Create, manage, and track professional receipts for your business transactions"
    >
      <div className="min-h-screen bg-gray-50 fade-in">
        <DashboardSidebar />

        <div className="lg:ml-64">
          <DashboardHeader />

          <main className="p-6">
            <div className="md:max-w-5xl md:mx-auto">
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
                    Receipt Management{" "}
                    <span className="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded-md">
                      {isPremium ? 'Unlimited receipts' : 
                       hasReachedLimit ? `Pay ₦${RECEIPT_FEE}/receipt after limit` :
                       userTier === 'free' ? '5 free receipts/month' : 
                       userTier === 'growth' ? 'Unlimited receipts' : ''}
                    </span>
                  </h1>
                  <p className="text-muted-foreground">
                    Create, manage, and track your receipts
                  </p>
                </div>
              </div>

              {/* Usage Stats */}
              {!isPremium && (
                <div className="mb-6 bg-white p-4 rounded-lg border-2 border-gray-200">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700">Monthly Receipt Usage:</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        remainingReceipts === 0 ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {receiptCount}/5 used
                      </span>
                      {hasReachedLimit && (
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1">
                          <Wallet className="w-3 h-3" />
                          Pay-per-use active
                        </span>
                      )}
                    </div>
                    
                    {userTier === 'free' && receiptCount >= 5 && (
                      <div className="flex items-center gap-2">
                        {!hasSufficientBalance && (
                          <Link href="/dashboard/fund-account">
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                              Fund Wallet
                            </Button>
                          </Link>
                        )}
                        <Link href="/dashboard/services/receipt/create?payPerUse=true">
                          <Button 
                            size="sm" 
                            className={`${hasSufficientBalance ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'} text-white`}
                            disabled={!hasSufficientBalance}
                          >
                            <Wallet className="w-4 h-4 mr-2" />
                            Pay ₦{RECEIPT_FEE} & Create
                          </Button>
                        </Link>
                        <Link href="/pricing?upgrade=growth">
                          <Button size="sm" className="bg-[#C29307] hover:bg-[#b38606] text-white">
                            Upgrade for unlimited
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Insufficient balance warning */}
                  {hasReachedLimit && !hasSufficientBalance && (
                    <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                      Insufficient balance. Please fund your wallet to create receipts.
                    </div>
                  )}
                </div>
              )}

              {/* Premium Badge */}
              {isPremium && (
                <div className="mb-6 p-4 bg-[#C29307]/10 border-2 border-[#C29307] rounded-lg">
                  <p className="text-[#C29307] font-medium flex items-center gap-2">
                    <span className="bg-[#C29307] text-white px-2 py-1 rounded text-xs">PREMIUM</span>
                    You have unlimited receipts! Create as many as you need.
                  </p>
                </div>
              )}

              {!hasReceipts && !loading ? (
                <>
                  <ReceiptHero />
                  <ReceiptFeature />
                  <ReceiptHowItsWork />
                  <ReceiptCta />
                  <ReceiptFooter />
                </>
              ) : (
                <ReceiptGen 
                  receipts={receipts} 
                  loading={loading} 
                  userTier={userTier}
                  remainingReceipts={remainingReceipts}
                />
              )}
            </div>
          </main>
        </div>
      </div>
    </SubscriptionPageGuard>
  );
}