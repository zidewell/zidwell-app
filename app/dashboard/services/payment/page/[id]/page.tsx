// app/dashboard/services/payment/page/[id]/page.tsx
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
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Truck,
  MessageSquare,
  Heart,
  Package,
  FileText,
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

// ─── HELPER: extract type-specific info from a payment ───
function getPaymentExtraInfo(payment: any) {
  const meta = payment.metadata || {};

  return {
    quantity: Number(meta.quantity) || 1,
    shippingAddress: meta.shippingAddress || null,
    bookingDate: meta.bookingDate || null,
    bookingTime: meta.bookingTime || null,
    customerNote: meta.customerNote || null,
    donorMessage: meta.donorMessage || null,
    downloadUrl: meta.downloadUrl || null,
    accessLink: meta.accessLink || null,
    selectedVariantSku: meta.selectedVariantSku || null,
    isInstallment:
      !!meta.isInstallment || payment.payment_type === "installment",
    totalInstallments:
      meta.totalInstallments || payment.total_installments || null,
    installmentAmount: meta.installmentAmount || null,
    installmentPeriod: meta.installmentPeriod || null,
    referenceCode: meta.referenceCode || null,
  };
}

// ─── HELPER: compute the buyer's installment sequence number ───
function computeInstallmentSequence(
  payment: any,
  allPayments: any[],
): { current: number; total: number } | null {
  const info = getPaymentExtraInfo(payment);
  if (!info.isInstallment || !info.totalInstallments) return null;
  if (Number(info.totalInstallments) <= 1) return null;

  const email = payment.customer_email?.toLowerCase();
  const phone = payment.customer_phone;

  const sameBuyer = allPayments
    .filter((p) => p.status === "completed")
    .filter((p) => {
      if (email && p.customer_email?.toLowerCase() === email) return true;
      if (phone && p.customer_phone === phone) return true;
      return false;
    })
    .sort(
      (a, b) =>
        new Date(a.paid_at || a.created_at).getTime() -
        new Date(b.paid_at || b.created_at).getTime(),
    );

  const index = sameBuyer.findIndex((p) => p.id === payment.id);
  const current = index >= 0 ? index + 1 : 1;

  return { current, total: Number(info.totalInstallments) };
}

