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
  TrendingUp,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";

interface Student {
  name: string;
  className: string;
  regNumber?: string;
  paid?: boolean;
  paidAt?: string;
  paidAmount?: number;
  parentName?: string;
  remainingBalance?: number;
  totalAmount?: number;
  paidPercentage?: number;  // Add this property
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

  // Extract data from metadata
  const students = useMemo(() => {
    const rawStudents = page?.metadata?.students || [];
    return rawStudents.map((student: Student) => {
      const totalAmount = page?.metadata?.totalAmountPerStudent || page?.price || 0;
      const paidAmount = student.paidAmount || 0;
      const remainingBalance = totalAmount - paidAmount;
      const paidPercentage = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
      
      return {
        ...student,
        paidAmount,
        remainingBalance: remainingBalance > 0 ? remainingBalance : 0,
        paid: student.paid || paidAmount >= totalAmount,
        totalAmount,
        paidPercentage,
      };
    });
  }, [page?.metadata?.students, page?.metadata?.totalAmountPerStudent, page?.price]);

  const feeBreakdown = useMemo(() => {
    return page?.metadata?.feeBreakdown || [];
  }, [page?.metadata?.feeBreakdown]);

  const className = useMemo(() => {
    return page?.metadata?.className || "";
  }, [page?.metadata?.className]);

  const totalAmountPerStudent = useMemo(() => {
    return page?.metadata?.totalAmountPerStudent || page?.metadata?.totalAmount || page?.price || 0;
  }, [page?.metadata?.totalAmountPerStudent, page?.metadata?.totalAmount, page?.price]);

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
    // Only charge the remaining balance, not more
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
    if (student.paid || (student.remainingBalance && student.remainingBalance <= 0)) return;
    
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

