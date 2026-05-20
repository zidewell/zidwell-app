// app/dashboard/services/payment/create/page.tsx
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
  RefreshCw,
  User,
  Loader2,
  Calendar,
  Info,
  Move,
  ZoomIn,
  ZoomOut,
  Image as ImageIcon,
  CheckCircle,
  Copy,
  AlertCircle,
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
import confetti from "canvas-confetti";
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

// Image size specifications for different page types
const IMAGE_SPECS: Record<
  PageType,
  { width: number; height: number; ratio: string; description: string }
> = {
  school: {
    width: 1200,
    height: 600,
    ratio: "2:1",
    description: "1200 x 600px (2:1 ratio) - Best for school banners",
  },
  donation: {
    width: 1200,
    height: 628,
    ratio: "1.91:1",
    description: "1200 x 628px (Facebook style) - Great for sharing",
  },
  physical: {
    width: 1200,
    height: 1200,
    ratio: "1:1",
    description: "1200 x 1200px (Square) - Perfect for product display",
  },
  digital: {
    width: 1200,
    height: 800,
    ratio: "3:2",
    description: "1200 x 800px (3:2 ratio) - Ideal for course thumbnails",
  },
  services: {
    width: 1200,
    height: 675,
    ratio: "16:9",
    description: "1200 x 675px (16:9 ratio) - Great for service banners",
  },
  real_estate: {
    width: 1600,
    height: 900,
    ratio: "16:9",
    description: "1600 x 900px (Wide) - Showcase properties beautifully",
  },
  stock: {
    width: 1200,
    height: 630,
    ratio: "1.91:1",
    description: "1200 x 630px - Standard investment banner",
  },
  savings: {
    width: 1200,
    height: 630,
    ratio: "1.91:1",
    description: "1200 x 630px - Perfect for savings campaigns",
  },
  crypto: {
    width: 1200,
    height: 630,
    ratio: "1.91:1",
    description: "1200 x 630px - Modern crypto banner",
  },
};

// Placeholder text based on page type
const getPlaceholderText = (
  pageType: PageType | null,
  field: "title" | "description",
): string => {
  if (!pageType)
    return field === "title"
      ? "Enter page title"
      : "Describe your product or service...";

  const placeholders: Record<PageType, { title: string; description: string }> =
    {
      school: {
        title: "Harmony International School - Term Fees 2025",
        description:
          "Quality education for every child. Pay your child's school fees securely online. Includes tuition, sports, and library fees.",
      },
      donation: {
        title: "Help Build a School in Africa",
        description:
          "Your donation helps provide quality education to underprivileged children. Every naira counts! Join us in making a difference.",
      },
      physical: {
        title: "Premium Leather Backpack",
        description:
          "Handcrafted genuine leather backpack with multiple compartments. Perfect for work, travel, or everyday use. Limited stock available.",
      },
      digital: {
        title: "Pastry Baking Course",
        description:
          "Master the art of pastry baking with our comprehensive online course. Get instant access to video tutorials, recipes, and certification upon completion.",
      },
      services: {
        title: "Professional Web Design Service",
        description:
          "Custom website design tailored to your business needs. Includes responsive design, SEO optimization, and 1 year of support.",
      },
      real_estate: {
        title: "Luxury 4-Bedroom Villa",
        description:
          "Modern luxury villa with swimming pool, smart home features, and stunning ocean views. Located in prime neighborhood. Schedule a viewing today.",
      },
      stock: {
        title: "Tech Growth Investment Fund",
        description:
          "Invest in Africa's fastest-growing tech startups. Minimum investment ₦50,000. Projected returns of 15-20% annually. Start building wealth today.",
      },
      savings: {
        title: "High-Yield Savings Plan",
        description:
          "Save towards your financial goals with competitive interest rates. Flexible withdrawal options. Start saving for your future today.",
      },
      crypto: {
        title: "Bitcoin Investment Package",
        description:
          "Start your crypto journey with our secure investment packages. Expert managed funds with proven returns. Join the crypto revolution.",
      },
    };

  return (
    placeholders[pageType]?.[field] ||
    (field === "title"
      ? `Enter ${typeLabels[pageType]} title`
      : `Describe your ${typeLabels[pageType].toLowerCase()}...`)
  );
};

