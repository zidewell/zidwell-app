// app/store/[storeSlug]/[productSlug]/client.tsx
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import {
  ChevronLeft,
  ChevronRight,
  Shield,
  Loader2,
  CreditCard,
  X,
  Package,
  Users,
  Minus,
  Plus,
  ShoppingCart,
  CircleCheck,
  CircleAlert,
  CircleDot,
  Truck,
  Calendar,
  Clock,
  MessageSquare,
  Download,
  AlertTriangle,
  Info,
  Lock,
  CalendarIcon,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { Calendar as DateCalendar } from "@/app/components/ui/calendar";

interface PaymentPage {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImage: string | null;
  logo: string | null;
  productImages: string[];
  priceType: "fixed" | "installment" | "open";
  price: number;
  installmentCount?: number;
  feeMode: "bearer" | "customer";
  pageType: string;
  metadata: any;
  pageViews: number;
}

interface StoreData {
  id: string;
  name: string;
  slug: string;
  description: string;
  city?: string;
  state?: string;
}

interface StoreProductClientProps {
  page: PaymentPage;
  store: StoreData;
  initialPaidStudents?: Record<string, number>;
}

type PaymentOption = "full" | "installment";

const QUANTITY_PAGE_TYPES = [
  "physical",
  "digital",
  "services",
  "real_estate",
  "stock",
  "savings",
  "crypto",
];

const PRIMARY_BG = "bg-[#FDC020]";
const PRIMARY_BG_HOVER = "hover:bg-[#e6a800]";
const PRIMARY_TEXT = "text-[#191919]";

function DescriptionBlock({ html }: { html: string }) {
  const [expanded, setExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const check = () => {
      setIsOverflowing(el.scrollHeight > 140);
    };

    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [html]);

  const formatted = html
    .replace(/<p>/g, '<p class="mb-3">')
    .replace(/<ol>/g, '<ol class="list-decimal pl-5 space-y-1 my-2">')
    .replace(/<ul>/g, '<ul class="list-disc pl-5 space-y-1 my-2">')
    .replace(/<li>/g, '<li class="mb-1">');

  return (
    <div className="mt-8 border-t border-border pt-6">
      <h2 className="text-sm font-semibold mb-4">
        <span className="inline-block pb-2 border-b-2 border-[#FDC020]">
          Details
        </span>
      </h2>
      <div className="relative">
        <div
          ref={contentRef}
          className="text-[15px] leading-7 text-foreground/70 max-w-none overflow-hidden"
          style={{ maxHeight: expanded ? "none" : "140px" }}
          dangerouslySetInnerHTML={{ __html: formatted }}
        />

        {!expanded && isOverflowing && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        )}
      </div>

      {isOverflowing && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-sm font-medium underline text-foreground hover:no-underline"
        >
          {expanded ? "See less" : "See more"}
        </button>
      )}
    </div>
  );
}

function TimePicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const slots: string[] = [];
  for (let h = 8; h <= 20; h++) {
    for (const m of [0, 30]) {
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      slots.push(`${hh}:${mm}`);
    }
  }

  return (
    <div className="max-h-64 overflow-y-auto p-1">
      <div className="grid grid-cols-3 gap-1">
        {slots.map((slot) => {
          const selected = value === slot;
          const label = format(new Date(`2000-01-01T${slot}`), "h:mm a");
          return (
            <button
              key={slot}
              type="button"
              disabled={disabled}
              onClick={() => onChange(slot)}
              className={`rounded-md px-3 py-2 text-sm transition ${
                selected
                  ? "bg-[#FDC020] text-[#191919] font-semibold"
                  : "hover:bg-muted text-foreground/80"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function StoreProductClient({
  page,
  store,
  initialPaidStudents = {},
}: StoreProductClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planIdFromUrl = searchParams.get("plan");

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

  const [selectedVariantSku, setSelectedVariantSku] = useState<string | null>(
    null
  );
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

  const installmentPlan = useMemo(() => {
    if (
      page?.priceType !== "installment" ||
      !page?.installmentCount ||
      page.installmentCount <= 1
    ) {
      return null;
    }

    const totalAmount = Number(page?.price) || 0;

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

  const basePrice = useMemo(() => {
    if (isPhysical && selectedVariantSku) {
      const v = variants.find(
        (x: any) => (x.sku || x.name) === selectedVariantSku
      );
      if (v) return Number(v.price) || Number(page?.price) || 0;
    }
    if (isDonation) return Number(donorAmount) || 0;
    return Number(page?.price) || 0;
  }, [
    isPhysical,
    selectedVariantSku,
    variants,
    page?.price,
    isDonation,
    donorAmount,
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

    if (isPhysical && variants.length > 0 && selectedVariantSku) {
      const perUnit =
        selectedPaymentOption === "full"
          ? basePrice
          : basePrice / (page.installmentCount || 1);
      const total = perUnit * quantity;
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
    selectedVariantSku,
    basePrice,
    page.installmentCount,
    showQuantity,
    quantity,
    existingAccount,
    canDoInstallments,
  ]);

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
      if (selectedVariantSku) {
        const v = variants.find(
          (x: any) => (x.sku || x.name) === selectedVariantSku
        );
        return Number(v?.price) || Number(page?.price) || 0;
      }
      return 0;
    }
    return Number(page?.price) || 0;
  }, [
    isDonation,
    selectedPaymentOption,
    installmentPlan,
    isPhysical,
    variants,
    selectedVariantSku,
    page?.price,
    existingAccount,
    canDoInstallments,
  ]);

  const storeNameUpper = store.name?.toUpperCase() || "STORE";

  const paidCount = entities.filter((e) => e.isFullyPaid).length;
  const partialCount = entities.filter((e) => e.isPartiallyPaid).length;
  const unpaidCount = entities.filter(
    (e) => !e.isFullyPaid && !e.isPartiallyPaid
  ).length;

  const handleEntityClick = (entity: PaymentEntity) => {
    if (entity.isFullyPaid) return;
    if (lockedFields) return;
    setSelectedEntityIds((prev) => {
      const next = new Set(prev);
      if (next.has(entity.id)) next.delete(entity.id);
      else next.add(entity.id);
      return next;
    });
  };

  const openInfoModal = () => {
    if (currentTotalAmount <= 0) {
      alert("Please select items to continue");
      return;
    }
    if (isPhysical && variants.length > 0 && !selectedVariantSku) {
      alert("Please select a variant");
      return;
    }
    setErrors({});
    setShowInfoModal(true);
  };

  const validateCustomerInfo = (): Record<string, string> => {
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
  };

  const validateAndProceed = () => {
    const errs = validateCustomerInfo();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    handleCardPayment();
  };

  const handleCardPayment = async () => {
    if (submissionLock) return;

    const totalAmount = currentTotalAmount;
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
    };

    if (isDonation) {
      metadata.donorMessage = allowDonorMessage ? donorMessage : null;
      metadata.isDonation = true;
    }
    if (isPhysical) {
      if (selectedVariantSku) metadata.selectedVariantSku = selectedVariantSku;
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
          : installmentPlan.totalAmount * quantity;

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
      if (!response.ok) throw new Error(data.error);

      const checkoutWindow = window.open(data.checkoutLink, "_blank");

      if (!checkoutWindow || checkoutWindow.closed) {
        window.location.href = data.checkoutLink;
        return;
      }

      const checkInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(
            `/api/payment-page/status?reference=${data.orderReference}`
          );
          const statusData = await statusResponse.json();

          if (statusData.payment?.status === "completed") {
            clearInterval(checkInterval);
            if (checkoutWindow && !checkoutWindow.closed) {
              checkoutWindow.close();
            }

            const identity = loadBuyerIdentity(page.slug);
            const isInstallmentPaymentNow =
              selectedPaymentOption === "installment" && canDoInstallments;

            // ─── Refresh the installment account so we know the new remaining ───
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

            // ─── Decide whether the plan is now fully paid ───
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

            // ─── Mid-plan: stay on the page ───
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

              // Refresh the page so the account card shows the new totals.
              window.location.href = redirectUrl;
              return;
            }

            // ─── Final installment, or non-installment payment ───
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
          }
        } catch (err) {
          console.error("Error polling status:", err);
        }
      }, 3000);

      setTimeout(() => clearInterval(checkInterval), 300000);
    } catch (err: any) {
      alert(err.message || "Failed to initiate payment. Please try again.");
      setSubmissionLock(false);
    } finally {
      setProcessingCardPayment(false);
    }
  };

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
  }, [isMounted, page.slug, planIdFromUrl]);

  const applyAccountToForm = (account: any, lock: boolean = true) => {
    const sel = account.selection || {};

    if (account.buyer_name) setCustomerName(account.buyer_name);
    if (account.buyer_email) setCustomerEmail(account.buyer_email);
    if (account.buyer_phone) setCustomerPhone(account.buyer_phone);

    if (Array.isArray(sel.selectedStudents)) {
      setSelectedEntityIds(new Set(sel.selectedStudents));
    }

    if (sel.selectedVariantSku) setSelectedVariantSku(sel.selectedVariantSku);
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
  };

  const handleContinueInstallment = () => {
    if (!existingAccount) return;
    applyAccountToForm(existingAccount, true);
    setErrors({});
    setShowInfoModal(true);
  };

  const handleClearAccount = () => {
    clearBuyerIdentity(page.slug);
    setExistingAccount(null);
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setSelectedEntityIds(new Set());
    setSelectedVariantSku(null);
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
  };

  const handleBuyAgain = () => {
    clearBuyerIdentity(page.slug);
    setExistingAccount(null);
    setMyPaidStudents(null);
    setMyBuyerName(null);
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setSelectedEntityIds(new Set());
    setSelectedVariantSku(null);
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
  };

  const handleBuyAgainForStudent = () => {
    setExistingAccount(null);
    setMyPaidStudents(null);
    setMyBuyerName(null);
    setSelectedEntityIds(new Set());
    setLockedFields(false);
    setSubmissionLock(false);
    setSelectedPaymentOption("full");
    setErrors({});
  };

  const handleUnlockForEdit = () => {
    setLockedFields(false);
  };

  const handleLookup = async () => {
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
  };

  const isOutOfStock = productStock !== null && productStock <= 0;

  const isPayButtonDisabled = () => {
    if (processingCardPayment || submissionLock) return true;
    if (isOutOfStock) return true;
    if (isPlanComplete) return true;
    if (currentTotalAmount <= 0 && !isDonation) return true;
    if (isPhysical && variants.length > 0 && !selectedVariantSku) return true;
    if (isDonation && Number(donorAmount) < minimumDonation) return true;
    return false;
  };

  const getDisabledReason = () => {
    if (processingCardPayment || submissionLock)
      return "Processing payment...";
    if (isOutOfStock) return "Out of stock";
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
      if (isPhysical && variants.length > 0) return "Select a variant";
      return "Select items to continue";
    }
    return "";
  };

  const productImages = useMemo(() => {
    if (page.productImages && page.productImages.length > 0)
      return page.productImages;
    if (page.coverImage) return [page.coverImage];
    return [];
  }, [page.productImages, page.coverImage]);

  const typeLabels: Record<string, string> = {
    school: "School Fees",
    donation: "Donation",
    physical: "Physical Product",
    digital: "Digital Product",
    services: "Service",
    real_estate: "Real Estate Investment",
    stock: "Stock Investment",
    savings: "Savings / Ajo",
    crypto: "Crypto Investment",
    link: "Payment Link",
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex h-20 max-w-[1320px] items-center justify-between px-5 lg:px-10">
        <a href="#" aria-label="Store home" className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-widest uppercase text-foreground">
            {storeNameUpper}
          </span>
        </a>
        <nav className="flex items-center gap-2 sm:gap-5">
          <button
            className="relative rounded-full border border-border p-2.5"
            type="button"
            aria-label="Shopping cart"
          >
            <ShoppingCart size={18} className="text-foreground/60" />
            <span
              className={`absolute -right-1 -top-1 flex min-w-4 h-4 items-center justify-center rounded-full ${PRIMARY_BG} text-[10px] font-semibold ${PRIMARY_TEXT} px-1`}
            >
              {canPickQuantity ? quantity : selectedEntityIds.size || 0}
            </span>
          </button>
        </nav>
      </header>

      <section className="mx-auto grid max-w-[1320px] gap-10 px-5 pb-20 pt-7 lg:grid-cols-[minmax(380px,1fr)_minmax(420px,1.65fr)] lg:gap-12 lg:px-10 lg:pt-8">
        <div className="relative lg:pt-1">
          <div className="overflow-hidden rounded-2xl border border-border bg-muted/30">
            {productImages.length > 0 ? (
              <img
                src={productImages[currentImage]}
                alt={page.title}
                className="aspect-square w-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder-image.png";
                  e.currentTarget.onerror = null;
                }}
              />
            ) : (
              <div className="aspect-square w-full flex items-center justify-center">
                <Package className="h-20 w-20 text-foreground/20" />
              </div>
            )}
          </div>
          {productImages.length > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <button
                className="rounded-full border border-border p-2 text-foreground/60 transition hover:bg-muted"
                type="button"
                aria-label="Previous image"
                onClick={() =>
                  setCurrentImage((c) =>
                    c === 0 ? productImages.length - 1 : c - 1
                  )
                }
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex gap-2">
                {productImages.map((_, i) => (
                  <span
                    key={i}
                    className={`size-2 rounded-full ${
                      i === currentImage ? "bg-[#FDC020]" : "bg-border"
                    }`}
                  />
                ))}
              </div>
              <button
                className="rounded-full border border-border p-2 text-foreground/60 transition hover:bg-muted"
                type="button"
                aria-label="Next image"
                onClick={() =>
                  setCurrentImage((c) =>
                    c === productImages.length - 1 ? 0 : c + 1
                  )
                }
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <span className="w-fit rounded-full border border-border px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-foreground/60">
            {isPaymentLink
              ? "Payment Link"
              : typeLabels[page.pageType] || "Product"}
          </span>

          <h1 className="mt-4 max-w-[780px] text-pretty text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-[44px]">
            {page.title}
          </h1>

          <p className="mt-3 text-sm text-foreground/50">{store.name}</p>

          {showQuantity && productStock !== null && (
            <div className="mt-4">
              {isOutOfStock ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-foreground/70">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Out of stock
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-foreground/70">
                  <Package className="h-3.5 w-3.5" />
                  {productStock.toLocaleString()}{" "}
                  {productStock === 1 ? "unit" : "units"} available
                </span>
              )}
            </div>
          )}

          {showQuantity && productStock === null && !isOutOfStock && (
            <div className="mt-4">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-foreground/70">
                <Package className="h-3.5 w-3.5" />
                In stock
              </span>
            </div>
          )}

          {isSchoolPage && !isPlanComplete && (
            <button
              type="button"
              onClick={() => setShowContinueModal(true)}
              className="mt-4 w-fit inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs text-foreground/70 hover:border-[#FDC020] hover:text-foreground"
            >
              <Info className="h-3.5 w-3.5" />
              Paid before? Find my payments
            </button>
          )}

          {!isSchoolPage &&
            !existingAccount &&
            accountLookupDone &&
            !isPlanComplete &&
            (showQuantity || canDoInstallments) && (
              <button
                type="button"
                onClick={() => setShowContinueModal(true)}
                className="mt-4 w-fit inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs text-foreground/70 hover:border-[#FDC020] hover:text-foreground"
              >
                <Info className="h-3.5 w-3.5" />
                Already paid before? Continue your plan
              </button>
            )}

          {isSchoolPage && myPaidStudents && Object.keys(myPaidStudents).length > 0 && (
            <div className="mt-4 rounded-xl border border-[#FDC020] bg-[#FDC020]/5 p-4">
              <div className="flex items-start gap-3">
                <CircleCheck className="h-4 w-4 text-[#191919] dark:text-[#FDC020] shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">
                    {myBuyerName ? `Welcome back, ${myBuyerName}` : "Your payments"}
                  </p>
                  <p className="mt-1 text-xs text-foreground/70">
                    You've paid for {Object.keys(myPaidStudents).length}{" "}
                    student(s). Your students are highlighted below.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setMyPaidStudents(null);
                      setMyBuyerName(null);
                      clearBuyerIdentity(page.slug);
                    }}
                    className="mt-2 text-xs underline text-foreground/60 hover:text-foreground"
                  >
                    Not you? Clear
                  </button>
                </div>
              </div>
            </div>
          )}

          {existingAccount && isPlanComplete && (
            <div className="mt-6 rounded-xl border border-border bg-muted/20 p-5">
              <div className="flex items-start gap-3">
                <CircleCheck className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">
                    You've completed your payment
                  </p>
                  <p className="mt-1 text-sm text-foreground/70">
                    Thank you, {existingAccount.buyer_name || "customer"}. You
                    paid the full amount for <strong>{page.title}</strong>. A
                    confirmation email was sent to{" "}
                    {existingAccount.buyer_email || "your email"}.
                  </p>

                  <div className="mt-4 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-foreground/60">Total paid</span>
                      <span className="font-medium">
                        ₦{Number(existingAccount.total_paid).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/60">Plan amount</span>
                      <span className="font-medium">
                        ₦{Number(existingAccount.total_amount).toLocaleString()}
                      </span>
                    </div>
                    {existingAccount.installment_count && (
                      <div className="flex justify-between">
                        <span className="text-foreground/60">
                          Installments
                        </span>
                        <span className="font-medium">
                          {existingAccount.installments_paid}/
                          {existingAccount.installment_count}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleBuyAgain}
                    className="mt-4 text-sm font-medium underline text-foreground hover:no-underline"
                  >
                    Buy again
                  </button>
                </div>
              </div>
            </div>
          )}

          {isSchoolPage && isAccountFullyPaid && existingAccount && (
            <div className="mt-6 rounded-xl border border-border bg-muted/20 p-5">
              <div className="flex items-start gap-3">
                <CircleCheck className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">
                    This plan is fully paid
                  </p>
                  <p className="mt-1 text-sm text-foreground/70">
                    {existingAccount.student_name ? (
                      <>
                        <strong>{existingAccount.student_name}</strong>'s fee
                        has been paid in full.
                      </>
                    ) : (
                      "This payment plan is complete."
                    )}
                  </p>

                  <div className="mt-4 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-foreground/60">Total paid</span>
                      <span className="font-medium">
                        ₦{Number(existingAccount.total_paid).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/60">Plan amount</span>
                      <span className="font-medium">
                        ₦{Number(existingAccount.total_amount).toLocaleString()}
                      </span>
                    </div>
                    {existingAccount.installment_count && (
                      <div className="flex justify-between">
                        <span className="text-foreground/60">
                          Installments
                        </span>
                        <span className="font-medium">
                          {existingAccount.installments_paid}/
                          {existingAccount.installment_count}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleBuyAgainForStudent}
                    className="mt-4 text-sm font-medium underline text-foreground hover:no-underline"
                  >
                    Pay for another student
                  </button>
                </div>
              </div>
            </div>
          )}

          {showActivePlanCard && (
            <div className="mt-6 rounded-xl border border-border bg-muted/20 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">
                    {isSchoolPage ? "Active payment plan" : "Active payment plan"}
                  </p>
                  <p className="mt-1 text-sm text-foreground/60">
                    {existingAccount.buyer_name
                      ? `Welcome back, ${existingAccount.buyer_name}`
                      : "Welcome back"}
                  </p>
                  {isSchoolPage && existingAccount.student_name && (
                    <p className="mt-1 text-xs text-foreground/50">
                      Plan for <strong>{existingAccount.student_name}</strong>
                    </p>
                  )}
                </div>
                <button
                  onClick={handleClearAccount}
                  className="text-xs text-foreground/50 hover:text-foreground underline"
                >
                  Not you?
                </button>
              </div>

              <div className="mt-4 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-foreground/60">Paid</span>
                  <span className="font-medium">
                    ₦{Number(existingAccount.total_paid).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/60">Remaining</span>
                  <span className="font-medium">
                    ₦{Number(existingAccount.remaining_amount).toLocaleString()}
                  </span>
                </div>
                {existingAccount.installment_count && (
                  <div className="flex justify-between">
                    <span className="text-foreground/60">Installments</span>
                    <span className="font-medium">
                      {existingAccount.installments_paid}/
                      {existingAccount.installment_count}
                    </span>
                  </div>
                )}
              </div>

              {Number(existingAccount.total_amount) > 0 && (
                <div className="mt-4">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full bg-[#FDC020] transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          (Number(existingAccount.total_paid) /
                            Number(existingAccount.total_amount)) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              <Button
                onClick={handleContinueInstallment}
                disabled={submissionLock}
                className="mt-4 w-full rounded-lg bg-[#FDC020] text-[#191919] hover:bg-[#e6a800] py-5 text-sm font-semibold disabled:opacity-60"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Continue paying installment
                {existingAccount.installment_amount && (
                  <span className="ml-2 text-xs font-normal opacity-70">
                    (₦
                    {Number(
                      existingAccount.installment_amount
                    ).toLocaleString()}
                    )
                  </span>
                )}
              </Button>
            </div>
          )}

          {canPickQuantity && !isOutOfStock && !isPlanComplete && (
            <div className="mt-6 border-y border-border py-4">
              <div className="flex items-center">
                <span className="mr-4 text-sm font-medium text-foreground/70">
                  Quantity
                </span>
                <div className="flex items-center rounded-full border border-border px-3 py-1.5">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    aria-label="Decrease quantity"
                    disabled={quantity <= 1 || lockedFields}
                    className="disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="min-w-10 text-center text-sm font-medium">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = quantity + 1;
                      if (productStock !== null && next > productStock) return;
                      setQuantity(next);
                    }}
                    aria-label="Increase quantity"
                    disabled={
                      lockedFields ||
                      (productStock !== null && quantity >= productStock)
                    }
                    className="disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                {lockedFields && (
                  <span className="ml-3 inline-flex items-center gap-1 text-xs text-foreground/50">
                    <Lock className="h-3 w-3" />
                    Locked
                  </span>
                )}
                {productStock !== null && !lockedFields && (
                  <span className="ml-auto text-xs text-foreground/50">
                    Max {productStock}
                  </span>
                )}
              </div>
            </div>
          )}

          {showQuantity && isOutOfStock && (
            <div className="mt-6 flex items-center gap-2 rounded-xl border border-border bg-muted/30 p-3">
              <AlertTriangle className="h-4 w-4 text-foreground/60" />
              <p className="text-sm font-medium">
                This item is currently out of stock
              </p>
            </div>
          )}

          {!isDonation && !isPlanComplete && (
            <div className="mt-5">
              {isPhysical && variants.length > 0 && !selectedVariantSku ? (
                <span className="text-2xl font-semibold tracking-tight text-foreground/50">
                  Select a variant
                </span>
              ) : (
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-3xl font-semibold tracking-tight text-[#191919] dark:text-[#FDC020]">
                    ₦{displayPrice.toLocaleString()}
                  </span>
                  {selectedPaymentOption === "installment" &&
                  installmentPlan ? (
                    <span className="text-sm text-foreground/50">
                      per payment
                      {existingAccount?.installment_count
                        ? ` · ${existingAccount.installment_count} payments`
                        : ` · ${installmentPlan.installmentCount} payments`}
                    </span>
                  ) : showQuantity && quantity > 1 ? (
                    <span className="text-sm text-foreground/50">
                      × {quantity} {quantity === 1 ? "unit" : "units"}
                    </span>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {canDoInstallments && !existingAccount && !isPlanComplete && (
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedPaymentOption("full")}
                disabled={lockedFields}
                className={`rounded-full px-5 py-2.5 text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed ${
                  selectedPaymentOption === "full"
                    ? `${PRIMARY_BG} ${PRIMARY_TEXT}`
                    : "border border-border text-foreground/70 hover:bg-muted"
                }`}
              >
                Pay in full
              </button>
              <button
                type="button"
                onClick={() => setSelectedPaymentOption("installment")}
                disabled={lockedFields}
                className={`rounded-full px-5 py-2.5 text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed ${
                  selectedPaymentOption === "installment"
                    ? `${PRIMARY_BG} ${PRIMARY_TEXT}`
                    : "border border-border text-foreground/70 hover:bg-muted"
                }`}
              >
                Pay in installments
              </button>
            </div>
          )}

          {canDoInstallments &&
            installmentPlan &&
            !existingAccount &&
            !isPlanComplete && (
              <p className="mt-3 text-xs text-foreground/50">
                {selectedPaymentOption === "installment"
                  ? `${installmentPlan.installmentCount} payments of ₦${(
                      (installmentPlan.totalAmount * quantity) /
                      installmentPlan.installmentCount
                    ).toLocaleString()} (${installmentPlan.period})`
                  : "One-time payment."}
              </p>
            )}

          {isDonation && !isPlanComplete && (
            <div className="mt-6 space-y-4">
              {suggestedAmounts.length > 0 && (
                <div>
                  <Label className="mb-2 block text-sm font-medium">
                    Suggested amounts
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {suggestedAmounts.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setDonorAmount(String(amt))}
                        className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                          Number(donorAmount) === amt
                            ? `${PRIMARY_BG} ${PRIMARY_TEXT}`
                            : "border border-border text-foreground/70 hover:bg-muted"
                        }`}
                      >
                        ₦{amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label className="mb-1.5 block text-sm font-medium">
                  Amount (min ₦{minimumDonation.toLocaleString()})
                </Label>
                <Input
                  type="number"
                  min={minimumDonation}
                  value={donorAmount}
                  onChange={(e) => setDonorAmount(e.target.value)}
                  placeholder={`${minimumDonation}`}
                />
                {errors.amount && (
                  <p className="mt-1 text-xs text-red-500">{errors.amount}</p>
                )}
              </div>
            </div>
          )}

          {isPhysical && variants.length > 0 && !isPlanComplete && (
            <div className="mt-6">
              <Label className="mb-2 block text-sm font-medium">
                {lockedFields ? "Your variant" : "Select variant"}
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {variants.map((v: any, idx: number) => {
                  const sku = v.sku || v.name;
                  const selected = selectedVariantSku === sku;
                  const price = Number(v.price) || Number(page?.price) || 0;
                  const variantStock =
                    v.stock != null ? Number(v.stock) : null;
                  const variantOOS = variantStock !== null && variantStock <= 0;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (variantOOS || lockedFields) return;
                        setSelectedVariantSku(sku);
                      }}
                      disabled={variantOOS || lockedFields}
                      className={`rounded-xl border p-3 text-center transition disabled:cursor-not-allowed ${
                        selected
                          ? "border-[#FDC020] bg-[#FDC020]/5"
                          : variantOOS
                          ? "border-border opacity-40"
                          : "border-border hover:border-[#FDC020]/60"
                      } ${lockedFields && !selected ? "opacity-40" : ""}`}
                    >
                      <p className="text-sm font-medium">{v.name}</p>
                      <p className="mt-1 text-sm text-foreground/60">
                        ₦{price.toLocaleString()}
                      </p>
                      {variantStock !== null && (
                        <p className="mt-1 text-xs text-foreground/40">
                          {variantOOS ? "Unavailable" : `${variantStock} left`}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {isDigital && !isPlanComplete && (
            <div className="mt-5 flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3">
              <Download className="h-4 w-4 text-foreground/60" />
              <p className="text-xs text-foreground/70">
                {emailDelivery
                  ? "Download link will be sent to your email"
                  : "Access will be granted after payment"}
              </p>
            </div>
          )}

          {requiresShipping && !isPlanComplete && (
            <div className="mt-5 flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3">
              <Truck className="h-4 w-4 text-foreground/60" />
              <p className="text-xs text-foreground/70">
                Delivery address required at checkout
              </p>
            </div>
          )}

          {isServices &&
            !isPlanComplete &&
            (bookingEnabled || customerNoteEnabled) && (
              <div className="mt-5 rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs font-medium mb-1">
                  Additional information required
                </p>
                <ul className="text-xs text-foreground/60 space-y-0.5 list-disc pl-4">
                  {bookingEnabled && <li>Preferred date & time</li>}
                  {customerNoteEnabled && <li>A note about your request</li>}
                </ul>
              </div>
            )}

          {isSchoolPage && entities.length > 0 && (
            <div className="mt-6">
              <div className="mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-foreground/60" />
                <h3 className="text-sm font-semibold">Students</h3>
                <span className="ml-auto text-xs text-foreground/50">
                  {entities.length} student(s)
                </span>
              </div>

              {entities.length > 1 && (
                <div className="mb-4 flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-foreground/70">
                    <CircleCheck className="h-3 w-3" /> {paidCount} paid
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-foreground/70">
                    <CircleAlert className="h-3 w-3" /> {partialCount} partial
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-foreground/70">
                    <CircleDot className="h-3 w-3" /> {unpaidCount} pending
                  </span>
                </div>
              )}

              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {entities.map((entity) => {
                  const isSelected = selectedEntityIds.has(entity.id);
                  const nextPayment = computeNextInstallmentPayment(entity);
                  const isMine =
                    myPaidStudents != null &&
                    myPaidStudents[entity.name] != null &&
                    myPaidStudents[entity.name] > 0;

                  if (entity.isFullyPaid) {
                    return (
                      <div
                        key={entity.id}
                        aria-disabled="true"
                        onClick={(e) => e.stopPropagation()}
                        className={`rounded-lg border-2 bg-green-500/10 p-3 cursor-not-allowed select-none opacity-90 ${
                          isMine
                            ? "border-green-600 ring-2 ring-[#FDC020]/60"
                            : "border-green-500"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <CircleCheck className="h-4 w-4 text-green-600 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-green-800 dark:text-green-300">
                                {entity.name}
                                {isMine && (
                                  <span className="ml-2 inline-flex items-center rounded-full bg-[#FDC020] px-2 py-0.5 text-[10px] font-semibold text-[#191919]">
                                    You
                                  </span>
                                )}
                              </p>
                              {entity.metadata?.className && (
                                <p className="mt-0.5 text-xs text-green-700/70 dark:text-green-400/70">
                                  Class {entity.metadata.className}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                              ₦{entity.paidAmount.toLocaleString()}
                            </p>
                            <p className="mt-0.5 text-[10px] font-medium text-green-700 dark:text-green-400">
                              Paid
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (entity.isPartiallyPaid) {
                    return (
                      <div
                        key={entity.id}
                        className={`rounded-lg border-2 bg-[#FDC020]/5 p-3 ${
                          isMine
                            ? "border-[#FDC020] ring-2 ring-[#FDC020]/60"
                            : "border-[#FDC020]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium">
                              {entity.name}
                              {isMine && (
                                <span className="ml-2 inline-flex items-center rounded-full bg-[#FDC020] px-2 py-0.5 text-[10px] font-semibold text-[#191919]">
                                  You
                                </span>
                              )}
                            </p>
                            {entity.metadata?.className && (
                              <p className="mt-0.5 text-xs text-foreground/50">
                                Class {entity.metadata.className}
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold text-[#191919] dark:text-[#FDC020]">
                              ₦{entity.paidAmount.toLocaleString()}
                              <span className="text-xs font-normal text-foreground/50">
                                {" "}
                                / ₦{entity.totalAmount.toLocaleString()}
                              </span>
                            </p>
                            <p className="mt-0.5 text-[10px] text-foreground/50">
                              ₦{entity.remainingBalance.toLocaleString()} left
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  const canSelect = !lockedFields;
                  return (
                    <div
                      key={entity.id}
                      onClick={() => canSelect && handleEntityClick(entity)}
                      className={`rounded-lg border p-3 transition ${
                        canSelect ? "cursor-pointer" : "cursor-default"
                      } ${
                        isSelected
                          ? "border-[#FDC020] bg-[#FDC020]/5"
                          : isMine
                          ? "border-[#FDC020] bg-[#FDC020]/5 ring-2 ring-[#FDC020]/40"
                          : "border-border hover:border-[#FDC020]/60"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">
                            {entity.name}
                            {isMine && (
                              <span className="ml-2 inline-flex items-center rounded-full bg-[#FDC020] px-2 py-0.5 text-[10px] font-semibold text-[#191919]">
                                You
                              </span>
                            )}
                          </p>
                          {entity.metadata?.className && (
                            <p className="mt-0.5 text-xs text-foreground/50">
                              Class {entity.metadata.className}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold">
                            ₦
                            {(selectedPaymentOption === "installment"
                              ? nextPayment
                              : entity.remainingBalance
                            ).toLocaleString()}
                          </p>
                          {selectedPaymentOption === "installment" && (
                            <p className="mt-0.5 text-[10px] text-foreground/50">
                              per installment
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedEntityIds.size > 0 && (
                <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Total</span>
                    <span className="font-semibold">
                      ₦{currentTotalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {isSchoolPage && feeBreakdown.length > 0 && (
            <div className="mt-6 border-t border-border pt-4">
              <h3 className="mb-3 text-sm font-semibold">Fee breakdown</h3>
              {feeBreakdown.map((item: any, i: number) => (
                <div key={i} className="flex justify-between py-1.5 text-sm">
                  <span className="text-foreground/60">{item.label}</span>
                  <span className="font-medium">
                    ₦{Number(item.amount).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}

          {isPaymentLink && customFields.length > 0 && !isPlanComplete && (
            <div className="mt-6 border-t border-border pt-4">
              <h3 className="mb-3 text-sm font-semibold">
                Additional information required
              </h3>
              <div className="space-y-1">
                {customFields.map((f: any, i: number) => (
                  <div key={i} className="text-sm text-foreground/60">
                    {f.label}
                    {f.required ? " *" : ""}
                  </div>
                ))}
              </div>
            </div>
          )}

          {lockedFields && !isPlanComplete && !isSchoolPage && (
            <div className="mt-6 flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3">
              <Lock className="h-4 w-4 text-foreground/60" />
              <p className="flex-1 text-xs text-foreground/70">
                Details locked from your previous payment
              </p>
              <button
                type="button"
                onClick={handleUnlockForEdit}
                className="text-xs font-medium text-foreground underline"
              >
                Unlock to edit
              </button>
            </div>
          )}

          {!isPlanComplete && (
            <div className="mt-6 border-t border-border pt-6">
              <Button
                onClick={openInfoModal}
                disabled={isPayButtonDisabled()}
                className={`w-full rounded-full py-6 text-base font-semibold transition ${
                  isPayButtonDisabled()
                    ? "bg-muted text-foreground/40 cursor-not-allowed"
                    : `${PRIMARY_BG} ${PRIMARY_TEXT} ${PRIMARY_BG_HOVER}`
                }`}
              >
                {processingCardPayment || submissionLock ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing
                  </>
                ) : isOutOfStock ? (
                  <>
                    <AlertTriangle className="mr-2 h-5 w-5" /> Out of stock
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-5 w-5" />
                    {isDonation
                      ? `Donate ₦${(Number(donorAmount) || 0).toLocaleString()}`
                      : showQuantity && quantity > 1
                      ? `Pay ₦${currentTotalAmount.toLocaleString()} for ${quantity} items`
                      : `Pay ₦${currentTotalAmount.toLocaleString()}`}
                  </>
                )}
              </Button>

              {isPayButtonDisabled() && !processingCardPayment && (
                <p className="mt-2 text-center text-xs text-foreground/50">
                  {getDisabledReason()}
                </p>
              )}
            </div>
          )}

          {page.description && <DescriptionBlock html={page.description} />}

          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-foreground/40">
            <Shield className="h-3.5 w-3.5" />
            Secured checkout
          </div>

          {isDonation && showDonorList && !isPlanComplete && (
            <div className="mt-8 rounded-lg border border-border bg-muted/20 p-4">
              <h3 className="text-sm font-medium">Recent donors</h3>
              <p className="mt-1 text-xs text-foreground/50">
                Donor list will appear here once donations are received.
              </p>
            </div>
          )}
        </div>
      </section>

      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-background p-6"
          >
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {isDonation ? "Your donation" : "Your information"}
              </h3>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-foreground/50 hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {(!isDonation || requireDonorName) && (
                <div>
                  <Label className="mb-1.5 block text-sm font-medium">
                    Full name *
                  </Label>
                  <Input
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      if (errors.name) setErrors({ ...errors, name: "" });
                    }}
                    className={errors.name ? "border-red-500" : ""}
                    placeholder="Enter your name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                  )}
                </div>
              )}

              <div>
                <Label className="mb-1.5 block text-sm font-medium">
                  Email {!isDonation && "*"}
                </Label>
                <Input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => {
                    setCustomerEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: "" });
                  }}
                  className={errors.email ? "border-red-500" : ""}
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                )}
              </div>

              <div>
                <Label className="mb-1.5 block text-sm font-medium">
                  Phone number
                </Label>
                <Input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="08012345678"
                />
              </div>

              {requiresShipping && (
                <div className="border-t border-border pt-4">
                  <p className="mb-3 flex items-center gap-2 text-sm font-medium">
                    <Truck className="h-4 w-4 text-foreground/60" />
                    Delivery address
                  </p>
                  <div className="space-y-3">
                    <div>
                      <Label className="mb-1 block text-xs font-medium">
                        Street address *
                      </Label>
                      <Input
                        value={shippingAddress.street}
                        onChange={(e) =>
                          setShippingAddress({
                            ...shippingAddress,
                            street: e.target.value,
                          })
                        }
                        className={
                          errors.shippingStreet ? "border-red-500" : ""
                        }
                        placeholder="123 Main St"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="mb-1 block text-xs font-medium">
                          City *
                        </Label>
                        <Input
                          value={shippingAddress.city}
                          onChange={(e) =>
                            setShippingAddress({
                              ...shippingAddress,
                              city: e.target.value,
                            })
                          }
                          placeholder="Lagos"
                        />
                      </div>
                      <div>
                        <Label className="mb-1 block text-xs font-medium">
                          State *
                        </Label>
                        <Input
                          value={shippingAddress.state}
                          onChange={(e) =>
                            setShippingAddress({
                              ...shippingAddress,
                              state: e.target.value,
                            })
                          }
                          placeholder="Lagos"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {bookingEnabled && (
                <div className="border-t border-border pt-5">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FDC020]/15">
                      <CalendarIcon className="h-4 w-4 text-[#191919] dark:text-[#FDC020]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Book your session</p>
                      <p className="text-xs text-foreground/50">
                        Pick a date and time that works for you
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className={`flex w-full items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3 text-left transition hover:border-[#FDC020]/60 ${
                            errors.bookingDate ? "border-red-500" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <CalendarIcon className="h-4 w-4 text-foreground/60" />
                            <div>
                              <p className="text-xs text-foreground/50">
                                Preferred date
                              </p>
                              <p className="text-sm font-medium">
                                {bookingDate
                                  ? format(
                                      new Date(bookingDate),
                                      "EEEE, MMM d, yyyy"
                                    )
                                  : "Select a date"}
                              </p>
                            </div>
                          </div>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="p-0">
                        <DateCalendar
                          mode="single"
                          selected={
                            bookingDate ? new Date(bookingDate) : undefined
                          }
                          onSelect={(d) => {
                            if (!d) return;
                            setBookingDate(
                              `${d.getFullYear()}-${String(
                                d.getMonth() + 1
                              ).padStart(2, "0")}-${String(d.getDate()).padStart(
                                2,
                                "0"
                              )}`
                            );
                            if (errors.bookingDate)
                              setErrors({ ...errors, bookingDate: "" });
                          }}
                          disabled={(d) =>
                            d < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>

                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className={`flex w-full items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3 text-left transition hover:border-[#FDC020]/60 ${
                            errors.bookingTime ? "border-red-500" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 text-foreground/60" />
                            <div>
                              <p className="text-xs text-foreground/50">
                                Preferred time
                              </p>
                              <p className="text-sm font-medium">
                                {bookingTime
                                  ? format(
                                      new Date(`2000-01-01T${bookingTime}`),
                                      "h:mm a"
                                    )
                                  : "Select a time"}
                              </p>
                            </div>
                          </div>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-64 p-2">
                        <TimePicker
                          value={bookingTime}
                          onChange={(v) => {
                            setBookingTime(v);
                            if (errors.bookingTime)
                              setErrors({ ...errors, bookingTime: "" });
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {bookingDate && bookingTime && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#FDC020]/40 bg-[#FDC020]/5 px-3 py-2">
                      <CircleCheck className="h-3.5 w-3.5 text-[#191919] dark:text-[#FDC020] shrink-0" />
                      <p className="text-xs text-foreground/80">
                        Booking for{" "}
                        <strong>
                          {format(
                            new Date(`${bookingDate}T${bookingTime}`),
                            "EEEE, MMM d 'at' h:mm a"
                          )}
                        </strong>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {customerNoteEnabled && (
                <div>
                  <Label className="mb-1.5 flex items-center gap-2 text-sm font-medium">
                    <MessageSquare className="h-3.5 w-3.5 text-foreground/60" />
                    Note (optional)
                  </Label>
                  <Textarea
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    placeholder="Describe your request"
                    rows={3}
                  />
                </div>
              )}

              {isDonation && allowDonorMessage && (
                <div>
                  <Label className="mb-1.5 block text-sm font-medium">
                    Message (optional)
                  </Label>
                  <Textarea
                    value={donorMessage}
                    onChange={(e) => setDonorMessage(e.target.value)}
                    placeholder="Leave a message"
                    rows={3}
                    className="resize-none"
                  />
                </div>
              )}

              {isPaymentLink && customFields.length > 0 && (
                <div className="border-t border-border pt-4">
                  <p className="mb-3 text-sm font-medium">
                    Additional information
                  </p>
                  <div className="space-y-3">
                    {linkConfig.amountMode === "variable" && (
                      <div>
                        <Label className="mb-1.5 block text-sm font-medium">
                          Amount *
                        </Label>
                        <Input
                          type="number"
                          value={customFieldValues.customAmount || ""}
                          onChange={(e) =>
                            setCustomFieldValues({
                              ...customFieldValues,
                              customAmount: e.target.value,
                            })
                          }
                          placeholder="Enter amount"
                        />
                      </div>
                    )}
                    {customFields.map((field: any) => (
                      <div key={field.id}>
                        <Label className="mb-1.5 block text-sm font-medium">
                          {field.label}
                          {field.required ? " *" : ""}
                        </Label>
                        {field.type === "paragraph" ? (
                          <Textarea
                            value={customFieldValues[field.id] || ""}
                            onChange={(e) =>
                              setCustomFieldValues({
                                ...customFieldValues,
                                [field.id]: e.target.value,
                              })
                            }
                            rows={3}
                            className="resize-none"
                          />
                        ) : field.type === "dropdown" ? (
                          <select
                            value={customFieldValues[field.id] || ""}
                            onChange={(e) =>
                              setCustomFieldValues({
                                ...customFieldValues,
                                [field.id]: e.target.value,
                              })
                            }
                            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground"
                          >
                            <option value="">Select {field.label}</option>
                            {(field.options || []).map(
                              (opt: string, i: number) => (
                                <option key={i} value={opt}>
                                  {opt}
                                </option>
                              )
                            )}
                          </select>
                        ) : field.type === "checkbox" ? (
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={!!customFieldValues[field.id]}
                              onChange={(e) =>
                                setCustomFieldValues({
                                  ...customFieldValues,
                                  [field.id]: e.target.checked,
                                })
                              }
                              className="rounded"
                            />
                            <span>Yes</span>
                          </label>
                        ) : (
                          <Input
                            type={
                              field.type === "number"
                                ? "number"
                                : field.type === "date"
                                ? "date"
                                : "text"
                            }
                            value={customFieldValues[field.id] || ""}
                            onChange={(e) =>
                              setCustomFieldValues({
                                ...customFieldValues,
                                [field.id]: e.target.value,
                              })
                            }
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isSchoolPage && schoolRequiredFields.length > 0 && (
                <div className="border-t border-border pt-4">
                  <p className="mb-3 text-sm font-medium">
                    Additional information
                  </p>
                  <div className="space-y-3">
                    {schoolRequiredFields.map((field: string, i: number) => (
                      <div key={i}>
                        <Label className="mb-1.5 block text-sm font-medium">
                          {field}
                        </Label>
                        <Input
                          value={schoolFields[field] || ""}
                          onChange={(e) =>
                            setSchoolFields({
                              ...schoolFields,
                              [field]: e.target.value,
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-border bg-muted/20 p-3">
                {showQuantity && quantity > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground/60">
                      {quantity} × ₦
                      {(
                        currentTotalAmount / Math.max(quantity, 1)
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span className="font-medium">
                      ₦{currentTotalAmount.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2 mt-2 border-t border-border">
                  <span className="text-sm font-medium">Amount</span>
                  <span className="text-lg font-semibold">
                    ₦{currentTotalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              <Button
                onClick={validateAndProceed}
                disabled={processingCardPayment || submissionLock}
                className={`w-full rounded-lg ${PRIMARY_BG} ${PRIMARY_TEXT} ${PRIMARY_BG_HOVER} py-3 text-sm font-semibold disabled:opacity-60`}
              >
                {processingCardPayment || submissionLock ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    {isDonation ? "Donate now" : "Proceed to payment"}
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {showContinueModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-2xl border border-border bg-background p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {isSchoolPage ? "Find my payments" : "Find your plan"}
              </h3>
              <button
                onClick={() => {
                  setShowContinueModal(false);
                  setLookupError("");
                  setLookupInput("");
                }}
                className="text-foreground/50 hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-4 text-sm text-foreground/60">
              {isSchoolPage
                ? "Enter the email or phone number you used when paying for a student."
                : "Enter the email or phone number you used for your first installment."}
            </p>

            <div className="space-y-3">
              <Input
                value={lookupInput}
                onChange={(e) => {
                  setLookupInput(e.target.value);
                  setLookupError("");
                }}
                placeholder="Email or phone number"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleLookup();
                }}
              />

              {lookupError && (
                <p className="text-xs text-red-500">{lookupError}</p>
              )}

              <Button
                onClick={handleLookup}
                disabled={lookingUp}
                className={`w-full rounded-lg ${PRIMARY_BG} ${PRIMARY_TEXT} ${PRIMARY_BG_HOVER} py-3 text-sm font-semibold`}
              >
                {lookingUp ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Looking up
                  </>
                ) : isSchoolPage ? (
                  "Find my payments"
                ) : (
                  "Find my plan"
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="fixed bottom-4 left-4 rounded-full border border-border bg-background px-4 py-2 text-xs text-foreground/50">
        Powered by <span className="font-medium text-foreground">Zidwell</span>
      </div>
    </div>
  );
}