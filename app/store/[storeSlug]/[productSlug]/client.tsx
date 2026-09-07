"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Shield,
  Loader2,
  CheckCircle,
  Copy,
  Banknote,
  Download,
  Truck,
  PackageIcon,
  Image as ImageIcon,
  CreditCard,
  X,
  Package,
  Users,
  Phone,
  Mail,
  User,
  Minus,
  Plus,
  Globe2,
  ShoppingCart,
  ChevronDown,
  CircleCheck,
  CircleAlert,
  CircleDot,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";

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

interface Variant {
  name: string;
  price: number;
  sku?: string;
  stock?: number;
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
  pageViews: number;
}

interface StoreData {
  id: string;
  name: string;
  slug: string;
  description: string;
  city?: string;
  state?: string;
}

interface StoreProductClientProps {
  page: PaymentPage;
  store: StoreData;
}

type PaymentOption = "full" | "installment";

export default function StoreProductClient({ page, store }: StoreProductClientProps) {
  const router = useRouter();
  const [currentImage, setCurrentImage] = useState(0);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<PaymentOption>("full");
  const [quantity, setQuantity] = useState(1);
  const [isMounted, setIsMounted] = useState(false);

  const [processingCardPayment, setProcessingCardPayment] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cardPaymentAmount, setCardPaymentAmount] = useState(0);

  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [selectedProductImage, setSelectedProductImage] = useState<string | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

