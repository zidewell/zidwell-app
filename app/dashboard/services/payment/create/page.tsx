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
  User,
  Building,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import {
  useStore,
  PaymentPage,
  PageType,
  Student,
  FeeItem,
  Variant,
  isInvestmentType,
} from "@/app/hooks/useStore";
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
import { useUserContextData } from "@/app/context/userData";

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
  const { addPage } = useStore();
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdSlug, setCreatedSlug] = useState("");
  const [pageType, setPageType] = useState<PageType | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { userData } = useUserContextData();

  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    coverImage: null as string | null,
    logo: null as string | null,
    productImages: [] as string[],
    priceType: "fixed" as "fixed" | "installment" | "open",
    price: "",
    installmentCount: "3",
    feeMode: "bearer" as "bearer" | "customer",
    entityName: "", // New field for school/organization name
  });

  // School
  const [students, setStudents] = useState<Student[]>([]);
  const [schoolClass, setSchoolClass] = useState("");
  const [feeBreakdown, setFeeBreakdown] = useState<FeeItem[]>([]);
  const [requiredFields, setRequiredFields] = useState<string[]>([]);

  // Donation
  const [suggestedAmounts, setSuggestedAmounts] = useState<number[]>([
    5000, 10000, 20000,
  ]);
  const [showDonorList, setShowDonorList] = useState(false);
  const [allowDonorMessage, setAllowDonorMessage] = useState(true);

  // Physical
  const [variants, setVariants] = useState<Variant[]>([]);
  const [requiresShipping, setRequiresShipping] = useState(true);

  // Digital
  const [downloadUrl, setDownloadUrl] = useState("");
  const [accessLink, setAccessLink] = useState("");
  const [emailDelivery, setEmailDelivery] = useState(true);

  // Services
  const [bookingEnabled, setBookingEnabled] = useState(false);
  const [customerNoteEnabled, setCustomerNoteEnabled] = useState(true);

  // Investment
  const [minimumAmount, setMinimumAmount] = useState("");
  const [expectedReturn, setExpectedReturn] = useState("");
  const [tenure, setTenure] = useState("");
  const [charges, setCharges] = useState("");
  const [paymentFrequency, setPaymentFrequency] = useState<
    "one-time" | "recurring"
  >("one-time");
  const [termsAndConditions, setTermsAndConditions] = useState("");
  const [riskExplanation, setRiskExplanation] = useState("");

  // Trust signals
  const [cacCertificate, setCacCertificate] = useState("");
  const [taxClearance, setTaxClearance] = useState("");
  const [explainerVideo, setExplainerVideo] = useState("");
  const [socialLinks, setSocialLinks] = useState<
    { platform: string; url: string }[]
  >([]);
  const [website, setWebsite] = useState("");
  const [contactInfo, setContactInfo] = useState("");

  const coverRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const productRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "coverImage" | "logo" | "productImages",
  ) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const url = ev.target?.result as string;
        if (field === "productImages") {
          setForm((f) => ({ ...f, productImages: [...f.productImages, url] }));
        } else {
          setForm((f) => ({ ...f, [field]: url }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  // Generate slug from entity name and title
  const generateSlug = (entityName: string, title: string) => {
    const entityPart = slugify(entityName);
    const titlePart = slugify(title);
    if (entityPart && titlePart) {
      return `${entityPart}-${titlePart}`;
    } else if (entityPart) {
      return entityPart;
    } else if (titlePart) {
      return titlePart;
    }
    return "";
  };

  const handleTitleChange = (title: string) => {
    setForm((f) => ({
      ...f,
      title,
      slug: generateSlug(f.entityName, title),
    }));
  };

  const handleEntityNameChange = (entityName: string) => {
    setForm((f) => ({
      ...f,
      entityName,
      slug: generateSlug(entityName, f.title),
    }));
  };

  const handleManualSlugChange = (slug: string) => {
    setForm((f) => ({ ...f, slug: slugify(slug) }));
  };

  const isInvestment = pageType ? isInvestmentType(pageType) : false;

  const canCreate = () => {
    if (!form.title.trim() || !pageType) return false;
    if (isInvestment) {
      if (!minimumAmount || !tenure.trim()) return false;
      if (termsAndConditions.length < 100) return false;
      if (!riskExplanation.trim()) return false;
    }
    return true;
  };

  const handleCreate = () => {
    if (!canCreate() || !pageType) return;
    const id = crypto.randomUUID();
    const slug = form.slug || generateSlug(form.entityName, form.title);

    const page: PaymentPage = {
      id,
      title: form.title,
      slug,
      description: form.description,
      coverImage: form.coverImage,
      logo: form.logo,
      productImages: form.productImages,
      priceType: pageType === "donation" ? "open" : form.priceType,
      price:
        form.priceType === "open" || pageType === "donation"
          ? 0
          : Number(form.price) || 0,
      installmentCount:
        form.priceType === "installment"
          ? Number(form.installmentCount) || 3
          : undefined,
      feeMode: form.feeMode,
      virtualAccount: "",
      bankName: "",
      totalRevenue: 0,
      totalPayments: 0,
      pageViews: 0,
      createdAt: new Date().toISOString(),
      pageType,
      pageBalance: 0,
      isPublished: true,
      metadata: {
        entityName: form.entityName, // Store entity name in metadata
      },
      ...(pageType === "school" && {
        students,
        className: schoolClass,
        requiredFields,
        feeBreakdown,
      }),
      ...(pageType === "donation" && {
        suggestedAmounts,
        showDonorList,
        allowDonorMessage,
      }),
      ...(pageType === "physical" && { variants, requiresShipping }),
      ...(pageType === "digital" && { downloadUrl, accessLink, emailDelivery }),
      ...(pageType === "services" && { bookingEnabled, customerNoteEnabled }),
      ...(isInvestment && {
        minimumAmount: Number(minimumAmount) || 0,
        expectedReturn,
        tenure,
        charges,
        paymentFrequency,
        termsAndConditions,
        riskExplanation,
        cacCertificate: cacCertificate || undefined,
        taxClearance: taxClearance || undefined,
        explainerVideo: explainerVideo || undefined,
        socialLinks: socialLinks.filter((l) => l.platform && l.url),
        website: website || undefined,
        contactInfo: contactInfo || undefined,
        totalInvestments: 0,
        totalParticipants: 0,
      }),
    };

    addPage(page);
    setCreatedSlug(slug);
    setShowSuccess(true);
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.5 },
      colors: ["#034835", "#e4c644", "#f7f0e5"],
    });
  };

  const pageUrl = `zidwell.com/payment/${createdSlug}`;
  const copyUrl = () => navigator.clipboard.writeText(pageUrl);

  // Get the placeholder text for entity name based on page type
  const getEntityNamePlaceholder = () => {
    switch (pageType) {
      case "school":
        return "e.g. Edward High School";
      case "donation":
        return "e.g. Hope Foundation";
      case "physical":
        return "e.g. Tech Store";
      case "digital":
        return "e.g. Digital Creators";
      case "services":
        return "e.g. Elite Consulting";
      default:
        if (isInvestment) {
          return "e.g. Lagos Investment Group";
        }
        return "Your business/organization name";
    }
  };

  const getEntityNameLabel = () => {
    switch (pageType) {
      case "school":
        return "School Name *";
      case "donation":
        return "Organization Name *";
      default:
        return "Business/Organization Name *";
    }
  };

  if (!pageType) {
    return (
      <div className="min-h-screen dark:bg-[#0e0e0e]">
        <DashboardSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
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
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

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
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Entity/School Name */}
                <div>
                  <Label className="text-sm font-semibold mb-2 block text-[#141414] dark:text-[#f5f5f5]">
                    {getEntityNameLabel()}
                  </Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b6b6b] dark:text-[#a6a6a6]" />
                    <Input
                      placeholder={getEntityNamePlaceholder()}
                      value={form.entityName}
                      onChange={(e) => handleEntityNameChange(e.target.value)}
                      className="pl-10 h-12 text-base bg-[#ffffff] dark:bg-[#121212] border-[#ded4c3] dark:border-[#474747] text-[#141414] dark:text-[#f5f5f5]"
                    />
                  </div>
                  <p className="text-xs text-[#6b6b6b] dark:text-[#a6a6a6] mt-1">
                    This will be used in your page URL:{" "}
                    {form.entityName ? slugify(form.entityName) : "your-name"}
                    -...
                  </p>
                </div>

                {/* Cover Image - Optional */}
                <div>
                  <Label className="text-sm font-semibold mb-2 block text-[#141414] dark:text-[#f5f5f5]">
                    Cover Image{" "}
                    <span className="text-xs font-normal text-[#6b6b6b]">
                      (Optional)
                    </span>
                  </Label>
                  <input
                    type="file"
                    ref={coverRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "coverImage")}
                  />
                  {form.coverImage ? (
                    <div className="relative h-48 rounded-2xl overflow-hidden group">
                      <img
                        src={form.coverImage}
                        className="w-full h-full object-cover"
                        alt="Cover"
                      />
                      <button
                        onClick={() =>
                          setForm((f) => ({ ...f, coverImage: null }))
                        }
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
                      <span className="text-sm text-[#6b6b6b] dark:text-[#a6a6a6]">
                        Upload cover image (optional)
                      </span>
                    </button>
                  )}
                </div>

                {/* Logo - Enhanced Design like LogoUpload component */}
                <div>
                  <Label className="text-sm font-semibold mb-2 block text-[#141414] dark:text-[#f5f5f5]">
                    Business Logo / Profile Picture
                  </Label>
                  <div className="flex items-center gap-4">
                    {form.logo || userData?.profilePicture ? (
                      <div className="relative group">
                        <img
                          src={form.logo || userData?.profilePicture}
                          alt="Business Logo"
                          className={`h-20 w-20 object-cover ${
                            !form.logo && userData?.profilePicture
                              ? "rounded-full"
                              : "rounded-2xl"
                          }`}
                        />
                        {form.logo && (
                          <button
                            onClick={() =>
                              setForm((f) => ({ ...f, logo: null }))
                            }
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
                        onChange={(e) => handleImageUpload(e, "logo")}
                      />
                      <button
                        onClick={() => logoRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-[#ded4c3] dark:border-[#474747] rounded-xl bg-[#e9e2d7]/50 dark:bg-[#242424]/50 hover:border-[#e1bf46] hover:bg-[#e1bf46]/5 transition-colors"
                      >
                        <Upload className="h-4 w-4 text-[#6b6b6b] dark:text-[#a6a6a6]" />
                        <span className="text-sm text-[#6b6b6b] dark:text-[#a6a6a6]">
                          {form.logo
                            ? "Change Logo"
                            : userData?.profilePicture
                              ? "Upload Custom Logo"
                              : "Upload Logo"}
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
                  <Label className="text-sm font-semibold mb-2 block text-[#141414] dark:text-[#f5f5f5]">
                    Page Title *
                  </Label>
                  <Input
                    placeholder={
                      isInvestment
                        ? 'e.g. "Lagos Property Fund Q2 2025"'
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

                {/* URL Slug - Now showing combined preview */}
                <div>
                  <Label className="text-sm font-semibold mb-2 block text-[#141414] dark:text-[#f5f5f5]">
                    Page URL
                  </Label>
                  <div className="flex items-center gap-0 rounded-lg border border-[#ded4c3] dark:border-[#474747] overflow-hidden bg-[#e9e2d7]/50 dark:bg-[#242424]/50">
                    <span className="px-3 text-sm text-[#6b6b6b] dark:text-[#a6a6a6] whitespace-nowrap bg-[#e9e2d7] dark:bg-[#242424] border-r border-[#ded4c3] dark:border-[#474747]">
                      zidwell.com/payment/
                    </span>
                    <Input
                      value={form.slug}
                      onChange={(e) => handleManualSlugChange(e.target.value)}
                      placeholder={
                        generateSlug(form.entityName, form.title) ||
                        "school-name-page-title"
                      }
                      className="border-0 h-11 rounded-none focus-visible:ring-0 bg-transparent text-[#141414] dark:text-[#f5f5f5]"
                    />
                  </div>
                  <p className="text-xs text-[#6b6b6b] dark:text-[#a6a6a6] mt-1">
                    URL will be: zidwell.com/payment/
                    {form.slug ||
                      generateSlug(form.entityName, form.title) ||
                      "your-school-name-page-title"}
                  </p>
                </div>

                {/* Description */}
                <div>
                  <Label className="text-sm font-semibold mb-2 block text-[#141414] dark:text-[#f5f5f5]">
                    Description
                  </Label>
                  <Textarea
                    placeholder={
                      isInvestment
                        ? "Describe this investment opportunity in detail..."
                        : "Describe your product or service..."
                    }
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    rows={4}
                    className="text-base resize-none bg-[#ffffff] dark:bg-[#121212] border-[#ded4c3] dark:border-[#474747] text-[#141414] dark:text-[#f5f5f5]"
                  />
                </div>

                {/* Product Images */}
                {pageType !== "school" && (
                  <div>
                    <Label className="text-sm font-semibold mb-2 block text-[#141414] dark:text-[#f5f5f5]">
                      {isInvestment
                        ? "Property / Project Images"
                        : "Product Images"}
                    </Label>
                    <input
                      type="file"
                      ref={productRef}
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleImageUpload(e, "productImages")}
                    />
                    <div className="flex gap-3 flex-wrap">
                      {form.productImages.map((img, i) => (
                        <div
                          key={i}
                          className="relative h-24 w-24 rounded-xl overflow-hidden group"
                        >
                          <img
                            src={img}
                            className="w-full h-full object-cover"
                            alt={`Product ${i + 1}`}
                          />
                          <button
                            onClick={() =>
                              setForm((f) => ({
                                ...f,
                                productImages: f.productImages.filter(
                                  (_, idx) => idx !== i,
                                ),
                              }))
                            }
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
                  <h3 className="font-bold text-sm mb-4 text-[#e1bf46]">
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
                      <Label className="text-sm font-semibold mb-3 block text-[#141414] dark:text-[#f5f5f5]">
                        Pricing
                      </Label>
                      <div className="grid grid-cols-3 gap-3">
                        {(
                          [
                            ["fixed", "Fixed Price"],
                            ["installment", "Installment"],
                            ["open", "Open (Donate)"],
                          ] as const
                        ).map(([val, label]) => (
                          <button
                            key={val}
                            onClick={() =>
                              setForm((f) => ({ ...f, priceType: val }))
                            }
                            className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${form.priceType === val ? "border-[#e1bf46] bg-[#e1bf46]/10 text-[#023528] dark:text-[#f5f5f5]" : "border-[#ded4c3] dark:border-[#474747] bg-[#f9f6ef] dark:bg-[#121212] text-[#6b6b6b] dark:text-[#a6a6a6] hover:border-[#e1bf46]/50"}`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {form.priceType !== "open" && (
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <Label className="text-sm font-semibold mb-2 block text-[#141414] dark:text-[#f5f5f5]">
                            Amount (₦)
                          </Label>
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={form.price}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, price: e.target.value }))
                            }
                            className="h-12 text-base bg-[#ffffff] dark:bg-[#121212] border-[#ded4c3] dark:border-[#474747] text-[#141414] dark:text-[#f5f5f5]"
                          />
                        </div>
                        {form.priceType === "installment" && (
                          <div className="w-32">
                            <Label className="text-sm font-semibold mb-2 block text-[#141414] dark:text-[#f5f5f5]">
                              Installments
                            </Label>
                            <Input
                              type="number"
                              value={form.installmentCount}
                              onChange={(e) =>
                                setForm((f) => ({
                                  ...f,
                                  installmentCount: e.target.value,
                                }))
                              }
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

                {/* Fee Mode */}
                <div>
                  <Label className="text-sm font-semibold mb-3 block text-[#141414] dark:text-[#f5f5f5]">
                    Transaction Fee (2%, capped at ₦2,000)
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    {(
                      [
                        ["bearer", "I'll bear the fee"],
                        ["customer", "Customer pays"],
                      ] as const
                    ).map(([val, label]) => (
                      <button
                        key={val}
                        onClick={() => setForm((f) => ({ ...f, feeMode: val }))}
                        className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${form.feeMode === val ? "border-[#e1bf46] bg-[#e1bf46]/10 text-[#023528] dark:text-[#f5f5f5]" : "border-[#ded4c3] dark:border-[#474747] bg-[#f9f6ef] dark:bg-[#121212] text-[#6b6b6b] dark:text-[#a6a6a6] hover:border-[#e1bf46]/50"}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Validation messages for investment */}
                {isInvestment && !canCreate() && form.title.trim() && (
                  <div className="p-4 rounded-2xl border-2 border-[#ee4343]/30 bg-[#ee4343]/5 text-sm space-y-1">
                    {!minimumAmount && (
                      <p className="text-[#ee4343]">
                        • Minimum investment amount is required
                      </p>
                    )}
                    {!tenure.trim() && (
                      <p className="text-[#ee4343]">
                        • Tenure / maturity period is required
                      </p>
                    )}
                    {termsAndConditions.length < 100 && (
                      <p className="text-[#ee4343]">
                        • Terms & Conditions must be at least 100 characters (
                        {termsAndConditions.length}/100)
                      </p>
                    )}
                    {!riskExplanation.trim() && (
                      <p className="text-[#ee4343]">
                        • Risk explanation is required
                      </p>
                    )}
                  </div>
                )}
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
              disabled={!canCreate()}
            >
              Create {typeLabels[pageType]} Page
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
              <h2 className="text-2xl font-bold mb-2 text-[#141414] dark:text-[#f5f5f5]">
                Congratulations!
              </h2>
              <p className="text-[#6b6b6b] dark:text-[#a6a6a6] mb-6">
                Your {typeLabels[pageType].toLowerCase()} page is now live and
                ready to collect payments.
              </p>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#e9e2d7] dark:bg-[#242424] mb-6">
                <Link2 className="h-4 w-4 text-[#6b6b6b] dark:text-[#a6a6a6] shrink-0" />
                <span className="text-sm truncate flex-1 text-[#141414] dark:text-[#f5f5f5]">
                  {pageUrl}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={copyUrl}
                  className="shrink-0"
                >
                  Copy
                </Button>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push(`/pay/${createdSlug}`)}
                >
                  Preview Page
                </Button>
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={() =>
                    router.push("/dashboard/services/payment/dashboard")
                  }
                >
                  Go to Dashboard
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreatePage;