// ─── RENDER: extra info badges for a payment/customer ───
function PaymentExtraInfo({
  payment,
  allPayments = [],
}: {
  payment: any;
  allPayments?: any[];
}) {
  if (!payment) return null;

  const info = getPaymentExtraInfo(payment);
  const items: { icon: any; label: string; value: string }[] = [];

  if (info.quantity > 1) {
    items.push({
      icon: Package,
      label: "Quantity",
      value: `${info.quantity} units`,
    });
  }

  if (info.selectedVariantSku) {
    items.push({
      icon: Package,
      label: "Variant",
      value: info.selectedVariantSku,
    });
  }

  if (info.shippingAddress) {
    const { street, city, state, country } = info.shippingAddress;
    items.push({
      icon: Truck,
      label: "Delivery to",
      value: `${street}, ${city}, ${state}${country ? `, ${country}` : ""}`,
    });
  }

  if (info.bookingDate) {
    items.push({
      icon: Calendar,
      label: "Booking",
      value: `${info.bookingDate}${
        info.bookingTime ? ` at ${info.bookingTime}` : ""
      }`,
    });
  }

  const seq = computeInstallmentSequence(payment, allPayments);
  if (seq) {
    items.push({
      icon: Calendar,
      label: "Installment",
      value: `${seq.current} of ${seq.total} — ${
        info.installmentPeriod || "monthly"
      }`,
    });
  }

  if (info.referenceCode) {
    items.push({
      icon: FileText,
      label: "Reference",
      value: info.referenceCode,
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={idx}
            className="inline-flex items-center gap-1.5 rounded-lg border border-(--border-color) bg-(--bg-secondary) px-2.5 py-1 text-xs"
          >
            <Icon className="h-3 w-3 shrink-0 text-(--color-accent-yellow)" />
            <span className="font-medium text-(--text-secondary)">
              {item.label}:
            </span>
            <span className="text-(--text-primary)">{item.value}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── RENDER: customer note / donor message ───
function PaymentMessage({ payment }: { payment: any }) {
  if (!payment) return null;
  const info = getPaymentExtraInfo(payment);

  if (info.customerNote) {
    return (
      <div className="mt-2 rounded-lg border border-(--border-color) bg-(--bg-secondary) p-3">
        <div className="flex items-start gap-2">
          <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-(--text-secondary)" />
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-xs font-semibold text-(--text-primary)">
              Customer note
            </p>
            <p className="whitespace-pre-wrap break-words text-xs text-(--text-secondary)">
              {info.customerNote}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (info.donorMessage) {
    return (
      <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
        <div className="flex items-start gap-2">
          <Heart className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-xs font-semibold text-red-700 dark:text-red-400">
              Donor message
            </p>
            <p className="whitespace-pre-wrap break-words text-xs text-red-800 dark:text-red-300">
              {info.donorMessage}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ─── RENDER: digital delivery links ───
function DigitalDelivery({ payment }: { payment: any }) {
  if (!payment) return null;
  const info = getPaymentExtraInfo(payment);
  const link = info.downloadUrl || info.accessLink;
  if (!link) return null;

  return (
    <div className="mt-2 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
      <div className="flex items-start gap-2">
        <Download className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-400" />
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-xs font-semibold text-green-700 dark:text-green-400">
            Delivered link
          </p>
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-xs text-green-700 underline hover:text-green-900 dark:text-green-300"
          >
            {link}
          </a>
        </div>
      </div>
    </div>
  );
}

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
  const [selectedStudent, setSelectedStudent] = useState<
    Record<string, string>
  >({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showQRModal, setShowQRModal] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<
    "all" | "paid" | "partial" | "unpaid"
  >("all");

  const isVerified = userData?.bvnVerification === "verified";

  useEffect(() => {
    if (id) loadPageDetails();
  }, [id]);

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
        confirmButtonColor: "var(--color-accent-yellow)",
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

      if (error) console.error("Error loading payments:", error);
      setPayments(data || []);
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
        html: `<div class="text-left">
          <p class="font-medium">You need to verify your BVN before you can withdraw funds.</p>
          <p class="text-sm text-gray-600 mt-2">This is required for security and regulatory compliance.</p>
        </div>`,
        confirmButtonColor: "var(--color-accent-yellow)",
        confirmButtonText: "Verify BVN Now",
        showCancelButton: true,
        cancelButtonText: "Cancel",
        cancelButtonColor: "#6b7280",
      }).then((result) => {
        if (result.isConfirmed) openVerificationModal();
      });
      return;
    }

    try {
      const { value: amount, isConfirmed } = await Swal.fire<number>({
        title: "Withdraw Funds",
        html: `<div class="text-left">
          <p class="mb-2">Available balance: <strong>₦${(page?.pageBalance || 0).toLocaleString()}</strong></p>
          <p class="text-sm text-gray-600">Minimum withdrawal: ₦1,000</p>
        </div>`,
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
        confirmButtonColor: "var(--color-accent-yellow)",
        confirmButtonText: "Withdraw",
        cancelButtonText: "Cancel",
        inputValidator: (value) => {
          const numAmount = Number(value);
          if (!value || isNaN(numAmount) || numAmount <= 0)
            return "Please enter a valid amount";
          if (numAmount < 1000) return "Minimum withdrawal amount is ₦1,000";
          if (numAmount > (page?.pageBalance || 0))
            return `Maximum withdrawal amount is ₦${(page?.pageBalance || 0).toLocaleString()}`;
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
          didOpen: () => Swal.showLoading(),
        });

        await withdrawFromPage(page?.id, withdrawAmount);

        await Swal.fire({
          icon: "success",
          title: "Withdrawal Initiated!",
          html: `<div class="text-left">
            <p>✅ ₦${withdrawAmount.toLocaleString()} has been withdrawn successfully.</p>
            <p class="text-sm text-gray-600 mt-2">Funds will be sent to your wallet shortly.</p>
          </div>`,
          confirmButtonColor: "var(--color-accent-yellow)",
        });

        refreshData();
      }
    } catch (error: any) {
      console.error("Withdrawal error:", error);
      await Swal.fire({
        icon: "error",
        title: "Withdrawal Failed",
        html: `<p>${error.message || "Please try again later."}</p>`,
        confirmButtonColor: "var(--color-accent-yellow)",
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
        confirmButtonColor: "var(--color-accent-yellow)",
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
      if (!response.ok)
        throw new Error(data.error || "Failed to assign payment");

      await Swal.fire({
        icon: "success",
        title: "Payment Assigned!",
        html: `<div class="text-left">
          <p class="mb-2">✅ ${data.message}</p>
          <p class="text-sm text-gray-600 mt-2">
            <strong>Student:</strong> ${studentName}<br>
            <strong>Amount:</strong> ₦${amount.toLocaleString()}<br>
            ${data.data.isFullyPaid ? '<span class="text-green-600">🎉 Student is now fully paid!</span>' : `<span class="text-yellow-600">Remaining: ₦${data.data.remainingAmount.toLocaleString()}</span>`}
          </p>
        </div>`,
        confirmButtonColor: "var(--color-accent-yellow)",
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
        confirmButtonColor: "var(--color-accent-yellow)",
      });
    } finally {
      setAssigningPayment(null);
    }
  };

  const getPaymentPageUrl = () => {
    const storeSlug = page?.metadata?.storeSlug || store?.slug || "";
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
    return null;
  };

  const linkConfig = getPaymentLinkConfig();

  // ─── CUSTOMERS GROUPED ───
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
      if (!key || key === "null" || key === "undefined") key = name;
      if (!key || key === "Anonymous") key = `customer-${payment.id}`;
      key = String(key);

      if (!customerMap.has(key)) {
        const customFields = payment.metadata?.customFields || {};
        const formattedCustomFields: Record<string, any> = {};
        Object.entries(customFields).forEach(([fieldKey, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            const label = fieldIdToLabel[fieldKey] || fieldKey;
            formattedCustomFields[label] = value;
          }
        });

        customerMap.set(key, {
          name,
          email,
          phone: payment.customer_phone || null,
          totalPaid: 0,
          payments: [] as any[],
          firstPayment:
            payment.paid_at || payment.created_at || new Date().toISOString(),
          lastPayment:
            payment.paid_at || payment.created_at || new Date().toISOString(),
          customFields: formattedCustomFields,
        });
      }

      const customer = customerMap.get(key);
      const amount = payment.total_amount || payment.amount || 0;
      customer.totalPaid += amount;
      customer.payments.push(payment);

      const paymentDate =
        payment.paid_at || payment.created_at || new Date().toISOString();
      if (paymentDate > customer.lastPayment)
        customer.lastPayment = paymentDate;
      if (paymentDate < customer.firstPayment)
        customer.firstPayment = paymentDate;
    });

    return Array.from(customerMap.values()).sort(
      (a, b) => b.totalPaid - a.totalPaid,
    );
  }, [payments, linkConfig]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearchQuery.trim()) return customers;
    const q = customerSearchQuery.toLowerCase().trim();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)),
    );
  }, [customers, customerSearchQuery]);

  // ─── STUDENT MAP ───
  const studentPaymentMap = useMemo(() => {
    const map = new Map<
      string,
      {
        paidAmount: number;
        parentName?: string;
        lastPaidAt?: string;
        payments: any[];
      }
    >();

    payments.forEach((payment) => {
      let studentName = null;
      if (payment.student_name) studentName = payment.student_name;
      else if (
        payment.metadata?.selectedStudents &&
        payment.metadata.selectedStudents.length > 0
      )
        studentName = payment.metadata.selectedStudents[0];
      else if (payment.metadata?.matched_student)
        studentName = payment.metadata.matched_student;
      else if (payment.metadata?.assigned_student)
        studentName = payment.metadata.assigned_student;

      if (studentName) {
        const existing = map.get(studentName) || {
          paidAmount: 0,
          parentName: null,
          lastPaidAt: null,
          payments: [],
        };
        existing.paidAmount += payment.amount || 0;
        existing.payments.push(payment);
        if (payment.customer_name && !existing.parentName)
          existing.parentName = payment.customer_name;
        const d = payment.paid_at || payment.confirmed_at || payment.created_at;
        if (d && (!existing.lastPaidAt || d > existing.lastPaidAt))
          existing.lastPaidAt = d;
        map.set(studentName, existing);
      }
    });

    return map;
  }, [payments]);

  const studentsWithStatus = useMemo(() => {
    const rawStudents = page?.metadata?.students || [];
    if (!rawStudents || rawStudents.length === 0) return [];

    return rawStudents.map((student: any) => {
      const totalAmount = page?.price || 0;
      const studentName = student.name || student.studentName || "";
      const paymentData = studentPaymentMap.get(studentName);
      const paidAmount =
        paymentData?.paidAmount || Number(student.paidAmount) || 0;
      const parentName = paymentData?.parentName || student.parentName || null;
      const lastPaidAt =
        paymentData?.lastPaidAt || student.lastPaidAt || student.paidAt || null;
      const paymentCount = paymentData?.payments?.length || 0;

      const isFullyPaid = paidAmount >= totalAmount && totalAmount > 0;
      const isPartiallyPaid = paidAmount > 0 && !isFullyPaid && totalAmount > 0;
      const remainingAmount = Math.max(0, totalAmount - paidAmount);
      const percentage =
        totalAmount > 0 ? Math.min(100, (paidAmount / totalAmount) * 100) : 0;

      return {
        ...student,
        name: studentName,
        className: student.className || student.class || "",
        regNumber: student.regNumber || "",
        totalAmount,
        paidAmount,
        remainingAmount,
        isFullyPaid,
        isPartiallyPaid,
        percentage,
        parentName,
        paidAt: lastPaidAt,
        paymentCount,
        payments: paymentData?.payments || [],
      };
    });
  }, [page?.metadata?.students, page?.price, studentPaymentMap]);

  let filteredStudents = studentsWithStatus;
  if (searchQuery)
    filteredStudents = filteredStudents.filter((s: any) =>
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  if (activeTab === "paid")
    filteredStudents = filteredStudents.filter((s: any) => s.isFullyPaid);
  else if (activeTab === "partial")
    filteredStudents = filteredStudents.filter((s: any) => s.isPartiallyPaid);
  else if (activeTab === "unpaid")
    filteredStudents = filteredStudents.filter(
      (s: any) => !s.isFullyPaid && !s.isPartiallyPaid,
    );

  const fullyPaidCount = studentsWithStatus.filter(
    (s: any) => s.isFullyPaid,
  ).length;
  const partiallyPaidCount = studentsWithStatus.filter(
    (s: any) => s.isPartiallyPaid,
  ).length;
  const unpaidCount = studentsWithStatus.filter(
    (s: any) => !s.isFullyPaid && !s.isPartiallyPaid,
  ).length;

  const totalCollected = studentsWithStatus.reduce(
    (sum: number, s: any) => sum + (s.paidAmount || 0),
    0,
  );
  const totalExpected = studentsWithStatus.length * (page?.price || 0);

  const unassignedPayments = payments.filter((p) => {
    return (
      !p.student_name &&
      !p.metadata?.matched_student &&
      !p.metadata?.assigned_student &&
      (!p.metadata?.selectedStudents ||
        p.metadata.selectedStudents.length === 0)
    );
  });

  const totalPaymentsAmount = payments.reduce(
    (sum, p) => sum + (p.amount || 0),
    0,
  );

  const pageType = page?.pageType || page?.page_type || "";
  const isSchoolPage = pageType === "school";
  const isDonationPage = pageType === "donation";
  const showCustomersSection = !isSchoolPage && payments.length > 0;

  if (!page) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--bg-primary)">
        <Loader2 className="h-8 w-8 animate-spin text-(--color-accent-yellow)" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--bg-primary)">
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex min-h-screen flex-col lg:pl-72">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm text-(--text-secondary) transition-colors hover:text-(--text-primary)"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                onClick={refreshData}
                disabled={refreshing}
                className="flex items-center gap-2 text-sm text-(--text-secondary) transition-colors hover:text-(--text-primary)"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />{" "}
                Refresh
              </button>
            </div>

            {/* Page Info */}
            <div className="squircle-lg flex flex-col gap-4 border border-(--border-color) bg-(--bg-primary) p-6 shadow-(--shadow-soft) sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="squircle-md flex h-14 w-14 items-center justify-center overflow-hidden bg-(--bg-secondary)">
                  {page.productImages && page.productImages.length > 0 ? (
                    <img
                      src={page.productImages[0]}
                      className="h-full w-full object-cover"
                      alt={page.title}
                    />
                  ) : page.coverImage ? (
                    <img
                      src={page.coverImage}
                      className="h-full w-full object-cover"
                      alt={page.title}
                    />
                  ) : (
                    <CreditCard className="h-6 w-6 text-(--text-secondary)" />
                  )}
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-(--text-primary)">
                    {page.title}
                  </h1>
                  <p className="text-sm text-(--text-secondary)">
                    {typeLabels[pageType] || pageType || "Payment Page"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/dashboard/services/payment/edit/${page.id}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-(--border-color) bg-(--bg-primary) text-(--text-primary) hover:bg-(--bg-secondary)"
                  >
                    <Edit2 className="mr-1 h-4 w-4" /> Edit
                  </Button>
                </Link>
                <Link href={getPaymentPageUrl()} target="_blank">
                  <Button
                    size="sm"
                    className="squircle-md bg-(--color-accent-yellow) text-(--color-ink) hover:opacity-90"
                  >
                    <ExternalLink className="mr-1 h-4 w-4" /> View
                  </Button>
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="squircle-lg border border-(--border-color) bg-(--bg-primary) p-5 shadow-(--shadow-soft)">
                <Eye className="mb-2 h-5 w-5 text-(--text-secondary)" />
                <p className="text-2xl font-bold text-(--text-primary)">
                  {page.pageViews || 0}
                </p>
                <p className="text-sm text-(--text-secondary)">Views</p>
              </div>
              <div className="squircle-lg border border-(--border-color) bg-(--bg-primary) p-5 shadow-(--shadow-soft)">
                <DollarSign className="mb-2 h-5 w-5 text-green-500" />
                <p className="text-2xl font-bold text-(--text-primary)">
                  ₦
                  {(isSchoolPage
                    ? totalCollected
                    : totalPaymentsAmount
                  ).toLocaleString()}
                </p>
                <p className="text-sm text-(--text-secondary)">Collected</p>
              </div>
              <div className="squircle-lg border border-(--border-color) bg-(--bg-primary) p-5 shadow-(--shadow-soft)">
                <Wallet className="mb-2 h-5 w-5 text-(--color-accent-yellow)" />
                <p className="text-2xl font-bold text-(--text-primary)">
                  ₦{(page.pageBalance || 0).toLocaleString()}
                </p>
                <p className="text-sm text-(--text-secondary)">Balance</p>
              </div>
              <div className="squircle-lg border border-(--border-color) bg-(--bg-primary) p-5 shadow-(--shadow-soft)">
                <Users className="mb-2 h-5 w-5 text-blue-500" />
                <p className="text-2xl font-bold text-(--text-primary)">
                  {isSchoolPage ? studentsWithStatus.length : customers.length}
                </p>
                <p className="text-sm text-(--text-secondary)">
                  {isSchoolPage ? "Students" : "Customers"}
                </p>
              </div>
            </div>

            {/* ─── SCHOOL SECTION ─── */}
            {isSchoolPage && (
              <div className="squircle-lg overflow-hidden border border-(--border-color) bg-(--bg-primary) shadow-(--shadow-soft)">
                <div className="border-b border-(--border-color) px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-(--text-secondary)" />
                      <h2 className="font-semibold text-(--text-primary)">
                        Students ({studentsWithStatus.length})
                      </h2>
                    </div>
                    {studentsWithStatus.length > 0 && (
                      <div className="flex gap-1">
                        {(["all", "paid", "partial", "unpaid"] as const).map(
                          (tab) => {
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
                                onClick={() => setActiveTab(tab)}
                                className={`squircle-md px-3 py-1.5 text-xs transition-colors ${
                                  isActive
                                    ? "bg-(--color-accent-yellow) font-medium text-(--color-ink)"
                                    : "text-(--text-secondary) hover:bg-(--bg-secondary)"
                                }`}
                              >
                                {labels[tab]}
                              </button>
                            );
                          },
                        )}
                      </div>
                    )}
                  </div>
                  {studentsWithStatus.length > 0 && (
                    <div className="relative mt-3">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--text-secondary)" />
                      <input
                        type="text"
                        placeholder="Search student..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="squircle-md w-full border border-(--border-color) bg-(--bg-secondary) py-2 pl-9 pr-8 text-sm text-(--text-primary) placeholder:text-(--text-secondary) focus:border-(--color-accent-yellow) focus:outline-none sm:w-64"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          <X className="h-4 w-4 text-(--text-secondary) hover:text-(--text-primary)" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {studentsWithStatus.length === 0 ? (
                  <div className="p-12 text-center">
                    <GraduationCap className="mx-auto mb-3 h-12 w-12 text-(--text-secondary)/40" />
                    <p className="text-(--text-secondary)">
                      No students added yet
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="border-b border-(--border-color) px-6 py-4">
                      <div className="mb-2 flex justify-between text-sm">
                        <span className="text-(--text-secondary)">
                          Progress
                        </span>
                        <span className="font-medium text-(--text-primary)">
                          ₦{totalCollected.toLocaleString()} / ₦
                          {totalExpected.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-(--bg-secondary)">
                        <div
                          className="h-full rounded-full bg-(--color-accent-yellow) transition-all"
                          style={{
                            width: `${
                              totalExpected > 0
                                ? (totalCollected / totalExpected) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="max-h-[500px] divide-y divide-(--border-color) overflow-y-auto">
                      {filteredStudents.map((student: any, idx: number) => {
                        const isFullyPaid = student.isFullyPaid;
                        const isPartiallyPaid = student.isPartiallyPaid;
                        return (
                          <div
                            key={idx}
                            className="px-6 py-4 transition-colors hover:bg-(--bg-secondary)/50"
                          >
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-(--text-primary)">
                                    {student.name}
                                  </span>
                                  {isFullyPaid && (
                                    <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                      <CheckCircle className="h-3 w-3" /> Paid
                                    </span>
                                  )}
                                  {isPartiallyPaid && (
                                    <span className="flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                                      <Clock className="h-3 w-3" /> Partial
                                    </span>
                                  )}
                                  {!isFullyPaid && !isPartiallyPaid && (
                                    <span className="flex items-center gap-1 rounded-full bg-(--bg-secondary) px-2 py-0.5 text-xs text-(--text-secondary)">
                                      <Clock className="h-3 w-3" /> Pending
                                    </span>
                                  )}
                                </div>
                                <div className="mt-1 flex gap-3 text-xs text-(--text-secondary)">
                                  {student.className && (
                                    <span>Class: {student.className}</span>
                                  )}
                                  {student.regNumber && (
                                    <span>Reg: {student.regNumber}</span>
                                  )}
                                  {student.parentName && (
                                    <span>Parent: {student.parentName}</span>
                                  )}
                                </div>
                                {student.payments?.[0] && (
                                  <PaymentExtraInfo
                                    payment={student.payments[0]}
                                    allPayments={payments}
                                  />
                                )}
                              </div>
                              <div className="text-right">
                                {isFullyPaid ? (
                                  <span className="font-semibold text-green-600 dark:text-green-400">
                                    ₦{student.totalAmount.toLocaleString()}
                                  </span>
                                ) : isPartiallyPaid ? (
                                  <div>
                                    <span className="font-semibold text-(--color-accent-yellow)">
                                      ₦{student.paidAmount.toLocaleString()}
                                    </span>
                                    <span className="ml-2 text-sm text-(--text-secondary)">
                                      / ₦{student.totalAmount.toLocaleString()}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="font-semibold text-(--text-secondary)">
                                    ₦{student.totalAmount.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {unassignedPayments.length > 0 && (
                      <div className="border-t border-(--border-color) p-6">
                        <div className="mb-4 flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-(--color-accent-yellow)" />
                          <h3 className="font-medium text-(--text-primary)">
                            Unassigned Payments ({unassignedPayments.length})
                          </h3>
                        </div>
                        <div className="space-y-3">
                          {unassignedPayments.map((payment: any) => {
                            const paymentAmount = payment.amount || 0;
                            const senderName =
                              payment.customer_name || "Unknown";
                            const paymentDate =
                              payment.paid_at || payment.created_at;
                            const availableStudents = studentsWithStatus.filter(
                              (s: any) => !s.isFullyPaid,
                            );

                            return (
                              <div
                                key={payment.id}
                                className="squircle-md flex flex-col gap-3 bg-(--bg-secondary) p-4 md:flex-row md:items-center md:justify-between"
                              >
                                <div className="flex-1">
                                  <p className="font-medium text-(--text-primary)">
                                    ₦{paymentAmount.toLocaleString()} —{" "}
                                    {senderName}
                                  </p>
                                  <p className="text-sm text-(--text-secondary)">
                                    {new Date(paymentDate).toLocaleDateString()}
                                  </p>
                                  <PaymentExtraInfo
                                    payment={payment}
                                    allPayments={payments}
                                  />
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
                                    className="squircle-md border border-(--border-color) bg-(--bg-primary) px-3 py-2 text-sm text-(--text-primary)"
                                  >
                                    <option value="">Assign to...</option>
                                    {availableStudents.map((student: any) => (
                                      <option
                                        key={student.name}
                                        value={student.name}
                                      >
                                        {student.name} (Remaining: ₦
                                        {student.remainingAmount.toLocaleString()}
                                        )
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
                                    disabled={
                                      !selectedStudent[payment.id] ||
                                      assigningPayment === payment.id
                                    }
                                    size="sm"
                                    className="squircle-md bg-(--color-accent-yellow) text-(--color-ink) hover:opacity-90"
                                  >
                                    {assigningPayment === payment.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <CheckCircle className="mr-1 h-4 w-4" />
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
                  </>
                )}
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => setShowQRModal(true)}
                className="squircle-md border-(--border-color) bg-(--bg-primary) text-(--text-primary) hover:bg-(--bg-secondary)"
              >
                <QrCode className="mr-2 h-4 w-4" /> QR Code
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowEmbedModal(true)}
                className="squircle-md border-(--border-color) bg-(--bg-primary) text-(--text-primary) hover:bg-(--bg-secondary)"
              >
                <Code2 className="mr-2 h-4 w-4" /> Embed
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  copyToClipboard(getPaymentPageUrl(), "Payment link")
                }
                className="squircle-md border-(--border-color) bg-(--bg-primary) text-(--text-primary) hover:bg-(--bg-secondary)"
              >
                <Copy className="mr-2 h-4 w-4" /> Copy Link
              </Button>
            </div>

            {/* ─── CUSTOMERS ─── */}
            {showCustomersSection && (
              <div className="squircle-lg overflow-hidden border border-(--border-color) bg-(--bg-primary) shadow-(--shadow-soft)">
                <div className="border-b border-(--border-color) px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="flex items-center gap-2 font-medium text-(--text-primary)">
                      <Users className="h-5 w-5 text-(--text-secondary)" />
                      {isDonationPage ? "Donors" : "Customers"} (
                      {customers.length})
                    </h3>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--text-secondary)" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={customerSearchQuery}
                        onChange={(e) => setCustomerSearchQuery(e.target.value)}
                        className="squircle-md border border-(--border-color) bg-(--bg-secondary) py-2 pl-9 pr-8 text-sm text-(--text-primary) placeholder:text-(--text-secondary) focus:border-(--color-accent-yellow) focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {customers.length === 0 ? (
                  <div className="p-12 text-center">
                    <Users className="mx-auto mb-3 h-12 w-12 text-(--text-secondary)/40" />
                    <p className="text-(--text-secondary)">
                      No {isDonationPage ? "donors" : "customers"} yet
                    </p>
                  </div>
                ) : (
                  <div className="max-h-[600px] divide-y divide-(--border-color) overflow-y-auto">
                    {filteredCustomers.map((customer, idx) => {
                      const latestPayment = customer.payments?.[0];
                      return (
                        <div
                          key={idx}
                          className="px-6 py-4 transition-colors hover:bg-(--bg-secondary)/50"
                        >
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-(--text-primary)">
                                {customer.name}
                              </p>
                              <div className="mt-1 flex flex-wrap gap-3 text-sm text-(--text-secondary)">
                                {customer.email && (
                                  <span className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />{" "}
                                    {customer.email}
                                  </span>
                                )}
                                {customer.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />{" "}
                                    {customer.phone}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />{" "}
                                  {new Date(
                                    customer.firstPayment,
                                  ).toLocaleDateString()}
                                </span>
                              </div>

                              <PaymentExtraInfo
                                payment={latestPayment}
                                allPayments={payments}
                              />
                              <PaymentMessage payment={latestPayment} />
                              <DigitalDelivery payment={latestPayment} />
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="font-semibold text-green-600 dark:text-green-400">
                                ₦{customer.totalPaid.toLocaleString()}
                              </p>
                              <p className="text-xs text-(--text-secondary)">
                                {customer.payments.length} payment
                                {customer.payments.length > 1 ? "s" : ""}
                              </p>
                            </div>
                          </div>

                          {customer.payments.length > 1 && (
                            <div className="mt-3 border-t border-(--border-color) pt-3">
                              <p className="mb-2 text-xs font-semibold text-(--text-secondary)">
                                Payment history ({customer.payments.length})
                              </p>
                              <div className="space-y-1.5">
                                {[...customer.payments]
                                  .sort(
                                    (a, b) =>
                                      new Date(
                                        b.paid_at || b.created_at,
                                      ).getTime() -
                                      new Date(
                                        a.paid_at || a.created_at,
                                      ).getTime(),
                                  )
                                  .map((p) => {
                                    const seq = computeInstallmentSequence(
                                      p,
                                      payments,
                                    );
                                    return (
                                      <div
                                        key={p.id}
                                        className="flex items-center justify-between text-xs"
                                      >
                                        <span className="text-(--text-secondary)">
                                          {new Date(
                                            p.paid_at || p.created_at,
                                          ).toLocaleString()}
                                          {seq && (
                                            <span className="ml-2 text-(--text-secondary)/70">
                                              (Installment {seq.current} of{" "}
                                              {seq.total})
                                            </span>
                                          )}
                                        </span>
                                        <span className="font-medium text-(--text-primary)">
                                          ₦{(p.amount || 0).toLocaleString()}
                                        </span>
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                          )}

                          {Object.keys(customer.customFields || {}).length >
                            0 && (
                            <div className="mt-3 border-t border-(--border-color) pt-3">
                              <p className="mb-1.5 text-xs font-semibold text-(--text-secondary)">
                                Submitted information
                              </p>
                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {Object.entries(customer.customFields).map(
                                  ([label, value]: [string, any]) => (
                                    <div
                                      key={label}
                                      className="flex items-start gap-2 text-xs"
                                    >
                                      <span className="shrink-0 text-(--text-secondary)">
                                        {label}:
                                      </span>
                                      <span className="break-words text-(--text-primary)">
                                        {String(value)}
                                      </span>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* QR Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="squircle-lg w-full max-w-sm border border-(--border-color) bg-(--bg-primary) p-6 shadow-(--shadow-pop)">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-(--text-primary)">
                QR Code
              </h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-(--text-secondary) hover:text-(--text-primary)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-col items-center">
              <img
                src={`/api/payment-page/qrcode?url=${encodeURIComponent(
                  getPaymentPageUrl(),
                )}`}
                alt="QR Code"
                className="squircle-md h-48 w-48 bg-white p-2"
              />
              <p className="mt-4 text-center text-sm text-(--text-secondary)">
                Scan to open payment page
              </p>
              <Button
                onClick={downloadQRCode}
                className="squircle-md mt-4 w-full bg-(--color-accent-yellow) text-(--color-ink) hover:opacity-90"
              >
                <Download className="mr-2 h-4 w-4" /> Download
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Embed Modal */}
      {showEmbedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="squircle-lg w-full max-w-sm border border-(--border-color) bg-(--bg-primary) p-6 shadow-(--shadow-pop)">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-(--text-primary)">
                Embed Code
              </h3>
              <button
                onClick={() => setShowEmbedModal(false)}
                className="text-(--text-secondary) hover:text-(--text-primary)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="squircle-md mb-4 overflow-x-auto bg-(--bg-secondary) p-3">
              <code className="whitespace-pre-wrap break-all font-mono text-xs text-(--text-primary)">
                {getEmbedCode()}
              </code>
            </div>
            <Button
              onClick={copyEmbedCode}
              className="squircle-md w-full bg-(--color-accent-yellow) text-(--color-ink) hover:opacity-90"
            >
              {copiedEmbed ? (
                <CheckCircle className="mr-2 h-4 w-4" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              {copiedEmbed ? "Copied!" : "Copy Code"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PageDetail;
