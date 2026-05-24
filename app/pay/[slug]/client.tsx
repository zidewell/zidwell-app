// app/pay/[slug]/client.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Shield,
  Loader2,
  CheckCircle,
  AlertCircle,
  UserCheck,
  Copy,
  Check,
  Banknote,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";

interface Student {
  name: string;
  className: string;
  regNumber?: string;
  paid?: boolean;
  isPartiallyPaid?: boolean;
  paidAmount?: number;
  parentName?: string;
  remainingBalance?: number;
  totalAmount?: number;
}

interface PaymentPage {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImage: string | null;
  logo: string | null;
  productImages: string[];
  priceType: "fixed" | "installment" | "open";
  price: number;
  installmentCount?: number;
  feeMode: "bearer" | "customer";
  pageType: string;
  metadata: any;
  virtualAccount?: {
    accountNumber: string;
    bankName: string;
    accountName: string;
    bankAccountName?: string;
  };
}

interface PaymentPageClientProps {
  slug: string;
}

type PaymentOption = "full" | "installment";

export default function PaymentPageClient({ slug }: PaymentPageClientProps) {
  const router = useRouter();
  const [page, setPage] = useState<PaymentPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState(0);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<PaymentOption>("full");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const students = useMemo(() => {
    const rawStudents = page?.metadata?.students || [];
    const totalAmount = page?.price || 0;
    
    return rawStudents.map((student: Student) => {
      const paidAmount = student.paidAmount || 0;
      const remainingBalance = totalAmount - paidAmount;
      const isFullyPaid = paidAmount >= totalAmount;
      
      return {
        ...student,
        paidAmount,
        remainingBalance: remainingBalance > 0 ? remainingBalance : 0,
        paid: isFullyPaid,
        isPartiallyPaid: paidAmount > 0 && !isFullyPaid,
        totalAmount,
      };
    });
  }, [page?.metadata?.students, page?.price]);

  const feeBreakdown = useMemo(() => {
    return page?.metadata?.feeBreakdown || [];
  }, [page?.metadata?.feeBreakdown]);

  const className = useMemo(() => {
    return page?.metadata?.className || "";
  }, [page?.metadata?.className]);

  const totalAmountPerStudent = useMemo(() => {
    return page?.price || 0;
  }, [page?.price]);

  const getTotalAmount = () => {
    if (feeBreakdown.length > 0) {
      return feeBreakdown.reduce((sum, item) => sum + item.amount, 0);
    }
    return totalAmountPerStudent;
  };

  const getAmountToPay = () => {
    const totalAmount = getTotalAmount();
    if (selectedPaymentOption === "installment" && page?.installmentCount && page.installmentCount > 1) {
      return totalAmount / page.installmentCount;
    }
    return totalAmount;
  };

  const getInstallmentInfo = () => {
    if (page?.installmentCount && page.installmentCount > 1) {
      const totalAmount = getTotalAmount();
      return {
        totalAmount,
        installmentCount: page.installmentCount,
        installmentAmount: totalAmount / page.installmentCount,
      };
    }
    return null;
  };

  const getStudentPayAmount = (student: Student) => {
    const amountPerStudent = getAmountToPay();
    return Math.min(amountPerStudent, student.remainingBalance || 0);
  };

  const getTotalForSelectedStudents = () => {
    let total = 0;
    selectedStudents.forEach((studentName) => {
      const student = students.find((s: Student) => s.name === studentName);
      if (student) {
        total += getStudentPayAmount(student);
      }
    });
    return total;
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  useEffect(() => {
    const loadPage = async () => {
      try {
        const response = await fetch(`/api/payment-page/public/${slug}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("Page not found");
          } else {
            setError("Failed to load page");
          }
          return;
        }
        const data = await response.json();
        setPage(data.page);
      } catch (err) {
        console.error("Error loading page:", err);
        setError("Failed to load page");
      } finally {
        setLoading(false);
      }
    };
    loadPage();
  }, [slug]);

  const handleStudentClick = (student: Student) => {
    if (student.paid || student.remainingBalance <= 0) return;
    
    setSelectedStudents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(student.name)) {
        newSet.delete(student.name);
      } else {
        newSet.add(student.name);
      }
      return newSet;
    });
  };

  const handlePayment = async () => {
    if (selectedStudents.size === 0) {
      alert("Please select at least one student");
      return;
    }

    const totalAmount = getTotalForSelectedStudents();
    const isInstallmentPayment = selectedPaymentOption === "installment" && page?.installmentCount && page.installmentCount > 1;
    
    const metadata: any = {
      pageType: page?.pageType,
      pageTitle: page?.title,
      paymentType: isInstallmentPayment ? "installment" : "full",
      isInstallment: isInstallmentPayment,
      selectedStudents: Array.from(selectedStudents),
      numberOfStudents: selectedStudents.size,
      totalAmount: totalAmount,
    };

    if (isInstallmentPayment) {
      const installmentInfo = getInstallmentInfo();
      metadata.totalAmount = installmentInfo?.totalAmount;
      metadata.totalInstallments = installmentInfo?.installmentCount;
      metadata.installmentAmount = installmentInfo?.installmentAmount;
      metadata.currentInstallment = 1;
    }

    try {
      const response = await fetch("/api/payment-page/public/virtual-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageSlug: slug,
          customerName: "Customer",
          customerEmail: "customer@example.com",
          customerPhone: "",
          amount: totalAmount,
          metadata,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      const accountDetails = `Bank: ${data.virtualAccount.bankName}\nAccount Number: ${data.virtualAccount.accountNumber}\nAccount Name: ${data.virtualAccount.accountName}\nAmount: ₦${totalAmount.toLocaleString()}`;
      await copyToClipboard(accountDetails, "all");
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const totalAmount = getTotalAmount();
  const amountToPay = getAmountToPay();
  const installmentInfo = getInstallmentInfo();
  const canDoInstallments = page?.priceType === "installment" && page.installmentCount && page.installmentCount > 1;
  const totalForSelected = getTotalForSelectedStudents();
  const allImages = [...(page?.coverImage ? [page.coverImage] : []), ...(page?.productImages || [])];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e1bf46]"></div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Page not found</h1>
          <p className="text-gray-400 mb-4">This payment page doesn't exist or has been removed.</p>
          <Button variant="default" onClick={() => router.push("/")} className="bg-[#e1bf46] text-[#023528] hover:bg-[#e1bf46]/90">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e0e]">
      {/* Header */}
      <div className="bg-[#023528] text-white sticky top-0 z-10">
        <div className="container py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="hover:opacity-80">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            {page.logo && <img src={page.logo} className="h-10 w-10 rounded-xl object-cover" alt="Logo" />}
            <div>
              <h1 className="font-bold text-lg leading-tight">{page.title}</h1>
              <p className="text-white/60 text-xs">by zidwell.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* Images Carousel */}
      {allImages.length > 0 && (
        <div className="relative bg-black/5">
          <img src={allImages[currentImage]} alt={page.title} className="w-full h-64 md:h-80 object-cover" />
          {allImages.length > 1 && (
            <>
              <button onClick={() => setCurrentImage((c) => (c === 0 ? allImages.length - 1 : c - 1))} className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40">
                <ChevronLeft className="h-4 w-4 text-white" />
              </button>
              <button onClick={() => setCurrentImage((c) => (c === allImages.length - 1 ? 0 : c + 1))} className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40">
                <ChevronRight className="h-4 w-4 text-white" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {allImages.map((_, i) => (
                  <span key={i} className={`h-1.5 rounded-full transition-all ${i === currentImage ? "w-4 bg-white" : "w-1.5 bg-white/50"}`} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Content */}
      <div className="max-w-lg mx-auto py-6 space-y-6 px-4 pb-32">
        {/* Title */}
        <div>
          <h2 className="text-2xl font-bold text-white">{page.title}</h2>
          {className && (
            <span className="inline-block px-3 py-1 rounded-full bg-[#e1bf46]/10 text-[#e1bf46] text-sm font-medium mt-2">
              {className}
            </span>
          )}
          {page.description && <p className="text-gray-400 text-sm mt-2">{page.description}</p>}
        </div>

        {/* Fee Breakdown */}
        {page.pageType === "school" && feeBreakdown.length > 0 && (
          <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-5">
            <h3 className="font-bold text-lg mb-4 text-white">Fee Breakdown</h3>
            {feeBreakdown.map((item, index) => (
              <div key={index} className="flex justify-between py-2 border-b border-gray-800">
                <span className="text-gray-400">{item.label}</span>
                <span className="font-semibold text-white">₦{item.amount.toLocaleString()}</span>
              </div>
            ))}
            <div className="flex justify-between pt-3 font-bold">
              <span className="text-white">Total per Student</span>
              <span className="text-[#e1bf46]">₦{totalAmount.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Payment Options */}
        {canDoInstallments && (
          <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-5">
            <h3 className="font-bold text-lg mb-4 text-white">Payment Options</h3>
            <div className="space-y-3">
              <div
                onClick={() => setSelectedPaymentOption("full")}
                className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedPaymentOption === "full" 
                    ? "border-[#e1bf46] bg-[#e1bf46]/10" 
                    : "border-gray-700 hover:border-[#e1bf46]/50"
                }`}
              >
                <div>
                  <p className="font-semibold text-white">Pay in Full</p>
                  <p className="text-sm text-gray-400">Pay once</p>
                </div>
                <p className="font-bold text-[#e1bf46]">₦{totalAmount.toLocaleString()}</p>
              </div>
              <div
                onClick={() => setSelectedPaymentOption("installment")}
                className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedPaymentOption === "installment" 
                    ? "border-[#e1bf46] bg-[#e1bf46]/10" 
                    : "border-gray-700 hover:border-[#e1bf46]/50"
                }`}
              >
                <div>
                  <p className="font-semibold text-white">Pay in Installments</p>
                  <p className="text-sm text-gray-400">
                    {page.installmentCount} payments
                  </p>
                </div>
                <p className="font-bold text-[#e1bf46]">₦{installmentInfo?.installmentAmount.toLocaleString()} / month</p>
              </div>
            </div>
          </div>
        )}

        {/* Student Selection with Scroll */}
        {page.pageType === "school" && (
          <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-5 space-y-4">
            <h3 className="font-bold text-lg text-white">Select Students</h3>
            
            {/* Scrollable Student List */}
            <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
              {students.map((student: Student) => {
                const isSelected = selectedStudents.has(student.name);
                const isPaid = student.paid;
                const isPartiallyPaid = student.isPartiallyPaid;
                const payAmount = getStudentPayAmount(student);
                const totalAmount = student.totalAmount;
                const paidAmount = student.paidAmount || 0;
                
                // Fully paid - show as paid
                if (isPaid) {
                  return (
                    <div
                      key={student.name}
                      className="p-4 rounded-xl bg-green-900/20 border border-green-800 opacity-70"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-white">{student.name}</p>
                          <div className="flex gap-3 text-xs text-gray-400">
                            {student.className && <span>📚 {student.className}</span>}
                            {student.regNumber && <span>🔢 {student.regNumber}</span>}
                          </div>
                          <p className="text-xs text-green-400 mt-1">
                            ✓ Paid {paidAmount.toLocaleString()} of {totalAmount.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> PAID
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                
                // Partially paid - installment payment in progress
                if (isPartiallyPaid) {
                  return (
                    <div
                      key={student.name}
                      className="p-4 rounded-xl bg-yellow-900/20 border border-yellow-800"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-white">{student.name}</p>
                          <div className="flex gap-3 text-xs text-gray-400">
                            {student.className && <span>📚 {student.className}</span>}
                            {student.regNumber && <span>🔢 {student.regNumber}</span>}
                          </div>
                          <p className="text-xs text-yellow-400 mt-1">
                            Partially paid {paidAmount.toLocaleString()} of {totalAmount.toLocaleString()}
                          </p>
                          <p className="text-xs text-[#e1bf46] mt-1">
                            Remaining: ₦{student.remainingBalance.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                            PARTIAL
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                
                // Unpaid - selectable
                return (
                  <div
                    key={student.name}
                    onClick={() => handleStudentClick(student)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected ? "border-[#e1bf46] bg-[#e1bf46]/10" : "border-gray-700 hover:border-[#e1bf46]/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-white">{student.name}</p>
                        <div className="flex gap-3 text-xs text-gray-400">
                          {student.className && <span>📚 {student.className}</span>}
                          {student.regNumber && <span>🔢 {student.regNumber}</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#e1bf46]">₦{payAmount.toLocaleString()}</p>
                        {selectedPaymentOption === "installment" && installmentInfo && (
                          <p className="text-xs text-gray-400">Installment</p>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="mt-2 pt-2 border-t border-[#e1bf46]/20">
                        <p className="text-xs text-[#e1bf46]">✓ Selected for payment</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {selectedStudents.size > 0 && (
              <div className="p-4 bg-[#e1bf46]/10 rounded-xl border border-[#e1bf46]/20">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-300">Selected:</span>
                  <span className="font-bold text-white">{selectedStudents.size} student(s)</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#e1bf46]/20">
                  <span className="font-semibold text-white">Total to Pay:</span>
                  <span className="text-xl font-bold text-[#e1bf46]">₦{totalForSelected.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bank Transfer Details */}
        {page.virtualAccount && (
          <div className="bg-gradient-to-r from-blue-900/30 to-green-900/30 rounded-2xl p-6 border border-blue-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-900/40 flex items-center justify-center">
                <Banknote className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Bank Transfer Details</h3>
                <p className="text-xs text-gray-400">Transfer to this account</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-gray-900 rounded-xl p-3">
                <p className="text-xs text-gray-500">Bank Name</p>
                <p className="font-semibold text-white">{page.virtualAccount.bankName}</p>
              </div>
              <div className="bg-gray-900 rounded-xl p-3">
                <p className="text-xs text-gray-500">Account Number</p>
                <p className="font-mono font-bold text-xl text-white">{page.virtualAccount.accountNumber}</p>
              </div>
              <div className="bg-gray-900 rounded-xl p-3">
                <p className="text-xs text-gray-500">Account Name</p>
                <p className="font-semibold text-white break-all">{page.virtualAccount.bankAccountName || page.virtualAccount.accountName}</p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-yellow-900/20 rounded-xl border border-yellow-800">
              <p className="text-xs text-yellow-400">
                📝 Important: Use <strong className="text-yellow-300">student name(s)</strong> as narration/reference
              </p>
            </div>

            {totalForSelected > 0 && (
              <Button
                onClick={handlePayment}
                className="w-full mt-4 bg-[#e1bf46] text-[#023528] hover:bg-[#e1bf46]/90 font-semibold"
              >
                <Banknote className="h-4 w-4 mr-2" />
                Pay ₦{totalForSelected.toLocaleString()}
              </Button>
            )}
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <Shield className="h-3.5 w-3.5" /> Secured by Zidwell
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl p-6 max-w-sm w-full text-center border border-gray-700">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-white mb-2">Account Details Copied!</h3>
            <p className="text-gray-400 text-sm mb-4">
              Bank details have been copied to your clipboard.
              Make your transfer using the information provided.
            </p>
            <Button onClick={() => setShowSuccess(false)} className="w-full bg-[#e1bf46] text-[#023528] hover:bg-[#e1bf46]/90">
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #2a2a2a;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e1bf46;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #c9a832;
        }
      `}</style>
    </div>
  );
}