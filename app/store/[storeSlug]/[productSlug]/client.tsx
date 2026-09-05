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

// ============================================================
// MAIN PRODUCT CLIENT COMPONENT
// ============================================================
export default function StoreProductClient({ page, store }: StoreProductClientProps) {
  const router = useRouter();
  const [currentImage, setCurrentImage] = useState(0);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<PaymentOption>("full");
  const [quantity, setQuantity] = useState(1);

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

  // ✅ Check if this is a payment link page
  const isPaymentLink = useMemo(() => {
    const pageType = page?.pageType?.toLowerCase() || "";
    return pageType === "link";
  }, [page?.pageType]);

  // ✅ Determine if this is a school page
  const isSchoolPage = useMemo(() => {
    const pageType = page?.pageType?.toLowerCase() || "";
    return pageType === "school";
  }, [page?.pageType]);

  // ✅ Determine if quantity should be shown (only for physical/digital products)
  const showQuantity = useMemo(() => {
    return page?.pageType === "physical" || page?.pageType === "digital";
  }, [page?.pageType]);

  // ✅ Extract link config from metadata for payment links
  const linkConfig = useMemo(() => {
    const metadataObj = page?.metadata || {};
    return metadataObj.linkConfig || {};
  }, [page?.metadata]);

  // ✅ Extract students from metadata
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
    
    const totalAmount = page?.price || 0;
    
    return rawStudents.map((student: any, index: number) => {
      const studentName = student.name || student.studentName || `Student ${index + 1}`;
      const paidAmount = student.paidAmount || 0;
      const remainingBalance = totalAmount - paidAmount;
      const isFullyPaid = paidAmount >= totalAmount;
      
      return {
        ...student,
        name: studentName,
        className: student.className || student.class || "",
        regNumber: student.regNumber || student.reg_number || "",
        paidAmount: paidAmount,
        remainingBalance: remainingBalance > 0 ? remainingBalance : 0,
        paid: isFullyPaid,
        isPartiallyPaid: paidAmount > 0 && !isFullyPaid,
        totalAmount: totalAmount,
      };
    });
  }, [page?.metadata, page?.price]);

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

  // ✅ Extract custom fields from link config
  const customFields = useMemo(() => {
    if (!isPaymentLink) return [];
    return linkConfig.customFields || [];
  }, [isPaymentLink, linkConfig]);

  // ✅ Get button text from link config
  const buttonText = useMemo(() => {
    if (!isPaymentLink) return "Pay Now";
    return linkConfig.buttonText || "Pay Now";
  }, [isPaymentLink, linkConfig]);

  // ✅ Get brand color from link config
  const brandColor = useMemo(() => {
    if (!isPaymentLink) return "#FDC020";
    return linkConfig.brandColor || "#FDC020";
  }, [isPaymentLink, linkConfig]);

  // ✅ Get button color from link config
  const buttonColor = useMemo(() => {
    if (!isPaymentLink) return "#FDC020";
    return linkConfig.buttonColor || "#FDC020";
  }, [isPaymentLink, linkConfig]);

  // ✅ Get success message from link config
  const successMessage = useMemo(() => {
    if (!isPaymentLink) return "Payment successful! Thank you.";
    return linkConfig.successMessage || "Payment successful! Thank you.";
  }, [isPaymentLink, linkConfig]);

  // ✅ Get thank you message from link config
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

  // ============================================================
  // CARD PAYMENT WITH REDIRECTION
  // ============================================================
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
    const metadata: any = {
      pageType: page?.pageType,
      pageTitle: page?.title,
      paymentType: isInstallmentPayment ? "installment" : "full",
      isInstallment: isInstallmentPayment,
      selectedStudents: Array.from(selectedStudents),
      numberOfStudents: selectedStudents.size,
      totalAmount,
      storeSlug: store?.slug,
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
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      const checkoutWindow = window.open(data.checkoutLink, "_blank", "width=500,height=700");

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

            const redirectUrl = statusData.payment?.redirectUrl ||
              linkConfig.redirectUrl ||
              page?.metadata?.accessLink ||
              page?.metadata?.downloadUrl ||
              `/store/${store?.slug}/${page.slug}`;

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

            window.location.href = redirectUrl;
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
    if (student.paid || student.remainingBalance <= 0) return;
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

  // ✅ Check if pay button should be disabled
  const isPayButtonDisabled = () => {
    if (processingCardPayment) return true;
    // For school pages, require at least one student selected
    if (isSchoolPage && selectedStudents.size === 0) return true;
    if (page?.pageType === "physical" && variants.length > 0 && !selectedVariant) return true;
    if (currentTotalAmount <= 0) return true;
    return false;
  };

  // Get the disabled reason
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

  // Type labels for display
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

  // Calculate discount percentage (example)
  const originalPrice = page.price * 1.5;
  const discountPercentage = Math.round(((originalPrice - page.price) / originalPrice) * 100);

  // Get store name in uppercase for the header
  const storeNameUpper = store.name?.toUpperCase() || "STORE";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ============================================================ */}
      {/* HEADER */}
      {/* ============================================================ */}
      <header className="mx-auto flex h-20 max-w-[1320px] items-center justify-between px-5 lg:px-10">
        <a href="#" aria-label="Store home" className="flex items-center gap-2">
          <span className="brand-mark font-display font-bold text-gold">{storeNameUpper}</span>
        </a>
        <nav className="flex items-center gap-2 sm:gap-5" aria-label="Store controls">
          <button className="relative rounded-full bg-secondary p-2.5" type="button" aria-label="Shopping cart">
            <ShoppingCart size={18} />
            <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-gold text-[10px] text-black">1</span>
          </button>
        </nav>
      </header>

      {/* ============================================================ */}
      {/* MAIN CONTENT */}
      {/* ============================================================ */}
      <section className="mx-auto grid max-w-[1320px] gap-10 px-5 pb-20 pt-7 lg:grid-cols-[minmax(380px,1fr)_minmax(420px,1.65fr)] lg:gap-12 lg:px-10 lg:pt-8">
        {/* ============================================================ */}
        {/* LEFT COLUMN - PRODUCT IMAGES */}
        {/* ============================================================ */}
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
                  className={`size-2 rounded-full ${i === currentImage ? 'bg-gold' : 'bg-border'}`} 
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

        {/* ============================================================ */}
        {/* RIGHT COLUMN - PRODUCT INFO */}
        {/* ============================================================ */}
        <div className="flex flex-col">
          {/* Page Type Badge */}
          <span className="w-fit rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent-foreground">
            {isPaymentLink ? "Payment Link" : (page.pageType ? typeLabels[page.pageType] || page.pageType : "Product")}
          </span>

          {/* Title */}
          <h1 className="mt-4 max-w-[780px] text-pretty text-4xl font-black leading-[1.07] tracking-[-0.04em] sm:text-5xl lg:text-[52px]">
            {page.title}
          </h1>

          {/* Store Name */}
          <p className="mt-5 flex items-center gap-2 text-sm font-semibold italic text-muted-foreground">
            {store.name}
          </p>

          {/* Description */}
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

          {/* Quantity - Only for physical/digital products */}
          {showQuantity && (
            <div className="mt-6 flex items-center border-y border-border py-4">
              <div className="flex items-center rounded-full border border-border px-3 py-1.5">
                <button 
                  type="button" 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                  aria-label="Decrease quantity"
                >
                  <Minus size={15} />
                </button>
                <span className="min-w-10 text-center text-sm">{quantity}</span>
                <button 
                  type="button" 
                  onClick={() => setQuantity(quantity + 1)} 
                  aria-label="Increase quantity"
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>
          )}

          {/* Price */}
          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-black tracking-tight" style={{ color: isPaymentLink ? brandColor : '#e1bf46' }}>
              ₦{page.price.toLocaleString()}
            </span>
            <span className="text-base text-muted-foreground line-through">₦{Math.round(originalPrice).toLocaleString()}</span>
            {discountPercentage > 0 && (
              <span className="rounded bg-gold px-2 py-1 text-xs font-bold text-black">{discountPercentage}% OFF</span>
            )}
          </div>

          {/* Payment Options - Only for non-link pages with installments */}
          {!isPaymentLink && canDoInstallments && (
            <div className="mt-5 flex flex-wrap gap-3">
              <button 
                type="button" 
                onClick={() => setSelectedPaymentOption('full')} 
                className={`rounded-full px-6 py-3 text-sm font-bold transition ${
                  selectedPaymentOption === 'full' 
                    ? 'bg-gold text-black' 
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
                    ? 'border-gold bg-gold/10 text-gold' 
                    : 'border-border hover:bg-secondary'
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

          {/* ============================================================ */}
          {/* TYPE-SPECIFIC SECTIONS */}
          {/* ============================================================ */}

          {/* School - Student Selection */}
          {isSchoolPage && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-5 w-5 text-gold" />
                <h3 className="font-bold text-lg">Select Students</h3>
                <span className="text-xs text-muted-foreground ml-auto">
                  {students.length} student{students.length !== 1 ? 's' : ''}
                </span>
              </div>

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

                    if (student.paid) {
                      return (
                        <div key={student.name || index} className="p-3 rounded-xl bg-green-900/20 border border-green-800 opacity-70">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-white">{student.name || 'Student'}</p>
                              <p className="text-xs text-green-400">✓ Fully Paid</p>
                            </div>
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">PAID</span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={student.name || index}
                        onClick={() => handleStudentClick(student)}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? "border-[#e1bf46] bg-[#e1bf46]/10 shadow-[0_0_20px_rgba(225,191,70,0.15)]"
                            : "border-border hover:border-[#e1bf46]/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-white">{student.name || 'Student'}</p>
                            {student.className && (
                              <p className="text-xs text-muted-foreground">Class: {student.className}</p>
                            )}
                            {student.regNumber && (
                              <p className="text-xs text-muted-foreground/60">Reg: {student.regNumber}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-[#e1bf46]">₦{payAmount.toLocaleString()}</p>
                            {isSelected && (
                              <p className="text-xs text-[#e1bf46] mt-0.5 font-semibold">✓ Selected</p>
                            )}
                          </div>
                        </div>
                        {remainingBalance > 0 && remainingBalance < (page.price || 0) && (
                          <p className="text-xs text-yellow-500 mt-1">Remaining: ₦{remainingBalance.toLocaleString()}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedStudents.size > 0 && (
                <div className="mt-3 p-3 bg-[#e1bf46]/10 rounded-xl border border-[#e1bf46]/20">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-300">Selected:</span>
                    <span className="font-bold text-white">{selectedStudents.size} student(s)</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-[#e1bf46]/20 mt-1">
                    <span className="font-semibold text-white">Total to Pay:</span>
                    <span className="text-lg font-bold text-[#e1bf46]">₦{totalForSelected.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Physical Product - Variants */}
          {page.pageType === "physical" && variants.length > 0 && (
            <div className="mt-6">
              <h3 className="font-bold text-sm mb-2">Select Variant</h3>
              <div className="grid grid-cols-2 gap-2">
                {variants.map((variant: Variant, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedVariant(variant)}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      selectedVariant?.name === variant.name
                        ? "border-[#e1bf46] bg-[#e1bf46]/10 text-[#e1bf46]"
                        : "border-border hover:border-[#e1bf46]/50 text-foreground"
                    }`}
                  >
                    <p className="font-semibold">{variant.name}</p>
                    <p className="text-sm mt-1 text-[#e1bf46]">₦{(variant.price || page.price).toLocaleString()}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Fee Breakdown - School Only */}
          {isSchoolPage && feeBreakdown.length > 0 && (
            <div className="mt-6 border-t border-border pt-4">
              <h3 className="font-bold text-sm mb-3">Fee Breakdown</h3>
              {feeBreakdown.map((item, index) => (
                <div key={index} className="flex justify-between py-1.5 text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-semibold text-white">₦{item.amount.toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-border font-bold">
                <span className="text-white">Total per Student</span>
                <span className="text-[#e1bf46]">₦{totalAmount.toLocaleString()}</span>
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

          {/* ✅ Payment Link - Customer Information Preview */}
          {isPaymentLink && customFields.length > 0 && (
            <div className="mt-6 border-t border-border pt-4">
              <h3 className="font-bold text-sm mb-3">Additional Information Required</h3>
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

          {/* ============================================================ */}
          {/* ✅ PAYMENT BUTTON - Always visible in both light and dark mode */}
          {/* ============================================================ */}
          <div className="mt-6 pt-4 border-t border-border">
            <Button
              onClick={openInfoModal}
              disabled={isPayButtonDisabled()}
              className={`w-full py-6 text-lg font-bold rounded-full transition-all duration-200 ${
                isPayButtonDisabled()
                  ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
                  : isPaymentLink 
                    ? `bg-[${buttonColor}] text-black hover:opacity-90 hover:scale-[1.01] active:scale-[0.98] shadow-lg shadow-[${buttonColor}]/30`
                    : 'bg-[#e1bf46] text-black hover:bg-[#e1bf46]/90 hover:scale-[1.01] active:scale-[0.98] shadow-lg shadow-[#e1bf46]/30'
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
                    : `Pay ₦${currentTotalAmount.toLocaleString()} with Card`
                  }
                </>
              )}
            </Button>

            {isPayButtonDisabled() && !processingCardPayment && (
              <p className="text-xs text-yellow-500 mt-2 text-center">
                ⚠️ {getDisabledReason()}
              </p>
            )}
          </div>

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-4">
            <Shield className="h-3.5 w-3.5" /> Secured by Zidwell
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* INFO MODAL - CUSTOMER INFORMATION */}
      {/* ============================================================ */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-[#1a1a1a] rounded-2xl p-6 max-w-md w-full border border-gray-700 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Your Information</h3>
              <button onClick={() => setShowInfoModal(false)} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-sm text-gray-400 mb-4">
              Please provide your details so we can send you a receipt.
            </p>

            <div className="space-y-4">
              {/* ✅ Name - Always shown */}
              <div>
                <Label className="text-sm font-semibold mb-1.5 block text-gray-300">Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    value={customerName}
                    onChange={(e) => { setCustomerName(e.target.value); if (errors.name) setErrors({ ...errors, name: "" }); }}
                    className={`bg-[#1a1a1a] border-gray-700 text-white pl-10 ${errors.name ? 'border-red-500' : ''}`}
                    placeholder="Enter your full name"
                  />
                </div>
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              {/* ✅ Email - Always shown */}
              <div>
                <Label className="text-sm font-semibold mb-1.5 block text-gray-300">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => { setCustomerEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: "" }); }}
                    className={`bg-[#1a1a1a] border-gray-700 text-white pl-10 ${errors.email ? 'border-red-500' : ''}`}
                    placeholder="you@example.com"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Receipt will be sent to this email</p>
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>

              {/* ✅ Phone - Always shown */}
              <div>
                <Label className="text-sm font-semibold mb-1.5 block text-gray-300">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="bg-[#1a1a1a] border-gray-700 text-white pl-10"
                    placeholder="08012345678"
                  />
                </div>
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>

              {/* ✅ Custom Fields from Payment Link */}
              {isPaymentLink && customFields.length > 0 && (
                <>
                  <div className="border-t border-gray-700 pt-3 mt-2">
                    <p className="text-sm font-semibold text-gray-300 mb-3">Additional Information</p>
                  </div>
                  {customFields.map((field: any, idx: number) => (
                    <div key={idx}>
                      <Label className="text-sm font-semibold mb-1.5 block text-gray-300">
                        {field.label}{field.required ? " *" : ""}
                      </Label>
                      {field.type === "paragraph" ? (
                        <Textarea
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                          className="bg-[#1a1a1a] border-gray-700 text-white resize-none"
                          rows={3}
                        />
                      ) : field.type === "dropdown" ? (
                        <select className="w-full rounded-xl border border-gray-700 bg-[#1a1a1a] px-4 py-2.5 text-white">
                          <option value="">Select {field.label}</option>
                          {(field.options || []).map((opt: string, i: number) => (
                            <option key={i} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : field.type === "checkbox" ? (
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="rounded border-gray-700 bg-[#1a1a1a] accent-gold" />
                          <span className="text-sm text-gray-300">Yes, I agree</span>
                        </div>
                      ) : field.type === "date" ? (
                        <Input
                          type="date"
                          className="bg-[#1a1a1a] border-gray-700 text-white"
                        />
                      ) : (
                        <Input
                          type={field.type === "number" ? "number" : "text"}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                          className="bg-[#1a1a1a] border-gray-700 text-white"
                        />
                      )}
                    </div>
                  ))}
                </>
              )}

              <div className="bg-[#0e0e0e] rounded-xl p-3 mt-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount to Pay:</span>
                  <span className="text-xl font-bold text-gold">₦{getCurrentTotalAmount().toLocaleString()}</span>
                </div>
              </div>

              <Button
                onClick={validateAndProceed}
                disabled={processingCardPayment}
                className={`w-full font-semibold py-3 rounded-xl transition-all duration-200 ${
                  isPaymentLink 
                    ? `bg-[${buttonColor}] text-black hover:opacity-90 hover:scale-[1.01] active:scale-[0.98] shadow-lg shadow-[${buttonColor}]/30`
                    : 'bg-gold text-black hover:bg-gold/90 hover:scale-[1.01] active:scale-[0.98] shadow-lg shadow-gold/30'
                }`}
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

      {/* Image Lightbox Modal */}
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

      {/* Footer */}
      <div className="fixed bottom-4 left-4 rounded-full border border-border bg-background px-4 py-2 text-xs text-muted-foreground shadow-sm">
        Powered by <strong className="ml-1 text-foreground">Zidwell</strong>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #2a2a2a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e1bf46; border-radius: 10px; }
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