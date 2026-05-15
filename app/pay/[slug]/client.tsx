// app/payment-page/[slug]/page.tsx

"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Shield,
  Calendar,
  CreditCard,
  Loader2,
  Package,
  FileDown,
  Briefcase,
  Heart,
  GraduationCap,
  Building2,
  UserCheck,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<PaymentOption>("full");
  const [selectedStudentDetails, setSelectedStudentDetails] = useState<Student | null>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    amount: "",
    parentName: "",
    customFields: {} as Record<string, string>,
    selectedVariants: {} as Record<string, string>,
    quantity: "1",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    bookingDate: "",
    bookingTime: "",
    customerNote: "",
    donorMessage: "",
  });

  // Extract data from metadata
  const students = useMemo(() => {
    const rawStudents = page?.metadata?.students || [];
    return rawStudents.map((student: Student) => ({
      ...student,
      paidAmount: student.paidAmount || 0,
      remainingBalance: student.remainingBalance !== undefined ? student.remainingBalance : (page?.metadata?.totalAmountPerStudent || page?.price || 0),
      paid: student.paid || false,
      totalAmount: page?.metadata?.totalAmountPerStudent || page?.metadata?.totalAmount || page?.price || 0,
    }));
  }, [page?.metadata?.students, page?.metadata?.totalAmountPerStudent, page?.metadata?.totalAmount, page?.price]);

  const feeBreakdown = useMemo(() => {
    return page?.metadata?.feeBreakdown || [];
  }, [page?.metadata?.feeBreakdown]);

  const requiredFields = useMemo(() => {
    return page?.metadata?.requiredFields || [];
  }, [page?.metadata?.requiredFields]);

  const className = useMemo(() => {
    return page?.metadata?.className || "";
  }, [page?.metadata?.className]);

  const totalAmountPerStudent = useMemo(() => {
    return page?.metadata?.totalAmountPerStudent || page?.metadata?.totalAmount || page?.price || 0;
  }, [page?.metadata?.totalAmountPerStudent, page?.metadata?.totalAmount, page?.price]);

  // Filter students - only fully paid go to paidStudents
  const partiallyPaidStudents = useMemo(() => {
    return students.filter((s: Student) => !s.paid && s.paidAmount > 0 && s.remainingBalance > 0);
  }, [students]);

  const unpaidStudents = useMemo(() => {
    return students.filter((s: Student) => !s.paid && s.paidAmount === 0 && s.remainingBalance > 0);
  }, [students]);

  const fullyPaidStudents = useMemo(() => {
    return students.filter((s: Student) => s.paid === true || s.remainingBalance <= 0);
  }, [students]);

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
        console.log("Loaded page with student payments:", data.page.metadata?.students);
      } catch (err) {
        console.error("Error loading page:", err);
        setError("Failed to load page");
      } finally {
        setLoading(false);
      }
    };
    loadPage();
  }, [slug]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCustomFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      customFields: { ...prev.customFields, [field]: value },
    }));
  };

  const handleStudentClick = (student: Student) => {
    // Don't select fully paid students
    if (student.paid || student.remainingBalance <= 0) return;
    
    setSelectedStudentDetails(student);
    setSelectedStudents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(student.name)) {
        newSet.delete(student.name);
        setSelectedStudentDetails(null);
      } else {
        newSet.add(student.name);
      }
      return newSet;
    });
  };

  const validateForm = () => {
    if (page?.pageType !== "school") {
      if (!formData.fullName.trim()) {
        alert("Please enter your full name");
        return false;
      }
      if (!formData.email.trim()) {
        alert("Please enter your email address");
        return false;
      }
      if (!formData.phone.trim()) {
        alert("Please enter your phone number");
        return false;
      }
    }

    if (page?.pageType === "school") {
      if (!formData.parentName.trim()) {
        alert("Please enter parent's full name");
        return false;
      }
      if (!formData.email.trim()) {
        alert("Please enter your email address");
        return false;
      }
      if (selectedStudents.size === 0) {
        alert("Please select at least one student to pay for");
        return false;
      }
    }

    return true;
  };

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
    return Math.min(amountPerStudent, student.remainingBalance);
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

 
const handlePayment = async () => {
  if (!validateForm()) return;
  setIsProcessing(true);
  
  try {
    const totalAmount = getTotalForSelectedStudents();
    const isInstallmentPayment = selectedPaymentOption === "installment" && page?.installmentCount && page.installmentCount > 1;
    
    const metadata: any = {
      pageType: page?.pageType,
      pageTitle: page?.title,
      paymentType: isInstallmentPayment ? "installment" : "full",
      isInstallment: isInstallmentPayment,
      feeBorneBy: "creator",
    };

    if (isInstallmentPayment) {
      const installmentInfo = getInstallmentInfo();
      metadata.totalAmount = installmentInfo?.totalAmount;
      metadata.totalInstallments = installmentInfo?.installmentCount;
      metadata.installmentAmount = installmentInfo?.installmentAmount;
      metadata.currentInstallment = 1;
    }

    if (page?.pageType === "school") {
      metadata.parentName = formData.parentName;
      metadata.selectedStudents = Array.from(selectedStudents);
      metadata.numberOfStudents = selectedStudents.size;
      metadata.totalAmount = totalAmount;
      metadata.amountPerStudent = totalAmount / selectedStudents.size;
      
      // Get student details for payment tracking
      const selectedStudentData = Array.from(selectedStudents).map(name => {
        const student = students.find(s => s.name === name);
        return {
          name,
          remainingBalance: student?.remainingBalance,
          paidAmount: student?.paidAmount,
        };
      });
      metadata.studentDetails = selectedStudentData;
    }

    const response = await fetch("/api/payment-page/public/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pageSlug: slug,
        customerName: page?.pageType === "school" ? formData.parentName : formData.fullName,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        amount: totalAmount,
        metadata,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    
    window.location.href = data.checkoutLink;
  } catch (err: any) {
    alert(err.message);
  } finally {
    setIsProcessing(false);
  }
};

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

  const totalAmount = getTotalAmount();
  const amountToPay = getAmountToPay();
  const installmentInfo = getInstallmentInfo();
  const canDoInstallments = page.priceType === "installment" && page.installmentCount && page.installmentCount > 1;
  const totalForSelected = getTotalForSelectedStudents();
  const allImages = [...(page.coverImage ? [page.coverImage] : []), ...(page.productImages || [])];

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
                className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer ${
                  selectedPaymentOption === "full" ? "border-[var(--color-accent-yellow)] bg-[var(--color-accent-yellow)]/10" : "border-[var(--border-color)]"
                }`}
              >
                <div>
                  <p className="font-semibold">Pay in Full</p>
                  <p className="text-sm text-[var(--text-secondary)]">Pay ₦{totalAmount.toLocaleString()} once</p>
                </div>
                <p className="font-bold text-[var(--color-accent-yellow)]">₦{totalAmount.toLocaleString()}</p>
              </div>
              <div
                onClick={() => setSelectedPaymentOption("installment")}
                className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer ${
                  selectedPaymentOption === "installment" ? "border-[var(--color-accent-yellow)] bg-[var(--color-accent-yellow)]/10" : "border-[var(--border-color)]"
                }`}
              >
                <div>
                  <p className="font-semibold">Pay in Installments</p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {page.installmentCount} payments of ₦{installmentInfo?.installmentAmount.toLocaleString()}
                  </p>
                </div>
                <p className="font-bold text-[var(--color-accent-yellow)]">₦{installmentInfo?.installmentAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* School Page - Student Selection */}
        {page.pageType === "school" && (
          <div className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] p-5 space-y-4">
            <h3 className="font-bold text-lg text-[var(--text-primary)]">Select Students</h3>
            
            {/* Unpaid Students - No payment yet */}
            {unpaidStudents.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-[var(--color-accent-yellow)]"></div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Not Paid Yet</p>
                </div>
                <div className="space-y-2">
                  {unpaidStudents.map((student: Student) => {
                    const isSelected = selectedStudents.has(student.name);
                    const payAmount = getStudentPayAmount(student);
                    
                    return (
                      <div
                        key={student.name}
                        onClick={() => handleStudentClick(student)}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected ? "border-[var(--color-accent-yellow)] bg-[var(--color-accent-yellow)]/10" : "border-[var(--border-color)]"
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
                              <p className="font-medium text-[var(--text-primary)]">{student.name}</p>
                              <div className="flex gap-3 text-xs text-[var(--text-secondary)]">
                                {student.className && <span>Class: {student.className}</span>}
                                {student.regNumber && <span>Reg: {student.regNumber}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-[var(--color-accent-yellow)]">
                              ₦{payAmount.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Partially Paid Students - Have some payment but not fully paid */}
            {partiallyPaidStudents.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2 mt-4">
                  <div className="w-2 h-2 rounded-full bg-[var(--color-accent-yellow)]"></div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Partially Paid (Remaining Balance)</p>
                </div>
                <div className="space-y-2">
                  {partiallyPaidStudents.map((student: Student) => {
                    const isSelected = selectedStudents.has(student.name);
                    const payAmount = getStudentPayAmount(student);
                    const paidPercentage = (student.paidAmount / student.totalAmount) * 100;
                    
                    return (
                      <div
                        key={student.name}
                        onClick={() => handleStudentClick(student)}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected ? "border-[var(--color-accent-yellow)] bg-[var(--color-accent-yellow)]/10" : "border-[var(--border-color)]"
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
                              <p className="font-medium text-[var(--text-primary)]">{student.name}</p>
                              <div className="flex gap-3 text-xs text-[var(--text-secondary)]">
                                {student.className && <span>Class: {student.className}</span>}
                                {student.regNumber && <span>Reg: {student.regNumber}</span>}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="w-24 h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-[var(--color-accent-yellow)] rounded-full"
                                    style={{ width: `${paidPercentage}%` }}
                                  />
                                </div>
                                <span className="text-xs text-[var(--color-accent-yellow)]">
                                  {paidPercentage.toFixed(0)}% paid
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-[var(--text-secondary)]">Remaining</p>
                            <p className="font-semibold text-[var(--color-accent-yellow)]">
                              ₦{payAmount.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        
                        {/* Show detailed payment info when selected */}
                        {isSelected && selectedStudentDetails && selectedStudentDetails.name === student.name && (
                          <div className="mt-3 p-3 bg-[var(--color-accent-yellow)]/5 rounded-lg border border-[var(--color-accent-yellow)]/20">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-[var(--color-accent-yellow)] mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-[var(--text-primary)]">Payment Details</p>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                  <div>
                                    <p className="text-xs text-[var(--text-secondary)]">Total Amount:</p>
                                    <p className="text-sm font-semibold">₦{student.totalAmount.toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-[var(--text-secondary)]">Already Paid:</p>
                                    <p className="text-sm font-semibold text-[var(--color-lemon-green)]">₦{student.paidAmount.toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-[var(--text-secondary)]">Remaining:</p>
                                    <p className="text-sm font-semibold text-[var(--color-accent-yellow)]">₦{student.remainingBalance.toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-[var(--text-secondary)]">This Payment:</p>
                                    <p className="text-sm font-semibold text-[var(--color-accent-yellow)]">₦{payAmount.toLocaleString()}</p>
                                  </div>
                                </div>
                                {page.installmentCount && page.installmentCount > 1 && (
                                  <p className="text-xs text-[var(--text-secondary)] mt-2">
                                    Installment {Math.ceil(student.paidAmount / (student.totalAmount / page.installmentCount)) + 1} of {page.installmentCount}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Fully Paid Students - Cannot select */}
            {fullyPaidStudents.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck className="h-4 w-4 text-[var(--color-lemon-green)]" />
                  <p className="text-sm font-medium text-[var(--text-primary)]">Fully Paid Students</p>
                </div>
                <div className="space-y-2 opacity-60">
                  {fullyPaidStudents.map((student: Student) => (
                    <div
                      key={student.name}
                      className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] cursor-not-allowed"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded border-2 border-[var(--color-lemon-green)] bg-[var(--color-lemon-green)]/20 flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-[var(--color-lemon-green)]" />
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
                          <span className="text-xs text-[var(--color-lemon-green)] font-medium">PAID ✓</span>
                          <p className="text-xs text-[var(--text-secondary)]">₦{student.totalAmount.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedStudents.size > 0 && (
              <div className="p-3 bg-[var(--color-accent-yellow)]/10 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-sm">Selected:</span>
                  <span className="font-bold">{selectedStudents.size} student(s)</span>
                </div>
                <div className="flex justify-between mt-2 pt-2 border-t border-[var(--color-accent-yellow)]/20">
                  <span className="font-semibold">Total to Pay:</span>
                  <span className="text-lg font-bold text-[var(--color-accent-yellow)]">₦{totalForSelected.toLocaleString()}</span>
                </div>
              </div>
            )}

            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Parent/Guardian Name *</Label>
              <Input
                placeholder="Enter parent or guardian's full name"
                value={formData.parentName}
                onChange={(e) => handleInputChange("parentName", e.target.value)}
                className="h-12"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Email Address *</Label>
              <Input
                type="email"
                placeholder="parent@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="h-12"
              />
              <p className="text-xs text-[var(--text-secondary)] mt-1">Receipt will be sent here</p>
            </div>

            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Phone Number</Label>
              <Input
                type="tel"
                placeholder="08012345678"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className="h-12"
              />
            </div>

            {requiredFields.length > 0 && (
              <div className="space-y-4">
                <Label className="text-sm font-semibold">Additional Information</Label>
                {requiredFields.map((field: string) => (
                  <Input
                    key={field}
                    placeholder={field}
                    value={formData.customFields[field] || ""}
                    onChange={(e) => handleCustomFieldChange(field, e.target.value)}
                    className="h-12"
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Payment Summary */}
        <div className="bg-[var(--bg-secondary)] rounded-2xl p-5 space-y-3 border">
          <div className="flex justify-between font-bold text-lg">
            <span>Total to Pay</span>
            <span className="text-[var(--color-accent-yellow)]">
              ₦{(page.pageType === "school" ? totalForSelected : amountToPay).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Pay Button */}
        <Button
          variant="default"
          size="lg"
          className="w-full py-6 text-base bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90"
          onClick={handlePayment}
          disabled={isProcessing || (page.pageType === "school" && selectedStudents.size === 0)}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay ₦${(page.pageType === "school" ? totalForSelected : amountToPay).toLocaleString()}`
          )}
        </Button>

        <div className="flex items-center justify-center gap-2 text-xs text-[var(--text-secondary)]">
          <Shield className="h-3.5 w-3.5" /> Secured by Zidwell
        </div>
      </div>
    </div>
  );
}