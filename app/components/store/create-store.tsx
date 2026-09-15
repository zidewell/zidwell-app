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
  Loader2,
  CreditCard,
  Check,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  PartyPopper,
  Rocket,
  Save,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  CheckCircle,
  XCircle,
  Building2,
  BadgeCheck,
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
  locationEnabled: false,
  latitude: null,
  longitude: null,
  locationAccuracy: null,
};

// ─── Slugify — mirrors the server-side cleaning ───
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

// ============================================================
// BROWSER PENDING-MARKER HELPERS
// ============================================================
const PENDING_CHECKOUT_KEY = "pendingStoreCheckout";

function clearPendingMarkers() {
  try {
    sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
    localStorage.removeItem(PENDING_CHECKOUT_KEY);
  } catch {
    // storage may be unavailable in some privacy modes — ignore
  }
}

// ============================================================
// DESIGN HELPERS
// ============================================================

function SectionCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[2rem] border border-(--border-color) bg-(--bg-primary) p-6 sm:p-8",
        className
      )}
    >
      {children}
    </div>
  );
}

function StepHead({ title, copy }: { title: string; copy: string }) {
  return (
    <div>
      <h2 className="font-bold text-2xl sm:text-3xl text-(--text-primary)">
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-sm sm:text-base font-medium text-(--text-secondary)">
        {copy}
      </p>
    </div>
  );
}

function Field({
  label,
  hint,
  optional,
  error,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  optional?: boolean;
  error?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label
        htmlFor={htmlFor}
        className="text-sm font-bold text-(--text-primary) block"
      >
        {label}
        {optional && (
          <span className="text-xs font-medium text-(--text-secondary) ml-2">
            Optional
          </span>
        )}
      </Label>
      {hint && !error && (
        <p className="mt-1 mb-2 text-xs text-(--text-secondary) font-medium">
          {hint}
        </p>
      )}
      {error && (
        <p className="mt-1 mb-2 text-sm text-destructive flex items-center gap-1 font-medium">
          <AlertCircle className="size-3" /> {error}
        </p>
      )}
      {children}
    </div>
  );
}

