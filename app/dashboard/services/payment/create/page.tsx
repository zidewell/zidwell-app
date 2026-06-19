// app/components/payment-page-components/CreatePage/CreatePage.tsx

"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Link2,
  RefreshCw,
  CheckCircle,
  Copy,
  ImagePlus,
  X,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import { PageType } from "@/app/hooks/useStore";
import DashboardSidebar from "@/app/components/dashboard-component/DashboardSidebar";
import DashboardHeader from "@/app/components/dashboard-component/DashboardHeader";
import PageTypeSelector from "@/app/components/payment-page-components/pageTypeSelector";
import SchoolFields from "@/app/components/payment-page-components/SchoolFields";
import DonationFields from "@/app/components/payment-page-components/DonationFields";
import PhysicalFields from "@/app/components/payment-page-components/PhysicalFields";
import DigitalFields from "@/app/components/payment-page-components/DigitalFields";
import ServicesFields from "@/app/components/payment-page-components/ServicesFields";
import InvestmentFields from "@/app/components/payment-page-components/InvestmentFields";
import TrustSignals from "@/app/components/payment-page-components/TrustSignals";


import { CoverImageUpload } from "@/app/components/payment-page-components/CoverImageUpload"; 
import { LogoUpload } from "@/app/components/payment-page-components/LogoUpload"; 
import { PricingSection } from "@/app/components/payment-page-components/PricingSection"; 
import { SuccessModal } from "@/app/components/payment-page-components/SuccessModal"; 
import { usePageCreation } from "@/app/components/payment-page-components/hooks/usePageCreation"; 
import {
  typeLabels,
  IMAGE_SPECS,
  getPlaceholderText,
  copyToClipboard,
  slugify,
} from "@/app/components/payment-page-components/utils/helpers";

interface CreatePageProps {
  onPageTypeSelect?: (type: PageType) => void;
}

