// app/components/Invoice-components/CreateInvoice.tsx
"use client";

import React, { JSX, Suspense } from "react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import confetti from "canvas-confetti";
import Swal from "sweetalert2";
import posthog from "posthog-js";

import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import {
  Plus,
  ArrowLeft,
  Save,
  Edit,
  FileText,
  Crown,
  Zap,
  Sparkles,
  Star,
  Loader2,
  Mail,
  Building2,
  UserRound,
  Phone,
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
    title,
    text: message,
    confirmButtonText: "OK",
    confirmButtonColor: "var(--color-accent-yellow)",
    background: isDark ? "#1f2937" : "var(--bg-primary)",
    color: isDark ? "#f3f4f6" : "var(--text-primary)",
    customClass: {
      popup: "squircle-lg",
      confirmButton: "sweet-alert-confirm-btn",
    },
  });
};

const deriveDisplayName = (userData: any) => {
  if (!userData) return "";
  if (userData.fullName) return userData.fullName;
  if (userData.firstName && userData.lastName)
    return `${userData.firstName} ${userData.lastName}`.trim();
  return userData.email || "";
};

const CreateInvoice = ({ onInvoiceCreated }: CreateInvoiceProps) => {
  const [loading, setLoading] = useState(false);
  const [pdfLoading] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
  const [hasShownDraftModal, setHasShownDraftModal] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showInvoiceSummary, setShowInvoiceSummary] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedSigningLink, setGeneratedSigningLink] = useState<string>("");
  const [, setSavedInvoiceId] = useState<string>("");
  const [details, setDetails] = useState<any>(null);
  const [, setPaymentProgress] = useState({
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
  const [, setHasUnsavedChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<"create" | "preview">("create");
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const { userData } = useUserContextData();
  const { userTier } = useSubscription();
  const [hasLoadedFromUrl, setHasLoadedFromUrl] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Zidwell invoice tiers: starter (= free, 5 invoices), sme (unlimited),
  // enterprise (unlimited). Any other raw tier (booster / console) is
  // normalized to starter by useSubscription, so we never see them here.
  const isStarterUser = userTier === "starter" || userTier === "free";
  const isSmeUser = userTier === "sme";
  const isEnterpriseUser = userTier === "enterprise";

  const hasUnlimitedInvoices = isSmeUser || isEnterpriseUser;
  const starterInvoiceLimit = 5;

  const [invoiceUsage, setInvoiceUsage] = useState<InvoiceUsageInfo>({
    used: 0,
    limit: hasUnlimitedInvoices ? "unlimited" : starterInvoiceLimit,
    remaining: hasUnlimitedInvoices ? "unlimited" : starterInvoiceLimit,
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
    senderName: "",
    senderPhone: "",
    allowMultiplePayments: false,
    clientPhone: "",
    targetQuantity: 1,
    sendEmailAutomatically: true,
  });

  const getTierInfo = () => {
    if (isEnterpriseUser)
      return {
        icon: Crown,
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-100 dark:bg-amber-900/30",
        label: "Enterprise",
      };
    if (isSmeUser)
      return {
        icon: Star,
        color: "text-(--color-accent-yellow)",
        bg: "bg-(--color-accent-yellow)/10 dark:bg-(--color-accent-yellow)/20",
        label: "SME",
      };
    // Starter = free plan
    return {
      icon: Zap,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-900/30",
      label: "Free",
    };
  };

  const tierInfo = getTierInfo();
  const TierIcon = tierInfo.icon;

  const resetAllLoadingStates = () => {
    setLoading(false);
    setIsFormLocked(false);
  };

  const handleItemSubmit = (item: any) => {
    const itemWithId = { ...item, id: generateItemId() };

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
    setForm((prev) => ({
      ...prev,
      invoice_items: prev.invoice_items.filter((item) => item.id !== id),
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!userData?.id) return;
      try {
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
          }
        } catch (error) {
          console.error("Failed to load draft from URL:", error);
        }
      };
      loadDraftFromParam();
    }
  }, [searchParams, userData?.id, hasLoadedFromUrl]);

  const loadDraftIntoForm = (draft: any) => {
    if (showDraftsModal) setShowDraftsModal(false);

    let transformedItems: any[] = [];

    if (draft.invoice_items && Array.isArray(draft.invoice_items)) {
      transformedItems = draft.invoice_items.map((item: any) => {
        const description = item.item_description || item.description || "";
        const quantity = Number(item.quantity) || 1;
        const unitPrice = Number(item.unit_price || item.unitPrice || 0);
        const total = Number(
          item.total_amount || item.total || quantity * unitPrice,
        );
        return {
          id: generateItemId(),
          description,
          quantity,
          unitPrice,
          total,
        };
      });
    } else if (draft.items && Array.isArray(draft.items)) {
      transformedItems = draft.items.map((item: any) => {
        const description = item.description || item.item_description || "";
        const quantity = Number(item.quantity) || 1;
        const unitPrice = Number(item.unitPrice || item.unit_price || 0);
        const total = Number(
          item.total || item.total_amount || quantity * unitPrice,
        );
        return {
          id: generateItemId(),
          description,
          quantity,
          unitPrice,
          total,
        };
      });
    }

    if (
      transformedItems.length === 0 &&
      draft.invoice_items &&
      typeof draft.invoice_items === "string"
    ) {
      try {
        const parsed = JSON.parse(draft.invoice_items);
        if (Array.isArray(parsed)) {
          transformedItems = parsed.map((item: any) => ({
            id: generateItemId(),
            description: item.item_description || item.description || "",
            quantity: Number(item.quantity) || 1,
            unitPrice: Number(item.unit_price || item.unitPrice || 0),
            total: Number(item.total_amount || item.total || 0),
          }));
        }
      } catch (e) {
        console.error("Error parsing invoice items:", e);
      }
    }

    const fallbackBusinessName = deriveDisplayName(userData);

    setForm({
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
      business_name: draft.business_name || fallbackBusinessName,
      senderName:
        draft.initiator_name || draft.from_name || fallbackBusinessName,
      senderPhone: draft.initiator_phone || userData?.phone || "",
      allowMultiplePayments: draft.allow_multiple_payments || false,
      clientPhone: draft.client_phone || "",
      targetQuantity: draft.target_quantity || 1,
      sendEmailAutomatically:
        draft.send_email_automatically !== undefined
          ? draft.send_email_automatically
          : true,
    });

    showSweetAlert("success", "Draft loaded", "Your draft is ready to edit.");
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
        "#ffffff",
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
      const displayName = deriveDisplayName(userData);

      setForm((prev) => ({
        ...prev,
        invoice_id: prev.invoice_id || generateInvoiceId(),
        issue_date: today,
        from: prev.from || userData.email || "",
        business_name: prev.business_name || displayName,
        senderName: prev.senderName || displayName,
        senderPhone: prev.senderPhone || userData.phone || "",
      }));
    }
  }, [userData]);

  const loadUserDrafts = async () => {
    try {
      if (!userData?.id) return;
      const draftId = searchParams?.get("draftId");
      if (draftId) return;

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
        (draft) => `
      <div class="draft-item p-3 border-b border-(--border-color) hover:bg-[var(--bg-secondary)] cursor-pointer"
           data-draft-id="${draft.id}">
        <div class="flex justify-between items-center">
          <div>
            <strong class="text-(--text-primary)">${
              draft.business_name || "Untitled Invoice"
            }</strong>
            <div class="text-sm text-(--text-secondary) mt-1">
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
      <div class="bg-(--bg-primary) rounded-lg shadow-pop max-w-2xl w-full max-h-[80vh] overflow-hidden squircle-lg">
        <div class="p-6 border-b border-(--border-color)">
          <div class="flex justify-between items-center">
            <h3 class="text-xl font-bold text-(--text-primary)">All Drafts (${userDrafts.length})</h3>
            <button class="close-modal text-(--text-secondary) hover:text-(--text-primary)">✕</button>
          </div>
        </div>
        <div class="p-6 overflow-y-auto max-h-[60vh]">${draftsHTML}</div>
        <div class="p-6 border-t border-(--border-color)">
          <button class="start-fresh-btn w-full py-2 px-4 bg-[var(--bg-secondary)] text-(--text-primary) rounded hover:bg-[var(--bg-secondary)]/80 transition-colors squircle-md">
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
      if (e.target === modal) document.body.removeChild(modal);
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

  const resolveSenderName = () =>
    form.senderName?.trim() || deriveDisplayName(userData);

  const resolveSenderPhone = () =>
    form.senderPhone?.trim() || userData?.phone || "";

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

      const payload = {
        userId: userData?.id,
        initiator_email: form.from || userData?.email || "",
        initiator_name: resolveSenderName(),
        initiator_phone: resolveSenderPhone(),
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
      if (!res.ok) throw new Error(result.error || result.message);

      showSweetAlert("success", "Draft saved", "Your draft was saved.");
      router.push("/dashboard/services/create-invoice");
    } catch (err) {
      showSweetAlert(
        "error",
        "Failed to save draft",
        (err as Error)?.message || "Please try again.",
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
      if (!details) return { success: false };

      const { totalAmount } = totals;

      const payload = {
        userId: userData?.id,
        initiator_email: form.from || userData?.email || "",
        initiator_name: resolveSenderName(),
        initiator_phone: resolveSenderPhone(),
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
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(
          result.error || result.message || "Failed to save invoice",
        );
      }

      if (!isDraft) {
        setPaymentProgress({
          totalAmount,
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
      showSweetAlert(
        "error",
        `Failed to ${isDraft ? "save draft" : "send invoice"}`,
        (err as Error)?.message || "Please try again.",
      );
      return { success: false };
    }
  };

  const validateInvoiceForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.business_name.trim())
      newErrors.business_name = "Business name is required.";

    if (!form.allowMultiplePayments) {
      if (!form.email.trim()) {
        newErrors.email = "Client email is required.";
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
      newErrors.invoice_items = "Add at least one item.";
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

  const hasReachedLimit = (): boolean => {
    if (hasUnlimitedInvoices) return false;
    if (
      typeof invoiceUsage.remaining === "number" &&
      invoiceUsage.remaining > 0
    )
      return false;
    return true;
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    if (loading || isFormLocked || draftLoading) return;

    if (isDraft) {
      await handleSaveDraft();
      return;
    }

    if (hasReachedLimit()) {
      setShowUpgradePrompt(true);
      return;
    }

    if (!validateInvoiceForm()) return;

    setShowInvoiceSummary(true);
  };

  const processSubmission = async () => {
    try {
      setLoading(true);
      setIsFormLocked(true);
      const result = await handleSaveInvoice(false);

      if (result.success) {
        posthog.capture("invoice_created", {
          item_count: form.invoice_items.length,
          total_amount: totals.totalAmount,
          payment_type: form.payment_type,
        });
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
            if (result.invoiceId) fetchPaymentStatus(result.invoiceId);
          }, 10000);
          setTimeout(() => clearInterval(pollInterval), 10 * 60 * 1000);
        }

        onInvoiceCreated?.();
      } else {
        resetAllLoadingStates();
      }
    } catch {
      resetAllLoadingStates();
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
        "Link copied",
        "Invoice link is on your clipboard.",
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
        text: "Generate invoice",
        color:
          "bg-[var(--color-accent-yellow)] hover:bg-[var(--color-accent-yellow)]/90 text-[var(--color-ink)]",
        icon: null,
        disabled: false,
      };
    }
    if (
      typeof invoiceUsage.remaining === "number" &&
      invoiceUsage.remaining > 0
    ) {
      return {
        text: `Generate invoice (${invoiceUsage.remaining} left)`,
        color:
          "bg-[var(--color-accent-yellow)] hover:bg-[var(--color-accent-yellow)]/90 text-[var(--color-ink)]",
        icon: null,
        disabled: false,
      };
    }
    return {
      text: "Upgrade to continue",
      color: "bg-gray-300 text-gray-600 cursor-not-allowed",
      icon: <Crown className="w-4 h-4 mr-2" />,
      disabled: true,
    };
  };

  const buttonConfig = getButtonConfig();

  const invoiceDataForModal = {
    invoice_id: form.invoice_id,
    business_name: form.business_name,
    business_logo: form.business_logo,
    client_name: form.name,
    client_email: form.email,
    client_phone: form.clientPhone,
    bill_to: form.bill_to,
    from_email: form.from || userData?.email || "",
    from_name: form.senderName?.trim() || form.business_name,
    initiator_phone: resolveSenderPhone(),
    issue_date: form.issue_date,
    payment_type: form.payment_type as "single" | "multiple",
    fee_option: form.fee_option as "absorbed" | "customer",
    subtotal: totals.subtotal,
    fee_amount: totals.feeAmount,
    total_amount: totals.totalAmount,
    message: form.message,
    customer_note: form.customer_note,
    invoice_items: form.invoice_items,
    initiator_account_name: details?.bank_details?.bank_account_name || "",
    initiator_account_number: details?.bank_details?.bank_account_number || "",
    initiator_bank_name: details?.bank_details?.bank_name || "",
  };

  return (
    <>
      {showUpgradePrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-(--bg-primary) rounded-xl max-w-sm w-full p-6 squircle-lg shadow-pop">
            <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-6 h-6 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold text-center mb-1 text-(--text-primary)">
              Free plan limit reached
            </h3>
            <p className="text-sm text-(--text-secondary) text-center mb-6">
              You've used all 5 free invoices on the Starter plan. Upgrade to
              SME or Enterprise for unlimited invoices.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 border-(--border-color)"
                onClick={() => setShowUpgradePrompt(false)}
              >
                Cancel
              </Button>
              <Link href="/pricing?upgrade=sme" className="flex-1">
                <Button className="w-full bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90">
                  View plans
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
        userTier={(userTier || "starter") as any}
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
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          <TabsNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            createContent={
              <>
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="flex items-start gap-2 min-w-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.back()}
                      className="text-(--text-secondary) hover:bg-(--bg-secondary) shrink-0 -ml-1"
                      disabled={isFormLocked}
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div className="min-w-0">
                      <h1 className="text-xl sm:text-2xl font-semibold text-(--text-primary)">
                        New invoice
                      </h1>
                      <p className="text-sm text-(--text-secondary) mt-0.5">
                        Fill in the details below, then generate and share.
                      </p>
                    </div>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full shrink-0 ${tierInfo.bg}`}
                    title={`${tierInfo.label} plan`}
                  >
                    <TierIcon className={`w-3.5 h-3.5 ${tierInfo.color}`} />
                    <span
                      className={`text-[11px] font-medium ${tierInfo.color}`}
                    >
                      {tierInfo.label}
                    </span>
                  </div>
                </div>

                <Card className="w-full max-w-2xl mx-auto p-5 sm:p-6 bg-(--bg-primary) border border-(--border-color) shadow-soft squircle-lg">
                  {/* Card header */}
                  <div className="flex items-center justify-between gap-3 pb-4 mb-4 border-b border-(--border-color)">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-(--text-secondary)" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-(--text-secondary) uppercase tracking-wide font-medium">
                          Invoice
                        </p>
                        <p className="text-sm font-mono text-(--text-primary) truncate">
                          {form.invoice_id || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] text-(--text-secondary) uppercase tracking-wide font-medium">
                        Issue date
                      </p>
                      <p className="text-sm text-(--text-primary)">
                        {new Date(form.issue_date).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

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

                  <div className="space-y-6">
                    {/* Bill From */}
                    <div>
                      <h3 className="text-sm font-medium text-(--text-primary) mb-3 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-(--text-secondary)" />
                        Bill from
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <Label className="text-xs text-(--text-secondary)">
                            Business or company name
                          </Label>
                          <Input
                            value={form.business_name}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                business_name: e.target.value,
                              }))
                            }
                            placeholder="Your business name"
                            className="mt-1 h-10 border-(--border-color) bg-(--bg-primary) text-(--text-primary)"
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
                          <Label className="text-xs text-(--text-secondary)">
                            Contact person
                          </Label>
                          <div className="relative mt-1">
                            <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-secondary) pointer-events-none" />
                            <Input
                              value={form.senderName || ""}
                              onChange={(e) =>
                                setForm((prev) => ({
                                  ...prev,
                                  senderName: e.target.value,
                                }))
                              }
                              placeholder="Who is sending this"
                              className="h-10 pl-9 border-(--border-color) bg-(--bg-primary) text-(--text-primary)"
                              style={{ outline: "none", boxShadow: "none" }}
                              disabled={isFormLocked}
                            />
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs text-(--text-secondary)">
                            Email
                          </Label>
                          <Input
                            type="email"
                            value={form.from || ""}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                from: e.target.value,
                              }))
                            }
                            placeholder="billing@yourbusiness.com"
                            className="mt-1 h-10 border-(--border-color) bg-(--bg-primary) text-(--text-primary)"
                            style={{ outline: "none", boxShadow: "none" }}
                            disabled={isFormLocked}
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <Label className="text-xs text-(--text-secondary)">
                            Phone
                          </Label>
                          <div className="relative mt-1">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-secondary) pointer-events-none" />
                            <Input
                              type="tel"
                              value={form.senderPhone || ""}
                              onChange={(e) =>
                                setForm((prev) => ({
                                  ...prev,
                                  senderPhone: e.target.value,
                                }))
                              }
                              placeholder="Phone number shown on the invoice"
                              className="h-10 pl-9 border-(--border-color) bg-(--bg-primary) text-(--text-primary)"
                              style={{ outline: "none", boxShadow: "none" }}
                              disabled={isFormLocked}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bill To */}
                    <div>
                      <h3 className="text-sm font-medium text-(--text-primary) mb-3">
                        Bill to
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <Label className="text-xs text-(--text-secondary)">
                            Company or department
                          </Label>
                          <Input
                            value={form.bill_to || ""}
                            onChange={handleFormChange}
                            name="bill_to"
                            placeholder="Leave blank for client to fill"
                            className="mt-1 h-10 border-(--border-color) bg-(--bg-primary) text-(--text-primary)"
                            style={{ outline: "none", boxShadow: "none" }}
                            disabled={isFormLocked}
                          />
                        </div>

                        <div>
                          <Label className="text-xs text-(--text-secondary)">
                            Client name
                          </Label>
                          <Input
                            value={form.name || ""}
                            onChange={handleFormChange}
                            name="name"
                            placeholder="Leave blank for client to fill"
                            className="mt-1 h-10 border-(--border-color) bg-(--bg-primary) text-(--text-primary)"
                            style={{ outline: "none", boxShadow: "none" }}
                            disabled={isFormLocked}
                          />
                        </div>

                        <div>
                          <Label className="text-xs text-(--text-secondary)">
                            Client email
                          </Label>
                          <Input
                            type="email"
                            value={form.email || ""}
                            onChange={handleFormChange}
                            name="email"
                            placeholder="Leave blank for client to fill"
                            className="mt-1 h-10 border-(--border-color) bg-(--bg-primary) text-(--text-primary)"
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
                          <Label className="text-xs text-(--text-secondary)">
                            Client phone
                          </Label>
                          <Input
                            value={form.clientPhone || ""}
                            onChange={handleFormChange}
                            name="clientPhone"
                            placeholder="Optional"
                            className="mt-1 h-10 border-(--border-color) bg-(--bg-primary) text-(--text-primary)"
                            style={{ outline: "none", boxShadow: "none" }}
                            disabled={isFormLocked}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Items */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-(--text-primary)">
                          Items
                        </h3>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleAddItem}
                          disabled={isFormLocked}
                          className="h-8 border-(--border-color) text-(--text-primary) hover:bg-(--bg-secondary)"
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Add item
                        </Button>
                      </div>

                      {form.invoice_items.length > 0 ? (
                        <div className="space-y-2">
                          {form.invoice_items.map((item) => (
                            <div key={item.id}>
                              <InvoiceItemRow
                                item={item}
                                onEdit={handleEditItem}
                                onRemove={removeItem}
                              />
                            </div>
                          ))}
                          <div className="flex justify-between items-center pt-3 mt-1 border-t border-(--border-color)">
                            <span className="text-sm text-(--text-secondary)">
                              Total
                            </span>
                            <span className="text-lg font-semibold text-(--text-primary)">
                              ₦{totals.totalAmount.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 border border-dashed border-(--border-color) rounded-lg">
                          <p className="text-sm text-(--text-secondary)">
                            No items yet
                          </p>
                          <button
                            onClick={handleAddItem}
                            className="text-xs text-[var(--color-accent-yellow)] font-medium hover:underline mt-1"
                          >
                            Add your first item
                          </button>
                        </div>
                      )}
                      {errors.invoice_items && (
                        <p className="text-destructive text-xs mt-2">
                          {errors.invoice_items}
                        </p>
                      )}
                    </div>

                    {/* Options */}
                    <div className="pt-4 border-t border-(--border-color)">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <Label className="text-sm font-medium text-(--text-primary) flex items-center gap-2">
                            <Mail className="w-4 h-4 text-(--text-secondary)" />
                            Email invoice to client
                          </Label>
                          <p className="text-xs text-(--text-secondary) mt-1">
                            {form.sendEmailAutomatically
                              ? "Client receives an email with the invoice link."
                              : "You'll need to share the link manually."}
                          </p>
                        </div>
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

                    {/* Actions */}
                    <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => handleSubmit(true)}
                        disabled={draftLoading || isFormLocked || loading}
                        className="w-full sm:w-auto h-10 border-(--border-color) text-(--text-primary) hover:bg-(--bg-secondary)"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {draftLoading ? "Saving…" : "Save draft"}
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
                        className={`w-full sm:flex-1 h-10 ${buttonConfig.color}`}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing…
                          </>
                        ) : invoiceUsage.isChecking ? (
                          "Checking…"
                        ) : (
                          <>
                            {buttonConfig.icon}
                            {buttonConfig.text}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              </>
            }
            previewContent={
              <>
                <div className="flex items-start justify-between gap-3 mb-6">
                  <div className="flex items-start gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.back()}
                      className="text-(--text-secondary) hover:bg-(--bg-secondary) -ml-1"
                      disabled={isFormLocked}
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                      <h1 className="text-xl sm:text-2xl font-semibold text-(--text-primary)">
                        Preview
                      </h1>
                      <p className="text-sm text-(--text-secondary) mt-0.5">
                        This is how your client will see the invoice.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="max-w-2xl mx-auto space-y-4">
                  <InvoicePreview invoice={previewInvoice} />

                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-4 border-t border-(--border-color)">
                    <p className="text-xs text-(--text-secondary)">
                      Need to make changes? Go back to the editor.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("create")}
                      className="w-full sm:w-auto h-9 border-(--border-color) text-(--text-primary) hover:bg-(--bg-secondary)"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Back to editor
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
        <div className="text-center p-8 text-(--text-primary)">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent-yellow)] mx-auto mb-4" />
          <p>Loading invoice form…</p>
        </div>
      }
    >
      <CreateInvoice />
    </Suspense>
  );
}
