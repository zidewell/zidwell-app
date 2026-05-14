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
  LineChart,
  PiggyBank,
  Bitcoin,
  UserCheck,
  CheckCircle,
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
    return page?.metadata?.students || [];
  }, [page?.metadata?.students]);

  const feeBreakdown = useMemo(() => {
    return page?.metadata?.feeBreakdown || [];
  }, [page?.metadata?.feeBreakdown]);

  const requiredFields = useMemo(() => {
    return page?.metadata?.requiredFields || [];
  }, [page?.metadata?.requiredFields]);

  const className = useMemo(() => {
    return page?.metadata?.className || "";
  }, [page?.metadata?.className]);

  // Filter students based on paid status
  const unpaidStudents = useMemo(() => {
    return students.filter((s: Student) => !s.paid);
  }, [students]);

  const paidStudents = useMemo(() => {
    return students.filter((s: Student) => s.paid);
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
        console.log("Loaded page:", data.page);
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

  const handleStudentToggle = (studentName: string) => {
    setSelectedStudents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(studentName)) {
        newSet.delete(studentName);
      } else {
        newSet.add(studentName);
      }
      return newSet;
    });
  };

  const validateForm = () => {
    // For non-school pages
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

    // For school pages
    if (page?.pageType === "school") {
      if (!formData.parentName.trim()) {
        alert("Please enter parent's full name");
        return false;
      }
      if (!formData.email.trim()) {
        alert("Please enter your email address (receipt will be sent here)");
        return false;
      }
      if (selectedStudents.size === 0) {
        alert("Please select at least one student to pay for");
        return false;
      }
    }

    // Physical product validation
    if (page?.pageType === "physical") {
      if (page.metadata?.variants && page.metadata.variants.length > 0) {
        for (const variant of page.metadata.variants) {
          if (!formData.selectedVariants[variant.name]) {
            alert(`Please select ${variant.name}`);
            return false;
          }
        }
      }
      if (page.metadata?.requiresShipping && !formData.address.trim()) {
        alert("Please enter your delivery address");
        return false;
      }
    }

    // Services validation
    if (page?.pageType === "services") {
      if (page.metadata?.bookingEnabled && (!formData.bookingDate || !formData.bookingTime)) {
        alert("Please select booking date and time");
        return false;
      }
    }

    // Donation validation
    if (page?.pageType === "donation" && page.priceType === "open" && !formData.amount) {
      alert("Please enter donation amount");
      return false;
    }

    return true;
  };

  const getTotalAmount = () => {
    if (feeBreakdown.length > 0) {
      return feeBreakdown.reduce((sum, item) => sum + item.amount, 0);
    }

    if (page?.priceType === "open" || page?.pageType === "donation") {
      if (page?.pageType === "donation" && formData.amount) {
        return Number(formData.amount);
      }
      return Number(formData.amount) || page?.price || 0;
    }

    if (page?.pageType === "physical") {
      return (page?.price || 0) * (Number(formData.quantity) || 1);
    }

    return page?.price || 0;
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
      const installmentCount = page.installmentCount;
      const installmentAmount = totalAmount / installmentCount;
      return {
        totalAmount,
        installmentCount,
        installmentAmount,
      };
    }
    return null;
  };

  const getTotalForSelectedStudents = () => {
    const amountPerStudent = getAmountToPay();
    return amountPerStudent * selectedStudents.size;
  };

  const handlePayment = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);
    
    try {
      const amountPerStudent = getAmountToPay();
      const totalAmount = page?.pageType === "school" ? getTotalForSelectedStudents() : getAmountToPay();
      const isInstallmentPayment = selectedPaymentOption === "installment" && page?.installmentCount && page.installmentCount > 1;
      
      // Build customer name based on page type
      const customerName = page?.pageType === "school" ? formData.parentName : formData.fullName;
      const customerEmail = formData.email;
      const customerPhone = formData.phone || "";

      // Validate required fields before sending
      if (!slug) {
        throw new Error("Page slug is missing");
      }
      if (!customerName || customerName.trim() === "") {
        throw new Error("Customer name is required");
      }
      if (!customerEmail || customerEmail.trim() === "") {
        throw new Error("Customer email is required");
      }

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
        metadata.remainingInstallments = (installmentInfo?.installmentCount || 1) - 1;
      }

      if (page?.pageType === "school") {
        metadata.parentName = formData.parentName;
        metadata.selectedStudents = Array.from(selectedStudents);
        metadata.customFields = formData.customFields;
        metadata.numberOfStudents = selectedStudents.size;
        metadata.amountPerStudent = amountPerStudent;
        metadata.feeBreakdown = feeBreakdown;
        metadata.className = className;
      }

      if (page?.pageType === "physical") {
        metadata.customerName = formData.fullName;
        metadata.customerEmail = formData.email;
        metadata.customerPhone = formData.phone;
        metadata.selectedVariants = formData.selectedVariants;
        metadata.quantity = formData.quantity;
        metadata.address = formData.address;
        metadata.city = formData.city;
        metadata.state = formData.state;
        metadata.zipCode = formData.zipCode;
      }

      if (page?.pageType === "services") {
        metadata.customerName = formData.fullName;
        metadata.customerEmail = formData.email;
        metadata.customerPhone = formData.phone;
        metadata.bookingDate = formData.bookingDate;
        metadata.bookingTime = formData.bookingTime;
        metadata.customerNote = formData.customerNote;
      }

      if (page?.pageType === "donation") {
        metadata.customerName = formData.fullName;
        metadata.customerEmail = formData.email;
        metadata.customerPhone = formData.phone;
        metadata.donorMessage = formData.donorMessage;
      }

      if (page?.pageType === "digital") {
        metadata.customerName = formData.fullName;
        metadata.customerEmail = formData.email;
        metadata.customerPhone = formData.phone;
      }

      const requestBody = {
        pageSlug: slug,
        customerName: customerName,
        customerEmail: customerEmail,
        customerPhone: customerPhone,
        amount: totalAmount,
        metadata: metadata,
      };

      console.log("📤 Sending payment request:", JSON.stringify(requestBody, null, 2));

      const response = await fetch("/api/payment-page/public/checkout", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout");
      }

      window.location.href = data.checkoutLink;
    } catch (err: any) {
      console.error("Payment error:", err);
      alert(err.message || "Payment failed. Please try again.");
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

  const getPageTypeIcon = () => {
    switch (page.pageType) {
      case "school": return <GraduationCap className="h-5 w-5" />;
      case "donation": return <Heart className="h-5 w-5" />;
      case "physical": return <Package className="h-5 w-5" />;
      case "digital": return <FileDown className="h-5 w-5" />;
      case "services": return <Briefcase className="h-5 w-5" />;
      default: return <CreditCard className="h-5 w-5" />;
    }
  };

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
              <button onClick={() => setCurrentImage((c) => (c === 0 ? allImages.length - 1 : c - 1))} className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/60 transition">
                <ChevronLeft className="h-4 w-4 text-white" />
              </button>
              <button onClick={() => setCurrentImage((c) => (c === allImages.length - 1 ? 0 : c + 1))} className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/60 transition">
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
        {/* Title & Description */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="text-[var(--color-accent-yellow)]">{getPageTypeIcon()}</div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">{page.title}</h2>
          </div>
          {className && (
            <span className="inline-block px-3 py-1 rounded-full bg-[var(--color-accent-yellow)]/10 text-[var(--color-accent-yellow)] text-sm font-medium mb-2">
              {className}
            </span>
          )}
          {page.description && <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{page.description}</p>}
        </div>

        {/* Fee Breakdown for School */}
        {page.pageType === "school" && feeBreakdown.length > 0 && (
          <div className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] p-5">
            <h3 className="font-bold text-lg mb-4 text-[var(--text-primary)]">Fee Breakdown</h3>
            <div className="space-y-3">
              {feeBreakdown.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-[var(--border-color)]">
                  <span className="text-[var(--text-secondary)]">{item.label}</span>
                  <span className="font-semibold text-[var(--text-primary)]">₦{item.amount.toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3 font-bold text-lg">
                <span className="text-[var(--text-primary)]">Total per Student</span>
                <span className="text-[var(--color-accent-yellow)]">₦{totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Payment Options */}
        {canDoInstallments && (
          <div className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] p-5">
            <h3 className="font-bold text-lg mb-4 text-[var(--text-primary)]">Payment Options</h3>
            <div className="space-y-3">
              {/* Full Payment Option */}
              <div
                onClick={() => setSelectedPaymentOption("full")}
                className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedPaymentOption === "full"
                    ? "border-[var(--color-accent-yellow)] bg-[var(--color-accent-yellow)]/10"
                    : "border-[var(--border-color)] hover:border-[var(--color-accent-yellow)]/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedPaymentOption === "full" ? "border-[var(--color-accent-yellow)]" : "border-[var(--text-secondary)]"
                  }`}>
                    {selectedPaymentOption === "full" && <div className="w-3 h-3 rounded-full bg-[var(--color-accent-yellow)]" />}
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">Pay in Full</p>
                    <p className="text-sm text-[var(--text-secondary)]">Pay ₦{totalAmount.toLocaleString()} once</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[var(--color-accent-yellow)]">₦{totalAmount.toLocaleString()}</p>
                </div>
              </div>

              {/* Installment Option */}
              <div
                onClick={() => setSelectedPaymentOption("installment")}
                className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedPaymentOption === "installment"
                    ? "border-[var(--color-accent-yellow)] bg-[var(--color-accent-yellow)]/10"
                    : "border-[var(--border-color)] hover:border-[var(--color-accent-yellow)]/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedPaymentOption === "installment" ? "border-[var(--color-accent-yellow)]" : "border-[var(--text-secondary)]"
                  }`}>
                    {selectedPaymentOption === "installment" && <div className="w-3 h-3 rounded-full bg-[var(--color-accent-yellow)]" />}
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">Pay in Installments</p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {page.installmentCount} {page.installmentCount === 2 ? 'installments' : 'monthly payments'} of ₦{installmentInfo?.installmentAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[var(--color-accent-yellow)]">₦{installmentInfo?.installmentAmount.toLocaleString()}</p>
                  <p className="text-xs text-[var(--text-secondary)]">per {page.installmentCount === 2 ? 'installment' : 'month'}</p>
                </div>
              </div>
            </div>

            {selectedPaymentOption === "installment" && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl">
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Installment Plan Details</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Total: ₦{installmentInfo?.totalAmount.toLocaleString()} • {page.installmentCount} installments
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      You'll be charged ₦{installmentInfo?.installmentAmount.toLocaleString()} today.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Customer Information - Only for non-school pages */}
        {page.pageType !== "school" && (
          <div className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] p-5 space-y-4">
            <h3 className="font-bold text-lg text-[var(--text-primary)]">Your Information</h3>
            
            <div>
              <Label className="text-sm font-semibold mb-1.5 block text-[var(--text-primary)]">Full Name *</Label>
              <Input
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                className="h-12"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold mb-1.5 block text-[var(--text-primary)]">Email Address *</Label>
              <Input
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="h-12"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold mb-1.5 block text-[var(--text-primary)]">Phone Number *</Label>
              <Input
                type="tel"
                placeholder="08012345678"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className="h-12"
              />
            </div>
          </div>
        )}

        {/* School Page - Student Selection with Email and Phone */}
        {page.pageType === "school" && (
          <div className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] p-5 space-y-4">
            <h3 className="font-bold text-lg text-[var(--text-primary)]">Student Information</h3>
            
            {unpaidStudents.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {unpaidStudents.map((student: Student) => (
                  <div
                    key={student.name}
                    onClick={() => handleStudentToggle(student.name)}
                    className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedStudents.has(student.name)
                        ? "border-[var(--color-accent-yellow)] bg-[var(--color-accent-yellow)]/10"
                        : "border-[var(--border-color)] hover:border-[var(--color-accent-yellow)]/50"
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        selectedStudents.has(student.name) ? "bg-[var(--color-accent-yellow)] border-[var(--color-accent-yellow)]" : "border-[var(--text-secondary)]"
                      }`}>
                        {selectedStudents.has(student.name) && <CheckCircle className="h-4 w-4 text-white" />}
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
                      <p className="font-semibold text-[var(--color-accent-yellow)]">₦{amountToPay.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--text-secondary)]">
                {students.length === 0 ? "No students found. Please contact the school administrator." : "All students have been paid for."}
              </div>
            )}

            {selectedStudents.size > 0 && (
              <div className="p-3 bg-[var(--color-accent-yellow)]/10 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-[var(--text-primary)]">Selected:</span>
                  <span className="font-bold text-[var(--color-accent-yellow)]">{selectedStudents.size} student(s)</span>
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-[var(--color-accent-yellow)]/20">
                  <span className="text-sm font-semibold text-[var(--text-primary)]">Total:</span>
                  <span className="text-lg font-bold text-[var(--color-accent-yellow)]">₦{totalForSelected.toLocaleString()}</span>
                </div>
              </div>
            )}

            <div>
              <Label className="text-sm font-semibold mb-1.5 block text-[var(--text-primary)]">Parent/Guardian Full Name *</Label>
              <Input
                placeholder="Enter parent or guardian's full name"
                value={formData.parentName}
                onChange={(e) => handleInputChange("parentName", e.target.value)}
                className="h-12"
              />
            </div>

            {/* Email - Required for receipt */}
            <div>
              <Label className="text-sm font-semibold mb-1.5 block text-[var(--text-primary)]">Email Address *</Label>
              <Input
                type="email"
                placeholder="parent@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="h-12"
              />
              <p className="text-xs text-[var(--text-secondary)] mt-1">Payment receipt will be sent to this email</p>
            </div>

            {/* Phone - Optional */}
            <div>
              <Label className="text-sm font-semibold mb-1.5 block text-[var(--text-primary)]">Phone Number</Label>
              <Input
                type="tel"
                placeholder="08012345678"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className="h-12"
              />
              <p className="text-xs text-[var(--text-secondary)] mt-1">Optional, for payment confirmation</p>
            </div>

            {requiredFields.length > 0 && (
              <div className="space-y-4">
                <Label className="text-sm font-semibold text-[var(--text-primary)]">Additional Information</Label>
                {requiredFields.map((field: string) => (
                  <div key={field}>
                    <Label className="text-sm mb-1.5 block text-[var(--text-secondary)]">{field}</Label>
                    <Input
                      placeholder={`Enter ${field.toLowerCase()}`}
                      value={formData.customFields[field] || ""}
                      onChange={(e) => handleCustomFieldChange(field, e.target.value)}
                      className="h-12"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Physical Product Fields */}
        {page.pageType === "physical" && (
          <div className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] p-5 space-y-4">
            <h3 className="font-bold text-lg text-[var(--text-primary)]">Product Options</h3>
            
            {page.metadata?.variants && page.metadata.variants.length > 0 && (
              <div className="space-y-4">
                {page.metadata.variants.map((variant: any) => (
                  <div key={variant.name}>
                    <Label className="text-sm font-semibold mb-2 block text-[var(--text-primary)]">{variant.name} *</Label>
                    <div className="flex flex-wrap gap-2">
                      {variant.options.filter((opt: string) => opt).map((option: string) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setFormData((prev) => ({
                            ...prev,
                            selectedVariants: { ...prev.selectedVariants, [variant.name]: option },
                          }))}
                          className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                            formData.selectedVariants[variant.name] === option
                              ? "border-[var(--color-accent-yellow)] bg-[var(--color-accent-yellow)]/10 text-[var(--color-accent-yellow)]"
                              : "border-[var(--border-color)] hover:border-[var(--color-accent-yellow)]/50 text-[var(--text-primary)]"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div>
              <Label className="text-sm font-semibold mb-1.5 block text-[var(--text-primary)]">Quantity</Label>
              <Input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => handleInputChange("quantity", e.target.value)}
                className="h-12 w-32"
              />
            </div>

            {page.metadata?.requiresShipping && (
              <>
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block text-[var(--text-primary)]">Delivery Address *</Label>
                  <Textarea
                    placeholder="Enter your full delivery address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-semibold mb-1.5 block text-[var(--text-primary)]">City</Label>
                    <Input placeholder="City" value={formData.city} onChange={(e) => handleInputChange("city", e.target.value)} className="h-12" />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold mb-1.5 block text-[var(--text-primary)]">State</Label>
                    <Input placeholder="State" value={formData.state} onChange={(e) => handleInputChange("state", e.target.value)} className="h-12" />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Digital Product Fields */}
        {page.pageType === "digital" && (
          <div className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] p-5">
            <div className="flex items-center gap-3 p-3 bg-[var(--color-lemon-green)]/10 rounded-xl">
              <FileDown className="h-6 w-6 text-[var(--color-lemon-green)]" />
              <div>
                <p className="text-sm font-medium text-[var(--color-lemon-green)]">Instant Digital Delivery</p>
                <p className="text-xs text-[var(--color-lemon-green)]">You will receive download link via email after payment</p>
              </div>
            </div>
          </div>
        )}

        {/* Services Fields */}
        {page.pageType === "services" && (
          <div className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] p-5 space-y-4">
            <h3 className="font-bold text-lg text-[var(--text-primary)]">Service Details</h3>
            
            {page.metadata?.bookingEnabled && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block text-[var(--text-primary)]">Preferred Date *</Label>
                  <Input type="date" value={formData.bookingDate} onChange={(e) => handleInputChange("bookingDate", e.target.value)} className="h-12" />
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block text-[var(--text-primary)]">Preferred Time *</Label>
                  <Input type="time" value={formData.bookingTime} onChange={(e) => handleInputChange("bookingTime", e.target.value)} className="h-12" />
                </div>
              </div>
            )}

            {page.metadata?.customerNoteEnabled && (
              <div>
                <Label className="text-sm font-semibold mb-1.5 block text-[var(--text-primary)]">Describe your request</Label>
                <Textarea placeholder="Tell us what you need..." value={formData.customerNote} onChange={(e) => handleInputChange("customerNote", e.target.value)} rows={4} className="resize-none" />
              </div>
            )}
          </div>
        )}

        {/* Donation Fields */}
        {page.pageType === "donation" && (
          <div className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] p-5 space-y-4">
            <h3 className="font-bold text-lg text-[var(--text-primary)]">Donation Details</h3>
            
            {page.metadata?.suggestedAmounts && page.metadata.suggestedAmounts.length > 0 && (
              <div>
                <Label className="text-sm font-semibold mb-2 block text-[var(--text-primary)]">Suggested Amounts</Label>
                <div className="flex flex-wrap gap-2">
                  {page.metadata.suggestedAmounts.map((amount: number) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => handleInputChange("amount", amount.toString())}
                      className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                        Number(formData.amount) === amount
                          ? "border-[var(--color-accent-yellow)] bg-[var(--color-accent-yellow)]/10 text-[var(--color-accent-yellow)]"
                          : "border-[var(--border-color)] hover:border-[var(--color-accent-yellow)]/50 text-[var(--text-primary)]"
                      }`}
                    >
                      ₦{amount.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label className="text-sm font-semibold mb-1.5 block text-[var(--text-primary)]">Custom Amount (₦)</Label>
              <Input type="number" placeholder="Enter amount" value={formData.amount} onChange={(e) => handleInputChange("amount", e.target.value)} className="h-12" />
            </div>

            {page.metadata?.allowDonorMessage && (
              <div>
                <Label className="text-sm font-semibold mb-1.5 block text-[var(--text-primary)]">Message (Optional)</Label>
                <Textarea placeholder="Leave a message..." value={formData.donorMessage} onChange={(e) => handleInputChange("donorMessage", e.target.value)} rows={3} className="resize-none" />
              </div>
            )}
          </div>
        )}

        {/* Paid Students List */}
        {page.pageType === "school" && paidStudents.length > 0 && (
          <div className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] p-5">
            <div className="flex items-center gap-2 mb-3">
              <UserCheck className="h-5 w-5 text-[var(--color-lemon-green)]" />
              <h3 className="font-bold text-lg text-[var(--text-primary)]">Previously Paid</h3>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {paidStudents.map((student: Student) => (
                <div key={student.name} className="flex justify-between items-center p-2 bg-[var(--color-lemon-green)]/10 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{student.name}</p>
                    {student.regNumber && <p className="text-xs text-[var(--text-secondary)]">Reg: {student.regNumber}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[var(--color-lemon-green)]">Paid</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment Summary */}
        <div className="bg-[var(--bg-secondary)] rounded-2xl p-5 space-y-3 border border-[var(--border-color)]">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-secondary)]">
              {page.pageType === "school" && selectedStudents.size > 0 
                ? `Amount for ${selectedStudents.size} student${selectedStudents.size > 1 ? 's' : ''}`
                : selectedPaymentOption === "installment" ? "Installment Amount" : "Total Amount"}
            </span>
            <span className="font-medium text-[var(--text-primary)]">
              ₦{(page.pageType === "school" ? totalForSelected : amountToPay).toLocaleString()}
            </span>
          </div>
          
          <div className="flex justify-between font-bold text-lg pt-2 border-t border-[var(--border-color)]">
            <span className="text-[var(--text-primary)]">Total to Pay</span>
            <span className="text-[var(--color-accent-yellow)]">₦{(page.pageType === "school" ? totalForSelected : amountToPay).toLocaleString()}</span>
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

        <div className="flex items-center justify-center gap-2 text-xs text-[var(--text-secondary)] pb-6">
          <Shield className="h-3.5 w-3.5" /> Secured by Zidwell
        </div>
      </div>
    </div>
  );
}