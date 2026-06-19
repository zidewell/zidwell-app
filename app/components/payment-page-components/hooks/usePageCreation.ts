// app/components/payment-page-components/CreatePage/hooks/usePageCreation.ts

"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore, PageType, Student, FeeItem, Variant, isInvestmentType } from "@/app/hooks/useStore";
import { useUserContextData } from "@/app/context/userData";
import { slugify, triggerConfetti, validateTitleForVirtualAccount } from "../utils/helpers";

interface UsePageCreationProps {
  pageType: PageType | null;
  onSuccess: (slug: string) => void;
}

export function usePageCreation({ pageType, onSuccess }: UsePageCreationProps) {
  const router = useRouter();
  const { createPage, addPage } = useStore();
  const { userData } = useUserContextData();

  const [isCreating, setIsCreating] = useState(false);
  const [dynamicId, setDynamicId] = useState(() =>
    Math.floor(100 + Math.random() * 900).toString()
  );

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

  // Image states
  const [coverImageBase64, setCoverImageBase64] = useState<string | null>(null);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [productImagesBase64, setProductImagesBase64] = useState<string[]>([]);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [productPreviews, setProductPreviews] = useState<string[]>([]);

  // Image drag states
  const [imagePosition, setImagePosition] = useState({ x: 50, y: 50 });
  const [imageScale, setImageScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showImageControls, setShowImageControls] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // School fields
  const [students, setStudents] = useState<Student[]>([]);
  const [schoolClass, setSchoolClass] = useState("");
  const [feeBreakdown, setFeeBreakdown] = useState<FeeItem[]>([]);
  const [requiredFields, setRequiredFields] = useState<string[]>([]);

  // Donation fields
  const [suggestedAmounts, setSuggestedAmounts] = useState<number[]>([5000, 10000, 20000]);
  const [showDonorList, setShowDonorList] = useState(false);
  const [allowDonorMessage, setAllowDonorMessage] = useState(true);
  const [requireDonorName, setRequireDonorName] = useState(true);
  const [minimumDonation, setMinimumDonation] = useState(100);

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

  const [titleValidation, setTitleValidation] = useState<{
    isValid: boolean;
    message: string;
  }>({ isValid: true, message: "" });

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
      const validation = validateTitleForVirtualAccount(
        form.title,
        pageType === "school" ? schoolClass : undefined
      );
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
      const hasValidFeeItems =
        feeBreakdown.length > 0 && feeBreakdown.some((item) => item.amount > 0);
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
      // Upload images
      const uploadPromises: Record<string, Promise<string | null>> = {};

      if (coverImageBase64) {
        uploadPromises.cover = fetch(`/api/payment-page/upload-image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: coverImageBase64, type: "covers" }),
        })
          .then((res) => res.json())
          .then((data) => data.url);
      }

      if (logoBase64) {
        uploadPromises.logo = fetch(`/api/payment-page/upload-image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: logoBase64, type: "logos" }),
        })
          .then((res) => res.json())
          .then((data) => data.url);
      } else if (userData?.profilePicture) {
        uploadPromises.logo = Promise.resolve(userData.profilePicture);
      }

      const productUploadPromises = productImagesBase64.map((img) =>
        fetch(`/api/payment-page/upload-image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: img, type: "products" }),
        })
          .then((res) => res.json())
          .then((data) => data.url)
      );

      const [uploadedCover, uploadedLogo, ...uploadedProducts] = await Promise.all([
        uploadPromises.cover || Promise.resolve(null),
        uploadPromises.logo || Promise.resolve(null),
        ...productUploadPromises,
      ]);

      let finalCoverImage = uploadedCover;
      if (!finalCoverImage && uploadedProducts.length > 0) {
        const isProductType = ["physical", "digital", "services", "real_estate", "stock", "savings", "crypto"].includes(
          pageType
        );
        if (isProductType) {
          finalCoverImage = uploadedProducts[0];
        }
      }
      if (!finalCoverImage && uploadedLogo) {
        finalCoverImage = uploadedLogo;
      }

      // Build metadata
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
        metadata.requireDonorName = requireDonorName;
        metadata.minimumDonation = minimumDonation;
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
      } else if (isInvestmentType(pageType)) {
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
      if (pageType === "school") {
        finalPrice = calculateFeeBreakdownTotal().toString();
      }

      const pageData = {
        title: form.title,
        slug: finalSlug,
        description: form.description,
        coverImage: finalCoverImage,
        logo: uploadedLogo,
        productImages: uploadedProducts.filter((url) => url !== null),
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

      if (result.page) addPage(result.page);
      triggerConfetti();
      onSuccess(pageSlug);
    } catch (err: any) {
      console.error("Create page error:", err);
      alert(err.message || "Failed to create page. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  // Return all state and functions
  return {
    // Form state
    form,
    setForm,
    titleValidation,
    dynamicId,
    regenerateId,
    generateSlug,

    // Images
    coverImageBase64,
    setCoverImageBase64,
    coverPreview,
    setCoverPreview,
    logoBase64,
    setLogoBase64,
    logoPreview,
    setLogoPreview,
    productImagesBase64,
    setProductImagesBase64,
    productPreviews,
    setProductPreviews,

    // Image drag - INCLUDING SETTERS
    imagePosition,
    setImagePosition,  // <-- ADD THIS
    imageScale,
    setImageScale,      // <-- ADD THIS
    isDragging,
    setIsDragging,
    dragStart,
    setDragStart,
    showImageControls,
    setShowImageControls,
    isDragOver,
    setIsDragOver,
    imageContainerRef,
    imageRef,

    // Installment
    installmentAmount,
    installmentPeriod,
    setInstallmentPeriod,
    getFeePerInstallment,

    // School
    students,
    setStudents,
    schoolClass,
    setSchoolClass,
    feeBreakdown,
    setFeeBreakdown,
    requiredFields,
    setRequiredFields,

    // Donation
    suggestedAmounts,
    setSuggestedAmounts,
    showDonorList,
    setShowDonorList,
    allowDonorMessage,
    setAllowDonorMessage,
    requireDonorName,
    setRequireDonorName,
    minimumDonation,
    setMinimumDonation,

    // Physical
    variants,
    setVariants,
    requiresShipping,
    setRequiresShipping,

    // Digital
    downloadUrl,
    setDownloadUrl,
    accessLink,
    setAccessLink,
    emailDelivery,
    setEmailDelivery,

    // Services
    bookingEnabled,
    setBookingEnabled,
    customerNoteEnabled,
    setCustomerNoteEnabled,

    // Investment
    minimumAmount,
    setMinimumAmount,
    expectedReturn,
    setExpectedReturn,
    tenure,
    setTenure,
    charges,
    setCharges,
    paymentFrequency,
    setPaymentFrequency,
    termsAndConditions,
    setTermsAndConditions,
    riskExplanation,
    setRiskExplanation,

    // Trust signals
    cacCertificate,
    setCacCertificate,
    taxClearance,
    setTaxClearance,
    explainerVideo,
    setExplainerVideo,
    socialLinks,
    setSocialLinks,
    website,
    setWebsite,
    contactInfo,
    setContactInfo,

    // Fee calculation
    feeCalculation,

    // Actions
    handleCreate,
    canCreate,
    isCreating,
    isInvestment,
    userData,
  };
}