  const totalAmount = getTotalAmount();
  const amountToPay = getAmountToPay();
  const installmentInfo = getInstallmentInfo();
  const canDoInstallments = page?.priceType === "installment" && page.installmentCount && page.installmentCount > 1;
  const totalForSelected = getTotalForSelectedStudents();
  const allImages = [...(page?.coverImage ? [page.coverImage] : []), ...(page?.productImages || [])];

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-accent-yellow)]"></div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Page not found</h1>
          <p className="text-[var(--text-secondary)] mb-4">This payment page doesn't exist or has been removed.</p>
          <Button variant="default" onClick={() => router.push("/")} className="bg-[var(--color-accent-yellow)] text-[var(--color-ink)]">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)]">
      {/* Header */}
      <div className="bg-[var(--color-ink)] text-white sticky top-0 z-10">
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
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">{page.title}</h2>
          {className && (
            <span className="inline-block px-3 py-1 rounded-full bg-[var(--color-accent-yellow)]/10 text-[var(--color-accent-yellow)] text-sm font-medium mt-2">
              {className}
            </span>
          )}
          {page.description && <p className="text-[var(--text-secondary)] text-sm mt-2">{page.description}</p>}
        </div>

        {/* Fee Breakdown */}
        {page.pageType === "school" && feeBreakdown.length > 0 && (
          <div className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] p-5">
            <h3 className="font-bold text-lg mb-4 text-[var(--text-primary)]">Fee Breakdown</h3>
            {feeBreakdown.map((item, index) => (
              <div key={index} className="flex justify-between py-2 border-b border-[var(--border-color)]">
                <span className="text-[var(--text-secondary)]">{item.label}</span>
                <span className="font-semibold">₦{item.amount.toLocaleString()}</span>
              </div>
            ))}
            <div className="flex justify-between pt-3 font-bold">
              <span>Total per Student</span>
              <span className="text-[var(--color-accent-yellow)]">₦{totalAmount.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Payment Options */}
        {canDoInstallments && (
          <div className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] p-5">
            <h3 className="font-bold text-lg mb-4 text-[var(--text-primary)]">Payment Options</h3>
            <div className="space-y-3">
              <div
                onClick={() => setSelectedPaymentOption("full")}
                className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedPaymentOption === "full" 
                    ? "border-[var(--color-accent-yellow)] bg-[var(--color-accent-yellow)]/10" 
                    : "border-[var(--border-color)] hover:border-[var(--color-accent-yellow)]/50"
                }`}
              >
                <div>
                  <p className="font-semibold">Pay in Full</p>
                  <p className="text-sm text-[var(--text-secondary)]">Pay once</p>
                </div>
                <p className="font-bold text-[var(--color-accent-yellow)]">₦{totalAmount.toLocaleString()}</p>
              </div>
              <div
                onClick={() => setSelectedPaymentOption("installment")}
                className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedPaymentOption === "installment" 
                    ? "border-[var(--color-accent-yellow)] bg-[var(--color-accent-yellow)]/10" 
                    : "border-[var(--border-color)] hover:border-[var(--color-accent-yellow)]/50"
                }`}
              >
                <div>
                  <p className="font-semibold">Pay in Installments</p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {page.installmentCount} payments
                  </p>
                </div>
                <p className="font-bold text-[var(--color-accent-yellow)]">₦{installmentInfo?.installmentAmount.toLocaleString()} / month</p>
              </div>
            </div>
          </div>
        )}

        {/* School Page - Student Selection with Progress Bar */}
        {page.pageType === "school" && (
          <div className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] p-5 space-y-4">
            <h3 className="font-bold text-lg text-[var(--text-primary)]">Select Students</h3>
            
            {/* Partially Paid Students - Have some payment but not fully paid */}
            {students.filter((s: Student) => !s.paid && (s.paidAmount || 0) > 0).length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-[var(--color-accent-yellow)]" />
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Partially Paid (Continue Payment)</p>
                </div>
                <div className="space-y-3">
                  {students.filter((s: Student) => !s.paid && (s.paidAmount || 0) > 0).map((student: Student) => {
                    const isSelected = selectedStudents.has(student.name);
                    const payAmount = getStudentPayAmount(student);
                    const paidPercentage = student.paidPercentage || 0;
                    
                    return (
                      <div
                        key={student.name}
                        onClick={() => handleStudentClick(student)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected ? "border-[var(--color-accent-yellow)] bg-[var(--color-accent-yellow)]/10" : "border-[var(--border-color)] hover:border-[var(--color-accent-yellow)]/50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              isSelected ? "bg-[var(--color-accent-yellow)] border-[var(--color-accent-yellow)]" : "border-[var(--text-secondary)]"
                            }`}>
                              {isSelected && <CheckCircle className="h-4 w-4 text-white" />}
                            </div>
                            <div>
                              <p className="font-semibold text-[var(--text-primary)]">{student.name}</p>
                              <div className="flex gap-3 text-xs text-[var(--text-secondary)]">
                                {student.className && <span>Class: {student.className}</span>}
                                {student.regNumber && <span>Reg: {student.regNumber}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-[var(--text-secondary)]">Remaining</p>
                            <p className="font-bold text-[var(--color-accent-yellow)]">
                              ₦{payAmount.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-1">
                            <span>Payment Progress</span>
                            <span>{paidPercentage.toFixed(0)}% paid</span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[var(--color-accent-yellow)] rounded-full transition-all duration-300"
                              style={{ width: `${paidPercentage}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-[var(--text-secondary)] mt-1">
                            <span>Paid: ₦{(student.paidAmount || 0).toLocaleString()}</span>
                            <span>Total: ₦{(student.totalAmount || 0).toLocaleString()}</span>
                          </div>
                        </div>
                        
                        {/* Installment Info */}
                        {selectedPaymentOption === "installment" && installmentInfo && (
                          <div className="mt-3 pt-2 border-t border-[var(--border-color)]">
                            <p className="text-xs text-[var(--color-accent-yellow)]">
                              This payment: ₦{payAmount.toLocaleString()} (Installment)
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Unpaid Students - No payment yet */}
            {students.filter((s: Student) => !s.paid && (s.paidAmount || 0) === 0).length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-[var(--color-accent-yellow)]"></div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Not Paid Yet</p>
                </div>
                <div className="space-y-3">
                  {students.filter((s: Student) => !s.paid && (s.paidAmount || 0) === 0).map((student: Student) => {
                    const isSelected = selectedStudents.has(student.name);
                    const payAmount = getStudentPayAmount(student);
                    
                    return (
                      <div
                        key={student.name}
                        onClick={() => handleStudentClick(student)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected ? "border-[var(--color-accent-yellow)] bg-[var(--color-accent-yellow)]/10" : "border-[var(--border-color)] hover:border-[var(--color-accent-yellow)]/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              isSelected ? "bg-[var(--color-accent-yellow)] border-[var(--color-accent-yellow)]" : "border-[var(--text-secondary)]"
                            }`}>
                              {isSelected && <CheckCircle className="h-4 w-4 text-white" />}
                            </div>
                            <div>
                              <p className="font-semibold text-[var(--text-primary)]">{student.name}</p>
                              <div className="flex gap-3 text-xs text-[var(--text-secondary)]">
                                {student.className && <span>Class: {student.className}</span>}
                                {student.regNumber && <span>Reg: {student.regNumber}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-[var(--color-accent-yellow)]">
                              ₦{payAmount.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        
                        {/* Installment Info */}
                        {selectedPaymentOption === "installment" && installmentInfo && (
                          <div className="mt-3 pt-2 border-t border-[var(--border-color)]">
                            <p className="text-xs text-[var(--color-accent-yellow)]">
                              This payment: ₦{payAmount.toLocaleString()} (Installment)
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Fully Paid Students - Cannot select */}
            {students.filter((s: Student) => s.paid === true || (s.remainingBalance && s.remainingBalance <= 0)).length > 0 && (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <UserCheck className="h-4 w-4 text-green-600" />
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Fully Paid Students</p>
                </div>
                <div className="space-y-2 opacity-60">
                  {students.filter((s: Student) => s.paid === true || (s.remainingBalance && s.remainingBalance <= 0)).map((student: Student) => (
                    <div
                      key={student.name}
                      className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] cursor-not-allowed"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded border-2 border-green-500 bg-green-500/20 flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          </div>
                          <div>
                            <p className="font-medium text-[var(--text-primary)]">{student.name}</p>
                            <div className="flex gap-3 text-xs text-[var(--text-secondary)]">
                              {student.className && <span>Class: {student.className}</span>}
                              {student.regNumber && <span>Reg: {student.regNumber}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-green-600 font-medium">PAID ✓</span>
                          <p className="text-xs text-[var(--text-secondary)]">₦{(student.totalAmount || 0).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedStudents.size > 0 && (
              <div className="p-4 bg-[var(--color-accent-yellow)]/10 rounded-xl">
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Selected Students:</span>
                  <span className="font-bold">{selectedStudents.size} student(s)</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[var(--color-accent-yellow)]/20">
                  <span className="font-semibold">Total to Pay:</span>
                  <span className="text-xl font-bold text-[var(--color-accent-yellow)]">₦{totalForSelected.toLocaleString()}</span>
                </div>
                {selectedPaymentOption === "installment" && installmentInfo && selectedStudents.size > 0 && (
                  <p className="text-xs text-[var(--text-secondary)] mt-2">
                    Installment payment: ₦{(totalForSelected / selectedStudents.size).toLocaleString()} per student
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Virtual Account Display */}
        {page.virtualAccount && (
          <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                <Banknote className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-[var(--text-primary)]">Bank Transfer Details</h3>
                <p className="text-xs text-[var(--text-secondary)]">Use these details to make your payment</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Bank Name */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Bank Name</p>
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-lg">{page.virtualAccount.bankName}</p>
                  <button
                    onClick={() => copyToClipboard(page.virtualAccount.bankName, "bank")}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    {copiedField === "bank" ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Account Number */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Account Number</p>
                <div className="flex items-center justify-between">
                  <p className="font-mono font-bold text-2xl tracking-wider">{page.virtualAccount.accountNumber}</p>
                  <button
                    onClick={() => copyToClipboard(page.virtualAccount.accountNumber, "account")}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    {copiedField === "account" ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Account Name */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Account Name</p>
                <div className="flex items-center justify-between">
                  <p className="font-semibold break-all">{page.virtualAccount.bankAccountName || page.virtualAccount.accountName}</p>
                  <button
                    onClick={() => copyToClipboard(page.virtualAccount.bankAccountName || page.virtualAccount.accountName, "name")}
                    className="text-blue-500 hover:text-blue-700 shrink-0 ml-2"
                  >
                    {copiedField === "name" ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Total Amount to Pay */}
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Amount to Pay</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                ₦{totalForSelected.toLocaleString()}
              </p>
              {selectedStudents.size > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  For {selectedStudents.size} student(s)
                </p>
              )}
              {selectedPaymentOption === "installment" && installmentInfo && selectedStudents.size > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Installment payment: ₦{(totalForSelected / selectedStudents.size).toLocaleString()} per student
                </p>
              )}
            </div>

            {/* Payment Instructions */}
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">Important Instructions</p>
                  <ul className="text-xs text-yellow-700 dark:text-yellow-400 mt-2 space-y-1 list-disc list-inside">
                    <li>Transfer the exact amount shown above</li>
                    <li>Use <strong>student name(s)</strong> as narration/reference</li>
                    <li>Payment confirms automatically within 5-10 minutes</li>
                    <li>Transaction fee is covered by the merchant</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Copy All Button */}
            {totalForSelected > 0 && (
              <button
                onClick={() => {
                  const allDetails = `Bank: ${page.virtualAccount?.bankName}\nAccount Number: ${page.virtualAccount?.accountNumber}\nAccount Name: ${page.virtualAccount?.bankAccountName || page.virtualAccount?.accountName}\nAmount: ₦${totalForSelected.toLocaleString()}\nStudents: ${Array.from(selectedStudents).join(", ")}`;
                  copyToClipboard(allDetails, "all");
                }}
                className="mt-4 w-full py-2 text-sm text-blue-600 hover:text-blue-700 flex items-center justify-center gap-2 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
              >
                {copiedField === "all" ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copy All Details</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-xs text-[var(--text-secondary)] pt-4">
          <Shield className="h-3.5 w-3.5" /> Secured by Zidwell
        </div>
      </div>
    </div>
  );
}