function Summary({
  title,
  rows,
}: {
  title: string;
  rows: [string, string][];
}) {
  return (
    <div className="rounded-[1.5rem] bg-(--bg-secondary) p-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-(--text-secondary)">
        {title}
      </p>
      <dl className="mt-4 space-y-3">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt className="text-[11px] font-bold uppercase tracking-wider text-(--text-secondary)">
              {k}
            </dt>
            <dd className="text-[15px] font-semibold text-(--text-primary)">
              {v || (
                <span className="text-(--text-secondary) font-medium">
                  Not provided
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Benefit({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle2 className="size-4 text-green-500 shrink-0" />
      <span className="text-white/85 text-sm font-medium">{text}</span>
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
    if (isOpen) triggerConfetti();
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
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors });
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
        className="relative max-w-md w-full bg-(--bg-primary) rounded-[2rem] border border-(--border-color) p-6 sm:p-8 text-center shadow-2xl max-h-[90vh] overflow-y-auto tiny-scrollbar"
      >
        <div className="flex justify-center mb-5 sm:mb-6">
          <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl bg-yellow-500/10">
            <PartyPopper className="size-10 sm:size-12 text-yellow-500" />
          </div>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-(--text-primary)">
          Store Activated
        </h2>

        <p className="mt-3 text-sm sm:text-base font-medium text-(--text-secondary)">
          Your store{" "}
          <span className="font-semibold text-(--color-accent-yellow)">
            "{storeName}"
          </span>{" "}
          is now live and ready to accept payments.
        </p>

        <div className="mt-5 sm:mt-6 p-4 rounded-2xl bg-(--bg-secondary) border border-(--border-color) text-left space-y-2">
          {[
            "Your store is now publicly visible",
            "You can now accept payments",
            "Your business wallet is ready to receive funds",
            "Create unlimited payment pages & products",
          ].map((t) => (
            <div key={t} className="flex items-start gap-3 text-sm">
              <CheckCircle2 className="size-4 text-green-500 shrink-0 mt-0.5" />
              <span className="text-(--text-primary) font-medium">{t}</span>
            </div>
          ))}
        </div>

        <div className="mt-5 sm:mt-6 space-y-3">
          <button
            onClick={onGoToDashboard}
            className="w-full rounded-2xl bg-(--color-accent-yellow) hover:bg-(--color-accent-yellow)/90 text-(--color-ink) px-6 py-4 text-sm font-bold transition-colors"
          >
            <Rocket className="size-4 inline mr-2" />
            Go to Store Dashboard
          </button>
          <button
            onClick={onClose}
            className="w-full rounded-2xl px-6 py-3 text-sm font-medium text-(--text-secondary) hover:bg-(--bg-secondary) transition-colors"
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

  const [draftLoaded, setDraftLoaded] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [hasExistingDraft, setHasExistingDraft] = useState(false);
  const [draftAvailable, setDraftAvailable] = useState(false);
  const [loadingDraftManually, setLoadingDraftManually] = useState(false);
  const [draftCheckDone, setDraftCheckDone] = useState(false);

  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // ─── Name validation state ───
  const [nameValidation, setNameValidation] = useState<{
    isValid: boolean;
    isChecking: boolean;
    message: string;
    isTaken: boolean;
    isReserved: boolean;
    isOwnStore: boolean;
    hasChecked: boolean;
  }>({
    isValid: true,
    isChecking: false,
    message: "",
    isTaken: false,
    isReserved: false,
    isOwnStore: false,
    hasChecked: false,
  });

  // ─── Slug validation state ───
  const [slugValidation, setSlugValidation] = useState<{
    isValid: boolean;
    isChecking: boolean;
    message: string;
    isTaken: boolean;
    isReserved: boolean;
    isOwnStore: boolean;
    hasChecked: boolean;
  }>({
    isValid: true,
    isChecking: false,
    message: "",
    isTaken: false,
    isReserved: false,
    isOwnStore: false,
    hasChecked: false,
  });

  // Guards to prevent duplicate API calls
  const draftFetchStartedRef = useRef(false);
  const autoLoadDoneRef = useRef(false);
  // Autosave debounce timer
  const draftSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Slug validation debounce timer
  const slugValidationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  // Name validation debounce timer
  const nameValidationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  // Tracks whether the user manually edited the slug
  const slugManuallyEditedRef = useRef(false);

  const totalSteps = 4;
  const isVerified = userData?.bvnVerification === "verified";

  // ============================================================
  // PENDING-MARKER LIFECYCLE
  // ============================================================
  // Reset processing state when page is restored from bfcache, then
  // clear the pending marker.
  useEffect(() => {
    const handlePageShow = () => {
      if (sessionStorage.getItem(PENDING_CHECKOUT_KEY) === "true") {
        clearPendingMarkers();
        setIsProcessingCheckout(false);
        setIsActivating(false);
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  // Clear pending markers when the user leaves the page (close tab,
  // hard navigate away, or refresh without completing checkout).
  useEffect(() => {
    const handleLeave = () => clearPendingMarkers();

    window.addEventListener("pagehide", handleLeave);
    window.addEventListener("beforeunload", handleLeave);

    return () => {
      window.removeEventListener("pagehide", handleLeave);
      window.removeEventListener("beforeunload", handleLeave);
    };
  }, []);

  // Clear pending markers when the component unmounts (SPA navigation
  // away from the create-store page).
  useEffect(() => {
    return () => {
      clearPendingMarkers();
    };
  }, []);

  // Redirect if user has an active (live) store
  useEffect(() => {
    if (hasActiveStore) {
      router.push("/dashboard/services/payment/dashboard");
    }
  }, [hasActiveStore, router]);

  // Load pending activation store data
  useEffect(() => {
    if (store && store.isActive === false && !hasLoadedStoreData) {
      setFormData({
        name: store.name || "",
        slug: store.slug || "",
        description: store.description || "",
        keywords: Array.isArray(store.keywords)
          ? store.keywords.join(", ")
          : "",
        cacNumber: store.cacNumber || "",
        country: store.country || "Nigeria",
        state: store.state || "",
        city: store.city || "",
        streetAddress: store.streetAddress || "",
        locationEnabled: store.locationEnabled !== false,
        latitude: (store as any).latitude ?? null,
        longitude: (store as any).longitude ?? null,
        locationAccuracy: (store as any).locationAccuracy ?? null,
      });
      setHasLoadedStoreData(true);
      setStep(4);
    }
  }, [store, hasLoadedStoreData]);

  // ============================================================
  // NAME VALIDATION (debounced)
  // ============================================================
  const validateNameWithDebounce = useCallback(
    async (nameToValidate: string) => {
      if (!nameToValidate || nameToValidate.trim().length < 2) {
        setNameValidation({
          isValid: false,
          isChecking: false,
          message: "",
          isTaken: false,
          isReserved: false,
          isOwnStore: false,
          hasChecked: false,
        });
        return;
      }

      setNameValidation((prev) => ({
        ...prev,
        isChecking: true,
        hasChecked: false,
      }));

      try {
        const res = await fetch("/api/store/validate-name", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: nameToValidate,
            storeId: store?.id,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setNameValidation({
            isValid: false,
            isChecking: false,
            message: data.error || "Failed to validate store name",
            isTaken: false,
            isReserved: false,
            isOwnStore: false,
            hasChecked: true,
          });
          return;
        }

        setNameValidation({
          isValid: !!data.valid,
          isChecking: false,
          message: data.message || "",
          isTaken: !!data.isTaken,
          isReserved: !!data.isReserved,
          isOwnStore: !!data.isOwnStore,
          hasChecked: true,
        });
      } catch (err) {
        console.error("Name validation failed:", err);
        setNameValidation({
          isValid: false,
          isChecking: false,
          message: "Could not check name availability. Try again.",
          isTaken: false,
          isReserved: false,
          isOwnStore: false,
          hasChecked: true,
        });
      }
    },
    [store?.id]
  );

  // ============================================================
  // SLUG VALIDATION (debounced)
  // ============================================================
  const validateSlugWithDebounce = useCallback(
    async (slugToValidate: string) => {
      if (!slugToValidate || slugToValidate.length < 1) {
        setSlugValidation({
          isValid: false,
          isChecking: false,
          message: "",
          isTaken: false,
          isReserved: false,
          isOwnStore: false,
          hasChecked: false,
        });
        return;
      }

      setSlugValidation((prev) => ({
        ...prev,
        isChecking: true,
        hasChecked: false,
      }));

      try {
        const res = await fetch("/api/store/validate-slug", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: slugToValidate,
            storeId: store?.id,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setSlugValidation({
            isValid: false,
            isChecking: false,
            message: data.error || "Failed to validate URL",
            isTaken: false,
            isReserved: false,
            isOwnStore: false,
            hasChecked: true,
          });
          return;
        }

        setSlugValidation({
          isValid: !!data.valid,
          isChecking: false,
          message: data.message || "",
          isTaken: !!data.isTaken,
          isReserved: !!data.isReserved,
          isOwnStore: !!data.isOwnStore,
          hasChecked: true,
        });
      } catch (err) {
        console.error("Slug validation failed:", err);
        setSlugValidation({
          isValid: false,
          isChecking: false,
          message: "Could not check URL availability. Try again.",
          isTaken: false,
          isReserved: false,
          isOwnStore: false,
          hasChecked: true,
        });
      }
    },
    [store?.id]
  );

  // ============================================================
  // AUTO-POPULATE SLUG FROM NAME + DEBOUNCED NAME VALIDATION
  // ============================================================
  useEffect(() => {
    const trimmedName = formData.name.trim();

    // ─── Debounced NAME validation ───
    if (!trimmedName) {
      setNameValidation({
        isValid: true,
        isChecking: false,
        message: "",
        isTaken: false,
        isReserved: false,
        isOwnStore: false,
        hasChecked: false,
      });
    } else {
      if (nameValidationTimerRef.current) {
        clearTimeout(nameValidationTimerRef.current);
      }
      nameValidationTimerRef.current = setTimeout(() => {
        validateNameWithDebounce(trimmedName);
      }, 600);
    }

    // ─── Auto-populate SLUG (unless user manually edited) ───
    if (!slugManuallyEditedRef.current) {
      if (!trimmedName) {
        if (formData.slug) {
          setFormData((prev) => ({ ...prev, slug: "" }));
        }
        setSlugValidation({
          isValid: true,
          isChecking: false,
          message: "",
          isTaken: false,
          isReserved: false,
          isOwnStore: false,
          hasChecked: false,
        });
      } else {
        const auto = slugify(trimmedName);
        setFormData((prev) =>
          prev.slug === auto ? prev : { ...prev, slug: auto }
        );

        if (slugValidationTimerRef.current) {
          clearTimeout(slugValidationTimerRef.current);
        }
        slugValidationTimerRef.current = setTimeout(() => {
          validateSlugWithDebounce(auto);
        }, 600);
      }
    }

    return () => {
      if (nameValidationTimerRef.current) {
        clearTimeout(nameValidationTimerRef.current);
      }
      if (slugValidationTimerRef.current) {
        clearTimeout(slugValidationTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.name]);

  // ============================================================
  // loadDraft with meaningful-content check + draftAvailable
  // ============================================================
  const loadDraft = useCallback(async (showToast = true): Promise<boolean> => {
    if (draftFetchStartedRef.current) return false;
    draftFetchStartedRef.current = true;

    try {
      const res = await fetch("/api/store/create-draft", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      if (!res.ok) {
        setDraftAvailable(false);
        setDraftCheckDone(true);
        return false;
      }

      const data = await res.json();
      const draft = data?.draft;

      if (!draft) {
        setDraftAvailable(false);
        setDraftCheckDone(true);
        return false;
      }

      const hasContent =
        (draft.name && String(draft.name).trim()) ||
        (draft.slug && String(draft.slug).trim()) ||
        (draft.description && String(draft.description).trim()) ||
        (draft.state && String(draft.state).trim()) ||
        (draft.city && String(draft.city).trim()) ||
        (draft.street_address && String(draft.street_address).trim()) ||
        (draft.cac_number && String(draft.cac_number).trim()) ||
        (Array.isArray(draft.keywords) && draft.keywords.length > 0) ||
        (draft.step && Number(draft.step) > 1);

      if (!hasContent) {
        setHasExistingDraft(false);
        setDraftAvailable(false);
        setDraftCheckDone(true);
        return false;
      }

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
        locationEnabled: draft.location_enabled === true,
        latitude: draft.latitude ?? null,
        longitude: draft.longitude ?? null,
        locationAccuracy: draft.location_accuracy ?? null,
      });

      // If the draft had a slug, treat it as manually edited so auto-fill
      // doesn't overwrite it when the user edits the name.
      if (draft.slug && String(draft.slug).trim()) {
        slugManuallyEditedRef.current = true;
      }

      if (draft.step >= 1 && draft.step <= 3) {
        setStep(draft.step);
      }

      setHasExistingDraft(true);
      setDraftAvailable(true);
      setDraftCheckDone(true);

      if (showToast) {
        toast.success("Draft loaded", {
          description: `Restored "${draft.name || "your saved store"}" — step ${draft.step || 1}.`,
        });
      }

      return true;
    } catch (e) {
      console.error("Failed to restore create draft:", e);
      setDraftAvailable(false);
      setDraftCheckDone(true);
      return false;
    } finally {
      draftFetchStartedRef.current = false;
    }
  }, []);

  // Auto-load draft on mount — runs once
  useEffect(() => {
    if (autoLoadDoneRef.current) return;

    if (hasPendingActivation || hasActiveStore) {
      autoLoadDoneRef.current = true;
      setDraftCheckDone(true);
      setDraftLoaded(true);
      return;
    }

    autoLoadDoneRef.current = true;
    let cancelled = false;

    (async () => {
      const loaded = await loadDraft(false);
      if (cancelled) return;

      if (loaded) {
        toast.success("Draft restored", {
          description: "We restored your previously saved store details.",
        });
      }
      setDraftLoaded(true);
      setDraftCheckDone(true);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPendingActivation, hasActiveStore, loadDraft]);

  // ============================================================
  // DEBOUNCED AUTOSAVE — saves the draft as the user types
  // ============================================================
  useEffect(() => {
    if (hasPendingActivation || hasActiveStore) return;
    if (!draftLoaded) return;
    // Skip if the form is completely empty (nothing to save)
    if (
      !formData.name &&
      !formData.slug &&
      !formData.description &&
      !formData.state &&
      !formData.city &&
      !formData.streetAddress
    ) {
      return;
    }

    if (draftSaveTimerRef.current) clearTimeout(draftSaveTimerRef.current);

    draftSaveTimerRef.current = setTimeout(async () => {
      try {
        const keywordsArray = formData.keywords
          .split(",")
          .map((k) => k.trim())
          .filter((k) => k.length > 0);

        await fetch("/api/store/create-draft", {
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

        setDraftAvailable(true);
        setHasExistingDraft(true);
      } catch {
        // silent — autosave failure shouldn't disrupt the user
      }
    }, 800);

    return () => {
      if (draftSaveTimerRef.current) clearTimeout(draftSaveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formData,
    step,
    draftLoaded,
    hasPendingActivation,
    hasActiveStore,
  ]);

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

  // Slug input — mark as manually edited so auto-populate stops
  const handleSlugChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      slugManuallyEditedRef.current = true;
      const value = e.target.value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "")
        .replace(/\s/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 50);

      setFormData((prev) => ({ ...prev, slug: value }));
      if (errors.slug) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.slug;
          return newErrors;
        });
      }

      if (slugValidationTimerRef.current) {
        clearTimeout(slugValidationTimerRef.current);
      }
      if (!value) {
        setSlugValidation({
          isValid: true,
          isChecking: false,
          message: "",
          isTaken: false,
          isReserved: false,
          isOwnStore: false,
          hasChecked: false,
        });
        return;
      }
      slugValidationTimerRef.current = setTimeout(() => {
        validateSlugWithDebounce(value);
      }, 600);
    },
    [errors.slug, validateSlugWithDebounce]
  );

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
            msg =
              "Location permission denied. Enable it in your browser settings.";
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            msg = "Location information is unavailable.";
          } else if (error.code === error.TIMEOUT) {
            msg = "Location request timed out.";
          }
          setLocationError(msg);
          toast.error("Location unavailable", { description: msg });
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
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
        if (!formData.name?.trim()) newErrors.name = "Store name is required";
        else if (formData.name.trim().length < 2)
          newErrors.name = "Store name must be at least 2 characters";
        else if (!nameValidation.isValid || nameValidation.isChecking)
          newErrors.name =
            nameValidation.message || "Store name is not available";

        if (!formData.slug?.trim()) newErrors.slug = "Store URL is required";
        else if (!/^[a-z0-9-]+$/.test(formData.slug))
          newErrors.slug =
            "Only lowercase letters, numbers, and hyphens allowed";
        else if (formData.slug.length < 3)
          newErrors.slug = "URL must be at least 3 characters";
        else if (!slugValidation.isValid || slugValidation.isChecking)
          newErrors.slug =
            slugValidation.message || "Store URL is not available";

        const cleanDescription = formData.description
          .replace(/<[^>]*>/g, "")
          .trim();
        if (!cleanDescription || cleanDescription.length === 0)
          newErrors.description = "Store description is required";
        else if (cleanDescription.length < 10)
          newErrors.description =
            "Description should be at least 10 characters";
      }
      if (stepNumber === 2) {
        if (!formData.country?.trim())
          newErrors.country = "Country is required";
        if (!formData.state?.trim()) newErrors.state = "State is required";
        if (!formData.city?.trim()) newErrors.city = "City is required";
        if (!formData.streetAddress?.trim())
          newErrors.streetAddress = "Street address is required";
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [formData, nameValidation, slugValidation]
  );

  const handleNext = useCallback(() => {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, totalSteps));
  }, [step, validateStep]);

  const handleBack = useCallback(() => setStep((s) => Math.max(s - 1, 1)), []);

  const handleSaveAndContinueLater = useCallback(async () => {
    if (savingDraft) return;

    if (!nameValidation.isValid) {
      toast.error("Cannot save", {
        description:
          nameValidation.message || "Store name is not available.",
      });
      return;
    }
    if (!slugValidation.isValid) {
      toast.error("Cannot save", {
        description:
          slugValidation.message || "Store URL is not available.",
      });
      return;
    }

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
      setDraftAvailable(true);
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
  }, [formData, step, router, savingDraft, nameValidation, slugValidation]);

  const handleDiscardDraft = useCallback(async () => {
    try {
      await fetch("/api/store/create-draft", { method: "DELETE" });
      setHasExistingDraft(false);
      setDraftAvailable(false);
      setFormData(initialFormData);
      setStep(1);
      setErrors({});
      setLocationError(null);
      slugManuallyEditedRef.current = false;
      setNameValidation({
        isValid: true,
        isChecking: false,
        message: "",
        isTaken: false,
        isReserved: false,
        isOwnStore: false,
        hasChecked: false,
      });
      setSlugValidation({
        isValid: true,
        isChecking: false,
        message: "",
        isTaken: false,
        isReserved: false,
        isOwnStore: false,
        hasChecked: false,
      });
      toast.success("Draft discarded", {
        description: "You can start fresh.",
      });
    } catch (e) {
      console.error("Failed to discard draft:", e);
      toast.error("Could not discard draft");
    }
  }, []);

  const handleGoToActivation = useCallback(() => {
    if (validateStep(1) && validateStep(2)) setStep(4);
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
    sessionStorage.setItem(PENDING_CHECKOUT_KEY, "true");

    // Force-save the draft right now, before opening Nomba.
    try {
      const keywordsArray = formData.keywords
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k.length > 0);

      await fetch("/api/store/create-draft", {
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
          step: 3,
        }),
      });
    } catch {
      // Non-fatal — proceed to checkout even if draft save fails
    }

    const safetyTimer = setTimeout(() => {
      clearPendingMarkers();
      setIsProcessingCheckout(false);
      setIsActivating(false);
    }, 30000);

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
          storeData,
          paymentMethod: "checkout",
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Activation failed");

      if (data.requiresCheckout && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      throw new Error("No checkout URL returned");
    } catch (error: any) {
      clearTimeout(safetyTimer);
      clearPendingMarkers();
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

  // ============================================================
  // BLOCKING LOADER: show until draft check completes
  // ============================================================
  if (!draftCheckDone && !hasActiveStore) {
    return (
      <div className="max-w-3xl mx-auto py-6 sm:py-8 px-3 sm:px-4">
        <div className="rounded-[2rem] border border-(--border-color) bg-(--bg-primary) p-8 sm:p-12 flex flex-col items-center justify-center gap-4 min-h-[400px]">
          <Loader2 className="size-8 animate-spin text-(--color-accent-yellow)" />
          <p className="text-sm font-medium text-(--text-secondary) text-center">
            Loading your saved progress...
          </p>
        </div>
      </div>
    );
  }

  if (hasActiveStore) return null;

  // ============================================================
  // STEP INDICATOR (new design — icon cards + progress bar)
  // ============================================================
  const STEPS = [
    { n: 1, label: "Brand", icon: Building2 },
    { n: 2, label: "Location", icon: MapPin },
    { n: 3, label: "Review", icon: BadgeCheck },
    { n: 4, label: "Activate", icon: CreditCard },
  ] as const;

  const renderStepIndicator = () => (
    <div className="mt-8 rounded-[2rem] border border-(--border-color) bg-(--bg-primary) p-4">
      <div className="flex items-center gap-2 overflow-x-auto">
        {STEPS.map((s) => {
          const state = s.n === step ? "current" : s.n < step ? "done" : "todo";
          const clickable = s.n < step;
          return (
            <button
              key={s.n}
              onClick={() => clickable && setStep(s.n)}
              disabled={!clickable}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-2xl px-4 py-3 text-[13px] font-bold uppercase tracking-[0.08em] transition-colors",
                state === "current" &&
                  "bg-(--color-accent-yellow) text-(--color-ink)",
                state === "done" &&
                  "bg-green-500/10 text-green-600 hover:bg-green-500/20",
                state === "todo" && "text-(--text-secondary) cursor-default"
              )}
            >
              {state === "done" ? (
                <Check className="size-4" />
              ) : (
                <s.icon className="size-4" />
              )}
              <span className="whitespace-nowrap">{s.label}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-(--bg-secondary)">
        <div
          className="h-full rounded-full bg-(--color-accent-yellow) transition-[width] duration-300"
          style={{ width: `${(step / STEPS.length) * 100}%` }}
        />
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <SectionCard>
            <StepHead
              title="Store / Brand Details"
              copy="Tell customers about your brand. The name appears publicly on your storefront, receipts and payment links."
            />

            <div className="mt-8 space-y-7">
              {/* ─── Store / Brand Name ─── */}
              <Field
                label="Store / Brand Name"
                hint="The public name of your store. Shown on your storefront, receipts and payment links."
                error={errors.name}
                htmlFor="name"
              >
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Juice Hub"
                  autoComplete="organization"
                  disabled={isWorking}
                  className={cn(
                    "w-full px-4 py-3.5 text-[15px] font-semibold rounded-2xl border bg-(--bg-primary) text-(--text-primary) focus:outline-none focus:border-foreground transition-colors placeholder:font-medium placeholder:text-(--text-secondary)",
                    errors.name ? "border-red-500" : "border-(--border-color)"
                  )}
                  style={{ outline: "none", boxShadow: "none" }}
                />

                {/* Live name validation feedback */}
                {formData.name.trim().length >= 2 && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs font-medium">
                    {nameValidation.isChecking ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin text-(--text-secondary)" />
                        <span className="text-(--text-secondary)">
                          Checking name availability…
                        </span>
                      </>
                    ) : nameValidation.hasChecked ? (
                      nameValidation.isValid ? (
                        <>
                          <CheckCircle className="size-3.5 text-green-600" />
                          <span className="text-green-600">
                            {nameValidation.isOwnStore
                              ? "This is your current store name"
                              : "Store name is available"}
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="size-3.5 text-red-500" />
                          <span className="text-red-500">
                            {nameValidation.message}
                          </span>
                        </>
                      )
                    ) : null}
                  </div>
                )}
              </Field>

              {/* ─── Store URL / Slug ─── */}
              <Field
                label="Store URL / Slug"
                hint="Your store's web address. Keep it short and easy to say out loud — you can share it anywhere."
                error={errors.slug}
                htmlFor="slug"
              >
                <div className="flex items-center rounded-2xl border border-(--border-color) bg-(--bg-primary) pr-4 focus-within:border-foreground transition-colors overflow-hidden">
                  <span className="px-3 sm:px-4 py-3.5 text-sm font-bold text-(--text-secondary) bg-(--bg-secondary) whitespace-nowrap">
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
                    className="flex-1 min-w-0 bg-transparent px-3 py-3.5 text-[15px] font-semibold focus:outline-none text-(--text-primary) placeholder:font-medium placeholder:text-(--text-secondary)"
                    style={{ outline: "none", boxShadow: "none" }}
                  />
                </div>

                {/* Live slug validation feedback */}
                {formData.slug.trim().length >= 3 && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs font-medium">
                    {slugValidation.isChecking ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin text-(--text-secondary)" />
                        <span className="text-(--text-secondary)">
                          Checking URL availability…
                        </span>
                      </>
                    ) : slugValidation.hasChecked ? (
                      slugValidation.isValid ? (
                        <>
                          <CheckCircle className="size-3.5 text-green-600" />
                          <span className="text-green-600">
                            {slugValidation.isOwnStore
                              ? "This is your current store URL"
                              : "URL is available"}
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="size-3.5 text-red-500" />
                          <span className="text-red-500">
                            {slugValidation.message}
                          </span>
                        </>
                      )
                    ) : null}
                  </div>
                )}
              </Field>

              {/* ─── Description ─── */}
              <Field
                label="Store Description"
                hint="Describe your business and what you do for potential customers. 2–3 sentences is plenty."
                error={errors.description}
                htmlFor="description"
              >
                <RichTextArea
                  value={formData.description}
                  onChange={handleDescriptionChange}
                  placeholder="Describe what your business is all about to potential customers..."
                  minHeight="180px"
                  maxHeight="350px"
                />
                <p className="mt-2 text-xs text-(--text-secondary) font-medium">
                  Use the toolbar to format your description (bold, italic,
                  lists, etc.)
                </p>
              </Field>

              {/* ─── Keywords ─── */}
              <Field
                label="Business Keywords / Phrases"
                hint="Type words or phrases people would search to find a business like yours, separated by commas."
                htmlFor="keywords"
              >
                <Input
                  id="keywords"
                  name="keywords"
                  type="text"
                  value={formData.keywords}
                  onChange={handleInputChange}
                  placeholder="fruit juice seller, fruit vendor, juice delivery Lagos"
                  autoComplete="off"
                  disabled={isWorking}
                  className="w-full px-4 py-3.5 text-[15px] font-semibold rounded-2xl border border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:outline-none focus:border-foreground transition-colors placeholder:font-medium placeholder:text-(--text-secondary)"
                  style={{ outline: "none", boxShadow: "none" }}
                />
              </Field>
            </div>
          </SectionCard>
        );

      case 2:
        return (
          <SectionCard>
            <StepHead
              title="Location Details"
              copy="Where is your store based? This helps with local search, delivery estimates and customer trust."
            />

            <div className="mt-8 space-y-7">
              {/* ─── Country ─── */}
              <Field
                label="Country"
                hint="The country where your business is registered and operates."
                error={errors.country}
                htmlFor="country"
              >
                <select
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  autoComplete="country"
                  disabled={isWorking}
                  className={cn(
                    "w-full px-4 py-3.5 text-[15px] font-semibold rounded-2xl border bg-(--bg-primary) text-(--text-primary) focus:outline-none focus:border-foreground transition-colors",
                    errors.country ? "border-red-500" : "border-(--border-color)"
                  )}
                  style={{ outline: "none", boxShadow: "none" }}
                >
                  <option value="Nigeria">Nigeria</option>
                  <option value="Ghana">Ghana</option>
                  <option value="Kenya">Kenya</option>
                  <option value="South Africa">South Africa</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="United States">United States</option>
                </select>
              </Field>

              {/* ─── State / City ─── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-7">
                <Field
                  label="State"
                  hint="The state or region your business operates from."
                  error={errors.state}
                  htmlFor="state"
                >
                  <Input
                    id="state"
                    name="state"
                    type="text"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="e.g., Lagos"
                    autoComplete="address-level1"
                    disabled={isWorking}
                    className={cn(
                      "w-full px-4 py-3.5 text-[15px] font-semibold rounded-2xl border bg-(--bg-primary) text-(--text-primary) focus:outline-none focus:border-foreground transition-colors placeholder:font-medium placeholder:text-(--text-secondary)",
                      errors.state ? "border-red-500" : "border-(--border-color)"
                    )}
                    style={{ outline: "none", boxShadow: "none" }}
                  />
                </Field>

                <Field
                  label="City"
                  hint="The city or town your store is based in."
                  error={errors.city}
                  htmlFor="city"
                >
                  <Input
                    id="city"
                    name="city"
                    type="text"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="e.g., Ikeja"
                    autoComplete="address-level2"
                    disabled={isWorking}
                    className={cn(
                      "w-full px-4 py-3.5 text-[15px] font-semibold rounded-2xl border bg-(--bg-primary) text-(--text-primary) focus:outline-none focus:border-foreground transition-colors placeholder:font-medium placeholder:text-(--text-secondary)",
                      errors.city ? "border-red-500" : "border-(--border-color)"
                    )}
                    style={{ outline: "none", boxShadow: "none" }}
                  />
                </Field>
              </div>

              {/* ─── Street Address ─── */}
              <Field
                label="Street Address"
                hint="Where you operate from. Helps with local search, delivery estimates and customer trust."
                error={errors.streetAddress}
                htmlFor="streetAddress"
              >
                <Input
                  id="streetAddress"
                  name="streetAddress"
                  type="text"
                  value={formData.streetAddress}
                  onChange={handleInputChange}
                  placeholder="e.g., 123 Main Street"
                  autoComplete="street-address"
                  disabled={isWorking}
                  className={cn(
                    "w-full px-4 py-3.5 text-[15px] font-semibold rounded-2xl border bg-(--bg-primary) text-(--text-primary) focus:outline-none focus:border-foreground transition-colors placeholder:font-medium placeholder:text-(--text-secondary)",
                    errors.streetAddress
                      ? "border-red-500"
                      : "border-(--border-color)"
                  )}
                  style={{ outline: "none", boxShadow: "none" }}
                />
              </Field>

              {/* ─── Precise Location ─── */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-5 rounded-[1.5rem] bg-(--bg-secondary) border border-(--border-color)">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 text-(--text-secondary) shrink-0" />
                    <p className="font-bold text-sm text-(--text-primary)">
                      Allow precise location
                    </p>
                  </div>
                  <p className="text-xs text-(--text-secondary) mt-1 font-medium">
                    Zidwell would like to use your precise location for better
                    delivery and customer matching.
                  </p>

                  {formData.latitude != null && formData.longitude != null && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-2 break-all font-medium">
                      Captured: {formData.latitude.toFixed(5)},{" "}
                      {formData.longitude.toFixed(5)}
                      {formData.locationAccuracy
                        ? ` (±${Math.round(formData.locationAccuracy)}m)`
                        : ""}
                    </p>
                  )}

                  {locationError && (
                    <p className="text-xs text-red-500 mt-2 font-medium">
                      {locationError}
                    </p>
                  )}
                </div>

                <label
                  className={cn(
                    "relative inline-flex items-center shrink-0 self-start sm:self-center",
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
          </SectionCard>
        );

      case 3:
        return (
          <SectionCard>
            <StepHead
              title="Review Your Store"
              copy="Confirm everything looks correct before activation. Tap the Brand or Location step above to go back and edit."
            />

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <Summary
                title="Brand"
                rows={[
                  ["Store Name", formData.name],
                  ["Store URL", `zidwell.com/${formData.slug}`],
                  ["Keywords", formData.keywords],
                ]}
              />
              <Summary
                title="Location"
                rows={[
                  ["City", formData.city],
                  ["State", formData.state],
                  ["Country", formData.country],
                  ["Address", formData.streetAddress],
                ]}
              />
            </div>

            <div className="mt-5 rounded-[1.5rem] bg-(--bg-secondary) p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-(--text-secondary)">
                Description
              </p>
              <div className="mt-4">
                {formData.description ? (
                  <div
                    className="text-sm font-medium prose prose-sm dark:prose-invert max-w-none
                      prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5
                      prose-strong:text-(--text-primary) break-words"
                    dangerouslySetInnerHTML={{ __html: formData.description }}
                  />
                ) : (
                  <span className="text-sm text-(--text-secondary) font-medium">
                    No description provided
                  </span>
                )}
              </div>
            </div>

            <div className="mt-5 flex items-center gap-4 rounded-[1.5rem] bg-(--bg-secondary) p-5">
              <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-(--color-accent-yellow) font-bold text-xl text-(--color-ink)">
                {(formData.name || "Z").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-base text-(--text-primary)">
                  {formData.name || "Your store"}
                </p>
                <p className="text-sm font-medium text-(--text-secondary)">
                  {formData.locationEnabled && formData.latitude != null
                    ? `Precise location enabled`
                    : "Precise location disabled"}
                </p>
              </div>
            </div>
          </SectionCard>
        );

      case 4:
        return (
          <SectionCard>
            <StepHead
              title="Activate Your Store"
              copy={
                hasPendingActivation
                  ? "Your store has been created. Pay the activation fee to publish it."
                  : "Pay a one-time activation fee via card to publish your store."
              }
            />

            <div className="mt-8 space-y-5">
              <div className="rounded-[1.75rem] border border-(--border-color) bg-[#191919] text-white p-6 sm:p-7">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-gray-400 text-[10px] uppercase tracking-[0.14em] font-bold">
                      Activation Fee
                    </p>
                    <p className="text-4xl sm:text-5xl font-bold mt-2 leading-none">
                      ₦{ACTIVATION_FEE_NAIRA.toLocaleString()}
                    </p>
                    <p className="mt-3 max-w-md text-sm font-medium text-gray-300">
                      Covers store creation and activation — your storefront,
                      payment links and store wallet go live immediately.
                    </p>
                  </div>
                  <CreditCard className="size-9 text-gray-400 shrink-0" />
                </div>
                <div className="mt-5 pt-5 border-t border-gray-700 space-y-2 text-sm">
                  <Benefit text="Publish your public store page" />
                  <Benefit text="Accept online payments" />
                  <Benefit text="Free business wallet to receive funds" />
                  <Benefit text="Unlimited payment pages & products" />
                </div>
              </div>

              {isVerified ? (
                <div className="rounded-[1.5rem] border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-5 flex items-start sm:items-center gap-3">
                  <CheckCircle2 className="size-5 text-green-500 shrink-0 mt-0.5 sm:mt-0" />
                  <p className="text-sm font-bold text-green-700 dark:text-green-400">
                    BVN verified. You're ready to activate.
                  </p>
                </div>
              ) : (
                <div className="rounded-[1.5rem] border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 p-5 flex items-start gap-3">
                  <AlertTriangle className="size-5 text-yellow-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-yellow-700 dark:text-yellow-400">
                      User credentials not verified
                    </p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-500 font-medium">
                      You can still activate your store. Verify later to
                      enable withdrawals.
                    </p>
                    <button
                      onClick={openVerificationModal}
                      className="mt-2 text-xs font-bold text-yellow-600 dark:text-yellow-400 hover:underline"
                    >
                      Verify Now →
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={handleActivate}
                disabled={isWorking || isProcessingCheckout}
                className="w-full rounded-2xl bg-(--color-accent-yellow) hover:bg-(--color-accent-yellow)/90 text-(--color-ink) px-6 py-4 text-sm sm:text-base font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isActivating || isProcessingCheckout ? (
                  <>
                    <Loader2 className="size-5 inline mr-2 animate-spin" />
                    {isProcessingCheckout
                      ? "Preparing Checkout..."
                      : "Activating..."}
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

              <p className="text-center text-xs text-(--text-secondary) font-medium">
                You will be redirected to pay ₦
                {ACTIVATION_FEE_NAIRA.toLocaleString()} via card.
              </p>
            </div>
          </SectionCard>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 sm:py-8 px-3 sm:px-4">
      <button
        onClick={() => router.back()}
        type="button"
        aria-label="Go back"
        title="Go back"
        className="mb-4 inline-flex items-center justify-center text-(--text-secondary) hover:text-(--text-primary) transition-colors"
      >
        <ArrowLeft className="size-6" />
      </button>

      <AnimatePresence>
        <CongratulationsModal
          isOpen={showCongratulations}
          onClose={() => setShowCongratulations(false)}
          storeName={activatedStoreName}
          onGoToDashboard={goToDashboard}
        />
      </AnimatePresence>

      <div className="text-center mb-6 sm:mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-3xl bg-(--bg-secondary)">
            <Store className="size-7 sm:size-8 text-(--text-secondary)" />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-(--text-primary)">
          {hasPendingActivation
            ? "Complete Your Store Activation"
            : "Create Your Online Store"}
        </h1>
        <p className="mt-3 text-sm sm:text-base font-medium text-(--text-secondary) px-2 max-w-2xl mx-auto">
          {hasPendingActivation
            ? "Your store is almost ready! Pay the activation fee to publish it."
            : "Four short steps. Everything Zidwell already knows about your business is filled in for you — you only complete what's missing."}
        </p>
      </div>

      <BVNVerificationBadge
        variant="store"
        className="mb-6"
        dismissable={true}
      />

      {/* Manual Load Draft button — only when a draft actually exists */}
      {!hasPendingActivation &&
        !hasActiveStore &&
        draftAvailable &&
        !hasExistingDraft &&
        step === 1 &&
        !formData.name && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-[1.5rem] border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/20 px-5 py-4 text-sm">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-medium">
              <AlertCircle className="size-4 shrink-0" />
              <span>Have a saved draft? Load it to continue.</span>
            </div>
            <button
              onClick={async () => {
                setLoadingDraftManually(true);
                const loaded = await loadDraft(true);
                setLoadingDraftManually(false);
                if (!loaded) toast.error("No saved draft found");
              }}
              disabled={loadingDraftManually}
              type="button"
              className="self-start sm:self-auto text-xs font-bold text-blue-700 dark:text-blue-300 hover:underline flex items-center gap-1 disabled:opacity-50"
            >
              {loadingDraftManually ? (
                <>
                  <Loader2 className="size-3 animate-spin" /> Loading...
                </>
              ) : (
                <>Load Draft</>
              )}
            </button>
          </div>
        )}

      {/* Draft restored banner */}
      {hasExistingDraft && !hasPendingActivation && step <= 3 && (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-[1.5rem] border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/20 px-5 py-4 text-sm">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-medium">
            <AlertCircle className="size-4 shrink-0" />
            <span>Continuing from your saved draft.</span>
          </div>
          <button
            onClick={handleDiscardDraft}
            type="button"
            className="self-start sm:self-auto text-xs font-bold text-blue-700 dark:text-blue-300 hover:underline"
          >
            Start over
          </button>
        </div>
      )}

      {/* Step indicator */}
      {!hasPendingActivation && renderStepIndicator()}

      {hasPendingActivation && (
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs sm:text-sm font-bold">
            <AlertCircle className="size-4" />
            Pending Activation
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mt-4 text-(--text-primary)">
            Step 4: Activate Your Store
          </h2>
          <p className="text-xs sm:text-sm text-(--text-secondary) px-2 font-medium">
            Your store "{formData.name}" has been created. Pay the activation
            fee to publish it.
          </p>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="mt-6"
        >
          {renderStepContent()}
        </motion.div>
      </AnimatePresence>

      {/* Footer nav — single source of truth for Back/Next */}
      <div className="mt-8 flex items-center justify-between gap-4">
        {/* Back button — always visible except on step 1 */}
        {step > 1 ? (
          <button
            onClick={handleBack}
            type="button"
            className="flex items-center gap-2 rounded-2xl border border-(--border-color) px-5 py-3.5 text-sm font-bold text-(--text-primary) hover:bg-(--bg-secondary) transition-colors"
          >
            <ArrowLeft className="size-5" /> Back
          </button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-3">
          {/* Save for later — only on steps 1-3 (not on Activate) */}
          {step <= 3 && (
            <button
              onClick={handleSaveAndContinueLater}
              type="button"
              disabled={savingDraft}
              className="rounded-2xl px-4 py-3.5 text-sm font-bold text-(--text-secondary) hover:text-(--text-primary) transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {savingDraft ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              <span className="hidden sm:inline">
                {savingDraft ? "Saving..." : "Save for later"}
              </span>
            </button>
          )}

          {/* Continue on step 1 */}
          {step === 1 && (
            <button
              onClick={handleNext}
              disabled={
                nameValidation.isChecking ||
                slugValidation.isChecking ||
                !nameValidation.isValid ||
                !slugValidation.isValid
              }
              className="flex items-center gap-2 rounded-2xl bg-(--color-accent-yellow) hover:bg-(--color-accent-yellow)/90 text-(--color-ink) px-6 py-3.5 text-sm font-bold disabled:opacity-40 transition-colors"
            >
              Continue <ArrowRight className="size-5" />
            </button>
          )}

          {/* Continue on step 2 */}
          {step === 2 && (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 rounded-2xl bg-(--color-accent-yellow) hover:bg-(--color-accent-yellow)/90 text-(--color-ink) px-6 py-3.5 text-sm font-bold transition-colors"
            >
              Continue <ArrowRight className="size-5" />
            </button>
          )}

          {/* Proceed to Activation on step 3 */}
          {step === 3 && (
            <button
              onClick={handleGoToActivation}
              className="flex items-center gap-2 rounded-2xl bg-(--color-accent-yellow) hover:bg-(--color-accent-yellow)/90 text-(--color-ink) px-6 py-3.5 text-sm font-bold transition-colors"
            >
              Proceed to Activation <ArrowRight className="size-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}