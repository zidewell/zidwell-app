"use client";

import React, { JSX, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  RefreshCw,
  Save,
  Edit,
  Eye,
  FileText,
  AlertCircle,
  Wallet,
  Coins,
} from "lucide-react";

import PinPopOver from "../PinPopOver";
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
  return Swal.fire({
    icon: type,
    title: title,
    text: message,
    showConfirmButton: true,
    confirmButtonText: "OK",
    confirmButtonColor: "#C29307",
    background: "#ffffff",
    color: "#333333",
    customClass: {
      popup: "sweet-alert-popup",
      title: "sweet-alert-title",
      htmlContainer: "sweet-alert-content",
      confirmButton: "sweet-alert-confirm-btn",
    },
  });
};

const PAY_PER_USE_FEE = 100; // ₦100 per invoice after limit

const CreateInvoice = ({ onInvoiceCreated }: CreateInvoiceProps) => {
  const inputCount = 4;
  const [hasShownDraftModal, setHasShownDraftModal] = useState(false);
  const [pin, setPin] = useState(Array(inputCount).fill(""));
  const [isPinOpen, setIsPinOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showInvoiceSummary, setShowInvoiceSummary] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedSigningLink, setGeneratedSigningLink] = useState<string>("");
  const [savedInvoiceId, setSavedInvoiceId] = useState<string>("");
  const [details, setDetails] = useState<any>(null);
  const [zidcoinBalance, setZidcoinBalance] = useState<number>(0);
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
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<"create" | "preview">("create");
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const { userData, balance } = useUserContextData();
  const { userTier, subscription } = useSubscription();
  const [hasLoadedFromUrl, setHasLoadedFromUrl] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [invoiceUsage, setInvoiceUsage] = useState<InvoiceUsageInfo>({
    used: 0,
    limit: 5,
    remaining: 5,
    hasAccess: true,
    isChecking: true,
    isPayPerUse: false,
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
  });

  // Determine if user is premium/growth
  const isPremium = userTier === "premium" || userTier === "elite";
  const isGrowth = userTier === "growth";
  const hasUnlimitedInvoices = isPremium || isGrowth;

  // Safe balance value (handle null)
  const safeBalance = balance || 0;

  // Function to determine if PIN confirmation is needed
  const requiresPinConfirmation = (): boolean => {
    // If user has unlimited invoices, no PIN needed
    if (hasUnlimitedInvoices) return false;
    
    // If user has remaining free invoices, no PIN needed
    if (typeof invoiceUsage.remaining === 'number' && invoiceUsage.remaining > 0) return false;
    
    // If user has exceeded free limit, PIN is needed for pay-per-use
    return true;
  };

  // Check if user has sufficient balance for pay-per-use
  const hasSufficientBalance = (): boolean => {
    return safeBalance >= PAY_PER_USE_FEE;
  };

  const resetAllLoadingStates = () => {
    setIsProcessingPayment(false);
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
            used: data.invoices.used,
            limit: data.invoices.limit,
            remaining: data.invoices.remaining,
            hasAccess: true,
            isChecking: false,
            isPayPerUse: data.invoices.remaining <= 0 && !hasUnlimitedInvoices,
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
  }, [userData?.id, hasUnlimitedInvoices]);

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
      business_name:
        draft.business_name ||
        (userData?.fullName ? `${userData.fullName}` : userData?.email || ""),
      allowMultiplePayments: draft.allow_multiple_payments || false,
      clientPhone: draft.client_phone || "",
      targetQuantity: draft.target_quantity || 1,
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
      colors: ["#C29307", "#ffd700", "#ffed4e", "#ffffff", "#fbbf24"],
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

      setForm((prev) => ({
        ...prev,
        invoice_id: generateInvoiceId(),
        issue_date: today,
        from: userData.email || "",
        business_name:
          userData.fullName && userData.lastName
            ? `${userData.fullName}`
            : userData.email || "",
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
      <div class="draft-item p-3 border-b border-gray-200 hover:bg-gray-50 cursor-pointer" 
           data-draft-id="${draft.id}">
        <div class="flex justify-between items-center">
          <div>
            <strong class="text-gray-900">${
              draft.business_name || "Untitled Invoice"
            }</strong>
            <div class="text-sm text-gray-600 mt-1">
              ${draft.invoice_id} • ${new Date(
                draft.created_at,
              ).toLocaleDateString()}
            </div>
          </div>
          <button class="load-draft-btn px-3 py-1 text-sm bg-[#C29307] text-white rounded hover:bg-[#b38606] transition-colors"
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
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div class="p-6 border-b">
          <div class="flex justify-between items-center">
            <h3 class="text-xl font-bold text-gray-900">All Drafts (${userDrafts.length})</h3>
            <button class="close-modal text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>
        </div>
        <div class="p-6 overflow-y-auto max-h-[60vh]">
          ${draftsHTML}
        </div>
        <div class="p-6 border-t">
          <button class="start-fresh-btn w-full py-2 px-4 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
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

      const payload = {
        userId: userData?.id,
        initiator_email: userData?.email || "",
        initiator_name: userData
          ? `${userData.fullName} ${userData.lastName}`
          : "",
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

      const payload = {
        userId: userData?.id,
        initiator_email: userData?.email || "",
        initiator_name: userData
          ? `${userData.fullName} ${userData.lastName}`
          : "",
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
      if (!isDraft) {
        await handleRefund();
      }
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
    if (loading || isFormLocked || draftLoading || isProcessingPayment) {
      return;
    }

    try {
      if (isDraft) {
        await handleSaveDraft();
        return;
      }

      // Check if user is in pay-per-use mode and has sufficient balance
      if (requiresPinConfirmation() && !hasSufficientBalance()) {
        const result = await Swal.fire({
          icon: "warning",
          title: "Insufficient Balance",
          text: `You need ₦${PAY_PER_USE_FEE} in your wallet for pay-per-use invoice. Would you like to fund your wallet?`,
          showCancelButton: true,
          confirmButtonText: "Fund Wallet",
          cancelButtonText: "Cancel",
          confirmButtonColor: "#C29307",
        });

        if (result.isConfirmed) {
          router.push("/dashboard/fund-account");
        }
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

  const handleDeduct = async (): Promise<boolean> => {
    // If user has free access, no need to deduct
    if (!requiresPinConfirmation()) {
      return true;
    }

    const pinString = pin.join("");

    try {
      const res = await fetch("/api/deduct-funds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userData?.id,
          pin: pinString,
          isInvoiceCreation: true,
          description: "Pay-per-use invoice creation",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          await showSweetAlert(
            "warning",
            "Limit Reached",
            data.message || "You've reached your monthly invoice limit.",
          );
          router.push("/pricing?upgrade=growth");
        } else if (res.status === 400 && data.error?.includes("Insufficient")) {
          await showSweetAlert(
            "error",
            "Insufficient Balance",
            data.message || "Please fund your wallet to continue.",
          );
          router.push("/dashboard/fund-account");
        } else {
          await showSweetAlert(
            "error",
            "Payment Failed",
            data.error || "Something went wrong",
          );
        }
        return false;
      }

      // Update usage info
      setInvoiceUsage((prev) => ({
        ...prev,
        used: data.usedThisMonth || (typeof prev.used === 'number' ? prev.used + 1 : 1),
        remaining: data.remaining === "unlimited" ? "unlimited" : (data.remaining || (typeof prev.remaining === 'number' ? prev.remaining - 1 : 0)),
        isPayPerUse: data.pay_per_use || false,
      }));

      return true;
    } catch (err: any) {
      await showSweetAlert("error", "Error", err.message);
      return false;
    }
  };

  const handleRefund = async () => {
    try {
      await fetch("/api/refund-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userData?.id,
          amount: 0,
          description: "Refund for failed invoice generation",
        }),
      });
    } catch (err) {
      console.error("Refund failed:", err);
    }
  };

const processPaymentAndSubmit = async () => {
  try {
    setIsProcessingPayment(true);

    const paymentSuccess = await handleDeduct();

    if (paymentSuccess) {
      const result = await handleSaveInvoice(false);
      if (result.success) {
        triggerConfetti();

        resetAllLoadingStates();
        setIsPinOpen(false);
        setPin(Array(inputCount).fill(""));

        setHasUnsavedChanges(false);

        setGeneratedSigningLink(result.signingLink || "");
        setSavedInvoiceId(result.invoiceId || form.invoice_id);

        setShowSuccessModal(true);

        // Only set up polling if we have a valid invoiceId and multiple payments are enabled
        if (form.allowMultiplePayments && result.invoiceId) {
          // Initial fetch
          fetchPaymentStatus(result.invoiceId);
          
          // Set up polling
          const pollInterval = setInterval(() => {
            // Check again inside interval to ensure invoiceId still exists
            if (result.invoiceId) {
              fetchPaymentStatus(result.invoiceId);
            }
          }, 10000);
          
          // Clear polling after 10 minutes
          setTimeout(() => clearInterval(pollInterval), 10 * 60 * 1000);
        }

        if (onInvoiceCreated) {
          onInvoiceCreated();
        }
      } else {
        await handleRefund();
        resetAllLoadingStates();
        setIsPinOpen(false);
        setPin(Array(inputCount).fill(""));
      }
    } else {
      resetAllLoadingStates();
      setIsPinOpen(false);
      setPin(Array(inputCount).fill(""));
    }
  } catch (error) {
    resetAllLoadingStates();
    setIsPinOpen(false);
    setPin(Array(inputCount).fill(""));
    await showSweetAlert(
      "error",
      "Processing Failed",
      "Failed to process payment. Please try again.",
    );
  }
};
  const handleSummaryConfirm = () => {
    setShowInvoiceSummary(false);
    
    // Only show PIN popup if user has exceeded free limit
    if (requiresPinConfirmation()) {
      setIsPinOpen(true);
    } else {
      // For free invoices (within limit) or premium/growth, process directly
      processPaymentAndSubmit();
    }
  };

  const handleSummaryBack = () => {
    setShowInvoiceSummary(false);
    resetAllLoadingStates();
    setIsPinOpen(false);
    setPin(Array(inputCount).fill(""));
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

  const handleDownloadPDF = async () => {
    try {
      setPdfLoading(true);

      const { subtotal, feeAmount, totalAmount } = totals;

      const htmlContent = `...`; // Your existing PDF HTML content

      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          html: htmlContent,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `invoice-${form.invoice_id}.pdf`;

      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showSweetAlert(
        "success",
        "PDF Downloaded!",
        "Your invoice has been downloaded as PDF",
      );
    } catch (error) {
      console.error("PDF download error:", error);
      showSweetAlert(
        "error",
        "Download Failed",
        "Failed to download PDF. Please try again.",
      );
    } finally {
      setPdfLoading(false);
    }
  };

  const previewInvoice = convertToInvoicePreview(form);

  // Determine display text and styles
  const getButtonConfig = (): { text: string; color: string; icon: JSX.Element | null } => {
    if (hasUnlimitedInvoices) {
      return {
        text: "Generate Invoice",
        color: "bg-[#C29307] hover:bg-[#b38606]",
        icon: null,
      };
    }
    if (typeof invoiceUsage.remaining === 'number' && invoiceUsage.remaining > 0) {
      return {
        text: `Generate Invoice (${invoiceUsage.remaining} free left)`,
        color: "bg-[#C29307] hover:bg-[#b38606]",
        icon: null,
      };
    }
    return {
      text: `Pay ₦${PAY_PER_USE_FEE} to Generate`,
      color: hasSufficientBalance() 
        ? "bg-blue-600 hover:bg-blue-700" 
        : "bg-gray-400 cursor-not-allowed",
      icon: React.createElement(Wallet, { className: "w-4 h-4 mr-2" }),
    };
  };

  const buttonConfig = getButtonConfig();

  // Format remaining display text safely
  const getRemainingText = (): string => {
    if (hasUnlimitedInvoices) return "UNLIMITED";
    if (typeof invoiceUsage.remaining === 'number' && invoiceUsage.remaining > 0) {
      return `${invoiceUsage.remaining} left`;
    }
    return "Pay per use";
  };

  const getRemainingColor = (): string => {
    if (hasUnlimitedInvoices) return "bg-purple-600";
    if (typeof invoiceUsage.remaining === 'number' && invoiceUsage.remaining > 0) {
      return "bg-[#C29307]";
    }
    return "bg-blue-600";
  };

  return (
    <>
  
      {requiresPinConfirmation() && (
        <PinPopOver
          setIsOpen={(newValue: boolean) => {
            setIsPinOpen(newValue);
            if (!newValue) {
              resetAllLoadingStates();
              setPin(Array(inputCount).fill(""));
            }
          }}
          isOpen={isPinOpen}
          pin={pin}
          setPin={setPin}
          inputCount={inputCount}
          onConfirm={async () => {
            await processPaymentAndSubmit();
          }}
          invoiceFeeInfo={{
            isFree: false,
            freeInvoicesLeft: typeof invoiceUsage.remaining === 'number' ? invoiceUsage.remaining : 0,
            totalInvoicesCreated: typeof invoiceUsage.used === 'number' ? invoiceUsage.used : 0,
            feeAmount: PAY_PER_USE_FEE,
          }}
        />
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
        payPerUseFee={requiresPinConfirmation() ? PAY_PER_USE_FEE : 0}
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
        onDownloadPDF={handleDownloadPDF}
        onCopyLink={handleCopySigningLink}
        allowMultiplePayments={form.allowMultiplePayments}
        pdfLoading={pdfLoading}
      />

      <div className="min-h-screen bg-background">
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
                      className="text-[#C29307] hover:bg-white/10"
                      disabled={isFormLocked || isProcessingPayment}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>

                    <div>
                      <h1 className="md:text-3xl text-xl font-bold mb-2 flex items-start gap-3">
                        Create Invoice
                        {!invoiceUsage.isChecking && (
                          <span
                            className={`p-1 text-white text-sm font-bold rounded ${getRemainingColor()}`}
                          >
                            {getRemainingText()}
                          </span>
                        )}
                      </h1>
                      <p className="text-muted-foreground">
                        Generate a professional invoice and share the link for payments
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Wallet Balance Display */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                        <Wallet className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">
                          ₦{safeBalance.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">
                        <Coins className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-700">
                          {zidcoinBalance} ZC
                        </span>
                      </div>
                    </div>

                    {isProcessingPayment && (
                      <Badge
                        variant="outline"
                        className="bg-red-50 text-red-700 border-red-200"
                      >
                        <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                        Processing...
                      </Badge>
                    )}
                    {form.invoice_items.length > 0 && (
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200"
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        {form.invoice_items.length} item(s)
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Usage/Payment Warning */}
                {!hasUnlimitedInvoices && !invoiceUsage.isChecking && (
                  <div
                    className={`mb-6 p-4 rounded-lg border ${
                      typeof invoiceUsage.remaining === 'number' && invoiceUsage.remaining <= 0
                        ? hasSufficientBalance()
                          ? "bg-blue-50 border-blue-200"
                          : "bg-red-50 border-red-200"
                        : typeof invoiceUsage.remaining === 'number' && invoiceUsage.remaining <= 2
                        ? "bg-yellow-50 border-yellow-200"
                        : "bg-green-50 border-green-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle
                        className={`w-5 h-5 mt-0.5 ${
                          typeof invoiceUsage.remaining === 'number' && invoiceUsage.remaining <= 0
                            ? hasSufficientBalance()
                              ? "text-blue-500"
                              : "text-red-500"
                            : typeof invoiceUsage.remaining === 'number' && invoiceUsage.remaining <= 2
                            ? "text-yellow-500"
                            : "text-green-500"
                        }`}
                      />
                      <div className="flex-1">
                        <p
                          className={`font-medium ${
                            typeof invoiceUsage.remaining === 'number' && invoiceUsage.remaining <= 0
                              ? hasSufficientBalance()
                                ? "text-blue-700"
                                : "text-red-700"
                              : typeof invoiceUsage.remaining === 'number' && invoiceUsage.remaining <= 2
                              ? "text-yellow-700"
                              : "text-green-700"
                          }`}
                        >
                          {typeof invoiceUsage.remaining === 'number' && invoiceUsage.remaining <= 0
                            ? hasSufficientBalance()
                              ? "Pay-per-use mode active"
                              : "Insufficient balance for pay-per-use"
                            : `You have ${invoiceUsage.remaining} free invoice${invoiceUsage.remaining !== 1 ? "s" : ""} remaining`}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {typeof invoiceUsage.remaining === 'number' && invoiceUsage.remaining <= 0
                            ? hasSufficientBalance()
                              ? `This invoice will cost ₦${PAY_PER_USE_FEE}. Click "Pay ₦${PAY_PER_USE_FEE} to Generate" to continue.`
                              : `Please fund your wallet with at least ₦${PAY_PER_USE_FEE} to create invoices.`
                            : `After your free limit, you can continue with pay-per-use (₦${PAY_PER_USE_FEE} per invoice).`}
                        </p>
                        {typeof invoiceUsage.remaining === 'number' && invoiceUsage.remaining <= 2 && invoiceUsage.remaining > 0 && (
                          <Button
                            size="sm"
                            className="mt-2 bg-[#C29307] hover:bg-[#b38606] text-white"
                            onClick={() => router.push("/pricing?upgrade=growth")}
                          >
                            Upgrade to Growth
                          </Button>
                        )}
                        {typeof invoiceUsage.remaining === 'number' && invoiceUsage.remaining <= 0 && !hasSufficientBalance() && (
                          <Button
                            size="sm"
                            className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => router.push("/dashboard/fund-account")}
                          >
                            Fund Wallet Now
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Premium Banner */}
                {hasUnlimitedInvoices && (
                  <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-purple-700 font-medium flex items-center gap-2">
                      <span className="bg-purple-600 text-white px-2 py-1 rounded text-xs">
                        {userTier === "growth" ? "GROWTH" : "PREMIUM"}
                      </span>
                      You have unlimited invoices! No payment required.
                    </p>
                  </div>
                )}

                <Card className="p-6">
                  <LogoUpload
                    logo={form.business_logo || ""}
                    onLogoChange={(logoDataUrl: string) =>
                      setForm((prev) => ({
                        ...prev,
                        business_logo: logoDataUrl,
                      }))
                    }
                  />
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="businessName">Business Name *</Label>
                      <Input
                        id="businessName"
                        value={form.business_name}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            business_name: e.target.value,
                          }))
                        }
                        placeholder="Your Business Name"
                        className="mt-1"
                        disabled={isFormLocked || isProcessingPayment}
                      />
                      {errors.business_name && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.business_name}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="invoiceNumber">Invoice Number</Label>
                      <Input
                        id="invoiceNumber"
                        value={form.invoice_id}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            invoice_id: e.target.value,
                          }))
                        }
                        className="mt-1"
                        disabled={true}
                      />
                    </div>

                    <div className="border-t border-border pt-4 mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-foreground">
                          Bill To
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          (Optional - leave blank for client to fill)
                        </span>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="clientName">Client Name</Label>
                          <Input
                            id="clientName"
                            value={form.name || ""}
                            onChange={handleFormChange}
                            name="name"
                            placeholder="Leave blank for client to fill"
                            className="mt-1"
                            disabled={isFormLocked || isProcessingPayment}
                          />
                        </div>
                        <div>
                          <Label htmlFor="clientEmail">Client Email</Label>
                          <Input
                            id="clientEmail"
                            type="email"
                            value={form.email || ""}
                            onChange={handleFormChange}
                            name="email"
                            placeholder="Leave blank for client to fill"
                            className="mt-1"
                            disabled={isFormLocked || isProcessingPayment}
                          />
                          {errors.email && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors.email}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="clientPhone">Client Phone</Label>
                          <Input
                            id="clientPhone"
                            value={form.clientPhone || ""}
                            onChange={handleFormChange}
                            name="clientPhone"
                            placeholder="Leave blank for client to fill"
                            className="mt-1"
                            disabled={isFormLocked || isProcessingPayment}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-border pt-4 mt-6">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="font-semibold text-foreground">
                            Items
                          </h3>
                          {form.invoice_items.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {form.invoice_items.length} item
                              {form.invoice_items.length !== 1 ? "s" : ""} •
                              Total: ₦
                              {form.invoice_items
                                .reduce((sum, item) => sum + (item.total || 0), 0)
                                .toLocaleString()}
                            </p>
                          )}
                        </div>
                        <Button
                          className="bg-[#C29307] hover:bg-[#b38606] text-white cursor-pointer"
                          size="sm"
                          onClick={handleAddItem}
                          disabled={isFormLocked || isProcessingPayment}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Item
                        </Button>
                      </div>

                      {form.invoice_items.length > 0 ? (
                        <div>
                          <div className="hidden md:grid md:grid-cols-12 gap-3 mb-2 text-xs font-semibold text-muted-foreground">
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

                          <div className="md:hidden text-xs text-muted-foreground mb-2">
                            Tap items to see details
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
                        <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-md">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center">
                              <Plus className="h-6 w-6 text-muted-foreground" />
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
                        <p className="text-red-500 text-sm mt-2">
                          {errors.invoice_items}
                        </p>
                      )}
                    </div>

                    <div className="border-t border-border pt-4 mt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <Label
                            htmlFor="multiplePayments"
                            className="font-medium"
                          >
                            🎫 Allow Multiple Full Payments
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            Enable multiple people to each pay the FULL amount
                            (perfect for events, tickets, group purchases)
                          </p>
                        </div>
                        <div
                          className={
                            form.allowMultiplePayments
                              ? "data-[state=checked]:bg-[#C29307]"
                              : ""
                          }
                        >
                          <Switch
                            id="multiplePayments"
                            checked={form.allowMultiplePayments}
                            onCheckedChange={(checked) =>
                              setForm((prev) => ({
                                ...prev,
                                allowMultiplePayments: checked,
                                payment_type: checked ? "multiple" : "single",
                                targetQuantity: checked
                                  ? prev.targetQuantity || 1
                                  : 1,
                              }))
                            }
                            disabled={isFormLocked || isProcessingPayment}
                          />
                        </div>
                      </div>

                      <div className="border-t border-border pt-4 mt-4">
                        <Label htmlFor="redirectUrl">
                          Redirect URL (Optional)
                        </Label>
                        <Input
                          id="redirectUrl"
                          type="url"
                          value={form.redirect_url || ""}
                          onChange={handleFormChange}
                          name="redirect_url"
                          placeholder="https://example.com/thankyou"
                          className="mt-1"
                          disabled={isFormLocked || isProcessingPayment}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Redirect clients to this URL after successful payment
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => handleSubmit(true)}
                        disabled={
                          isProcessingPayment ||
                          draftLoading ||
                          isFormLocked ||
                          loading
                        }
                        className="flex-1"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {draftLoading ? "Saving..." : "Save Draft"}
                      </Button>
                      <Button
                        onClick={() => handleSubmit(false)}
                        disabled={
                          isProcessingPayment ||
                          loading ||
                          isFormLocked ||
                          draftLoading ||
                          invoiceUsage.isChecking ||
                          (!hasSufficientBalance() && requiresPinConfirmation())
                        }
                        className={`flex-1 ${buttonConfig.color} text-white`}
                      >
                        {isProcessingPayment ? (
                          <div className="flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </div>
                        ) : loading ? (
                          <div className="flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Validating...
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
                      className="text-[#C29307] hover:bg-white/10"
                      disabled={isFormLocked || isProcessingPayment}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>

                    <div>
                      <h1 className="md:text-3xl text-xl font-bold mb-2 flex items-start gap-3">
                        Invoice Preview
                        {!invoiceUsage.isChecking && (
                          <span
                            className={`p-1 text-white text-sm font-bold rounded ${getRemainingColor()}`}
                          >
                            {getRemainingText()}
                          </span>
                        )}
                      </h1>
                      <p className="text-muted-foreground">
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
                    {isProcessingPayment && (
                      <Badge
                        variant="outline"
                        className="bg-red-50 text-red-700 border-red-200"
                      >
                        <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                        Processing...
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Eye className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                      <div>
                        <h3 className="font-medium text-blue-800">
                          Live Preview Mode
                        </h3>
                        <p className="text-sm text-blue-700 mt-1">
                          This is a real-time preview of how your invoice will
                          look. Any changes made in the "Create Invoice" tab
                          will be reflected here instantly.
                        </p>
                      </div>
                    </div>
                  </div>

                  <InvoicePreview invoice={previewInvoice} />

                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="text-sm text-gray-500">
                      <p>
                        Switch to the "Create Invoice" tab to edit your invoice
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("create")}
                      className="border-[#C29307] text-[#C29307] hover:bg-[#C29307]/10"
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

function InvoicePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateInvoice />
    </Suspense>
  );
}

export default CreateInvoice;