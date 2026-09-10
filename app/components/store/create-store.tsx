"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useStore } from "@/app/context/StoreContext";
import { useUserContextData } from "@/app/context/userData";
import { useVerificationModal } from "@/app/context/verificationModalContext";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import Swal from "sweetalert2";
import {
  Store,
  ChevronRight,
  Loader2,
  Shield,
  CreditCard,
  Sparkles,
  Check,
  AlertCircle,
  ArrowLeft,
  PartyPopper,
  Rocket,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import BVNVerificationBadge from "@/app/components/BVNVerificationBadge";
import RichTextArea from "@/app/components/payment-page-components/RichTextArea";

const ACTIVATION_FEE_NAIRA = 200;

type StoreFormData = {
  name: string;
  slug: string;
  description: string;
  keywords: string;
  cacNumber: string;
  country: string;
  state: string;
  city: string;
  streetAddress: string;
  locationEnabled: boolean;
};

const initialFormData: StoreFormData = {
  name: "",
  slug: "",
  description: "",
  keywords: "",
  cacNumber: "",
  country: "Nigeria",
  state: "",
  city: "",
  streetAddress: "",
  locationEnabled: true,
};

function inputClass(error?: string) {
  return cn(
    "w-full rounded-xl border bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 transition-all",
    error ? "border-red-500" : "border-gray-300 dark:border-gray-700"
  );
}

function Field({
  label,
  required,
  optional,
  hint,
  error,
  input,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  error?: string;
  input: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {optional && (
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">Optional</span>
        )}
      </label>
      {input}
      {hint && !error && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="size-3" /> {error}
        </p>
      )}
    </div>
  );
}

function ReviewRow({
  label,
  value,
  mono,
  multiline,
  html,
}: {
  label: string;
  value: string;
  mono?: boolean;
  multiline?: boolean;
  html?: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
      <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0 font-medium min-w-[120px]">
        {label}
      </span>
      <div className="flex-1">
        {html ? (
          <div
            className="text-sm font-medium prose prose-sm dark:prose-invert max-w-none
              prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5
              prose-strong:text-gray-900 dark:prose-strong:text-white"
            dangerouslySetInnerHTML={{ __html: value || "—" }}
          />
        ) : (
          <span
            className={cn(
              "text-sm font-medium text-gray-900 dark:text-white",
              mono && "font-mono",
              multiline && "whitespace-pre-wrap"
            )}
          >
            {value || "—"}
          </span>
        )}
      </div>
    </div>
  );
}

function Benefit({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <Check className="size-4 text-green-500" />
      <span className="text-white/85 text-sm">{text}</span>
    </div>
  );
}

