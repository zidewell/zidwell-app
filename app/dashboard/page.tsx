// "use client";

// import BalanceCard from "../components/Balance-card";
// import DashboardHeader from "../components/dashboard-hearder";
// import DashboardSidebar from "../components/dashboard-sidebar";
// import ServiceCards from "../components/service-card";
// import TransactionHistory from "../components/transaction-history";

// export default function DashboardPage() {
//   return (
//     <div className="min-h-screen bg-gray-50 fade-in overflow-x-hidden">
//       <DashboardSidebar />
//       <div className="lg:ml-64">
//         <DashboardHeader />
//         <main className="p-5">
//           <div className="md:max-w-6xl md:mx-auto space-y-8">
//             {/* Welcome Message */}
//             {/* If you want modal after verification */}
//             {/* {userData?.bvnVerification === "verified" && (
//               <AdditionalInfoModal setShowModal={setShowModal} />
//             )} */}

//             <div className="text-center">
//               <h1 className="md:text-3xl text-xl font-bold text-gray-900 mb-2">
//                 Welcome to <span className="text-[#C29307]">Zidwell,</span> the
//                 most reliable platform for your
//               </h1>
//               <p className="md:text-xl text-gray-600">
//                 Data Bundle, Airtime, Bill Payments...
//               </p>
//             </div>

//             {/* Balance Section */}
//             <BalanceCard />

//             {/* Service Cards */}
//             <div>
//               <h2 className="text-2xl font-bold text-gray-900 mb-6">
//                 Our Services
//               </h2>
//               <ServiceCards />
//             </div>

//             {/* Transaction History */}
//             <TransactionHistory />
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// }


// app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import BalanceCard from "../components/Balance-card";
import DashboardHeader from "../components/dashboard-hearder";
import DashboardSidebar from "../components/dashboard-sidebar";
import ServiceCards from "../components/service-card";
import TransactionHistory from "../components/transaction-history";
import UsageSummary from "../components/UsageSummary"; 
import { useSubscription } from "../hooks/useSubscripion";
import BVNVerificationBadge from "../components/BVNVerificationBadge";

export default function DashboardPage() {
  const { userTier, userId } = useSubscription();
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch usage data
  const fetchUsage = async () => {
    try {
      const res = await fetch('/api/user/usage');
      if (res.ok) {
        const data = await res.json();
        setUsage(data);
      }
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh usage after actions
  const refreshUsage = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Fetch usage on mount and when refreshKey changes
  useEffect(() => {
    if (userTier === 'free') {
      fetchUsage();
    }
  }, [userTier, refreshKey]);

  // Listen for focus events to refresh data when returning to dashboard
  useEffect(() => {
    const handleFocus = () => {
      if (userTier === 'free') {
        fetchUsage();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [userTier]);

  return (
    <div className="min-h-screen bg-gray-50 fade-in overflow-x-hidden">
      <DashboardSidebar />
      <div className="lg:ml-64">
        <DashboardHeader />
        <main className="p-5">
          <div className="md:max-w-6xl md:mx-auto space-y-8">
                  <BVNVerificationBadge />
            {/* Welcome Message */}
            <div className="text-center">
              <h1 className="md:text-3xl text-xl font-bold text-gray-900 mb-2">
                Welcome to <span className="text-[#C29307]">Zidwell,</span> the
                most reliable platform for your
              </h1>
              <p className="md:text-xl text-gray-600">
                Data Bundle, Airtime, Bill Payments...
              </p>
            </div>

            {/* Balance Section */}
            <BalanceCard />

            {/* Usage Summary for Free Tier */}
            {userTier === 'free' && !loading && usage && (
              <UsageSummary usage={usage} onRefresh={refreshUsage} />
            )}

            {/* Service Cards with refresh capability */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Our Services
              </h2>
              <ServiceCards onActionComplete={refreshUsage} usage={usage} />
            </div>

            {/* Transaction History */}
            <TransactionHistory />
          </div>
        </main>
      </div>
    </div>
  );
}