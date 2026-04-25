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
  Calendar,
  FileText,
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

  // Get child/student name from payment metadata
  const getStudentName = (payment: any) => {
    if (payment.metadata?.childName) {
      return payment.metadata.childName;
    }
    if (payment.metadata?.studentName) {
      return payment.metadata.studentName;
    }
    if (payment.metadata?.student_name) {
      return payment.metadata.student_name;
    }
    return null;
  };

  // Get parent name from payment
  const getParentName = (payment: any) => {
    if (payment.metadata?.parentName) {
      return payment.metadata.parentName;
    }
    if (payment.metadata?.parent_name) {
      return payment.metadata.parent_name;
    }
    return payment.customer_name || payment.customerName;
  };

  // Get parent email
  const getParentEmail = (payment: any) => {
    return payment.customer_email || payment.customerEmail;
  };

  // UPDATED: Check if a student has paid using the database paid flag
  const hasStudentPaid = (student: any): boolean => {
    // First check if the student has a paid flag in the database
    if (student.paid === true) {
      return true;
    }
    
    // Fallback: Check payment records if no paid flag exists
    const studentName = student.name || student.childName || student.studentName;
    if (!studentName || !stats.payments || stats.payments.length === 0) return false;
    
    return stats.payments.some((payment: any) => {
      const paymentStudentName = getStudentName(payment);
      const nameMatches = paymentStudentName?.toLowerCase().trim() === studentName?.toLowerCase().trim();
      const isCompleted = payment.status === "completed" || 
                          payment.status === "success" ||
                          payment.paid_at !== null;
      return nameMatches && isCompleted;
    });
  };

  // Get student paid amount (from database or calculate from payments)
  const getStudentPaidAmount = (student: any) => {
    // If student has paidAmount in database, use it
    if (student.paidAmount && student.paidAmount > 0) {
      return student.paidAmount;
    }
    
    // Fallback: Calculate from payment records
    const studentName = student.name || student.childName || student.studentName;
    if (!studentName || !stats.payments || stats.payments.length === 0) return 0;
    
    let total = 0;
    stats.payments.forEach((payment: any) => {
      const paymentStudentName = getStudentName(payment);
      if (paymentStudentName?.toLowerCase().trim() === studentName?.toLowerCase().trim()) {
        const isCompleted = payment.status === "completed" || 
                            payment.status === "success" ||
                            payment.paid_at !== null;
        if (isCompleted) {
          total += payment.amount || 0;
        }
      }
    });
    return total;
  };

  // Get student paid date
  const getStudentPaidDate = (student: any) => {
    if (student.paidAt) {
      return new Date(student.paidAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
    return null;
  };

  // Get parent who paid for student
  const getStudentParentName = (student: any) => {
    if (student.parentName) {
      return student.parentName;
    }
    return null;
  };

  if (!page) {
    return (
      <div className="min-h-screen bg-[#f7f0e2] dark:bg-[#0e0e0e] flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-bold mb-2">Page not found</h1>
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
      setWithdrawalError(`Minimum withdrawal is ₦${minAmount.toLocaleString()}`);
      return;
    }

    if (amount > page.pageBalance) {
      setWithdrawalError(`Insufficient balance. Available: ₦${page.pageBalance.toLocaleString()}`);
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

  // Get students from metadata
  const students = page.metadata?.students || [];
  
  // Calculate paid/unpaid counts using the database paid flag
  const paidStudentsCount = students.filter((student: any) => student.paid === true).length;
  const unpaidStudentsCount = students.length - paidStudentsCount;
  
  // Calculate total paid amount from all students
  const totalPaidAmount = students.reduce((total: number, student: any) => {
    return total + (student.paidAmount || 0);
  }, 0);

  return (
    <div className="min-h-screen dark:bg-[#0e0e0e]">
      <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-72 min-h-screen flex flex-col">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-sm text-[#6b6b6b] dark:text-[#a6a6a6] hover:text-[#023528] dark:hover:text-[#f5f5f5] transition-colors mb-2 sm:mb-4"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                  {page.logo ? (
                    <img
                      src={page.logo}
                      className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl object-cover"
                      alt="Logo"
                    />
                  ) : (
                    <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-[#e9e2d7] dark:bg-[#242424] flex items-center justify-center">
                      <CreditCard className="h-6 w-6 sm:h-7 sm:w-7 text-gray-500" />
                    </div>
                  )}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                      <h1 className="text-xl sm:text-2xl font-bold break-words">{page.title}</h1>
                      <span className="px-2 py-0.5 rounded-full bg-[#e1bf46]/10 text-[#e1bf46] text-xs font-medium self-start sm:self-center">
                        {typeLabels[page.pageType]}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <span className="text-xs sm:text-sm text-gray-500 break-all">{pageUrl}</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(pageUrl)}
                        className="text-gray-400 hover:text-gray-600 transition-colors self-start sm:self-center"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
                <Button variant="default" onClick={() => router.push(`/pay/${page.slug}`)} className="self-start sm:self-center">
                  <ExternalLink className="h-4 w-4 mr-1" /> View Page
                </Button>
              </div>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-4 sm:gap-4">
              {statsCards.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#121212] border"
                >
                  <s.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${s.color} mb-2`} />
                  <div className="text-lg sm:text-2xl font-bold truncate">{s.value}</div>
                  <div className="text-[10px] sm:text-xs text-gray-500">{s.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Recent Payments - Shows Parent + Child payments */}
            <div className="bg-white dark:bg-[#121212] rounded-2xl border overflow-hidden">
              <div className="p-4 sm:p-5 border-b">
                <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-[#e1bf46]" />
                  Recent Payments
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  {stats.totalCount} payment{stats.totalCount !== 1 ? "s" : ""} • Total: ₦{stats.totalAmount.toLocaleString()}
                </p>
              </div>
              <div className="divide-y">
                {stats.payments.length === 0 ? (
                  <div className="p-6 sm:p-8 text-center text-gray-500">
                    <DollarSign className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm sm:text-base">No payments yet</p>
                  </div>
                ) : (
                  stats.payments.slice(0, 10).map((payment: any) => {
                    const studentName = getStudentName(payment);
                    const parentName = getParentName(payment);
                    const parentEmail = getParentEmail(payment);
                    const isPaid = payment.status === "completed" || payment.paid_at !== null;

                    return (
                      <div key={payment.id} className="p-4 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                        <div className="space-y-3">
                          {/* Parent Information */}
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <User className="h-3 w-3 sm:h-4 sm:w-4 text-[#e1bf46]" />
                                <p className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">
                                  Parent: {parentName}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 ml-5 sm:ml-6">
                                <Mail className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-gray-400" />
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                  {parentEmail || "No email provided"}
                                </p>
                              </div>
                            </div>
                            <div className="text-left sm:text-right">
                              <p className="font-bold text-[#28a36a] text-base sm:text-lg">
                                ₦{payment.amount.toLocaleString()}
                              </p>
                              {payment.fee > 0 && (
                                <p className="text-xs text-gray-400">Fee: ₦{payment.fee.toLocaleString()}</p>
                              )}
                            </div>
                          </div>

                          {/* Child Information */}
                          {studentName && (
                            <div className="ml-3 sm:ml-6 pl-3 sm:pl-4 border-l-2 border-[#e1bf46]/30">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
                                <div className="flex items-center gap-2">
                                  <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4 text-[#28a36a]" />
                                  <p className="font-medium text-sm sm:text-base text-gray-800 dark:text-gray-200">
                                    Student: {studentName}
                                  </p>
                                </div>
                                {isPaid && (
                                  <div className="flex items-center gap-1 text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                                    <CheckCircle2 className="h-3 w-3" />
                                    <span className="text-xs font-medium">Completed</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Payment Date */}
                          <div className="flex items-center gap-2 text-xs text-gray-400 ml-3 sm:ml-6">
                            <Calendar className="h-3 w-3" />
                            {new Date(payment.paid_at || payment.created_at).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Student Payment Status - Shows which students have paid using database flag */}
            {page.pageType === "school" && students.length > 0 && (
              <div className="bg-white dark:bg-[#121212] rounded-2xl border p-4 sm:p-5">
                <h3 className="font-bold text-base sm:text-lg flex items-center gap-2 mb-4">
                  <GraduationCap className="h-4 w-4 text-[#e1bf46]" />
                  Student Payment Status
                </h3>

                {/* Stats Summary */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-center">
                    <div className="text-lg sm:text-xl font-bold text-green-600">{paidStudentsCount}</div>
                    <div className="text-[10px] sm:text-xs text-gray-600">Paid</div>
                  </div>
                  <div className="p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 text-center">
                    <div className="text-lg sm:text-xl font-bold text-yellow-600">{unpaidStudentsCount}</div>
                    <div className="text-[10px] sm:text-xs text-gray-600">Unpaid</div>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-center">
                    <div className="text-lg sm:text-xl font-bold text-blue-600">₦{totalPaidAmount.toLocaleString()}</div>
                    <div className="text-[10px] sm:text-xs text-gray-600">Total Paid</div>
                  </div>
                </div>

                {/* Student List */}
                <div className="mt-4">
                  <h4 className="font-medium text-xs sm:text-sm mb-3">Student List</h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {students.map((student: any, idx: number) => {
                      const studentName = student.name || student.childName || student.studentName;
                      const hasPaid = student.paid === true; // Use database flag directly
                      const paidAmount = student.paidAmount || 0;
                      const paidDate = getStudentPaidDate(student);
                      const parentName = getStudentParentName(student);
                      const expectedAmount = page.price || student.expectedAmount || 0;
                      const isFullyPaid = expectedAmount > 0 ? paidAmount >= expectedAmount : paidAmount > 0;

                      return (
                        <div
                          key={idx}
                          className={`flex flex-col p-3 rounded-lg gap-2 transition-all ${
                            hasPaid
                              ? 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800'
                              : 'bg-gray-50 dark:bg-[#1a1a1a] border border-transparent'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <GraduationCap className={`h-3 w-3 sm:h-4 sm:w-4 ${hasPaid ? 'text-green-600' : 'text-gray-400'}`} />
                                <p className="font-medium text-xs sm:text-sm">{studentName}</p>
                                {hasPaid && (
                                  <span className="text-[10px] font-medium text-green-600 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded-full">
                                    {isFullyPaid ? 'Fully Paid' : 'Partially Paid'}
                                  </span>
                                )}
                              </div>
                              {student.className && (
                                <p className="text-[10px] sm:text-xs text-gray-500 ml-5 sm:ml-6 mt-0.5">
                                  📚 Class: {student.className}
                                </p>
                              )}
                              {student.regNumber && (
                                <p className="text-[10px] sm:text-xs text-gray-400 ml-5 sm:ml-6">
                                  🔢 Reg: {student.regNumber}
                                </p>
                              )}
                              {hasPaid && paidAmount > 0 && (
                                <div className="ml-5 sm:ml-6 mt-1 space-y-0.5">
                                  <p className="text-[10px] sm:text-xs text-green-600">
                                    💰 Paid: ₦{paidAmount.toLocaleString()}
                                    {expectedAmount > 0 && ` / ₦${expectedAmount.toLocaleString()}`}
                                  </p>
                                  {paidDate && (
                                    <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                      <Calendar className="h-2.5 w-2.5" />
                                      Paid on: {paidDate}
                                    </p>
                                  )}
                                  {parentName && (
                                    <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                      <User className="h-2.5 w-2.5" />
                                      Paid by: {parentName}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="text-left sm:text-right">
                              {hasPaid ? (
                                <div className="flex items-center gap-1 text-green-600">
                                  <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                  <span className="text-[10px] sm:text-xs font-medium">Paid</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-yellow-600">
                                  <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                                  <span className="text-[10px] sm:text-xs font-medium">Pending</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Summary Note */}
                {paidStudentsCount > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <FileText className="h-3 w-3" />
                      Total of {paidStudentsCount} student{paidStudentsCount !== 1 ? 's have' : ' has'} paid ₦{totalPaidAmount.toLocaleString()} out of ₦{(students.length * (page.price || 0)).toLocaleString()} expected.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Withdraw Button */}
            {page.pageBalance > 0 && (
              <div className="bg-[#034936] rounded-2xl p-4 sm:p-5 text-white">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-base sm:text-lg">Available Balance</h3>
                    <p className="text-2xl sm:text-3xl font-bold">₦{page.pageBalance.toLocaleString()}</p>
                    <p className="text-xs sm:text-sm opacity-80 mt-1">Withdraw to your main wallet (₦200 fee)</p>
                  </div>
                  <Button
                    variant="secondary"
                    className="bg-[#e1bf46] text-[#023528] hover:bg-[#e1bf46]/90 w-full sm:w-auto"
                    onClick={() => setShowWithdrawal(true)}
                  >
                    <Wallet className="h-4 w-4 mr-1" /> Withdraw Funds
                  </Button>
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
            className="max-w-md w-full bg-white dark:bg-[#121212] rounded-2xl mx-4 sm:mx-0"
          >
            <div className="p-4 sm:p-6 border-b">
              <h2 className="text-lg sm:text-xl font-bold">Withdraw Funds</h2>
              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mt-1">
                Withdraw from "{page.title}" to your main wallet
              </p>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              {withdrawalSuccess ? (
                <div className="text-center py-6 sm:py-8">
                  <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold mb-2">Withdrawal Successful!</h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    ₦{netAmount.toLocaleString()} has been transferred to your main wallet.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs sm:text-sm font-medium mb-1 block">Available Balance</label>
                    <p className="text-xl sm:text-2xl font-bold text-[#e1bf46]">₦{page.pageBalance.toLocaleString()}</p>
                  </div>

                  <div>
                    <label className="text-xs sm:text-sm font-medium mb-1 block">Withdrawal Amount (₦)</label>
                    <input
                      type="number"
                      className="w-full p-2 sm:p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e1bf46] dark:bg-[#1a1a1a] dark:border-[#474747] text-sm sm:text-base"
                      placeholder="Enter amount"
                      value={withdrawalAmount}
                      onChange={(e) => setWithdrawalAmount(e.target.value)}
                      min="1000"
                      max={page.pageBalance}
                    />
                    <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Minimum: ₦1,000 | Fee: ₦200</p>
                  </div>

                  {Number(withdrawalAmount) >= 1000 && (
                    <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-xl p-3 sm:p-4 space-y-2">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span>Withdrawal amount:</span>
                        <span>₦{Number(withdrawalAmount).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span>Processing fee:</span>
                        <span>₦{withdrawalFee.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-bold pt-2 border-t text-sm sm:text-base">
                        <span>You'll receive:</span>
                        <span className="text-[#28a36a]">₦{netAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  {withdrawalError && (
                    <div className="p-2 sm:p-3 rounded-xl bg-red-50 text-red-600 text-xs sm:text-sm">{withdrawalError}</div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
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