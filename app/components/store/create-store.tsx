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
  Lock,
  Sparkles,
  Wallet,
  Check,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  PartyPopper,
  Rocket,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import PinPopOver from "@/app/components/PinPopOver";
import BVNVerificationBadge from "@/app/components/BVNVerificationBadge";

const ACTIVATION_FEE_NAIRA = 2000;

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
    "w-full rounded-2xl border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold transition-all",
    error ? "border-red-500" : "border-border"
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
    <div>
      <label className="text-sm font-medium block mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {optional && (
          <span className="text-xs text-muted-foreground ml-2">Optional</span>
        )}
      </label>
      {input}
      {hint && !error && (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
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
}: {
  label: string;
  value: string;
  mono?: boolean;
  multiline?: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span
        className={cn(
          "text-sm font-medium sm:text-right sm:max-w-[60%]",
          mono && "font-mono",
          multiline && "whitespace-pre-wrap"
        )}
      >
        {value || "—"}
      </span>
    </div>
  );
}

function Benefit({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <Check className="size-4 text-green-500" />
      <span className="text-background/85">{text}</span>
    </div>
  );
}

// ============================================================
// ✅ CONGRATULATIONS MODAL - FIXED
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
      console.log("🎉 CongratulationsModal opened for:", storeName);
      triggerConfetti();
    }
  }, [isOpen, storeName]);

  const triggerConfetti = () => {
    const end = Date.now() + 3000;
    const colors = [
      "#FDC020",
      "#eab308",
      "#ca8a04",
      "#f59e0b",
      "#d97706",
      "#22c55e",
      "#3b82f6",
      "#ef4444",
      "#8b5cf6",
    ];
    
    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 5,
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
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: colors,
      });
    }, 150);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative max-w-md w-full bg-[#1a1a1a] rounded-3xl border border-gray-800 p-8 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ✅ No close button - user must use action buttons */}

        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-[#e1bf46]/20 rounded-full blur-2xl" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-[#e1bf46]/10">
              <PartyPopper className="size-12 text-[#e1bf46]" />
            </div>
          </div>
        </div>

        <h2 className="font-display text-3xl font-bold text-white">
          🎉 Store Activated!
        </h2>
        
        <p className="mt-3 text-gray-400">
          Your store <span className="font-semibold text-[#e1bf46]">"{storeName}"</span> is now live and ready to accept payments!
        </p>

        <div className="mt-6 p-4 rounded-2xl bg-[#0e0e0e] border border-gray-800 text-left space-y-2">
          <div className="flex items-center gap-3 text-sm">
            <Check className="size-4 text-green-500 shrink-0" />
            <span className="text-gray-300">Your store is now publicly visible</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Check className="size-4 text-green-500 shrink-0" />
            <span className="text-gray-300">You can now accept card payments</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Check className="size-4 text-green-500 shrink-0" />
            <span className="text-gray-300">Your business wallet is ready to receive funds</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Check className="size-4 text-green-500 shrink-0" />
            <span className="text-gray-300">Create unlimited payment pages &amp; products</span>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <button
            onClick={onGoToDashboard}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#e1bf46] px-6 py-4 text-base font-bold text-[#023528] hover:opacity-90 transition-opacity"
          >
            <Rocket className="size-5" />
            Go to Store Dashboard
          </button>
          <button
            onClick={onClose}
            className="w-full rounded-2xl px-6 py-3 text-sm font-medium text-gray-400 hover:bg-[#2a2a2a] transition-colors"
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
  updateStoreCache,  
  refreshStore,     
  clearStoreCache    
} = useStore();
  const { userData, balance, setUserData } = useUserContextData();
  const { openVerificationModal } = useVerificationModal();

  const hasPendingActivation = store !== null && store.isActive === false;
  const hasActiveStore = store !== null && store.isActive === true;

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<StoreFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletCurrency, setWalletCurrency] = useState("NGN");
  const [walletStatus, setWalletStatus] = useState<"checking" | "sufficient" | "insufficient">("checking");
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);
  const [hasLoadedStoreData, setHasLoadedStoreData] = useState(false);

  const [showCongratulations, setShowCongratulations] = useState(false);
  const [activatedStoreName, setActivatedStoreName] = useState("");

  const [isPinOpen, setIsPinOpen] = useState(false);
  const [pin, setPin] = useState<string[]>(Array(4).fill(""));
  const [pinError, setPinError] = useState<string | null>(null);
  const [isPinLoading, setIsPinLoading] = useState(false);

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
      
      getWalletBalance(true);
    }
  }, [store, hasLoadedStoreData]);

  const getWalletBalance = useCallback(async (forceRefresh = false) => {
    try {
      setWalletStatus("checking");
      
      if (!forceRefresh && balance !== null && balance !== undefined) {
        const currentBalance = typeof balance === 'number' ? balance : Number(balance) || 0;
        setWalletBalance(currentBalance);
        setWalletCurrency("NGN");
        setWalletStatus(currentBalance >= ACTIVATION_FEE_NAIRA ? "sufficient" : "insufficient");
        return;
      }

      const response = await fetch("/api/wallet-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: userData?.id,
          nocache: forceRefresh 
        }),
      });

      const data = await response.json();

      if (data.success) {
        const currentBalance = data.wallet_balance || 0;
        setWalletBalance(currentBalance);
        setWalletCurrency(data.currency || "NGN");
        setWalletStatus(currentBalance >= ACTIVATION_FEE_NAIRA ? "sufficient" : "insufficient");
        
        if (currentBalance !== balance) {
          setUserData((prev: any) => ({
            ...prev,
            zidcoinBalance: currentBalance,
            wallet_balance: currentBalance,
          }));
        }
      } else {
        console.error("Failed to fetch wallet balance:", data.error);
        setWalletStatus("insufficient");
      }
    } catch (error) {
      console.error("Failed to fetch wallet balance:", error);
      setWalletStatus("insufficient");
    }
  }, [userData?.id, balance, setUserData]);

  const handleRefreshBalance = async () => {
    setIsRefreshingBalance(true);
    await getWalletBalance(true);
    setIsRefreshingBalance(false);
    toast.success("Balance refreshed");
  };

  const redirectToFundAccount = useCallback(() => {
    router.push("/dashboard/wallet/fund");
  }, [router]);

  useEffect(() => {
    if (step === 4) {
      getWalletBalance();
    }
  }, [step, getWalletBalance]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      try {
        if (isAutofillRef.current) {
          return;
        }

        const target = e.target;
        const { name, type } = target;
        
        if (!name) {
          console.warn('Input change event with no name attribute');
          return;
        }

        let newValue: string | boolean;
        
        if (type === 'checkbox') {
          newValue = (target as HTMLInputElement).checked;
        } else {
          newValue = target.value;
        }
        
        setFormData(prev => {
          const currentValue = prev[name as keyof StoreFormData];
          if (currentValue === newValue) {
            return prev;
          }
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

  useEffect(() => {
    if (step === 4 && !isVerified) {
      openVerificationModal();
    }
  }, [step, isVerified, openVerificationModal]);

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
      if (!formData.description?.trim()) {
        newErrors.description = "Store description is required";
      } else if (formData.description.trim().length < 10) {
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
    console.log("🚀 Go to Dashboard clicked, closing modal");
    setShowCongratulations(false);
    router.push("/dashboard/services/payment/dashboard");
  }, [router]);

 // In CreateStoreForm component - the handlePinConfirm function
const handlePinConfirm = async (code: string) => {
  setIsPinLoading(true);
  setPinError(null);

  try {
    const keywordsArray = formData.keywords
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    const storeData = {
      name: formData.name.trim(),
      slug: formData.slug.trim(),
      description: formData.description.trim(),
      keywords: keywordsArray,
      cacNumber: formData.cacNumber.trim() || undefined,
      country: formData.country,
      state: formData.state.trim(),
      city: formData.city.trim(),
      streetAddress: formData.streetAddress.trim(),
      locationEnabled: formData.locationEnabled,
    };

    console.log("📦 Sending storeData to API:", storeData);

    const response = await fetch("/api/store/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pin: code,
        storeData: storeData,
      }),
    });

    const data = await response.json();
    console.log("📡 API Response:", data);

    if (!response.ok) {
      if (response.status === 403 && data.locked) {
        throw {
          message: data.error,
          locked: data.locked,
          lockedUntil: data.lockedUntil,
          attempts: data.attempts,
        };
      }
      throw new Error(data.error || "Activation failed");
    }

    // ✅ After successful activation, update the store cache
    if (data.store) {
      const mappedStore = {
        id: data.store.id,
        name: data.store.name,
        slug: data.store.slug,
        description: data.store.description || "",
        keywords: data.store.keywords || [],
        cacNumber: data.store.cac_number,
        country: data.store.country || "Nigeria",
        state: data.store.state || "",
        city: data.store.city || "",
        streetAddress: data.store.street_address || "",
        locationEnabled: data.store.location_enabled !== false,
        isActive: true,
        is_active: true,
        activation_paid: true,
        createdAt: data.store.created_at || new Date().toISOString(),
        ownerId: userData?.id || "",
        walletBalance: data.store.wallet_balance || 0,
        totalRevenue: data.store.total_revenue || 0,
        totalOrders: data.store.total_orders || 0,
        totalViews: data.store.total_views || 0,
      };

      // ✅ Update the store in context and cache
      updateStoreCache(mappedStore);
      
      console.log("✅ Store cached after activation:", mappedStore.slug);
      console.log("📊 Store data cached:", {
        id: mappedStore.id,
        name: mappedStore.name,
        slug: mappedStore.slug,
        isActive: mappedStore.isActive,
        activation_paid: mappedStore.activation_paid,
      });
    }

    setIsPinOpen(false);
    setPin(Array(4).fill(""));
    
    const storeName = data.store?.name || formData.name.trim() || "Your Store";
    console.log("🏪 Store activated:", storeName);
    
    // ✅ Set the store name and show modal
    setActivatedStoreName(storeName);
    
    // ✅ Refresh store data from API (will also update cache)
    await refreshStore();
    await getWalletBalance(true);
    
    // ✅ Show the congratulations modal
    console.log("🎉 Showing congratulations modal for:", storeName);
    setShowCongratulations(true);
    
  } catch (error: any) {
    console.error("❌ Activation error:", error);
    
    if (error.locked) {
      await Swal.fire({
        icon: "error",
        title: "PIN Locked",
        text: error.message || "Your PIN has been locked. Please reset your PIN.",
        confirmButtonColor: "#e1bf46",
      });
      throw error;
    } else if (error.message?.includes("PIN")) {
      throw error;
    } else {
      await Swal.fire({
        icon: "error",
        title: "Activation Failed",
        text: error.message || "Something went wrong. Please try again.",
        confirmButtonColor: "#e1bf46",
      });
    }
  } finally {
    setIsPinLoading(false);
  }
};


  const handleActivate = useCallback(async () => {
    if (!hasPendingActivation) {
      if (!validateStep(1) || !validateStep(2)) {
        await Swal.fire({
          icon: "warning",
          title: "Incomplete Form",
          text: "Please complete all required fields before proceeding.",
          confirmButtonColor: "#e1bf46",
        });
        return;
      }
    }

    if (!isVerified) {
      openVerificationModal();
      return;
    }

    if (walletStatus === "insufficient") {
      await Swal.fire({
        icon: "warning",
        title: "Insufficient Balance",
        text: `You need ₦${ACTIVATION_FEE_NAIRA.toLocaleString()} to activate your store. Please fund your wallet first.`,
        confirmButtonColor: "#e1bf46",
        confirmButtonText: "Add Funds",
      }).then((result) => {
        if (result.isConfirmed) {
          redirectToFundAccount();
        }
      });
      return;
    }

    setPin(Array(4).fill(""));
    setPinError(null);
    setIsPinOpen(true);
    
  }, [isVerified, openVerificationModal, walletStatus, redirectToFundAccount, validateStep, hasPendingActivation]);

  const isWorking = isCreating || creatingStore || isActivating;

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
              <h2 className="font-display text-xl font-bold">Store / Brand Details</h2>
              <p className="text-sm text-muted-foreground">
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
                <div className="flex items-center rounded-2xl border border-border bg-background focus-within:ring-2 focus-within:ring-gold transition-all overflow-hidden">
                  <span className="px-3 text-sm text-muted-foreground bg-muted/50 py-3 whitespace-nowrap">
                    zidwell.com/
                  </span>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleSlugChange}
                    onBlur={handleBlur}
                    placeholder="your-store"
                    className="flex-1 bg-transparent px-3 py-3 text-sm focus:outline-none"
                    autoComplete="off"
                  />
                </div>
              }
            />

            <Field
              label="Store Description"
              required
              error={errors.description}
              hint="Describe what your business is all about to potential customers."
              input={
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="We sell fresh, organic fruit juice made daily in Lagos..."
                  rows={3}
                  className={cn(inputClass(errors.description), "resize-none")}
                  autoComplete="off"
                />
              }
            />

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

            <Field
              label="CAC Number (RC or BN)"
              optional
              hint="Optional. Helps verify your business."
              input={
                <input
                  type="text"
                  name="cacNumber"
                  value={formData.cacNumber}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="RC123456"
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
              <h2 className="font-display text-xl font-bold">Location Details</h2>
              <p className="text-sm text-muted-foreground">
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

            <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Shield className="size-4 text-gold" />
                  <p className="font-medium text-sm">
                    Allow precise location
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Zidwell would like to use your precise location for better delivery and customer matching.
                </p>
              </div>
              <label 
                className="relative inline-flex items-center cursor-pointer ml-3 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  name="locationEnabled"
                  checked={formData.locationEnabled}
                  onChange={handleInputChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer-checked:bg-gold transition-colors duration-200">
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
              <h2 className="font-display text-xl font-bold">Review Your Store</h2>
              <p className="text-sm text-muted-foreground">
                Confirm everything looks correct before activation.
              </p>
            </div>

            <div className="rounded-2xl bg-muted/30 p-5 space-y-4 border border-border">
              <ReviewRow label="Store Name" value={formData.name} />
              <ReviewRow label="Store URL" value={`zidwell.com/${formData.slug}`} mono />
              <ReviewRow
                label="Location"
                value={`${formData.city}, ${formData.state}, ${formData.country}`}
              />
              <ReviewRow label="Address" value={formData.streetAddress} />
              <ReviewRow
                label="Description"
                value={formData.description}
                multiline
              />
              {formData.keywords && (
                <ReviewRow label="Keywords" value={formData.keywords} />
              )}
              {formData.cacNumber && (
                <ReviewRow label="CAC Number" value={formData.cacNumber} />
              )}
              <ReviewRow
                label="Precise location"
                value={formData.locationEnabled ? "Enabled" : "Disabled"}
              />
            </div>

            <div className="rounded-2xl border border-gold/30 bg-gold/5 p-4 text-sm">
              <p className="text-muted-foreground">
                A one-time activation fee of{" "}
                <span className="font-bold text-foreground">
                  ₦{ACTIVATION_FEE_NAIRA.toLocaleString()}
                </span>{" "}
                will be deducted from your wallet to activate your store.
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-5">
            <div className="text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/10 mx-auto">
                <Sparkles className="size-7 text-gold" />
              </div>
              <h2 className="font-display text-2xl font-bold mt-4">
                {hasPendingActivation ? "Complete Your Store Activation" : "Activate Your Store"}
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                {hasPendingActivation 
                  ? "Your store has been created. Pay the activation fee to publish it."
                  : "Pay a one-time activation fee from your wallet to publish your store."
                }
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-foreground text-background p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-background/60 text-xs uppercase tracking-widest font-semibold">
                    Activation Fee
                  </p>
                  <p className="font-display text-4xl font-bold mt-2">
                    ₦{ACTIVATION_FEE_NAIRA.toLocaleString()}
                  </p>
                </div>
                <CreditCard className="size-10 text-gold shrink-0" />
              </div>
              <div className="mt-5 pt-5 border-t border-background/15 space-y-2 text-sm">
                <Benefit text="Publish your public store page" />
                <Benefit text="Accept card payments" />
                <Benefit text="Free business wallet to receive funds" />
                <Benefit text="Unlimited payment pages & products" />
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wallet className="size-5 text-gold" />
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-widest font-semibold">
                      Wallet Balance
                    </p>
                    <p className="font-display text-3xl font-bold">
                      ₦{walletBalance.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {walletCurrency}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRefreshBalance}
                  disabled={isRefreshingBalance}
                  className="rounded-full p-2 hover:bg-muted transition-colors"
                  aria-label="Refresh balance"
                >
                  <RefreshCw className={cn("size-4", isRefreshingBalance && "animate-spin")} />
                </button>
              </div>
              {walletStatus === "insufficient" && (
                <p className="mt-2 text-sm text-red-500">
                  Insufficient balance.{" "}
                  <span 
                    className="font-medium cursor-pointer hover:underline" 
                    onClick={redirectToFundAccount}
                  >
                    Add Funds
                  </span>{" "}
                  to cover the activation fee.
                </p>
              )}
              {walletStatus === "sufficient" && (
                <p className="mt-2 text-sm text-green-500">
                  ✓ Sufficient balance for activation.
                </p>
              )}
              {walletStatus === "checking" && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Checking wallet balance...
                </p>
              )}
            </div>

            {!isVerified && (
              <div className="rounded-2xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-4">
                <div className="flex items-start gap-3">
                  <Lock className="size-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-amber-900 dark:text-amber-200">
                      BVN verification required
                    </p>
                    <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
                      We need to verify your BVN before activating your store.
                    </p>
                    <button
                      onClick={openVerificationModal}
                      className="mt-3 inline-flex items-center gap-2 rounded-xl bg-amber-600 text-white px-4 py-2 text-xs font-bold hover:bg-amber-700"
                    >
                      Verify BVN Now
                    </button>
                  </div>
                </div>
              </div>
            )}

            {isVerified && (
              <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-4 flex items-center gap-3">
                <Check className="size-5 text-green-500 shrink-0" />
                <p className="text-sm font-medium">
                  BVN verified. You&apos;re ready to activate.
                </p>
              </div>
            )}

            <button
              onClick={handleActivate}
              disabled={isWorking || !isVerified || walletStatus !== "sufficient"}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gold px-6 py-4 text-base font-bold text-gold-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isActivating ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Activating...
                </>
              ) : (
                <>
                  <Lock className="size-5" />
                  {hasPendingActivation ? "Complete Activation" : "Activate & Publish"}
                </>
              )}
            </button>

            <p className="text-center text-xs text-muted-foreground">
              Your wallet will be debited ₦{ACTIVATION_FEE_NAIRA.toLocaleString()} for activation.
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
    walletBalance, 
    walletCurrency, 
    walletStatus,
    isRefreshingBalance,
    hasPendingActivation,
    handleInputChange, 
    handleSlugChange, 
    handleBlur,
    redirectToFundAccount,
    openVerificationModal,
    handleActivate,
    handleRefreshBalance,
  ]);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* ✅ Congratulations Modal with AnimatePresence for smooth transitions */}
      <AnimatePresence>
        <CongratulationsModal
          isOpen={showCongratulations}
          onClose={() => {
            console.log("🔴 Closing modal - I'll check it out later");
            setShowCongratulations(false);
          }}
          storeName={activatedStoreName}
          onGoToDashboard={goToDashboard}
        />
      </AnimatePresence>

      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gold/10">
            <Store className="size-8 text-gold" />
          </div>
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
          {hasPendingActivation ? "Complete Your Store Activation" : "Create Your Online Store"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {hasPendingActivation 
            ? "Your store is almost ready! Pay the activation fee to publish it."
            : "Set up your store and activate it to start accepting payments"
          }
        </p>
      </div>

      {/* ⚠️ BVN BADGE - Store creation - CANNOT BE DISMISSED */}
      <BVNVerificationBadge variant="store" className="mb-6" dismissable={false} />

      {/* If not verified, show locked state - NO WAY TO SKIP */}
      {!isVerified ? (
        <div className="bg-[#1a1a1a] rounded-3xl border border-gray-800 p-8 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Verify Your BVN First
          </h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            You need to verify your BVN before you can create a store and start 
            accepting payments. It only takes a few minutes.
          </p>
          <p className="text-sm text-red-400 mb-4 font-medium">
            ⚠️ This step is required. You cannot create a store without BVN verification.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={openVerificationModal}
              className="bg-[#e1bf46] text-[#023528] hover:bg-[#e1bf46]/90 font-semibold rounded-2xl px-6 py-3 flex items-center gap-2"
            >
              <Shield className="h-4 w-4 mr-2" />
              Verify BVN Now
            </button>
          </div>
          <div className="mt-6 p-4 bg-blue-900/20 rounded-xl border border-blue-800/30 text-left">
            <p className="text-xs text-blue-400">
              💡 <strong>Why do I need to verify my BVN?</strong> BVN verification helps us 
              ensure the security of your funds and comply with financial regulations. 
              Your BVN is encrypted and securely stored.
            </p>
          </div>
        </div>
      ) : (
        <>
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
                        s.n === step && "bg-gold text-gold-foreground",
                        s.n < step && "bg-green-500/20 text-green-500",
                        s.n > step && "bg-muted text-muted-foreground"
                      )}
                    >
                      {s.n < step ? <Check className="size-4" /> : s.n}
                    </div>
                    <span className="mt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground hidden sm:block">
                      {s.label}
                    </span>
                  </div>
                  {i < arr.length - 1 && (
                    <div
                      className={cn(
                        "h-0.5 w-8 sm:w-12 mx-1 sm:mx-2",
                        s.n < step ? "bg-green-500/50" : "bg-muted"
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {hasPendingActivation && (
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-sm font-medium">
                <AlertCircle className="size-4" />
                Pending Activation
              </div>
              <h2 className="font-display text-2xl font-bold mt-4">Step 4: Activate Your Store</h2>
              <p className="text-sm text-muted-foreground">
                Your store "{formData.name}" has been created. Pay the activation fee to publish it.
              </p>
            </div>
          )}

          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-3xl border border-border bg-card p-6"
          >
            {renderStepContent()}

            <div className="flex justify-between mt-6 pt-6 border-t border-border">
              <button
                onClick={handleBack}
                className={cn(
                  "rounded-2xl px-6 py-2.5 text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2",
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
                    className="rounded-2xl bg-gold px-6 py-2.5 text-sm font-bold text-gold-foreground hover:opacity-90 transition-opacity flex items-center gap-2"
                  >
                    Next <ChevronRight className="size-4" />
                  </button>
                )}

                {step === 2 && !hasPendingActivation && (
                  <button
                    onClick={handleNext}
                    className="rounded-2xl bg-gold px-6 py-2.5 text-sm font-bold text-gold-foreground hover:opacity-90 transition-opacity flex items-center gap-2"
                  >
                    Next <ChevronRight className="size-4" />
                  </button>
                )}

                {step === 3 && !hasPendingActivation && (
                  <button
                    onClick={handleGoToActivation}
                    className="rounded-2xl bg-gold px-6 py-2.5 text-sm font-bold text-gold-foreground hover:opacity-90 transition-opacity flex items-center gap-2"
                  >
                    Proceed to Activation <ChevronRight className="size-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}

      <PinPopOver
        isOpen={isPinOpen}
        setIsOpen={setIsPinOpen}
        pin={pin}
        setPin={setPin}
        inputCount={4}
        onConfirm={handlePinConfirm}
        error={pinError}
        onClearError={() => setPinError(null)}
        isLoading={isPinLoading}
      />
    </div>
  );
}