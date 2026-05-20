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
  Check,
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
  Package,
  Heart,
  Briefcase,
  Building2,
  LineChart,
  PiggyBank,
  Bitcoin,
  FileDown,
  MoreVertical,
  Edit2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useStore, isInvestmentType } from "@/app/hooks/useStore";
import DashboardSidebar from "@/app/components/dashboard-component/DashboardSidebar";
import DashboardHeader from "@/app/components/dashboard-component/DashboardHeader";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

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

// Get payer label based on page type
const getPayerLabel = (pageType: string): string => {
  switch (pageType) {
    case "school":
      return "Parent";
    case "donation":
      return "Donor";
    case "physical":
      return "Customer";
    case "digital":
      return "Customer";
    case "services":
      return "Client";
    case "real_estate":
      return "Investor";
    case "stock":
      return "Investor";
    case "savings":
      return "Saver";
    case "crypto":
      return "Investor";
    default:
      return "Customer";
  }
};

// Get recipient label based on page type
const getRecipientLabel = (pageType: string): string => {
  switch (pageType) {
    case "school":
      return "Student";
    case "donation":
      return "Beneficiary";
    case "physical":
      return "Product";
    case "digital":
      return "Product";
    case "services":
      return "Service";
    case "real_estate":
      return "Property";
    case "stock":
      return "Investment";
    case "savings":
      return "Savings Plan";
    case "crypto":
      return "Crypto Asset";
    default:
      return "Item";
  }
};

