// app/pay/[slug]/page.tsx
import { Metadata, ResolvingMetadata } from "next";

// This is a Server Component for metadata generation
async function getPageData(slug: string) {
  try {
    const baseUrl = process.env.NODE_ENV === "development" 
      ? "http://localhost:3000" 
      : "https://zidwell.com";
    
    const response = await fetch(`${baseUrl}/api/payment-page/public/${slug}`, {
      cache: "no-store"
    });
    
    if (!response.ok) return null;
    const data = await response.json();
    return data.page;
  } catch (error) {
    console.error("Error fetching page:", error);
    return null;
  }
}

// Generate metadata for social sharing
export async function generateMetadata(
  { params }: { params: { slug: string } },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const page = await getPageData(params.slug);
  
  if (!page) {
    return {
      title: "Page Not Found | Zidwell",
      description: "The requested payment page could not be found.",
    };
  }

  // Determine the featured image (cover image or first product image)
  let featuredImage = page.coverImage;
  if (!featuredImage && page.productImages && page.productImages.length > 0) {
    featuredImage = page.productImages[0];
  }

  // If still no image, use a default image
  const defaultImage = `https://zidwell.com/zidwell-og-image.png`;
  const imageUrl = featuredImage || defaultImage;

  // Format price for display
  const formattedPrice = page.price ? `₦${page.price.toLocaleString()}` : "Pay securely";
  
  // Determine page type label
  const typeLabels: Record<string, string> = {
    school: "School Fees",
    donation: "Donation",
    physical: "Product",
    digital: "Digital Product",
    services: "Service",
    real_estate: "Real Estate",
    stock: "Investment",
    savings: "Savings",
    crypto: "Crypto",
  };

  const pageTypeLabel = typeLabels[page.pageType] || "Payment";
  
  // Create description
  const description = page.description 
    ? `${page.title} - ${page.description.substring(0, 150)}...` 
    : `Pay for ${page.title} securely on Zidwell. ${pageTypeLabel} payment made easy.`;

  return {
    title: `${page.title} | Zidwell Payment`,
    description: description,
    openGraph: {
      title: `${page.title} | Pay Securely on Zidwell`,
      description: description,
      url: `https://zidwell.com/pay/${page.slug}`,
      siteName: "Zidwell",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: page.title,
        },
      ],
      locale: "en_NG",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${page.title} | Zidwell Payment`,
      description: description,
      images: [imageUrl],
      creator: "@zidwell",
      site: "@zidwell",
    },
    robots: {
      index: true,
      follow: true,
    },
    keywords: [`${page.title}`, pageTypeLabel, "payment", "Zidwell", "online payment"],
  };
}

// Client Component for the actual page
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowLeft, ChevronLeft, ChevronRight, Shield, Clock, TrendingUp, 
  AlertTriangle, CreditCard, Loader2, Package, FileDown, Briefcase, 
  Heart, GraduationCap, Building2, LineChart, PiggyBank, Bitcoin, 
  CheckCircle, UserCheck, Calendar, ToggleLeft, ToggleRight 
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";

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
  feeBreakdown?: Array<{ label: string; amount: number }>;
  className?: string;
  students?: Student[];
  requiredFields?: string[];
  variants?: Array<{ name: string; options: string[] }>;
  requiresShipping?: boolean;
  downloadUrl?: string;
  accessLink?: string;
  bookingEnabled?: boolean;
  customerNoteEnabled?: boolean;
  installmentAmount?: number;
  totalInstallments?: number;
  remainingInstallments?: number;
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
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [payInInstallments, setPayInInstallments] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    amount: "",
    parentName: "",
    childName: "",
    regNumber: "",
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
        
        // Update document title for better SEO (fallback)
        if (data.page?.title) {
          document.title = `${data.page.title} | Pay with Zidwell`;
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCustomFieldChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      customFields: { ...prev.customFields, [field]: value }
    }));
  };

  const handleStudentSelect = (studentName: string) => {
    const student = page?.students?.find(s => s.name === studentName);
    if (student) {
      setSelectedStudent(student);
      setFormData(prev => ({
        ...prev,
        childName: student.name,
        regNumber: student.regNumber || ""
      }));
    }
  };

  const validateForm = () => {
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

    if (page?.pageType === "school") {
      if (!formData.parentName.trim()) {
        alert("Please enter parent's full name");
        return false;
      }
      if (!formData.childName.trim()) {
        alert("Please select or enter child's name");
        return false;
      }
      
      if (selectedStudent?.paid) {
        alert(`This student (${selectedStudent.name}) has already been marked as paid. Please contact the school if you believe this is an error.`);
        return false;
      }
    }

    if (page?.pageType === "physical") {
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

    return true;
  };

  const getTotalAmount = () => {
    if (page?.feeBreakdown && page.feeBreakdown.length > 0) {
      return page.feeBreakdown.reduce((sum, item) => sum + item.amount, 0);
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

  const getInstallmentInfo = () => {
    if (page?.installmentCount && page.installmentCount > 1) {
      const totalAmount = getTotalAmount();
      const installmentCount = page.installmentCount;
      const installmentAmount = totalAmount / installmentCount;
      return {
        totalAmount,
        installmentCount,
        installmentAmount,
        remainingInstallments: page.remainingInstallments || installmentCount
      };
    }
    return null;
  };

  const getChargeAmount = () => {
    const totalAmount = getTotalAmount();
    
    if (payInInstallments) {
      const installmentInfo = getInstallmentInfo();
      if (installmentInfo) {
        return installmentInfo.installmentAmount;
      }
    }
    
    return totalAmount;
  };

  const handlePayment = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);
    
    try {
      const totalAmount = getTotalAmount();
      const chargeAmount = getChargeAmount();
      const isInstallmentPayment = payInInstallments && page?.installmentCount && page.installmentCount > 1;
      
      const fee = Math.min(chargeAmount * 0.02, 2000);
      const totalWithFee = page?.feeMode === "customer" ? chargeAmount + fee : chargeAmount;

      const metadata: any = {
        pageType: page?.pageType,
        pageTitle: page?.title,
        paymentType: isInstallmentPayment ? "installment" : "full",
        isInstallment: isInstallmentPayment,
        customerPhone: formData.phone,
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
        metadata.childName = formData.childName;
        metadata.regNumber = formData.regNumber;
        metadata.customFields = formData.customFields;
        metadata.selectedStudent = selectedStudent;
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

      const response = await fetch("/api/payment-page/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageSlug: slug,
          customerName: formData.fullName,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          amount: chargeAmount,
          metadata: metadata,
        }),
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
  const chargeAmount = getChargeAmount();
  const fee = Math.min(chargeAmount * 0.02, 2000);
  const totalWithFee = page.feeMode === "customer" ? chargeAmount + fee : chargeAmount;
  const installmentInfo = getInstallmentInfo();
  const canDoInstallments = page.installmentCount && page.installmentCount > 1 && !page.feeBreakdown;

  const allImages = [...(page.coverImage ? [page.coverImage] : []), ...page.productImages];
  const unpaidStudents = page.students?.filter(s => !s.paid) || [];
  const paidStudents = page.students?.filter(s => s.paid) || [];

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
            alt={page.title}
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

      {/* Rest of your existing content... */}
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

        {/* Toggle Button for Installment/Full Payment */}
        {canDoInstallments && (
          <div className="bg-white rounded-2xl border p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Payment Option</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {payInInstallments 
                    ? `Pay in ${page.installmentCount} monthly installments of ₦${installmentInfo?.installmentAmount.toLocaleString()}`
                    : `Pay full amount of ₦${totalAmount.toLocaleString()} once`}
                </p>
              </div>
              <button
                onClick={() => setPayInInstallments(!payInInstallments)}
                className="focus:outline-none"
              >
                {payInInstallments ? (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#e1bf46]/10 text-[#e1bf46]">
                    <ToggleRight className="h-6 w-6" />
                    <span className="text-sm font-medium">Installments</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-600">
                    <ToggleLeft className="h-6 w-6" />
                    <span className="text-sm font-medium">Pay in Full</span>
                  </div>
                )}
              </button>
            </div>

            {payInInstallments && (
              <div className="mt-4 p-3 bg-blue-50 rounded-xl">
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Installment Plan Details</p>
                    <p className="text-xs text-blue-600 mt-1">
                      Total: ₦{installmentInfo?.totalAmount.toLocaleString()} • 
                      {page.installmentCount} installments of ₦{installmentInfo?.installmentAmount.toLocaleString()}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      You'll be charged ₦{installmentInfo?.installmentAmount.toLocaleString()} today.
                      Remaining {page.installmentCount - 1} payments will be charged monthly.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========== CUSTOMER INFORMATION - ALWAYS SHOWN ========== */}
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
            <Label className="text-sm font-semibold mb-1.5 block">Phone Number *</Label>
            <Input
              type="tel"
              placeholder="08012345678"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              className="h-12"
            />
          </div>
        </div>

        {/* ========== SCHOOL PAGE SPECIFIC FIELDS ========== */}
        {page.pageType === "school" && (
          <div className="bg-white rounded-2xl border p-5 space-y-4">
            <h3 className="font-bold text-lg mb-2">Student Information</h3>
            
            {unpaidStudents.length > 0 && (
              <div>
                <Label className="text-sm font-semibold mb-1.5 block">Select Student *</Label>
                <Select onValueChange={handleStudentSelect}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Choose a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {unpaidStudents.map((student) => (
                      <SelectItem key={student.name} value={student.name}>
                        {student.name} {student.regNumber ? `(${student.regNumber})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">Select your child from the list</p>
              </div>
            )}

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

            <div className="pt-2">
              <Label className="text-sm font-semibold mb-1.5 block">Parent Full Name *</Label>
              <Input
                placeholder="Enter parent's full name"
                value={formData.parentName}
                onChange={(e) => handleInputChange("parentName", e.target.value)}
                className="h-12"
              />
            </div>

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
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            selectedVariants: { ...prev.selectedVariants, [variant.name]: option }
                          }))}
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

            {page.requiresShipping && (
              <>
                <div>
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

        {/* Paid Students List */}
        {page.pageType === "school" && paidStudents.length > 0 && (
          <div className="bg-white rounded-2xl border p-5">
            <div className="flex items-center gap-2 mb-3">
              <UserCheck className="h-5 w-5 text-green-600" />
              <h3 className="font-bold text-lg">Paid Students</h3>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {paidStudents.map((student) => (
                <div key={student.name} className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{student.name}</p>
                    {student.regNumber && (
                      <p className="text-xs text-gray-500">Reg: {student.regNumber}</p>
                    )}
                    {student.parentName && (
                      <p className="text-xs text-gray-500">Paid by: {student.parentName}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-green-600">
                      {student.paidAt ? new Date(student.paidAt).toLocaleDateString() : 'Paid'}
                    </p>
                    {student.paidAmount && (
                      <p className="text-xs font-medium">₦{student.paidAmount.toLocaleString()}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment Summary */}
        <div className="bg-[#e9e2d7] rounded-2xl p-5 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">
              {payInInstallments ? "Installment Amount" : "Total Amount"}
            </span>
            <span className="font-medium">₦{chargeAmount.toLocaleString()}</span>
          </div>
          {page.feeMode === "customer" && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Transaction fee (2%)</span>
              <span className="font-medium">₦{fee.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg pt-2 border-t border-[#ded4c3]">
            <span>Total to Pay Now</span>
            <span className="text-[#e1bf46]">₦{totalWithFee.toLocaleString()}</span>
          </div>
          {payInInstallments && installmentInfo && (
            <div className="text-xs text-gray-500 text-center pt-2 space-y-1">
              <p>This is installment 1 of {installmentInfo.installmentCount}</p>
              <p>Remaining balance: ₦{(installmentInfo.totalAmount - chargeAmount).toLocaleString()}</p>
            </div>
          )}
        </div>

        {/* Pay Button */}
        <Button
          variant="default"
          size="lg"
          className="w-full py-6 text-base bg-[#e1bf46] text-[#023528] hover:bg-[#e1bf46]/90"
          onClick={handlePayment}
          disabled={isProcessing || (page.pageType === "school" && selectedStudent?.paid)}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay ${payInInstallments ? 'Installment' : 'Now'} ₦${totalWithFee.toLocaleString()}`
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