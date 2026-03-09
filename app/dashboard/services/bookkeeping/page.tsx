// app/dashboard/services/bookkeeping/page.tsx
"use client";

import { useEffect, useState } from "react";
import DashboardHeader from "@/app/components/dashboard-hearder";
import DashboardSidebar from "@/app/components/dashboard-sidebar";
import { JournalDashboard } from "@/app/components/journal/JournalDashboard";
import { JournalProvider } from "@/app/context/JournalContext";
import { useSubscription } from "@/app/hooks/useSubscripion";
import { useUserContextData } from "@/app/context/userData";
import { Clock, Crown, AlertCircle, Zap, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";
import Loader from "@/app/components/Loader";

function BookkeepingPage() {
  const { userTier, checkTrialStatus, activateTrial } = useSubscription();
  const { userData } = useUserContextData();
  const [trialInfo, setTrialInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activatingTrial, setActivatingTrial] = useState(false);

  // Check trial status on load
  useEffect(() => {
    const checkTrial = async () => {
      if (userData?.id) {
        const trial = await checkTrialStatus('bookkeeping_access');
        setTrialInfo(trial);
      }
      setLoading(false);
    };
    checkTrial();
  }, [userData, checkTrialStatus]);

  // Handle trial activation for new free users
  const handleStartTrial = async () => {
    setActivatingTrial(true);
    try {
      const result = await activateTrial('bookkeeping_access', 14);
      if (result.success) {
        const trial = await checkTrialStatus('bookkeeping_access');
        setTrialInfo(trial);
      } else {
        // Show error message
        alert(result.error || "Failed to start trial");
      }
    } catch (error) {
      console.error("Failed to activate trial:", error);
      alert("An error occurred while starting your trial");
    } finally {
      setActivatingTrial(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardSidebar />
        <div className="lg:ml-64">
          <DashboardHeader />
          <main className="p-6">
            <div className="flex justify-center items-center h-96">
              <Loader />
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Free tier with NO trial - Show upgrade options with trial offer
  if (userTier === 'free' && !trialInfo?.isActive) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardSidebar />
        <div className="lg:ml-64">
          <DashboardHeader />
          <main className="p-6">
            <div className="max-w-5xl mx-auto">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Bookkeeping & Journal Management</h1>
                <p className="text-gray-600">
                  Track your business finances, manage journals, and get insights with our professional bookkeeping tools
                </p>
              </div>

              {/* Trial Offer Card - Prominent placement */}
              <div className="bg-gradient-to-r from-[#C29307] to-[#eab308] rounded-2xl p-8 mb-10 text-white shadow-xl">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <Clock className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-1">Try Bookkeeping Free for 14 Days</h2>
                      <p className="text-white/90">Full access to all bookkeeping features. No credit card required.</p>
                    </div>
                  </div>
                  <button
                    onClick={handleStartTrial}
                    disabled={activatingTrial}
                    className="bg-white text-[#C29307] px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {activatingTrial ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Starting...
                      </span>
                    ) : (
                      "Start Free Trial"
                    )}
                  </button>
                </div>
              </div>

              {/* Pricing Options */}
              <h2 className="text-2xl font-bold mb-6">Choose a Plan That Fits Your Business</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {/* Growth Plan */}
                <div className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-[#C29307] transition-all hover:shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <Zap className="w-6 h-6 text-blue-600" />
                    <h3 className="text-xl font-bold">Growth</h3>
                  </div>
                  <p className="text-3xl font-bold mb-2">₦10,000<span className="text-sm font-normal text-gray-500">/month</span></p>
                  <p className="text-sm text-gray-500 mb-6">Perfect for growing businesses</p>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2 text-sm">
                      <span className="text-green-500 font-bold">✓</span>
                      Full bookkeeping access
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <span className="text-green-500 font-bold">✓</span>
                      Unlimited journal entries
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <span className="text-green-500 font-bold">✓</span>
                      Financial insights & charts
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <span className="text-green-500 font-bold">✓</span>
                      Export statements
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <span className="text-green-500 font-bold">✓</span>
                      WhatsApp support
                    </li>
                  </ul>
                  <Link href="/pricing?upgrade=growth">
                    <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                      Choose Growth
                    </button>
                  </Link>
                </div>

                {/* Premium Plan - Highlighted */}
                <div className="bg-white rounded-xl border-2 border-[#C29307] p-6 relative transform scale-105 shadow-xl">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#C29307] text-white px-4 py-1 rounded-full text-xs font-bold">
                    MOST POPULAR
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <Crown className="w-6 h-6 text-[#C29307]" />
                    <h3 className="text-xl font-bold">Premium</h3>
                  </div>
                  <p className="text-3xl font-bold mb-2">₦50,000<span className="text-sm font-normal text-gray-500">/month</span></p>
                  <p className="text-sm text-gray-500 mb-6">For established businesses</p>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2 text-sm">
                      <span className="text-green-500 font-bold">✓</span>
                      Everything in Growth
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <span className="text-green-500 font-bold">✓</span>
                      Tax filing support
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <span className="text-green-500 font-bold">✓</span>
                      Financial statements
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <span className="text-green-500 font-bold">✓</span>
                      Priority support
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <span className="text-green-500 font-bold">✓</span>
                      Lawyer signatures (₦10,000)
                    </li>
                  </ul>
                  <Link href="/pricing?upgrade=premium">
                    <button className="w-full bg-[#C29307] text-white py-3 rounded-lg font-semibold hover:bg-[#b38606] transition-colors">
                      Choose Premium
                    </button>
                  </Link>
                </div>

                {/* Elite Plan */}
                <div className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-purple-500 transition-all hover:shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <Sparkles className="w-6 h-6 text-purple-600" />
                    <h3 className="text-xl font-bold">Elite</h3>
                  </div>
                  <p className="text-3xl font-bold mb-2">₦100,000<span className="text-sm font-normal text-gray-500">/month</span></p>
                  <p className="text-sm text-gray-500 mb-6">For large enterprises</p>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2 text-sm">
                      <span className="text-green-500 font-bold">✓</span>
                      Everything in Premium
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <span className="text-green-500 font-bold">✓</span>
                      Full tax filing (VAT, PAYE, WHT)
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <span className="text-green-500 font-bold">✓</span>
                      CFO-level guidance
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <span className="text-green-500 font-bold">✓</span>
                      Dedicated account manager
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <span className="text-green-500 font-bold">✓</span>
                      Free transfers
                    </li>
                  </ul>
                  <Link href="/pricing?upgrade=elite">
                    <button className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                      Contact Sales
                    </button>
                  </Link>
                </div>
              </div>

              {/* Why Choose Bookkeeping Section */}
              <div className="mt-12 bg-gray-50 rounded-xl p-8">
                <h3 className="text-xl font-bold mb-4">Why Choose Zidwell Bookkeeping?</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">📊 Real-time Insights</h4>
                    <p className="text-sm text-gray-600">Get instant visibility into your business finances with interactive charts and reports</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">🔒 Bank-Level Security</h4>
                    <p className="text-sm text-gray-600">Your financial data is encrypted and protected with enterprise-grade security</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">📱 Access Anywhere</h4>
                    <p className="text-sm text-gray-600">Manage your books on the go with our mobile-responsive dashboard</p>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Free tier with ACTIVE trial - Show trial banner + full access
  if (userTier === 'free' && trialInfo?.isActive) {
    return (
      <JournalProvider>
        <div className="min-h-screen bg-gray-50">
          <DashboardSidebar />
          <div className="lg:ml-64">
            <DashboardHeader />
            <main className="p-6">
              <div className="max-w-6xl mx-auto">
                {/* Trial Banner */}
                <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Clock className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-green-800">
                          Free Trial Active
                        </h3>
                        <p className="text-sm text-green-600">
                          You have {trialInfo.daysRemaining} days remaining in your bookkeeping trial
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Link href="/pricing?upgrade=growth">
                        <button className="bg-[#C29307] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#b38606] transition-colors">
                          Upgrade to Keep Access
                        </button>
                      </Link>
                    </div>
                  </div>
                  
                  {/* Progress bar for trial */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Day {14 - trialInfo.daysRemaining} of 14</span>
                      <span>{trialInfo.daysRemaining} days left</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-green-500 h-2"
                        style={{ width: `${((14 - trialInfo.daysRemaining) / 14) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Full Access Dashboard */}
                <JournalDashboard />
              </div>
            </main>
          </div>
        </div>
      </JournalProvider>
    );
  }

  // Paid tiers (Growth/Premium/Elite) - Show premium banner + full access
  const getPlanIcon = () => {
    switch(userTier) {
      case 'growth': return <Zap className="w-6 h-6 text-blue-600" />;
      case 'premium': return <Crown className="w-6 h-6 text-[#C29307]" />;
      case 'elite': return <Sparkles className="w-6 h-6 text-purple-600" />;
      default: return <Crown className="w-6 h-6 text-[#C29307]" />;
    }
  };

  const getPlanColor = () => {
    switch(userTier) {
      case 'growth': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'premium': return 'text-[#C29307] bg-[#C29307]/10 border-[#C29307]';
      case 'elite': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-[#C29307] bg-[#C29307]/10 border-[#C29307]';
    }
  };

  return (
    <JournalProvider>
      <div className="min-h-screen bg-gray-50">
        <DashboardSidebar />
        <div className="lg:ml-64">
          <DashboardHeader />
          <main className="p-6">
            <div className="max-w-6xl mx-auto">
              {/* Premium Banner */}
              <div className={`mb-6 p-4 rounded-lg border-2 ${getPlanColor()}`}>
                <div className="flex items-center gap-3">
                  {getPlanIcon()}
                  <div>
                    <h3 className="font-semibold capitalize">
                      {userTier} Plan Active
                    </h3>
                    <p className="text-sm text-gray-600">
                      You have full access to all bookkeeping features
                    </p>
                  </div>
                </div>
              </div>

       
              <JournalDashboard />
            </div>
          </main>
        </div>
      </div>
    </JournalProvider>
  );
}

export default BookkeepingPage;