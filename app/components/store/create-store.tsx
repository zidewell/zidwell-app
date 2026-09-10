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
  Save,
  CheckCircle2,
  AlertTriangle,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
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
  latitude: number | null;
  longitude: number | null;
  locationAccuracy: number | null;
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
  locationEnabled: false, // ✅ default OFF — don't auto-prompt
  latitude: null,
  longitude: null,
  locationAccuracy: null,
};

// ✅ Shared input styling (matches login page)
function inputClass(error?: string) {
  return cn(
    "w-full px-3 py-2 border bg-(--bg-primary) text-(--text-primary) rounded-md focus:outline-none focus:ring-2 focus:ring-(--color-accent-yellow) focus:border-(--color-accent-yellow) squircle-md",
    error ? "border-red-500" : "border-(--border-color)"
  );
}

function FieldLabel({
  label,
  required,
  optional,
  hint,
  error,
  htmlFor,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  error?: string;
  htmlFor?: string;
}) {
  return (
    <>
      <Label
        htmlFor={htmlFor}
        className="text-sm font-medium text-(--text-primary) block mb-1"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {optional && (
          <span className="text-xs text-(--text-secondary) ml-2">
            Optional
          </span>
        )}
      </Label>
      {hint && !error && (
        <p className="mb-1 text-xs text-(--text-secondary)">{hint}</p>
      )}
      {error && (
        <p className="mb-1 text-sm text-destructive flex items-center gap-1">
          <AlertCircle className="size-3" /> {error}
        </p>
      )}
    </>
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
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 py-2 border-b border-(--border-color) last:border-0">
      <span className="text-sm text-(--text-secondary) shrink-0 font-medium min-w-[120px]">
        {label}
      </span>
      <div className="flex-1">
        {html ? (
          <div
            className="text-sm font-medium prose prose-sm dark:prose-invert max-w-none
              prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5
              prose-strong:text-(--text-primary)"
            dangerouslySetInnerHTML={{ __html: value || "—" }}
          />
        ) : (
          <span
            className={cn(
              "text-sm font-medium text-(--text-primary)",
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
      <CheckCircle2 className="size-4 text-green-500" />
      <span className="text-white/85 text-sm">{text}</span>
    </div>
  );
}

// ============================================================
// CONGRATULATIONS MODAL
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
        className="relative max-w-md w-full bg-(--bg-primary) rounded-2xl border border-(--border-color) p-8 text-center shadow-2xl"
      >
        <div className="flex justify-center mb-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-yellow-500/10">
            <PartyPopper className="size-12 text-yellow-500" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-(--text-primary)">
          Store Activated
        </h2>

        <p className="mt-3 text-(--text-secondary)">
          Your store{" "}
          <span className="font-semibold text-(--color-accent-yellow)">
            "{storeName}"
          </span>{" "}
          is now live and ready to accept payments.
        </p>

        <div className="mt-6 p-4 rounded-xl bg-(--bg-secondary) border border-(--border-color) text-left space-y-2">
          <div className="flex items-center gap-3 text-sm">
            <CheckCircle2 className="size-4 text-green-500 shrink-0" />
            <span className="text-(--text-primary)">
              Your store is now publicly visible
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <CheckCircle2 className="size-4 text-green-500 shrink-0" />
            <span className="text-(--text-primary)">
              You can now accept card payments
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <CheckCircle2 className="size-4 text-green-500 shrink-0" />
            <span className="text-(--text-primary)">
              Your business wallet is ready to receive funds
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <CheckCircle2 className="size-4 text-green-500 shrink-0" />
            <span className="text-(--text-primary)">
              Create unlimited payment pages &amp; products
            </span>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <button
            onClick={onGoToDashboard}
            className="w-full rounded-xl bg-(--color-accent-yellow) hover:bg-(--color-accent-yellow)/90 text-(--color-ink) px-6 py-3 text-sm font-semibold transition-colors"
          >
            <Rocket className="size-4 inline mr-2" />
            Go to Store Dashboard
          </button>
          <button
            onClick={onClose}
            className="w-full rounded-xl px-6 py-3 text-sm font-medium text-(--text-secondary) hover:bg-(--bg-secondary) transition-colors"
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
  const { createStore, creatingStore, store, fetchStore } = useStore();
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

  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

  // ✅ Draft state
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [hasExistingDraft, setHasExistingDraft] = useState(false);

  // ✅ Location capture state
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const totalSteps = 4;
  const isVerified = userData?.bvnVerification === "verified";

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
        // ✅ cast for safety — StoreData type may not declare these yet
        latitude: (store as any).latitude ?? null,
        longitude: (store as any).longitude ?? null,
        locationAccuracy: (store as any).locationAccuracy ?? null,
      });

      setHasLoadedStoreData(true);
      setStep(4);
    }
  }, [store, hasLoadedStoreData]);

  // ✅ Restore store-create draft from DB
  useEffect(() => {
    if (hasPendingActivation || hasActiveStore) return;
    if (draftLoaded) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/store/create-draft", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;

        const draft = data?.draft;
        if (draft) {
          setFormData({
            name: draft.name || "",
            slug: draft.slug || "",
            description: draft.description || "",
            keywords: Array.isArray(draft.keywords)
              ? draft.keywords.join(", ")
              : "",
            cacNumber: draft.cac_number || "",
            country: draft.country || "Nigeria",
            state: draft.state || "",
            city: draft.city || "",
            streetAddress: draft.street_address || "",
            locationEnabled: draft.location_enabled !== false,
            latitude: draft.latitude ?? null,
            longitude: draft.longitude ?? null,
            locationAccuracy: draft.location_accuracy ?? null,
          });
          if (draft.step >= 1 && draft.step <= 3) {
            setStep(draft.step);
          }
          setHasExistingDraft(true);
          toast.success("Draft restored", {
            description: "We restored your previously saved store details.",
          });
        }
      } catch (e) {
        console.error("Failed to restore create draft:", e);
      } finally {
        if (!cancelled) setDraftLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPendingActivation, hasActiveStore]);

  // ✅ Simplified input handler — no dead code, accepts autofill
  const handleInputChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      const { name, type } = e.target;
      if (!name) return;

      const newValue =
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : e.target.value;

      setFormData((prev) =>
        prev[name as keyof StoreFormData] === newValue
          ? prev
          : { ...prev, [name]: newValue }
      );

      if (errors[name]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[name];
          return next;
        });
      }
    },
    [errors]
  );

  const handleDescriptionChange = useCallback(
    (value: string) => {
      setFormData((prev) => ({ ...prev, description: value }));

      if (errors.description) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.description;
          return newErrors;
        });
      }
    },
    [errors.description]
  );

  const handleSlugChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "")
        .replace(/\s/g, "-")
        .replace(/-+/g, "-");

      setFormData((prev) => ({ ...prev, slug: value }));

      if (errors.slug) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.slug;
          return newErrors;
        });
      }
    },
    [errors.slug]
  );

  // ============================================================
  // ✅ PRECISE LOCATION
  // ============================================================
  const requestPreciseLocation = useCallback(async (): Promise<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null> => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationError("Geolocation is not supported on this device.");
      toast.error("Geolocation not supported");
      return null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setLocationError(null);
          resolve({ latitude, longitude, accuracy });
        },
        (error) => {
          let msg = "Could not get your location.";
          if (error.code === error.PERMISSION_DENIED) {
            msg = "Location permission denied. Enable it in your browser settings.";
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            msg = "Location information is unavailable.";
          } else if (error.code === error.TIMEOUT) {
            msg = "Location request timed out.";
          }
          setLocationError(msg);
          toast.error("Location unavailable", { description: msg });
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }, []);

  const handleLocationToggle = useCallback(
    async (checked: boolean) => {
      if (!checked) {
        setFormData((prev) => ({
          ...prev,
          locationEnabled: false,
          latitude: null,
          longitude: null,
          locationAccuracy: null,
        }));
        setLocationError(null);
        return;
      }

      setLocationLoading(true);
      try {
        const coords = await requestPreciseLocation();
        if (coords) {
          setFormData((prev) => ({
            ...prev,
            locationEnabled: true,
            latitude: coords.latitude,
            longitude: coords.longitude,
            locationAccuracy: coords.accuracy,
          }));
          toast.success("Location captured");
        } else {
          // Permission denied or failed → revert toggle
          setFormData((prev) => ({ ...prev, locationEnabled: false }));
        }
      } finally {
        setLocationLoading(false);
      }
    },
    [requestPreciseLocation]
  );

  const validateStep = useCallback(
    (stepNumber: number) => {
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
        const cleanDescription = formData.description
          .replace(/<[^>]*>/g, "")
          .trim();
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
    },
    [formData]
  );

  const handleNext = useCallback(() => {
    if (validateStep(step)) {
      setStep((s) => Math.min(s + 1, totalSteps));
    }
  }, [step, validateStep]);

  const handleBack = useCallback(() => {
    setStep((s) => Math.max(s - 1, 1));
  }, []);

  // ✅ Save & Continue Later (DB-backed)
  const handleSaveAndContinueLater = useCallback(async () => {
    if (savingDraft) return;
    setSavingDraft(true);

    try {
      const keywordsArray = formData.keywords
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k.length > 0);

      const res = await fetch("/api/store/create-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          description: formData.description,
          keywords: keywordsArray,
          cacNumber: formData.cacNumber.trim(),
          country: formData.country,
          state: formData.state.trim(),
          city: formData.city.trim(),
          streetAddress: formData.streetAddress.trim(),
          locationEnabled: formData.locationEnabled,
          latitude: formData.latitude,
          longitude: formData.longitude,
          locationAccuracy: formData.locationAccuracy,
          step,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save draft");
      }

      setHasExistingDraft(true);
      toast.success("Saved", {
        description: "Your progress has been saved. You can continue later.",
      });
      router.push("/dashboard/services/payment/dashboard");
    } catch (e: any) {
      console.error("Failed to save create draft:", e);
      toast.error("Could not save your progress", {
        description: e.message || "Please try again.",
      });
    } finally {
      setSavingDraft(false);
    }
  }, [formData, step, router, savingDraft]);

  // ✅ Discard draft
  const handleDiscardDraft = useCallback(async () => {
    try {
      await fetch("/api/store/create-draft", { method: "DELETE" });
      setHasExistingDraft(false);
      setFormData(initialFormData);
      setStep(1);
      setErrors({});
      setLocationError(null);
      toast.success("Draft discarded", {
        description: "You can start fresh.",
      });
    } catch (e) {
      console.error("Failed to discard draft:", e);
      toast.error("Could not discard draft");
    }
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
        latitude: formData.latitude,
        longitude: formData.longitude,
        locationAccuracy: formData.locationAccuracy,
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
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);

      await Swal.fire({
        icon: "error",
        title: "Payment Initiation Failed",
        text: error.message || "Something went wrong. Please try again.",
        confirmButtonColor: "#6b7280",
      });

      setIsProcessingCheckout(false);
    }
  }, [hasPendingActivation, validateStep, formData]);

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

    await handleCheckoutPayment();
  }, [hasPendingActivation, validateStep, handleCheckoutPayment]);

  const isWorking =
    isCreating || creatingStore || isActivating || isProcessingCheckout;

  if (hasActiveStore) {
    return null;
  }

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-(--text-primary)">
                Store / Brand Details
              </h2>
              <p className="text-sm text-(--text-secondary)">
                Tell customers about your brand. The name appears publicly.
              </p>
            </div>

            <div className="space-y-1">
              <FieldLabel
                label="Store / Brand Name"
                required
                error={errors.name}
                htmlFor="name"
              />
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Juice Hub"
                autoComplete="organization"
                disabled={isWorking}
                className={inputClass(errors.name)}
                style={{ outline: "none", boxShadow: "none" }}
              />
            </div>

            <div className="space-y-1">
              <FieldLabel
                label="Store URL / Slug"
                required
                error={errors.slug}
                htmlFor="slug"
              />
              <div className="flex items-center rounded-md border border-(--border-color) bg-(--bg-primary) focus-within:ring-2 focus-within:ring-(--color-accent-yellow) focus-within:border-(--color-accent-yellow) transition-all overflow-hidden squircle-md">
                <span className="px-3 text-sm text-(--text-secondary) bg-(--bg-secondary) py-2 whitespace-nowrap">
                  zidwell.com/
                </span>
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  value={formData.slug}
                  onChange={handleSlugChange}
                  placeholder="your-store"
                  autoComplete="off"
                  disabled={isWorking}
                  className="flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none text-(--text-primary)"
                  style={{ outline: "none", boxShadow: "none" }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label
                htmlFor="description"
                className="text-sm font-medium text-(--text-primary) block mb-1"
              >
                Store Description <span className="text-red-500 ml-1">*</span>
              </Label>
              <RichTextArea
                value={formData.description}
                onChange={handleDescriptionChange}
                placeholder="Describe what your business is all about to potential customers..."
                minHeight="180px"
                maxHeight="350px"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="size-3" /> {errors.description}
                </p>
              )}
              <p className="mt-2 text-xs text-(--text-secondary)">
                Use the toolbar to format your description (bold, italic, lists,
                etc.)
              </p>
            </div>

            <div className="space-y-1">
              <FieldLabel
                label="Keywords"
                hint="Words or phrases describing your business, separated by commas."
                htmlFor="keywords"
              />
              <Input
                id="keywords"
                name="keywords"
                type="text"
                value={formData.keywords}
                onChange={handleInputChange}
                placeholder="fruit juice seller, fruit vendor, juice delivery Lagos"
                autoComplete="off"
                disabled={isWorking}
                className={inputClass()}
                style={{ outline: "none", boxShadow: "none" }}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-(--text-primary)">
                Location Details
              </h2>
              <p className="text-sm text-(--text-secondary)">
                Where is your store based?
              </p>
            </div>

            <div className="space-y-1">
              <FieldLabel
                label="Country"
                required
                error={errors.country}
                htmlFor="country"
              />
              <select
                id="country"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                autoComplete="country"
                disabled={isWorking}
                className={inputClass(errors.country)}
                style={{ outline: "none", boxShadow: "none" }}
              >
                <option value="Nigeria">Nigeria</option>
                <option value="Ghana">Ghana</option>
                <option value="Kenya">Kenya</option>
                <option value="South Africa">South Africa</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="United States">United States</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <FieldLabel
                  label="State"
                  required
                  error={errors.state}
                  htmlFor="state"
                />
                <Input
                  id="state"
                  name="state"
                  type="text"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="e.g., Lagos"
                  autoComplete="address-level1"
                  disabled={isWorking}
                  className={inputClass(errors.state)}
                  style={{ outline: "none", boxShadow: "none" }}
                />
              </div>

              <div className="space-y-1">
                <FieldLabel
                  label="City"
                  required
                  error={errors.city}
                  htmlFor="city"
                />
                <Input
                  id="city"
                  name="city"
                  type="text"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="e.g., Ikeja"
                  autoComplete="address-level2"
                  disabled={isWorking}
                  className={inputClass(errors.city)}
                  style={{ outline: "none", boxShadow: "none" }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <FieldLabel
                label="Street Address"
                required
                error={errors.streetAddress}
                htmlFor="streetAddress"
              />
              <Input
                id="streetAddress"
                name="streetAddress"
                type="text"
                value={formData.streetAddress}
                onChange={handleInputChange}
                placeholder="e.g., 123 Main Street"
                autoComplete="street-address"
                disabled={isWorking}
                className={inputClass(errors.streetAddress)}
                style={{ outline: "none", boxShadow: "none" }}
              />
            </div>

            {/* ✅ PRECISE LOCATION TOGGLE */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-(--bg-secondary) border border-(--border-color)">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-(--text-secondary)" />
                  <p className="font-medium text-sm text-(--text-primary)">
                    Allow precise location
                  </p>
                </div>
                <p className="text-xs text-(--text-secondary) mt-1">
                  Zidwell would like to use your precise location for better
                  delivery and customer matching.
                </p>

                {formData.latitude != null && formData.longitude != null && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                    Captured: {formData.latitude.toFixed(5)},{" "}
                    {formData.longitude.toFixed(5)}
                    {formData.locationAccuracy
                      ? ` (±${Math.round(formData.locationAccuracy)}m)`
                      : ""}
                  </p>
                )}

                {locationError && (
                  <p className="text-xs text-red-500 mt-2">{locationError}</p>
                )}
              </div>

              <label
                className={cn(
                  "relative inline-flex items-center ml-3 shrink-0",
                  locationLoading ? "cursor-wait" : "cursor-pointer"
                )}
              >
                <input
                  type="checkbox"
                  checked={formData.locationEnabled}
                  onChange={(e) => handleLocationToggle(e.target.checked)}
                  disabled={locationLoading || isWorking}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer-checked:bg-(--color-accent-yellow) transition-colors duration-200 relative">
                  <div
                    className={cn(
                      "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 flex items-center justify-center",
                      formData.locationEnabled && "translate-x-5"
                    )}
                  >
                    {locationLoading && (
                      <Loader2 className="size-2.5 animate-spin text-gray-700" />
                    )}
                  </div>
                </div>
              </label>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-(--text-primary)">
                Review Your Store
              </h2>
              <p className="text-sm text-(--text-secondary)">
                Confirm everything looks correct before activation.
              </p>
            </div>

            <div className="rounded-xl bg-(--bg-secondary) p-5 space-y-1 border border-(--border-color)">
              <ReviewRow label="Store Name" value={formData.name} />
              <ReviewRow
                label="Store URL"
                value={`zidwell.com/${formData.slug}`}
                mono
              />
              <ReviewRow
                label="Location"
                value={`${formData.city}, ${formData.state}, ${formData.country}`}
              />
              <ReviewRow label="Address" value={formData.streetAddress} />

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 py-2 border-b border-(--border-color) last:border-0">
                <span className="text-sm text-(--text-secondary) shrink-0 font-medium min-w-[120px]">
                  Description
                </span>
                <div className="flex-1">
                  {formData.description ? (
                    <div
                      className="text-sm font-medium prose prose-sm dark:prose-invert max-w-none
                        prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5
                        prose-strong:text-(--text-primary)"
                      dangerouslySetInnerHTML={{
                        __html: formData.description,
                      }}
                    />
                  ) : (
                    <span className="text-sm text-(--text-secondary)">
                      No description provided
                    </span>
                  )}
                </div>
              </div>

              {formData.keywords && (
                <ReviewRow label="Keywords" value={formData.keywords} />
              )}
              <ReviewRow
                label="Precise location"
                value={
                  formData.locationEnabled && formData.latitude != null
                    ? `Enabled (${formData.latitude.toFixed(4)}, ${formData.longitude?.toFixed(4)})`
                    : "Disabled"
                }
              />
            </div>

            <div className="rounded-xl border border-(--border-color) bg-(--bg-secondary) p-4 text-sm">
              <p className="text-(--text-secondary)">
                A one-time activation fee of{" "}
                <span className="font-bold text-(--text-primary)">
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
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-(--bg-secondary) mx-auto">
                <Sparkles className="size-7 text-(--text-secondary)" />
              </div>
              <h2 className="text-2xl font-bold mt-4 text-(--text-primary)">
                {hasPendingActivation
                  ? "Complete Your Store Activation"
                  : "Activate Your Store"}
              </h2>
              <p className="text-sm text-(--text-secondary) mt-2">
                {hasPendingActivation
                  ? "Your store has been created. Pay the activation fee to publish it."
                  : "Pay a one-time activation fee via card to publish your store."}
              </p>
            </div>

            <div className="rounded-xl border border-(--border-color) bg-[#191919] text-white p-6">
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
                <CheckCircle2 className="size-5 text-green-500 shrink-0" />
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  BVN verified. You're ready to activate.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 p-4 flex items-center gap-3">
                <AlertTriangle className="size-5 text-yellow-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                    User credentials not verified
                  </p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-500">
                    You can still activate your store. Verify later to enable
                    withdrawals.
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
              className="w-full rounded-xl bg-(--color-accent-yellow) hover:bg-(--color-accent-yellow)/90 text-(--color-ink) px-6 py-4 text-base font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isActivating || isProcessingCheckout ? (
                <>
                  <Loader2 className="size-5 inline mr-2 animate-spin" />
                  {isProcessingCheckout ? "Preparing Checkout..." : "Activating..."}
                </>
              ) : (
                <>
                  <CreditCard className="size-5 inline mr-2" />
                  {hasPendingActivation
                    ? "Pay & Activate"
                    : "Pay Now & Activate Store"}
                </>
              )}
            </button>

            <p className="text-center text-xs text-(--text-secondary)">
              You will be redirected to pay ₦
              {ACTIVATION_FEE_NAIRA.toLocaleString()} via card.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* ✅ Top-left back arrow */}
      <button
        onClick={() => router.back()}
        type="button"
        aria-label="Go back"
        title="Go back"
        className="mb-4 inline-flex items-center justify-center text-(--text-secondary) hover:text-(--text-primary) transition-colors"
      >
        <ArrowLeft className="size-6" />
      </button>

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
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-(--bg-secondary)">
            <Store className="size-8 text-(--text-secondary)" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-(--text-primary) sm:text-4xl">
          {hasPendingActivation
            ? "Complete Your Store Activation"
            : "Create Your Online Store"}
        </h1>
        <p className="mt-2 text-(--text-secondary)">
          {hasPendingActivation
            ? "Your store is almost ready! Pay the activation fee to publish it."
            : "Set up your store and activate it to start accepting payments"}
        </p>
      </div>

      <BVNVerificationBadge
        variant="store"
        className="mb-6"
        dismissable={true}
      />

      {/* ✅ Draft restored banner */}
      {hasExistingDraft && !hasPendingActivation && step <= 3 && (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/20 px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <AlertCircle className="size-4 shrink-0" />
            <span>Continuing from your saved draft.</span>
          </div>
          <button
            onClick={handleDiscardDraft}
            type="button"
            className="text-xs font-semibold text-blue-700 dark:text-blue-300 hover:underline"
          >
            Start over
          </button>
        </div>
      )}

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
                    s.n === step && "bg-(--color-accent-yellow) text-(--color-ink)",
                    s.n < step &&
                      "bg-(--bg-secondary) text-(--text-primary)",
                    s.n > step &&
                      "bg-(--bg-secondary) text-(--text-secondary) opacity-50"
                  )}
                >
                  {s.n < step ? <Check className="size-4" /> : s.n}
                </div>
                <span className="mt-1 text-[10px] font-medium uppercase tracking-wide text-(--text-secondary) hidden sm:block">
                  {s.label}
                </span>
              </div>
              {i < arr.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 w-8 sm:w-12 mx-1 sm:mx-2",
                    s.n < step
                      ? "bg-(--text-secondary)"
                      : "bg-(--border-color)"
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
          <h2 className="text-2xl font-bold mt-4 text-(--text-primary)">
            Step 4: Activate Your Store
          </h2>
          <p className="text-sm text-(--text-secondary)">
            Your store "{formData.name}" has been created. Pay the activation
            fee to publish it.
          </p>
        </div>
      )}

      {/* ✅ No key={step} on the outer wrapper — prevents remount, keeps autofill stable */}
      <div className="rounded-xl border border-(--border-color) bg-(--bg-primary) p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between items-center mt-6 pt-6 border-t border-(--border-color)">
          {/* ✅ Back arrow button — visible on steps 2 & 3 */}
          {step > 1 && !hasPendingActivation ? (
            <button
              onClick={handleBack}
              type="button"
              aria-label="Go back"
              title="Go back"
              className="flex items-center justify-center h-10 w-10 rounded-xl border border-(--border-color) bg-(--bg-primary) text-(--text-secondary) hover:bg-(--bg-secondary) transition-colors"
            >
              <ArrowLeft className="size-5" />
            </button>
          ) : (
            <div className="h-10 w-10" />
          )}

          <div className="flex gap-3">
            {step >= 1 && step <= 3 && !hasPendingActivation && (
              <button
                onClick={handleSaveAndContinueLater}
                type="button"
                disabled={savingDraft}
                className="rounded-xl border border-(--border-color) bg-(--bg-primary) text-(--text-primary) px-4 sm:px-6 py-2.5 text-sm font-medium hover:bg-(--bg-secondary) transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingDraft ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                <span className="hidden sm:inline">
                  {savingDraft ? "Saving..." : "Save & Continue Later"}
                </span>
                <span className="sm:hidden">{savingDraft ? "..." : "Save"}</span>
              </button>
            )}

            {step === 1 && !hasPendingActivation && (
              <button
                onClick={handleNext}
                className="rounded-xl bg-(--color-accent-yellow) hover:bg-(--color-accent-yellow)/90 text-(--color-ink) px-6 py-2.5 text-sm font-semibold transition-colors flex items-center gap-2"
              >
                Next <ChevronRight className="size-4" />
              </button>
            )}

            {step === 2 && !hasPendingActivation && (
              <button
                onClick={handleNext}
                className="rounded-xl bg-(--color-accent-yellow) hover:bg-(--color-accent-yellow)/90 text-(--color-ink) px-6 py-2.5 text-sm font-semibold transition-colors flex items-center gap-2"
              >
                Next <ChevronRight className="size-4" />
              </button>
            )}

            {step === 3 && !hasPendingActivation && (
              <button
                onClick={handleGoToActivation}
                className="rounded-xl bg-(--color-accent-yellow) hover:bg-(--color-accent-yellow)/90 text-(--color-ink) px-6 py-2.5 text-sm font-semibold transition-colors flex items-center gap-2"
              >
                Proceed to Activation <ChevronRight className="size-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}