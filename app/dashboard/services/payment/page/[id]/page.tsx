"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
  ArrowLeft,
  Users,
  Eye,
  Wallet,
  DollarSign,
  GraduationCap,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  X,
  Copy,
  QrCode,
  Code2,
  Download,
  ExternalLink,
  Edit2,
  RefreshCw,
  Loader2,
  User,
  Mail,
  Phone,
  Calendar,
  FileText,
  TrendingUp,
  Banknote,
  CreditCard,
  Link2,
  Shield,
  Check,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useStore } from "@/app/hooks/useStore";
import { useUserContextData } from "@/app/context/userData";
import { useVerificationModal } from "@/app/context/verificationModalContext";
import DashboardSidebar from "@/app/components/dashboard-component/DashboardSidebar";
import DashboardHeader from "@/app/components/dashboard-component/DashboardHeader";
import BVNVerificationBadge from "@/app/components/BVNVerificationBadge";
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
  link: "Payment Link",
};

const PageDetail = () => {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { pages, getPageDetails, withdrawFromPage, store } = useStore();
  const { userData } = useUserContextData();
  const { openVerificationModal } = useVerificationModal();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [page, setPage] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [assigningPayment, setAssigningPayment] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showQRModal, setShowQRModal] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "paid" | "partial" | "unpaid">("all");

  const isVerified = userData?.bvnVerification === "verified";

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
        icon: "error",
        title: "Error",
        text: "Failed to load page details",
        confirmButtonColor: "#F5B81B",
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
      setPayments([]);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadPageDetails();
    setRefreshing(false);
  };

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    await Swal.fire({
      icon: "success",
      title: "Copied!",
      text: `${label} copied to clipboard`,
      timer: 1500,
      showConfirmButton: false,
      toast: true,
      position: "top-end",
    });
  };

  const handleWithdraw = async () => {
    if (!isVerified) {
      await Swal.fire({
        icon: "warning",
        title: "BVN Verification Required",
        html: `
          <div class="text-left">
            <p class="font-medium">You need to verify your BVN before you can withdraw funds.</p>
            <p class="text-sm text-gray-600 mt-2">This is required for security and regulatory compliance.</p>
          </div>
        `,
        confirmButtonColor: "#F5B81B",
        confirmButtonText: "Verify BVN Now",
        showCancelButton: true,
        cancelButtonText: "Cancel",
        cancelButtonColor: "#6b7280",
      }).then((result) => {
        if (result.isConfirmed) {
          openVerificationModal();
        }
      });
      return;
    }

    try {
      const { value: amount, isConfirmed } = await Swal.fire<number>({
        title: "Withdraw Funds",
        html: `
          <div class="text-left">
            <p class="mb-2">Available balance: <strong>₦${(page?.pageBalance || 0).toLocaleString()}</strong></p>
            <p class="text-sm text-gray-600">Minimum withdrawal: ₦1,000</p>
            <p class="text-sm text-gray-600">Withdrawal fee: ₦200</p>
          </div>
        `,
        input: "number",
        inputLabel: "Enter amount to withdraw",
        inputPlaceholder: "Enter amount",
        inputValue: "1000",
        inputAttributes: {
          min: "1000",
          max: String(page?.pageBalance || 0),
          step: "100",
        },
        showCancelButton: true,
        confirmButtonColor: "#F5B81B",
        confirmButtonText: "Withdraw",
        cancelButtonText: "Cancel",
        inputValidator: (value) => {
          const numAmount = Number(value);
          if (!value || isNaN(numAmount) || numAmount <= 0) {
            return "Please enter a valid amount";
          }
          if (numAmount < 1000) {
            return "Minimum withdrawal amount is ₦1,000";
          }
          if (numAmount > (page?.pageBalance || 0)) {
            return `Maximum withdrawal amount is ₦${(page?.pageBalance || 0).toLocaleString()}`;
          }
          return null;
        },
      });

      if (isConfirmed && amount) {
        setWithdrawing(true);
        const withdrawAmount = Number(amount);

        Swal.fire({
          title: "Processing...",
          text: "Please wait while we process your withdrawal",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        await withdrawFromPage(page?.id, withdrawAmount);

        await Swal.fire({
          icon: "success",
          title: "Withdrawal Initiated!",
          html: `
            <div class="text-left">
              <p>✅ ₦${withdrawAmount.toLocaleString()} has been withdrawn successfully.</p>
              <p class="text-sm text-gray-600 mt-2">Funds will be sent to your wallet shortly.</p>
            </div>
          `,
          confirmButtonColor: "#F5B81B",
        });

        refreshData();
      }
    } catch (error: any) {
      console.error("Withdrawal error:", error);
      await Swal.fire({
        icon: "error",
        title: "Withdrawal Failed",
        html: `<p>${error.message || "Please try again later."}</p>`,
        confirmButtonColor: "#F5B81B",
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
        icon: "warning",
        title: "Select Student",
        text: "Please select a student to assign this payment to.",
        confirmButtonColor: "#F5B81B",
      });
      return;
    }

    setAssigningPayment(paymentId);

    try {
      const response = await fetch("/api/payment-page/assign-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId,
          studentName,
          amount,
          pageId: page?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to assign payment");
      }

      await Swal.fire({
        icon: "success",
        title: "Payment Assigned!",
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
        confirmButtonColor: "#F5B81B",
      });

      await loadPayments(page.id);
      await loadPageDetails();
      setSelectedStudent((prev) => ({ ...prev, [paymentId]: "" }));
    } catch (error: any) {
      console.error("Error assigning payment:", error);
      await Swal.fire({
        icon: "error",
        title: "Assignment Failed",
        text: error.message || "Failed to assign payment. Please try again.",
        confirmButtonColor: "#F5B81B",
      });
    } finally {
      setAssigningPayment(null);
    }
  };

  const getPaymentPageUrl = () => {
    const storeSlug = page?.metadata?.storeSlug || store?.slug || '';
    return `${window.location.origin}/store/${storeSlug}/${page?.slug}`;
  };

  const getEmbedCode = () => {
    const pageUrl = getPaymentPageUrl();
    return `<a href="${pageUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 24px;background:#2563eb;color:white;text-decoration:none;border-radius:8px;font-weight:600;">Pay Now</a>`;
  };

  const copyEmbedCode = async () => {
    await copyToClipboard(getEmbedCode(), "Embed code");
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
    setShowEmbedModal(false);
  };

  const downloadQRCode = async () => {
    const pageUrl = getPaymentPageUrl();
    const qrUrl = `/api/payment-page/qrcode?url=${encodeURIComponent(pageUrl)}`;

    try {
      const response = await fetch(qrUrl);
      const svgText = await response.text();

      const blob = new Blob([svgText], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `qrcode-${page?.slug}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      await Swal.fire({
        icon: "success",
        title: "QR Code Downloaded!",
        text: "The QR code has been saved to your device.",
        timer: 2000,
        showConfirmButton: false,
      });
      setShowQRModal(false);
    } catch (error) {
      console.error("Error downloading QR code:", error);
      await Swal.fire({
        icon: "error",
        title: "Download Failed",
        text: "Could not download QR code. Please try again.",
      });
    }
  };

  const getPaymentLinkConfig = () => {
    if (page?.metadata?.linkConfig) return page.metadata.linkConfig;
    if (page?.linkConfig) return page.linkConfig;
    if (page?.metadata?.linkConfigData) {
      try {
        return typeof page.metadata.linkConfigData === 'string' 
          ? JSON.parse(page.metadata.linkConfigData) 
          : page.metadata.linkConfigData;
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  const linkConfig = getPaymentLinkConfig();

  const customers = useMemo(() => {
    if (!payments || payments.length === 0) return [];

    const customerMap = new Map();
    const fieldIdToLabel: Record<string, string> = {};
    if (linkConfig?.customFields) {
      linkConfig.customFields.forEach((field: any) => {
        fieldIdToLabel[field.id] = field.label || field.id;
      });
    }

    payments.forEach((payment) => {
      const email = payment.customer_email;
      const name = payment.customer_name || "Anonymous";
      
      let key = email;
      if (!key || key === "null" || key === "undefined") {
        key = name;
      }
      if (!key || key === "Anonymous") {
        key = `customer-${payment.id}`;
      }
      key = String(key);

      if (!customerMap.has(key)) {
        const customFields = payment.metadata?.customFields || {};
        const formattedCustomFields: Record<string, any> = {};
        
        Object.entries(customFields).forEach(([fieldKey, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            const label = fieldIdToLabel[fieldKey] || fieldKey;
            formattedCustomFields[label] = value;
          }
        });

        customerMap.set(key, {
          name: name,
          email: email,
          phone: payment.customer_phone || null,
          totalPaid: 0,
          payments: [],
          firstPayment: payment.paid_at || payment.created_at || new Date().toISOString(),
          lastPayment: payment.paid_at || payment.created_at || new Date().toISOString(),
          customFields: formattedCustomFields,
          referenceCode: payment.metadata?.referenceCode || payment.transfer_reference || payment.order_reference || null,
          narration: payment.metadata?.narration || null,
          paymentMethod: payment.payment_method || null,
        });
      }

      const customer = customerMap.get(key);
      const amount = payment.total_amount || payment.amount || 0;
      customer.totalPaid += amount;
      customer.payments.push(payment);

      const paymentDate = payment.paid_at || payment.created_at || new Date().toISOString();
      if (paymentDate > customer.lastPayment) {
        customer.lastPayment = paymentDate;
      }
      if (paymentDate < customer.firstPayment) {
        customer.firstPayment = paymentDate;
      }
    });

    return Array.from(customerMap.values()).sort((a, b) => b.totalPaid - a.totalPaid);
  }, [payments, linkConfig]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearchQuery.trim()) return customers;
    const query = customerSearchQuery.toLowerCase().trim();
    return customers.filter((customer) => {
      return (
        customer.name.toLowerCase().includes(query) ||
        (customer.email && customer.email.toLowerCase().includes(query)) ||
        (customer.phone && customer.phone.includes(query))
      );
    });
  }, [customers, customerSearchQuery]);

  const studentPaymentMap = useMemo(() => {
    const map = new Map<string, { paidAmount: number; parentName?: string; lastPaidAt?: string; payments: any[] }>();
    
    payments.forEach((payment) => {
      let studentName = null;
      
      if (payment.student_name) {
        studentName = payment.student_name;
      } else if (payment.metadata?.selectedStudents && payment.metadata.selectedStudents.length > 0) {
        studentName = payment.metadata.selectedStudents[0];
      } else if (payment.metadata?.matched_student) {
        studentName = payment.metadata.matched_student;
      } else if (payment.metadata?.assigned_student) {
        studentName = payment.metadata.assigned_student;
      }
      
      if (studentName) {
        const existing = map.get(studentName) || { paidAmount: 0, parentName: null, lastPaidAt: null, payments: [] };
        existing.paidAmount += (payment.amount || 0);
        existing.payments.push(payment);
        
        if (payment.customer_name && !existing.parentName) {
          existing.parentName = payment.customer_name;
        }
        
        const paymentDate = payment.paid_at || payment.confirmed_at || payment.created_at;
        if (paymentDate && (!existing.lastPaidAt || paymentDate > existing.lastPaidAt)) {
          existing.lastPaidAt = paymentDate;
        }
        
        map.set(studentName, existing);
      }
    });
    
    return map;
  }, [payments]);

  const studentsWithStatus = useMemo(() => {
    const rawStudents = page?.metadata?.students || [];
    
    if (!rawStudents || rawStudents.length === 0) {
      return [];
    }
    
    return rawStudents.map((student: any) => {
      const totalAmount = page?.price || 0;
      const studentName = student.name || student.studentName || "";
      
      const paymentData = studentPaymentMap.get(studentName);
      const paidAmount = paymentData?.paidAmount || Number(student.paidAmount) || 0;
      const parentName = paymentData?.parentName || student.parentName || null;
      const lastPaidAt = paymentData?.lastPaidAt || student.lastPaidAt || student.paidAt || null;
      const paymentCount = paymentData?.payments?.length || 0;
      
      const isFullyPaid = paidAmount >= totalAmount && totalAmount > 0;
      const isPartiallyPaid = paidAmount > 0 && !isFullyPaid && totalAmount > 0;
      const remainingAmount = Math.max(0, totalAmount - paidAmount);
      const percentage = totalAmount > 0 ? Math.min(100, (paidAmount / totalAmount) * 100) : 0;
      
      return {
        ...student,
        name: studentName,
        className: student.className || student.class || "",
        regNumber: student.regNumber || student.regNumber || "",
        totalAmount,
        paidAmount,
        remainingAmount,
        isFullyPaid,
        isPartiallyPaid,
        percentage,
        parentName: parentName || student.parentName || null,
        paidAt: lastPaidAt,
        paymentCount,
        payments: paymentData?.payments || [],
      };
    });
  }, [page?.metadata?.students, page?.price, studentPaymentMap]);

  let filteredStudents = studentsWithStatus;
  
  if (searchQuery) {
    filteredStudents = filteredStudents.filter((s: any) =>
      s.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  
  if (activeTab === "paid") {
    filteredStudents = filteredStudents.filter((s: any) => s.isFullyPaid);
  } else if (activeTab === "partial") {
    filteredStudents = filteredStudents.filter((s: any) => s.isPartiallyPaid);
  } else if (activeTab === "unpaid") {
    filteredStudents = filteredStudents.filter((s: any) => !s.isFullyPaid && !s.isPartiallyPaid);
  }

  const fullyPaidCount = studentsWithStatus.filter((s: any) => s.isFullyPaid).length;
  const partiallyPaidCount = studentsWithStatus.filter((s: any) => s.isPartiallyPaid).length;
  const unpaidCount = studentsWithStatus.filter((s: any) => !s.isFullyPaid && !s.isPartiallyPaid).length;

  const totalCollected = studentsWithStatus.reduce((sum: number, s: any) => sum + (s.paidAmount || 0), 0);
  const totalExpected = studentsWithStatus.length * (page?.price || 0);

  const unassignedPayments = payments.filter((p) => {
    return !p.student_name && !p.metadata?.matched_student && !p.metadata?.assigned_student && (!p.metadata?.selectedStudents || p.metadata.selectedStudents.length === 0);
  });

  const totalPaymentsAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  
  const pageType = page?.pageType || page?.page_type || "";
  const isSchoolPage = pageType === "school";
  const showCustomersSection = pageType === "link" || payments.length > 0;

  if (!page) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-72 min-h-screen flex flex-col">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                onClick={refreshData}
                disabled={refreshing}
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
              </button>
            </div>

            {/* Page Info */}
            <div className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                  {page.coverImage ? (
                    <img src={page.coverImage} className="h-full w-full object-cover" alt={page.title} />
                  ) : (
                    <CreditCard className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{page.title}</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {typeLabels[pageType] || pageType || "Payment Page"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/dashboard/services/payment/edit/${page.id}`}>
                  <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                    <Edit2 className="h-4 w-4 mr-1" /> Edit
                  </Button>
                </Link>
                <Link href={getPaymentPageUrl()} target="_blank">
                  <Button size="sm" className="bg-yellow-500 text-black hover:bg-yellow-600">
                    <ExternalLink className="h-4 w-4 mr-1" /> View
                  </Button>
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-800">
                <Eye className="h-5 w-5 text-gray-400 mb-2" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{page.pageViews || 0}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Views</p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-800">
                <DollarSign className="h-5 w-5 text-green-500 mb-2" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ₦{(pageType === "link" ? totalPaymentsAmount : totalCollected).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Collected</p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-800">
                <Wallet className="h-5 w-5 text-yellow-500 mb-2" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ₦{(page.pageBalance || 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Balance</p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-800">
                <Users className="h-5 w-5 text-blue-500 mb-2" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {pageType === "link" ? customers.length : payments.length}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {pageType === "link" ? "Customers" : "Payments"}
                </p>
              </div>
            </div>

            {/* School Section */}
            {isSchoolPage && (
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      <h2 className="font-semibold text-gray-900 dark:text-white">
                        Students ({studentsWithStatus.length})
                      </h2>
                    </div>
                    {studentsWithStatus.length > 0 && (
                      <div className="flex gap-1">
                        {["all", "paid", "partial", "unpaid"].map((tab) => {
                          const labels = {
                            all: `All (${studentsWithStatus.length})`,
                            paid: `Paid (${fullyPaidCount})`,
                            partial: `Partial (${partiallyPaidCount})`,
                            unpaid: `Pending (${unpaidCount})`,
                          };
                          const isActive = activeTab === tab;
                          return (
                            <button
                              key={tab}
                              onClick={() => setActiveTab(tab as any)}
                              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                                isActive
                                  ? "bg-yellow-500 text-black font-medium"
                                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                              }`}
                            >
                              {labels[tab as keyof typeof labels]}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {studentsWithStatus.length > 0 && (
                    <div className="mt-3 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search student..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full sm:w-64 pl-9 pr-8 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                      {searchQuery && (
                        <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                          <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {studentsWithStatus.length === 0 ? (
                  <div className="p-12 text-center">
                    <GraduationCap className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-700 mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No students added yet</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Add students in page settings</p>
                  </div>
                ) : (
                  <>
                    {/* Progress */}
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600 dark:text-gray-400">Progress</span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          ₦{totalCollected.toLocaleString()} / ₦{totalExpected.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-500 rounded-full transition-all"
                          style={{ width: `${totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Student List */}
                    <div className="divide-y divide-gray-200 dark:divide-gray-800 max-h-[500px] overflow-y-auto">
                      {filteredStudents.length === 0 && searchQuery && (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                          <Search className="h-10 w-10 mx-auto mb-2 text-gray-300 dark:text-gray-700" />
                          <p>No students found matching "{searchQuery}"</p>
                          <button onClick={() => setSearchQuery("")} className="text-yellow-600 hover:underline mt-2 text-sm">
                            Clear search
                          </button>
                        </div>
                      )}

                      {filteredStudents.length === 0 && !searchQuery && activeTab !== "all" && (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                          <p>No students in this category</p>
                          <button onClick={() => setActiveTab("all")} className="text-yellow-600 hover:underline mt-2 text-sm">
                            View all
                          </button>
                        </div>
                      )}

                      {filteredStudents.map((student: any, idx: number) => {
                        const isFullyPaid = student.isFullyPaid;
                        const isPartiallyPaid = student.isPartiallyPaid;

                        return (
                          <div key={idx} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900 dark:text-white">{student.name}</span>
                                  {isFullyPaid && (
                                    <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                                      <CheckCircle className="h-3 w-3" /> Paid
                                    </span>
                                  )}
                                  {isPartiallyPaid && (
                                    <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                                      <Clock className="h-3 w-3" /> Partial
                                    </span>
                                  )}
                                  {!isFullyPaid && !isPartiallyPaid && (
                                    <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                                      <Clock className="h-3 w-3" /> Pending
                                    </span>
                                  )}
                                </div>
                                <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {student.className && <span>Class: {student.className}</span>}
                                  {student.regNumber && <span>Reg: {student.regNumber}</span>}
                                  {student.parentName && <span>Parent: {student.parentName}</span>}
                                </div>
                              </div>
                              <div className="text-right">
                                {isFullyPaid ? (
                                  <span className="font-semibold text-green-600 dark:text-green-400">
                                    ₦{student.totalAmount.toLocaleString()}
                                  </span>
                                ) : isPartiallyPaid ? (
                                  <div>
                                    <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                                      ₦{student.paidAmount.toLocaleString()}
                                    </span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                                      / ₦{student.totalAmount.toLocaleString()}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="font-semibold text-gray-500 dark:text-gray-400">
                                    ₦{student.totalAmount.toLocaleString()}
                                  </span>
                                )}
                                {student.paymentCount > 0 && (
                                  <p className="text-xs text-gray-400 dark:text-gray-500">
                                    {student.paymentCount} payment{student.paymentCount > 1 ? 's' : ''}
                                  </p>
                                )}
                              </div>
                            </div>
                            {isPartiallyPaid && (
                              <div className="mt-2 w-full max-w-xs ml-auto">
                                <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-yellow-500 rounded-full transition-all"
                                    style={{ width: `${student.percentage}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Unassigned Payments */}
                    {unassignedPayments.length > 0 && (
                      <div className="border-t border-gray-200 dark:border-gray-800 p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <AlertCircle className="h-5 w-5 text-yellow-600" />
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            Unassigned Payments ({unassignedPayments.length})
                          </h3>
                        </div>
                        <div className="space-y-3">
                          {unassignedPayments.map((payment: any) => {
                            const paymentAmount = payment.amount || 0;
                            const senderName = payment.customer_name || "Unknown";
                            const paymentDate = payment.paid_at || payment.created_at;
                            const availableStudents = studentsWithStatus.filter((s: any) => !s.isFullyPaid);

                            return (
                              <div key={payment.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    ₦{paymentAmount.toLocaleString()} - {senderName}
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {new Date(paymentDate).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <select
                                    value={selectedStudent[payment.id] || ""}
                                    onChange={(e) =>
                                      setSelectedStudent((prev) => ({
                                        ...prev,
                                        [payment.id]: e.target.value,
                                      }))
                                    }
                                    className="px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                  >
                                    <option value="">Assign to...</option>
                                    {availableStudents.map((student: any) => (
                                      <option key={student.name} value={student.name}>
                                        {student.name} (Remaining: ₦{student.remainingAmount.toLocaleString()})
                                      </option>
                                    ))}
                                  </select>
                                  <Button
                                    onClick={() =>
                                      assignPaymentToStudent(
                                        payment.id,
                                        selectedStudent[payment.id],
                                        paymentAmount,
                                      )
                                    }
                                    disabled={!selectedStudent[payment.id] || assigningPayment === payment.id}
                                    size="sm"
                                    className="bg-yellow-500 text-black hover:bg-yellow-600"
                                  >
                                    {assigningPayment === payment.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Check className="h-4 w-4 mr-1" />
                                    )}
                                    Assign
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {unassignedPayments.length === 0 && payments.length > 0 && (
                      <div className="border-t border-gray-200 dark:border-gray-800 p-6 text-center">
                        <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
                        <p className="text-green-600 dark:text-green-400">All payments assigned</p>
                      </div>
                    )}

                    {payments.length === 0 && (
                      <div className="border-t border-gray-200 dark:border-gray-800 p-12 text-center">
                        <Banknote className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-700 mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">No payments yet</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">Share your page to start receiving payments</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => setShowQRModal(true)}
                className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <QrCode className="h-4 w-4 mr-2" /> QR Code
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowEmbedModal(true)}
                className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Code2 className="h-4 w-4 mr-2" /> Embed
              </Button>
              <Button
                variant="outline"
                onClick={() => copyToClipboard(getPaymentPageUrl(), "Payment link")}
                className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Copy className="h-4 w-4 mr-2" /> Copy Link
              </Button>
            </div>

            {/* Customers */}
            {showCustomersSection && (
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <Users className="h-5 w-5 text-gray-500" />
                      Customers ({customers.length})
                    </h3>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search customers..."
                        value={customerSearchQuery}
                        onChange={(e) => setCustomerSearchQuery(e.target.value)}
                        className="pl-9 pr-8 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>
                  </div>
                </div>

                {customers.length === 0 ? (
                  <div className="p-12 text-center">
                    <Users className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-700 mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No customers yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-800 max-h-[400px] overflow-y-auto">
                    {filteredCustomers.map((customer, idx) => (
                      <div key={idx} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{customer.name}</p>
                            <div className="flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {customer.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {customer.email}</span>}
                              {customer.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {customer.phone}</span>}
                              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(customer.firstPayment).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600 dark:text-green-400">
                              ₦{customer.totalPaid.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              {customer.payments.length} payment{customer.payments.length > 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredCustomers.length === 0 && customerSearchQuery && (
                      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        No customers found matching "{customerSearchQuery}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Withdraw */}
            {page.pageBalance > 0 && (
              <div className="bg-gray-900 dark:bg-gray-800 rounded-xl p-6 text-white">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Available Balance</p>
                    <p className="text-3xl font-bold">₦{page.pageBalance.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">Withdraw to wallet (₦200 fee)</p>
                  </div>
                  <Button
                    onClick={handleWithdraw}
                    disabled={withdrawing}
                    className="bg-yellow-500 text-black hover:bg-yellow-600 font-medium"
                  >
                    {withdrawing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Wallet className="h-4 w-4 mr-2" />
                    )}
                    {withdrawing ? "Processing..." : "Withdraw Funds"}
                  </Button>
                </div>
                {!isVerified && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <BVNVerificationBadge variant="withdrawal" />
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* QR Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">QR Code</h3>
              <button onClick={() => setShowQRModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-col items-center">
              <img
                src={`/api/payment-page/qrcode?url=${encodeURIComponent(getPaymentPageUrl())}`}
                alt="QR Code"
                className="w-48 h-48 bg-white rounded-xl p-2"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-4">
                Scan to open payment page
              </p>
              <Button
                onClick={downloadQRCode}
                className="mt-4 bg-yellow-500 text-black hover:bg-yellow-600 w-full"
              >
                <Download className="h-4 w-4 mr-2" /> Download
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Embed Modal */}
      {showEmbedModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Embed Code</h3>
              <button onClick={() => setShowEmbedModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-4 overflow-x-auto">
              <code className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all whitespace-pre-wrap">
                {getEmbedCode()}
              </code>
            </div>
            <Button
              onClick={copyEmbedCode}
              className="bg-yellow-500 text-black hover:bg-yellow-600 w-full"
            >
              {copiedEmbed ? <CheckCircle className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {copiedEmbed ? "Copied!" : "Copy Code"}
            </Button>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-track {
          background: #1f2937;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>
    </div>
  );
};

export default PageDetail;