// Function to validate title for virtual account naming (matches backend logic)
const validateTitleForVirtualAccount = (title: string, className?: string): { isValid: boolean; message: string; cleanedName: string } => {
  let fullName = title;
  if (className && className.trim()) {
    fullName = `${className} ${title}`;
  }
  
  let cleaned = fullName.toUpperCase();
  cleaned = cleaned.replace(/[^A-Z0-9\s]/g, '');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  const length = cleaned.length;
  
  if (length < 8) {
    return {
      isValid: false,
      message: `Account name will be "${cleaned}" (${length} chars). Minimum 8 characters required. Please make your title longer.`,
      cleanedName: cleaned
    };
  }
  
  if (length > 64) {
    return {
      isValid: false,
      message: `Account name will be "${cleaned.substring(0, 50)}..." (${length} chars). Maximum 64 characters allowed. Please shorten your title.`,
      cleanedName: cleaned.substring(0, 64)
    };
  }
  
  return {
    isValid: true,
    message: `✓ Account name will be "${cleaned}" (${length} chars)`,
    cleanedName: cleaned
  };
};

// Trigger confetti animation
const triggerConfetti = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: [
      "var(--color-accent-yellow)",
      "var(--color-ink)",
      "var(--bg-secondary)",
      "var(--color-accent-yellow)",
    ],
  });

  setTimeout(() => {
    confetti({
      particleCount: 50,
      spread: 100,
      origin: { y: 0.6, x: 0.3 },
      startVelocity: 25,
    });
    confetti({
      particleCount: 50,
      spread: 100,
      origin: { y: 0.6, x: 0.7 },
      startVelocity: 25,
    });
  }, 150);
};

