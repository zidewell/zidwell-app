// app/pay/[slug]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, Shield, Clock, TrendingUp, AlertTriangle, CreditCard, Loader2, Package, FileDown, Briefcase, Heart, GraduationCap, Building2, LineChart, PiggyBank, Bitcoin } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";

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
  feeBreakdown?: Array<{ label: string; amount: number }>;
  className?: string;
  students?: Array<{ name: string; className: string; regNumber?: string; paid?: boolean }>;
  requiredFields?: string[];
  variants?: Array<{ name: string; options: string[] }>;
  requiresShipping?: boolean;
  downloadUrl?: string;
  accessLink?: string;
  bookingEnabled?: boolean;
  customerNoteEnabled?: boolean;
}

const PaymentPageView = () => {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const [page, setPage] = useState<PaymentPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Form state for all page types
  const [formData, setFormData] = useState({
    // Common fields
    fullName: "",
    email: "",
    phone: "",
    amount: "",
    
    // School fields
    parentName: "",
    childName: "",
    regNumber: "",
    customFields: {} as Record<string, string>,
    
    // Physical product fields
    selectedVariants: {} as Record<string, string>,
    quantity: "1",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    
    // Digital product fields
    // No additional fields needed
    
    // Service fields
    bookingDate: "",
    bookingTime: "",
    customerNote: "",
    
    // Donation fields
    donorMessage: "",
    
    // Investment fields
    investmentAmount: "",
  });

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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleVariantChange = (variantName: string, option: string) => {
    setFormData(prev => ({
      ...prev,
      selectedVariants: { ...prev.selectedVariants, [variantName]: option }
    }));
  };

  const handleCustomFieldChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      customFields: { ...prev.customFields, [field]: value }
    }));
  };

  const validateForm = () => {
    // Common validation
    if (!formData.fullName.trim()) {
      alert("Please enter your full name");
      return false;
    }
    if (!formData.email.trim()) {
      alert("Please enter your email address");
      return false;
    }

    // Page type specific validation
    if (page?.pageType === "school") {
      if (!formData.parentName.trim()) {
        alert("Please enter parent's full name");
        return false;
      }
      if (!formData.childName.trim()) {
        alert("Please enter child's full name");
        return false;
      }
    }

    if (page?.pageType === "physical") {
      // Check if all variants are selected
      if (page.variants && page.variants.length > 0) {
        for (const variant of page.variants) {
          if (!formData.selectedVariants[variant.name]) {
            alert(`Please select ${variant.name}`);
            return false;
          }
        }
      }
      if (page.requiresShipping && !formData.address.trim()) {
        alert("Please enter your delivery address");
        return false;
      }
    }

    if (page?.pageType === "services") {
      if (page.bookingEnabled && (!formData.bookingDate || !formData.bookingTime)) {
        alert("Please select booking date and time");
        return false;
      }
    }

    if (page?.pageType === "donation" && page.priceType === "open" && !formData.amount) {
      alert("Please enter donation amount");
      return false;
    }

    if ((page?.pageType === "real_estate" || page?.pageType === "stock" || page?.pageType === "savings" || page?.pageType === "crypto")) {
      const minAmount = page.metadata?.minimumAmount;
      const amount = Number(formData.investmentAmount);
      if (!formData.investmentAmount) {
        alert("Please enter investment amount");
        return false;
      }
      if (minAmount && amount < minAmount) {
        alert(`Minimum investment amount is ₦${minAmount.toLocaleString()}`);
        return false;
      }
    }

    return true;
  };

  const getTotalAmount = () => {
    // For school pages with fee breakdown
    if (page?.feeBreakdown && page.feeBreakdown.length > 0) {
      return page.feeBreakdown.reduce((sum, item) => sum + item.amount, 0);
    }
    
    // For open pricing or donation
    if (page?.priceType === "open" || page?.pageType === "donation") {
      if (page?.pageType === "donation" && formData.amount) {
        return Number(formData.amount);
      }
      if (page?.pageType === "real_estate" || page?.pageType === "stock" || page?.pageType === "savings" || page?.pageType === "crypto") {
        return Number(formData.investmentAmount) || page?.price || 0;
      }
      return Number(formData.amount) || page?.price || 0;
    }
    
    // For physical products with quantity
    if (page?.pageType === "physical") {
      return (page?.price || 0) * (Number(formData.quantity) || 1);
    }
    
    return page?.price || 0;
  };

  const handlePayment = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);
    
    try {
      const totalAmount = getTotalAmount();
      const fee = Math.min(totalAmount * 0.02, 2000);
      const totalWithFee = page?.feeMode === "customer" ? totalAmount + fee : totalAmount;

      // Prepare metadata based on page type
      const metadata: any = {
        pageType: page?.pageType,
        pageTitle: page?.title,
      };

      if (page?.pageType === "school") {
        metadata.parentName = formData.parentName;
        metadata.childName = formData.childName;
        metadata.regNumber = formData.regNumber;
        metadata.customFields = formData.customFields;
      }

      if (page?.pageType === "physical") {
        metadata.selectedVariants = formData.selectedVariants;
        metadata.quantity = formData.quantity;
        metadata.address = formData.address;
        metadata.city = formData.city;
        metadata.state = formData.state;
        metadata.zipCode = formData.zipCode;
      }

      if (page?.pageType === "services") {
        metadata.bookingDate = formData.bookingDate;
        metadata.bookingTime = formData.bookingTime;
        metadata.customerNote = formData.customerNote;
      }

      if (page?.pageType === "donation") {
        metadata.donorMessage = formData.donorMessage;
      }

      if (page?.pageType === "real_estate" || page?.pageType === "stock" || page?.pageType === "savings" || page?.pageType === "crypto") {
        metadata.investmentAmount = formData.investmentAmount;
      }

      const response = await fetch("/api/payment-page/public/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageSlug: slug,
          customerName: formData.fullName,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          amount: totalAmount,
          metadata: metadata,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout");
      }

      // Redirect to card payment
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
      <div className="min-h-screen bg-[#f7f0e2] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e1bf46]"></div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-[#f7f0e2] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Page not found</h1>
          <p className="text-gray-600 mb-4">This payment page doesn't exist or has been removed.</p>
          <Button variant="default" onClick={() => router.push("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  const totalAmount = getTotalAmount();
  const fee = Math.min(totalAmount * 0.02, 2000);
  const totalWithFee = page.feeMode === "customer" ? totalAmount + fee : totalAmount;

  const allImages = [...(page.coverImage ? [page.coverImage] : []), ...page.productImages];

  // Get page type icon
  const getPageTypeIcon = () => {
    switch (page.pageType) {
      case "school": return <GraduationCap className="h-5 w-5" />;
      case "donation": return <Heart className="h-5 w-5" />;
      case "physical": return <Package className="h-5 w-5" />;
      case "digital": return <FileDown className="h-5 w-5" />;
      case "services": return <Briefcase className="h-5 w-5" />;
      case "real_estate": return <Building2 className="h-5 w-5" />;
      case "stock": return <LineChart className="h-5 w-5" />;
      case "savings": return <PiggyBank className="h-5 w-5" />;
      case "crypto": return <Bitcoin className="h-5 w-5" />;
      default: return <CreditCard className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f0e2]">
      {/* Header */}
      <div className="bg-[#034936] text-white sticky top-0 z-10">
        <div className="container py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="hover:opacity-80">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            {page.logo && (
              <img src={page.logo} className="h-10 w-10 rounded-xl object-cover" alt="Logo" />
            )}
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
          <img
            src={allImages[currentImage]}
            alt="Product"
            className="w-full h-64 md:h-80 object-cover"
          />
          {allImages.length > 1 && (
            <>
              <button
                onClick={() => setCurrentImage((c) => (c === 0 ? allImages.length - 1 : c - 1))}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/60 transition"
              >
                <ChevronLeft className="h-4 w-4 text-white" />
              </button>
              <button
                onClick={() => setCurrentImage((c) => (c === allImages.length - 1 ? 0 : c + 1))}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/60 transition"
              >
                <ChevronRight className="h-4 w-4 text-white" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {allImages.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === currentImage ? "w-4 bg-white" : "w-1.5 bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Content */}
      <div className="container max-w-lg mx-auto py-6 space-y-6 px-4 pb-32">
        {/* Title & Description */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            {getPageTypeIcon()}
            <h2 className="text-2xl font-bold">{page.title}</h2>
          </div>
          {page.className && (
            <span className="inline-block px-3 py-1 rounded-full bg-[#e1bf46]/10 text-[#e1bf46] text-sm font-medium mb-2">
              {page.className}
            </span>
          )}
          {page.description && (
            <p className="text-gray-600 text-sm leading-relaxed">{page.description}</p>
          )}
        </div>

        {/* Fee Breakdown for School */}
        {page.pageType === "school" && page.feeBreakdown && page.feeBreakdown.length > 0 && (
          <div className="bg-white rounded-2xl border p-5">
            <h3 className="font-bold text-lg mb-4 text-[#023528]">Fee Breakdown</h3>
            <div className="space-y-3">
              {page.feeBreakdown.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-semibold">₦{item.amount.toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3 font-bold text-lg">
                <span>Total</span>
                <span className="text-[#e1bf46]">₦{totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Investment Details */}
        {(page.pageType === "real_estate" || page.pageType === "stock" || page.pageType === "savings" || page.pageType === "crypto") && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border">
            <h3 className="font-bold text-sm mb-3 text-[#023528]">Investment Details</h3>
            <div className="space-y-2">
              {page.metadata?.minimumAmount && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Minimum Amount</span>
                  <span className="font-medium">₦{page.metadata.minimumAmount.toLocaleString()}</span>
                </div>
              )}
              {page.metadata?.expectedReturn && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> Expected Return
                  </span>
                  <span className="font-medium">{page.metadata.expectedReturn}</span>
                </div>
              )}
              {page.metadata?.tenure && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Tenure
                  </span>
                  <span className="font-medium">{page.metadata.tenure}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Risk Disclosure */}
        {page.metadata?.riskExplanation && (
          <div className="p-4 rounded-2xl border-2 border-yellow-500/30 bg-yellow-500/5">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-bold text-yellow-700">Risk Disclosure</span>
            </div>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{page.metadata.riskExplanation}</p>
          </div>
        )}

        {/* ========== DYNAMIC FORM FIELDS BASED ON PAGE TYPE ========== */}

        {/* Common Fields - Full Name & Email */}
        <div className="bg-white rounded-2xl border p-5 space-y-4">
          <h3 className="font-bold text-lg mb-2">Your Information</h3>
          
          <div>
            <Label className="text-sm font-semibold mb-1.5 block">Full Name *</Label>
            <Input
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={(e) => handleInputChange("fullName", e.target.value)}
              className="h-12"
            />
          </div>

          <div>
            <Label className="text-sm font-semibold mb-1.5 block">Email Address *</Label>
            <Input
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className="h-12"
            />
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
        </div>

        {/* SCHOOL PAGE FIELDS */}
        {page.pageType === "school" && (
          <div className="bg-white rounded-2xl border p-5 space-y-4">
            <h3 className="font-bold text-lg mb-2">Student Information</h3>
            
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Parent Full Name *</Label>
              <Input
                placeholder="Enter parent's full name"
                value={formData.parentName}
                onChange={(e) => handleInputChange("parentName", e.target.value)}
                className="h-12"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Child's Full Name *</Label>
              <Input
                placeholder="Enter student's full name"
                value={formData.childName}
                onChange={(e) => handleInputChange("childName", e.target.value)}
                className="h-12"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Registration Number</Label>
              <Input
                placeholder="Enter student registration number"
                value={formData.regNumber}
                onChange={(e) => handleInputChange("regNumber", e.target.value)}
                className="h-12"
              />
              <p className="text-xs text-gray-500 mt-1">Optional but recommended for tracking</p>
            </div>

            {/* Custom Required Fields */}
            {page.requiredFields && page.requiredFields.map((field) => (
              <div key={field}>
                <Label className="text-sm font-semibold mb-1.5 block">{field}</Label>
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

        {/* PHYSICAL PRODUCT FIELDS */}
        {page.pageType === "physical" && (
          <div className="bg-white rounded-2xl border p-5 space-y-4">
            <h3 className="font-bold text-lg mb-2">Product Options</h3>
            
            {/* Variants */}
            {page.variants && page.variants.length > 0 && (
              <div className="space-y-4">
                {page.variants.map((variant) => (
                  <div key={variant.name}>
                    <Label className="text-sm font-semibold mb-2 block">{variant.name} *</Label>
                    <div className="flex flex-wrap gap-2">
                      {variant.options.filter(opt => opt).map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => handleVariantChange(variant.name, option)}
                          className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                            formData.selectedVariants[variant.name] === option
                              ? "border-[#e1bf46] bg-[#e1bf46]/10 text-[#023528]"
                              : "border-gray-200 hover:border-[#e1bf46]/50"
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

            {/* Quantity */}
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Quantity</Label>
              <Input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => handleInputChange("quantity", e.target.value)}
                className="h-12 w-32"
              />
            </div>

            {/* Shipping Address */}
            {page.requiresShipping && (
              <>
                <div className="pt-2">
                  <Label className="text-sm font-semibold mb-1.5 block">Delivery Address *</Label>
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
                    <Label className="text-sm font-semibold mb-1.5 block">City</Label>
                    <Input
                      placeholder="City"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      className="h-12"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold mb-1.5 block">State</Label>
                    <Input
                      placeholder="State"
                      value={formData.state}
                      onChange={(e) => handleInputChange("state", e.target.value)}
                      className="h-12"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* DIGITAL PRODUCT FIELDS */}
        {page.pageType === "digital" && (
          <div className="bg-white rounded-2xl border p-5">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
              <FileDown className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">Instant Digital Delivery</p>
                <p className="text-xs text-green-600">You will receive download link via email after payment</p>
              </div>
            </div>
          </div>
        )}

        {/* SERVICES FIELDS */}
        {page.pageType === "services" && (
          <div className="bg-white rounded-2xl border p-5 space-y-4">
            <h3 className="font-bold text-lg mb-2">Service Details</h3>
            
            {page.bookingEnabled && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block">Preferred Date *</Label>
                  <Input
                    type="date"
                    value={formData.bookingDate}
                    onChange={(e) => handleInputChange("bookingDate", e.target.value)}
                    className="h-12"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block">Preferred Time *</Label>
                  <Input
                    type="time"
                    value={formData.bookingTime}
                    onChange={(e) => handleInputChange("bookingTime", e.target.value)}
                    className="h-12"
                  />
                </div>
              </div>
            )}

            {page.customerNoteEnabled && (
              <div>
                <Label className="text-sm font-semibold mb-1.5 block">Describe your request</Label>
                <Textarea
                  placeholder="Tell us what you need..."
                  value={formData.customerNote}
                  onChange={(e) => handleInputChange("customerNote", e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
            )}
          </div>
        )}

        {/* DONATION FIELDS */}
        {page.pageType === "donation" && (
          <div className="bg-white rounded-2xl border p-5 space-y-4">
            <h3 className="font-bold text-lg mb-2">Donation Details</h3>
            
            {/* Suggested Amounts */}
            {page.metadata?.suggestedAmounts && page.metadata.suggestedAmounts.length > 0 && (
              <div>
                <Label className="text-sm font-semibold mb-2 block">Suggested Amounts</Label>
                <div className="flex flex-wrap gap-2">
                  {page.metadata.suggestedAmounts.map((amount: number) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => handleInputChange("amount", amount.toString())}
                      className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                        Number(formData.amount) === amount
                          ? "border-[#e1bf46] bg-[#e1bf46]/10 text-[#023528]"
                          : "border-gray-200 hover:border-[#e1bf46]/50"
                      }`}
                    >
                      ₦{amount.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Amount */}
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Custom Amount (₦)</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={formData.amount}
                onChange={(e) => handleInputChange("amount", e.target.value)}
                className="h-12"
              />
            </div>

            {/* Donor Message */}
            {page.metadata?.allowDonorMessage && (
              <div>
                <Label className="text-sm font-semibold mb-1.5 block">Message (Optional)</Label>
                <Textarea
                  placeholder="Leave a message..."
                  value={formData.donorMessage}
                  onChange={(e) => handleInputChange("donorMessage", e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
            )}
          </div>
        )}

        {/* INVESTMENT FIELDS */}
        {(page.pageType === "real_estate" || page.pageType === "stock" || page.pageType === "savings" || page.pageType === "crypto") && (
          <div className="bg-white rounded-2xl border p-5 space-y-4">
            <h3 className="font-bold text-lg mb-2">Investment Amount</h3>
            
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">
                Amount to Invest (₦)
                {page.metadata?.minimumAmount && (
                  <span className="text-xs text-gray-500 ml-2">
                    (Min: ₦{page.metadata.minimumAmount.toLocaleString()})
                  </span>
                )}
              </Label>
              <Input
                type="number"
                placeholder="Enter investment amount"
                value={formData.investmentAmount}
                onChange={(e) => handleInputChange("investmentAmount", e.target.value)}
                className="h-12"
              />
            </div>

            {page.metadata?.charges && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Fee Note:</strong> {page.metadata.charges}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Payment Summary */}
        <div className="bg-[#e9e2d7] rounded-2xl p-5 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">Subtotal</span>
            <span className="font-medium">₦{totalAmount.toLocaleString()}</span>
          </div>
          {page.feeMode === "customer" && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Transaction fee (2%)</span>
              <span className="font-medium">₦{fee.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg pt-2 border-t border-[#ded4c3]">
            <span>Total</span>
            <span className="text-[#e1bf46]">₦{totalWithFee.toLocaleString()}</span>
          </div>
        </div>

        {/* Pay Button */}
        <Button
          variant="default"
          size="lg"
          className="w-full py-6 text-base bg-[#e1bf46] text-[#023528] hover:bg-[#e1bf46]/90"
          onClick={handlePayment}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay ₦${totalWithFee.toLocaleString()}`
          )}
        </Button>

        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 pb-6">
          <Shield className="h-3.5 w-3.5" /> Secured by Zidwell
        </div>
      </div>
    </div>
  );
};

export default PaymentPageView;