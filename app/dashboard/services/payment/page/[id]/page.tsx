"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Eye,
  CreditCard,
  TrendingUp,
  Users,
  Copy,
  Wallet,
  BarChart3,
  ExternalLink,
  GraduationCap,
  CheckCircle2,
  XCircle,
  Shield,
  Clock,
  DollarSign,
  Loader2,
  Mail,
  User,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useStore, isInvestmentType } from "@/app/hooks/useStore";
import DashboardSidebar from "@/app/components/dashboard-component/DashboardSidebar";
import DashboardHeader from "@/app/components/dashboard-component/DashboardHeader";

const typeLabels: Record<string, string> = {
  school: "School Fees",
  donation: "Donation",
  physical: "Physical Product",
  digital: "Digital Product",
  services: "Service",
  real_estate: "Real Estate Investment",
  stock: "Stock Investment",
  savings: "Savings / Ajo",
  crypto: "Crypto Investment",
};

const PageDetail = () => {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { pages, getPageDetails, withdrawFromPage } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [page, setPage] = useState<any>(null);
  const [stats, setStats] = useState({
    payments: [],
    totalAmount: 0,
    totalCount: 0,
  });
  const [showWithdrawal, setShowWithdrawal] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawalError, setWithdrawalError] = useState("");
  const [withdrawalSuccess, setWithdrawalSuccess] = useState(false);

  useEffect(() => {
    const foundPage = pages.find((p) => p.id === id);
    setPage(foundPage);
    if (foundPage) {
      loadStats(foundPage.id);
    } else if (id) {
      // If not found in pages list, fetch directly
      loadPageDetails();
    }
  }, [pages, id]);

  const loadPageDetails = async () => {
    try {
      const pageDetails = await getPageDetails(id);
      if (pageDetails) {
        setPage(pageDetails);
        setStats({
          payments: pageDetails.recentPayments || [],
          totalAmount: pageDetails.paymentStats?.totalAmount || 0,
          totalCount: pageDetails.paymentStats?.totalCount || 0,
        });
      }
    } catch (error) {
      console.error("Error loading page details:", error);
    }
  };

  const loadStats = async (pageId: string) => {
    try {
      const pageDetails = await getPageDetails(pageId);
      if (pageDetails) {
        setStats({
          payments: pageDetails.recentPayments || [],
          totalAmount: pageDetails.paymentStats?.totalAmount || 0,
          totalCount: pageDetails.paymentStats?.totalCount || 0,
        });
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  // Helper function to get child's name from payment
  const getChildName = (payment: any) => {
    if (payment.metadata?.childName) {
      return payment.metadata.childName;
    }
    return null;
  };

  // Helper function to get parent's name from payment
  const getParentName = (payment: any) => {
    if (payment.metadata?.parentName) {
      return payment.metadata.parentName;
    }
    // If no parent name in metadata, use customer name
    return payment.customerName || payment.customer_name;
  };

  // Helper function to get parent's email from payment
  const getParentEmail = (payment: any) => {
    return payment.customerEmail || payment.customer_email;
  };

  // Helper function to get additional school info
  const getSchoolAdditionalInfo = (payment: any) => {
    const info = [];
    if (payment.metadata?.className) {
      info.push(`📚 Class: ${payment.metadata.className}`);
    }
    if (payment.metadata?.regNumber) {
      info.push(`🔢 Reg: ${payment.metadata.regNumber}`);
    }
    if (payment.metadata?.term) {
      info.push(`📖 Term: ${payment.metadata.term}`);
    }
    if (payment.metadata?.session) {
      info.push(`🎓 Session: ${payment.metadata.session}`);
    }
    return info;
  };

  if (!page) {
    return (
      <div className="min-h-screen bg-[#f7f0e2] dark:bg-[#0e0e0e] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Page not found</h1>
          <Button
            variant="default"
            onClick={() =>
              router.push("/dashboard/services/payment/payment/dashboard")
            }
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const isInvestment = isInvestmentType(page.pageType);
  const pageUrl = `zidwell.com/payment/${page.slug}`;

  const statsCards = [
    {
      label: "Page Views",
      value: page.pageViews || 0,
      icon: Eye,
      color: "text-[#e1bf46]",
    },
    {
      label: "Total Payments",
      value: page.totalPayments || 0,
      icon: CreditCard,
      color: "text-[#28a36a]",
    },
    {
      label: "Page Balance",
      value: `₦${(page.pageBalance || 0).toLocaleString()}`,
      icon: Wallet,
      color: "text-[#e1bf46]",
    },
    {
      label: "Total Revenue",
      value: `₦${(page.totalRevenue || 0).toLocaleString()}`,
      icon: TrendingUp,
      color: "text-[#28a36a]",
    },
  ];

  const handleWithdraw = async () => {
    const amount = Number(withdrawalAmount);
    const minAmount = 1000;

    if (amount < minAmount) {
      setWithdrawalError(
        `Minimum withdrawal is ₦${minAmount.toLocaleString()}`,
      );
      return;
    }

    if (amount > page.pageBalance) {
      setWithdrawalError(
        `Insufficient balance. Available: ₦${page.pageBalance.toLocaleString()}`,
      );
      return;
    }

    setWithdrawing(true);
    setWithdrawalError("");

    try {
      const result = await withdrawFromPage(page.id, amount);
      setWithdrawalSuccess(true);
      setTimeout(() => {
        setShowWithdrawal(false);
        setWithdrawalSuccess(false);
        setWithdrawalAmount("");
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      setWithdrawalError(err.message);
    } finally {
      setWithdrawing(false);
    }
  };

  const withdrawalFee = 200;
  const netAmount = Number(withdrawalAmount) - withdrawalFee;

  return (
    <div className="min-h-screen dark:bg-[#0e0e0e]">
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:pl-72 min-h-screen flex flex-col">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-sm text-[#6b6b6b] dark:text-[#a6a6a6] hover:text-[#023528] dark:hover:text-[#f5f5f5] transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>

            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {page.logo ? (
                    <img
                      src={page.logo}
                      className="h-16 w-16 rounded-2xl object-cover"
                      alt="Logo"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-2xl bg-[#e9e2d7] dark:bg-[#242424] flex items-center justify-center">
                      <CreditCard className="h-7 w-7 text-gray-500" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h1 className="text-2xl font-bold">{page.title}</h1>
                      <span className="px-2 py-0.5 rounded-full bg-[#e1bf46]/10 text-[#e1bf46] text-xs font-medium">
                        {typeLabels[page.pageType]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 truncate">
                        {pageUrl}
                      </span>
                      <button
                        onClick={() => navigator.clipboard.writeText(pageUrl)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
                <Button
                  variant="default"
                  onClick={() => router.push(`/pay/${page.slug}`)}
                >
                  <ExternalLink className="h-4 w-4 mr-1" /> View Page
                </Button>
              </div>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {statsCards.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-4 rounded-2xl bg-white dark:bg-[#121212] border"
                >
                  <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Withdraw Button */}
            {page.pageBalance > 0 && (
              <div className="bg-[#034936] rounded-2xl p-5 text-white">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h3 className="font-bold text-lg">Available Balance</h3>
                    <p className="text-3xl font-bold">
                      ₦{page.pageBalance.toLocaleString()}
                    </p>
                    <p className="text-sm opacity-80 mt-1">
                      Withdraw to your main wallet (₦200 fee)
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    className="bg-[#e1bf46] text-[#023528] hover:bg-[#e1bf46]/90"
                    onClick={() => setShowWithdrawal(true)}
                  >
                    <Wallet className="h-4 w-4 mr-1" /> Withdraw Funds
                  </Button>
                </div>
              </div>
            )}

            {/* Recent Payments */}
            <div className="bg-white dark:bg-[#121212] rounded-2xl border overflow-hidden">
              <div className="p-5 border-b">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-[#e1bf46]" />
                  Recent Payments
                  {page.pageType === "school" && (
                    <span className="text-xs font-normal text-gray-500 ml-2">
                      (Showing Parent & Child Details)
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {stats.totalCount} payment{stats.totalCount !== 1 ? "s" : ""}{" "}
                  • Total: ₦{stats.totalAmount.toLocaleString()}
                </p>
              </div>
              <div className="divide-y">
                {stats.payments.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No payments yet</p>
                    <p className="text-sm">
                      Share your page to start receiving payments
                    </p>
                  </div>
                ) : (
                  stats.payments.slice(0, 10).map((payment: any) => (
                    <div
                      key={payment.id}
                      className="p-4 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
                    >
                      {page.pageType === "school" ? (
                        // School Payment Display - Show both parent and child details
                        <div className="space-y-3">
                          {/* Parent Information */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <User className="h-4 w-4 text-[#e1bf46]" />
                                <p className="font-semibold text-gray-900 dark:text-white">
                                  {getParentName(payment)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 ml-6">
                                <Mail className="h-3 w-3 text-gray-400" />
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {getParentEmail(payment) || "No email provided"}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-[#28a36a]">
                                ₦{payment.amount.toLocaleString()}
                              </p>
                              {payment.fee > 0 && (
                                <p className="text-xs text-gray-400">
                                  Fee: ₦{payment.fee.toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Child Information */}
                          {getChildName(payment) && (
                            <div className="ml-6 pl-4 border-l-2 border-[#e1bf46]/30">
                              <div className="flex items-center gap-2 mb-1">
                                <GraduationCap className="h-4 w-4 text-[#28a36a]" />
                                <p className="font-medium text-gray-800 dark:text-gray-200">
                                  Child: {getChildName(payment)}
                                </p>
                              </div>
                              
                              {/* Additional School Info */}
                              {getSchoolAdditionalInfo(payment).length > 0 && (
                                <div className="ml-6 space-y-1 mt-1">
                                  {getSchoolAdditionalInfo(payment).map((info, idx) => (
                                    <p key={idx} className="text-xs text-gray-500">
                                      {info}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Payment Date */}
                          <div className="text-xs text-gray-400 ml-6">
                            {new Date(
                              payment.createdAt || payment.created_at || payment.paid_at
                            ).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      ) : (
                        // Non-School Payment Display
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {payment.customerName || payment.customer_name || "Anonymous"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {payment.customerEmail || payment.customer_email}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(
                                payment.createdAt || payment.created_at || payment.paid_at
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-[#28a36a]">
                              ₦{payment.amount.toLocaleString()}
                            </p>
                            {payment.fee > 0 && (
                              <p className="text-xs text-gray-400">
                                Fee: ₦{payment.fee.toLocaleString()}
                              </p>
                            )}
                            {payment.status && (
                              <p className={`text-xs mt-1 ${
                                payment.status === 'completed' ? 'text-green-600' : 'text-yellow-600'
                              }`}>
                                {payment.status}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* School-specific stats */}
            {page.pageType === "school" &&
              page.metadata?.students &&
              page.metadata.students.length > 0 && (
                <div className="bg-white dark:bg-[#121212] rounded-2xl border p-5">
                  <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
                    <GraduationCap className="h-4 w-4 text-[#e1bf46]" />
                    Student Payment Status
                  </h3>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-green-50 text-center">
                      <div className="text-xl font-bold text-green-600">
                        {
                          page.metadata.students.filter((s: any) => s.paid)
                            .length
                        }
                      </div>
                      <div className="text-xs text-gray-600">Paid</div>
                    </div>
                    <div className="p-3 rounded-xl bg-red-50 text-center">
                      <div className="text-xl font-bold text-red-600">
                        {
                          page.metadata.students.filter((s: any) => !s.paid)
                            .length
                        }
                      </div>
                      <div className="text-xs text-gray-600">Unpaid</div>
                    </div>
                  </div>
                  
                  {/* Student List */}
                  <div className="mt-4">
                    <h4 className="font-medium text-sm mb-3">Student List</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {page.metadata.students.map((student: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-[#1a1a1a]">
                          <div>
                            <p className="font-medium text-sm">{student.name}</p>
                            {student.className && (
                              <p className="text-xs text-gray-500">{student.className}</p>
                            )}
                            {student.regNumber && (
                              <p className="text-xs text-gray-400">{student.regNumber}</p>
                            )}
                          </div>
                          <div className="text-right">
                            {student.paid ? (
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="text-xs">Paid</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-red-600">
                                <XCircle className="h-4 w-4" />
                                <span className="text-xs">Unpaid</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
          </div>
        </main>
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-md w-full bg-white rounded-2xl"
          >
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Withdraw Funds</h2>
              <p className="text-gray-600 text-sm mt-1">
                Withdraw from "{page.title}" to your main wallet
              </p>
            </div>

            <div className="p-6 space-y-4">
              {withdrawalSuccess ? (
                <div className="text-center py-8">
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">
                    Withdrawal Successful!
                  </h3>
                  <p className="text-gray-600">
                    ₦{netAmount.toLocaleString()} has been transferred to your
                    main wallet.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Available Balance
                    </label>
                    <p className="text-2xl font-bold text-[#e1bf46]">
                      ₦{page.pageBalance.toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Withdrawal Amount (₦)
                    </label>
                    <input
                      type="number"
                      className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e1bf46]"
                      placeholder="Enter amount"
                      value={withdrawalAmount}
                      onChange={(e) => setWithdrawalAmount(e.target.value)}
                      min="1000"
                      max={page.pageBalance}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum: ₦1,000 | Fee: ₦200
                    </p>
                  </div>

                  {Number(withdrawalAmount) >= 1000 && (
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Withdrawal amount:</span>
                        <span>
                          ₦{Number(withdrawalAmount).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Processing fee:</span>
                        <span>₦{withdrawalFee.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-bold pt-2 border-t">
                        <span>You'll receive:</span>
                        <span className="text-[#28a36a]">
                          ₦{netAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

                  {withdrawalError && (
                    <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm">
                      {withdrawalError}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setShowWithdrawal(false);
                        setWithdrawalAmount("");
                        setWithdrawalError("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="default"
                      className="flex-1 bg-[#e1bf46] text-[#023528] hover:bg-[#e1bf46]/90"
                      onClick={handleWithdraw}
                      disabled={
                        withdrawing ||
                        !withdrawalAmount ||
                        Number(withdrawalAmount) < 1000 ||
                        Number(withdrawalAmount) > page.pageBalance
                      }
                    >
                      {withdrawing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Confirm Withdrawal"
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PageDetail;