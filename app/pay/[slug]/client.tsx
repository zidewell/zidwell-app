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
  ShoppingCart,
  Download,
  Truck,
  PackageIcon,
  Image as ImageIcon,
  CreditCard,
  X,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
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
type PaymentMethodType = "virtual_account" | "card";

export default function PaymentPageClient({ slug }: PaymentPageClientProps) {
  const router = useRouter();
  const [page, setPage] = useState<PaymentPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState(0);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<PaymentOption>("full");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  // New states for payment method selection
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType>("virtual_account");
  const [processingCardPayment, setProcessingCardPayment] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [cardPaymentAmount, setCardPaymentAmount] = useState(0);
  const [cardPaymentMetadata, setCardPaymentMetadata] = useState<any>({});
  
  // Product-specific states
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedProductImage, setSelectedProductImage] = useState<string | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

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

  // Get product variants
  const variants = useMemo(() => {
    return page?.metadata?.variants || [];
  }, [page?.metadata?.variants]);

  // Get base price (from variants or page price)
  const getBasePrice = () => {
    if (selectedVariant && selectedVariant.price) {
      return selectedVariant.price;
    }
    return page?.price || 0;
  };

  // Calculate total product price
  const getTotalProductPrice = () => {
    return getBasePrice() * quantity;
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
        
        // Set default variant if available
        if (data.page?.metadata?.variants?.length > 0) {
          setSelectedVariant(data.page.metadata.variants[0]);
        }
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

  // Get the current total amount based on page type and selections
  const getCurrentTotalAmount = () => {
    if (page?.pageType === "school") {
      return getTotalForSelectedStudents();
    } else if (page?.pageType === "physical" || page?.pageType === "digital") {
      return getTotalProductPrice();
    } else {
      return page?.price || 0;
    }
  };

  // Handle Card Payment
  const handleCardPayment = async () => {
    let totalAmount = getCurrentTotalAmount();
    let metadata: any = {};
    
    if (page?.pageType === "school") {
      if (totalAmount <= 0) {
        alert("Please select at least one student");
        return;
      }
      
      const isInstallmentPayment = selectedPaymentOption === "installment" && page?.installmentCount && page.installmentCount > 1;
      
      metadata = {
        pageType: page.pageType,
        pageTitle: page.title,
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
    } else if (page?.pageType === "physical" || page?.pageType === "digital") {
      if (totalAmount <= 0) {
        alert("Invalid amount");
        return;
      }
      
      metadata = {
        pageType: page.pageType,
        pageTitle: page.title,
        paymentType: "product",
        productName: page.title,
        quantity: quantity,
        variant: selectedVariant?.name || null,
        totalAmount: totalAmount,
      };
    } else {
      metadata = {
        pageType: page?.pageType,
        pageTitle: page?.title,
        paymentType: "full",
        totalAmount: totalAmount,
      };
    }
    
    // Validate customer info for card payment
    if (!customerName.trim()) {
      alert("Please enter your name");
      return;
    }
    if (!customerEmail.trim() || !customerEmail.includes("@")) {
      alert("Please enter a valid email address");
      return;
    }
    
    setProcessingCardPayment(true);
    setShowCardModal(false);
    
    try {
      const response = await fetch("/api/payment-page/public/card-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageSlug: slug,
          customerName: customerName,
          customerEmail: customerEmail,
          customerPhone: customerPhone,
          amount: totalAmount,
          metadata: metadata,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error);
      }
      
      // Open checkout in new window
      const checkoutWindow = window.open(data.checkoutLink, "_blank", "width=500,height=700");
      
      if (!checkoutWindow) {
        alert("Please allow pop-ups to complete payment");
      }
      
      // Poll for payment completion
      const checkInterval = setInterval(async () => {
        const statusResponse = await fetch(`/api/payment-page/public/status?reference=${data.orderReference}`);
        const statusData = await statusResponse.json();
        if (statusData.payment?.status === "completed") {
          clearInterval(checkInterval);
          alert("Payment successful!");
          window.location.reload();
        }
      }, 5000);
      
      setTimeout(() => clearInterval(checkInterval), 300000); // Stop after 5 minutes
      
    } catch (err: any) {
      console.error("Card payment error:", err);
      alert(err.message || "Failed to initiate card payment. Please try again.");
    } finally {
      setProcessingCardPayment(false);
    }
  };

  const openCardModal = () => {
    let totalAmount = getCurrentTotalAmount();
    
    if (page?.pageType === "school") {
      if (totalAmount <= 0) {
        alert("Please select at least one student");
        return;
      }
    } else if (page?.pageType === "physical" || page?.pageType === "digital") {
      if (totalAmount <= 0) {
        alert("Invalid amount");
        return;
      }
    }
    
    setCardPaymentAmount(totalAmount);
    setShowCardModal(true);
  };

  const totalAmount = getTotalAmount();
  const amountToPay = getAmountToPay();
  const installmentInfo = getInstallmentInfo();
  const canDoInstallments = page?.priceType === "installment" && page.installmentCount && page.installmentCount > 1;
  const totalForSelected = getTotalForSelectedStudents();
  const allImages = [...(page?.coverImage ? [page.coverImage] : [])];
  const currentTotalAmount = getCurrentTotalAmount();
  const hasValidAmount = currentTotalAmount > 0;

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

      {/* Images Carousel - Only cover image */}
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

      {/* PRODUCT IMAGES GALLERY - Separate section below cover image */}
      {page.productImages && page.productImages.length > 0 && (
        <div className="bg-[#0e0e0e] py-6 px-4 border-b border-gray-800">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-400">Product Gallery</h3>
              <span className="text-xs text-gray-500">{page.productImages.length} images</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {page.productImages.map((img, idx) => (
                <div 
                  key={idx} 
                  className="relative aspect-square rounded-xl overflow-hidden bg-[#1a1a1a] border border-gray-800 cursor-pointer hover:border-[#e1bf46] transition-all group"
                  onClick={() => {
                    setSelectedProductImage(img);
                    setIsLightboxOpen(true);
                  }}
                >
                  <img 
                    src={img} 
                    alt={`${page.title} - ${idx + 1}`} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
              ))}
            </div>
          </div>
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

        {/* PHYSICAL PRODUCT SECTION */}
        {page.pageType === "physical" && (
          <div className="space-y-4">
            <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <PackageIcon className="h-5 w-5 text-[#e1bf46]" />
                <h3 className="font-bold text-lg text-white">Product Details</h3>
              </div>
              
              {/* Variants Selection */}
              {variants.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold mb-2 block text-white">Select Variant</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {variants.map((variant: Variant, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedVariant(variant)}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${
                          selectedVariant?.name === variant.name
                            ? "border-[#e1bf46] bg-[#e1bf46]/10 text-[#e1bf46]"
                            : "border-gray-700 hover:border-[#e1bf46]/50 text-gray-300"
                        }`}
                      >
                        <p className="font-semibold">{variant.name}</p>
                        <p className="text-sm mt-1">₦{(variant.price || page.price).toLocaleString()}</p>
                        {variant.stock !== undefined && variant.stock > 0 && (
                          <p className="text-xs text-gray-500 mt-1">Stock: {variant.stock}</p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Quantity Selector */}
              <div>
                <Label className="text-sm font-semibold mb-2 block text-white">Quantity</Label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-10 w-10 rounded-xl bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                  >
                    -
                  </button>
                  <Input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 text-center bg-[#1a1a1a] border-gray-700 text-white"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="h-10 w-10 rounded-xl bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
              
              {/* Shipping Info */}
              {page.metadata?.requiresShipping && (
                <div className="flex items-center gap-2 p-3 bg-blue-900/20 rounded-xl border border-blue-800">
                  <Truck className="h-4 w-4 text-blue-400" />
                  <p className="text-xs text-blue-300">Shipping address will be required</p>
                </div>
              )}
              
              {/* Price Summary */}
              <div className="pt-4 border-t border-gray-800">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Unit Price:</span>
                  <span className="text-white">₦{getBasePrice().toLocaleString()}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Quantity:</span>
                  <span className="text-white">x{quantity}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-800">
                  <span className="font-semibold text-white">Total:</span>
                  <span className="text-2xl font-bold text-[#e1bf46]">₦{getTotalProductPrice().toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DIGITAL PRODUCT SECTION */}
        {page.pageType === "digital" && (
          <div className="space-y-4">
            <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5 text-[#e1bf46]" />
                <h3 className="font-bold text-lg text-white">Payment Link</h3>
              </div>
              
              {/* Price Display */}
              <div className="p-4 bg-[#e1bf46]/10 rounded-xl border border-[#e1bf46]/20">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-white">Price:</span>
                  <span className="text-2xl font-bold text-[#e1bf46]">
                    ₦{page.price.toLocaleString()}
                  </span>
                </div>
              </div>
              
              {/* Delivery Info */}
              {page.metadata?.emailDelivery !== false && (
                <div className="flex items-center gap-2 p-3 bg-green-900/20 rounded-xl border border-green-800">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <p className="text-xs text-green-300">Download link will be sent to your email</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Fee Breakdown - School Only */}
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

        {/* Payment Options - School Only */}
        {page.pageType === "school" && canDoInstallments && (
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

        {/* Student Selection - School Only */}
        {page.pageType === "school" && (
          <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-5 space-y-4">
            <h3 className="font-bold text-lg text-white">Select Students</h3>
            
            <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
              {students.map((student: Student) => {
                const isSelected = selectedStudents.has(student.name);
                const isPaid = student.paid;
                const isPartiallyPaid = student.isPartiallyPaid;
                const payAmount = getStudentPayAmount(student);
                const totalAmount = student.totalAmount;
                const paidAmount = student.paidAmount || 0;
                
                if (isPaid) {
                  return (
                    <div key={student.name} className="p-4 rounded-xl bg-green-900/20 border border-green-800 opacity-70">
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
                
                if (isPartiallyPaid) {
                  return (
                    <div key={student.name} className="p-4 rounded-xl bg-yellow-900/20 border border-yellow-800">
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

        {/* PAYMENT METHOD SELECTOR - Two Options */}
        <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-5">
          <h3 className="font-bold text-lg mb-4 text-white">Payment Method</h3>
          
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => setSelectedPaymentMethod("virtual_account")}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedPaymentMethod === "virtual_account"
                  ? "border-[#e1bf46] bg-[#e1bf46]/10"
                  : "border-gray-700 hover:border-[#e1bf46]/50"
              }`}
            >
              <Banknote className={`h-6 w-6 mx-auto mb-2 ${
                selectedPaymentMethod === "virtual_account" ? "text-[#e1bf46]" : "text-gray-400"
              }`} />
              <p className={`font-medium ${
                selectedPaymentMethod === "virtual_account" ? "text-[#e1bf46]" : "text-white"
              }`}>Bank Transfer</p>
              <p className="text-xs text-gray-500 mt-1">Pay via Virtual Account</p>
            </button>
            
            <button
              onClick={() => setSelectedPaymentMethod("card")}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedPaymentMethod === "card"
                  ? "border-[#e1bf46] bg-[#e1bf46]/10"
                  : "border-gray-700 hover:border-[#e1bf46]/50"
              }`}
            >
              <CreditCard className={`h-6 w-6 mx-auto mb-2 ${
                selectedPaymentMethod === "card" ? "text-[#e1bf46]" : "text-gray-400"
              }`} />
              <p className={`font-medium ${
                selectedPaymentMethod === "card" ? "text-[#e1bf46]" : "text-white"
              }`}>Card Payment</p>
              <p className="text-xs text-gray-500 mt-1">Pay with Credit/Debit Card</p>
            </button>
          </div>

          {/* Virtual Account Details - Only show when selected */}
          {selectedPaymentMethod === "virtual_account" && page.virtualAccount && (
            <>
              <div className="bg-blue-900/20 rounded-xl p-4 border border-blue-800 mb-4">
                <p className="text-sm font-medium text-blue-400 mb-2">Transfer to this account:</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Bank:</span>
                    <span className="font-medium text-white">{page.virtualAccount.bankName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Account Number:</span>
                    <span 
                      className="font-mono font-bold text-white cursor-pointer hover:text-[#e1bf46]"
                      onClick={() => copyToClipboard(page.virtualAccount!.accountNumber, "Account Number")}
                    >
                      {page.virtualAccount.accountNumber}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Account Name:</span>
                    <span className="font-medium text-white truncate max-w-[200px]">
                      {page.virtualAccount.bankAccountName || page.virtualAccount.accountName}
                    </span>
                  </div>
                </div>
                <div className="mt-3 p-2 bg-yellow-900/20 rounded-lg border border-yellow-800">
                  <p className="text-xs text-yellow-400">
                    📝 Use <strong className="text-yellow-300">
                      {page.pageType === "school" ? "student name(s)" : "product name"}
                    </strong> as narration
                  </p>
                </div>
              </div>
              
              {/* Total Amount Display for Virtual Account */}
              <div className="bg-[#0e0e0e] rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Amount:</span>
                  <span className="text-2xl font-bold text-[#e1bf46]">
                    ₦{currentTotalAmount.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  You'll receive account details above to complete your transfer
                </p>
              </div>
            </>
          )}

          {/* Card Payment Section - Only show when selected */}
          {selectedPaymentMethod === "card" && (
            <>
              {/* Customer Info Fields */}
              <div className="space-y-3 mb-4">
                <div>
                  <Label className="text-sm font-semibold mb-1 block text-white">Your Name *</Label>
                  <Input
                    type="text"
                    placeholder="Enter your full name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="bg-[#0e0e0e] border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-1 block text-white">Email Address *</Label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="bg-[#0e0e0e] border-gray-700 text-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">Receipt will be sent to this email</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-1 block text-white">Phone Number (Optional)</Label>
                  <Input
                    type="tel"
                    placeholder="08012345678"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="bg-[#0e0e0e] border-gray-700 text-white"
                  />
                </div>
              </div>

              {/* Total Amount Display for Card */}
              <div className="bg-[#0e0e0e] rounded-xl p-4 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Amount:</span>
                  <span className="text-2xl font-bold text-[#e1bf46]">
                    ₦{currentTotalAmount.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  You'll be redirected to complete your card payment
                </p>
              </div>

              {/* Pay Button - Only for Card Payment */}
              {hasValidAmount ? (
                <Button
                  onClick={openCardModal}
                  disabled={!customerName || !customerEmail}
                  className="w-full bg-[#e1bf46] text-[#023528] hover:bg-[#e1bf46]/90 font-semibold py-6 text-lg"
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Pay ₦{currentTotalAmount.toLocaleString()} with Card
                </Button>
              ) : (
                <div className="text-center p-4 bg-gray-800/30 rounded-xl">
                  <p className="text-gray-400 text-sm">Please select items to continue</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <Shield className="h-3.5 w-3.5" /> Secured by Zidwell
        </div>
      </div>

      {/* Card Payment Modal - Customer Info Collection */}
      {showCardModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl p-6 max-w-md w-full border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Complete Payment</h3>
              <button onClick={() => setShowCardModal(false)} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-[#0e0e0e] rounded-xl p-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount:</span>
                  <span className="text-xl font-bold text-[#e1bf46]">₦{cardPaymentAmount.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="bg-blue-900/20 rounded-xl p-3">
                <p className="text-sm text-blue-400">You'll be redirected to our secure payment gateway to complete your transaction.</p>
              </div>
              
              <Button
                onClick={handleCardPayment}
                disabled={processingCardPayment}
                className="w-full bg-[#e1bf46] text-[#023528] hover:bg-[#e1bf46]/90 font-semibold py-3"
              >
                {processingCardPayment ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                {processingCardPayment ? "Processing..." : "Proceed to Payment"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {isLightboxOpen && selectedProductImage && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div className="relative max-w-4xl w-full">
            <img 
              src={selectedProductImage} 
              alt="Product view" 
              className="w-full h-auto rounded-xl"
            />
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </button>
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