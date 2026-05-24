"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
  ArrowLeft,
  Eye,
  TrendingUp,
  Copy,
  Wallet,
  ExternalLink,
  GraduationCap,
  CheckCircle2,
  Shield,
  DollarSign,
  Loader2,
  User,
  RefreshCw,
  Edit2,
  Clock,
  AlertCircle,
  Check,
  Banknote,
  Search,
  XCircle,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useStore } from "@/app/hooks/useStore";
import DashboardSidebar from "@/app/components/dashboard-component/DashboardSidebar";
import DashboardHeader from "@/app/components/dashboard-component/DashboardHeader";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

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

const PageDetail = () => {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { pages, getPageDetails, withdrawFromPage } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [page, setPage] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [assigningPayment, setAssigningPayment] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<
    Record<string, string>
  >({});
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const foundPage = pages.find((p) => p.id === id);
    if (foundPage) {
      setPage(foundPage);
      loadPayments(foundPage.id);
    } else if (id) {
      loadPageDetails();
    }
  }, [pages, id]);

  const loadPageDetails = async () => {
    try {
      const pageDetails = await getPageDetails(id);
      if (pageDetails) {
        setPage(pageDetails);
        await loadPayments(pageDetails.id);
      }
    } catch (error) {
      console.error("Error loading page:", error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load page details',
        confirmButtonColor: '#F5B81B',
      });
    }
  };

  const loadPayments = async (pageId: string) => {
    try {
      const { data, error } = await supabase
        .from("payment_page_payments")
        .select("*")
        .eq("payment_page_id", pageId)
        .eq("status", "completed")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading payments:", error);
      }

      if (data && data.length > 0) {
        setPayments(data);
      } else {
        setPayments([]);
      }
    } catch (error) {
      console.error("Error loading payments:", error);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadPageDetails();
    setRefreshing(false);
  };

 const handleWithdraw = async () => {
  try {
    const { value: amount, isConfirmed } = await Swal.fire<number>({
      title: 'Withdraw Funds',
      html: `
        <div class="text-left">
          <p class="mb-2">Available balance: <strong>₦${(page.pageBalance || 0).toLocaleString()}</strong></p>
          <p class="text-sm text-gray-600">Minimum withdrawal: ₦1,000</p>
          <p class="text-sm text-gray-600">Withdrawal fee: ₦200</p>
        </div>
      `,
      input: 'number',
      inputLabel: 'Enter amount to withdraw',
      inputPlaceholder: 'Enter amount',
      inputValue: '1000',
      inputAttributes: {
        min: '1000',
        max: String(page.pageBalance || 0),
        step: '100',
      },
      showCancelButton: true,
      confirmButtonColor: '#F5B81B',
      confirmButtonText: 'Withdraw',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        const numAmount = Number(value);
        if (!value || isNaN(numAmount) || numAmount <= 0) {
          return 'Please enter a valid amount';
        }
        if (numAmount < 1000) {
          return 'Minimum withdrawal amount is ₦1,000';
        }
        if (numAmount > (page.pageBalance || 0)) {
          return `Maximum withdrawal amount is ₦${(page.pageBalance || 0).toLocaleString()}`;
        }
        return null;
      }
    });

    if (isConfirmed && amount) {
      setWithdrawing(true);
      
      const withdrawAmount = Number(amount);
      
      // Show loading toast
      Swal.fire({
        title: 'Processing...',
        text: 'Please wait while we process your withdrawal',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      await withdrawFromPage(page.id, withdrawAmount);
      
      await Swal.fire({
        icon: 'success',
        title: 'Withdrawal Initiated!',
        html: `
          <div class="text-left">
            <p>✅ ₦${withdrawAmount.toLocaleString()} has been withdrawn successfully.</p>
            <p class="text-sm text-gray-600 mt-2">Funds will be sent to your wallet shortly.</p>
          </div>
        `,
        confirmButtonColor: '#F5B81B',
      });
      
      refreshData();
    }
  } catch (error: any) {
    console.error('Withdrawal error:', error);
    await Swal.fire({
      icon: 'error',
      title: 'Withdrawal Failed',
      html: `
        <div class="text-left">
          <p>${error.message || 'Please try again later.'}</p>
          <p class="text-sm text-gray-600 mt-2">If the problem persists, contact support.</p>
        </div>
      `,
      confirmButtonColor: '#F5B81B',
    });
  } finally {
    setWithdrawing(false);
  }
};
  const assignPaymentToStudent = async (
    paymentId: string,
    studentName: string,
    amount: number,
  ) => {
    if (!studentName) {
      await Swal.fire({
        icon: 'warning',
        title: 'Select Student',
        text: 'Please select a student to assign this payment to.',
        confirmButtonColor: '#F5B81B',
      });
      return;
    }

    setAssigningPayment(paymentId);

    try {
      const response = await fetch('/api/payment-page/assign-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId,
          studentName,
          amount,
          pageId: page?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign payment');
      }

      await Swal.fire({
        icon: 'success',
        title: 'Payment Assigned!',
        html: `
          <div class="text-left">
            <p class="mb-2">✅ ${data.message}</p>
            <p class="text-sm text-gray-600 mt-2">
              <strong>Student:</strong> ${studentName}<br>
              <strong>Amount:</strong> ₦${amount.toLocaleString()}<br>
              ${data.data.isFullyPaid ? '<span class="text-green-600">🎉 Student is now fully paid!</span>' : `<span class="text-yellow-600">Remaining: ₦${data.data.remainingAmount.toLocaleString()}</span>`}
            </p>
          </div>
        `,
        confirmButtonColor: '#F5B81B',
      });

      await loadPayments(page.id);
      await loadPageDetails();
      
      // Clear selected student for this payment
      setSelectedStudent((prev) => ({ ...prev, [paymentId]: "" }));
      
    } catch (error: any) {
      console.error("Error assigning payment:", error);
      await Swal.fire({
        icon: 'error',
        title: 'Assignment Failed',
        text: error.message || 'Failed to assign payment. Please try again.',
        confirmButtonColor: '#F5B81B',
      });
    } finally {
      setAssigningPayment(null);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    await Swal.fire({
      icon: 'success',
      title: 'Copied!',
      text: `${label} copied to clipboard`,
      timer: 1500,
      showConfirmButton: false,
      toast: true,
      position: 'top-end',
    });
  };

  if (!page) {
    return (
      <div className="min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent-yellow)]" />
      </div>
    );
  }

  const students = page.metadata?.students || [];

  const studentsWithStatus = students.map((student: any) => {
    const totalAmount = page.price || 0;
    const paidAmount = student.paidAmount || 0;
    const isFullyPaid = paidAmount >= totalAmount;
    const isPartiallyPaid = paidAmount > 0 && !isFullyPaid;

    return {
      ...student,
      totalAmount,
      paidAmount,
      isFullyPaid,
      isPartiallyPaid,
      remainingAmount: totalAmount - paidAmount,
    };
  });

  const filteredStudents = studentsWithStatus.filter((student: any) =>
    student.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const assignedPayments = payments.filter((p) => {
    const metadata = p.metadata || {};
    return metadata.matched_student || metadata.assigned_student;
  });

  const unassignedPayments = payments.filter((p) => {
    const metadata = p.metadata || {};
    return !metadata.matched_student && !metadata.assigned_student;
  });

  const paidStudents = studentsWithStatus.filter((s: any) => s.isFullyPaid);
  const partiallyPaidStudents = studentsWithStatus.filter(
    (s: any) => s.isPartiallyPaid,
  );
  const unpaidStudents = studentsWithStatus.filter(
    (s: any) => !s.isFullyPaid && !s.isPartiallyPaid,
  );

  const totalCollected = studentsWithStatus.reduce(
    (sum: number, s: any) => sum + (s.paidAmount || 0),
    0,
  );
  const totalExpected = students.length * (page.price || 0);
  const availableStudents = studentsWithStatus.filter(
    (s: any) => !s.isFullyPaid,
  );

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)]">
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="lg:pl-72 min-h-screen flex flex-col">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--color-accent-yellow)] transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                onClick={refreshData}
                disabled={refreshing}
                className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--color-accent-yellow)] transition-colors"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />{" "}
                Refresh
              </button>
            </div>

            {/* Page Info */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                {page.logo && (
                  <img
                    src={page.logo}
                    className="h-12 w-12 md:h-16 md:w-16 rounded-xl object-cover"
                    alt="Logo"
                  />
                )}
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">
                    {page.title}
                  </h1>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {typeLabels[page.pageType]}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Link href={`/dashboard/services/payment/edit/${page.id}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                  >
                    <Edit2 className="h-4 w-4 mr-1" /> Edit
                  </Button>
                </Link>
                <Link href={`/pay/${page.slug}`} target="_blank">
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" /> View
                  </Button>
                </Link>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
                <Eye className="h-4 w-4 text-[var(--color-accent-yellow)] mb-2" />
                <p className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">
                  {page.pageViews || 0}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">Views</p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
                <DollarSign className="h-4 w-4 text-[var(--color-lemon-green)] mb-2" />
                <p className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">
                  ₦{totalCollected.toLocaleString()}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  Collected
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
                <Wallet className="h-4 w-4 text-[var(--color-accent-yellow)] mb-2" />
                <p className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">
                  ₦{(page.pageBalance || 0).toLocaleString()}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">Balance</p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
                <TrendingUp className="h-4 w-4 text-[var(--color-lemon-green)] mb-2" />
                <p className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">
                  {payments.length}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">Payments</p>
              </div>
            </div>

            {/* Progress Summary */}
            <div className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] p-5">
              <h3 className="font-semibold text-[var(--text-primary)] mb-3">
                Payment Progress
              </h3>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[var(--text-secondary)]">
                  Overall Progress
                </span>
                <span className="text-[var(--text-primary)]">
                  ₦{totalCollected.toLocaleString()} of ₦
                  {totalExpected.toLocaleString()}
                </span>
              </div>
              <div className="w-full h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--color-accent-yellow)] rounded-full transition-all duration-300"
                  style={{
                    width: `${totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4 text-center">
                <div>
                  <p className="text-xl md:text-2xl font-bold text-[var(--color-lemon-green)]">
                    {paidStudents.length}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Fully Paid
                  </p>
                </div>
                <div>
                  <p className="text-xl md:text-2xl font-bold text-yellow-500">
                    {partiallyPaidStudents.length}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Partially Paid
                  </p>
                </div>
                <div>
                  <p className="text-xl md:text-2xl font-bold text-[var(--text-secondary)]">
                    {unpaidStudents.length}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">Unpaid</p>
                </div>
              </div>
            </div>

            {/* Unassigned Payments Section */}
            {unassignedPayments.length > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800 overflow-hidden">
                <div className="p-4 border-b border-yellow-200 dark:border-yellow-800 bg-yellow-100 dark:bg-yellow-900/30">
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-400 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Unassigned Payments ({unassignedPayments.length})
                  </h3>
                  <p className="text-xs text-yellow-600 dark:text-yellow-500/80 mt-1">
                    These payments don't have a student name. Please assign them
                    to the correct student.
                  </p>
                </div>
                <div className="divide-y divide-yellow-200 dark:divide-yellow-800 max-h-[500px] overflow-y-auto custom-scrollbar">
                  {unassignedPayments.map((payment: any) => {
                    const bankName =
                      page.metadata?.virtual_account?.bankName || "Nombank MFB";
                    const accountNumber =
                      page.metadata?.virtual_account?.accountNumber || "N/A";
                    const narration = payment.metadata?.narration || "";
                    const paymentAmount = payment.amount || 0;
                    const senderName = payment.customer_name || "Unknown";
                    const paymentDate = payment.paid_at || payment.created_at;

                    let suggestedStudent = null;
                    if (narration) {
                      const lowerNarration = narration.toLowerCase();
                      const matchingStudent = availableStudents.find((s) =>
                        lowerNarration.includes(s.name.toLowerCase()),
                      );
                      if (matchingStudent) {
                        suggestedStudent = matchingStudent.name;
                      }
                    }

                    return (
                      <div key={payment.id} className="p-4">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <p className="font-bold text-[var(--color-accent-yellow)] text-lg">
                                ₦{paymentAmount.toLocaleString()}
                              </p>
                              <span className="text-xs bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-full whitespace-nowrap">
                                Unassigned
                              </span>
                            </div>
                            <p className="text-xs text-[var(--text-secondary)]">
                              {new Date(paymentDate).toLocaleDateString()} at{" "}
                              {new Date(paymentDate).toLocaleTimeString()}
                            </p>
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center gap-2 text-sm flex-wrap">
                                <User className="h-3 w-3 text-yellow-600 dark:text-yellow-500 shrink-0" />
                                <span className="text-[var(--text-primary)]">
                                  Sender: {senderName}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm flex-wrap">
                                <Banknote className="h-3 w-3 text-yellow-600 dark:text-yellow-500 shrink-0" />
                                <span className="text-[var(--text-primary)]">
                                  Bank: {bankName}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm flex-wrap">
                                <Shield className="h-3 w-3 text-yellow-600 dark:text-yellow-500 shrink-0" />
                                <span className="text-[var(--text-primary)] font-mono">
                                  Account: {accountNumber}
                                </span>
                              </div>
                              {narration && (
                                <div className="mt-2 p-2 bg-[var(--bg-secondary)] rounded-lg">
                                  <p className="text-xs text-[var(--text-secondary)] break-words">
                                    📝 Narration: "{narration}"
                                  </p>
                                  {suggestedStudent && (
                                    <p className="text-xs text-green-600 mt-1">
                                      💡 Suggested student: {suggestedStudent}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="w-full md:w-72 mt-4 md:mt-0">
                            <label className="text-xs text-[var(--text-secondary)] block mb-2">
                              Assign to student:
                            </label>
                            <div className="flex gap-2">
                              <select
                                value={
                                  selectedStudent[payment.id] ||
                                  suggestedStudent ||
                                  ""
                                }
                                onChange={(e) =>
                                  setSelectedStudent((prev) => ({
                                    ...prev,
                                    [payment.id]: e.target.value,
                                  }))
                                }
                                className="flex-1 px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--color-accent-yellow)]"
                              >
                                <option value="">Select student...</option>
                                {availableStudents.map((student: any) => (
                                  <option
                                    key={student.name}
                                    value={student.name}
                                  >
                                    {student.name} (Remaining: ₦
                                    {student.remainingAmount.toLocaleString()})
                                  </option>
                                ))}
                              </select>
                              <Button
                                onClick={() =>
                                  assignPaymentToStudent(
                                    payment.id,
                                    selectedStudent[payment.id] ||
                                      suggestedStudent,
                                    paymentAmount,
                                  )
                                }
                                disabled={
                                  (!selectedStudent[payment.id] &&
                                    !suggestedStudent) ||
                                  assigningPayment === payment.id
                                }
                                size="sm"
                                className="bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90 whitespace-nowrap"
                              >
                                {assigningPayment === payment.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Check className="h-4 w-4 mr-1" /> Assign
                                  </>
                                )}
                              </Button>
                            </div>
                            {availableStudents.length === 0 && (
                              <p className="text-xs text-red-500 dark:text-red-400 mt-2">
                                No available students to assign
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {unassignedPayments.length === 0 && payments.length > 0 && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center border border-green-200 dark:border-green-800">
                <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-green-700 dark:text-green-400">
                  All payments have been assigned to students!
                </p>
              </div>
            )}

            {payments.length === 0 && (
              <div className="bg-gray-50 dark:bg-gray-900/20 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-800">
                <Banknote className="h-12 w-12 mx-auto mb-3 text-gray-400 opacity-50" />
                <p className="text-gray-600 dark:text-gray-400">
                  No payments have been made yet
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Share your payment page to start receiving payments
                </p>
              </div>
            )}

            {/* Students & Assigned Payments */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Student List */}
              <div className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] overflow-hidden">
                <div className="p-4 border-b border-[var(--border-color)]">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-[var(--color-accent-yellow)]" />
                      All Students ({students.length})
                    </h3>

                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
                      <input
                        type="text"
                        placeholder="Search student..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 text-sm bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--color-accent-yellow)]"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          <XCircle className="h-4 w-4 text-[var(--text-secondary)] hover:text-[var(--color-accent-yellow)]" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-[var(--border-color)] max-h-[600px] overflow-y-auto custom-scrollbar">
                  {filteredStudents.length === 0 ? (
                    <div className="p-8 text-center text-[var(--text-secondary)]">
                      {searchQuery ? (
                        <>
                          <Search className="h-10 w-10 mx-auto mb-2 opacity-30" />
                          <p>No students found matching "{searchQuery}"</p>
                        </>
                      ) : (
                        <>
                          <GraduationCap className="h-10 w-10 mx-auto mb-2 opacity-30" />
                          <p>No students added yet</p>
                        </>
                      )}
                    </div>
                  ) : (
                    filteredStudents.map((student: any, idx: number) => {
                      const totalAmount = student.totalAmount;
                      const paidAmount = student.paidAmount;
                      const percentage =
                        totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

                      return (
                        <div key={idx} className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium text-[var(--text-primary)]">
                                {student.name}
                              </p>
                              {student.className && (
                                <p className="text-xs text-[var(--text-secondary)]">
                                  📚 Class: {student.className}
                                </p>
                              )}
                              {student.regNumber && (
                                <p className="text-xs text-[var(--text-secondary)]">
                                  🔢 Reg: {student.regNumber}
                                </p>
                              )}
                            </div>
                            {student.isFullyPaid ? (
                              <span className="text-xs bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap">
                                <CheckCircle2 className="h-3 w-3" /> PAID
                              </span>
                            ) : student.isPartiallyPaid ? (
                              <span className="text-xs bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap">
                                <Clock className="h-3 w-3" /> PARTIAL
                              </span>
                            ) : (
                              <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full whitespace-nowrap">
                                PENDING
                              </span>
                            )}
                          </div>

                          <div className="mt-3">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-[var(--text-secondary)]">
                                Paid {paidAmount.toLocaleString()} of{" "}
                                {totalAmount.toLocaleString()}
                              </span>
                              <span className="text-[var(--color-accent-yellow)]">
                                {percentage.toFixed(0)}%
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[var(--color-accent-yellow)] rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>

                          {student.parentName && (
                            <p className="text-xs text-[var(--text-secondary)] mt-2">
                              Paid by: {student.parentName}
                            </p>
                          )}
                          {student.paidAt && (
                            <p className="text-xs text-[var(--text-secondary)] mt-1">
                              {new Date(student.paidAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Assigned Payments */}
              <div className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] overflow-hidden">
                <div className="p-4 border-b border-[var(--border-color)]">
                  <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[var(--color-lemon-green)]" />
                    Assigned Payments ({assignedPayments.length})
                  </h3>
                </div>
                <div className="divide-y divide-[var(--border-color)] max-h-[600px] overflow-y-auto custom-scrollbar">
                  {assignedPayments.length === 0 ? (
                    <div className="p-8 text-center text-[var(--text-secondary)]">
                      <CheckCircle2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p>No assigned payments yet</p>
                    </div>
                  ) : (
                    assignedPayments.map((payment: any) => {
                      const matchedStudent =
                        payment.metadata?.matched_student ||
                        payment.metadata?.assigned_student;
                      const narration = payment.metadata?.narration || "";
                      const totalFee =
                        (payment.metadata?.app_fee || 0) +
                        (payment.metadata?.nomba_fee || 0);
                      const paymentDate = payment.paid_at || payment.created_at;

                      return (
                        <div key={payment.id} className="p-4">
                          <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
                            <div>
                              <p className="font-bold text-[var(--color-lemon-green)] text-lg">
                                ₦{payment.amount?.toLocaleString()}
                              </p>
                              <p className="text-xs text-[var(--text-secondary)]">
                                {new Date(paymentDate).toLocaleDateString()} at{" "}
                                {new Date(paymentDate).toLocaleTimeString()}
                              </p>
                            </div>
                            <button
                              onClick={() => copyToClipboard(payment.id, "Payment ID")}
                              className="text-[var(--text-secondary)] hover:text-[var(--color-accent-yellow)] transition-colors"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-3 w-3 text-[var(--color-accent-yellow)]" />
                            <span className="text-[var(--text-primary)]">
                              {payment.customer_name || "Anonymous"}
                            </span>
                          </div>

                          {matchedStudent && (
                            <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                              <p className="text-xs text-green-700 dark:text-green-400 break-words">
                                ✓ Assigned to: <strong>{matchedStudent}</strong>
                              </p>
                            </div>
                          )}

                          {totalFee > 0 && (
                            <div className="mt-2 text-xs text-[var(--text-secondary)]">
                              <span>Fee: ₦{totalFee.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Virtual Account Info */}
            {page.metadata?.virtual_account && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                      Payment Account
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2 text-sm">
                      <div>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          Bank
                        </p>
                        <p className="font-medium text-[var(--text-primary)] break-words">
                          {page.metadata.virtual_account.bankName}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          Account Number
                        </p>
                        <p 
                          className="font-mono font-bold text-[var(--text-primary)] break-words cursor-pointer hover:text-[var(--color-accent-yellow)]"
                          onClick={() => copyToClipboard(page.metadata.virtual_account.accountNumber, "Account Number")}
                        >
                          {page.metadata.virtual_account.accountNumber}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          Account Name
                        </p>
                        <p className="text-[var(--text-primary)] truncate">
                          {page.metadata.virtual_account.bankAccountName}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                      💡 Ask customers to add{" "}
                      <strong className="text-blue-800 dark:text-blue-300">
                        student name
                      </strong>{" "}
                      as narration
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Withdraw Button */}
            {page.pageBalance > 0 && (
              <div className="bg-gradient-to-r from-[var(--color-ink)] to-[#1a5c40] rounded-xl p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-sm text-white/80">Available Balance</p>
                    <p className="text-2xl md:text-3xl font-bold text-white">
                      ₦{page.pageBalance.toLocaleString()}
                    </p>
                    <p className="text-xs text-white/60 mt-1">
                      Withdraw to main wallet (₦200 fee)
                    </p>
                  </div>
                  <Button
                    onClick={handleWithdraw}
                    disabled={withdrawing}
                    className="bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90 font-semibold"
                  >
                    {withdrawing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Wallet className="h-4 w-4 mr-2" />
                    )}
                    {withdrawing ? "Processing..." : "Withdraw Funds"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: var(--bg-secondary);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--color-accent-yellow);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #c9a832;
        }
      `}</style>
    </div>
  );
};

export default PageDetail;