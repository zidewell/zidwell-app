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

export const useInvoiceForm = (onInvoiceCreated?: () => void) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userData } = useUserContextData();
  const { userTier, isPremium, isGrowth, isElite, isZidLite } = useSubscription();

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
    allowMultiplePayments: false,
    clientPhone: "",
    targetQuantity: 1,
  });

  // NEW: Usage tracking with the subscription system
  const [invoiceUsage, setInvoiceUsage] = useState<InvoiceUsageInfo>({
    used: 0,
    limit: 5,
    remaining: 5,
    hasAccess: true,
    isChecking: true,
    canCreate: true,
  });

  // Fetch usage data
  useEffect(() => {
    const fetchUsage = async () => {
      if (!userData?.id) return;

      try {
        const res = await fetch("/api/user/usage");
        if (res.ok) {
          const data = await res.json();
          
          // Determine if user can create based on tier and remaining
          let canCreate = false;
          const hasUnlimited = data.invoices.limit === "unlimited";
          
          if (hasUnlimited) {
            canCreate = true; // Unlimited tiers can always create
          } else {
            // For limited tiers (free/zidlite), check remaining count
            const remaining = data.invoices.remaining;
            canCreate = typeof remaining === "number" && remaining > 0;
          }

          setInvoiceUsage({
            used: data.invoices.used,
            limit: data.invoices.limit,
            remaining: data.invoices.remaining,
            hasAccess: data.invoices.remaining > 0 || hasUnlimited,
            isChecking: false,
            canCreate: canCreate,
          });
        }
      } catch (error) {
        console.error("Error fetching usage:", error);
        setInvoiceUsage((prev) => ({ ...prev, isChecking: false }));
      }
    };

    fetchUsage();
  }, [userData?.id, userTier]);

  // Initialize from userData
  useEffect(() => {
    if (userData) {
      const today = new Date().toISOString().slice(0, 10);

      setForm((prev) => ({
        ...prev,
        invoice_id: generateInvoiceId(),
        issue_date: today,
        from: userData.email || "",
        business_name: userData.fullName
          ? `${userData.fullName}`
          : userData.email || "",
      }));
    }
  }, [userData]);

  const handleItemSubmit = (item: any) => {
    const itemWithId = {
      ...item,
      id: generateItemId(),
    };

    if (item.id) {
      // Update existing item
      setForm((prev) => ({
        ...prev,
        invoice_items: prev.invoice_items.map((i) =>
          i.id === item.id ? itemWithId : i,
        ),
      }));
    } else {
      // Add new item
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
    let newErrors: Record<string, string> = {};

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
          newErrors[`item_${index}`] = `Item ${
            index + 1
          } description is required.`;
        }
        if (!item.quantity || Number(item.quantity) <= 0) {
          newErrors[`quantity_${index}`] = `Item ${
            index + 1
          } quantity must be greater than 0.`;
        }
        if (!item.unitPrice || Number(item.unitPrice) <= 0) {
          newErrors[`price_${index}`] = `Item ${
            index + 1
          } price must be greater than 0.`;
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

  // FIXED: Proper canCreate check that handles "unlimited" correctly
  const getCanCreate = (): boolean => {
    // If still checking, default to false
    if (invoiceUsage.isChecking) return false;
    
    // Premium/Growth/Elite always have unlimited access
    if (isPremium || isGrowth || isElite) return true;
    
    // For limited tiers (free/zidlite), check if remaining > 0
    if (typeof invoiceUsage.remaining === "number") {
      return invoiceUsage.remaining > 0;
    }
    
    // If remaining is "unlimited" (shouldn't happen for free/zidlite), return true
    return invoiceUsage.remaining === "unlimited";
  };

  // FIXED: Get remaining count as number for display
  const getRemainingCount = (): number => {
    if (typeof invoiceUsage.remaining === "number") {
      return invoiceUsage.remaining;
    }
    // For unlimited tiers, return a high number for display
    return 999;
  };

  // Check if user has unlimited access
  const hasUnlimitedAccess = isPremium || isGrowth || isElite;

  return {
    form,
    setForm,
    invoiceUsage,
    handleItemSubmit,
    removeItem,
    validateInvoiceForm,
    handleChange,
    calculateTotals: () => calculateTotals(form.invoice_items, form.fee_option),
    canCreate: getCanCreate(),
    remainingInvoices: getRemainingCount(),
    hasUnlimitedAccess,
    isChecking: invoiceUsage.isChecking,
    userTier,
  };
};