export function page({ onPageTypeSelect }: CreatePageProps) {
  const router = useRouter();
  const [pageType, setPageType] = useState<PageType | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdSlug, setCreatedSlug] = useState("");
  const [copied, setCopied] = useState(false);
  const productRef = useRef<HTMLInputElement>(null);

  const {
    form,
    setForm,
    titleValidation,
    dynamicId,
    regenerateId,
    generateSlug,

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

    imagePosition,
    setImagePosition,
    imageScale,
    setImageScale,
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

    installmentAmount,
    installmentPeriod,
    setInstallmentPeriod,
    getFeePerInstallment,

    students,
    setStudents,
    schoolClass,
    setSchoolClass,
    feeBreakdown,
    setFeeBreakdown,
    requiredFields,
    setRequiredFields,

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

    variants,
    setVariants,
    requiresShipping,
    setRequiresShipping,

    downloadUrl,
    setDownloadUrl,
    accessLink,
    setAccessLink,
    emailDelivery,
    setEmailDelivery,

    bookingEnabled,
    setBookingEnabled,
    customerNoteEnabled,
    setCustomerNoteEnabled,

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

    feeCalculation,
    handleCreate,
    canCreate,
    isCreating,
    isInvestment,
    userData,
  } = usePageCreation({
    pageType,
    onSuccess: (slug) => {
      setCreatedSlug(slug);
      setShowSuccess(true);
    },
  });

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

  const handleCoverFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setCoverImageBase64(result);
      setCoverPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleLogoFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setLogoBase64(result);
      setLogoPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const resetImagePosition = () => {
    setImagePosition({ x: 50, y: 50 });
    setImageScale(1);
  };

  const pageUrl = `${window.location.origin}/pay/${createdSlug}`;
  const copyPageUrl = () => copyToClipboard(pageUrl, setCopied);
  const previewPage = () => router.push(`/pay/${createdSlug}`);
  const goToDashboard = () => router.push("/dashboard/services/payment/dashboard");

  const currentImageSpecs = pageType ? IMAGE_SPECS[pageType] : IMAGE_SPECS.digital;

  // If no page type selected, show the selector
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

  // For Payment Link type, redirect to the dedicated create-link page
  if (pageType === "link") {
    router.push("/dashboard/services/payment/create-link");
    return null;
  }

  const isSchool = pageType === "school";

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
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Cover Image */}
                <CoverImageUpload
                  coverPreview={coverPreview}
                  isDragOver={isDragOver}
                  currentImageSpecs={currentImageSpecs}
                  imagePosition={imagePosition}
                  imageScale={imageScale}
                  isDragging={isDragging}
                  showImageControls={showImageControls}
                  imageContainerRef={imageContainerRef}
                  imageRef={imageRef}
                  onFileSelect={handleCoverFileSelect}
                  onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); }}
                  onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false); }}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if (!isDragOver) setIsDragOver(true); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragOver(false);
                    const files = e.dataTransfer.files;
                    if (files && files.length > 0) {
                      const file = files[0];
                      if (!file.type.startsWith("image/")) { alert("Please drop an image file"); return; }
                      if (file.size > 5 * 1024 * 1024) { alert("Image size should be less than 5MB"); return; }
                      handleCoverFileSelect(file);
                    }
                  }}
                  onMouseDown={(e) => {
                    if (!coverPreview) return;
                    e.preventDefault();
                    setIsDragging(true);
                    const container = imageContainerRef.current;
                    if (!container) return;
                    const rect = container.getBoundingClientRect();
                    const mouseX = ((e.clientX - rect.left) / rect.width) * 100;
                    const mouseY = ((e.clientY - rect.top) / rect.height) * 100;
                    setDragStart({ x: mouseX - imagePosition.x, y: mouseY - imagePosition.y });
                  }}
                  onMouseMove={(e) => {
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
                    newX = Math.min(Math.max(newX, 0), maxX);
                    newY = Math.min(Math.max(newY, 0), maxY);
                    setImagePosition({ x: newX, y: newY });
                  }}
                  onMouseUp={() => setIsDragging(false)}
                  onWheel={(e) => {
                    if (!coverPreview) return;
                    e.preventDefault();
                    const delta = e.deltaY > 0 ? -0.1 : 0.1;
                    setImageScale((prev) => Math.min(Math.max(prev + delta, 0.5), 2));
                  }}
                  onZoomIn={() => setImageScale((prev) => Math.min(prev + 0.1, 2))}
                  onZoomOut={() => setImageScale((prev) => Math.max(prev - 0.1, 0.5))}
                  onReset={resetImagePosition}
                  onRemove={() => {
                    setCoverImageBase64(null);
                    setCoverPreview(null);
                    resetImagePosition();
                  }}
                />

                {/* Logo */}
                <LogoUpload
                  logoPreview={logoPreview}
                  logoBase64={logoBase64}
                  userProfilePicture={userData?.profilePicture || null}
                  onFileSelect={handleLogoFileSelect}
                  onRemove={() => {
                    setLogoBase64(null);
                    setLogoPreview(null);
                  }}
                />

                {/* Title */}
                <div>
                  <Label className="text-sm font-semibold mb-2 block text-(--text-primary)">
                    Page Title *
                  </Label>
                  <Input
                    placeholder={getPlaceholderText(pageType, "title")}
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    className={`h-12 text-base border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:ring-(--color-accent-yellow) focus:border-(--color-accent-yellow) ${
                      !titleValidation.isValid && form.title ? "border-red-500" : ""
                    }`}
                  />
                  {form.title && (
                    <div
                      className={`mt-2 text-xs flex items-start gap-2 p-2 rounded-lg ${
                        titleValidation.isValid
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}
                    >
                      {titleValidation.isValid ? (
                        <CheckCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      )}
                      <span className="flex-1">{titleValidation.message}</span>
                    </div>
                  )}
                  <p className="text-xs text-(--text-secondary) mt-1">
                    Example: {getPlaceholderText(pageType, "title")}
                  </p>
                  <p className="text-xs text-(--text-secondary) mt-1">
                    This title will be used as your virtual account name.
                  </p>
                </div>

                {/* URL Preview */}
                {form.title && (
                  <div className="bg-(--bg-secondary)/50 rounded-lg p-4 border border-(--border-color)">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs font-semibold text-(--color-accent-yellow)">
                        Your Page URL:
                      </Label>
                      <button
                        onClick={regenerateId}
                        className="flex items-center gap-1 text-xs text-(--color-accent-yellow) hover:text-(--color-accent-yellow)/80"
                      >
                        <RefreshCw className="h-3 w-3" /> New ID
                      </button>
                    </div>
                    <div className="flex items-center gap-2 bg-(--bg-primary) p-3 rounded-lg border border-(--border-color)">
                      <Link2 className="h-4 w-4 text-(--color-accent-yellow) shrink-0" />
                      <code className="text-sm font-mono text-(--text-primary) break-all">
                        {window.location.origin}/pay/{generateSlug()}
                      </code>
                    </div>
                    {pageType === "school" && schoolClass && (
                      <p className="text-xs text-(--color-accent-yellow) mt-2">
                        URL includes class name: {slugify(schoolClass)}
                      </p>
                    )}
                  </div>
                )}

                {/* Description */}
                <div>
                  <Label className="text-sm font-semibold mb-2 block text-(--text-primary)">
                    Description
                  </Label>
                  <Textarea
                    placeholder={getPlaceholderText(pageType, "description")}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={4}
                    className="text-base resize-none border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:ring-(--color-accent-yellow) focus:border-(--color-accent-yellow)"
                  />
                  <p className="text-xs text-(--text-secondary) mt-1">
                    Example: {getPlaceholderText(pageType, "description").substring(0, 100)}...
                  </p>
                </div>

                {/* Product Images */}
                {pageType !== "school" && pageType !== "donation" && (
                  <div>
                    <Label className="text-sm font-semibold mb-2 block text-(--text-primary)">
                      Product Images
                    </Label>
                    <input
                      type="file"
                      ref={productRef}
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleImageSelect(e, "product")}
                    />
                    <div className="flex gap-3 flex-wrap">
                      {productPreviews.map((img, i) => (
                        <div key={i} className="relative h-24 w-24 rounded-xl overflow-hidden group">
                          <img src={img} className="w-full h-full object-cover" alt="" />
                          <button
                            onClick={() => removeProductImage(i)}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100"
                          >
                            <X className="h-4 w-4 text-white" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => productRef.current?.click()}
                        className="h-24 w-24 rounded-xl border-2 border-dashed border-(--border-color) bg-(--bg-secondary)/50 flex items-center justify-center hover:border-(--color-accent-yellow)"
                      >
                        <ImagePlus className="h-5 w-5 text-(--text-secondary)" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Type-Specific Fields */}
                <div className="p-5 rounded-2xl border border-(--border-color) bg-(--bg-secondary)">
                  <h3 className="font-bold text-sm mb-4 text-(--color-accent-yellow)">
                    {typeLabels[pageType]} Settings
                  </h3>
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
                      requireDonorName={requireDonorName}
                      setRequireDonorName={setRequireDonorName}
                      minimumDonation={minimumDonation}
                      setMinimumDonation={setMinimumDonation}
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
                  <PricingSection
                    priceType={form.priceType}
                    price={form.price}
                    installmentCount={form.installmentCount}
                    installmentPeriod={installmentPeriod}
                    installmentAmount={installmentAmount}
                    feeCalculation={feeCalculation}
                    getFeePerInstallment={getFeePerInstallment}
                    onPriceTypeChange={(val) => setForm((f) => ({ ...f, priceType: val }))}
                    onPriceChange={(val) => setForm((f) => ({ ...f, price: val }))}
                    onInstallmentCountChange={(val) => setForm((f) => ({ ...f, installmentCount: val }))}
                    onInstallmentPeriodChange={setInstallmentPeriod}
                    isSchool={isSchool}
                  />
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
              {isCreating ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Creating...
                </>
              ) : (
                `Create ${typeLabels[pageType]} Page`
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccess}
        pageUrl={pageUrl}
        copied={copied}
        onClose={() => setShowSuccess(false)}
        onCopy={copyPageUrl}
        onPreview={previewPage}
        onDashboard={goToDashboard}
      />
    </div>
  );
}

export default page;