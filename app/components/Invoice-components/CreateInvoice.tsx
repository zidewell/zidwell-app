"use client";

import React, { JSX, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import confetti from "canvas-confetti";
import Swal from "sweetalert2";

import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Badge } from "../ui/badge";
import {
  Plus,
  ArrowLeft,
  Save,
  Edit,
  Eye,
  FileText,
  AlertCircle,
  Crown,
  Zap,
  Sparkles,
  Star,
  CheckCircle2,
  Info,
  Loader2,
  Mail,
} from "lucide-react";

import InvoiceSummary from "./InvoiceSummary";
import { InvoicePreview } from "../previews/InvoicePreview";
import LogoUpload from "./LogoUpload";
import DraftsModal from "./DraftModal";
import InvoiceItemForm from "./InvoiceItemForm";
import InvoiceItemRow from "./InvoiceItemRow";
import SuccessModal from "./SuccessModal";
import TabsNavigation from "./TabsNavigation";

import {
  generateInvoiceId,
  generateItemId,
  calculateTotals,
  convertToInvoicePreview,
} from "./utils/invoiceUtils";
import {
  CreateInvoiceProps,
  InvoiceForm,
  Draft,
  InvoiceUsageInfo,
} from "./types";

import { useUserContextData } from "@/app/context/userData";
import { useSubscription } from "@/app/hooks/useSubscripion";

const showSweetAlert = (
  type: "success" | "error" | "warning" | "info",
  title: string,
  message: string,
): Promise<any> => {
  const isDark = document.documentElement.classList.contains("dark");

  return Swal.fire({
    icon: type,
    title: title,
    text: message,
    showConfirmButton: true,
    confirmButtonText: "OK",
    confirmButtonColor: "var(--color-accent-yellow)",
    background: isDark ? "#1f2937" : "var(--bg-primary)",
    color: isDark ? "#f3f4f6" : "var(--text-primary)",
    customClass: {
      popup: "sweet-alert-popup squircle-lg",
      title: "sweet-alert-title",
      htmlContainer: "sweet-alert-content",
      confirmButton: "sweet-alert-confirm-btn",
    },
  });
};

