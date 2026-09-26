// app/store/[storeSlug]/[productSlug]/hooks/useProductCheckout.ts
"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import {
  PaymentEntity,
  computeChargeAmount,
  computeNextInstallmentPayment,
  extractEntitiesForPage,
} from "@/lib/installment-utils";
import {
  saveBuyerIdentity,
  loadBuyerIdentity,
  clearBuyerIdentity,
} from "@/lib/buyer-identity";
import {
  PaymentPage,
  StoreData,
  PaymentOption,
} from "../utils/types";
import { QUANTITY_PAGE_TYPES } from "../utils/helpers";

interface UseProductCheckoutProps {
  page: PaymentPage;
  store: StoreData;
  initialPaidStudents?: Record<string, number>;
}

export function useProductCheckout({
  page,
  store,
  initialPaidStudents = {},
}: UseProductCheckoutProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planIdFromUrl = searchParams.get("plan");

  // ─── STATE ───
  const [currentImage, setCurrentImage] = useState(0);
  const [selectedEntityIds, setSelectedEntityIds] = useState<Set<string>>(
    new Set()
  );
  const [selectedPaymentOption, setSelectedPaymentOption] =
    useState<PaymentOption>("full");
  const [quantity, setQuantity] = useState(1);
  const [isMounted, setIsMounted] = useState(false);
  const [processingCardPayment, setProcessingCardPayment] = useState(false);
  const [submissionLock, setSubmissionLock] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [donorAmount, setDonorAmount] = useState("");
  const [donorMessage, setDonorMessage] = useState("");

  // ✅ Multi-variant selection
  const [selectedVariantSkus, setSelectedVariantSkus] = useState<Set<string>>(
    new Set()
  );
  const [variantQuantities, setVariantQuantities] = useState<
    Record<string, number>
  >({});

  const [shippingAddress, setShippingAddress] = useState({
    street: "",
    city: "",
    state: "",
    country: "Nigeria",
    zipCode: "",
  });

  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [customerNote, setCustomerNote] = useState("");

  const [customFieldValues, setCustomFieldValues] = useState<
    Record<string, any>
  >({});

  const [schoolFields, setSchoolFields] = useState<Record<string, any>>({});

  const [existingAccount, setExistingAccount] = useState<any | null>(null);

  const [schoolPaidStudents, setSchoolPaidStudents] = useState<
    Record<string, number> | null
  >(() => {
    if (
      initialPaidStudents &&
      Object.keys(initialPaidStudents).length > 0
    ) {
      return initialPaidStudents;
    }
    return {};
  });

  const [myPaidStudents, setMyPaidStudents] = useState<
    Record<string, number> | null
  >(null);
  const [myBuyerName, setMyBuyerName] = useState<string | null>(null);

  const [accountLookupDone, setAccountLookupDone] = useState(false);
  const [showContinueModal, setShowContinueModal] = useState(false);
  const [lookupInput, setLookupInput] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [lockedFields, setLockedFields] = useState(false);

  const [liveVariantStock, setLiveVariantStock] = useState<
    Record<string, number> | null
  >(null);

  const checkoutWindowRef = useRef<Window | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── DERIVED BOOLEANS ───
  const pageType = page?.pageType || "";
  const isPaymentLink = pageType === "link";
  const isSchoolPage = pageType === "school";
  const isDonation = pageType === "donation";
  const isPhysical = pageType === "physical";
  const isDigital = pageType === "digital";
  const isServices = pageType === "services";
  const showQuantity = QUANTITY_PAGE_TYPES.includes(pageType);

  const productStock =
    page?.metadata?.stock != null ? Number(page.metadata.stock) : null;

  const allowMultiple =
    page?.metadata?.allowMultiple === false ? false : true;

  const canPickQuantity = showQuantity && allowMultiple;

  const linkConfig = useMemo(
    () => page?.metadata?.linkConfig || {},
    [page?.metadata]
  );

  const customFields = useMemo(
    () => (isPaymentLink ? linkConfig.customFields || [] : []),
    [isPaymentLink, linkConfig]
  );

  const variants = useMemo(
    () => (isPhysical ? page?.metadata?.variants || [] : []),
    [isPhysical, page?.metadata]
  );

  const feeBreakdown = useMemo(
    () => page?.metadata?.feeBreakdown || [],
    [page?.metadata]
  );

  const schoolRequiredFields = useMemo(
    () =>
      isSchoolPage && Array.isArray(page?.metadata?.requiredFields)
        ? page.metadata.requiredFields
        : [],
    [isSchoolPage, page?.metadata]
  );

  const requireDonorName = page?.metadata?.requireDonorName !== false;
  const showDonorList = page?.metadata?.showDonorList === true;
  const allowDonorMessage = page?.metadata?.allowDonorMessage !== false;
  const minimumDonation = Number(page?.metadata?.minimumDonation) || 100;
  const suggestedAmounts: number[] = Array.isArray(
    page?.metadata?.suggestedAmounts
  )
    ? page.metadata.suggestedAmounts
    : [];

  const requiresShipping =
    isPhysical && page?.metadata?.requiresShipping !== false;
  const bookingEnabled = isServices && page?.metadata?.bookingEnabled === true;
  const customerNoteEnabled =
    isServices && page?.metadata?.customerNoteEnabled !== false;
  const emailDelivery = isDigital && page?.metadata?.emailDelivery !== false;

  const successMessage = isPaymentLink
    ? linkConfig.successMessage || "Payment successful."
    : "Payment successful.";

  const thankYouMessage = isPaymentLink
    ? linkConfig.thankYouMessage || "A receipt has been sent to your email."
    : "A receipt has been sent to your email.";

  // ─── FEE PAYER ───
  const ZIDWELL_FEE_RATE = 0.035;

  const feePayer = useMemo<
    "customers" | "merchant(me)" | "split between both parties"
  >(() => {
    const raw = page?.metadata?.feePayer;
    if (raw === "customers" || raw === "split between both parties")
      return raw;
    return "merchant(me)";
  }, [page?.metadata?.feePayer]);

  const buyerFeeMultiplier = useMemo(() => {
    if (feePayer === "customers") return 1 + ZIDWELL_FEE_RATE;
    if (feePayer === "split between both parties")
      return 1 + ZIDWELL_FEE_RATE / 2;
    return 1;
  }, [feePayer]);

  // ─── INSTALLMENT PLAN (multi-variant + qty aware) ───
  const installmentPlan = useMemo(() => {
    if (
      page?.priceType !== "installment" ||
      !page?.installmentCount ||
      page.installmentCount <= 1
    ) {
      return null;
    }

    let totalAmount = Number(page?.price) || 0;

    if (isPhysical && selectedVariantSkus.size > 0) {
      let sum = 0;
      let any = false;
      for (const sku of selectedVariantSkus) {
        const v = variants.find((x: any) => (x.sku || x.name) === sku);
        const p = Number(v?.price);
        const q = Math.max(1, variantQuantities[sku] || 1);
        if (Number.isFinite(p) && p > 0) {
          sum += p * q;
          any = true;
        }
      }
      if (any) totalAmount = sum;
    }

    return {
      totalAmount,
      installmentCount: page.installmentCount,
      installmentAmount: totalAmount / page.installmentCount,
      period: page?.metadata?.installmentPeriod || "monthly",
    };
  }, [
    page?.priceType,
    page?.installmentCount,
    page?.price,
    page?.metadata,
    isPhysical,
    selectedVariantSkus,
    variantQuantities,
    variants,
  ]);

  const canDoInstallments = !!installmentPlan && !isDonation;

  const isPlanComplete =
    existingAccount != null &&
    !isSchoolPage &&
    (existingAccount.is_complete === true ||
      Number(existingAccount.remaining_amount) <= 0 ||
      existingAccount.status === "completed");

  const isAccountFullyPaid =
    existingAccount != null &&
    (existingAccount.is_complete === true ||
      Number(existingAccount.remaining_amount) <= 0 ||
      existingAccount.status === "completed");

  const showActivePlanCard =
    existingAccount != null && !isAccountFullyPaid;

  // ─── BASE PRICE (sum of unit prices, unchanged) ───
  const basePrice = useMemo(() => {
    if (isPhysical && selectedVariantSkus.size > 0) {
      let sum = 0;
      let any = false;
      for (const sku of selectedVariantSkus) {
        const v = variants.find((x: any) => (x.sku || x.name) === sku);
        const p = Number(v?.price);
        if (Number.isFinite(p) && p > 0) {
          sum += p;
          any = true;
        }
      }
      if (any) return sum;
      return Number(page?.price) || 0;
    }
    if (isDonation) return Number(donorAmount) || 0;
    return Number(page?.price) || 0;
  }, [
    isPhysical,
    selectedVariantSkus,
    variants,
    page?.price,
    isDonation,
    donorAmount,
  ]);

  // ─── VARIANT STOCK MAP ───
  const variantStockMap = useMemo<Record<string, number> | null>(() => {
    if (!isPhysical || variants.length === 0) return null;

    const map: Record<string, number> = {};

    for (let i = 0; i < variants.length; i++) {
      const v: any = variants[i];
      const sku = v.sku || v.name || `variant-${i}`;

      if (liveVariantStock && sku in liveVariantStock) {
        const n = Number(liveVariantStock[sku]);
        map[sku] = n === -1 ? Infinity : Number.isFinite(n) ? n : 0;
        continue;
      }

      const raw = v.stock;
      const parsed = raw != null && raw !== "" ? Number(raw) : NaN;
      map[sku] = Number.isFinite(parsed) && parsed > 0 ? parsed : Infinity;
    }

    return map;
  }, [isPhysical, variants, liveVariantStock]);

  // ─── SELECTED VARIANT LINES ───
  const selectedVariantLines = useMemo(() => {
    if (!isPhysical || variants.length === 0) return [];

    const lines: {
      sku: string;
      name: string;
      unitPrice: number;
      quantity: number;
      remaining: number | null;
    }[] = [];

    for (const sku of selectedVariantSkus) {
      const v = variants.find((x: any) => (x.sku || x.name) === sku);
      if (!v) continue;

      const unitPrice = Number(v.price) || Number(page?.price) || 0;
      const qty = Math.max(1, variantQuantities[sku] || 1);

      let remaining: number | null = null;
      if (variantStockMap && sku in variantStockMap) {
        const n = Number(variantStockMap[sku]);
        remaining = n === Infinity ? null : Number.isFinite(n) ? n : 0;
      }

      lines.push({
        sku,
        name: v.name || sku,
        unitPrice,
        quantity: qty,
        remaining,
      });
    }

    return lines;
  }, [
    isPhysical,
    variants,
    selectedVariantSkus,
    variantQuantities,
    variantStockMap,
    page?.price,
  ]);

  // ─── OOS CHECK ───
  const isSelectedVariantOOS = useMemo(() => {
    if (!isPhysical || variants.length === 0) return false;

    const remainingFor = (sku: string): number | null => {
      if (variantStockMap && sku in variantStockMap) {
        const n = Number(variantStockMap[sku]);
        if (n === Infinity) return null;
        return Number.isFinite(n) ? n : 0;
      }
      return null;
    };

    if (selectedVariantSkus.size === 0) {
      return variants.every((v: any, i: number) => {
        const sku = v.sku || v.name || `variant-${i}`;
        const r = remainingFor(sku);
        return r !== null && r <= 0;
      });
    }

    for (const sku of selectedVariantSkus) {
      const r = remainingFor(sku);
      if (r === null) continue;
      if (r <= 0) return true;
      const want = Math.max(1, variantQuantities[sku] || 1);
      if (want > r) return true;
    }
    return false;
  }, [
    isPhysical,
    variants,
    selectedVariantSkus,
    variantQuantities,
    variantStockMap,
  ]);

  const entities: PaymentEntity[] = useMemo(() => {
    return extractEntitiesForPage(
      page?.pageType || "link",
      page?.metadata || {},
      Number(page?.price) || 0,
      page?.installmentCount || 1,
      existingAccount
        ? {
            total_amount: Number(existingAccount.total_amount) || 0,
            total_paid: Number(existingAccount.total_paid) || 0,
            remaining_amount: Number(existingAccount.remaining_amount) || 0,
            installments_paid: Number(existingAccount.installments_paid) || 0,
            selection: existingAccount.selection || null,
          }
        : null,
      isSchoolPage ? schoolPaidStudents : null
    );
  }, [
    page?.pageType,
    page?.metadata,
    page?.price,
    page?.installmentCount,
    existingAccount,
    isSchoolPage,
    schoolPaidStudents,
  ]);

  useEffect(() => {
    if (entities.length === 1 && entities[0].id === "default") {
      setSelectedEntityIds((prev) => {
        if (prev.size === 1 && prev.has("default")) return prev;
        return new Set(["default"]);
      });
    }
  }, [entities.length, entities[0]?.id]);

  // Auto-select single variant
  useEffect(() => {
    if (!isPhysical) return;
    if (variants.length !== 1) return;
    if (selectedVariantSkus.size > 0) return;

    const v = variants[0];
    const sku = v?.sku || v?.name;
    if (sku) {
      setSelectedVariantSkus(new Set([sku]));
      setVariantQuantities({ [sku]: 1 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPhysical, variants.length]);

  // Live variant stock fetch
  useEffect(() => {
    if (!isPhysical || variants.length === 0) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          `/api/payment-page/public/variant-stock?pageSlug=${encodeURIComponent(
            page.slug
          )}`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (data?.variantStock && typeof data.variantStock === "object") {
          setLiveVariantStock(data.variantStock);
        }
      } catch (err) {
        console.error("Variant stock fetch failed:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isPhysical, variants.length, page.slug]);

  // ─── TOTAL AMOUNT ───
  const { total: currentTotalAmount } = useMemo(() => {
    if (isDonation) {
      const amt = Number(donorAmount) || 0;
      return { total: amt, breakdown: [] as any[] };
    }

    if (
      isPaymentLink &&
      linkConfig.amountMode === "variable" &&
      customFieldValues.customAmount
    ) {
      const amt = Number(customFieldValues.customAmount) || 0;
      return { total: amt, breakdown: [] };
    }

    if (isSchoolPage) {
      return computeChargeAmount(
        entities,
        Array.from(selectedEntityIds),
        selectedPaymentOption
      );
    }

    // ✅ Physical multi-variant — sum of (unitPrice × qty) per line
    if (isPhysical && variants.length > 0 && selectedVariantSkus.size > 0) {
      let total = 0;

      for (const line of selectedVariantLines) {
        const perUnit =
          selectedPaymentOption === "full"
            ? line.unitPrice
            : line.unitPrice / (page.installmentCount || 1);
        total += perUnit * line.quantity;
      }

      return { total: Math.round(total * 100) / 100, breakdown: [] as any[] };
    }

    if (
      existingAccount &&
      canDoInstallments &&
      existingAccount.remaining_amount > 0
    ) {
      const planTotal = Number(existingAccount.total_amount) || 0;
      const planInstallmentCount =
        Number(existingAccount.installment_count) ||
        Number(page?.installmentCount) ||
        1;
      const accountQuantity =
        Number(existingAccount.selection?.quantity) || quantity;

      const perInstallment =
        planInstallmentCount > 0 ? planTotal / planInstallmentCount : planTotal;
      const perUnitInstallment =
        accountQuantity > 0
          ? perInstallment / accountQuantity
          : perInstallment;

      const nextPayment = Math.min(
        perUnitInstallment * quantity,
        Number(existingAccount.remaining_amount)
      );

      return {
        total: Math.round(nextPayment * 100) / 100,
        breakdown: [] as any[],
      };
    }

    const entityIds = Array.from(selectedEntityIds);
    if (entityIds.length === 0 && entities.length > 0) {
      const fallback = entities[0];
      if (fallback.isFullyPaid) return { total: 0, breakdown: [] };
      const perUnit =
        selectedPaymentOption === "full"
          ? fallback.remainingBalance
          : computeNextInstallmentPayment(fallback);
      const total = perUnit * quantity;
      return { total: Math.round(total * 100) / 100, breakdown: [] };
    }

    const result = computeChargeAmount(
      entities,
      entityIds,
      selectedPaymentOption
    );
    if (showQuantity && quantity > 1) {
      return {
        total: Math.round(result.total * quantity * 100) / 100,
        breakdown: result.breakdown,
      };
    }
    return result;
  }, [
    isDonation,
    donorAmount,
    isPaymentLink,
    linkConfig.amountMode,
    customFieldValues.customAmount,
    isSchoolPage,
    entities,
    selectedEntityIds,
    selectedPaymentOption,
    isPhysical,
    variants.length,
    selectedVariantSkus,
    selectedVariantLines,
    basePrice,
    page.installmentCount,
    showQuantity,
    quantity,
    existingAccount,
    canDoInstallments,
  ]);

  // ─── BUYER PAYABLE ───
  const buyerPayableAmount = useMemo(() => {
    if (isDonation) return currentTotalAmount;
    if (currentTotalAmount <= 0) return currentTotalAmount;
    return Math.round(currentTotalAmount * buyerFeeMultiplier * 100) / 100;
  }, [currentTotalAmount, buyerFeeMultiplier, isDonation]);

  // ─── DISPLAY PRICE (sum of line totals for physical) ───
  const displayPrice = useMemo(() => {
    if (isDonation) return 0;

    if (existingAccount && canDoInstallments) {
      const planTotal = Number(existingAccount.total_amount) || 0;
      const planInstallmentCount =
        Number(existingAccount.installment_count) ||
        Number(page?.installmentCount) ||
        1;
      if (planInstallmentCount > 0) {
        return Math.round((planTotal / planInstallmentCount) * 100) / 100;
      }
    }

    if (selectedPaymentOption === "installment" && installmentPlan) {
      return installmentPlan.installmentAmount;
    }

    if (isPhysical && variants.length > 0) {
      if (selectedVariantSkus.size === 0) return 0;
      // Sum the per-line totals so the big price matches the checkout total
      let sum = 0;
      let any = false;
      for (const sku of selectedVariantSkus) {
        const v = variants.find((x: any) => (x.sku || x.name) === sku);
        const p = Number(v?.price) || Number(page?.price) || 0;
        const q = Math.max(1, variantQuantities[sku] || 1);
        if (p > 0) {
          sum += p * q;
          any = true;
        }
      }
      return any ? sum : 0;
    }

    return Number(page?.price) || 0;
  }, [
    isDonation,
    selectedPaymentOption,
    installmentPlan,
    isPhysical,
    variants,
    selectedVariantSkus,
    variantQuantities,
    page?.price,
    existingAccount,
    canDoInstallments,
  ]);

  const buyerDisplayPrice = useMemo(() => {
    if (isDonation) return 0;
    if (displayPrice <= 0) return displayPrice;
    return Math.round(displayPrice * buyerFeeMultiplier * 100) / 100;
  }, [displayPrice, buyerFeeMultiplier, isDonation]);

  const paidCount = entities.filter((e) => e.isFullyPaid).length;
  const partialCount = entities.filter((e) => e.isPartiallyPaid).length;
  const unpaidCount = entities.filter(
    (e) => !e.isFullyPaid && !e.isPartiallyPaid
  ).length;

  const isOutOfStock =
    (productStock !== null && productStock <= 0) ||
    (isPhysical && variants.length > 0 && isSelectedVariantOOS);

  const isPayButtonDisabled = useCallback(() => {
    if (processingCardPayment || submissionLock) return true;
    if (isOutOfStock) return true;
    if (isPlanComplete) return true;
    if (currentTotalAmount <= 0 && !isDonation) return true;
    if (isPhysical && variants.length > 0 && selectedVariantSkus.size === 0)
      return true;
    if (isPhysical && selectedVariantSkus.size > 0 && isSelectedVariantOOS)
      return true;
    if (isDonation && Number(donorAmount) < minimumDonation) return true;
    return false;
  }, [
    processingCardPayment,
    submissionLock,
    isOutOfStock,
    isPlanComplete,
    currentTotalAmount,
    isDonation,
    isPhysical,
    variants.length,
    selectedVariantSkus,
    isSelectedVariantOOS,
    donorAmount,
    minimumDonation,
  ]);

  const getDisabledReason = useCallback(() => {
    if (processingCardPayment || submissionLock)
      return "Processing payment...";
    if (isOutOfStock) {
      if (isPhysical && selectedVariantSkus.size > 0 && isSelectedVariantOOS) {
        return "One or more selected variants are out of stock";
      }
      return "Out of stock";
    }
    if (isPlanComplete) return "You've completed this plan";
    if (isDonation) {
      if (Number(donorAmount) < minimumDonation)
        return `Minimum donation is ₦${minimumDonation.toLocaleString()}`;
      return "";
    }
    if (currentTotalAmount <= 0) {
      if (isSchoolPage) {
        const allPaid =
          entities.length > 0 && entities.every((e) => e.isFullyPaid);
        return allPaid
          ? "All students are fully paid"
          : "Select at least one student";
      }
      if (isPhysical && variants.length > 0)
        return "Select at least one variant";
      return "Select items to continue";
    }
    return "";
  }, [
    processingCardPayment,
    submissionLock,
    isOutOfStock,
    isPhysical,
    selectedVariantSkus,
    isSelectedVariantOOS,
    isPlanComplete,
    isDonation,
    donorAmount,
    minimumDonation,
    currentTotalAmount,
    isSchoolPage,
    entities,
    variants.length,
  ]);

  const productImages = useMemo(() => {
    if (page.productImages && page.productImages.length > 0)
      return page.productImages;
    if (page.coverImage) return [page.coverImage];
    return [];
  }, [page.productImages, page.coverImage]);

  const storeNameUpper = store.name?.toUpperCase() || "STORE";

  const handleEntityClick = useCallback(
    (entity: PaymentEntity) => {
      if (entity.isFullyPaid) return;
      if (lockedFields) return;
      setSelectedEntityIds((prev) => {
        const next = new Set(prev);
        if (next.has(entity.id)) next.delete(entity.id);
        else next.add(entity.id);
        return next;
      });
    },
    [lockedFields]
  );

  // ─── VARIANT HANDLERS ───
  const handleToggleVariant = useCallback(
    (sku: string) => {
      if (lockedFields) return;
  
      setSelectedVariantSkus((prev) => {
        const next = new Set(prev);
        if (next.has(sku)) {
          next.delete(sku);
          // Clean up the qty entry in the same tick
          setVariantQuantities((q) => {
            if (!(sku in q)) return q;
            const copy = { ...q };
            delete copy[sku];
            return copy;
          });
        } else {
          next.add(sku);
          setVariantQuantities((q) => {
            if (q[sku]) return q;
            return { ...q, [sku]: 1 };
          });
        }
        return next;
      });
    },
    [lockedFields]
  );
  const handleSetVariantQuantity = useCallback(
    (sku: string, qty: number) => {
      if (lockedFields) return;
      const safe = Math.max(1, Math.floor(qty));
      setVariantQuantities((prev) => ({ ...prev, [sku]: safe }));
    },
    [lockedFields]
  );

  const openInfoModal = useCallback(() => {
    if (currentTotalAmount <= 0) {
      alert("Please select items to continue");
      return;
    }
    if (isPhysical && variants.length > 0 && selectedVariantSkus.size === 0) {
      alert("Please select at least one variant");
      return;
    }
    if (isPhysical && selectedVariantSkus.size > 0 && isSelectedVariantOOS) {
      alert("One or more selected variants are out of stock. Please adjust.");
      return;
    }
    setErrors({});
    setShowInfoModal(true);
  }, [
    currentTotalAmount,
    isPhysical,
    variants.length,
    selectedVariantSkus,
    isSelectedVariantOOS,
  ]);

  const validateCustomerInfo = useCallback((): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (isSchoolPage) {
      if (!customerName.trim()) errs.name = "Name is required";
      if (!customerEmail.trim() || !customerEmail.includes("@"))
        errs.email = "Valid email is required";
    }
    if (isDonation) {
      if (requireDonorName && !customerName.trim())
        errs.name = "Name is required";
      if (customerEmail && !customerEmail.includes("@"))
        errs.email = "Valid email is required";
      if (Number(donorAmount) < minimumDonation)
        errs.amount = `Minimum donation is ₦${minimumDonation.toLocaleString()}`;
    }
    if (isPaymentLink) {
      if (!customerName.trim()) errs.name = "Name is required";
      if (!customerEmail.trim() || !customerEmail.includes("@"))
        errs.email = "Valid email is required";
      customFields.forEach((f: any) => {
        if (f.required && !customFieldValues[f.id])
          errs[f.id] = `${f.label} is required`;
      });
      if (linkConfig.amountMode === "variable") {
        const amt = Number(customFieldValues.customAmount);
        if (!amt || amt <= 0) errs.customAmount = "Please enter an amount";
      }
    }
    if (requiresShipping && !lockedFields) {
      if (!shippingAddress.street.trim())
        errs.shippingStreet = "Street address is required";
      if (!shippingAddress.city.trim()) errs.shippingCity = "City is required";
      if (!shippingAddress.state.trim())
        errs.shippingState = "State is required";
    }
    if (bookingEnabled && !lockedFields) {
      if (!bookingDate) errs.bookingDate = "Please select a date";
      if (!bookingTime) errs.bookingTime = "Please select a time";
    }
    return errs;
  }, [
    isSchoolPage,
    isDonation,
    requireDonorName,
    customerName,
    customerEmail,
    donorAmount,
    minimumDonation,
    isPaymentLink,
    customFields,
    customFieldValues,
    linkConfig.amountMode,
    requiresShipping,
    lockedFields,
    shippingAddress,
    bookingEnabled,
    bookingDate,
    bookingTime,
  ]);

  const handleCancelCheckout = useCallback(() => {
    try {
      if (checkoutWindowRef.current && !checkoutWindowRef.current.closed) {
        checkoutWindowRef.current.close();
      }
    } catch {
      /* noop */
    }
    checkoutWindowRef.current = null;

    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }

    setSubmissionLock(false);
    setProcessingCardPayment(false);
  }, []);

  const refreshVariantStock = useCallback(async () => {
    if (!isPhysical || variants.length === 0) return;
    try {
      const res = await fetch(
        `/api/payment-page/public/variant-stock?pageSlug=${encodeURIComponent(
          page.slug
        )}`,
        { cache: "no-store" }
      );
      if (!res.ok) return;
      const data = await res.json();
      if (data?.variantStock && typeof data.variantStock === "object") {
        setLiveVariantStock(data.variantStock);
      }
    } catch (err) {
      console.error("Variant stock refresh failed:", err);
    }
  }, [isPhysical, variants.length, page.slug]);

  // ─── CHECKOUT ───
  const handleCardPayment = useCallback(async () => {
    if (submissionLock) return;

    if (isPhysical && selectedVariantSkus.size > 0 && isSelectedVariantOOS) {
      await Swal.fire({
        icon: "warning",
        title: "Stock changed",
        text: "One or more selected variants just sold out or don't have enough stock. Please adjust your selection.",
        confirmButtonColor: "#FDC020",
      });
      await refreshVariantStock();
      return;
    }

    const totalAmount = buyerPayableAmount;
    if (totalAmount <= 0) {
      alert("Please select items to continue");
      return;
    }

    const isInstallmentPayment =
      selectedPaymentOption === "installment" && canDoInstallments;

    const redirectUrl =
      linkConfig.redirectUrl ||
      page?.metadata?.redirectUrl ||
      `/store/${store?.slug}/${page.slug}`;

    let studentNamesForMetadata: string[] | undefined = undefined;
    if (isSchoolPage) {
      if (existingAccount) {
        const fromAccount = existingAccount.selection?.selectedStudents;
        if (Array.isArray(fromAccount) && fromAccount.length > 0) {
          studentNamesForMetadata = fromAccount;
        } else {
          studentNamesForMetadata = entities
            .filter(
              (e) => e.isFullyPaid || e.isPartiallyPaid || e.paidAmount > 0
            )
            .map((e) => e.name);
        }
      } else {
        studentNamesForMetadata = Array.from(selectedEntityIds);
      }
    }

    const metadata: any = {
      pageType: page?.pageType,
      pageTitle: page?.title,
      paymentType: isInstallmentPayment ? "installment" : "full",
      isInstallment: isInstallmentPayment,
      entityIds: isSchoolPage
        ? studentNamesForMetadata || ["default"]
        : ["default"],
      selectedStudents: isSchoolPage ? studentNamesForMetadata : undefined,
      numberOfStudents: isSchoolPage
        ? studentNamesForMetadata?.length
        : undefined,
      quantity: showQuantity ? quantity : 1,
      totalAmount,
      storeSlug: store?.slug,
      redirectUrl,

      baseAmount: currentTotalAmount,
      buyerFeeAmount:
        Math.round((buyerPayableAmount - currentTotalAmount) * 100) / 100,
      feePayer,
    };

    if (isDonation) {
      metadata.donorMessage = allowDonorMessage ? donorMessage : null;
      metadata.isDonation = true;
    }
    if (isPhysical) {
      metadata.variantLines = selectedVariantLines.map((line) => ({
        sku: line.sku,
        name: line.name,
        unitPrice: line.unitPrice,
        quantity: line.quantity,
      }));

      if (selectedVariantLines.length === 1) {
        metadata.selectedVariantSku = selectedVariantLines[0].sku;
      } else {
        metadata.selectedVariantSku = null;
      }

      metadata.quantity = selectedVariantLines.reduce(
        (sum, l) => sum + l.quantity,
        0
      );

      if (requiresShipping) metadata.shippingAddress = shippingAddress;
    }
    if (isDigital) {
      metadata.emailDelivery = emailDelivery;
      metadata.downloadUrl = page?.metadata?.downloadUrl || null;
      metadata.accessLink = page?.metadata?.accessLink || null;
    }
    if (isServices) {
      if (bookingEnabled) {
        metadata.bookingDate = bookingDate;
        metadata.bookingTime = bookingTime;
      }
      if (customerNoteEnabled && customerNote.trim()) {
        metadata.customerNote = customerNote;
      }
    }
    if (isPaymentLink) {
      metadata.customFields = customFieldValues;
      metadata.referenceCode = linkConfig.referenceCode;
    }
    if (isSchoolPage && Object.keys(schoolFields).length > 0) {
      metadata.schoolFields = schoolFields;
    }

    if (isInstallmentPayment && installmentPlan) {
      const accountTotal = Number(existingAccount?.total_amount) || 0;
      const planTotal =
        accountTotal > 0
          ? accountTotal
          : installmentPlan.totalAmount * (isPhysical ? 1 : quantity);

      const accountInstallmentCount =
        Number(existingAccount?.installment_count) ||
        installmentPlan.installmentCount;
      const perInstallment =
        accountInstallmentCount > 0
          ? planTotal / accountInstallmentCount
          : planTotal;

      const nextInstallmentNumber = existingAccount
        ? (Number(existingAccount.installments_paid) || 0) + 1
        : 1;

      metadata.totalAmount = planTotal;
      metadata.totalInstallments = accountInstallmentCount;
      metadata.installmentAmount = perInstallment;
      metadata.installmentPeriod =
        existingAccount?.installment_period || installmentPlan.period;
      metadata.currentInstallment = nextInstallmentNumber;
    }

    saveBuyerIdentity(page.slug, {
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
    });

    setSubmissionLock(true);
    setProcessingCardPayment(true);
    setShowInfoModal(false);

    try {
      const response = await fetch("/api/payment-page/public/card-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageSlug: page.slug,
          customerName: customerName || "Customer",
          customerEmail,
          customerPhone,
          amount: totalAmount,
          metadata,
          returnUrl: redirectUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (
          data?.code === "VARIANT_OUT_OF_STOCK" ||
          data?.code === "INSUFFICIENT_STOCK"
        ) {
          setSubmissionLock(false);
          setProcessingCardPayment(false);

          await refreshVariantStock();

          await Swal.fire({
            icon: "warning",
            title:
              data?.code === "VARIANT_OUT_OF_STOCK"
                ? "Just sold out"
                : "Not enough stock",
            text:
              data?.error ||
              "This variant just sold out. Please pick another.",
            confirmButtonColor: "#FDC020",
          });
          return;
        }
        throw new Error(data?.error || "Payment initiation failed");
      }

      const checkoutWindow = window.open(data.checkoutLink, "_blank");

      if (!checkoutWindow || checkoutWindow.closed) {
        window.location.href = data.checkoutLink;
        return;
      }

      checkoutWindowRef.current = checkoutWindow;

      const checkInterval = setInterval(async () => {
        try {
          const windowClosed =
            checkoutWindowRef.current != null &&
            checkoutWindowRef.current.closed;

          const statusResponse = await fetch(
            `/api/payment-page/status?reference=${data.orderReference}`
          );
          const statusData = await statusResponse.json();

          if (statusData.payment?.status === "completed") {
            clearInterval(checkInterval);
            if (pollIntervalRef.current) pollIntervalRef.current = null;
            if (pollTimeoutRef.current) {
              clearTimeout(pollTimeoutRef.current);
              pollTimeoutRef.current = null;
            }
            checkoutWindowRef.current = null;

            if (checkoutWindow && !checkoutWindow.closed) {
              checkoutWindow.close();
            }

            refreshVariantStock();

            const identity = loadBuyerIdentity(page.slug);
            const isInstallmentPaymentNow =
              selectedPaymentOption === "installment" && canDoInstallments;

            let freshAccount: any | null = null;

            if (!isSchoolPage && (identity.email || identity.phone)) {
              try {
                const accRes = await fetch(
                  "/api/payment-page/public/installment-account",
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      pageSlug: page.slug,
                      email: identity.email || undefined,
                      phone: identity.phone || undefined,
                    }),
                  }
                );
                const accData = await accRes.json();
                if (accData.found && accData.account) {
                  freshAccount = accData.account;
                  setExistingAccount(accData.account);
                }
              } catch {}
            }

            if (isSchoolPage && (identity.email || identity.phone)) {
              try {
                const paidRes = await fetch(
                  "/api/payment-page/public/school-paid-students",
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      pageSlug: page.slug,
                      email: identity.email || undefined,
                      phone: identity.phone || undefined,
                    }),
                  }
                );
                const paidData = await paidRes.json();
                const map: Record<string, number> = {};
                if (paidData?.success && paidData.students) {
                  for (const [name, info] of Object.entries(
                    paidData.students as any
                  )) {
                    map[name] = Number((info as any).paidAmount) || 0;
                  }
                }
                setMyPaidStudents(map);
                if (paidData?.buyerName) setMyBuyerName(paidData.buyerName);
              } catch {}

              try {
                const accRes = await fetch(
                  "/api/payment-page/public/installment-account",
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      pageSlug: page.slug,
                      email: identity.email || undefined,
                      phone: identity.phone || undefined,
                    }),
                  }
                );
                const accData = await accRes.json();
                if (accData.found && accData.account) {
                  freshAccount = accData.account;
                  setExistingAccount(accData.account);
                }
              } catch {}
            }

            const planJustCompleted =
              freshAccount != null &&
              (freshAccount.is_complete === true ||
                Number(freshAccount.remaining_amount) <= 0 ||
                freshAccount.status === "completed");

            const wasFinal =
              statusData.payment?.metadata
                ?.installment_account_remaining != null &&
              Number(
                statusData.payment.metadata.installment_account_remaining
              ) <= 0;

            const shouldRedirect =
              !isInstallmentPaymentNow || planJustCompleted || wasFinal;

            if (isInstallmentPaymentNow && !shouldRedirect) {
              await Swal.fire({
                icon: "success",
                title: "Installment payment received",
                html: `
                  <div style="text-align:left">
                    <p>${successMessage}</p>
                    <p style="color:#666;font-size:14px;">${thankYouMessage}</p>
                    <p style="font-size:14px;">Amount: <strong>₦${totalAmount.toLocaleString()}</strong></p>
                    ${
                      freshAccount
                        ? `
                          <hr style="border:none;border-top:1px solid #eee;margin:12px 0;" />
                          <p style="font-size:14px;">Paid so far: <strong>₦${Number(
                            freshAccount.total_paid
                          ).toLocaleString()}</strong></p>
                          <p style="font-size:14px;">Remaining: <strong>₦${Number(
                            freshAccount.remaining_amount
                          ).toLocaleString()}</strong></p>
                          <p style="color:#666;font-size:13px;margin-top:8px;">
                            You can continue paying from this page whenever you're ready.
                          </p>
                        `
                        : ""
                    }
                  </div>
                `,
                confirmButtonColor: "#FDC020",
                confirmButtonText: "Continue paying",
              });

              window.location.href = redirectUrl;
              return;
            }

            const finalRedirectUrl =
              statusData.payment?.redirectUrl || redirectUrl;

            await Swal.fire({
              icon: "success",
              title: wasFinal ? "Plan complete" : "Payment successful",
              html: wasFinal
                ? `
                  <div style="text-align:left">
                    <p>You've completed your payment plan.</p>
                    <p style="color:#666;font-size:14px;">A confirmation email has been sent to your inbox.</p>
                    <p style="font-size:14px;">Amount: <strong>₦${totalAmount.toLocaleString()}</strong></p>
                  </div>
                `
                : `
                  <div style="text-align:left">
                    <p>${successMessage}</p>
                    <p style="color:#666;font-size:14px;">${thankYouMessage}</p>
                    <p style="font-size:14px;">Amount: <strong>₦${totalAmount.toLocaleString()}</strong></p>
                  </div>
                `,
              confirmButtonColor: "#FDC020",
              confirmButtonText: "Continue",
            });

            window.location.href = finalRedirectUrl;
            return;
          }

          if (statusData.payment?.status === "failed") {
            clearInterval(checkInterval);
            if (pollIntervalRef.current) pollIntervalRef.current = null;
            if (pollTimeoutRef.current) {
              clearTimeout(pollTimeoutRef.current);
              pollTimeoutRef.current = null;
            }
            checkoutWindowRef.current = null;
            setSubmissionLock(false);
            setProcessingCardPayment(false);

            await Swal.fire({
              icon: "error",
              title: "Payment Failed",
              text: "Your payment could not be processed. Please try again.",
              confirmButtonColor: "#FDC020",
            });
            return;
          }

          if (windowClosed) {
            clearInterval(checkInterval);
            if (pollIntervalRef.current) pollIntervalRef.current = null;
            if (pollTimeoutRef.current) {
              clearTimeout(pollTimeoutRef.current);
              pollTimeoutRef.current = null;
            }
            checkoutWindowRef.current = null;
            setSubmissionLock(false);
            setProcessingCardPayment(false);

            await Swal.fire({
              icon: "info",
              title: "Checkout Cancelled",
              text: "You closed the payment window. No charge was made.",
              confirmButtonColor: "#FDC020",
              confirmButtonText: "Try Again",
            });
            return;
          }
        } catch (err) {
          console.error("Error polling status:", err);
        }
      }, 3000);

      pollIntervalRef.current = checkInterval;

      pollTimeoutRef.current = setTimeout(() => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        if (pollTimeoutRef.current) {
          clearTimeout(pollTimeoutRef.current);
          pollTimeoutRef.current = null;
        }

        if (checkoutWindowRef.current != null || submissionLock) {
          try {
            if (
              checkoutWindowRef.current &&
              !checkoutWindowRef.current.closed
            ) {
              checkoutWindowRef.current.close();
            }
          } catch {
            /* noop */
          }
          checkoutWindowRef.current = null;
          setSubmissionLock(false);
          setProcessingCardPayment(false);

          Swal.fire({
            icon: "info",
            title: "Checkout Timed Out",
            text: "We didn't receive a payment confirmation. If you were charged, a receipt will be emailed to you shortly.",
            confirmButtonColor: "#FDC020",
            confirmButtonText: "OK",
          });
        }
      }, 300000);
    } catch (err: any) {
      alert(err.message || "Failed to initiate payment. Please try again.");
      setSubmissionLock(false);
      setProcessingCardPayment(false);
    } finally {
      setProcessingCardPayment(false);
    }
  }, [
    submissionLock,
    currentTotalAmount,
    selectedPaymentOption,
    canDoInstallments,
    linkConfig.redirectUrl,
    page?.metadata,
    page.slug,
    store?.slug,
    isSchoolPage,
    existingAccount,
    entities,
    selectedEntityIds,
    showQuantity,
    quantity,
    isDonation,
    allowDonorMessage,
    donorMessage,
    isPhysical,
    selectedVariantSkus,
    selectedVariantLines,
    requiresShipping,
    shippingAddress,
    isDigital,
    emailDelivery,
    isServices,
    bookingEnabled,
    bookingDate,
    bookingTime,
    customerNoteEnabled,
    customerNote,
    isPaymentLink,
    customFieldValues,
    linkConfig.referenceCode,
    schoolFields,
    installmentPlan,
    customerName,
    customerEmail,
    customerPhone,
    successMessage,
    thankYouMessage,
    page?.title,
    page?.pageType,
    isSelectedVariantOOS,
    refreshVariantStock,
    buyerPayableAmount,
    feePayer,
  ]);

  const validateAndProceed = useCallback(() => {
    const errs = validateCustomerInfo();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    handleCardPayment();
  }, [validateCustomerInfo, handleCardPayment]);

  // ─── CLEANUP ───
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
      try {
        if (
          checkoutWindowRef.current &&
          !checkoutWindowRef.current.closed
        ) {
          checkoutWindowRef.current.close();
        }
      } catch {
        /* noop */
      }
      checkoutWindowRef.current = null;
    };
  }, []);

  // ─── VIEW TRACKING ───
  useEffect(() => {
    const trackView = async () => {
      try {
        await fetch("/api/payment-page/track-view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pageId: page.id, storeId: store.id }),
        });
      } catch (error) {
        console.error("View tracking error:", error);
      }
    };
    trackView();
  }, [page.id, store.id]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const applyAccountToForm = useCallback(
    (account: any, lock: boolean = true) => {
      const sel = account.selection || {};

      if (account.buyer_name) setCustomerName(account.buyer_name);
      if (account.buyer_email) setCustomerEmail(account.buyer_email);
      if (account.buyer_phone) setCustomerPhone(account.buyer_phone);

      if (Array.isArray(sel.selectedStudents)) {
        setSelectedEntityIds(new Set(sel.selectedStudents));
      }

      // ✅ Multi-variant rehydration with back-compat
      if (Array.isArray(sel.variantLines) && sel.variantLines.length > 0) {
        const skus = new Set<string>();
        const qtys: Record<string, number> = {};
        for (const line of sel.variantLines) {
          if (line?.sku) {
            skus.add(line.sku);
            qtys[line.sku] = Math.max(1, Number(line.quantity) || 1);
          }
        }
        setSelectedVariantSkus(skus);
        setVariantQuantities(qtys);
      } else if (sel.selectedVariantSku) {
        setSelectedVariantSkus(new Set([sel.selectedVariantSku]));
        setVariantQuantities({
          [sel.selectedVariantSku]: Math.max(1, Number(sel.quantity) || 1),
        });
      }

      if (sel.quantity && Number(sel.quantity) > 0) {
        setQuantity(Number(sel.quantity));
      }
      if (sel.shippingAddress) setShippingAddress(sel.shippingAddress);
      if (sel.bookingDate) setBookingDate(sel.bookingDate);
      if (sel.bookingTime) setBookingTime(sel.bookingTime);
      if (sel.customerNote) setCustomerNote(sel.customerNote);
      if (sel.customFields) setCustomFieldValues(sel.customFields);
      if (sel.schoolFields) setSchoolFields(sel.schoolFields);

      if (canDoInstallments) setSelectedPaymentOption("installment");

      setLockedFields(lock);
    },
    [canDoInstallments]
  );

  // ─── RETURNING BUYER LOOKUP ───
  useEffect(() => {
    if (!isMounted) return;

    let cancelled = false;

    const lookup = async () => {
      if (planIdFromUrl) {
        try {
          const res = await fetch(
            "/api/payment-page/public/installment-account-by-id",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ accountId: planIdFromUrl }),
            }
          );
          const data = await res.json();
          if (cancelled) return;
          if (data.found && data.account) {
            setExistingAccount(data.account);
            applyAccountToForm(data.account, true);
            saveBuyerIdentity(page.slug, {
              name: data.account.buyer_name,
              email: data.account.buyer_email,
              phone: data.account.buyer_phone,
            });
            setAccountLookupDone(true);
            return;
          }
        } catch (err) {
          console.error("Plan-id lookup failed:", err);
        }
      }

      const identity = loadBuyerIdentity(page.slug);

      if (!identity.email && !identity.phone) {
        setAccountLookupDone(true);
        return;
      }

      try {
        const res = await fetch(
          "/api/payment-page/public/installment-account",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              pageSlug: page.slug,
              email: identity.email || undefined,
              phone: identity.phone || undefined,
            }),
          }
        );
        const data = await res.json();
        if (cancelled) return;

        if (data.found && data.account) {
          setExistingAccount(data.account);
          applyAccountToForm(data.account, true);
        } else {
          clearBuyerIdentity(page.slug);
        }
      } catch (err) {
        console.error("Returning-buyer lookup failed:", err);
      } finally {
        if (!cancelled) setAccountLookupDone(true);
      }
    };

    lookup();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, page.slug, planIdFromUrl]);

  // ─── ACCOUNT ACTIONS ───
  const handleContinueInstallment = useCallback(() => {
    if (!existingAccount) return;
    applyAccountToForm(existingAccount, true);
    setErrors({});
    setShowInfoModal(true);
  }, [existingAccount, applyAccountToForm]);

  const handleClearAccount = useCallback(() => {
    clearBuyerIdentity(page.slug);
    setExistingAccount(null);
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setSelectedEntityIds(new Set());
    setSelectedVariantSkus(new Set());
    setVariantQuantities({});
    setQuantity(1);
    setShippingAddress({
      street: "",
      city: "",
      state: "",
      country: "Nigeria",
      zipCode: "",
    });
    setBookingDate("");
    setBookingTime("");
    setCustomerNote("");
    setCustomFieldValues({});
    setSchoolFields({});
    setLockedFields(false);
    setSubmissionLock(false);
  }, [page.slug]);

  const handleBuyAgain = useCallback(() => {
    clearBuyerIdentity(page.slug);
    setExistingAccount(null);
    setMyPaidStudents(null);
    setMyBuyerName(null);
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setSelectedEntityIds(new Set());
    setSelectedVariantSkus(new Set());
    setVariantQuantities({});
    setQuantity(1);
    setShippingAddress({
      street: "",
      city: "",
      state: "",
      country: "Nigeria",
      zipCode: "",
    });
    setBookingDate("");
    setBookingTime("");
    setCustomerNote("");
    setCustomFieldValues({});
    setSchoolFields({});
    setLockedFields(false);
    setSubmissionLock(false);
    setSelectedPaymentOption("full");
    setErrors({});
  }, [page.slug]);

  const handleBuyAgainForStudent = useCallback(() => {
    setExistingAccount(null);
    setMyPaidStudents(null);
    setMyBuyerName(null);
    setSelectedEntityIds(new Set());
    setLockedFields(false);
    setSubmissionLock(false);
    setSelectedPaymentOption("full");
    setErrors({});
  }, []);

  const handleUnlockForEdit = useCallback(() => {
    setLockedFields(false);
  }, []);

  const handleLookup = useCallback(async () => {
    const input = lookupInput.trim();
    if (!input) {
      setLookupError("Enter an email or phone number");
      return;
    }

    setLookingUp(true);
    setLookupError("");

    const isEmail = input.includes("@");

    try {
      if (isSchoolPage) {
        const email = isEmail ? input.toLowerCase() : undefined;
        const phone = isEmail ? undefined : input;

        const paidRes = await fetch(
          "/api/payment-page/public/school-paid-students",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pageSlug: page.slug, email, phone }),
          }
        );
        const paidData = await paidRes.json();

        if (!paidData.found) {
          setLookupError(
            "No payments found with that email or phone number."
          );
          return;
        }

        const map: Record<string, number> = {};
        if (paidData?.students) {
          for (const [name, info] of Object.entries(paidData.students as any)) {
            map[name] = Number((info as any).paidAmount) || 0;
          }
        }
        setMyPaidStudents(map);
        if (paidData.buyerName) setMyBuyerName(paidData.buyerName);

        saveBuyerIdentity(page.slug, {
          name: paidData.buyerName || undefined,
          email: paidData.buyerEmail || email,
          phone: paidData.buyerPhone || phone,
        });

        if (paidData.buyerName) setCustomerName(paidData.buyerName);
        if (paidData.buyerEmail) setCustomerEmail(paidData.buyerEmail);
        if (paidData.buyerPhone) setCustomerPhone(paidData.buyerPhone);

        try {
          const accRes = await fetch(
            "/api/payment-page/public/installment-account",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ pageSlug: page.slug, email, phone }),
            }
          );
          const accData = await accRes.json();
          if (accData?.found && accData?.account) {
            setExistingAccount(accData.account);
          } else {
            setExistingAccount(null);
          }
        } catch {
          setExistingAccount(null);
        }
      } else {
        const res = await fetch(
          "/api/payment-page/public/installment-account",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              pageSlug: page.slug,
              email: isEmail ? input.toLowerCase() : undefined,
              phone: isEmail ? undefined : input,
            }),
          }
        );
        const data = await res.json();

        if (!data.found) {
          setLookupError("No plan found with that email or phone number.");
          return;
        }

        setExistingAccount(data.account);
        applyAccountToForm(data.account, true);

        saveBuyerIdentity(page.slug, {
          name: data.account.buyer_name,
          email: data.account.buyer_email,
          phone: data.account.buyer_phone,
        });
      }

      setShowContinueModal(false);
      setLookupInput("");
    } catch (err: any) {
      setLookupError(err.message || "Lookup failed");
    } finally {
      setLookingUp(false);
    }
  }, [lookupInput, isSchoolPage, page.slug, applyAccountToForm]);

  return {
    router,

    // State
    currentImage,
    setCurrentImage,
    selectedEntityIds,
    setSelectedEntityIds,
    selectedPaymentOption,
    setSelectedPaymentOption,
    quantity,
    setQuantity,
    processingCardPayment,
    submissionLock,
    showInfoModal,
    setShowInfoModal,

    customerName,
    setCustomerName,
    customerEmail,
    setCustomerEmail,
    customerPhone,
    setCustomerPhone,
    errors,
    setErrors,

    donorAmount,
    setDonorAmount,
    donorMessage,
    setDonorMessage,

    // ✅ Multi-variant
    selectedVariantSkus,
    setSelectedVariantSkus,
    variantQuantities,
    setVariantQuantities,
    selectedVariantLines,
    handleToggleVariant,
    handleSetVariantQuantity,

    shippingAddress,
    setShippingAddress,

    bookingDate,
    setBookingDate,
    bookingTime,
    setBookingTime,
    customerNote,
    setCustomerNote,

    customFieldValues,
    setCustomFieldValues,
    schoolFields,
    setSchoolFields,

    existingAccount,
    setExistingAccount,
    myPaidStudents,
    setMyPaidStudents,
    myBuyerName,
    setMyBuyerName,

    accountLookupDone,
    showContinueModal,
    setShowContinueModal,
    lookupInput,
    setLookupInput,
    lookingUp,
    lookupError,
    setLookupError,
    lockedFields,

    // Derived
    pageType,
    isPaymentLink,
    isSchoolPage,
    isDonation,
    isPhysical,
    isDigital,
    isServices,
    showQuantity,
    productStock,
    allowMultiple,
    canPickQuantity,
    linkConfig,
    customFields,
    variants,
    feeBreakdown,
    schoolRequiredFields,
    requireDonorName,
    showDonorList,
    allowDonorMessage,
    minimumDonation,
    suggestedAmounts,
    requiresShipping,
    bookingEnabled,
    customerNoteEnabled,
    emailDelivery,
    successMessage,
    thankYouMessage,
    installmentPlan,
    canDoInstallments,
    isPlanComplete,
    isAccountFullyPaid,
    showActivePlanCard,
    basePrice,
    entities,
    currentTotalAmount,
    displayPrice,
    paidCount,
    partialCount,
    unpaidCount,
    isOutOfStock,
    productImages,
    storeNameUpper,
    variantStockMap,
    isSelectedVariantOOS,

    feePayer,
    buyerFeeMultiplier,
    buyerPayableAmount,
    buyerDisplayPrice,

    // Handlers
    handleEntityClick,
    openInfoModal,
    validateCustomerInfo,
    validateAndProceed,
    handleCardPayment,
    handleCancelCheckout,
    handleContinueInstallment,
    handleClearAccount,
    handleBuyAgain,
    handleBuyAgainForStudent,
    handleUnlockForEdit,
    handleLookup,
    isPayButtonDisabled,
    getDisabledReason,
  };
}