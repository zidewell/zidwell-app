"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import DashboardHeader from "@/app/components/dashboard-component/DashboardHeader";
import DashboardSidebar from "@/app/components/dashboard-component/DashboardSidebar";
import { JournalDashboard } from "@/app/components/journal/JournalDashboard";
import { JournalProvider } from "@/app/context/JournalContext";
import { useSubscription } from "@/app/hooks/useSubscripion";
import { useUserContextData } from "@/app/context/userData";
import { Clock, Crown, AlertCircle, Zap, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";
import Loader from "@/app/components/Loader";

function BookkeepingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
      <div className="min-h-screen bg-[#f7f7f7] dark:bg-[#0e0e0e]">
        <DashboardSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="lg:pl-72 min-h-screen flex flex-col">
          <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 p-4 md:p-6 lg:p-8">
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
      <div className="min-h-screen bg-[#f7f7f7] dark:bg-[#0e0e0e]">
        <DashboardSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="lg:pl-72 min-h-screen flex flex-col">
          <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#141414] dark:text-[#f5f5f5] mb-2">
                  Bookkeeping & Journal Management
                </h1>
                <p className="text-sm md:text-base text-[#6b6b6b] dark:text-[#a6a6a6]">
                  Track your business finances, manage journals, and get insights with our professional bookkeeping tools
                </p>
              </div>

              {/* Trial Offer Card */}
              <div className="bg-gradient-to-r from-[#2b825b] to-[#1e5d42] rounded-2xl p-8 mb-10 text-white shadow-[2px_2px_0px_#242424] dark:shadow-[2px_2px_0px_#000000]">
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
                    className="bg-white text-[#2b825b] px-8 py-3 rounded-md font-semibold hover:bg-gray-100 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed shadow-[2px_2px_0px_#242424] dark:shadow-[2px_2px_0px_#000000] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
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

              {/* Rest of your pricing section */}
              <h2 className="text-2xl font-bold text-[#141414] dark:text-[#f5f5f5] mb-6">Choose a Plan That Fits Your Business</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {/* Growth Plan */}
                <div className="bg-[#ffffff] dark:bg-[#121212] border-2 border-[#242424] dark:border-[#474747] rounded-md p-6 hover:border-[#2b825b] transition-all shadow-[2px_2px_0px_#242424] dark:shadow-[2px_2px_0px_#000000]">
                  <div className="flex items-center gap-3 mb-4">
                    <Zap className="w-6 h-6 text-blue-600" />
                    <h3 className="text-xl font-bold text-[#141414] dark:text-[#f5f5f5]">Growth</h3>
                  </div>
                  <p className="text-3xl font-bold text-[#141414] dark:text-[#f5f5f5] mb-2">₦10,000<span className="text-sm font-normal text-[#6b6b6b] dark:text-[#a6a6a6]">/month</span></p>
                  <p className="text-sm text-[#6b6b6b] dark:text-[#a6a6a6] mb-6">Perfect for growing businesses</p>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2 text-sm text-[#141414] dark:text-[#f5f5f5]">
                      <span className="text-[#2b825b] font-bold">✓</span>
                      Full bookkeeping access
                    </li>
                    {/* ... rest of list items */}
                  </ul>
                  <Link href="/pricing?upgrade=growth">
                    <button className="w-full bg-[#2b825b] text-white py-3 rounded-md font-semibold hover:bg-[#1e5d42] border-2 border-[#242424] dark:border-[#474747] shadow-[2px_2px_0px_#242424] dark:shadow-[2px_2px_0px_#000000] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all">
                      Choose Growth
                    </button>
                  </Link>
                </div>

                {/* Premium Plan - Highlighted */}
                <div className="bg-[#ffffff] dark:bg-[#121212] border-2 border-[#2b825b] rounded-md p-6 relative transform scale-105 shadow-[2px_2px_0px_#242424] dark:shadow-[2px_2px_0px_#000000]">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#2b825b] text-white px-4 py-1 rounded-full text-xs font-bold">
                    MOST POPULAR
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <Crown className="w-6 h-6 text-[#2b825b]" />
                    <h3 className="text-xl font-bold text-[#141414] dark:text-[#f5f5f5]">Premium</h3>
                  </div>
                  <p className="text-3xl font-bold text-[#141414] dark:text-[#f5f5f5] mb-2">₦50,000<span className="text-sm font-normal text-[#6b6b6b] dark:text-[#a6a6a6]">/month</span></p>
                  <p className="text-sm text-[#6b6b6b] dark:text-[#a6a6a6] mb-6">For established businesses</p>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2 text-sm text-[#141414] dark:text-[#f5f5f5]">
                      <span className="text-[#2b825b] font-bold">✓</span>
                      Everything in Growth
                    </li>
                    {/* ... rest of list items */}
                  </ul>
                  <Link href="/pricing?upgrade=premium">
                    <button className="w-full bg-[#2b825b] text-white py-3 rounded-md font-semibold hover:bg-[#1e5d42] border-2 border-[#242424] dark:border-[#474747] shadow-[2px_2px_0px_#242424] dark:shadow-[2px_2px_0px_#000000] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all">
                      Choose Premium
                    </button>
                  </Link>
                </div>

                {/* Elite Plan */}
                <div className="bg-[#ffffff] dark:bg-[#121212] border-2 border-[#242424] dark:border-[#474747] rounded-md p-6 hover:border-purple-500 transition-all shadow-[2px_2px_0px_#242424] dark:shadow-[2px_2px_0px_#000000]">
                  <div className="flex items-center gap-3 mb-4">
                    <Sparkles className="w-6 h-6 text-purple-600" />
                    <h3 className="text-xl font-bold text-[#141414] dark:text-[#f5f5f5]">Elite</h3>
                  </div>
                  <p className="text-3xl font-bold text-[#141414] dark:text-[#f5f5f5] mb-2">₦100,000<span className="text-sm font-normal text-[#6b6b6b] dark:text-[#a6a6a6]">/month</span></p>
                  <p className="text-sm text-[#6b6b6b] dark:text-[#a6a6a6] mb-6">For large enterprises</p>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2 text-sm text-[#141414] dark:text-[#f5f5f5]">
                      <span className="text-[#2b825b] font-bold">✓</span>
                      Everything in Premium
                    </li>
                    {/* ... rest of list items */}
                  </ul>
                  <Link href="/pricing?upgrade=elite">
                    <button className="w-full bg-purple-600 text-white py-3 rounded-md font-semibold hover:bg-purple-700 border-2 border-[#242424] dark:border-[#474747] shadow-[2px_2px_0px_#242424] dark:shadow-[2px_2px_0px_#000000] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all">
                      Contact Sales
                    </button>
                  </Link>
                </div>
              </div>

              {/* Why Choose Bookkeeping Section */}
              <div className="mt-12 bg-[#ffffff] dark:bg-[#121212] border-2 border-[#242424] dark:border-[#474747] rounded-md p-8 shadow-[2px_2px_0px_#242424] dark:shadow-[2px_2px_0px_#000000]">
                <h3 className="text-xl font-bold text-[#141414] dark:text-[#f5f5f5] mb-4">Why Choose Zidwell Bookkeeping?</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-semibold text-[#141414] dark:text-[#f5f5f5] mb-2">📊 Real-time Insights</h4>
                    <p className="text-sm text-[#6b6b6b] dark:text-[#a6a6a6]">Get instant visibility into your business finances with interactive charts and reports</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#141414] dark:text-[#f5f5f5] mb-2">🔒 Bank-Level Security</h4>
                    <p className="text-sm text-[#6b6b6b] dark:text-[#a6a6a6]">Your financial data is encrypted and protected with enterprise-grade security</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#141414] dark:text-[#f5f5f5] mb-2">📱 Access Anywhere</h4>
                    <p className="text-sm text-[#6b6b6b] dark:text-[#a6a6a6]">Manage your books on the go with our mobile-responsive dashboard</p>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Free tier with ACTIVE trial
  if (userTier === 'free' && trialInfo?.isActive) {
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
                {/* Trial Banner */}
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-md shadow-[2px_2px_0px_#242424] dark:shadow-[2px_2px_0px_#000000]">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                        <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-green-800 dark:text-green-400">
                          Free Trial Active
                        </h3>
                        <p className="text-sm text-green-600 dark:text-green-500">
                          You have {trialInfo.daysRemaining} days remaining in your bookkeeping trial
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Link href="/pricing?upgrade=growth">
                        <button className="bg-[#2b825b] text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-[#1e5d42] border-2 border-[#242424] dark:border-[#474747] shadow-[2px_2px_0px_#242424] dark:shadow-[2px_2px_0px_#000000] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all">
                          Upgrade to Keep Access
                        </button>
                      </Link>
                    </div>
                  </div>
                  
                  {/* Progress bar for trial */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-[#6b6b6b] dark:text-[#a6a6a6] mb-1">
                      <span>Day {14 - trialInfo.daysRemaining} of 14</span>
                      <span>{trialInfo.daysRemaining} days left</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-[#2b825b] h-2"
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

  // Paid tiers (Growth/Premium/Elite)
  const getPlanIcon = () => {
    switch(userTier) {
      case 'growth': return <Zap className="w-6 h-6 text-blue-600" />;
      case 'premium': return <Crown className="w-6 h-6 text-[#2b825b]" />;
      case 'elite': return <Sparkles className="w-6 h-6 text-purple-600" />;
      default: return <Crown className="w-6 h-6 text-[#2b825b]" />;
    }
  };

  const getPlanColor = () => {
    switch(userTier) {
      case 'growth': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'premium': return 'text-[#2b825b] bg-[#2b825b]/10 border-[#2b825b]';
      case 'elite': return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
      default: return 'text-[#2b825b] bg-[#2b825b]/10 border-[#2b825b]';
    }
  };

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
              {/* Premium Banner */}
              <div className={`mb-6 p-4 rounded-md border-2 ${getPlanColor()} shadow-[2px_2px_0px_#242424] dark:shadow-[2px_2px_0px_#000000]`}>
                <div className="flex items-center gap-3">
                  {getPlanIcon()}
                  <div>
                    <h3 className="font-semibold capitalize text-[#141414] dark:text-[#f5f5f5]">
                      {userTier} Plan Active
                    </h3>
                    <p className="text-sm text-[#6b6b6b] dark:text-[#a6a6a6]">
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