const CreateInvoice = ({ onInvoiceCreated }: CreateInvoiceProps) => {
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
  const [hasShownDraftModal, setHasShownDraftModal] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showInvoiceSummary, setShowInvoiceSummary] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedSigningLink, setGeneratedSigningLink] = useState<string>("");
  const [savedInvoiceId, setSavedInvoiceId] = useState<string>("");
  const [details, setDetails] = useState<any>(null);
  const [paymentProgress, setPaymentProgress] = useState({
    totalAmount: 0,
    paidAmount: 0,
    remainingAmount: 0,
    progress: 0,
    status: "unpaid",
    paidQuantity: 0,
    targetQuantity: 1,
  });

  const [showDraftsModal, setShowDraftsModal] = useState(false);
  const [userDrafts, setUserDrafts] = useState<Draft[]>([]);
  const [isFormLocked, setIsFormLocked] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<"create" | "preview">("create");
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const { userData, balance } = useUserContextData();
  const { userTier, subscription, isPremium, isGrowth, isElite, isZidLite } =
    useSubscription();
  const [hasLoadedFromUrl, setHasLoadedFromUrl] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Determine user tier
  const isFree = userTier === "free";
  const isZidLiteUser = userTier === "zidlite";
  const isGrowthUser = userTier === "growth";
  const isPremiumUser = userTier === "premium" || userTier === "elite";
  const hasUnlimitedInvoices = isPremiumUser || isGrowthUser;

  // Invoice limits by tier
  const freeTierLimit = 5;
  const zidLiteLimit = 20;

  const [invoiceUsage, setInvoiceUsage] = useState<InvoiceUsageInfo>({
    used: 0,
    limit: hasUnlimitedInvoices
      ? "unlimited"
      : isZidLiteUser
        ? zidLiteLimit
        : freeTierLimit,
    remaining: hasUnlimitedInvoices
      ? "unlimited"
      : isZidLiteUser
        ? zidLiteLimit
        : freeTierLimit,
    hasAccess: true,
    isChecking: true,
    canCreate: true,
  });

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
    sendEmailAutomatically: true,
  });

  // Safe balance value (handle null)
  const safeBalance = balance || 0;

  // Get tier icon and color
  const getTierInfo = () => {
    if (isElite)
      return {
        icon: Sparkles,
        color: "text-purple-600 dark:text-purple-400",
        bg: "bg-purple-100 dark:bg-purple-900/30",
        label: "Elite",
      };
    if (isPremium)
      return {
        icon: Crown,
        color: "text-[var(--color-accent-yellow)]",
        bg: "bg-[var(--color-accent-yellow)]/10 dark:bg-[var(--color-accent-yellow)]/20",
        label: "Premium",
      };
    if (isGrowth)
      return {
        icon: Zap,
        color: "text-green-600 dark:text-green-400",
        bg: "bg-green-100 dark:bg-green-900/30",
        label: "Growth",
      };
    if (isZidLite)
      return {
        icon: Zap,
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-100 dark:bg-blue-900/30",
        label: "ZidLite",
      };
    return {
      icon: Star,
      color: "text-gray-600 dark:text-gray-400",
      bg: "bg-gray-100 dark:bg-gray-800",
      label: "Free Trial",
    };
  };

  const tierInfo = getTierInfo();
  const TierIcon = tierInfo.icon;

  const resetAllLoadingStates = () => {
    setLoading(false);
    setIsFormLocked(false);
  };

  const handleItemSubmit = (item: any) => {
    const itemWithId = {
      ...item,
      id: generateItemId(),
    };

    if (editingItem) {
      setForm((prev) => ({
        ...prev,
        invoice_items: prev.invoice_items.map((i) =>
          i.id === editingItem.id ? itemWithId : i,
        ),
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        invoice_items: [...prev.invoice_items, itemWithId],
      }));
    }
    setIsItemDialogOpen(false);
    setEditingItem(null);
  };

  const removeItem = (id: string) => {
    const updatedItems = form.invoice_items.filter((item) => {
      return item.id !== id;
    });

    setForm((prev) => ({
      ...prev,
      invoice_items: updatedItems,
    }));

    showSweetAlert(
      "success",
      "Item Removed!",
      "Item has been removed from the invoice.",
    );
  };

  // Fetch usage and account details
  useEffect(() => {
    const fetchData = async () => {
      if (!userData?.id) return;

      try {
        // Fetch usage
        const usageRes = await fetch("/api/user/usage");
        if (usageRes.ok) {
          const data = await usageRes.json();

          setInvoiceUsage({
            used: data.invoices.used || 0,
            limit: data.invoices.limit,
            remaining: data.invoices.remaining,
            hasAccess: true,
            isChecking: false,
            canCreate: data.invoices.canCreate,
          });
        }

        // Fetch account details for bank info
        const detailsRes = await fetch("/api/get-wallet-account-details", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: userData.id }),
        });
        const data = await detailsRes.json();
        setDetails(data);
      } catch (error) {
        console.error("Error fetching data:", error);
        setInvoiceUsage((prev) => ({ ...prev, isChecking: false }));
      }
    };

    fetchData();
  }, [userData?.id]);

  useEffect(() => {
    const draftId = searchParams?.get("draftId");

    if (draftId && userData?.id && !hasLoadedFromUrl) {
      const loadDraftFromParam = async () => {
        try {
          const res = await fetch(
            `/api/get-invoice-draft-details?draftId=${draftId}&userId=${userData.id}`,
          );
          const result = await res.json();

          if (res.ok && result.draft) {
            loadDraftIntoForm(result.draft);
            setHasLoadedFromUrl(true);
          } else {
            showSweetAlert(
              "error",
              "Draft Not Found",
              result.error || "The requested draft could not be found.",
            );
          }
        } catch (error) {
          console.error("Failed to load draft from URL:", error);
          showSweetAlert(
            "error",
            "Error",
            "Failed to load the draft. Please try again.",
          );
        }
      };

      loadDraftFromParam();
    }
  }, [searchParams, userData?.id, hasLoadedFromUrl]);

  const loadDraftIntoForm = (draft: any) => {
    if (showDraftsModal) {
      setShowDraftsModal(false);
    }

    let transformedItems: any[] = [];

    if (draft.items && Array.isArray(draft.items)) {
      transformedItems = draft.items.map((item: any) => ({
        id: generateItemId(),
        description: item.description || item.item_description || "",
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice) || Number(item.unit_price) || 0,
        total: Number(item.total) || Number(item.total_amount) || 0,
      }));
    } else if (draft.invoice_items && Array.isArray(draft.invoice_items)) {
      transformedItems = draft.invoice_items.map((item: any) => ({
        id: generateItemId(),
        description: item.description || item.item_description || "",
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice) || Number(item.unit_price) || 0,
        total: Number(item.total) || Number(item.total_amount) || 0,
      }));
    }

    let businessName = "";
    if (userData?.fullName) {
      businessName = userData.fullName;
    } else if (userData?.firstName && userData?.lastName) {
      businessName = `${userData.firstName} ${userData.lastName}`.trim();
    } else {
      businessName = userData?.email || "";
    }

    const formData = {
      name: draft.client_name || draft.signee_name || "",
      email: draft.client_email || draft.signee_email || "",
      message: draft.message || "",
      invoice_id: draft.invoice_id || generateInvoiceId(),
      bill_to: draft.bill_to || "",
      from: draft.from_name || draft.initiator_name || userData?.email || "",
      issue_date: draft.issue_date || new Date().toISOString().slice(0, 10),
      customer_note: draft.customer_note || "",
      invoice_items: transformedItems,
      payment_type: draft.payment_type || "single",
      fee_option: draft.fee_option || "customer",
      status: "draft" as const,
      business_logo: draft.business_logo || "",
      redirect_url: draft.redirect_url || "",
      business_name: draft.business_name || businessName,
      allowMultiplePayments: draft.allow_multiple_payments || false,
      clientPhone: draft.client_phone || "",
      targetQuantity: draft.target_quantity || 1,
      sendEmailAutomatically:
        draft.send_email_automatically !== undefined
          ? draft.send_email_automatically
          : true,
    };

    setForm(formData);
    showSweetAlert(
      "success",
      "Draft Loaded!",
      "Your draft has been loaded into the form.",
    );
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: [
        "var(--color-accent-yellow)",
        "#e0a800",
        "#fbbf24",
        "var(--color-white)",
        "#f3f4f6",
      ],
    });
  };

  const totals = calculateTotals(form.invoice_items, form.fee_option);

  const handleAddItem = () => {
    setEditingItem(null);
    setIsItemDialogOpen(true);
  };

  const handleEditItem = (id: string) => {
    const itemToEdit = form.invoice_items.find((item) => item.id === id);
    setEditingItem(itemToEdit || null);
    setIsItemDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsItemDialogOpen(false);
    setEditingItem(null);
  };

  useEffect(() => {
    if (userData) {
      const today = new Date().toISOString().slice(0, 10);

      let businessName = "";
      if (userData.fullName) {
        businessName = userData.fullName;
      } else if (userData.firstName && userData.lastName) {
        businessName = `${userData.firstName} ${userData.lastName}`.trim();
      } else {
        businessName = userData.email || "";
      }

      setForm((prev) => ({
        ...prev,
        invoice_id: generateInvoiceId(),
        issue_date: today,
        from: userData.email || "",
        business_name: businessName,
      }));
    }
  }, [userData]);

  const loadUserDrafts = async () => {
    try {
      if (!userData?.id) {
        console.log("No user data found");
        return;
      }

      const draftId = searchParams?.get("draftId");
      if (draftId) {
        console.log("Skipping drafts modal - loading specific draft:", draftId);
        return;
      }

      const res = await fetch(`/api/get-invoice-drafts?userId=${userData.id}`);
      const result = await res.json();

      if (res.ok && result.drafts && result.drafts.length > 0) {
        setUserDrafts(result.drafts);
        setShowDraftsModal(true);
      }
    } catch (error) {
      console.error("Failed to load drafts:", error);
    }
  };

  const handleViewAllDrafts = () => {
    setShowDraftsModal(false);

    const draftsHTML = userDrafts
      .map(
        (draft, index) => `
      <div class="draft-item p-3 border-b border-[var(--border-color)] hover:bg-[var(--bg-secondary)] cursor-pointer" 
           data-draft-id="${draft.id}">
        <div class="flex justify-between items-center">
          <div>
            <strong class="text-[var(--text-primary)]">${
              draft.business_name || "Untitled Invoice"
            }</strong>
            <div class="text-sm text-[var(--text-secondary)] mt-1">
              ${draft.invoice_id} • ${new Date(
                draft.created_at,
              ).toLocaleDateString()}
            </div>
          </div>
          <button class="load-draft-btn px-3 py-1 text-sm bg-[var(--color-accent-yellow)] text-[var(--color-ink)] rounded hover:bg-[var(--color-accent-yellow)]/90 transition-colors squircle-sm"
                  data-draft-id="${draft.id}">
            Load
          </button>
        </div>
      </div>
    `,
      )
      .join("");

    const modal = document.createElement("div");
    modal.className =
      "fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4";
    modal.innerHTML = `
      <div class="bg-[var(--bg-primary)] rounded-lg shadow-pop max-w-2xl w-full max-h-[80vh] overflow-hidden squircle-lg">
        <div class="p-6 border-b border-[var(--border-color)]">
          <div class="flex justify-between items-center">
            <h3 class="text-xl font-bold text-[var(--text-primary)]">All Drafts (${userDrafts.length})</h3>
            <button class="close-modal text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              ✕
            </button>
          </div>
        </div>
        <div class="p-6 overflow-y-auto max-h-[60vh]">
          ${draftsHTML}
        </div>
        <div class="p-6 border-t border-[var(--border-color)]">
          <button class="start-fresh-btn w-full py-2 px-4 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded hover:bg-[var(--bg-secondary)]/80 transition-colors squircle-md">
            Start New Invoice
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector(".close-modal")?.addEventListener("click", () => {
      document.body.removeChild(modal);
    });

    modal
      .querySelectorAll(".load-draft-btn, .draft-item")
      .forEach((element) => {
        element.addEventListener("click", (e) => {
          e.stopPropagation();
          const draftId = element.getAttribute("data-draft-id");
          const draft = userDrafts.find((d) => d.id === draftId);
          if (draft) {
            loadDraftIntoForm(draft);
            document.body.removeChild(modal);
          }
        });
      });

    modal.querySelector(".start-fresh-btn")?.addEventListener("click", () => {
      document.body.removeChild(modal);
    });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  };

  useEffect(() => {
    if (userData?.id && !hasShownDraftModal) {
      const draftId = searchParams?.get("draftId");

      if (!draftId) {
        loadUserDrafts();
        setHasShownDraftModal(true);
      }
    }
  }, [userData?.id, searchParams, hasShownDraftModal]);

  const fetchPaymentStatus = async (invoiceId: string) => {
    try {
      const response = await fetch(
        `/api/invoice/payment-status?invoiceId=${invoiceId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setPaymentProgress({
          totalAmount: data.totalAmount || data.invoice?.total_amount || 0,
          paidAmount: data.paidAmount || data.invoice?.paid_amount || 0,
          remainingAmount:
            data.remainingAmount || data.totalAmount - data.paidAmount || 0,
          progress: data.progress || 0,
          status: data.invoice?.status || "unpaid",
          paidQuantity: data.paidQuantity || data.invoice?.paid_quantity || 0,
          targetQuantity:
            data.targetQuantity || data.invoice?.target_quantity || 1,
        });
      }
    } catch (error) {
      console.error("Failed to fetch payment status:", error);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setDraftLoading(true);

      if (!userData?.id) {
        showSweetAlert(
          "error",
          "Unauthorized",
          "You must be logged in to save a draft.",
        );
        return;
      }

      const { totalAmount } = totals;

      const initiatorName = userData?.fullName
        ? userData.fullName
        : userData?.firstName && userData?.lastName
          ? `${userData.firstName} ${userData.lastName}`.trim()
          : userData?.email || "";

      const payload = {
        userId: userData?.id,
        initiator_email: userData?.email || "",
        initiator_name: initiatorName,
        invoice_id: form.invoice_id,
        signee_name: form.name,
        signee_email: form.email,
        message: form.message,
        bill_to: form.bill_to,
        issue_date: form.issue_date,
        customer_note: form.customer_note,
        invoice_items: form.invoice_items,
        total_amount: totalAmount,
        payment_type: form.payment_type,
        fee_option: form.fee_option,
        status: "draft",
        business_logo: form.business_logo,
        redirect_url: form.redirect_url,
        business_name: form.business_name,
        target_quantity: form.allowMultiplePayments ? form.targetQuantity : 1,
        is_draft: true,
        clientPhone: form.clientPhone,
        send_email_automatically: form.sendEmailAutomatically,
      };

      const res = await fetch("/api/save-invoice-draft", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || result.message);
      }

      showSweetAlert(
        "success",
        "Draft Saved!",
        "Your invoice draft has been saved successfully.",
      );

      router.push("/dashboard/services/create-invoice");
    } catch (err) {
      showSweetAlert(
        "error",
        "Failed to Save Draft",
        (err as Error)?.message || "An unexpected error occurred.",
      );
    } finally {
      setDraftLoading(false);
    }
  };

  const handleSaveInvoice = async (
    isDraft: boolean = false,
  ): Promise<{
    success: boolean;
    signingLink?: string;
    invoiceId?: string;
  }> => {
    try {
      if (!userData?.id) {
        showSweetAlert(
          "warning",
          "Unauthorized",
          "You must be logged in to send an invoice.",
        );
        return { success: false };
      }

      if (!details) {
        return { success: false };
      }

      const { totalAmount } = totals;

      const initiatorName = userData?.fullName
        ? userData.fullName
        : userData?.firstName && userData?.lastName
          ? `${userData.firstName} ${userData.lastName}`.trim()
          : userData?.email || "";

      const payload = {
        userId: userData?.id,
        initiator_email: userData?.email || "",
        initiator_name: initiatorName,
        invoice_id: form.invoice_id,
        signee_name: form.name || "",
        signee_email: form.email || "",
        message: form.message || "",
        bill_to: form.bill_to || "",
        issue_date: form.issue_date,
        customer_note: form.customer_note || "",
        invoice_items: form.invoice_items.map((item) => ({
          ...item,
          total: Number(item.quantity) * Number(item.unitPrice),
        })),
        total_amount: totalAmount,
        payment_type: form.payment_type,
        fee_option: form.fee_option,
        status: isDraft ? "draft" : "unpaid",
        business_logo: form.business_logo || "",
        redirect_url: form.redirect_url || "",
        business_name: form.business_name || "",
        target_quantity: form.allowMultiplePayments ? form.targetQuantity : 1,
        is_draft: isDraft,
        clientPhone: form.clientPhone || "",
        initiator_account_number:
          details?.bank_details?.bank_account_number || "",
        initiator_account_name: details?.bank_details?.bank_account_name || "",
        initiator_bank_name: details?.bank_details?.bank_name || "",
        send_email_automatically: form.sendEmailAutomatically,
      };

      const endpoint = isDraft
        ? "/api/save-invoice-draft"
        : "/api/send-invoice";
      const method = isDraft ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        console.error("API Error:", result);
        throw new Error(
          result.error || result.message || "Failed to save invoice",
        );
      }

      if (!isDraft) {
        setPaymentProgress({
          totalAmount: totalAmount,
          paidAmount: 0,
          remainingAmount: totalAmount,
          progress: 0,
          status: "unpaid",
          paidQuantity: 0,
          targetQuantity: form.allowMultiplePayments
            ? Number(form.targetQuantity || 0)
            : 1,
        });
      }

      return {
        success: true,
        signingLink: isDraft ? undefined : result.signingLink,
        invoiceId: form.invoice_id,
      };
    } catch (err) {
      console.error("Error in handleSaveInvoice:", err);
      showSweetAlert(
        "error",
        `Failed to ${isDraft ? "Save Draft" : "Send Invoice"}`,
        (err as Error)?.message || "An unexpected error occurred.",
      );
      return { success: false };
    }
  };

  const validateInvoiceForm = () => {
    let newErrors: Record<string, string> = {};

    if (!form.business_name.trim()) {
      newErrors.business_name = "Business name is required.";
    }

    if (!form.allowMultiplePayments) {
      if (!form.email.trim()) {
        newErrors.email =
          "Client email is required for single payment invoices.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        newErrors.email = "Invalid email format.";
      }
    } else if (
      form.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
    ) {
      newErrors.email = "Invalid email format.";
    }

    if (form.invoice_items.length === 0) {
      newErrors.invoice_items = "At least one invoice item is required.";
    } else {
      form.invoice_items.forEach((item, index) => {
        if (!item.description?.trim()) {
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

    if (form.allowMultiplePayments) {
      if (!form.targetQuantity || form.targetQuantity < 1) {
        newErrors.targetQuantity =
          "Target quantity must be at least 1 for multiple payments.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    if (loading || isFormLocked || draftLoading) {
      return;
    }

    try {
      if (isDraft) {
        await handleSaveDraft();
        return;
      }

      if (hasReachedLimit()) {
        setShowUpgradePrompt(true);
        return;
      }

      if (!validateInvoiceForm()) {
        await showSweetAlert(
          "error",
          "Validation Failed",
          "Please correct the errors before generating the invoice.",
        );
        return;
      }

      if (form.invoice_items.length === 0) {
        await showSweetAlert(
          "error",
          "No Items",
          "Please add at least one item to the invoice.",
        );
        return;
      }

      const invalidItems = form.invoice_items.filter(
        (item) => !item.description || !item.quantity || !item.unitPrice,
      );

      if (invalidItems.length > 0) {
        await showSweetAlert(
          "error",
          "Incomplete Items",
          "Please ensure all items have description, quantity, and price.",
        );
        return;
      }

      if (
        form.allowMultiplePayments &&
        (!form.targetQuantity || form.targetQuantity < 1)
      ) {
        await showSweetAlert(
          "error",
          "Invalid Target Quantity",
          "For multiple payments, target quantity must be at least 1.",
        );
        return;
      }

      setShowInvoiceSummary(true);
    } catch (error) {
      console.error("Submit error:", error);
      await showSweetAlert(
        "error",
        "Submission Error",
        "An error occurred while processing your request.",
      );
    }
  };

  const processSubmission = async () => {
    try {
      setLoading(true);
      setIsFormLocked(true);

      const result = await handleSaveInvoice(false);

      if (result.success) {
        triggerConfetti();

        resetAllLoadingStates();
        setHasUnsavedChanges(false);

        setGeneratedSigningLink(result.signingLink || "");
        setSavedInvoiceId(result.invoiceId || form.invoice_id);

        setShowSuccessModal(true);

        const usageRes = await fetch("/api/user/usage");
        if (usageRes.ok) {
          const data = await usageRes.json();
          setInvoiceUsage(data.invoices);
        }

        if (form.allowMultiplePayments && result.invoiceId) {
          fetchPaymentStatus(result.invoiceId);

          const pollInterval = setInterval(() => {
            if (result.invoiceId) {
              fetchPaymentStatus(result.invoiceId);
            }
          }, 10000);

          setTimeout(() => clearInterval(pollInterval), 10 * 60 * 1000);
        }

        if (onInvoiceCreated) {
          onInvoiceCreated();
        }
      } else {
        resetAllLoadingStates();
      }
    } catch (error) {
      resetAllLoadingStates();
      await showSweetAlert(
        "error",
        "Processing Failed",
        "Failed to process invoice. Please try again.",
      );
    } finally {
      setLoading(false);
      setIsFormLocked(false);
    }
  };

  const handleSummaryConfirm = () => {
    setShowInvoiceSummary(false);
    processSubmission();
  };

  const handleSummaryBack = () => {
    setShowInvoiceSummary(false);
    resetAllLoadingStates();
  };

  const handleCopySigningLink = () => {
    if (generatedSigningLink) {
      navigator.clipboard.writeText(generatedSigningLink);
      showSweetAlert(
        "success",
        "Invoice Link Copied!",
        "Invoice link copied to clipboard",
      );
    }
  };

  const handleRefreshStatus = async () => {
    if (savedInvoiceId) {
      await fetchPaymentStatus(savedInvoiceId);
      showSweetAlert(
        "success",
        "Status Updated",
        "Payment status has been refreshed",
      );
    }
  };

  const previewInvoice = convertToInvoicePreview(form);

  const getButtonConfig = (): {
    text: string;
    color: string;
    icon: JSX.Element | null;
    disabled: boolean;
  } => {
    if (hasUnlimitedInvoices) {
      return {
        text: "Generate Invoice",
        color: "bg-[var(--color-accent-yellow)] hover:bg-[var(--color-accent-yellow)]/90",
        icon: null,
        disabled: false,
      };
    }
    if (
      typeof invoiceUsage.remaining === "number" &&
      invoiceUsage.remaining > 0
    ) {
      return {
        text: `Generate Invoice (${invoiceUsage.remaining} free left)`,
        color: "bg-[var(--color-accent-yellow)] hover:bg-[var(--color-accent-yellow)]/90",
        icon: null,
        disabled: false,
      };
    }
    return {
      text: `Invoice Limit Reached - Upgrade Plan`,
      color: "bg-gray-400 cursor-not-allowed",
      icon: React.createElement(Crown, { className: "w-4 h-4 mr-2" }),
      disabled: true,
    };
  };

  const buttonConfig = getButtonConfig();

  const getRemainingText = (): string => {
    if (hasUnlimitedInvoices) return "UNLIMITED";
    if (isZidLiteUser) return "20 limit";
    if (
      typeof invoiceUsage.remaining === "number" &&
      invoiceUsage.remaining > 0
    ) {
      return `${invoiceUsage.remaining} left`;
    }
    return "Limit reached";
  };

  const getRemainingColor = (): string => {
    if (hasUnlimitedInvoices) return "bg-purple-600";
    if (isZidLiteUser) return "bg-blue-600";
    if (
      typeof invoiceUsage.remaining === "number" &&
      invoiceUsage.remaining > 0
    ) {
      return "bg-[var(--color-accent-yellow)]";
    }
    return "bg-destructive";
  };

  const hasReachedLimit = (): boolean => {
    if (hasUnlimitedInvoices) return false;
    if (
      typeof invoiceUsage.remaining === "number" &&
      invoiceUsage.remaining > 0
    )
      return false;
    return true;
  };

 const invoiceDataForModal = {
  invoice_id: form.invoice_id,
  business_name: form.business_name,
  business_logo: form.business_logo,
  client_name: form.name,
  client_email: form.email,
  client_phone: form.clientPhone,
  from_email: userData?.email || "",
  from_name: form.business_name,
  issue_date: form.issue_date,
  payment_type: form.payment_type as "single" | "multiple",  // Add type assertion
  fee_option: form.fee_option as "absorbed" | "customer",     // Add type assertion
  subtotal: totals.subtotal,
  fee_amount: totals.feeAmount,
  total_amount: totals.totalAmount,
  message: form.message,
  customer_note: form.customer_note,
  invoice_items: form.invoice_items,
};

  return (
    <>
      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-primary)] rounded-xl max-w-md w-full p-6 squircle-lg shadow-pop">
            <div className="w-12 h-12 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-6 h-6 text-destructive" />
            </div>
            <h3 className="text-xl font-bold text-center mb-2 text-[var(--text-primary)]">
              Invoice Limit Reached
            </h3>
            <p className="text-[var(--text-secondary)] text-center mb-6">
              {isZidLiteUser
                ? "You've used all your ZidLite invoices. Upgrade to continue creating unlimited invoices!"
                : "You've used all your free invoices. Upgrade to continue creating unlimited invoices!"}
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-[var(--border-color)] text-[var(--text-secondary)]"
                onClick={() => setShowUpgradePrompt(false)}
              >
                Cancel
              </Button>
              <Link href="/pricing?upgrade=growth" className="flex-1">
                <Button className="w-full bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90">
                  View Plans
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      <DraftsModal
        isOpen={showDraftsModal && !searchParams?.get("draftId")}
        onClose={() => setShowDraftsModal(false)}
        drafts={userDrafts}
        onLoadDraft={loadDraftIntoForm}
        onViewAll={handleViewAllDrafts}
        onStartFresh={() => setShowDraftsModal(false)}
      />

      <InvoiceSummary
        invoiceData={form}
        totals={totals}
        initiatorName={`${userData?.fullName || ""} ${userData?.lastName || ""}`}
        initiatorEmail={userData?.email || ""}
        amount={0}
        confirmInvoice={showInvoiceSummary}
        onBack={handleSummaryBack}
        onConfirm={handleSummaryConfirm}
        usageInfo={invoiceUsage}
        userTier={userTier || "free"}
      />

      <InvoiceItemForm
        item={editingItem}
        isOpen={isItemDialogOpen}
        onClose={handleDialogClose}
        onSubmit={handleItemSubmit}
      />

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          window.location.reload();
        }}
        generatedSigningLink={generatedSigningLink}
        onCopyLink={handleCopySigningLink}
        allowMultiplePayments={form.allowMultiplePayments}
        pdfLoading={pdfLoading}
        invoiceData={invoiceDataForModal}
      />

      <div className="min-h-screen">
        <div className="container mx-auto py-8 px-4">
          <TabsNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            createContent={
              <>
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start space-x-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.back()}
                      className="text-[var(--color-accent-yellow)] hover:bg-[var(--bg-secondary)]"
                      disabled={isFormLocked}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>

                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h1 className="md:text-3xl text-xl font-bold text-[var(--text-primary)]">
                          Create Invoice
                        </h1>
                        <div
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${tierInfo.bg}`}
                        >
                          <TierIcon className={`w-4 h-4 ${tierInfo.color}`} />
                          <span
                            className={`text-xs font-semibold ${tierInfo.color}`}
                          >
                            {tierInfo.label}
                          </span>
                        </div>
                        {!invoiceUsage.isChecking && (
                          <span
                            className={`px-2 py-1 text-white text-sm font-bold rounded ${getRemainingColor()}`}
                          >
                            {getRemainingText()}
                          </span>
                        )}
                      </div>
                      <p className="text-[var(--text-secondary)]">
                        Generate a professional invoice and share the link for
                        payments
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {form.invoice_items.length > 0 && (
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200"
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        {form.invoice_items.length} item(s)
                      </Badge>
                    )}
                    {loading && (
                      <Badge
                        variant="outline"
                        className="bg-yellow-50 text-yellow-700 border-yellow-200"
                      >
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Processing...
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Subscription Info Banner */}
                {!invoiceUsage.isChecking && (
                  <div
                    className={`mb-6 p-4 rounded-lg border ${
                      hasUnlimitedInvoices
                        ? "bg-purple-50 border-purple-200"
                        : hasReachedLimit()
                          ? "bg-yellow-50 border-yellow-200"
                          : "bg-green-50 border-green-200"
                    } squircle-md`}
                  >
                    <div className="flex items-start gap-3">
                      {hasUnlimitedInvoices ? (
                        <Crown className="w-5 h-5 text-purple-600 mt-0.5" />
                      ) : hasReachedLimit() ? (
                        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p
                          className={`font-medium ${
                            hasUnlimitedInvoices
                              ? "text-purple-700"
                              : hasReachedLimit()
                                ? "text-yellow-700"
                                : "text-green-700"
                          }`}
                        >
                          {hasUnlimitedInvoices
                            ? `${tierInfo.label} Plan - Unlimited Invoices`
                            : hasReachedLimit()
                              ? "Invoice Limit Reached"
                              : `${invoiceUsage.remaining} Free Invoice${invoiceUsage.remaining !== 1 ? "s" : ""} Remaining`}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {hasUnlimitedInvoices ? (
                            "You have unlimited invoices as part of your subscription."
                          ) : hasReachedLimit() ? (
                            <>
                              You've used all {isZidLiteUser ? "10" : "5"} free
                              invoices.{" "}
                              <Button
                                variant="link"
                                className="p-0 h-auto text-[var(--color-accent-yellow)] font-semibold underline"
                                onClick={() =>
                                  router.push("/pricing?upgrade=growth")
                                }
                              >
                                Upgrade to Growth
                              </Button>{" "}
                              for unlimited invoices.
                            </>
                          ) : (
                            `Create invoices for free within your plan limit.`
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <Card className="p-6 bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-soft squircle-lg">
                  <LogoUpload
                    logo={form.business_logo || ""}
                    onLogoChange={(logoDataUrl: string) =>
                      setForm((prev) => ({
                        ...prev,
                        business_logo: logoDataUrl,
                      }))
                    }
                    userProfilePicture={userData?.profilePicture}
                  />
                  <div className="space-y-4">
                    <div>
                      <Label className="text-[var(--text-secondary)]">
                        Business Name *
                      </Label>
                      <Input
                        value={form.business_name}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            business_name: e.target.value,
                          }))
                        }
                        placeholder="Your Business Name"
                        className="mt-1 border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)]"
                        style={{ outline: "none", boxShadow: "none" }}
                        disabled={isFormLocked}
                      />
                      {errors.business_name && (
                        <p className="text-destructive text-xs mt-1">
                          {errors.business_name}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-[var(--text-secondary)]">
                        Invoice Number
                      </Label>
                      <Input
                        value={form.invoice_id}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            invoice_id: e.target.value,
                          }))
                        }
                        className="mt-1 border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
                        disabled={true}
                      />
                    </div>

                    <div className="border-t border-[var(--border-color)] pt-4 mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-[var(--text-primary)]">
                          Bill To
                        </h3>
                        <span className="text-xs text-[var(--text-secondary)]">
                          (Optional - leave blank for client to fill)
                        </span>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-[var(--text-secondary)]">
                            Client Name
                          </Label>
                          <Input
                            value={form.name || ""}
                            onChange={handleFormChange}
                            name="name"
                            placeholder="Leave blank for client to fill"
                            className="mt-1 border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)]"
                            style={{ outline: "none", boxShadow: "none" }}
                            disabled={isFormLocked}
                          />
                        </div>
                        <div>
                          <Label className="text-[var(--text-secondary)]">
                            Client Email
                          </Label>
                          <Input
                            type="email"
                            value={form.email || ""}
                            onChange={handleFormChange}
                            name="email"
                            placeholder="Leave blank for client to fill"
                            className="mt-1 border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)]"
                            style={{ outline: "none", boxShadow: "none" }}
                            disabled={isFormLocked}
                          />
                          {errors.email && (
                            <p className="text-destructive text-xs mt-1">
                              {errors.email}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label className="text-[var(--text-secondary)]">
                            Client Phone
                          </Label>
                          <Input
                            value={form.clientPhone || ""}
                            onChange={handleFormChange}
                            name="clientPhone"
                            placeholder="Leave blank for client to fill"
                            className="mt-1 border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)]"
                            style={{ outline: "none", boxShadow: "none" }}
                            disabled={isFormLocked}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-[var(--border-color)] pt-4 mt-6">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="font-semibold text-[var(--text-primary)]">
                            Items
                          </h3>
                          {form.invoice_items.length > 0 && (
                            <p className="text-xs text-[var(--text-secondary)] mt-1">
                              {form.invoice_items.length} item
                              {form.invoice_items.length !== 1 ? "s" : ""} •
                              Total: ₦
                              {form.invoice_items
                                .reduce(
                                  (sum, item) => sum + (item.total || 0),
                                  0,
                                )
                                .toLocaleString()}
                            </p>
                          )}
                        </div>
                        <Button
                          className="bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90"
                          size="sm"
                          onClick={handleAddItem}
                          disabled={isFormLocked}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Item
                        </Button>
                      </div>

                      {form.invoice_items.length > 0 ? (
                        <div>
                          <div className="hidden md:grid md:grid-cols-12 gap-3 mb-2 text-xs font-semibold text-[var(--text-secondary)]">
                            <div className="md:col-span-5">DESCRIPTION</div>
                            <div className="md:col-span-1 text-center">QTY</div>
                            <div className="md:col-span-2 text-right">
                              PRICE
                            </div>
                            <div className="md:col-span-2 text-right">
                              TOTAL
                            </div>
                            <div className="md:col-span-2 text-right">
                              ACTIONS
                            </div>
                          </div>

                          <div className="space-y-2">
                            {form.invoice_items.map((item) => (
                              <InvoiceItemRow
                                key={item.id}
                                item={item}
                                onEdit={handleEditItem}
                                onRemove={removeItem}
                              />
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-[var(--text-secondary)] border border-dashed border-[var(--border-color)] rounded-md">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center">
                              <Plus className="h-6 w-6 text-[var(--text-secondary)]" />
                            </div>
                            <p className="text-sm font-medium">
                              No items added yet
                            </p>
                            <p className="text-xs">
                              Click "Add Item" to get started
                            </p>
                          </div>
                        </div>
                      )}
                      {errors.invoice_items && (
                        <p className="text-destructive text-sm mt-2">
                          {errors.invoice_items}
                        </p>
                      )}
                    </div>

                    {/* Email Automation Toggle */}
                    <div className="border-t border-[var(--border-color)] pt-4 mt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <Label className="font-medium text-[var(--text-primary)] flex items-center gap-2">
                            {form.sendEmailAutomatically ? (
                              <Mail className="w-4 h-4 text-[var(--color-lemon-green)]" />
                            ) : (
                              <Mail className="w-4 h-4 text-[var(--text-secondary)]" />
                            )}
                            Send invoice automatically to client
                          </Label>
                          <p className="text-xs text-[var(--text-secondary)] mt-1">
                            {form.sendEmailAutomatically
                              ? "An email will be sent to the client with the invoice link"
                              : "You'll need to share the invoice link manually with the client"}
                          </p>
                        </div>
                        <div>
                          <Switch
                            checked={form.sendEmailAutomatically}
                            onCheckedChange={(checked) =>
                              setForm((prev) => ({
                                ...prev,
                                sendEmailAutomatically: checked,
                              }))
                            }
                            disabled={isFormLocked}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => handleSubmit(true)}
                        disabled={draftLoading || isFormLocked || loading}
                        className="flex-1 border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {draftLoading ? "Saving..." : "Save Draft"}
                      </Button>
                      <Button
                        onClick={() => handleSubmit(false)}
                        disabled={
                          loading ||
                          isFormLocked ||
                          draftLoading ||
                          invoiceUsage.isChecking ||
                          buttonConfig.disabled
                        }
                        className={`flex-1 ${buttonConfig.color} text-[var(--color-ink)]`}
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </div>
                        ) : invoiceUsage.isChecking ? (
                          "Checking..."
                        ) : (
                          <>
                            {buttonConfig.icon}
                            {buttonConfig.text}
                          </>
                        )}
                      </Button>
                    </div>

                    {hasReachedLimit() && !hasUnlimitedInvoices && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-700 flex items-center gap-2">
                          <Info className="w-4 h-4" />
                          You've reached your invoice limit.{" "}
                          <Button
                            variant="link"
                            className="p-0 h-auto text-[var(--color-accent-yellow)] font-semibold underline"
                            onClick={() =>
                              router.push("/pricing?upgrade=growth")
                            }
                          >
                            Upgrade your plan
                          </Button>{" "}
                          for unlimited invoices.
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              </>
            }
            previewContent={
              <>
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start space-x-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.back()}
                      className="text-[var(--color-accent-yellow)] hover:bg-[var(--bg-secondary)]"
                      disabled={isFormLocked}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>

                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h1 className="md:text-3xl text-xl font-bold text-[var(--text-primary)]">
                          Invoice Preview
                        </h1>
                        <div
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${tierInfo.bg}`}
                        >
                          <TierIcon className={`w-4 h-4 ${tierInfo.color}`} />
                          <span
                            className={`text-xs font-semibold ${tierInfo.color}`}
                          >
                            {tierInfo.label}
                          </span>
                        </div>
                        {!invoiceUsage.isChecking && (
                          <span
                            className={`px-2 py-1 text-white text-sm font-bold rounded ${getRemainingColor()}`}
                          >
                            {getRemainingText()}
                          </span>
                        )}
                      </div>
                      <p className="text-[var(--text-secondary)]">
                        Live preview of your invoice as you fill out the form
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-700 border-blue-200"
                    >
                      Live Preview
                    </Badge>
                  </div>
                </div>

                <div className="space-y-6">
                  <InvoicePreview invoice={previewInvoice} />

                  <div className="flex justify-between items-center pt-4 border-t border-[var(--border-color)]">
                    <div className="text-sm text-[var(--text-secondary)]">
                      <p>
                        Switch to the "Create Invoice" tab to edit your invoice
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("create")}
                      className="border-[var(--color-accent-yellow)] text-[var(--color-accent-yellow)] hover:bg-[var(--color-accent-yellow)]/10"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Back to Editor
                    </Button>
                  </div>
                </div>
              </>
            }
          />
        </div>
      </div>
    </>
  );
};

export default function CreateInvoiceWithSuspense() {
  return (
    <Suspense
      fallback={
        <div className="text-center p-8 text-[var(--text-primary)]">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent-yellow)] mx-auto mb-4" />
          <p>Loading invoice form...</p>
        </div>
      }
    >
      <CreateInvoice />
    </Suspense>
  );
}