// Get icon for page type
const getPageTypeIcon = (pageType: string) => {
  switch (pageType) {
    case "school":
      return <GraduationCap className="h-4 w-4 text-(--color-accent-yellow)" />;
    case "donation":
      return <Heart className="h-4 w-4 text-(--color-accent-yellow)" />;
    case "physical":
      return <Package className="h-4 w-4 text-(--color-accent-yellow)" />;
    case "digital":
      return <FileDown className="h-4 w-4 text-(--color-accent-yellow)" />;
    case "services":
      return <Briefcase className="h-4 w-4 text-(--color-accent-yellow)" />;
    case "real_estate":
      return <Building2 className="h-4 w-4 text-(--color-accent-yellow)" />;
    case "stock":
      return <LineChart className="h-4 w-4 text-(--color-accent-yellow)" />;
    case "savings":
      return <PiggyBank className="h-4 w-4 text-(--color-accent-yellow)" />;
    case "crypto":
      return <Bitcoin className="h-4 w-4 text-(--color-accent-yellow)" />;
    default:
      return <CreditCard className="h-4 w-4 text-(--color-accent-yellow)" />;
  }
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
  const [updatingStudent, setUpdatingStudent] = useState(false);
  const [acknowledgingPayment, setAcknowledgingPayment] = useState<
    string | null
  >(null);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Add copy function
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };
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

  const refreshData = async () => {
    setRefreshing(true);
    await loadPageDetails();
    setRefreshing(false);
  };

  // Get child/student name from payment metadata
  const getStudentName = (payment: any) => {
    if (payment.metadata?.childName) return payment.metadata.childName;
    if (payment.metadata?.studentName) return payment.metadata.studentName;
    if (payment.metadata?.student_name) return payment.metadata.student_name;
    if (payment.metadata?.matched_student)
      return payment.metadata.matched_student;
    return null;
  };

  // Get product name from payment metadata
  const getProductName = (payment: any) => {
    if (payment.metadata?.productName) return payment.metadata.productName;
    if (payment.metadata?.selectedVariants) {
      const variants = Object.values(payment.metadata.selectedVariants);
      if (variants.length > 0) return variants.join(" - ");
    }
    if (payment.metadata?.quantity)
      return `Quantity: ${payment.metadata.quantity}`;
    return null;
  };

  // Get payer name from payment
  const getPayerName = (payment: any) => {
    return payment.customer_name || payment.customerName || "Anonymous";
  };

  // Get payer email
  const getPayerEmail = (payment: any) => {
    return payment.customer_email || payment.customerEmail;
  };

  // Get narration from payment
  const getNarration = (payment: any) => {
    return (
      payment.metadata?.narration || payment.metadata?.bank_narration || ""
    );
  };

  // Check if payment has been acknowledged
  const isPaymentAcknowledged = (payment: any): boolean => {
    return !!payment.metadata?.acknowledged_student;
  };

  // Extract student name from narration
  const extractStudentFromNarration = (payment: any): string | null => {
    if (payment.metadata?.matched_student)
      return payment.metadata.matched_student;

    const narration = getNarration(payment);
    if (!narration) return null;

    const students = page?.metadata?.students || [];
    for (const student of students) {
      const studentName =
        student.name || student.childName || student.studentName;
      if (
        studentName &&
        narration.toLowerCase().includes(studentName.toLowerCase())
      ) {
        return studentName;
      }
    }
    return null;
  };

  // Acknowledge payment and mark student as paid
  const acknowledgePaymentAndMarkStudent = async (
    payment: any,
    studentName: string,
  ) => {
    setAcknowledgingPayment(payment.id);
    setUpdatingStudent(true);

    try {
      // Update payment metadata
      const { error: updatePaymentError } = await supabase
        .from("payment_page_payments")
        .update({
          metadata: {
            ...payment.metadata,
            acknowledged_student: studentName,
            acknowledged_at: new Date().toISOString(),
            acknowledged_by: "merchant",
          },
        })
        .eq("id", payment.id);

      if (updatePaymentError) throw updatePaymentError;

      // Update student paid status in page metadata
      const currentStudents = page?.metadata?.students || [];
      const updatedStudents = currentStudents.map((student: any) => {
        const studentIdentifier =
          student.name || student.childName || student.studentName;
        if (studentIdentifier === studentName) {
          const currentPaidAmount = student.paidAmount || 0;
          const newPaidAmount = currentPaidAmount + payment.amount;
          return {
            ...student,
            paid: true,
            paidAt: new Date().toISOString(),
            paidAmount: newPaidAmount,
            parentName: payment.customer_name,
            paymentId: payment.id,
            lastPaymentDate: new Date().toISOString(),
          };
        }
        return student;
      });

      const { error: updatePageError } = await supabase
        .from("payment_pages")
        .update({
          metadata: {
            ...page?.metadata,
            students: updatedStudents,
          },
        })
        .eq("id", page?.id);

      if (updatePageError) throw updatePageError;

      // Refresh data
      await loadPageDetails();
      alert(`✅ Successfully marked "${studentName}" as paid!`);
    } catch (error) {
      console.error("Error acknowledging payment:", error);
      alert("Failed to mark student as paid. Please try again.");
    } finally {
      setAcknowledgingPayment(null);
      setUpdatingStudent(false);
    }
  };

  // Toggle student paid status directly
  const toggleStudentPaidStatus = async (student: any, isPaid: boolean) => {
    setUpdatingStudent(true);

    try {
      const currentStudents = page?.metadata?.students || [];
      const updatedStudents = currentStudents.map((s: any) => {
        const studentIdentifier = s.name || s.childName || s.studentName;
        if (studentIdentifier === (student.name || student.childName)) {
          return {
            ...s,
            paid: isPaid,
            paidAt: isPaid ? new Date().toISOString() : null,
            paidAmount: isPaid
              ? s.paidAmount || s.totalAmount || page?.price || 0
              : 0,
          };
        }
        return s;
      });

      const { error } = await supabase
        .from("payment_pages")
        .update({
          metadata: {
            ...page?.metadata,
            students: updatedStudents,
          },
        })
        .eq("id", page?.id);

      if (error) throw error;

      await loadPageDetails();
      alert(`✅ Student marked as ${isPaid ? "paid" : "unpaid"}`);
    } catch (error) {
      console.error("Error updating student status:", error);
      alert("Failed to update student status");
    } finally {
      setUpdatingStudent(false);
    }
  };

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
      await withdrawFromPage(page.id, amount);
      setWithdrawalSuccess(true);
      setTimeout(() => {
        setShowWithdrawal(false);
        setWithdrawalSuccess(false);
        setWithdrawalAmount("");
        refreshData();
      }, 2000);
    } catch (err: any) {
      setWithdrawalError(err.message);
    } finally {
      setWithdrawing(false);
    }
  };

  const withdrawalFee = 200;
  const netAmount = Number(withdrawalAmount) - withdrawalFee;

  const students = page?.metadata?.students || [];
  const paidStudentsCount = students.filter(
    (student: any) => student.paid === true,
  ).length;
  const unpaidStudentsCount = students.length - paidStudentsCount;
  const totalPaidAmount = students.reduce((total: number, student: any) => {
    return total + (student.paidAmount || 0);
  }, 0);

  if (!page) {
    return (
      <div className="min-h-screen bg-(--bg-secondary) dark:bg-[#0e0e0e] flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-bold text-(--text-primary) mb-2">
            Page not found
          </h1>
          <Button
            variant="default"
            onClick={() => router.push("/dashboard/services/payment/dashboard")}
            className="bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const pageUrl = `zidwell.com/pay/${page.slug}`;
  const payerLabel = getPayerLabel(page.pageType);
  const recipientLabel = getRecipientLabel(page.pageType);
  const pageTypeIcon = getPageTypeIcon(page.pageType);
  const isSchoolPage = page.pageType === "school";

  const statsCards = [
    {
      label: "Page Views",
      value: page.pageViews || 0,
      icon: Eye,
      color: "text-(--color-accent-yellow)",
    },
    {
      label: "Total Payments",
      value: page.totalPayments || 0,
      icon: CreditCard,
      color: "text-(--color-lemon-green)",
    },
    {
      label: "Page Balance",
      value: `₦${(page.pageBalance || 0).toLocaleString()}`,
      icon: Wallet,
      color: "text-(--color-accent-yellow)",
    },
    {
      label: "Total Revenue",
      value: `₦${(page.totalRevenue || 0).toLocaleString()}`,
      icon: TrendingUp,
      color: "text-(--color-lemon-green)",
    },
  ];

  return (
    <div className="min-h-screen dark:bg-[#0e0e0e]">
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:pl-72 min-h-screen flex flex-col">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
            {/* Back Button */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm text-(--text-secondary) hover:text-(--color-accent-yellow) transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                onClick={refreshData}
                disabled={refreshing}
                className="flex items-center gap-2 text-sm text-(--text-secondary) hover:text-(--color-accent-yellow) transition-colors"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>

            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                  {page.logo ? (
                    <img
                      src={page.logo}
                      className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl object-cover"
                      alt="Logo"
                    />
                  ) : (
                    <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-(--bg-secondary) flex items-center justify-center">
                      {pageTypeIcon}
                    </div>
                  )}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                      <h1 className="text-xl sm:text-2xl font-bold wrap-break-word text-(--text-primary)">
                        {page.title}
                      </h1>
                      <span className="px-2 py-0.5 rounded-full bg-(--color-accent-yellow)/10 text-(--color-accent-yellow) text-xs font-medium self-start sm:self-center">
                        {typeLabels[page.pageType]}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <span className="text-xs sm:text-sm text-(--text-secondary) break-all">
                        {pageUrl}
                      </span>
                      <button
                        onClick={() => navigator.clipboard.writeText(pageUrl)}
                        className="text-(--text-secondary) hover:text-(--color-accent-yellow) transition-colors self-start sm:self-center"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link href={`/dashboard/services/payment/edit/${page.id}`}>
                    <Button
                      variant="outline"
                      className="border-(--border-color) text-(--text-primary) hover:bg-(--bg-secondary)"
                    >
                      <Edit2 className="h-4 w-4 mr-1" /> Edit
                    </Button>
                  </Link>
                  <Link
                    href={`/pay/${page.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      variant="default"
                      className="bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" /> View Page
                    </Button>
                  </Link>
                </div>
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
                  className="p-3 sm:p-4 rounded-2xl bg-(--bg-primary) border border-(--border-color) shadow-soft"
                >
                  <s.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${s.color} mb-2`} />
                  <div className="text-lg sm:text-2xl font-bold truncate text-(--text-primary)">
                    {s.value}
                  </div>
                  <div className="text-[10px] sm:text-xs text-(--text-secondary)">
                    {s.label}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Recent Payments with Acknowledgment */}
            <div className="bg-(--bg-primary) rounded-2xl border border-(--border-color) overflow-hidden shadow-soft">
              <div className="p-4 sm:p-5 border-b border-(--border-color)">
                <h3 className="font-bold text-base sm:text-lg flex items-center gap-2 text-(--text-primary)">
                  {pageTypeIcon}
                  Recent {typeLabels[page.pageType]} Payments
                </h3>
                <p className="text-xs sm:text-sm text-(--text-secondary) mt-1">
                  {stats.totalCount} payment{stats.totalCount !== 1 ? "s" : ""}{" "}
                  • Total: ₦{stats.totalAmount.toLocaleString()}
                </p>
                {isSchoolPage && (
                  <p className="text-xs text-(--text-secondary) mt-2">
                    💡 <strong>Tip:</strong> When customers add student names in
                    bank narration, they'll appear below for easy
                    acknowledgment.
                  </p>
                )}
              </div>
              <div className="divide-y divide-(--border-color)">
                {stats.payments.length === 0 ? (
                  <div className="p-6 sm:p-8 text-center text-(--text-secondary)">
                    <DollarSign className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm sm:text-base">No payments yet</p>
                    <p className="text-xs mt-2">
                      Share your payment page to start receiving payments
                    </p>
                  </div>
                ) : (
                  stats.payments.map((payment: any) => {
                    const payerName = getPayerName(payment);
                    const payerEmail = getPayerEmail(payment);
                    const narration = getNarration(payment);
                    const matchedStudent = payment.metadata?.matched_student;
                    const isAcknowledged = isPaymentAcknowledged(payment);
                    const extractedStudent =
                      extractStudentFromNarration(payment);
                    const paymentDate = new Date(
                      payment.paid_at || payment.created_at,
                    );
                    const isCompleted =
                      payment.status === "completed" ||
                      payment.paid_at !== null;

                    return (
                      <div
                        key={payment.id}
                        className="p-4 hover:bg-(--bg-secondary) transition-colors"
                      >
                        <div className="space-y-3">
                          {/* Header with amount and action menu */}
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-(--color-lemon-green) text-base sm:text-lg">
                                ₦{payment.amount?.toLocaleString()}
                              </p>
                              <p className="text-xs text-(--text-secondary)">
                                {paymentDate.toLocaleDateString()} at{" "}
                                {paymentDate.toLocaleTimeString()}
                              </p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="p-2 hover:bg-(--bg-secondary) rounded-lg">
                                  <MoreVertical className="h-4 w-4 text-(--text-secondary)" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="bg-(--bg-primary) border border-(--border-color)"
                              >
                                <DropdownMenuItem
                                  className="cursor-pointer"
                                  onClick={() =>
                                    navigator.clipboard.writeText(payment.id)
                                  }
                                >
                                  Copy Transaction ID
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="cursor-pointer"
                                  onClick={() =>
                                    navigator.clipboard.writeText(narration)
                                  }
                                >
                                  Copy Narration
                                </DropdownMenuItem>
                                {isSchoolPage &&
                                  extractedStudent &&
                                  !isAcknowledged && (
                                    <DropdownMenuItem
                                      className="cursor-pointer text-green-600"
                                      onClick={() =>
                                        acknowledgePaymentAndMarkStudent(
                                          payment,
                                          extractedStudent,
                                        )
                                      }
                                      disabled={updatingStudent}
                                    >
                                      {acknowledgingPayment === payment.id ? (
                                        <Loader2 className="h-3 w-3 animate-spin mr-2" />
                                      ) : (
                                        <CheckCircle2 className="h-3 w-3 mr-2" />
                                      )}
                                      Mark "{extractedStudent}" as Paid
                                    </DropdownMenuItem>
                                  )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {/* Payer Info */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <User className="h-3 w-3 text-(--color-accent-yellow)" />
                            <p className="text-sm font-medium">{payerName}</p>
                            {payerEmail && (
                              <span className="text-xs text-(--text-secondary)">
                                ({payerEmail})
                              </span>
                            )}
                            {isCompleted && (
                              <span className="text-xs text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                                Completed
                              </span>
                            )}
                          </div>

                          {/* Recipient Info for School Pages */}
                          {isSchoolPage &&
                            extractedStudent &&
                            !isAcknowledged && (
                              <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                <AlertCircle className="h-3 w-3 text-yellow-600 shrink-0" />
                                <p className="text-xs text-yellow-700 flex-1">
                                  Detected student:{" "}
                                  <strong>{extractedStudent}</strong>
                                </p>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs border-yellow-300 text-yellow-700"
                                  onClick={() =>
                                    acknowledgePaymentAndMarkStudent(
                                      payment,
                                      extractedStudent,
                                    )
                                  }
                                  disabled={updatingStudent}
                                >
                                  {acknowledgingPayment === payment.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    "Mark as Paid"
                                  )}
                                </Button>
                              </div>
                            )}

                          {/* Recipient Info for non-School Pages */}
                          {!isSchoolPage && getProductName(payment) && (
                            <div className="ml-3 sm:ml-6 pl-3 sm:pl-4 border-l-2 border-(--color-accent-yellow)/30">
                              <div className="flex items-center gap-2">
                                {pageTypeIcon}
                                <p className="font-medium text-sm text-(--text-primary)">
                                  {recipientLabel}: {getProductName(payment)}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Narration - Important for tracking */}
                          {narration && (
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2">
                              <p className="text-xs text-(--text-secondary) mb-1">
                                📝 Bank Narration:
                              </p>
                              <p className="text-xs sm:text-sm font-mono text-(--text-primary) break-all">
                                "{narration}"
                              </p>
                            </div>
                          )}

                          {/* Acknowledged status */}
                          {isAcknowledged && (
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircle2 className="h-3 w-3" />
                              <p className="text-xs">
                                ✓ Marked as paid for:{" "}
                                {payment.metadata?.acknowledged_student}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Student Payment Status - Only for School Pages */}
            {isSchoolPage && students.length > 0 && (
              <div className="bg-(--bg-primary) rounded-2xl border border-(--border-color) p-4 sm:p-5 shadow-soft">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-base sm:text-lg flex items-center gap-2 text-(--text-primary)">
                    <GraduationCap className="h-4 w-4 text-(--color-accent-yellow)" />
                    Student Payment Status
                  </h3>
                  {updatingStudent && (
                    <Loader2 className="h-4 w-4 animate-spin text-(--color-accent-yellow)" />
                  )}
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-center">
                    <div className="text-lg sm:text-xl font-bold text-green-600">
                      {paidStudentsCount}
                    </div>
                    <div className="text-[10px] sm:text-xs text-(--text-secondary)">
                      Paid
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 text-center">
                    <div className="text-lg sm:text-xl font-bold text-yellow-600">
                      {unpaidStudentsCount}
                    </div>
                    <div className="text-[10px] sm:text-xs text-(--text-secondary)">
                      Unpaid
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-center">
                    <div className="text-lg sm:text-xl font-bold text-blue-600">
                      ₦{totalPaidAmount.toLocaleString()}
                    </div>
                    <div className="text-[10px] sm:text-xs text-(--text-secondary)">
                      Total Paid
                    </div>
                  </div>
                </div>

                {/* Student List with Toggle Buttons */}
                <div className="mt-4">
                  <h4 className="font-medium text-xs sm:text-sm mb-3 text-(--text-primary)">
                    Student List
                  </h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {students.map((student: any, idx: number) => {
                      const studentName =
                        student.name ||
                        student.childName ||
                        student.studentName;
                      const hasPaid = student.paid === true;
                      const paidAmount = student.paidAmount || 0;
                      const paidDate = student.paidAt
                        ? new Date(student.paidAt).toLocaleDateString()
                        : null;
                      const parentName = student.parentName;
                      const expectedAmount =
                        student.totalAmount || page.price || 0;

                      return (
                        <div
                          key={idx}
                          className={`flex flex-col p-3 rounded-lg gap-2 transition-all ${
                            hasPaid
                              ? "bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800"
                              : "bg-(--bg-secondary) border border-transparent"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <GraduationCap
                                  className={`h-3 w-3 sm:h-4 sm:w-4 ${hasPaid ? "text-green-600" : "text-(--text-secondary)"}`}
                                />
                                <p className="font-medium text-xs sm:text-sm text-(--text-primary)">
                                  {studentName}
                                </p>
                                {hasPaid && (
                                  <span className="text-[10px] font-medium text-green-600 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded-full">
                                    Paid
                                  </span>
                                )}
                              </div>
                              {student.className && (
                                <p className="text-[10px] sm:text-xs text-(--text-secondary) ml-5 sm:ml-6 mt-0.5">
                                  📚 Class: {student.className}
                                </p>
                              )}
                              {student.regNumber && (
                                <p className="text-[10px] sm:text-xs text-(--text-secondary) ml-5 sm:ml-6">
                                  🔢 Reg: {student.regNumber}
                                </p>
                              )}
                              {hasPaid && paidAmount > 0 && (
                                <div className="ml-5 sm:ml-6 mt-1 space-y-0.5">
                                  <p className="text-[10px] sm:text-xs text-green-600">
                                    💰 Paid: ₦{paidAmount.toLocaleString()}
                                    {expectedAmount > 0 &&
                                      ` / ₦${expectedAmount.toLocaleString()}`}
                                  </p>
                                  {paidDate && (
                                    <p className="text-[10px] text-(--text-secondary) flex items-center gap-1">
                                      <Calendar className="h-2.5 w-2.5" />
                                      Paid on: {paidDate}
                                    </p>
                                  )}
                                  {parentName && (
                                    <p className="text-[10px] text-(--text-secondary) flex items-center gap-1">
                                      <User className="h-2.5 w-2.5" />
                                      Paid by: {parentName}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {hasPaid ? (
                                <button
                                  onClick={() =>
                                    toggleStudentPaidStatus(student, false)
                                  }
                                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100 text-xs"
                                  disabled={updatingStudent}
                                >
                                  <XCircle className="h-3 w-3" />
                                  Mark Unpaid
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    toggleStudentPaidStatus(student, true)
                                  }
                                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-green-50 text-green-600 hover:bg-green-100 text-xs"
                                  disabled={updatingStudent}
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                  Mark Paid
                                </button>
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
                    <p className="text-xs text-(--text-secondary) flex items-center gap-2">
                      <FileText className="h-3 w-3" />
                      {paidStudentsCount} of {students.length} students have
                      paid ₦{totalPaidAmount.toLocaleString()}
                      out of ₦
                      {(
                        students.length * (page.price || 0)
                      ).toLocaleString()}{" "}
                      expected.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Virtual Account Info */}
            {page.metadata?.virtual_account && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 sm:p-5 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm text-blue-800 dark:text-blue-300">
                      Payment Account
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                      {/* Bank Name */}
                      <div className="bg-white dark:bg-blue-900/30 rounded-lg p-2">
                        <p className="text-xs text-blue-500 mb-1">Bank</p>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            {page.metadata.virtual_account.bankName}
                          </p>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                page.metadata.virtual_account.bankName,
                                "bank",
                              )
                            }
                            className="text-blue-500 hover:text-blue-700"
                          >
                            {copiedField === "bank" ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Account Number */}
                      <div className="bg-white dark:bg-blue-900/30 rounded-lg p-2">
                        <p className="text-xs text-blue-500 mb-1">
                          Account Number
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-mono font-bold text-blue-800 dark:text-blue-200">
                            {page.metadata.virtual_account.accountNumber}
                          </p>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                page.metadata.virtual_account.accountNumber,
                                "account",
                              )
                            }
                            className="text-blue-500 hover:text-blue-700"
                          >
                            {copiedField === "account" ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Account Name */}
                      <div className="bg-white dark:bg-blue-900/30 rounded-lg p-2">
                        <p className="text-xs text-blue-500 mb-1">
                          Account Name
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-blue-800 dark:text-blue-200 truncate">
                            {page.metadata.virtual_account.bankAccountName ||
                              page.metadata.virtual_account.accountName}
                          </p>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                page.metadata.virtual_account.bankAccountName ||
                                  page.metadata.virtual_account.accountName,
                                "name",
                              )
                            }
                            className="text-blue-500 hover:text-blue-700 shrink-0 ml-2"
                          >
                            {copiedField === "name" ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-3 pt-2 border-t border-blue-200 dark:border-blue-700">
                      💡 Share this account with customers. They can transfer
                      directly. Ask them to add <strong>student name</strong> in
                      narration for easy tracking.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {/* Withdraw Button */}
            {page.pageBalance > 0 && (
              <div className="bg-(--color-ink) rounded-2xl p-4 sm:p-5 text-white">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-base sm:text-lg">
                      Available Balance
                    </h3>
                    <p className="text-2xl sm:text-3xl font-bold">
                      ₦{page.pageBalance.toLocaleString()}
                    </p>
                    <p className="text-xs sm:text-sm opacity-80 mt-1">
                      Withdraw to your main wallet (₦200 fee)
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    className="bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90 w-full sm:w-auto"
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
            className="max-w-md w-full bg-(--bg-primary) rounded-2xl mx-4 sm:mx-0 border border-(--border-color) shadow-xl"
          >
            <div className="p-4 sm:p-6 border-b border-(--border-color)">
              <h2 className="text-lg sm:text-xl font-bold text-(--text-primary)">
                Withdraw Funds
              </h2>
              <p className="text-(--text-secondary) text-xs sm:text-sm mt-1">
                Withdraw from "{page.title}" to your main wallet
              </p>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              {withdrawalSuccess ? (
                <div className="text-center py-6 sm:py-8">
                  <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-(--text-primary) mb-2">
                    Withdrawal Successful!
                  </h3>
                  <p className="text-xs sm:text-sm text-(--text-secondary)">
                    ₦{netAmount.toLocaleString()} has been transferred to your
                    main wallet.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs sm:text-sm font-medium mb-1 block text-(--text-primary)">
                      Available Balance
                    </label>
                    <p className="text-xl sm:text-2xl font-bold text-(--color-accent-yellow)">
                      ₦{page.pageBalance.toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs sm:text-sm font-medium mb-1 block text-(--text-primary)">
                      Withdrawal Amount (₦)
                    </label>
                    <input
                      type="number"
                      className="w-full p-2 sm:p-3 border border-(--border-color) rounded-xl focus:outline-none focus:ring-2 focus:ring-(--color-accent-yellow) bg-(--bg-primary) text-(--text-primary) text-sm sm:text-base"
                      placeholder="Enter amount"
                      value={withdrawalAmount}
                      onChange={(e) => setWithdrawalAmount(e.target.value)}
                      min={1000}
                      max={page.pageBalance}
                    />
                    <p className="text-[10px] sm:text-xs text-(--text-secondary) mt-1">
                      Minimum: ₦1,000 | Fee: ₦200
                    </p>
                  </div>

                  {Number(withdrawalAmount) >= 1000 && (
                    <div className="bg-(--bg-secondary) rounded-xl p-3 sm:p-4 space-y-2">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-(--text-secondary)">
                          Withdrawal amount:
                        </span>
                        <span className="text-(--text-primary)">
                          ₦{Number(withdrawalAmount).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-(--text-secondary)">
                          Processing fee:
                        </span>
                        <span className="text-(--text-primary)">
                          ₦{withdrawalFee.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold pt-2 border-t border-(--border-color) text-sm sm:text-base">
                        <span className="text-(--text-primary)">
                          You'll receive:
                        </span>
                        <span className="text-(--color-lemon-green)">
                          ₦{netAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

                  {withdrawalError && (
                    <div className="p-2 sm:p-3 rounded-xl bg-red-50 text-red-600 text-xs sm:text-sm">
                      {withdrawalError}
                    </div>
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
                      className="flex-1 bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90"
                      onClick={handleWithdraw}
                      disabled={
                        withdrawing ||
                        !withdrawalAmount ||
                        Number(withdrawalAmount) < 1000 ||
                        Number(withdrawalAmount) > page.pageBalance
                      }
                    >
                      {withdrawing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : null}
                      {withdrawing ? "Processing..." : "Confirm Withdrawal"}
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
