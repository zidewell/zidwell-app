"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import confetti from "canvas-confetti";
import Swal from "sweetalert2";

import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import {
  Plus,
  Download,
  ArrowLeft,
  Copy,
  Link,
  RefreshCw,
  Users,
  Save,
  Edit,
  Trash2,
  X,
  Eye,
  Clock,
  Calendar,
  FileText,
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
  FreeInvoiceInfo,
} from "./types";

import { useUserContextData } from "@/app/context/userData";

const showSweetAlert = (
  type: "success" | "error" | "warning" | "info",
  title: string,
  message: string,
) => {
  Swal.fire({
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
  const { userData } = useUserContextData();
  const [hasLoadedFromUrl, setHasLoadedFromUrl] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [freeInvoiceInfo, setFreeInvoiceInfo] = useState<FreeInvoiceInfo>({
    freeInvoicesLeft: 0,
    totalInvoicesCreated: 0,
    hasFreeInvoices: false,
    isChecking: true,
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
        (userData?.firstName && userData?.lastName
          ? `${userData.firstName} ${userData.lastName}`
          : userData?.email || ""),
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

  useEffect(() => {
    const checkInvoiceStatus = async () => {
      if (userData?.id) {
        try {
          const res = await fetch(
            `/api/check-remaning-free-invoice?userId=${userData.id}`,
          );
          const data = await res.json();

          if (data.success) {
            setFreeInvoiceInfo({
              freeInvoicesLeft: data.freeInvoicesLeft ?? 0,
              totalInvoicesCreated: data.totalInvoicesCreated ?? 0,
              hasFreeInvoices: data.hasFreeInvoices ?? false,
              isChecking: false,
            });
          } else {
            setFreeInvoiceInfo({
              freeInvoicesLeft: 0,
              totalInvoicesCreated: 0,
              hasFreeInvoices: false,
              isChecking: false,
            });
          }
        } catch (error) {
          console.error("Error checking invoice status:", error);
          setFreeInvoiceInfo({
            freeInvoicesLeft: 0,
            totalInvoicesCreated: 0,
            hasFreeInvoices: false,
            isChecking: false,
          });
        }
      } else {
        setFreeInvoiceInfo({
          freeInvoicesLeft: 0,
          totalInvoicesCreated: 0,
          hasFreeInvoices: false,
          isChecking: false,
        });
      }
    };

    checkInvoiceStatus();
  }, [userData?.id]);

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
          userData.firstName && userData.lastName
            ? `${userData.firstName} ${userData.lastName}`
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

  useEffect(() => {
    const fetchAccountDetails = async () => {
      if (!userData?.id) return;
      try {
        const res = await fetch("/api/get-wallet-account-details", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: userData.id }),
        });
        const data = await res.json();

        setDetails(data);
      } catch (error) {
        console.error("Error fetching balance:", error);
      }
    };

    fetchAccountDetails();
  }, [userData?.id]);

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
          ? `${userData.firstName} ${userData.lastName}`
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
          ? `${userData.firstName} ${userData.lastName}`
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
          details?.bank_details.bank_account_number || "",
        initiator_account_name: details?.bank_details.bank_account_name || "",
        initiator_bank_name: details?.bank_details.bank_name || "",
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

      if (!validateInvoiceForm()) {
        showSweetAlert(
          "error",
          "Validation Failed",
          "Please correct the errors before generating the invoice.",
        );
        return;
      }

      if (form.invoice_items.length === 0) {
        showSweetAlert(
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
        showSweetAlert(
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
        showSweetAlert(
          "error",
          "Invalid Target Quantity",
          "For multiple payments, target quantity must be at least 1.",
        );
        return;
      }

      setShowInvoiceSummary(true);
    } catch (error) {
      console.error("Submit error:", error);
      showSweetAlert(
        "error",
        "Submission Error",
        "An error occurred while processing your request.",
      );
    }
  };

  const handleDeduct = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      const pinString = pin.join("") || "0000";

      fetch("/api/pay-app-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userData?.id,
          pin: pinString,
          amount: freeInvoiceInfo.hasFreeInvoices ? 0 : 100,
          description: "Invoice successfully generated",
          isInvoiceCreation: true,
          service: "invoice",
        }),
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) {
            showSweetAlert(
              "error",
              "Payment Failed",
              data.error || "Something went wrong",
            );
            resolve(false);
          } else {
            setFreeInvoiceInfo({
              freeInvoicesLeft: data.freeInvoicesLeft || 0,
              totalInvoicesCreated: data.totalInvoicesCreated || 0,
              hasFreeInvoices: (data.freeInvoicesLeft || 0) > 0,
              isChecking: false,
            });
            resolve(true);
          }
        })
        .catch((err) => {
          showSweetAlert("error", "Error", err.message);
          resolve(false);
        });
    });
  };

  const handleRefund = async () => {
    try {
      await fetch("/api/refund-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userData?.id,
          amount: freeInvoiceInfo.hasFreeInvoices ? 0 : 100,
          description: "Refund for failed invoice generation",
        }),
      });
      showSweetAlert(
        "info",
        "Refund Processed",
        "Amount has been refunded to your wallet due to failed invoice sending.",
      );
    } catch (err) {
      console.error("Refund failed:", err);
      showSweetAlert(
        "warning",
        "Refund Failed",
        "Payment deduction was made, but refund failed. Please contact support.",
      );
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

          if (form.allowMultiplePayments && result.invoiceId) {
            fetchPaymentStatus(result.invoiceId!);
            const pollInterval = setInterval(() => {
              fetchPaymentStatus(result.invoiceId!);
            }, 10000);
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
      showSweetAlert(
        "error",
        "Processing Failed",
        "Failed to process payment. Please try again.",
      );
    }
  };

  const handleSummaryConfirm = () => {
    setShowInvoiceSummary(false);
    setIsPinOpen(true);
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

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice ${form.invoice_id}</title>
          <meta charset="UTF-8">
          <style>
            body { 
              font-family: 'Arial', sans-serif; 
              margin: 0;
              padding: 40px;
              color: #333;
              line-height: 1.6;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 40px;
              padding-bottom: 20px;
              border-bottom: 2px solid #C29307;
            }
            .business-info {
              flex: 1;
            }
            .invoice-info {
              text-align: right;
            }
            .logo {
              max-height: 80px;
              max-width: 200px;
              margin-bottom: 10px;
            }
            .accound-details {
             display: flex;
             flex-direction: column;
             gap: 10px;
            }
            .accound-details h2 {
            color: #C29307;;
            }
            h1 {
              color: #C29307;
              margin: 0 0 10px 0;
              font-size: 32px;
              font-weight: bold;
            }
            h2 {
              margin: 0 0 10px 0;
              font-size: 24px;
              color: #333;
            }
            h3 {
              margin: 0 0 15px 0;
              font-size: 18px;
              color: #333;
            }
            .section {
              margin: 30px 0;
            }
            .billing-info {
              display: flex;
              justify-content: space-between;
              gap: 40px;
            }
            .billing-section {
              flex: 1;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 30px 0;
              font-size: 14px;
            }
            .items-table th {
              background-color: #f8f9fa;
              border: 1px solid #ddd;
              padding: 12px 15px;
              text-align: left;
              font-weight: bold;
              color: #333;
            }
            .items-table td {
              border: 1px solid #ddd;
              padding: 12px 15px;
              text-align: left;
            }
            .items-table tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .totals {
              margin-top: 30px;
              text-align: right;
              font-size: 16px;
            }
            .total-row {
              margin: 8px 0;
            }
            .grand-total {
              font-size: 20px;
              font-weight: bold;
              color: #C29307;
              margin-top: 15px;
              padding-top: 15px;
              border-top: 2px solid #ddd;
            }
            .message-box {
              background-color: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              border-left: 4px solid #C29307;
              margin: 20px 0;
            }
            .note-box {
              background-color: #e8f4fd;
              padding: 20px;
              border-radius: 8px;
              border-left: 4px solid #2196F3;
              margin: 20px 0;
            }
                .invoice-narration{
               margin-left: 30px;
              }
            .footer {
              margin-top: 50px;
              text-align: center;
              color: #666;
              font-size: 14px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              background-color: #C29307;
              color: white;
              border-radius: 20px;
              font-size: 12px;
              font-weight: bold;
              margin-left: 10px;
            }
          
            .payment-info {
              background-color: #f0f9ff;
              padding: 20px;
              border-radius: 8px;
              border-left: 4px solid #0ea5e9;
              margin: 20px 0,
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="business-info">
                ${
                  form.business_logo
                    ? `<img src="${form.business_logo}" alt="${form.business_name}" class="logo">`
                    : ""
                }
                <h2>${form.business_name}</h2>
                <p>${userData?.email || ""}</p>
                ${form.bill_to ? `<p>${form.bill_to}</p>` : ""}
                <div class="account-details">

                  <h2>Account Details</h2>

                  <h3>${details?.bank_details.bank_account_name}</h3>
                  <h3>${details?.bank_details.bank_account_number}</h3>
                <h3>${details?.bank_details.bank_name}</h3>
                </div>

              
              </div>
              <div class="invoice-info">
                <h1>INVOICE</h1>
                <p><strong>Invoice #:</strong> ${form.invoice_id}</p>
                <p><strong>Issue Date:</strong> ${new Date(
                  form.issue_date,
                ).toLocaleDateString()}</p>
    
                <p><strong>Status:</strong> ${
                  form.status
                } <span class="status-badge">${form.status.toUpperCase()}</span></p>

                                <small class="invoice-narration">
                  Ensure this invoice number <strong>${
                    form.invoice_id
                  }</strong> is used as the narration when you transfer to make payment valid.
                </small>
              </div>
            </div>

            <div class="section">
              <div class="billing-info">
                <div class="billing-section">
                  <h3>Bill To:</h3>
                  <p><strong>${form.name || "Client Information"}</strong></p>
                  ${form.email ? `<p>📧 ${form.email}</p>` : ""}
                  ${form.clientPhone ? `<p>📞 ${form.clientPhone}</p>` : ""}
                </div>
                <div class="billing-section">
                  <h3>From:</h3>
                  <p><strong>${
                    userData
                      ? `${userData.firstName} ${userData.lastName}`
                      : form.business_name
                  }</strong></p>
                  <p>📧 ${userData?.email || ""}</p>
                </div>
              </div>
            </div>

            ${
              form.message
                ? `
            <div class="section">
              <div class="message-box">
                <h3>Message from ${
                  userData?.firstName || form.business_name
                }:</h3>
                <p>${form.message}</p>
              </div>
            </div>
            `
                : ""
            }

            <div class="section">
              <h3>Invoice Items</h3>
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th width="100">Qty</th>
                    <th width="120">Unit Price</th>
                    <th width="120">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${form.invoice_items
                    .map(
                      (item) => `
                    <tr>
                      <td>${item.description}</td>
                      <td>${item.quantity}</td>
                      <td>₦${Number(item.unitPrice).toLocaleString()}</td>
                      <td>₦${Number(item.total).toLocaleString()}</td>
                    </tr>
                  `,
                    )
                    .join("")}
                </tbody>
              </table>
            </div>

            <div class="totals">
              <div class="total-row">
                <strong>Subtotal:</strong> ₦${Number(subtotal).toLocaleString()}
              </div>
              ${
                feeAmount > 0
                  ? `
              <div class="total-row">
                <strong>Processing Fee (2%):</strong> ₦${Number(
                  feeAmount,
                ).toLocaleString()}
              </div>
              `
                  : ""
              }
              <div class="total-row grand-total">
                <strong>TOTAL AMOUNT:</strong> ₦${Number(
                  totalAmount,
                ).toLocaleString()}
              </div>
              ${
                form.fee_option === "absorbed"
                  ? `
              <div class="total-row" style="font-size: 12px; color: #666;">
                *3% processing fees absorbed by merchant
              </div>
              `
                  : form.fee_option === "customer"
                    ? `
              <div class="total-row" style="font-size: 12px; color: #666;">
                *3% processing fee applied (capped at ₦2,000)
              </div>
              `
                    : ""
              }
            </div>

            ${
              form.customer_note
                ? `
            <div class="section">
              <div class="note-box">
                <h3>Note to Customer:</h3>
                <p>${form.customer_note}</p>
              </div>
            </div>
            `
                : ""
            }

            ${
              form.allowMultiplePayments
                ? `
            <div class="section">
              <div class="payment-info">
                <h3>🎫 Multiple Payments Information:</h3>
                <p><strong>Payment Mode:</strong> Multiple Full Payments</p>
                <p><strong>Individual Payment:</strong> ₦${Number(
                  totalAmount,
                ).toLocaleString()} per person</p>
                <p><strong>Target Quantity:</strong> ${
                  form.targetQuantity
                } people</p>
                <p><strong>How it works:</strong></p>
                <ul>
                  <li>Each person pays the full amount: ₦${Number(
                    totalAmount,
                  ).toLocaleString()}</li>
                  <li>Share the invoice link with everyone</li>
                  <li>Each person provides their info and pays</li>
                  <li>Perfect for events, tickets, group purchases</li>
                </ul>
              </div>
            </div>
            `
                : ""
            }

            <div class="footer">
              <p><strong>Thank you for your business!</strong></p>
              <p>If you have any questions about this invoice, please contact ${
                userData?.email || form.from
              }</p>
              <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </body>
        </html>
      
      `;

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

  return (
    <>
      <PinPopOver
        setIsOpen={(newValue: any) => {
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
          isFree: freeInvoiceInfo.hasFreeInvoices,
          freeInvoicesLeft: freeInvoiceInfo.freeInvoicesLeft,
          totalInvoicesCreated: freeInvoiceInfo.totalInvoicesCreated,
          feeAmount: freeInvoiceInfo.hasFreeInvoices ? 0 : 100,
        }}
      />

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
        initiatorName={`${userData?.firstName || ""} ${
          userData?.lastName || ""
        }`}
        initiatorEmail={userData?.email || ""}
        amount={freeInvoiceInfo.hasFreeInvoices ? 0 : 100}
        confirmInvoice={showInvoiceSummary}
        onBack={handleSummaryBack}
        onConfirm={handleSummaryConfirm}
        freeInvoiceInfo={freeInvoiceInfo}
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
                        <span
                          className={`p-1 text-white text-sm font-bold rounded ${
                            freeInvoiceInfo.hasFreeInvoices
                              ? "bg-[#C29307]"
                              : "bg-red-600"
                          }`}
                        >
                          {freeInvoiceInfo.isChecking
                            ? "Loading..."
                            : freeInvoiceInfo.hasFreeInvoices
                              ? `Free (${freeInvoiceInfo.freeInvoicesLeft} left)`
                              : "₦100"}
                        </span>
                      </h1>
                      <p className="text-muted-foreground">
                        Generate a professional invoice and share the link for
                        payments
                        {!freeInvoiceInfo.isChecking && (
                          <span
                            className={`font-medium ml-2 ${
                              freeInvoiceInfo.hasFreeInvoices
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            •{" "}
                            {freeInvoiceInfo.hasFreeInvoices
                              ? `${freeInvoiceInfo.freeInvoicesLeft} free invoices remaining`
                              : "₦100 per invoice after free limit"}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isProcessingPayment && (
                      <Badge
                        variant="outline"
                        className="bg-red-50 text-red-700 border-red-200"
                      >
                        <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                        Processing Payment...
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

                <Card className="p-6">
                  <LogoUpload
                    logo={form.business_logo || ""}
                    onLogoChange={(logoDataUrl: any) =>
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
                                .reduce((sum, item) => sum + item.total, 0)
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
                          (e.g., registration form, download page)
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
                          draftLoading
                        }
                        className="flex-1 bg-[#C29307] hover:bg-[#b38606] text-white"
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
                        ) : freeInvoiceInfo.isChecking ? (
                          "Checking..."
                        ) : (
                          "Generate Invoice"
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
                        <span
                          className={`p-1 text-white text-sm font-bold rounded ${
                            freeInvoiceInfo.hasFreeInvoices
                              ? "bg-[#C29307]"
                              : "bg-red-600"
                          }`}
                        >
                          {freeInvoiceInfo.isChecking
                            ? "Loading..."
                            : freeInvoiceInfo.hasFreeInvoices
                              ? `Free (${freeInvoiceInfo.freeInvoicesLeft} left)`
                              : "₦100"}
                        </span>
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
                        Processing Payment...
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

function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateInvoice />
    </Suspense>
  );
}

export default CreateInvoice;