const copyToClipboard = async (text: string, setCopied: (value: boolean) => void) => {
  try {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  } catch (err) {
    console.error("Failed to copy:", err);
  }
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
  const [copied, setCopied] = useState(false);
  const [dynamicId, setDynamicId] = useState(() =>
    Math.floor(100 + Math.random() * 900).toString(),
  );
  
  const [titleValidation, setTitleValidation] = useState<{ isValid: boolean; message: string }>({ isValid: true, message: "" });

  // Image state - store base64 images, will be uploaded on submit
  const [coverImageBase64, setCoverImageBase64] = useState<string | null>(null);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [productImagesBase64, setProductImagesBase64] = useState<string[]>([]);
  
  // Preview states
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [productPreviews, setProductPreviews] = useState<string[]>([]);

  // Image drag adjustment states for cover image preview
  const [imagePosition, setImagePosition] = useState({ x: 50, y: 50 });
  const [imageScale, setImageScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showImageControls, setShowImageControls] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    priceType: "fixed" as "fixed" | "installment",
    price: "",
    installmentCount: "3",
    feeMode: "bearer" as "bearer" | "customer",
  });

  const [installmentAmount, setInstallmentAmount] = useState(0);
  const [installmentPeriod, setInstallmentPeriod] = useState("monthly");

  // School fields
  const [students, setStudents] = useState<Student[]>([]);
  const [schoolClass, setSchoolClass] = useState("");
  const [feeBreakdown, setFeeBreakdown] = useState<FeeItem[]>([]);
  const [requiredFields, setRequiredFields] = useState<string[]>([]);

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

  // Trust signals
  const [cacCertificate, setCacCertificate] = useState("");
  const [taxClearance, setTaxClearance] = useState("");
  const [explainerVideo, setExplainerVideo] = useState("");
  const [socialLinks, setSocialLinks] = useState<{ platform: string; url: string }[]>([]);
  const [website, setWebsite] = useState("");
  const [contactInfo, setContactInfo] = useState("");

  const coverRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const productRef = useRef<HTMLInputElement>(null);

  const [feeCalculation, setFeeCalculation] = useState({
    subtotal: 0,
    fee: 0,
    totalWithFee: 0,
    creatorReceives: 0,
    feePercentage: 2,
    feeCap: 2000,
  });

  // Validate title
  useEffect(() => {
    if (form.title) {
      const validation = validateTitleForVirtualAccount(form.title, pageType === "school" ? schoolClass : undefined);
      setTitleValidation(validation);
    } else {
      setTitleValidation({ isValid: true, message: "" });
    }
  }, [form.title, schoolClass, pageType]);

  // Set default logo from profile picture
  useEffect(() => {
    if (userData?.profilePicture && !logoPreview) {
      setLogoPreview(userData.profilePicture);
    }
  }, [userData?.profilePicture]);

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (!file.type.startsWith("image/")) {
        alert("Please drop an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        setCoverImageBase64(result);
        setCoverPreview(result);
        resetImagePosition();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!coverPreview) return;
    e.preventDefault();
    setIsDragging(true);

    const container = imageContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 100;
    const mouseY = ((e.clientY - rect.top) / rect.height) * 100;

    setDragStart({
      x: mouseX - imagePosition.x,
      y: mouseY - imagePosition.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();

    const container = imageContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 100;
    const mouseY = ((e.clientY - rect.top) / rect.height) * 100;

    let newX = mouseX - dragStart.x;
    let newY = mouseY - dragStart.y;

    const maxX = 100 - 100 / imageScale;
    const maxY = 100 - 100 / imageScale;
    const minX = 0;
    const minY = 0;

    newX = Math.min(Math.max(newX, minX), maxX);
    newY = Math.min(Math.max(newY, minY), maxY);

    setImagePosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!coverPreview) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setImageScale((prev) => Math.min(Math.max(prev + delta, 0.5), 2));
  };

  const handleZoomIn = () => setImageScale((prev) => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setImageScale((prev) => Math.max(prev - 0.1, 0.5));
  const resetImagePosition = () => {
    setImagePosition({ x: 50, y: 50 });
    setImageScale(1);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) setIsDragging(false);
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [isDragging]);

  const calculateFeeBreakdownTotal = () => {
    return feeBreakdown.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  const calculateInstallmentAmount = () => {
    const total = Number(form.price) || 0;
    const count = Number(form.installmentCount) || 1;
    if (total > 0 && count > 0) {
      setInstallmentAmount(Math.round((total / count) * 100) / 100);
    } else {
      setInstallmentAmount(0);
    }
  };

  const getFeePerInstallment = () => {
    const perInstallment = installmentAmount;
    const fee = Math.min(perInstallment * 0.02, 2000);
    return fee;
  };

  useEffect(() => {
    calculateInstallmentAmount();
  }, [form.price, form.installmentCount]);

  useEffect(() => {
    const amount = Number(form.price) || 0;
    const fee = Math.min(amount * 0.02, 2000);
    const creatorReceives = amount - fee;
    setFeeCalculation({
      subtotal: amount,
      fee,
      totalWithFee: amount,
      creatorReceives,
      feePercentage: 2,
      feeCap: 2000,
    });
  }, [form.price]);

  useEffect(() => {
    if (pageType === "school") {
      const total = calculateFeeBreakdownTotal();
      if (total > 0) setForm((f) => ({ ...f, price: total.toString() }));
    }
  }, [feeBreakdown, pageType]);

  const handleImageSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "cover" | "logo" | "product"
  ) => {
    const files = e.target.files;
    if (!files) return;

    if (type === "cover") {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        setCoverImageBase64(result);
        setCoverPreview(result);
        resetImagePosition();
      };
      reader.readAsDataURL(files[0]);
    } else if (type === "logo") {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        setLogoBase64(result);
        setLogoPreview(result);
      };
      reader.readAsDataURL(files[0]);
    } else if (type === "product") {
      const newImages = [...productImagesBase64];
      const newPreviews = [...productPreviews];
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const result = ev.target?.result as string;
          newImages.push(result);
          newPreviews.push(result);
          setProductImagesBase64(newImages);
          setProductPreviews(newPreviews);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeProductImage = (index: number) => {
    setProductImagesBase64(productImagesBase64.filter((_, i) => i !== index));
    setProductPreviews(productPreviews.filter((_, i) => i !== index));
  };

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const generateSlug = () => {
    const titleSlug = slugify(form.title);
    let prefix = "";
    if (pageType === "school" && schoolClass) {
      prefix = slugify(schoolClass) + "-";
    }
    return `${prefix}${titleSlug}-${dynamicId}`;
  };

  const regenerateId = () => {
    setDynamicId(Math.floor(100 + Math.random() * 900).toString());
  };

  const isInvestment = pageType ? isInvestmentType(pageType) : false;

  const canCreate = () => {
    if (!form.title.trim() || !pageType) return false;
    if (!titleValidation.isValid) return false;
    if (pageType === "school") {
      const hasValidFeeItems = feeBreakdown.length > 0 && feeBreakdown.some((item) => item.amount > 0);
      if (!hasValidFeeItems) return false;
    }
    if (form.priceType === "installment") {
      const count = Number(form.installmentCount);
      if (count < 2 || count > 12) return false;
      if (Number(form.price) <= 0) return false;
    }
    if (isInvestment) {
      if (!minimumAmount || !tenure.trim()) return false;
      if (termsAndConditions.length < 100) return false;
      if (!riskExplanation.trim()) return false;
    }
    return true;
  };

  const handleCreate = async () => {
    if (!canCreate() || !pageType) return;
    setIsCreating(true);

    try {
      // Upload images only when creating - using relative URLs
      const uploadPromises: Record<string, Promise<string | null>> = {};

      // Upload cover image if exists
      if (coverImageBase64) {
        uploadPromises.cover = fetch(`/api/payment-page/upload-image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: coverImageBase64, type: "covers" }),
        }).then(res => res.json()).then(data => data.url);
      }

      // Upload logo if uploaded by user (not profile picture)
      if (logoBase64) {
        uploadPromises.logo = fetch(`/api/payment-page/upload-image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: logoBase64, type: "logos" }),
        }).then(res => res.json()).then(data => data.url);
      } else if (userData?.profilePicture) {
        uploadPromises.logo = Promise.resolve(userData.profilePicture);
      }

      // Upload product images
      const productUploadPromises = productImagesBase64.map(img =>
        fetch(`/api/payment-page/upload-image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: img, type: "products" }),
        }).then(res => res.json()).then(data => data.url)
      );

      const [uploadedCover, uploadedLogo, ...uploadedProducts] = await Promise.all([
        uploadPromises.cover || Promise.resolve(null),
        uploadPromises.logo || Promise.resolve(null),
        ...productUploadPromises,
      ]);

      // Determine final cover image (fallback to logo if no cover)
      let finalCoverImage = uploadedCover;
      const pageTypesWithProductImages = ["physical", "digital", "services", "real_estate", "stock", "savings", "crypto"];
      
      if (!finalCoverImage && uploadedProducts.length > 0 && pageTypesWithProductImages.includes(pageType)) {
        finalCoverImage = uploadedProducts[0];
      }
      
      if (!finalCoverImage && uploadedLogo) {
        finalCoverImage = uploadedLogo;
      }

      const metadata: any = {};

      if (form.priceType === "installment") {
        metadata.installmentCount = Number(form.installmentCount);
        metadata.installmentAmount = installmentAmount;
        metadata.installmentPeriod = installmentPeriod;
        metadata.totalAmount = Number(form.price);
      }

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

      const finalSlug = generateSlug();
      let finalPrice = form.price;
      if (pageType === "school") finalPrice = calculateFeeBreakdownTotal().toString();

      const pageData = {
        title: form.title,
        slug: finalSlug,
        description: form.description,
        coverImage: finalCoverImage,
        logo: uploadedLogo,
        productImages: uploadedProducts.filter(url => url !== null),
        priceType: pageType === "donation" ? "open" : form.priceType,
        price: pageType === "donation" ? 0 : Number(finalPrice),
        installmentCount: form.priceType === "installment" ? Number(form.installmentCount) : undefined,
        feeMode: "bearer",
        pageType: pageType,
        metadata: metadata,
      };

      const result = await createPage(pageData);
      if (!result) throw new Error("No response from server");

      let pageSlug = null;
      if (typeof result === "object") {
        pageSlug = result.slug || result.page?.slug || result.data?.slug;
      }

      if (!pageSlug) throw new Error("Server didn't return a valid slug");

      setCreatedSlug(pageSlug);
      if (result.page) addPage(result.page);

      triggerConfetti();
      setShowSuccess(true);
    } catch (err: any) {
      console.error("Create page error:", err);
      alert(err.message || "Failed to create page. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const pageUrl = `${window.location.origin}/pay/${createdSlug}`;
  const copyPageUrl = () => copyToClipboard(pageUrl, setCopied);
  const previewPage = () => router.push(`/pay/${createdSlug}`);

  const currentImageSpecs = pageType ? IMAGE_SPECS[pageType] : IMAGE_SPECS.digital;

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
                className="flex items-center gap-2 text-sm text-(--text-secondary) hover:text-(--color-accent-yellow) mb-6"
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
          <div className="max-w-3xl mx-auto">
            <button
              onClick={() => setPageType(null)}
              className="flex items-center gap-2 text-sm text-(--text-secondary) hover:text-(--color-accent-yellow) mb-6"
            >
              <ArrowLeft className="h-4 w-4" /> Change Type
            </button>

            <div className="pb-32">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                
                {/* Cover Image */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label className="text-sm font-semibold text-(--text-primary)">
                      Cover Image <span className="text-(--text-secondary)">(Optional)</span>
                    </Label>
                    <div className="text-xs text-(--text-secondary)">Recommended: {currentImageSpecs.description}</div>
                  </div>

                  <input type="file" ref={coverRef} className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, "cover")} />

                  {coverPreview ? (
                    <div
                      ref={imageContainerRef}
                      className="relative overflow-hidden rounded-2xl cursor-move group"
                      style={{ height: "280px", backgroundColor: "#0a0a0a" }}
                      onMouseEnter={() => setShowImageControls(true)}
                      onMouseLeave={() => { setShowImageControls(false); setIsDragging(false); }}
                      onWheel={handleWheel}
                    >
                      <img
                        ref={imageRef}
                        src={coverPreview}
                        alt="Cover preview"
                        className="w-full h-full object-cover select-none"
                        style={{
                          objectPosition: `${imagePosition.x}% ${imagePosition.y}%`,
                          transform: `scale(${imageScale})`,
                          transition: isDragging ? "none" : "transform 0.2s ease, object-position 0.2s ease",
                        }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        draggable={false}
                      />
                      {showImageControls && (
                        <>
                          <div className="absolute bottom-4 right-4 flex gap-2 bg-black/70 rounded-lg p-2 backdrop-blur-sm z-10">
                            <button onClick={handleZoomOut} className="p-1.5 hover:bg-white/20 rounded" title="Zoom Out"><ZoomOut className="h-4 w-4" /></button>
                            <button onClick={resetImagePosition} className="p-1.5 hover:bg-white/20 rounded" title="Reset"><Move className="h-4 w-4" /></button>
                            <button onClick={handleZoomIn} className="p-1.5 hover:bg-white/20 rounded" title="Zoom In"><ZoomIn className="h-4 w-4" /></button>
                            <button onClick={() => { setCoverImageBase64(null); setCoverPreview(null); resetImagePosition(); }} className="p-1.5 hover:bg-white/20 rounded" title="Remove"><X className="h-4 w-4" /></button>
                          </div>
                          <div className="absolute bottom-4 left-4 bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">{currentImageSpecs.description}</div>
                          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm whitespace-nowrap">Drag to reposition • Scroll to zoom</div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div
                      onClick={() => coverRef.current?.click()}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      className={`w-full h-56 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 cursor-pointer group ${
                        isDragOver ? "border-(--color-accent-yellow) bg-(--color-accent-yellow)/20" : "border-(--border-color) bg-(--bg-secondary)/50 hover:border-(--color-accent-yellow)"
                      }`}
                    >
                      <Upload className={`h-8 w-8 transition-colors ${isDragOver ? "text-(--color-accent-yellow)" : "text-(--text-secondary) group-hover:text-(--color-accent-yellow)"}`} />
                      <span className={`text-sm transition-colors ${isDragOver ? "text-(--color-accent-yellow)" : "text-(--text-secondary) group-hover:text-(--color-accent-yellow)"}`}>
                        {isDragOver ? "Drop image here" : "Click or drag & drop to upload"}
                      </span>
                      <span className="text-xs text-(--text-secondary)">{currentImageSpecs.description}</span>
                      <span className="text-xs text-(--text-secondary)">If no cover image, your logo will be used as fallback</span>
                    </div>
                  )}
                </div>

                {/* Logo */}
                <div>
                  <Label className="text-sm font-semibold mb-2 block text-(--text-primary)">Logo / Profile Picture</Label>
                  <div className="flex items-center gap-4">
                    {logoPreview ? (
                      <div className="relative group">
                        <img src={logoPreview} alt="Logo" className={`h-20 w-20 object-cover ${!logoBase64 && userData?.profilePicture ? "rounded-full" : "rounded-2xl"}`} />
                        {logoBase64 && (
                          <button onClick={() => { setLogoBase64(null); setLogoPreview(null); }} className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                            <X className="h-3 w-3 text-white" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="h-20 w-20 rounded-2xl bg-(--bg-secondary) border-2 border-dashed border-(--border-color) flex items-center justify-center">
                        <Upload className="h-6 w-6 text-(--text-secondary)" />
                      </div>
                    )}
                    <div className="flex-1">
                      <input type="file" ref={logoRef} className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, "logo")} />
                      <button onClick={() => logoRef.current?.click()} className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-(--border-color) rounded-xl bg-(--bg-secondary)/50 hover:border-(--color-accent-yellow) transition-colors">
                        <Upload className="h-4 w-4" />
                        <span className="text-sm">Upload Logo</span>
                      </button>
                      <p className="text-xs text-(--text-secondary) mt-1">Square image recommended (e.g., 200x200px)</p>
                    </div>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <Label className="text-sm font-semibold mb-2 block text-(--text-primary)">Page Title *</Label>
                  <Input
                    placeholder={getPlaceholderText(pageType, "title")}
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    className={`h-12 text-base border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:ring-(--color-accent-yellow) focus:border-(--color-accent-yellow) ${!titleValidation.isValid && form.title ? "border-red-500" : ""}`}
                  />
                  {form.title && (
                    <div className={`mt-2 text-xs flex items-start gap-2 p-2 rounded-lg ${titleValidation.isValid ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                      {titleValidation.isValid ? <CheckCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" /> : <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />}
                      <span className="flex-1">{titleValidation.message}</span>
                    </div>
                  )}
                  <p className="text-xs text-(--text-secondary) mt-1">Example: {getPlaceholderText(pageType, "title")}</p>
                  <p className="text-xs text-(--text-secondary) mt-1">This title will be used as your virtual account name.</p>
                </div>

                {/* URL Preview */}
                {form.title && (
                  <div className="bg-(--bg-secondary)/50 rounded-lg p-4 border border-(--border-color)">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs font-semibold text-(--color-accent-yellow)">Your Page URL:</Label>
                      <button onClick={regenerateId} className="flex items-center gap-1 text-xs text-(--color-accent-yellow) hover:text-(--color-accent-yellow)/80">
                        <RefreshCw className="h-3 w-3" /> New ID
                      </button>
                    </div>
                    <div className="flex items-center gap-2 bg-(--bg-primary) p-3 rounded-lg border border-(--border-color)">
                      <Link2 className="h-4 w-4 text-(--color-accent-yellow) shrink-0" />
                      <code className="text-sm font-mono text-(--text-primary) break-all">{window.location.origin}/pay/{generateSlug()}</code>
                    </div>
                    {pageType === "school" && schoolClass && <p className="text-xs text-(--color-accent-yellow) mt-2">URL includes class name: {slugify(schoolClass)}</p>}
                  </div>
                )}

                {/* Description */}
                <div>
                  <Label className="text-sm font-semibold mb-2 block text-(--text-primary)">Description</Label>
                  <Textarea
                    placeholder={getPlaceholderText(pageType, "description")}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={4}
                    className="text-base resize-none border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:ring-(--color-accent-yellow) focus:border-(--color-accent-yellow)"
                  />
                  <p className="text-xs text-(--text-secondary) mt-1">Example: {getPlaceholderText(pageType, "description").substring(0, 100)}...</p>
                </div>

                {/* Product Images */}
                {pageType !== "school" && pageType !== "donation" && (
                  <div>
                    <Label className="text-sm font-semibold mb-2 block text-(--text-primary)">Product Images</Label>
                    <input type="file" ref={productRef} className="hidden" accept="image/*" multiple onChange={(e) => handleImageSelect(e, "product")} />
                    <div className="flex gap-3 flex-wrap">
                      {productPreviews.map((img, i) => (
                        <div key={i} className="relative h-24 w-24 rounded-xl overflow-hidden group">
                          <img src={img} className="w-full h-full object-cover" alt="" />
                          <button onClick={() => removeProductImage(i)} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100"><X className="h-4 w-4 text-white" /></button>
                        </div>
                      ))}
                      <button onClick={() => productRef.current?.click()} className="h-24 w-24 rounded-xl border-2 border-dashed border-(--border-color) bg-(--bg-secondary)/50 flex items-center justify-center hover:border-(--color-accent-yellow)">
                        <ImagePlus className="h-5 w-5 text-(--text-secondary)" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Type-Specific Fields */}
                <div className="p-5 rounded-2xl border border-(--border-color) bg-(--bg-secondary)">
                  <h3 className="font-bold text-sm mb-4 text-(--color-accent-yellow)">{typeLabels[pageType]} Settings</h3>
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

                {/* Trust Signals */}
                {isInvestment && (
                  <div className="p-5 rounded-2xl border border-(--border-color) bg-(--bg-secondary)">
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

                {/* Pricing */}
                {pageType !== "donation" && (
                  <>
                    <div>
                      <Label className="text-sm font-semibold mb-3 block text-(--text-primary)">Pricing</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {(["fixed", "installment"] as const).map((val) => (
                          <button
                            key={val}
                            onClick={() => setForm((f) => ({ ...f, priceType: val }))}
                            className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                              form.priceType === val ? "border-(--color-accent-yellow) bg-(--color-accent-yellow)/10 text-(--color-accent-yellow)" : "border-(--border-color) bg-(--bg-secondary) text-(--text-secondary) hover:border-(--color-accent-yellow)/50"
                            }`}
                          >
                            {val === "fixed" ? "Fixed Price" : "Installment"}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-1">
                        <Label className="text-sm font-semibold mb-2 block text-(--text-primary)">
                          {form.priceType === "installment" ? "Total Amount (₦)" : "Amount (₦)"}
                        </Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={form.price}
                          onChange={(e) => pageType !== "school" && setForm((f) => ({ ...f, price: e.target.value }))}
                          className="h-12 text-base border-(--border-color) bg-(--bg-primary) text-(--text-primary)"
                          disabled={pageType === "school"}
                        />
                      </div>
                      {form.priceType === "installment" && (
                        <>
                          <div className="w-32">
                            <Label className="text-sm font-semibold mb-2 block text-(--text-primary)">Installments</Label>
                            <Input type="number" value={form.installmentCount} onChange={(e) => setForm((f) => ({ ...f, installmentCount: e.target.value }))} min={2} max={12} />
                          </div>
                          <div className="w-32">
                            <Label className="text-sm font-semibold mb-2 block text-(--text-primary)">Period</Label>
                            <select value={installmentPeriod} onChange={(e) => setInstallmentPeriod(e.target.value)} className="h-12 w-full rounded-xl border border-(--border-color) bg-(--bg-primary) px-3">
                              <option value="weekly">Weekly</option>
                              <option value="bi-weekly">Bi-Weekly</option>
                              <option value="monthly">Monthly</option>
                            </select>
                          </div>
                        </>
                      )}
                    </div>

                    {Number(form.price) > 0 && (
                      <div className="p-4 rounded-xl bg-(--color-accent-yellow)/10 border border-(--color-accent-yellow)/20">
                        <div className="flex items-center gap-2 mb-3"><Info className="h-4 w-4 text-(--color-accent-yellow)" /><h4 className="text-sm font-semibold">Fee Information</h4></div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-(--text-secondary)">Customer Pays:</span><span className="font-semibold text-(--color-accent-yellow)">₦{Number(form.price).toLocaleString()}</span></div>
                          <div className="flex justify-between"><span className="text-(--text-secondary)">Transaction Fee (2% capped at ₦2,000):</span><span className="font-medium text-[var(--destructive)]">- ₦{feeCalculation.fee.toLocaleString()}</span></div>
                          <div className="border-t border-(--color-accent-yellow)/20 pt-2 mt-2"><div className="flex justify-between"><span className="font-semibold">You Receive:</span><span className="font-semibold text-(--color-lemon-green)">₦{feeCalculation.creatorReceives.toLocaleString()}</span></div></div>
                        </div>
                        <p className="text-xs text-(--text-secondary) mt-3">✓ The 2% transaction fee is deducted from your payout. Customers pay exactly the amount shown.</p>
                      </div>
                    )}

                    {form.priceType === "installment" && installmentAmount > 0 && (
                      <div className="p-4 rounded-xl bg-(--color-accent-yellow)/10 border border-(--color-accent-yellow)/20">
                        <div className="flex items-center gap-2 mb-2"><Calendar className="h-4 w-4 text-(--color-accent-yellow)" /><h4 className="text-sm font-semibold">Installment Breakdown</h4></div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-(--text-secondary)">Total Amount:</span><span className="font-semibold">₦{Number(form.price).toLocaleString()}</span></div>
                          <div className="flex justify-between"><span className="text-(--text-secondary)">Number of Installments:</span><span className="font-semibold">{form.installmentCount}</span></div>
                          <div className="flex justify-between"><span className="text-(--text-secondary)">Customer Pays Per Installment:</span><span className="font-semibold text-(--color-accent-yellow)">₦{installmentAmount.toLocaleString()}</span></div>
                          <div className="flex justify-between"><span className="text-(--text-secondary)">Fee Deducted Per Installment:</span><span className="font-semibold text-[var(--destructive)]">- ₦{getFeePerInstallment().toLocaleString()}</span></div>
                          <div className="border-t pt-2"><div className="flex justify-between"><span className="font-semibold">You Receive Per Installment:</span><span className="font-semibold text-(--color-lemon-green)">₦{(installmentAmount - getFeePerInstallment()).toLocaleString()}</span></div></div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            </div>
          </div>
        </main>

        {/* Sticky CTA */}
        <div className="fixed bottom-0 left-0 right-0 lg:left-72 bg-(--bg-secondary)/90 backdrop-blur-lg border-t border-(--border-color) p-4 z-40">
          <div className="max-w-2xl mx-auto">
            <Button
              variant="default"
              size="lg"
              className="w-full py-6 text-base bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90"
              onClick={handleCreate}
              disabled={!canCreate() || isCreating}
            >
              {isCreating ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Creating...</> : `Create ${typeLabels[pageType]} Page`}
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
            className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowSuccess(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-[var(--bg-primary)] rounded-3xl p-4 sm:p-6 md:p-8 max-w-[90%] sm:max-w-md md:max-w-lg lg:max-w-xl w-full text-center shadow-2xl border border-[var(--border-color)] mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4">🎉</div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-2">Payment Page Created!</h2>
              <p className="text-sm sm:text-base text-[var(--text-secondary)] mb-4 sm:mb-6">Your page is now live and ready to collect payments.</p>

              <div className="bg-[var(--bg-secondary)] rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 border border-[var(--border-color)]">
                <Label className="text-xs sm:text-sm font-semibold text-[var(--color-accent-yellow)] mb-2 block text-left">Your Payment Link:</Label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex items-center gap-2 flex-1 bg-[var(--bg-primary)] rounded-lg p-2 sm:p-3 border border-[var(--border-color)]">
                    <Link2 className="h-4 w-4 text-[var(--color-accent-yellow)] shrink-0" />
                    <code className="text-xs sm:text-sm font-mono text-[var(--text-primary)] break-all flex-1 text-left">{pageUrl}</code>
                  </div>
                  <button onClick={copyPageUrl} className="relative p-2 sm:p-3 rounded-lg bg-[var(--color-accent-yellow)]/10 hover:bg-[var(--color-accent-yellow)]/20 transition-colors group shrink-0">
                    {copied ? <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--color-lemon-green)]" /> : <Copy className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--color-accent-yellow)]" />}
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[var(--color-ink)] text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {copied ? "Copied!" : "Copy link"}
                    </span>
                  </button>
                </div>
                {copied && <p className="text-xs text-[var(--color-lemon-green)] mt-2 text-center animate-pulse">✓ Link copied to clipboard!</p>}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" className="flex-1 border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]" onClick={() => { setShowSuccess(false); window.open(pageUrl, '_blank'); }}>
                  Preview Page
                </Button>
                <Button variant="default" className="flex-1 bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90" onClick={() => { setShowSuccess(false); router.push("/dashboard/services/payment/dashboard"); }}>
                  Go to Dashboard
                </Button>
              </div>

              <button onClick={() => setShowSuccess(false)} className="mt-4 text-xs sm:text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreatePage;