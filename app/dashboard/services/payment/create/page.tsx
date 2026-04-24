// app/create/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Upload,
  X,
  ImagePlus,
  Link2,
  Building2,
  RefreshCw,
  User,
  Loader2,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import {
  useStore,
  PageType,
  Student,
  FeeItem,
  Variant,
  isInvestmentType,
} from "@/app/hooks/useStore";
import { useUserContextData } from "@/app/context/userData";
import Swal from "sweetalert2";
import PageTypeSelector from "@/app/components/payment-page-components/pageTypeSelector";
import SchoolFields from "@/app/components/payment-page-components/SchoolFields";
import DonationFields from "@/app/components/payment-page-components/DonationFields";
import PhysicalFields from "@/app/components/payment-page-components/PhysicalFields";
import DigitalFields from "@/app/components/payment-page-components/DigitalFields";
import ServicesFields from "@/app/components/payment-page-components/ServicesFields";
import InvestmentFields from "@/app/components/payment-page-components/InvestmentFields";
import TrustSignals from "@/app/components/payment-page-components/TrustSignals";
import DashboardSidebar from "@/app/components/dashboard-component/DashboardSidebar";
import DashboardHeader from "@/app/components/dashboard-component/DashboardHeader";

const baseUrl =
  process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_DEV_URL || "http://localhost:3000"
    : process.env.NEXT_PUBLIC_BASE_URL || "https://zidwell.com";

const typeLabels: Record<PageType, string> = {
  school: "School Fees",
  donation: "Donation",
  physical: "Physical Product",
  digital: "Digital Product",
  services: "Service",
  real_estate: "Real Estate Investment",
  stock: "Stock Investment",
  savings: "Savings / Ajo",
  crypto: "Crypto Investment",
};

const CreatePage = () => {
  const router = useRouter();
  const { createPage, addPage } = useStore();
  const { userData } = useUserContextData();
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdSlug, setCreatedSlug] = useState("");
  const [pageType, setPageType] = useState<PageType | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [randomSuffix, setRandomSuffix] = useState(() =>
    Math.floor(100 + Math.random() * 900).toString(),
  );

  // Fee calculation state
  const [feeCalculation, setFeeCalculation] = useState({
    subtotal: 0,
    fee: 0,
    totalWithFee: 0,
    creatorReceives: 0,
    feePercentage: 2,
    feeCap: 2000,
  });

  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    coverImage: null as string | null,  // Store base64 locally
    logo: null as string | null,        // Store base64 locally
    productImages: [] as string[],       // Store base64 locally
    priceType: "fixed" as "fixed" | "installment" | "open",
    price: "",
    installmentCount: "3",
    feeMode: "bearer" as "bearer" | "customer",
    organizationName: "",
  });

  // School fields
  const [students, setStudents] = useState<Student[]>([]);
  const [schoolClass, setSchoolClass] = useState("");
  const [feeBreakdown, setFeeBreakdown] = useState<FeeItem[]>([]);
  const [requiredFields, setRequiredFields] = useState<string[]>([]);

  // Calculate total from fee breakdown
  const calculateFeeBreakdownTotal = () => {
    return feeBreakdown.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  // Calculate fee based on amount and fee mode
  const calculateFeeDetails = (amount: number, feeMode: string) => {
    const fee = Math.min(amount * 0.02, 2000);
    const totalWithFee = feeMode === "customer" ? amount + fee : amount;
    const creatorReceives = feeMode === "bearer" ? amount - fee : amount;
    
    return {
      fee,
      totalWithFee,
      creatorReceives,
    };
  };

  // Update fee calculation when price or feeMode changes
  useEffect(() => {
    const amount = Number(form.price) || 0;
    const { fee, totalWithFee, creatorReceives } = calculateFeeDetails(amount, form.feeMode);
    
    setFeeCalculation({
      subtotal: amount,
      fee,
      totalWithFee,
      creatorReceives,
      feePercentage: 2,
      feeCap: 2000,
    });
  }, [form.price, form.feeMode]);

  // Auto-update price when fee breakdown changes (only for school pages)
  useEffect(() => {
    if (pageType === "school") {
      const total = calculateFeeBreakdownTotal();
      if (total > 0) {
        setForm((f) => ({ ...f, price: total.toString() }));
      }
    }
  }, [feeBreakdown, pageType]);

  // Donation fields
  const [suggestedAmounts, setSuggestedAmounts] = useState<number[]>([5000, 10000, 20000]);
  const [showDonorList, setShowDonorList] = useState(false);
  const [allowDonorMessage, setAllowDonorMessage] = useState(true);

  // Physical product fields
  const [variants, setVariants] = useState<Variant[]>([]);
  const [requiresShipping, setRequiresShipping] = useState(true);

  // Digital product fields
  const [downloadUrl, setDownloadUrl] = useState("");
  const [accessLink, setAccessLink] = useState("");
  const [emailDelivery, setEmailDelivery] = useState(true);

  // Services fields
  const [bookingEnabled, setBookingEnabled] = useState(false);
  const [customerNoteEnabled, setCustomerNoteEnabled] = useState(true);

  // Investment fields
  const [minimumAmount, setMinimumAmount] = useState("");
  const [expectedReturn, setExpectedReturn] = useState("");
  const [tenure, setTenure] = useState("");
  const [charges, setCharges] = useState("");
  const [paymentFrequency, setPaymentFrequency] = useState<"one-time" | "recurring">("one-time");
  const [termsAndConditions, setTermsAndConditions] = useState("");
  const [riskExplanation, setRiskExplanation] = useState("");

  // Trust signals (for investments)
  const [cacCertificate, setCacCertificate] = useState("");
  const [taxClearance, setTaxClearance] = useState("");
  const [explainerVideo, setExplainerVideo] = useState("");
  const [socialLinks, setSocialLinks] = useState<{ platform: string; url: string }[]>([]);
  const [website, setWebsite] = useState("");
  const [contactInfo, setContactInfo] = useState("");

  const coverRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const productRef = useRef<HTMLInputElement>(null);

  // Set default logo from userData.profilePicture
  useEffect(() => {
    if (userData?.profilePicture && !form.logo) {
      setForm((f) => ({ ...f, logo: userData.profilePicture }));
    }
  }, [userData?.profilePicture]);

  // Handle image selection - store as base64 only, no upload yet
  const handleImageSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "coverImage" | "logo" | "productImages",
  ) => {
    const files = e.target.files;
    if (!files) return;

    if (field === "coverImage") {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string;
        setForm((f) => ({ ...f, coverImage: base64 }));
      };
      reader.readAsDataURL(file);
    } else if (field === "logo") {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string;
        setForm((f) => ({ ...f, logo: base64 }));
      };
      reader.readAsDataURL(file);
    } else if (field === "productImages") {
      const newImages = [...form.productImages];
      
      for (const file of Array.from(files)) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const base64 = ev.target?.result as string;
          newImages.push(base64);
          setForm((f) => ({ ...f, productImages: newImages }));
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const regenerateSuffix = () => {
    setRandomSuffix(Math.floor(100 + Math.random() * 900).toString());
  };

  const generateFullSlug = () => {
    const titleSlug = form.slug || slugify(form.title);
    const orgSlug = form.organizationName ? slugify(form.organizationName) : "";
    const parts = [];

    if (orgSlug) parts.push(orgSlug);
    if (titleSlug) parts.push(titleSlug);
    parts.push(randomSuffix);

    return parts.join("-");
  };

  const handleTitleChange = (title: string) => {
    const titleSlug = slugify(title);
    setForm((f) => ({
      ...f,
      title,
      slug: f.slug === slugify(f.title) || f.slug === "" ? titleSlug : f.slug,
    }));
  };

  const handleOrganizationChange = (orgName: string) => {
    setForm((f) => ({ ...f, organizationName: orgName }));
  };

  const isInvestment = pageType ? isInvestmentType(pageType) : false;

  const canCreate = () => {
    if (!form.title.trim() || !pageType || !form.organizationName.trim()) return false;
    
    // For school pages, require at least one fee item with amount
    if (pageType === "school") {
      const hasValidFeeItems = feeBreakdown.length > 0 && feeBreakdown.some(item => item.amount > 0);
      if (!hasValidFeeItems) return false;
    }
    
    if (isInvestment) {
      if (!minimumAmount || !tenure.trim()) return false;
      if (termsAndConditions.length < 100) return false;
      if (!riskExplanation.trim()) return false;
    }
    return true;
  };

  // Upload a single image to server
  const uploadSingleImage = async (base64Image: string, type: string): Promise<string | null> => {
    try {
      const response = await fetch(`${baseUrl}/api/payment-page/upload-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: base64Image, type }),
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error("Upload error:", error);
      return null;
    }
  };

  // Upload all images at once when submitting
  const uploadAllImages = async () => {
    const uploadedUrls = {
      coverImage: null as string | null,
      logo: null as string | null,
      productImages: [] as string[],
    };

    // Upload cover image
    if (form.coverImage && form.coverImage.startsWith("data:image")) {
      uploadedUrls.coverImage = await uploadSingleImage(form.coverImage, "covers");
    } else if (form.coverImage) {
      uploadedUrls.coverImage = form.coverImage;
    }

    // Upload logo (only if it's a custom upload, not profile picture)
    if (form.logo && form.logo !== userData?.profilePicture && form.logo.startsWith("data:image")) {
      uploadedUrls.logo = await uploadSingleImage(form.logo, "logos");
    } else if (form.logo && form.logo === userData?.profilePicture) {
      uploadedUrls.logo = form.logo;
    }

    // Upload product images
    for (const img of form.productImages) {
      if (img.startsWith("data:image")) {
        const url = await uploadSingleImage(img, "products");
        if (url) {
          uploadedUrls.productImages.push(url);
        }
      } else {
        uploadedUrls.productImages.push(img);
      }
    }

    return uploadedUrls;
  };

  const handleCreate = async () => {
    if (!canCreate() || !pageType) return;

    setIsCreating(true);
    setError("");

    try {
      // First, upload all images
      const uploadedImages = await uploadAllImages();

      const metadata: any = {
        organizationName: form.organizationName,
        randomSuffix: randomSuffix,
      };

      if (pageType === "school") {
        metadata.students = students;
        metadata.className = schoolClass;
        metadata.requiredFields = requiredFields;
        metadata.feeBreakdown = feeBreakdown;
      } else if (pageType === "donation") {
        metadata.suggestedAmounts = suggestedAmounts;
        metadata.showDonorList = showDonorList;
        metadata.allowDonorMessage = allowDonorMessage;
      } else if (pageType === "physical") {
        metadata.variants = variants;
        metadata.requiresShipping = requiresShipping;
      } else if (pageType === "digital") {
        metadata.downloadUrl = downloadUrl;
        metadata.accessLink = accessLink;
        metadata.emailDelivery = emailDelivery;
      } else if (pageType === "services") {
        metadata.bookingEnabled = bookingEnabled;
        metadata.customerNoteEnabled = customerNoteEnabled;
      } else if (isInvestment) {
        metadata.minimumAmount = Number(minimumAmount);
        metadata.expectedReturn = expectedReturn;
        metadata.tenure = tenure;
        metadata.charges = charges;
        metadata.paymentFrequency = paymentFrequency;
        metadata.termsAndConditions = termsAndConditions;
        metadata.riskExplanation = riskExplanation;
        metadata.cacCertificate = cacCertificate;
        metadata.taxClearance = taxClearance;
        metadata.explainerVideo = explainerVideo;
        metadata.socialLinks = socialLinks;
        metadata.website = website;
        metadata.contactInfo = contactInfo;
      }

      const fullSlug = generateFullSlug();
      
      // For school pages, use the calculated total from fee breakdown
      let finalPrice = form.price;
      if (pageType === "school") {
        finalPrice = calculateFeeBreakdownTotal().toString();
      }

      const pageData = {
        title: form.title,
        slug: fullSlug,
        description: form.description,
        coverImage: uploadedImages.coverImage,
        logo: uploadedImages.logo,
        productImages: uploadedImages.productImages,
        priceType: pageType === "donation" ? "open" : form.priceType,
        price: form.priceType === "open" || pageType === "donation" ? 0 : Number(finalPrice),
        installmentCount: form.priceType === "installment" ? Number(form.installmentCount) : undefined,
        feeMode: form.feeMode,
        pageType: pageType,
        metadata: metadata,
      };

      const result = await createPage(pageData);

      if (!result) {
        throw new Error("No response from server - result is undefined");
      }

      let pageSlug = null;
      if (typeof result === "object") {
        if (result.slug) {
          pageSlug = result.slug;
        } else if (result.page && result.page.slug) {
          pageSlug = result.page.slug;
        } else if (result.data && result.data.slug) {
          pageSlug = result.data.slug;
        }
      }

      if (!pageSlug) {
        throw new Error("Server didn't return a valid slug");
      }

      setCreatedSlug(pageSlug);

      if (result.page) {
        addPage(result.page);
      }

      await Swal.fire({
        title: "Success!",
        text: "Your payment page has been created successfully!",
        icon: "success",
        confirmButtonColor: "#e1bf46",
        confirmButtonText: "Great!",
      });

      setShowSuccess(true);
    } catch (err: any) {
      console.error("Create page error details:", err);

      let errorMessage = "Failed to create page. Please try again.";
      if (err.message) {
        errorMessage = err.message;
      }

      await Swal.fire({
        title: "Error!",
        text: errorMessage,
        icon: "error",
        confirmButtonColor: "#e1bf46",
        confirmButtonText: "OK",
      });

      setError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const pageUrl = `${baseUrl}/pay/${createdSlug}`;
  const copyUrl = () => navigator.clipboard.writeText(pageUrl);
  const previewPage = () => router.push(`/pay/${createdSlug}`);

  if (!pageType) {
    return (
      <div className="min-h-screen dark:bg-[#0e0e0e]">
        <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="lg:pl-72 min-h-screen flex flex-col">
          <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="max-w-2xl mx-auto">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm text-[#6b6b6b] dark:text-[#a6a6a6] hover:text-[#023528] dark:hover:text-[#f5f5f5] transition-colors mb-6"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <PageTypeSelector onSelect={setPageType} />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark:bg-[#0e0e0e]">
      <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-72 min-h-screen flex flex-col">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => setPageType(null)}
              className="flex items-center gap-2 text-sm text-[#6b6b6b] dark:text-[#a6a6a6] hover:text-[#023528] dark:hover:text-[#f5f5f5] transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4" /> Change Type
            </button>

            <div className="pb-32">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                {/* Organization/School Name */}
                <div>
                  <Label className="text-sm font-semibold mb-2 block text-[#141414] dark:text-[#f5f5f5]">
                    {pageType === "school" ? "School Name" : "Organization Name"} *
                  </Label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b6b6b] dark:text-[#a6a6a6]" />
                      <Input
                        placeholder={pageType === "school" ? "e.g. Edward High School" : "e.g. Your Organization Name"}
                        value={form.organizationName}
                        onChange={(e) => handleOrganizationChange(e.target.value)}
                        className="pl-10 h-12 text-base bg-[#ffffff] dark:bg-[#121212] border-[#ded4c3] dark:border-[#474747] text-[#141414] dark:text-[#f5f5f5]"
                      />
                    </div>
                  </div>
                </div>

                {/* Cover Image */}
                <div>
                  <Label className="text-sm font-semibold mb-2 block text-[#141414] dark:text-[#f5f5f5]">Cover Image <span className="text-gray-400">(Optional)</span></Label>
                  <input
                    type="file"
                    ref={coverRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleImageSelect(e, "coverImage")}
                  />
                  {form.coverImage ? (
                    <div className="relative h-48 rounded-2xl overflow-hidden group">
                      <img src={form.coverImage} className="w-full h-full object-cover" alt="Cover" />
                      <button
                        onClick={() => setForm((f) => ({ ...f, coverImage: null }))}
                        className="absolute top-3 right-3 h-8 w-8 rounded-full bg-[#023528]/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4 text-[#f7f0e2]" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => coverRef.current?.click()}
                      className="w-full h-48 rounded-2xl border-2 border-dashed border-[#ded4c3] dark:border-[#474747] bg-[#e9e2d7]/50 dark:bg-[#242424]/50 flex flex-col items-center justify-center gap-2 hover:border-[#e1bf46] hover:bg-[#e1bf46]/5 transition-all"
                    >
                      <Upload className="h-6 w-6 text-[#6b6b6b] dark:text-[#a6a6a6]" />
                      <span className="text-sm text-[#6b6b6b] dark:text-[#a6a6a6]">Upload cover image</span>
                    </button>
                  )}
                </div>

                {/* Logo */}
                <div>
                  <Label className="text-sm font-semibold mb-2 block text-[#141414] dark:text-[#f5f5f5]">Business Logo / Profile Picture</Label>
                  <div className="flex items-center gap-4">
                    {(form.logo || userData?.profilePicture) ? (
                      <div className="relative group">
                        <img
                          src={form.logo || userData?.profilePicture}
                          alt="Business Logo"
                          className={`h-20 w-20 object-cover ${!form.logo && userData?.profilePicture ? "rounded-full" : "rounded-2xl"}`}
                        />
                        {form.logo && form.logo !== userData?.profilePicture && (
                          <button
                            onClick={() => setForm((f) => ({ ...f, logo: null }))}
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                        {!form.logo && userData?.profilePicture && (
                          <div className="absolute -bottom-2 -right-2 h-5 w-5 rounded-full bg-green-500 text-white flex items-center justify-center text-xs">
                            <User className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-20 w-20 rounded-2xl bg-[#e9e2d7] dark:bg-[#242424] border-2 border-dashed border-[#ded4c3] dark:border-[#474747] flex items-center justify-center">
                        <Upload className="h-6 w-6 text-[#6b6b6b] dark:text-[#a6a6a6]" />
                      </div>
                    )}

                    <div className="flex-1">
                      <input
                        type="file"
                        ref={logoRef}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleImageSelect(e, "logo")}
                      />
                      <button
                        onClick={() => logoRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-[#ded4c3] dark:border-[#474747] rounded-xl bg-[#e9e2d7]/50 dark:bg-[#242424]/50 hover:border-[#e1bf46] hover:bg-[#e1bf46]/5 transition-colors"
                      >
                        <Upload className="h-4 w-4" />
                        <span className="text-sm text-[#6b6b6b] dark:text-[#a6a6a6]">
                          {form.logo && form.logo !== userData?.profilePicture ? "Change Logo" : userData?.profilePicture ? "Upload Custom Logo" : "Upload Logo"}
                        </span>
                      </button>
                      <p className="text-xs text-[#6b6b6b] dark:text-[#a6a6a6] mt-2">
                        {userData?.profilePicture && !form.logo
                          ? "Currently using your profile picture. Upload a custom logo to replace it."
                          : "Recommended: 200×200px. PNG, JPG, GIF up to 5MB"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <Label className="text-sm font-semibold mb-2 block text-[#141414] dark:text-[#f5f5f5]">Page Title *</Label>
                  <Input
                    placeholder={
                      isInvestment
                        ? 'e.g. "Property Fund Q2 2025"'
                        : pageType === "school"
                          ? 'e.g. "JSS1 School Fees 2025"'
                          : pageType === "donation"
                            ? 'e.g. "Help Build a Well"'
                            : 'e.g. "Logo Design Service"'
                    }
                    value={form.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="h-12 text-base bg-[#ffffff] dark:bg-[#121212] border-[#ded4c3] dark:border-[#474747] text-[#141414] dark:text-[#f5f5f5]"
                  />
                </div>

                {/* URL Preview */}
                {form.organizationName && form.title && (
                  <div className="bg-[#e9e2d7]/50 dark:bg-[#242424]/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs font-semibold text-[#3e7465] dark:text-[#a6a6a6]">Your Unique Page URL:</Label>
                      <button
                        onClick={regenerateSuffix}
                        className="flex items-center gap-1 text-xs text-[#e1bf46] hover:text-[#d4a91e] transition-colors"
                        title="Generate new random number"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Generate New
                      </button>
                    </div>
                    <div className="flex items-center gap-2 bg-white dark:bg-[#121212] p-3 rounded-lg">
                      <Link2 className="h-4 w-4 text-[#e1bf46] shrink-0" />
                      <code className="text-sm font-mono text-[#023528] dark:text-[#f5f5f5] break-all">
                        {baseUrl}/pay/{generateFullSlug()}
                      </code>
                    </div>
                    <p className="text-xs text-[#3e7465] mt-2">This is your payment link. Share it with customers to receive payments!</p>
                  </div>
                )}

                {/* Description */}
                <div>
                  <Label className="text-sm font-semibold mb-2 block text-[#141414] dark:text-[#f5f5f5]">Description</Label>
                  <Textarea
                    placeholder={isInvestment ? "Describe this investment opportunity in detail..." : "Describe your product or service..."}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={4}
                    className="text-base resize-none bg-[#ffffff] dark:bg-[#121212] border-[#ded4c3] dark:border-[#474747] text-[#141414] dark:text-[#f5f5f5]"
                  />
                </div>

                {/* Product Images */}
                {pageType !== "school" && (
                  <div>
                    <Label className="text-sm font-semibold mb-2 block text-[#141414] dark:text-[#f5f5f5]">
                      {isInvestment ? "Property / Project Images" : "Product Images"}
                    </Label>
                    <input
                      type="file"
                      ref={productRef}
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleImageSelect(e, "productImages")}
                    />
                    <div className="flex gap-3 flex-wrap">
                      {form.productImages.map((img, i) => (
                        <div key={i} className="relative h-24 w-24 rounded-xl overflow-hidden group">
                          <img src={img} className="w-full h-full object-cover" alt={`Product ${i + 1}`} />
                          <button
                            onClick={() => {
                              setForm((f) => ({
                                ...f,
                                productImages: f.productImages.filter((_, idx) => idx !== i),
                              }));
                            }}
                            className="absolute inset-0 bg-[#023528]/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4 text-[#f7f0e2]" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => productRef.current?.click()}
                        className="h-24 w-24 rounded-xl border-2 border-dashed border-[#ded4c3] dark:border-[#474747] bg-[#e9e2d7]/50 dark:bg-[#242424]/50 flex items-center justify-center hover:border-[#e1bf46] transition-colors"
                      >
                        <ImagePlus className="h-5 w-5 text-[#6b6b6b] dark:text-[#a6a6a6]" />
                      </button>
                    </div>
                  </div>
                )}

                {/* TYPE-SPECIFIC FIELDS */}
                <div className="p-5 rounded-2xl border border-[#ded4c3] dark:border-[#474747] bg-[#f9f6ef] dark:bg-[#121212]">
                  <h3 className="font-bold text-sm mb-4 text-[#e1bf46]">{typeLabels[pageType]} Settings</h3>
                  {pageType === "school" && (
                    <SchoolFields
                      students={students}
                      setStudents={setStudents}
                      className={schoolClass}
                      setClassName={setSchoolClass}
                      feeBreakdown={feeBreakdown}
                      setFeeBreakdown={setFeeBreakdown}
                      requiredFields={requiredFields}
                      setRequiredFields={setRequiredFields}
                    />
                  )}
                  {pageType === "donation" && (
                    <DonationFields
                      suggestedAmounts={suggestedAmounts}
                      setSuggestedAmounts={setSuggestedAmounts}
                      showDonorList={showDonorList}
                      setShowDonorList={setShowDonorList}
                      allowDonorMessage={allowDonorMessage}
                      setAllowDonorMessage={setAllowDonorMessage}
                    />
                  )}
                  {pageType === "physical" && (
                    <PhysicalFields
                      variants={variants}
                      setVariants={setVariants}
                      requiresShipping={requiresShipping}
                      setRequiresShipping={setRequiresShipping}
                    />
                  )}
                  {pageType === "digital" && (
                    <DigitalFields
                      downloadUrl={downloadUrl}
                      setDownloadUrl={setDownloadUrl}
                      accessLink={accessLink}
                      setAccessLink={setAccessLink}
                      emailDelivery={emailDelivery}
                      setEmailDelivery={setEmailDelivery}
                    />
                  )}
                  {pageType === "services" && (
                    <ServicesFields
                      bookingEnabled={bookingEnabled}
                      setBookingEnabled={setBookingEnabled}
                      customerNoteEnabled={customerNoteEnabled}
                      setCustomerNoteEnabled={setCustomerNoteEnabled}
                    />
                  )}
                  {isInvestment && (
                    <InvestmentFields
                      minimumAmount={minimumAmount}
                      setMinimumAmount={setMinimumAmount}
                      expectedReturn={expectedReturn}
                      setExpectedReturn={setExpectedReturn}
                      tenure={tenure}
                      setTenure={setTenure}
                      charges={charges}
                      setCharges={setCharges}
                      paymentFrequency={paymentFrequency}
                      setPaymentFrequency={setPaymentFrequency}
                      termsAndConditions={termsAndConditions}
                      setTermsAndConditions={setTermsAndConditions}
                      riskExplanation={riskExplanation}
                      setRiskExplanation={setRiskExplanation}
                    />
                  )}
                </div>

                {/* Trust Signals (investment only) */}
                {isInvestment && (
                  <div className="p-5 rounded-2xl border border-[#ded4c3] dark:border-[#474747] bg-[#f9f6ef] dark:bg-[#121212]">
                    <TrustSignals
                      cacCertificate={cacCertificate}
                      setCacCertificate={setCacCertificate}
                      taxClearance={taxClearance}
                      setTaxClearance={setTaxClearance}
                      explainerVideo={explainerVideo}
                      setExplainerVideo={setExplainerVideo}
                      socialLinks={socialLinks}
                      setSocialLinks={setSocialLinks}
                      website={website}
                      setWebsite={setWebsite}
                      contactInfo={contactInfo}
                      setContactInfo={setContactInfo}
                    />
                  </div>
                )}

                {/* Pricing (not for donation) */}
                {pageType !== "donation" && (
                  <>
                    <div>
                      <Label className="text-sm font-semibold mb-3 block text-[#141414] dark:text-[#f5f5f5]">Pricing</Label>
                      <div className="grid grid-cols-3 gap-3">
                        {(["fixed", "installment", "open"] as const).map((val) => (
                          <button
                            key={val}
                            onClick={() => setForm((f) => ({ ...f, priceType: val }))}
                            className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${form.priceType === val ? "border-[#e1bf46] bg-[#e1bf46]/10 text-[#023528] dark:text-[#f5f5f5]" : "border-[#ded4c3] dark:border-[#474747] bg-[#f9f6ef] dark:bg-[#121212] text-[#6b6b6b] dark:text-[#a6a6a6] hover:border-[#e1bf46]/50"}`}
                          >
                            {val === "fixed" ? "Fixed Price" : val === "installment" ? "Installment" : "Open (Donate)"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {form.priceType !== "open" && (
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <Label className="text-sm font-semibold mb-2 block text-[#141414] dark:text-[#f5f5f5]">Amount (₦)</Label>
                          <Input
                            type="number"
                            placeholder={pageType === "school" ? "Auto-calculated from fee breakdown" : "0.00"}
                            value={form.price}
                            onChange={(e) => {
                              if (pageType !== "school") {
                                setForm((f) => ({ ...f, price: e.target.value }));
                              }
                            }}
                            className="h-12 text-base bg-[#ffffff] dark:bg-[#121212] border-[#ded4c3] dark:border-[#474747] text-[#141414] dark:text-[#f5f5f5]"
                            disabled={pageType === "school"}
                          />
                          {pageType === "school" && (
                            <p className="text-xs text-[#3e7465] mt-1">
                              Total automatically calculated from fee breakdown above: ₦{calculateFeeBreakdownTotal().toLocaleString()}
                            </p>
                          )}
                        </div>
                        {form.priceType === "installment" && (
                          <div className="w-32">
                            <Label className="text-sm font-semibold mb-2 block text-[#141414] dark:text-[#f5f5f5]">Installments</Label>
                            <Input
                              type="number"
                              value={form.installmentCount}
                              onChange={(e) => setForm((f) => ({ ...f, installmentCount: e.target.value }))}
                              className="h-12 text-base bg-[#ffffff] dark:bg-[#121212] border-[#ded4c3] dark:border-[#474747] text-[#141414] dark:text-[#f5f5f5]"
                              min={2}
                              max={12}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Fee Mode - Fully Functional */}
                <div className="space-y-4">
                  <Label className="text-sm font-semibold mb-3 block text-[#141414] dark:text-[#f5f5f5]">
                    Transaction Fee (2%, capped at ₦2,000)
                  </Label>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {(["bearer", "customer"] as const).map((val) => (
                      <button
                        key={val}
                        onClick={() => setForm((f) => ({ ...f, feeMode: val }))}
                        className={`p-4 rounded-xl border-2 text-sm font-medium transition-all ${
                          form.feeMode === val
                            ? "border-[#e1bf46] bg-[#e1bf46]/10 text-[#023528] dark:text-[#f5f5f5]"
                            : "border-[#ded4c3] dark:border-[#474747] bg-[#f9f6ef] dark:bg-[#121212] text-[#6b6b6b] dark:text-[#a6a6a6] hover:border-[#e1bf46]/50"
                        }`}
                      >
                        <div className="font-semibold mb-1">
                          {val === "bearer" ? "I'll bear the fee" : "Customer pays"}
                        </div>
                        <div className="text-xs opacity-75">
                          {val === "bearer" 
                            ? `You pay ${feeCalculation.fee.toLocaleString()} fee • You receive ₦${feeCalculation.creatorReceives.toLocaleString()}`
                            : `Customer pays ₦${feeCalculation.totalWithFee.toLocaleString()} total`
                          }
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Fee Calculation Breakdown */}
                  {Number(form.price) > 0 && (
                    <div className="mt-4 p-4 rounded-xl bg-[#e9e2d7]/50 dark:bg-[#242424]/50">
                      <h4 className="text-sm font-semibold mb-3 text-[#141414] dark:text-[#f5f5f5]">Fee Breakdown</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-[#3e7465]">Subtotal:</span>
                          <span className="font-medium">₦{feeCalculation.subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#3e7465]">Fee ({feeCalculation.feePercentage}%):</span>
                          <span className="font-medium">₦{feeCalculation.fee.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#3e7465]">Fee Cap:</span>
                          <span className="font-medium">₦{feeCalculation.feeCap.toLocaleString()}</span>
                        </div>
                        <div className="border-t border-[#ded4c3] pt-2 mt-2">
                          <div className="flex justify-between font-semibold">
                            <span className="text-[#141414] dark:text-[#f5f5f5]">
                              {form.feeMode === "bearer" ? "You receive:" : "Customer pays total:"}
                            </span>
                            <span className="text-[#e1bf46]">
                              ₦{form.feeMode === "bearer" ? feeCalculation.creatorReceives.toLocaleString() : feeCalculation.totalWithFee.toLocaleString()}
                            </span>
                          </div>
                          {form.feeMode === "bearer" && (
                            <p className="text-xs text-[#3e7465] mt-2">
                              Note: The ₦{feeCalculation.fee.toLocaleString()} fee will be deducted from your payout
                            </p>
                          )}
                          {form.feeMode === "customer" && (
                            <p className="text-xs text-[#3e7465] mt-2">
                              Customer pays an additional ₦{feeCalculation.fee.toLocaleString()} to cover the transaction fee
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </main>

        {/* Sticky CTA */}
        <div className="fixed bottom-0 left-0 right-0 lg:left-72 bg-[#f7f0e2]/90 dark:bg-[#0e0e0e]/90 backdrop-blur-lg border-t border-[#ded4c3] dark:border-[#474747] p-4 z-40">
          <div className="max-w-2xl mx-auto">
            <Button
              variant="default"
              size="lg"
              className="w-full py-6 text-base"
              onClick={handleCreate}
              disabled={!canCreate() || isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Creating Page...
                </>
              ) : (
                `Create ${typeLabels[pageType]} Page`
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#023528]/50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-[#f9f6ef] dark:bg-[#121212] rounded-3xl p-8 max-w-md w-full text-center shadow-2xl"
            >
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold mb-2">Payment Page Created!</h2>
              <p className="text-gray-600 mb-6">Your page is now live and ready to collect payments.</p>

              {/* Payment Link */}
              <div className="bg-[#e9e2d7] dark:bg-[#242424] rounded-xl p-4 mb-6">
                <Label className="text-xs font-semibold text-[#3e7465] mb-1 block">Your Payment Link:</Label>
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-[#e1bf46] shrink-0" />
                  <code className="text-sm font-mono text-[#023528] dark:text-[#f5f5f5] break-all flex-1">{pageUrl}</code>
                  <Button variant="secondary" size="sm" onClick={copyUrl} className="shrink-0">Copy</Button>
                </div>
                <p className="text-xs text-[#3e7465] mt-2">Share this link with your customers to start receiving payments!</p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={previewPage}>Preview Page</Button>
                <Button variant="default" className="flex-1" onClick={() => router.push("/payment/dashboard")}>Go to Dashboard</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreatePage;