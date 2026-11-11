// components/Invoice-components/hooks/useInvoiceForm.ts
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUserContextData } from "@/app/context/userData";
import { useSubscription } from "@/app/hooks/useSubscripion";
import { InvoiceForm, InvoiceUsageInfo } from "../types";
import {
  generateInvoiceId,
  generateItemId,
  calculateTotals,
} from "../utils/invoiceUtils";
import { showCustomNotification } from "../utils/notification";

// Numeric invoice limit per tier — Infinity means unlimited.
// booster/console are normalized to starter by useSubscription.
const INVOICE_LIMITS: Record<string, number> = {
  free: 5,
  starter: 5,
  sme: Infinity,
  enterprise: Infinity,
};

const resolveInvoiceLimit = (tier: string): number =>
  INVOICE_LIMITS[tier] ?? 5;

export const useInvoiceForm = (onInvoiceCreated?: () => void) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userData } = useUserContextData();
  const { userTier } = useSubscription();

  const tierLimit = resolveInvoiceLimit(userTier);
  const hasUnlimitedAccess = !Number.isFinite(tierLimit);

  const [form, setForm] = useState<InvoiceForm>({
    name: "",
    email: "",
    message: "",
    invoice_id: "",
    bill_to: "",
    from: "",
    issue_date: new Date().toISOString().slice(0, 10),
    customer_note: "",
    invoice_items: [],
    payment_type: "single",
    fee_option: "customer",
    status: "draft",
    business_logo: "",
    redirect_url: "",
    business_name: "",
    senderName: "",
    senderPhone: "",
    allowMultiplePayments: false,
    clientPhone: "",
    targetQuantity: 1,
    sendEmailAutomatically: true,
  });

  // Initial usage — reflects the tier's real limit immediately
  const [invoiceUsage, setInvoiceUsage] = useState<InvoiceUsageInfo>({
    used: 0,
    limit: hasUnlimitedAccess ? "unlimited" : tierLimit,
    remaining: hasUnlimitedAccess ? "unlimited" : tierLimit,
    hasAccess: true,
    isChecking: true,
    canCreate: hasUnlimitedAccess,
  });

  // Fetch usage — the DB (`subscription_features`) wins over the local fallback
  useEffect(() => {
    const fetchUsage = async () => {
      if (!userData?.id) return;

      try {
        const res = await fetch("/api/user/usage");
        if (res.ok) {
          const data = await res.json();
          const apiLimit = data.invoices?.limit;
          const apiRemaining = data.invoices?.remaining;
          const used = data.invoices?.used ?? 0;

          const isUnlimited = apiLimit === "unlimited";
          const canCreate = isUnlimited
            ? true
            : typeof apiRemaining === "number"
              ? apiRemaining > 0
              : false;

          setInvoiceUsage({
            used,
            limit: isUnlimited ? "unlimited" : (apiLimit ?? tierLimit),
            remaining: isUnlimited
              ? "unlimited"
              : (apiRemaining ??
                Math.max(0, tierLimit - used)),
            hasAccess: isUnlimited || canCreate,
            isChecking: false,
            canCreate,
          });
        } else {
          setInvoiceUsage((prev) => ({ ...prev, isChecking: false }));
        }
      } catch (error) {
        console.error("Error fetching usage:", error);
        setInvoiceUsage((prev) => ({ ...prev, isChecking: false }));
      }
    };

    fetchUsage();
  }, [userData?.id, userTier, tierLimit]);

  // Initialize from userData
  useEffect(() => {
    if (userData) {
      const today = new Date().toISOString().slice(0, 10);

      setForm((prev) => ({
        ...prev,
        invoice_id: prev.invoice_id || generateInvoiceId(),
        issue_date: today,
        from: prev.from || userData.email || "",
        business_name: prev.business_name || userData.fullName
          ? `${userData.fullName}`
          : userData.email || "",
        senderName: prev.senderName || userData.fullName || userData.email || "",
        senderPhone: prev.senderPhone || userData.phone || "",
      }));
    }
  }, [userData]);

  const handleItemSubmit = (item: any) => {
    const itemWithId = {
      ...item,
      id: item.id || generateItemId(),
    };

    if (item.id) {
      setForm((prev) => ({
        ...prev,
        invoice_items: prev.invoice_items.map((i) =>
          i.id === item.id ? itemWithId : i,
        ),
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        invoice_items: [...prev.invoice_items, itemWithId],
      }));
    }
  };

  const removeItem = (id: string) => {
    const updatedItems = form.invoice_items.filter((item) => item.id !== id);
    setForm((prev) => ({
      ...prev,
      invoice_items: updatedItems,
    }));

    showCustomNotification({
      type: "success",
      title: "Item Removed!",
      message: "Item has been removed from the invoice.",
    });
  };

  const validateInvoiceForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.business_name.trim())
      newErrors.business_name = "Business name is required.";
    if (!form.email.trim()) {
      newErrors.email = "Client email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Invalid email format.";
    }

    if (form.invoice_items.length === 0) {
      newErrors.invoice_items = "At least one invoice item is required.";
    } else {
      form.invoice_items.forEach((item, index) => {
        if (!item.description.trim()) {
          newErrors[`item_${index}`] = `Item ${index + 1} description is required.`;
        }
        if (!item.quantity || Number(item.quantity) <= 0) {
          newErrors[`quantity_${index}`] = `Item ${index + 1} quantity must be greater than 0.`;
        }
        if (!item.unitPrice || Number(item.unitPrice) <= 0) {
          newErrors[`price_${index}`] = `Item ${index + 1} price must be greater than 0.`;
        }
      });
    }

    if (
      form.allowMultiplePayments &&
      (!form.targetQuantity || form.targetQuantity < 1)
    ) {
      newErrors.targetQuantity = "Target quantity must be at least 1.";
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Unlimited tiers (sme/enterprise) always can create. Starter/free
  // rely on `remaining` from the DB.
  const canCreate = (): boolean => {
    if (invoiceUsage.isChecking) return false;
    if (hasUnlimitedAccess) return true;
    if (typeof invoiceUsage.remaining === "number") {
      return invoiceUsage.remaining > 0;
    }
    return invoiceUsage.remaining === "unlimited";
  };

  const remainingInvoices = (): number => {
    if (typeof invoiceUsage.remaining === "number") {
      return invoiceUsage.remaining;
    }
    return hasUnlimitedAccess ? Infinity : 0;
  };

  return {
    form,
    setForm,
    invoiceUsage,
    handleItemSubmit,
    removeItem,
    validateInvoiceForm,
    handleChange,
    calculateTotals: () => calculateTotals(form.invoice_items, form.fee_option),
    canCreate: canCreate(),
    remainingInvoices: remainingInvoices(),
    hasUnlimitedAccess,
    isChecking: invoiceUsage.isChecking,
    userTier,
  };
};