useEffect(() => {
  const trackView = async () => {
    try {
      console.log("📊 Tracking view for page:", page.id, "store:", store.id);
      
      const response = await fetch("/api/payment-page/track-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: page.id,
          storeId: store.id,
        }),
      });

      const data = await response.json();
      console.log("📊 Track view response:", data);
      
      if (data.success) {
        console.log("✅ View tracked successfully:", data);
      }
    } catch (error) {
      console.error("❌ View tracking error:", error);
    }
  };

  trackView();
}, [page.id, store.id]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isPaymentLink = useMemo(() => {
    const pageType = page?.pageType?.toLowerCase() || "";
    return pageType === "link";
  }, [page?.pageType]);

  const isSchoolPage = useMemo(() => {
    const pageType = page?.pageType?.toLowerCase() || "";
    return pageType === "school";
  }, [page?.pageType]);

  const showQuantity = useMemo(() => {
    return page?.pageType === "physical" || page?.pageType === "digital";
  }, [page?.pageType]);

  const linkConfig = useMemo(() => {
    const metadataObj = page?.metadata || {};
    return metadataObj.linkConfig || {};
  }, [page?.metadata]);

  // Process students with correct paid status
  const students = useMemo(() => {
    const metadataObj = page?.metadata || {};
    let rawStudents: any[] = [];
    
    if (metadataObj && typeof metadataObj === 'object') {
      if (metadataObj.students && Array.isArray(metadataObj.students)) {
        rawStudents = metadataObj.students;
      }
    }

    if (!rawStudents || rawStudents.length === 0) {
      return [];
    }
    
    let totalAmount = page?.price || 0;
    
    if (metadataObj.feeBreakdown && Array.isArray(metadataObj.feeBreakdown)) {
      const feeTotal = metadataObj.feeBreakdown.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
      if (feeTotal > 0) {
        totalAmount = feeTotal;
      }
    }
    
    if (page?.priceType === "installment" && metadataObj.totalAmount) {
      totalAmount = Number(metadataObj.totalAmount) || totalAmount;
    }
    
    return rawStudents.map((student: any, index: number) => {
      const studentName = student.name || student.studentName || `Student ${index + 1}`;
      const paidAmount = Number(student.paidAmount) || 0;
      const remainingBalance = Math.max(0, totalAmount - paidAmount);
      const isFullyPaid = paidAmount >= totalAmount && totalAmount > 0;
      const isPartiallyPaid = paidAmount > 0 && !isFullyPaid;
      
      return {
        ...student,
        name: studentName,
        className: student.className || student.class || "",
        regNumber: student.regNumber || student.reg_number || "",
        paidAmount: paidAmount,
        remainingBalance: remainingBalance,
        paid: isFullyPaid,
        isPartiallyPaid: isPartiallyPaid,
        totalAmount: totalAmount,
        parentName: student.parentName || null,
      };
    });
  }, [page?.metadata, page?.price, page?.priceType]);

  const feeBreakdown = useMemo(() => {
    const metadataObj = page?.metadata || {};
    if (!metadataObj || typeof metadataObj !== 'object') return [];
    return metadataObj.feeBreakdown || [];
  }, [page?.metadata]);

  const className = useMemo(() => {
    const metadataObj = page?.metadata || {};
    if (!metadataObj || typeof metadataObj !== 'object') return "";
    return metadataObj.className || metadataObj.class || "";
  }, [page?.metadata]);

  const variants = useMemo(() => {
    const metadataObj = page?.metadata || {};
    if (!metadataObj || typeof metadataObj !== 'object') return [];
    return metadataObj.variants || [];
  }, [page?.metadata]);

  const customFields = useMemo(() => {
    if (!isPaymentLink) return [];
    return linkConfig.customFields || [];
  }, [isPaymentLink, linkConfig]);

  const buttonText = useMemo(() => {
    if (!isPaymentLink) return "Pay Now";
    return linkConfig.buttonText || "Pay Now";
  }, [isPaymentLink, linkConfig]);

  const brandColor = useMemo(() => {
    if (!isPaymentLink) return "var(--color-accent-yellow)";
    return linkConfig.brandColor || "var(--color-accent-yellow)";
  }, [isPaymentLink, linkConfig]);

  const buttonColor = useMemo(() => {
    if (!isPaymentLink) return "var(--color-accent-yellow)";
    return linkConfig.buttonColor || "var(--color-accent-yellow)";
  }, [isPaymentLink, linkConfig]);

  const successMessage = useMemo(() => {
    if (!isPaymentLink) return "Payment successful! Thank you.";
    return linkConfig.successMessage || "Payment successful! Thank you.";
  }, [isPaymentLink, linkConfig]);

  const thankYouMessage = useMemo(() => {
    if (!isPaymentLink) return "We've received your payment and a receipt has been sent to your email.";
    return linkConfig.thankYouMessage || "We've received your payment and a receipt has been sent to your email.";
  }, [isPaymentLink, linkConfig]);

  const productImages = useMemo(() => {
    if (page.productImages && page.productImages.length > 0) {
      return page.productImages;
    }
    if (page.coverImage) {
      return [page.coverImage];
    }
    return [];
  }, [page.productImages, page.coverImage]);

  const getBasePrice = () => selectedVariant?.price || page?.price || 0;
  const getTotalProductPrice = () => getBasePrice() * quantity;

  const getTotalAmount = () => {
    if (feeBreakdown.length > 0) return feeBreakdown.reduce((sum, item) => sum + (item.amount || 0), 0);
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
      return { totalAmount, installmentCount: page.installmentCount, installmentAmount: totalAmount / page.installmentCount };
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
      if (student) total += getStudentPayAmount(student);
    });
    return total;
  };

  const handleCardPayment = async () => {
    const totalAmount = getCurrentTotalAmount();

    if (totalAmount <= 0) {
      alert("Please select items to continue");
      return;
    }

    const newErrors: Record<string, string> = {};
    if (!customerName || !customerName.trim()) newErrors.name = "Name is required";
    if (!customerEmail || !customerEmail.trim() || !customerEmail.includes("@")) newErrors.email = "Valid email is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const isInstallmentPayment = selectedPaymentOption === "installment" && page?.installmentCount && page.installmentCount > 1;
    
    let redirectUrl = linkConfig.redirectUrl || 
                     page?.metadata?.redirectUrl || 
                     page?.metadata?.accessLink || 
                     page?.metadata?.downloadUrl || 
                     `/store/${store?.slug}/${page.slug}`;

    const metadata: any = {
      pageType: page?.pageType,
      pageTitle: page?.title,
      paymentType: isInstallmentPayment ? "installment" : "full",
      isInstallment: isInstallmentPayment,
      selectedStudents: Array.from(selectedStudents),
      numberOfStudents: selectedStudents.size,
      totalAmount,
      storeSlug: store?.slug,
      redirectUrl: redirectUrl,
    };

    if (isInstallmentPayment) {
      const installmentInfo = getInstallmentInfo();
      metadata.totalAmount = installmentInfo?.totalAmount;
      metadata.totalInstallments = installmentInfo?.installmentCount;
      metadata.installmentAmount = installmentInfo?.installmentAmount;
      metadata.currentInstallment = 1;
    }

    setProcessingCardPayment(true);
    setShowInfoModal(false);

    try {
      const response = await fetch("/api/payment-page/public/card-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageSlug: page.slug,
          customerName,
          customerEmail,
          customerPhone,
          amount: totalAmount,
          metadata,
          returnUrl: redirectUrl,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      const checkoutWindow = window.open(data.checkoutLink, "_blank", "noopener,noreferrer");
      
      if (!checkoutWindow) {
        window.location.href = data.checkoutLink;
        return;
      }

      const checkInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(
            `/api/payment-page/status?reference=${data.orderReference}`
          );
          const statusData = await statusResponse.json();

          if (statusData.payment?.status === "completed") {
            clearInterval(checkInterval);

            if (checkoutWindow && !checkoutWindow.closed) {
              checkoutWindow.close();
            }

            const finalRedirectUrl = statusData.payment?.redirectUrl || redirectUrl;

            await Swal.fire({
              icon: "success",
              title: "Payment Successful! 🎉",
              html: `
                <div class="text-left">
                  <p class="font-semibold text-green-600">✅ ${successMessage}</p>
                  <p class="text-sm text-gray-600 mt-2">${thankYouMessage}</p>
                  <p class="text-sm text-gray-600 mt-2">💰 Amount: <strong>₦${totalAmount.toLocaleString()}</strong></p>
                </div>
              `,
              confirmButtonColor: "#F5B81B",
              confirmButtonText: "Continue",
            });

            window.location.href = finalRedirectUrl;
          }
        } catch (err) {
          console.error("Error polling status:", err);
        }
      }, 3000);

      setTimeout(() => clearInterval(checkInterval), 300000);
    } catch (err: any) {
      alert(err.message || "Failed to initiate card payment. Please try again.");
    } finally {
      setProcessingCardPayment(false);
    }
  };

  const openInfoModal = () => {
    const totalAmount = getCurrentTotalAmount();
    if (totalAmount <= 0) {
      alert("Please select items to continue");
      return;
    }
    
    setErrors({});
    setShowInfoModal(true);
  };

  const validateAndProceed = () => {
    const newErrors: Record<string, string> = {};
    if (!customerName || !customerName.trim()) newErrors.name = "Name is required";
    if (!customerEmail || !customerEmail.trim() || !customerEmail.includes("@")) newErrors.email = "Valid email is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const totalAmount = getCurrentTotalAmount();
    setCardPaymentAmount(totalAmount);
    handleCardPayment();
  };

  const getCurrentTotalAmount = () => {
    if (isSchoolPage) return getTotalForSelectedStudents();
    if (page?.pageType === "physical" || page?.pageType === "digital") return getTotalProductPrice();
    return page?.price || 0;
  };

  const handleStudentClick = (student: Student) => {
    if (student.paid || student.remainingBalance <= 0) {
      return;
    }
    
    setSelectedStudents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(student.name)) newSet.delete(student.name);
      else newSet.add(student.name);
      return newSet;
    });
  };

  const totalAmount = getTotalAmount();
  const installmentInfo = getInstallmentInfo();
  const canDoInstallments = page?.priceType === "installment" && page.installmentCount && page.installmentCount > 1;
  const totalForSelected = getTotalForSelectedStudents();
  const currentTotalAmount = getCurrentTotalAmount();

  const isPayButtonDisabled = () => {
    if (processingCardPayment) return true;
    if (isSchoolPage && selectedStudents.size === 0) return true;
    if (page?.pageType === "physical" && variants.length > 0 && !selectedVariant) return true;
    if (currentTotalAmount <= 0) return true;
    return false;
  };

  const getDisabledReason = () => {
    if (processingCardPayment) return "Processing payment...";
    if (currentTotalAmount <= 0) return "Please select items to continue";
    if (isSchoolPage && selectedStudents.size === 0) {
      return "Please select at least one student to continue";
    }
    if (page?.pageType === "physical" && variants.length > 0 && !selectedVariant) {
      return "Please select a variant";
    }
    return "";
  };

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

  const originalPrice = page.price * 1.5;
  const storeNameUpper = store.name?.toUpperCase() || "STORE";

  // Student status counts
  const paidCount = students.filter((s: Student) => s.paid).length;
  const partialCount = students.filter((s: Student) => s.isPartiallyPaid).length;
  const unpaidCount = students.filter((s: Student) => !s.paid && !s.isPartiallyPaid).length;

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex h-20 max-w-[1320px] items-center justify-between px-5 lg:px-10">
        <a href="#" aria-label="Store home" className="flex items-center gap-2">
          <span className="brand-mark font-display font-bold text-primary">
            {storeNameUpper}
          </span>
        </a>
        <nav className="flex items-center gap-2 sm:gap-5" aria-label="Store controls">
          <button className="relative rounded-full bg-secondary p-2.5" type="button" aria-label="Shopping cart">
            <ShoppingCart size={18} className="text-muted-foreground" />
            <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">1</span>
          </button>
        </nav>
      </header>

      <section className="mx-auto grid max-w-[1320px] gap-10 px-5 pb-20 pt-7 lg:grid-cols-[minmax(380px,1fr)_minmax(420px,1.65fr)] lg:gap-12 lg:px-10 lg:pt-8">
        {/* Left Column - Product Images */}
        <div className="relative lg:pt-1">
          <div className="overflow-hidden rounded-[22px] bg-secondary shadow-sm">
            {productImages.length > 0 ? (
              <img 
                src={productImages[currentImage]} 
                alt={page.title} 
                className="aspect-square w-full object-cover" 
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-image.png';
                  e.currentTarget.onerror = null;
                }}
              />
            ) : (
              <div className="aspect-square w-full bg-secondary flex items-center justify-center">
                <Package className="h-20 w-20 text-muted-foreground/40" />
              </div>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <button 
              className="rounded-full border border-border p-2 text-muted-foreground transition hover:bg-secondary" 
              type="button" 
              aria-label="Previous product image"
              onClick={() => setCurrentImage((c) => (c === 0 ? productImages.length - 1 : c - 1))}
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex gap-2" aria-label="Product image selection">
              {productImages.map((_, i) => (
                <span 
                  key={i} 
                  className={`size-2 rounded-full ${i === currentImage ? 'bg-primary' : 'bg-border'}`} 
                />
              ))}
            </div>
            <button 
              className="rounded-full border border-border p-2 text-muted-foreground transition hover:bg-secondary" 
              type="button" 
              aria-label="Next product image"
              onClick={() => setCurrentImage((c) => (c === productImages.length - 1 ? 0 : c + 1))}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Right Column - Product Info */}
        <div className="flex flex-col">
          <span className="w-fit rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent-foreground">
            {isPaymentLink ? "Payment Link" : (page.pageType ? typeLabels[page.pageType] || page.pageType : "Product")}
          </span>

          <h1 className="mt-4 max-w-[780px] text-pretty text-4xl font-black leading-[1.07] tracking-[-0.04em] sm:text-5xl lg:text-[52px]">
            {page.title}
          </h1>

          <p className="mt-5 flex items-center gap-2 text-sm font-semibold italic text-muted-foreground">
            {store.name}
          </p>

          {page.description && (
            <div className="mt-4 text-base leading-7 text-muted-foreground prose prose-invert prose-sm max-w-none">
              <div dangerouslySetInnerHTML={{ 
                __html: page.description
                  .replace(/<p>/g, '<p class="mb-2">')
                  .replace(/<ol>/g, '<ol class="list-decimal pl-5 space-y-1 my-2">')
                  .replace(/<ul>/g, '<ul class="list-disc pl-5 space-y-1 my-2">')
                  .replace(/<li>/g, '<li class="mb-1">')
              }} />
            </div>
          )}

          {showQuantity && (
            <div className="mt-6 flex items-center border-y border-border py-4">
              <div className="flex items-center rounded-full border border-border px-3 py-1.5">
                <button 
                  type="button" 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                  aria-label="Decrease quantity"
                >
                  <Minus size={15} className="text-foreground" />
                </button>
                <span className="min-w-10 text-center text-sm text-foreground">{quantity}</span>
                <button 
                  type="button" 
                  onClick={() => setQuantity(quantity + 1)} 
                  aria-label="Increase quantity"
                >
                  <Plus size={15} className="text-foreground" />
                </button>
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-black tracking-tight text-primary">
              ₦{page.price.toLocaleString()}
            </span>
            <span className="text-base text-muted-foreground line-through">₦{Math.round(originalPrice).toLocaleString()}</span>
          
          </div>

          {!isPaymentLink && canDoInstallments && (
            <div className="mt-5 flex flex-wrap gap-3">
              <button 
                type="button" 
                onClick={() => setSelectedPaymentOption('full')} 
                className={`rounded-full px-6 py-3 text-sm font-bold transition ${
                  selectedPaymentOption === 'full' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'border border-border text-foreground hover:bg-secondary'
                }`}
              >
                Buy now
              </button>
              <button 
                type="button" 
                onClick={() => setSelectedPaymentOption('installment')} 
                className={`rounded-full border px-6 py-3 text-sm font-bold transition ${
                  selectedPaymentOption === 'installment' 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-border text-foreground hover:bg-secondary'
                }`}
              >
                Pay in installments
              </button>
            </div>
          )}

          {!isPaymentLink && (
            <p className="mt-3 text-xs text-muted-foreground">
              {selectedPaymentOption === 'installment' 
                ? `Flexible payment options available. ${page.installmentCount} payments of ₦${installmentInfo?.installmentAmount.toLocaleString()}` 
                : 'One-time payment. Instant access after checkout.'}
            </p>
          )}

          {/* SCHOOL - Student Selection with paid status */}
          {isSchoolPage && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-lg text-foreground">Select Students</h3>
                <span className="text-xs text-muted-foreground ml-auto">
                  {students.length} student{students.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Status Summary */}
              {students.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-4 text-xs">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-600 border border-green-500/20">
                    <CircleCheck className="h-3.5 w-3.5" />
                    {paidCount} Paid
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-600 border border-yellow-500/20">
                    <CircleAlert className="h-3.5 w-3.5" />
                    {partialCount} Partial
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-500/10 text-gray-500 border border-gray-500/20">
                    <CircleDot className="h-3.5 w-3.5" />
                    {unpaidCount} Pending
                  </span>
                </div>
              )}

              {students.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground border border-border rounded-xl">
                  <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>No students added yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                  {students.map((student: Student, index: number) => {
                    const isSelected = selectedStudents.has(student.name);
                    const payAmount = getStudentPayAmount(student);
                    const remainingBalance = student.remainingBalance;
                    const isFullyPaid = student.paid;
                    const isPartiallyPaid = student.isPartiallyPaid;
                    const canSelect = !isFullyPaid && remainingBalance > 0;

                    // FULLY PAID - Disabled
                    if (isFullyPaid) {
                      return (
                        <div 
                          key={student.name || index} 
                          className="p-3 rounded-xl bg-green-500/5 border border-green-500/20 opacity-70 cursor-not-allowed"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-foreground">{student.name || 'Student'}</p>
                              {student.className && (
                                <p className="text-xs text-muted-foreground">Class: {student.className}</p>
                              )}
                              {student.regNumber && (
                                <p className="text-xs text-muted-foreground/60">Reg: {student.regNumber}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="inline-flex items-center gap-1 text-xs bg-green-500/20 text-green-600 px-2.5 py-0.5 rounded-full">
                                <CircleCheck className="h-3 w-3" />
                                Paid
                              </span>
                              <p className="text-xs text-green-600/70 mt-1">₦{student.totalAmount.toLocaleString()} paid</p>
                              {student.parentName && (
                                <p className="text-xs text-green-600/50">by {student.parentName}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // PARTIALLY PAID - Selectable
                    if (isPartiallyPaid) {
                      return (
                        <div
                          key={student.name || index}
                          onClick={() => handleStudentClick(student)}
                          className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            canSelect && isSelected
                              ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(var(--primary),0.15)]"
                              : canSelect && !isSelected
                              ? "border-yellow-500/40 bg-yellow-500/5 hover:border-yellow-500/70"
                              : "border-border opacity-50 cursor-not-allowed"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-foreground">{student.name || 'Student'}</p>
                              {student.className && (
                                <p className="text-xs text-muted-foreground">Class: {student.className}</p>
                              )}
                              {student.regNumber && (
                                <p className="text-xs text-muted-foreground/60">Reg: {student.regNumber}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-yellow-600">₦{payAmount.toLocaleString()}</p>
                              <div className="flex flex-col items-end">
                                <span className="inline-flex items-center gap-1 text-xs bg-yellow-500/20 text-yellow-600 px-2.5 py-0.5 rounded-full">
                                  <CircleAlert className="h-3 w-3" />
                                  Partial
                                </span>
                                <p className="text-xs text-yellow-600/70 mt-0.5">
                                  Paid: ₦{student.paidAmount.toLocaleString()} / ₦{student.totalAmount.toLocaleString()}
                                </p>
                                <p className="text-xs text-red-500">
                                  Remaining: ₦{remainingBalance.toLocaleString()}
                                </p>
                                {student.parentName && (
                                  <p className="text-xs text-yellow-600/50">by {student.parentName}</p>
                                )}
                              </div>
                            </div>
                          </div>
                          {isSelected && canSelect && (
                            <p className="text-xs text-primary mt-1 font-semibold">Selected for payment</p>
                          )}
                          {!canSelect && (
                            <p className="text-xs text-red-500 mt-1">No remaining balance to pay</p>
                          )}
                        </div>
                      );
                    }

                    // UNPAID - Fully selectable
                    return (
                      <div
                        key={student.name || index}
                        onClick={() => handleStudentClick(student)}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(var(--primary),0.15)]"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-foreground">{student.name || 'Student'}</p>
                            {student.className && (
                              <p className="text-xs text-muted-foreground">Class: {student.className}</p>
                            )}
                            {student.regNumber && (
                              <p className="text-xs text-muted-foreground/60">Reg: {student.regNumber}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">₦{payAmount.toLocaleString()}</p>
                            {isSelected && (
                              <p className="text-xs text-primary mt-0.5 font-semibold">Selected</p>
                            )}
                            {student.totalAmount && (
                              <p className="text-xs text-muted-foreground/60">Total: ₦{student.totalAmount.toLocaleString()}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedStudents.size > 0 && (
                <div className="mt-3 p-3 bg-primary/10 rounded-xl border border-primary/20">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Selected:</span>
                    <span className="font-bold text-foreground">{selectedStudents.size} student(s)</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-primary/20 mt-1">
                    <span className="font-semibold text-foreground">Total to Pay:</span>
                    <span className="text-lg font-bold text-primary">₦{totalForSelected.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Physical Product - Variants */}
          {page.pageType === "physical" && variants.length > 0 && (
            <div className="mt-6">
              <h3 className="font-bold text-sm text-foreground mb-2">Select Variant</h3>
              <div className="grid grid-cols-2 gap-2">
                {variants.map((variant: Variant, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedVariant(variant)}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      selectedVariant?.name === variant.name
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50 text-foreground"
                    }`}
                  >
                    <p className="font-semibold">{variant.name}</p>
                    <p className="text-sm mt-1 text-primary">₦{(variant.price || page.price).toLocaleString()}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Fee Breakdown - School Only */}
          {isSchoolPage && feeBreakdown.length > 0 && (
            <div className="mt-6 border-t border-border pt-4">
              <h3 className="font-bold text-sm text-foreground mb-3">Fee Breakdown</h3>
              {feeBreakdown.map((item, index) => (
                <div key={index} className="flex justify-between py-1.5 text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-semibold text-foreground">₦{item.amount.toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-border font-bold">
                <span className="text-foreground">Total per Student</span>
                <span className="text-primary">₦{totalAmount.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Digital Product - Download Info */}
          {page.pageType === "digital" && (
            <div className="mt-6 flex items-center gap-2 p-3 bg-green-900/20 rounded-xl border border-green-800">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <p className="text-xs text-green-300">Download link will be sent to your email</p>
            </div>
          )}

          {/* Physical Product - Shipping Info */}
          {page.pageType === "physical" && page.metadata?.requiresShipping && (
            <div className="mt-6 flex items-center gap-2 p-3 bg-blue-900/20 rounded-xl border border-blue-800">
              <Truck className="h-4 w-4 text-blue-400" />
              <p className="text-xs text-blue-300">Shipping address will be required</p>
            </div>
          )}

          {/* Payment Link - Customer Information Preview */}
          {isPaymentLink && customFields.length > 0 && (
            <div className="mt-6 border-t border-border pt-4">
              <h3 className="font-bold text-sm text-foreground mb-3">Additional Information Required</h3>
              <div className="space-y-2">
                {customFields.slice(0, 5).map((field: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>• {field.label}{field.required ? " *" : ""}</span>
                  </div>
                ))}
                {customFields.length > 5 && (
                  <p className="text-xs text-muted-foreground">+ {customFields.length - 5} more fields</p>
                )}
              </div>
            </div>
          )}

          {/* PAYMENT BUTTON */}
          <div className="mt-6 pt-4 border-t border-border">
            <Button
              onClick={openInfoModal}
              disabled={isPayButtonDisabled()}
              className={`w-full py-6 text-lg font-bold rounded-full transition-all duration-200 ${
                isPayButtonDisabled()
                  ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.98] shadow-lg shadow-primary/30'
              }`}
            >
              {processingCardPayment ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5 mr-2" />
                  {isPaymentLink 
                    ? `${buttonText} ₦${currentTotalAmount.toLocaleString()}`
                    : `Pay ₦${currentTotalAmount.toLocaleString()} Now`
                  }
                </>
              )}
            </Button>

            {isPayButtonDisabled() && !processingCardPayment && (
              <p className="text-xs text-yellow-500 mt-2 text-center">
                {getDisabledReason()}
              </p>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-4">
            <Shield className="h-3.5 w-3.5" /> Secured by Zidwell
          </div>
        </div>
      </section>

      {/* INFO MODAL - CUSTOMER INFORMATION */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-background rounded-2xl p-6 max-w-md w-full border border-border max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-foreground">Your Information</h3>
              <button onClick={() => setShowInfoModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              Please provide your details so we can send you a receipt.
            </p>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold mb-1.5 block text-foreground">Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={customerName}
                    onChange={(e) => { setCustomerName(e.target.value); if (errors.name) setErrors({ ...errors, name: "" }); }}
                    className={`bg-secondary border-border text-foreground pl-10 ${errors.name ? 'border-red-500' : ''}`}
                    placeholder="Enter your full name"
                  />
                </div>
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <Label className="text-sm font-semibold mb-1.5 block text-foreground">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => { setCustomerEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: "" }); }}
                    className={`bg-secondary border-border text-foreground pl-10 ${errors.email ? 'border-red-500' : ''}`}
                    placeholder="you@example.com"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Receipt will be sent to this email</p>
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>

              <div>
                <Label className="text-sm font-semibold mb-1.5 block text-foreground">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="bg-secondary border-border text-foreground pl-10"
                    placeholder="08012345678"
                  />
                </div>
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>

              {isPaymentLink && customFields.length > 0 && (
                <>
                  <div className="border-t border-border pt-3 mt-2">
                    <p className="text-sm font-semibold text-foreground mb-3">Additional Information</p>
                  </div>
                  {customFields.map((field: any, idx: number) => (
                    <div key={idx}>
                      <Label className="text-sm font-semibold mb-1.5 block text-foreground">
                        {field.label}{field.required ? " *" : ""}
                      </Label>
                      {field.type === "paragraph" ? (
                        <Textarea
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                          className="bg-secondary border-border text-foreground resize-none"
                          rows={3}
                        />
                      ) : field.type === "dropdown" ? (
                        <select className="w-full rounded-xl border border-border bg-secondary px-4 py-2.5 text-foreground">
                          <option value="">Select {field.label}</option>
                          {(field.options || []).map((opt: string, i: number) => (
                            <option key={i} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : field.type === "checkbox" ? (
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="rounded border-border bg-secondary accent-primary" />
                          <span className="text-sm text-foreground">Yes, I agree</span>
                        </div>
                      ) : field.type === "date" ? (
                        <Input
                          type="date"
                          className="bg-secondary border-border text-foreground"
                        />
                      ) : (
                        <Input
                          type={field.type === "number" ? "number" : "text"}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                          className="bg-secondary border-border text-foreground"
                        />
                      )}
                    </div>
                  ))}
                </>
              )}

              <div className="bg-secondary rounded-xl p-3 mt-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount to Pay:</span>
                  <span className="text-xl font-bold text-primary">₦{getCurrentTotalAmount().toLocaleString()}</span>
                </div>
              </div>

              <Button
                onClick={validateAndProceed}
                disabled={processingCardPayment}
                className="w-full font-semibold py-3 rounded-xl transition-all duration-200 bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.98] shadow-lg shadow-primary/30"
              >
                {processingCardPayment ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    {isPaymentLink ? buttonText : "Proceed to Payment"}
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {isLightboxOpen && selectedProductImage && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div className="relative max-w-4xl w-full">
            <img src={selectedProductImage} alt="Product view" className="w-full h-auto rounded-xl max-h-[90vh] object-contain" />
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 bg-black/50 rounded-full p-2 hover:bg-black/70"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>
      )}

      <div className="fixed bottom-4 left-4 rounded-full border border-border bg-background px-4 py-2 text-xs text-muted-foreground shadow-sm">
        Powered by <strong className="ml-1 text-foreground">Zidwell</strong>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: var(--bg-secondary); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--color-accent-yellow); border-radius: 10px; }
        .brand-mark {
          font-size: 1.25rem;
          letter-spacing: 0.08em;
        }
        .brand-mark.small {
          font-size: 0.75rem;
        }
      `}</style>
    </div>
  );
}