// ============================================================
// ✅ CONGRATULATIONS MODAL
// ============================================================
function CongratulationsModal({
  isOpen,
  onClose,
  storeName,
  onGoToDashboard,
}: {
  isOpen: boolean;
  onClose: () => void;
  storeName: string;
  onGoToDashboard: () => void;
}) {
  useEffect(() => {
    if (isOpen) {
      triggerConfetti();
    }
  }, [isOpen]);

  const triggerConfetti = () => {
    const end = Date.now() + 3000;
    const colors = ["#FDC020", "#eab308", "#f59e0b", "#22c55e", "#3b82f6"];

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();

    setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors,
      });
    }, 150);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 text-center shadow-2xl"
      >
        <div className="flex justify-center mb-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-yellow-500/10">
            <PartyPopper className="size-12 text-yellow-500" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          🎉 Store Activated!
        </h2>

        <p className="mt-3 text-gray-600 dark:text-gray-400">
          Your store <span className="font-semibold text-yellow-600 dark:text-yellow-400">"{storeName}"</span> is now live and ready to accept payments!
        </p>

        <div className="mt-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-left space-y-2">
          <div className="flex items-center gap-3 text-sm">
            <Check className="size-4 text-green-500 shrink-0" />
            <span className="text-gray-700 dark:text-gray-300">Your store is now publicly visible</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Check className="size-4 text-green-500 shrink-0" />
            <span className="text-gray-700 dark:text-gray-300">You can now accept card payments</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Check className="size-4 text-green-500 shrink-0" />
            <span className="text-gray-700 dark:text-gray-300">Your business wallet is ready to receive funds</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Check className="size-4 text-green-500 shrink-0" />
            <span className="text-gray-700 dark:text-gray-300">Create unlimited payment pages &amp; products</span>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <button
            onClick={onGoToDashboard}
            className="w-full rounded-xl bg-[#FDC020] hover:bg-[#e6a800] text-[#191919] px-6 py-3 text-sm font-semibold transition-colors"
          >
            <Rocket className="size-4 inline mr-2" />
            Go to Store Dashboard
          </button>
          <button
            onClick={onClose}
            className="w-full rounded-xl px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            I'll check it out later
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function CreateStoreForm() {
  const router = useRouter();
  const {
    createStore,
    creatingStore,
    store,
    fetchStore,
  } = useStore();
  const { userData } = useUserContextData();
  const { openVerificationModal } = useVerificationModal();

  const hasPendingActivation = store !== null && store.isActive === false;
  const hasActiveStore = store !== null && store.isActive === true;

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<StoreFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [hasLoadedStoreData, setHasLoadedStoreData] = useState(false);

  const [showCongratulations, setShowCongratulations] = useState(false);
  const [activatedStoreName, setActivatedStoreName] = useState("");

  // ✅ Only checkout payment
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

  const totalSteps = 4;
  const isVerified = userData?.bvnVerification === "verified";
  const formRef = useRef<HTMLFormElement>(null);
  const isAutofillRef = useRef(false);

  // If user has an active store, redirect
  useEffect(() => {
    if (hasActiveStore) {
      router.push("/dashboard/services/payment/dashboard");
    }
  }, [hasActiveStore, router]);

  // Load store data when there's a pending activation
  useEffect(() => {
    if (store && store.isActive === false && !hasLoadedStoreData) {
      console.log("🔄 Loading pending store data for activation...");

      setFormData({
        name: store.name || "",
        slug: store.slug || "",
        description: store.description || "",
        keywords: Array.isArray(store.keywords) ? store.keywords.join(", ") : "",
        cacNumber: store.cacNumber || "",
        country: store.country || "Nigeria",
        state: store.state || "",
        city: store.city || "",
        streetAddress: store.streetAddress || "",
        locationEnabled: store.locationEnabled !== false,
      });

      setHasLoadedStoreData(true);
      setStep(4);
    }
  }, [store, hasLoadedStoreData]);

  useEffect(() => {
    if (step === 4) {
      // No wallet balance check needed
    }
  }, [step]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      try {
        if (isAutofillRef.current) return;

        const target = e.target;
        const { name, type } = target;

        if (!name) return;

        let newValue: string | boolean;

        if (type === 'checkbox') {
          newValue = (target as HTMLInputElement).checked;
        } else {
          newValue = target.value;
        }

        setFormData(prev => {
          const currentValue = prev[name as keyof StoreFormData];
          if (currentValue === newValue) return prev;
          return { ...prev, [name]: newValue };
        });

        if (errors[name]) {
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[name];
            return newErrors;
          });
        }
      } catch (error) {
        console.error("Error in handleInputChange:", error);
      }
    },
    [errors]
  );

  const handleDescriptionChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, description: value }));

    if (errors.description) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.description;
        return newErrors;
      });
    }
  }, [errors.description]);

  const handleSlugChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const value = e.target.value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "")
        .replace(/\s/g, "-")
        .replace(/-+/g, "-");

      setFormData(prev => ({ ...prev, slug: value }));

      if (errors.slug) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.slug;
          return newErrors;
        });
      }
    } catch (error) {
      console.error("Error in handleSlugChange:", error);
    }
  }, [errors.slug]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target;
    const { name, value } = target;

    if (name && value !== undefined) {
      setFormData(prev => {
        const currentValue = prev[name as keyof StoreFormData];
        if (currentValue !== value) {
          return { ...prev, [name]: value };
        }
        return prev;
      });
    }
  }, []);

  const validateStep = useCallback((stepNumber: number) => {
    const newErrors: Record<string, string> = {};

    if (stepNumber === 1) {
      if (!formData.name?.trim()) {
        newErrors.name = "Store name is required";
      } else if (formData.name.trim().length < 2) {
        newErrors.name = "Store name must be at least 2 characters";
      }
      if (!formData.slug?.trim()) {
        newErrors.slug = "Store URL is required";
      } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
        newErrors.slug = "Only lowercase letters, numbers, and hyphens allowed";
      } else if (formData.slug.length < 3) {
        newErrors.slug = "URL must be at least 3 characters";
      }
      const cleanDescription = formData.description.replace(/<[^>]*>/g, '').trim();
      if (!cleanDescription || cleanDescription.length === 0) {
        newErrors.description = "Store description is required";
      } else if (cleanDescription.length < 10) {
        newErrors.description = "Description should be at least 10 characters";
      }
    }

    if (stepNumber === 2) {
      if (!formData.country?.trim()) {
        newErrors.country = "Country is required";
      }
      if (!formData.state?.trim()) {
        newErrors.state = "State is required";
      }
      if (!formData.city?.trim()) {
        newErrors.city = "City is required";
      }
      if (!formData.streetAddress?.trim()) {
        newErrors.streetAddress = "Street address is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleNext = useCallback(() => {
    if (validateStep(step)) {
      setStep((s) => Math.min(s + 1, totalSteps));
    }
  }, [step, validateStep]);

  const handleBack = useCallback(() => {
    setStep((s) => Math.max(s - 1, 1));
  }, []);

  const handleGoToActivation = useCallback(() => {
    if (validateStep(1) && validateStep(2)) {
      setStep(4);
    }
  }, [validateStep]);

  const goToDashboard = useCallback(() => {
    setShowCongratulations(false);
    router.push("/dashboard/services/payment/dashboard");
  }, [router]);

  // ✅ Handle checkout payment - ONLY payment method
 const handleCheckoutPayment = useCallback(async () => {
  if (!hasPendingActivation) {
    if (!validateStep(1) || !validateStep(2)) {
      await Swal.fire({
        icon: "warning",
        title: "Incomplete Form",
        text: "Please complete all required fields before proceeding.",
        confirmButtonColor: "#6b7280",
      });
      return;
    }
  }

  setIsProcessingCheckout(true);

  try {
    const keywordsArray = formData.keywords
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    const storeData = {
      name: formData.name.trim(),
      slug: formData.slug.trim(),
      description: formData.description,
      keywords: keywordsArray,
      cacNumber: formData.cacNumber.trim() || undefined,
      country: formData.country,
      state: formData.state.trim(),
      city: formData.city.trim(),
      streetAddress: formData.streetAddress.trim(),
      locationEnabled: formData.locationEnabled,
    };

    const response = await fetch("/api/store/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeData: storeData,
        paymentMethod: "checkout",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Activation failed");
    }

    if (data.requiresCheckout && data.checkoutUrl) {
      // Redirect to checkout
      window.location.href = data.checkoutUrl;
    } else {
      throw new Error("No checkout URL returned");
    }
  } catch (error: any) {
    console.error("❌ Checkout error:", error);
    
    // Show error and stay on page
    await Swal.fire({
      icon: "error",
      title: "Payment Initiation Failed",
      text: error.message || "Something went wrong. Please try again.",
      confirmButtonColor: "#6b7280",
    });
    
    setIsProcessingCheckout(false);
  }
}, [hasPendingActivation, validateStep, formData]);
  // ✅ Activate - ONLY checkout
  const handleActivate = useCallback(async () => {
    if (!hasPendingActivation) {
      if (!validateStep(1) || !validateStep(2)) {
        await Swal.fire({
          icon: "warning",
          title: "Incomplete Form",
          text: "Please complete all required fields before proceeding.",
          confirmButtonColor: "#6b7280",
        });
        return;
      }
    }

    // ✅ Only checkout payment - no wallet check
    await handleCheckoutPayment();
  }, [hasPendingActivation, validateStep, handleCheckoutPayment]);

  const isWorking = isCreating || creatingStore || isActivating || isProcessingCheckout;

  // If active store, return null (will redirect via useEffect)
  if (hasActiveStore) {
    return null;
  }

  const renderStepContent = useCallback(() => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Store / Brand Details</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Tell customers about your brand. The name appears publicly.
              </p>
            </div>

            <Field
              label="Store / Brand Name"
              required
              error={errors.name}
              input={
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="e.g., Juice Hub"
                  className={inputClass(errors.name)}
                  autoComplete="organization"
                />
              }
            />

            <Field
              label="Store URL / Slug"
              required
              error={errors.slug}
              input={
                <div className="flex items-center rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus-within:ring-2 focus-within:ring-gray-400 dark:focus-within:ring-gray-500 transition-all overflow-hidden">
                  <span className="px-3 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 py-3 whitespace-nowrap">
                    zidwell.com/
                  </span>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleSlugChange}
                    onBlur={handleBlur}
                    placeholder="your-store"
                    className="flex-1 bg-transparent px-3 py-3 text-sm focus:outline-none text-gray-900 dark:text-white"
                    autoComplete="off"
                  />
                </div>
              }
            />

            {/* Store Description with RichTextArea */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                Store Description <span className="text-red-500 ml-1">*</span>
              </label>
              <RichTextArea
                value={formData.description}
                onChange={handleDescriptionChange}
                placeholder="Describe what your business is all about to potential customers..."
                minHeight="180px"
                maxHeight="350px"
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="size-3" /> {errors.description}
                </p>
              )}
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                ✨ Use the toolbar to format your description (bold, italic, lists, etc.)
              </p>
            </div>

            <Field
              label="Keywords"
              hint="Words or phrases describing your business, separated by commas."
              input={
                <input
                  type="text"
                  name="keywords"
                  value={formData.keywords}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="fruit juice seller, fruit vendor, juice delivery Lagos"
                  className={inputClass()}
                  autoComplete="off"
                />
              }
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Location Details</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Where is your store based?
              </p>
            </div>

            <Field
              label="Country"
              required
              error={errors.country}
              input={
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={inputClass(errors.country)}
                  autoComplete="country"
                >
                  <option value="Nigeria">Nigeria</option>
                  <option value="Ghana">Ghana</option>
                  <option value="Kenya">Kenya</option>
                  <option value="South Africa">South Africa</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="United States">United States</option>
                </select>
              }
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="State"
                required
                error={errors.state}
                input={
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="e.g., Lagos"
                    className={inputClass(errors.state)}
                    autoComplete="address-level1"
                  />
                }
              />
              <Field
                label="City"
                required
                error={errors.city}
                input={
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="e.g., Ikeja"
                    className={inputClass(errors.city)}
                    autoComplete="address-level2"
                  />
                }
              />
            </div>

            <Field
              label="Street Address"
              required
              error={errors.streetAddress}
              input={
                <input
                  type="text"
                  name="streetAddress"
                  value={formData.streetAddress}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="e.g., 123 Main Street"
                  className={inputClass(errors.streetAddress)}
                  autoComplete="street-address"
                />
              }
            />

            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Shield className="size-4 text-gray-500" />
                  <p className="font-medium text-sm text-gray-700 dark:text-gray-300">
                    Allow precise location
                  </p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Zidwell would like to use your precise location for better delivery and customer matching.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-3 shrink-0">
                <input
                  type="checkbox"
                  name="locationEnabled"
                  checked={formData.locationEnabled}
                  onChange={handleInputChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer-checked:bg-gray-700 dark:peer-checked:bg-gray-500 transition-colors duration-200">
                  <div className={cn(
                    "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200",
                    formData.locationEnabled && "translate-x-5"
                  )} />
                </div>
              </label>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Review Your Store</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Confirm everything looks correct before activation.
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-5 space-y-1 border border-gray-200 dark:border-gray-700">
              <ReviewRow label="Store Name" value={formData.name} />
              <ReviewRow label="Store URL" value={`zidwell.com/${formData.slug}`} mono />
              <ReviewRow
                label="Location"
                value={`${formData.city}, ${formData.state}, ${formData.country}`}
              />
              <ReviewRow label="Address" value={formData.streetAddress} />
              
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
                <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0 font-medium min-w-[120px]">
                  Description
                </span>
                <div className="flex-1">
                  {formData.description ? (
                    <div
                      className="text-sm font-medium prose prose-sm dark:prose-invert max-w-none
                        prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5
                        prose-strong:text-gray-900 dark:prose-strong:text-white"
                      dangerouslySetInnerHTML={{ __html: formData.description }}
                    />
                  ) : (
                    <span className="text-sm text-gray-500 dark:text-gray-400">No description provided</span>
                  )}
                </div>
              </div>
              
              {formData.keywords && (
                <ReviewRow label="Keywords" value={formData.keywords} />
              )}
              <ReviewRow
                label="Precise location"
                value={formData.locationEnabled ? "Enabled" : "Disabled"}
              />
            </div>

            <div className="rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 p-4 text-sm">
              <p className="text-gray-600 dark:text-gray-400">
                A one-time activation fee of{" "}
                <span className="font-bold text-gray-900 dark:text-white">
                  ₦{ACTIVATION_FEE_NAIRA.toLocaleString()}
                </span>{" "}
                will be charged via card to activate your store.
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-5">
            <div className="text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 mx-auto">
                <Sparkles className="size-7 text-gray-600 dark:text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold mt-4 text-gray-900 dark:text-white">
                {hasPendingActivation ? "Complete Your Store Activation" : "Activate Your Store"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {hasPendingActivation
                  ? "Your store has been created. Pay the activation fee to publish it."
                  : "Pay a one-time activation fee via card to publish your store."
                }
              </p>
            </div>

            <div className="rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-900 dark:bg-gray-800 text-white p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-widest font-semibold">
                    Activation Fee
                  </p>
                  <p className="text-4xl font-bold mt-2">
                    ₦{ACTIVATION_FEE_NAIRA.toLocaleString()}
                  </p>
                </div>
                <CreditCard className="size-10 text-gray-400 shrink-0" />
              </div>
              <div className="mt-5 pt-5 border-t border-gray-700 space-y-2 text-sm">
                <Benefit text="Publish your public store page" />
                <Benefit text="Accept card payments" />
                <Benefit text="Free business wallet to receive funds" />
                <Benefit text="Unlimited payment pages & products" />
              </div>
            </div>

            {isVerified ? (
              <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4 flex items-center gap-3">
                <Check className="size-5 text-green-500 shrink-0" />
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  ✓ BVN verified. You're ready to activate.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 p-4 flex items-center gap-3">
                <AlertCircle className="size-5 text-yellow-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                    ⚠️ User Credentials not verified
                  </p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-500">
                    You can still activate your store. Verify later to enable withdrawals.
                  </p>
                  <button
                    onClick={openVerificationModal}
                    className="mt-2 text-xs font-semibold text-yellow-600 dark:text-yellow-400 hover:underline"
                  >
                    Verify Now →
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={handleActivate}
              disabled={isWorking || isProcessingCheckout}
              className="w-full rounded-xl bg-[#FDC020] hover:bg-[#e6a800] text-[#191919] px-6 py-4 text-base font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isActivating || isProcessingCheckout ? (
                <>
                  <Loader2 className="size-5 inline mr-2 animate-spin" />
                  {isProcessingCheckout ? "Preparing Checkout..." : "Activating..."}
                </>
              ) : (
                <>
                  <CreditCard className="size-5 inline mr-2" />
                  {hasPendingActivation ? "Pay & Activate" : "Pay Now & Activate Store"}
                </>
              )}
            </button>

            <p className="text-center text-xs text-gray-500 dark:text-gray-400">
              You will be redirected to pay ₦{ACTIVATION_FEE_NAIRA.toLocaleString()} via card.
            </p>

        
          </div>
        );

      default:
        return null;
    }
  }, [
    step,
    formData,
    errors,
    isVerified,
    isWorking,
    isActivating,
    isProcessingCheckout,
    hasPendingActivation,
    handleInputChange,
    handleDescriptionChange,
    handleSlugChange,
    handleBlur,
    openVerificationModal,
    handleActivate,
  ]);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Congratulations Modal */}
      <AnimatePresence>
        <CongratulationsModal
          isOpen={showCongratulations}
          onClose={() => setShowCongratulations(false)}
          storeName={activatedStoreName}
          onGoToDashboard={goToDashboard}
        />
      </AnimatePresence>

      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
            <Store className="size-8 text-gray-600 dark:text-gray-400" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
          {hasPendingActivation ? "Complete Your Store Activation" : "Create Your Online Store"}
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          {hasPendingActivation
            ? "Your store is almost ready! Pay the activation fee to publish it."
            : "Set up your store and activate it to start accepting payments"
          }
        </p>
      </div>

      {/* BVN BADGE - Show but dismissable */}
      <BVNVerificationBadge variant="store" className="mb-6" dismissable={true} />

      {!hasPendingActivation && (
        <div className="flex items-center justify-center gap-2 mb-8 overflow-x-auto px-2">
          {[
            { n: 1, label: "Brand" },
            { n: 2, label: "Location" },
            { n: 3, label: "Review" },
            { n: 4, label: "Activate" },
          ].map((s, i, arr) => (
            <div key={s.n} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors",
                    s.n === step && "bg-[#FDC020] text-[#191919]",
                    s.n < step && "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300",
                    s.n > step && "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                  )}
                >
                  {s.n < step ? <Check className="size-4" /> : s.n}
                </div>
                <span className="mt-1 text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 hidden sm:block">
                  {s.label}
                </span>
              </div>
              {i < arr.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 w-8 sm:w-12 mx-1 sm:mx-2",
                    s.n < step ? "bg-gray-300 dark:bg-gray-600" : "bg-gray-200 dark:bg-gray-700"
                  )}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {hasPendingActivation && (
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-sm font-medium">
            <AlertCircle className="size-4" />
            Pending Activation
          </div>
          <h2 className="text-2xl font-bold mt-4 text-gray-900 dark:text-white">Step 4: Activate Your Store</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Your store "{formData.name}" has been created. Pay the activation fee to publish it.
          </p>
        </div>
      )}

      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6"
      >
        {renderStepContent()}

        <div className="flex justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={handleBack}
            className={cn(
              "rounded-xl px-6 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2",
              (step === 1 || hasPendingActivation) && "invisible"
            )}
          >
            <ArrowLeft className="size-4" />
            Back
          </button>
          <div className="flex gap-3">
            {step === 1 && !hasPendingActivation && (
              <button
                onClick={handleNext}
                className="rounded-xl bg-[#FDC020] hover:bg-[#e6a800] text-[#191919] px-6 py-2.5 text-sm font-semibold transition-colors flex items-center gap-2"
              >
                Next <ChevronRight className="size-4" />
              </button>
            )}

            {step === 2 && !hasPendingActivation && (
              <button
                onClick={handleNext}
                className="rounded-xl bg-[#FDC020] hover:bg-[#e6a800] text-[#191919] px-6 py-2.5 text-sm font-semibold transition-colors flex items-center gap-2"
              >
                Next <ChevronRight className="size-4" />
              </button>
            )}

            {step === 3 && !hasPendingActivation && (
              <button
                onClick={handleGoToActivation}
                className="rounded-xl bg-[#FDC020] hover:bg-[#e6a800] text-[#191919] px-6 py-2.5 text-sm font-semibold transition-colors flex items-center gap-2"
              >
                Proceed to Activation <ChevronRight className="size-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}