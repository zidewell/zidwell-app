"use client";

import React, {
  useEffect,
  useState,
  Suspense,
  useCallback,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Save,
  Loader2,
  Eye,
  Mail,
  Phone,
  EyeOff,
  Crown,
} from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useUserContextData } from "../../context/userData";
import { useSubscription } from "../../hooks/useSubscripion";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import Swal from "sweetalert2";
import posthog from "posthog-js";
import { GenerateReceiptModal } from "./GenerateReceiptModal";
import { ReceiptPreview } from "../previews/RecieptPreview";
import Link from "next/link";

import { ReceiptSummary } from "./ReceiptSummary";
import { SignaturePad } from "../SignaturePad";
import { ReceiptItemsForm } from "./ReceiptItemsForm";
import { ReceiptTypeSelector } from "./ReceiptTypeSelector";

import type {
  ReceiptType,
  SellerInfo,
  ReceiverInfo,
  ReceiptItem,
  ReceiptDraft,
  DraftsResponse,
  SaveReceiptResponse,
  ReceiptSummaryItem,
} from "./receiptTypes";
import ReceiptPDFGenerator from "./ReceiptPDFGenerator";

interface CreateReceiptProps {
  userTier?: "free" | "starter" | "sme" | "enterprise";
  hasReachedLimit?: boolean;
}

const RECEIPT_LIMITS: Record<string, number> = {
  free: 5,
  starter: 5,
  sme: Infinity,
  enterprise: Infinity,
};

const resolveReceiptLimit = (tier: string): number =>
  RECEIPT_LIMITS[tier] ?? 5;

function CreateReceiptPage({
  userTier,
  hasReachedLimit = false,
}: CreateReceiptProps) {
  const { userTier: subscriptionTier } = useSubscription();
  const effectiveUserTier = subscriptionTier || userTier || "free";

  const [loading, setLoading] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
  const [isFormLocked, setIsFormLocked] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showReceiptSummary, setShowReceiptSummary] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<"create" | "preview">("create");
  const [saveSignatureForFuture, setSaveSignatureForFuture] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedReceiptData, setSavedReceiptData] = useState<any>(null);
  const [sendEmailAutomatically, setSendEmailAutomatically] = useState(true);

  const router = useRouter();
  const { userData } = useUserContextData();
  const [generatedReceiptData, setGeneratedReceiptData] = useState<any>(null);

  const sellerNameRef = useRef<HTMLInputElement>(null);

  const receiptLimit = resolveReceiptLimit(effectiveUserTier);
  const hasUnlimitedReceipts = !Number.isFinite(receiptLimit);

  const [receiptType, setReceiptType] = useState<ReceiptType>("general");
  const [seller, setSeller] = useState<SellerInfo>({
    name: "",
    phone: "",
    email: "",
  });
  const [receiver, setReceiver] = useState<ReceiverInfo>({
    name: "",
    email: "",
    phone: "",
  });
  const [items, setItems] = useState<ReceiptItem[]>([
    { id: "item_1", description: "", amount: 0, quantity: 1, unitPrice: 0 },
  ]);
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "transfer" | "card" | "other"
  >("transfer");
  const [sellerSignature, setSellerSignature] = useState("");

  const [userDrafts, setUserDrafts] = useState<ReceiptDraft[]>([]);
  const [, setIsLoadingDrafts] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedSigningLink, setGeneratedSigningLink] = useState<string>("");
  const [savedReceiptId, setSavedReceiptId] = useState<string>("");

  const hasFreeReceiptAccess = (): boolean => {
    if (hasUnlimitedReceipts) return true;
    return !hasReachedLimit;
  };

  const generateReceiptId = useCallback(() => {
    const datePart = new Date().getFullYear();
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    return `REC-${datePart}-${randomPart}`;
  }, []);

  const generateToken = useCallback(() => {
    return `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  useEffect(() => {
    if (userData) {
      const sellerInfo = {
        name: userData.fullName ? `${userData.fullName}` : userData.email || "",
        email: userData.email || "",
        phone: userData.phone || "",
      };
      setSeller(sellerInfo);

      setTimeout(() => {
        if (sellerNameRef.current) sellerNameRef.current.focus();
      }, 500);

      if (
        !isInitialLoad &&
        (sellerInfo.name || sellerInfo.email || sellerInfo.phone)
      ) {
        setHasUnsavedChanges(true);
      }
    }
  }, [userData, isInitialLoad]);

  useEffect(() => {
    if (userData?.id) loadUserDrafts();
  }, [userData?.id]);

  useEffect(() => {
    if (!isInitialLoad) {
      const hasContent =
        seller.name ||
        seller.email ||
        receiver.name ||
        receiver.email ||
        receiver.phone ||
        items.some((item) => item.description || item.amount > 0) ||
        sellerSignature;
      if (hasContent) setHasUnsavedChanges(true);
    }
  }, [
    isInitialLoad,
    seller,
    receiver,
    items,
    sellerSignature,
    receiptType,
    paymentMethod,
  ]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const loadSignatureManually = async () => {
    try {
      if (!userData?.id) {
        toast.warning("You need to be logged in to load saved signatures.");
        return;
      }
      const res = await fetch(`/api/saved-signature?userId=${userData.id}`);
      const data = await res.json();
      if (res.ok && data.success && data.signature) {
        setSellerSignature(data.signature);
        setSaveSignatureForFuture(true);
        toast.success("Saved signature loaded");
      } else {
        toast.info("No saved signature found");
      }
    } catch (error) {
      console.error("Failed to load signature:", error);
      toast.error("Failed to load saved signature");
    }
  };

  const saveSignatureToDatabase = async (signatureDataUrl: string) => {
    try {
      if (!userData?.id) return false;
      const res = await fetch("/api/saved-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userData.id,
          signature: signatureDataUrl,
        }),
      });
      const data = await res.json();
      return res.ok && data.success;
    } catch {
      return false;
    }
  };

  const deleteSavedSignature = async () => {
    try {
      if (!userData?.id) return false;
      const res = await fetch("/api/saved-signature", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userData.id }),
      });
      const data = await res.json();
      return res.ok && data.success;
    } catch {
      return false;
    }
  };

  const handleSaveSignatureToggle = async (save: boolean) => {
    setSaveSignatureForFuture(save);
    if (save && sellerSignature && userData?.id) {
      await saveSignatureToDatabase(sellerSignature);
    }
    if (!save && userData?.id) {
      await deleteSavedSignature();
    }
  };

  const handleSignatureChange = async (signature: string) => {
    setSellerSignature(signature);
    if (!signature && saveSignatureForFuture && userData?.id) {
      await deleteSavedSignature();
    }
    if (signature && saveSignatureForFuture && userData?.id) {
      await saveSignatureToDatabase(signature);
    }
  };

  const loadUserDrafts = async () => {
    try {
      if (!userData?.id) return;
      setIsLoadingDrafts(true);
      const res = await fetch(
        `/api/receipt/receipt-drafts?userId=${userData.id}`,
      );
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const result: DraftsResponse = await res.json();
      if (result.success && result.drafts && result.drafts.length > 0) {
        setUserDrafts(result.drafts);
      }
    } catch (error) {
      console.error("Failed to load drafts:", error);
    } finally {
      setIsLoadingDrafts(false);
      setIsInitialLoad(false);
    }
  };

  const loadDraftIntoForm = (draft: ReceiptDraft) => {
    try {
      let receiptItems: any[] = [];
      if (typeof draft.receipt_items === "string") {
        try {
          receiptItems = JSON.parse(draft.receipt_items);
        } catch {
          receiptItems = [];
        }
      } else if (Array.isArray(draft.receipt_items)) {
        receiptItems = draft.receipt_items;
      }

      if (receiptItems && receiptItems.length > 0) {
        setItems(
          receiptItems.map((item: any) => ({
            id:
              item.id ||
              `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            description: item.description || "",
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || item.amount || 0,
            amount:
              item.amount || (item.quantity || 1) * (item.unitPrice || 0),
          })),
        );
      }

      setSeller({
        name: draft.initiator_name || draft.business_name || "",
        email: draft.initiator_email || "",
        phone: "",
      });
      setReceiver({
        name: draft.client_name || "",
        email: draft.client_email || "",
        phone: draft.client_phone || "",
      });
      if (draft.seller_signature) {
        setSellerSignature(draft.seller_signature);
      }
      setCurrentDraftId(draft.id);
      setHasUnsavedChanges(false);
      toast.success("Draft loaded");
    } catch (error) {
      console.error("Error loading draft:", error);
      toast.error("Failed to load draft");
    }
  };

  const calculateTotal = () =>
    items.reduce((total, item) => total + (item.amount || 0), 0);

  const validateForm = (): { isValid: boolean; errorMessages: string[] } => {
    const errorMessages: string[] = [];

    if (!seller.name.trim()) errorMessages.push("• Seller name is required");
    if (!seller.email.trim()) {
      errorMessages.push("• Seller email is required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(seller.email)) {
      errorMessages.push("• Invalid seller email format");
    }
    if (!receiver.name.trim())
      errorMessages.push("• Receiver name is required");
    if (receiver.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(receiver.email)) {
      errorMessages.push("• Invalid receiver email format");
    }
    if (items.every((item) => !item.description && item.amount === 0)) {
      errorMessages.push("• At least one item is required");
    }

    return { isValid: errorMessages.length === 0, errorMessages };
  };

  const handleSaveDraft = async () => {
    try {
      setDraftLoading(true);
      setIsFormLocked(true);

      if (!userData?.id) {
        toast.error("You must be logged in to save a draft");
        return;
      }

      if (
        !seller.name &&
        !receiver.name &&
        items.every((item) => !item.description && item.amount === 0) &&
        !sellerSignature
      ) {
        toast.warning("Please add some content before saving");
        return;
      }

      const receiptId = generateReceiptId();
      const totalAmount = calculateTotal();
      const token = generateToken();

      const payload: any = {
        token,
        receipt_id: receiptId,
        user_id: userData.id,
        initiator_email: userData.email || "",
        initiator_name: seller.name,
        initiator_phone: seller.phone || "",
        business_name: seller.name,
        client_name: receiver.name || "",
        client_email: receiver.email || "",
        client_phone: receiver.phone || "",
        bill_to: receiver.name || "",
        from_name: seller.name,
        issue_date: new Date().toISOString().split("T")[0],
        customer_note: sellerSignature ? "Includes signature" : "",
        payment_for: receiptType,
        payment_method: paymentMethod,
        subtotal: totalAmount,
        tax_amount: 0,
        discount_amount: 0,
        total: totalAmount,
        signing_link: "",
        verification_code: "",
        redirect_url: "",
        status: "draft",
        receipt_items: items,
        seller_signature: sellerSignature || null,
        send_email_automatically: sendEmailAutomatically,
      };

      let method = "POST";
      let endpoint = "/api/receipt/receipt-drafts";
      if (currentDraftId) {
        method = "PUT";
        payload.id = currentDraftId;
      }

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok)
        throw new Error(
          result.error || result.message || "Failed to save draft",
        );

      toast.success(currentDraftId ? "Draft updated" : "Draft saved");
      setHasUnsavedChanges(false);
      await loadUserDrafts();
    } catch (err: any) {
      toast.error(err.message || "Failed to save draft");
    } finally {
      setDraftLoading(false);
      setIsFormLocked(false);
    }
  };

  const resetAllLoadingStates = useCallback(() => {
    setIsProcessing(false);
    setIsSubmitting(false);
  }, []);

  const baseUrl =
    process.env.NODE_ENV === "development"
      ? process.env.NEXT_PUBLIC_DEV_URL
      : process.env.NEXT_PUBLIC_BASE_URL;

  const handleSaveReceipt = async (
    isDraft: boolean = false,
  ): Promise<SaveReceiptResponse> => {
    try {
      setLoading(true);

      if (!userData?.id) {
        toast.error("You must be logged in to create a receipt.");
        return { success: false, error: "User not logged in" };
      }

      const receiptId = generateReceiptId();
      const totalAmount = calculateTotal();
      const token = generateToken();

      const payload = {
        token,
        receipt_id: receiptId,
        user_id: userData.id,
        initiator_email: seller.email,
        initiator_name: seller.name,
        initiator_phone: seller.phone || "",
        business_name: seller.name,
        client_name: receiver.name || "",
        client_email: receiver.email || "",
        client_phone: receiver.phone || "",
        bill_to: receiver.name || "",
        from: seller.name,
        issue_date: new Date().toISOString().split("T")[0],
        customer_note: sellerSignature ? "Includes signature" : "",
        payment_for: receiptType,
        payment_method: paymentMethod,
        subtotal: totalAmount,
        tax_amount: 0,
        discount_amount: 0,
        total: totalAmount,
        signing_link: isDraft ? "" : `${baseUrl}/sign-receipt/${token}`,
        verification_code: isDraft
          ? ""
          : Math.random().toString(36).substr(2, 6).toUpperCase(),
        redirect_url: "",
        status: isDraft ? "draft" : "pending",
        receipt_items: items,
        seller_signature: sellerSignature || null,
        send_email_automatically: sendEmailAutomatically,
      };

      const res = await fetch("/api/receipt/send-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result: SaveReceiptResponse = await res.json();

      if (!res.ok) {
        throw new Error(
          result.error ||
            result.message ||
            `Failed to save receipt: ${res.status}`,
        );
      }

      if (!isDraft) {
        const receiptData = {
          ...payload,
          id: result.receiptId || receiptId,
          created_at: new Date().toISOString(),
          signed_at: null,
          client_signature: null,
          metadata: result.metadata || {},
          ...result.data,
        };
        setSavedReceiptData(receiptData);
        setGeneratedSigningLink(
          result.signingLink || `${baseUrl}/sign-receipt/${token}`,
        );
        setSavedReceiptId(receiptId);
        setShowSuccessModal(true);
      }

      return {
        success: true,
        signingLink: result.signingLink || `${baseUrl}/sign-receipt/${token}`,
        receiptId: result.receiptId || receiptId,
        data: result,
      };
    } catch (err: any) {
      console.error("Error saving receipt:", err);
      toast.error(err.message || "An unexpected error occurred.");
      return {
        success: false,
        error: err.message || "An unexpected error occurred.",
      };
    } finally {
      setLoading(false);
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#F5B800", "#191919", "#00B64F", "#ffffff"],
    });
  };

  const processReceiptAndSubmit = async () => {
    try {
      setIsProcessing(true);
      setIsSubmitting(true);

      const result = await handleSaveReceipt(false);

      if (result.success) {
        posthog.capture("receipt_created", {
          receipt_type: receiptType,
          payment_method: paymentMethod,
          item_count: items.length,
          total_amount: calculateTotal(),
          sends_email_automatically: sendEmailAutomatically,
        });

        setGeneratedSigningLink(result.signingLink || "");
        setSavedReceiptId(result.receiptId || "");

        const receiptDataForPDF = {
          receipt_id: result.receiptId || generateReceiptId(),
          business_name: seller.name,
          business_logo: "",
          client_name: receiver.name,
          client_email: receiver.email,
          client_phone: receiver.phone,
          initiator_email: seller.email,
          initiator_name: seller.name,
          initiator_phone: seller.phone,
          issue_date: new Date().toISOString().split("T")[0],
          payment_for: receiptType,
          payment_method: paymentMethod,
          subtotal: calculateTotal(),
          total: calculateTotal(),
          status: "pending" as const,
          verification_code: Math.random()
            .toString(36)
            .substr(2, 6)
            .toUpperCase(),
          customer_note: "",
          receipt_items: items.map((item) => ({
            id: item.id,
            description: item.description,
            quantity: item.quantity || 1,
            unit_price: item.unitPrice || 0,
            total: item.amount || 0,
          })),
          seller_signature: sellerSignature || null,
          client_signature: null,
          signed_at: null,
        };

        setGeneratedReceiptData(receiptDataForPDF);
        triggerConfetti();
      } else {
        resetAllLoadingStates();
      }
    } catch (error) {
      console.error("Processing error:", error);
      resetAllLoadingStates();
    }
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    if (isSubmitting || isProcessing || draftLoading) return;

    if (isDraft) {
      await handleSaveDraft();
      return;
    }

    if (!hasUnlimitedReceipts && hasReachedLimit) {
      setShowUpgradePrompt(true);
      return;
    }

    try {
      setIsSubmitting(true);
      const { isValid, errorMessages } = validateForm();

      if (!isValid) {
        Swal.fire({
          icon: "error",
          title: "Validation Error",
          html: `
            <div class="text-left">
              <p class="font-semibold mb-2">Please fix the following errors:</p>
              <ul class="list-disc pl-4 space-y-1">
                ${errorMessages.map((msg) => `<li>${msg}</li>`).join("")}
              </ul>
            </div>
          `,
          confirmButtonColor: "var(--color-accent-yellow)",
          confirmButtonText: "OK",
          width: 500,
          background: "var(--bg-primary)",
          customClass: { popup: "squircle-lg" },
        });
        return;
      }

      setShowReceiptSummary(true);
    } catch (error) {
      console.error("Submit error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSummaryConfirm = () => {
    setShowReceiptSummary(false);
    if (hasUnlimitedReceipts || hasFreeReceiptAccess()) {
      processReceiptAndSubmit();
    } else {
      setShowUpgradePrompt(true);
    }
  };

  const handleSummaryBack = () => {
    setShowReceiptSummary(false);
    resetAllLoadingStates();
  };

  const handleCopySigningLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success("Receipt link copied to clipboard");
  };

  const getReceiptSummaryData = () => {
    const totalAmount = calculateTotal();
    const receiptId = generateReceiptId();
    const receiptItems: ReceiptSummaryItem[] = items.map((item) => ({
      item: item.description || "Unnamed item",
      quantity: item.quantity || 1,
      price: item.unitPrice || 0,
    }));

    return {
      name: receiver.name || "Not specified",
      email: receiver.email || "Not provided",
      receiptId,
      bill_to: receiver.name || "Not specified",
      from: seller.name || "Not specified",
      issue_date: new Date().toLocaleDateString(),
      customer_note: "",
      payment_for: receiptType,
      receipt_items: receiptItems,
    };
  };

  const getGenerateButtonText = () => {
    if (isProcessing || isSubmitting) {
      return (
        <>
          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          Generating...
        </>
      );
    }
    return (
      <>
        <FileText className="h-5 w-5 mr-2" />
        Generate Receipt
      </>
    );
  };

  const customFocusStyle =
    "focus:ring-2 focus:ring-(--color-accent-yellow) focus:ring-offset-2 focus:ring-(--color-accent-yellow) transition-all duration-200 outline-none";

  return (
    <>
      {/* Upgrade modal — only fires on click at limit, not on page load */}
      {showUpgradePrompt && !hasUnlimitedReceipts && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-(--bg-primary) rounded-xl max-w-md w-full p-6 shadow-pop border border-(--border-color) squircle-lg">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-center mb-2 text-(--text-primary)">
              Receipt Limit Reached
            </h3>
            <p className="text-(--text-secondary) text-center mb-6">
              You've used all {receiptLimit} free receipts. Upgrade to SME or
              Enterprise for unlimited receipts.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-(--border-color) text-(--text-primary) hover:bg-[var(--bg-secondary)] squircle-md"
                onClick={() => setShowUpgradePrompt(false)}
              >
                Cancel
              </Button>
              <Link href="/pricing?upgrade=sme" className="flex-1">
                <Button className="w-full bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90 squircle-md">
                  View Plans
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      <ReceiptSummary
        receiptData={getReceiptSummaryData()}
        totalAmount={calculateTotal()}
        initiatorName={seller.name}
        initiatorEmail={seller.email}
        amount={0}
        confirmReceipt={showReceiptSummary}
        onBack={handleSummaryBack}
        onConfirm={handleSummaryConfirm}
        receiptType={receiptType}
        sellerPhone={seller.phone}
        receiverPhone={receiver.phone}
      />

      <GenerateReceiptModal
        open={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          window.location.reload();
        }}
        receiptId={savedReceiptId}
        onCopyLink={handleCopySigningLink}
        signingLink={generatedSigningLink}
        receiptData={savedReceiptData}
      />

      <div className="min-h-screen">
        <div className="">
          {/* No banner here — page-level banner is the single source */}

          <Tabs
            defaultValue="create"
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as "create" | "preview")
            }
            className="w-full mb-6"
          >
            <TabsList className="grid w-full grid-cols-2 bg-[var(--bg-secondary)] p-1 rounded-xl">
              <TabsTrigger
                value="create"
                className="flex items-center gap-2 data-[state=active]:bg-(--bg-primary) data-[state=active]:text-[var(--color-accent-yellow)] text-(--text-secondary) squircle-md"
              >
                <FileText className="w-4 h-4" />
                Create Receipt
              </TabsTrigger>
              <TabsTrigger
                value="preview"
                className="flex items-center gap-2 data-[state=active]:bg-(--bg-primary) data-[state=active]:text-[var(--color-accent-yellow)] text-(--text-secondary) squircle-md"
              >
                <Eye className="w-4 h-4" />
                Preview Receipt
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="mt-6">
              <div className="flex items-start justify-between mb-6">
                {generatedReceiptData && (
                  <div className="ml-auto">
                    <ReceiptPDFGenerator
                      receipt={generatedReceiptData}
                      buttonText="Download PDF Receipt"
                      buttonVariant="default"
                      buttonSize="sm"
                    />
                  </div>
                )}
              </div>

              <div className="md:max-w-3xl mx-auto bg-(--bg-primary) p-6 rounded-lg shadow-soft border border-(--border-color) squircle-lg">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit(false);
                  }}
                  className="space-y-8"
                >
                  <div className="animate-fade-in">
                    <ReceiptTypeSelector
                      value={receiptType}
                      onChange={setReceiptType}
                      disabled={isFormLocked || isProcessing}
                    />
                  </div>

                  {/* Seller */}
                  <div
                    className="space-y-4 animate-fade-in"
                    style={{ animationDelay: "0.1s" }}
                  >
                    <h2 className="text-lg font-semibold text-(--text-primary) flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full text-xs flex items-center justify-center font-bold bg-[var(--color-accent-yellow)] text-[var(--color-ink)]">
                        1
                      </span>
                      Seller Information
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <Label
                          htmlFor="seller-name"
                          className="flex items-center gap-1 text-(--text-secondary)"
                        >
                          Business / Individual Name{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="seller-name"
                          ref={sellerNameRef}
                          placeholder="Enter name"
                          value={seller.name}
                          onChange={(e) =>
                            setSeller({ ...seller, name: e.target.value })
                          }
                          className={`mt-1.5 bg-(--bg-primary) text-(--text-primary) border-(--border-color) focus:ring-(--color-accent-yellow) focus:ring-(--color-accent-yellow) ${customFocusStyle}`}
                          disabled={isFormLocked || isProcessing}
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="seller-phone"
                          className="text-(--text-secondary)"
                        >
                          Phone (Optional)
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-(--text-secondary) h-4 w-4" />
                          <Input
                            id="seller-phone"
                            placeholder="+234 800 000 0000"
                            value={seller.phone}
                            onChange={(e) =>
                              setSeller({ ...seller, phone: e.target.value })
                            }
                            className={`mt-1.5 bg-(--bg-primary) text-(--text-primary) border-(--border-color) focus:ring-(--color-accent-yellow) focus:ring-(--color-accent-yellow) pl-10 ${customFocusStyle}`}
                            disabled={isFormLocked || isProcessing}
                          />
                        </div>
                      </div>
                      <div>
                        <Label
                          htmlFor="seller-email"
                          className="flex items-center gap-1 text-(--text-secondary)"
                        >
                          Email <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-(--text-secondary) h-4 w-4" />
                          <Input
                            id="seller-email"
                            type="email"
                            placeholder="email@example.com"
                            value={seller.email}
                            onChange={(e) =>
                              setSeller({ ...seller, email: e.target.value })
                            }
                            className={`mt-1.5 bg-(--bg-primary) text-(--text-primary) border-(--border-color) focus:ring-(--color-accent-yellow) focus:ring-(--color-accent-yellow) pl-10 ${customFocusStyle}`}
                            disabled={isFormLocked || isProcessing}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Receiver */}
                  <div
                    className="space-y-4 animate-fade-in"
                    style={{ animationDelay: "0.15s" }}
                  >
                    <h2 className="text-lg font-semibold text-(--text-primary) flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full text-xs flex items-center justify-center font-bold bg-[var(--color-accent-yellow)] text-[var(--color-ink)]">
                        2
                      </span>
                      Receiver Information
                    </h2>
                    <div className="grid gap-4">
                      <div>
                        <Label
                          htmlFor="receiver-name"
                          className="flex items-center gap-1 text-(--text-secondary)"
                        >
                          Name (Individual or Business){" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="receiver-name"
                          placeholder="Enter receiver's full name"
                          value={receiver.name}
                          onChange={(e) =>
                            setReceiver({ ...receiver, name: e.target.value })
                          }
                          className={`mt-1.5 bg-(--bg-primary) text-(--text-primary) border-(--border-color) focus:ring-(--color-accent-yellow) focus:ring-(--color-accent-yellow) ${customFocusStyle}`}
                          disabled={isFormLocked || isProcessing}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label
                            htmlFor="receiver-email"
                            className="text-(--text-secondary)"
                          >
                            Email (Optional)
                          </Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-(--text-secondary) h-4 w-4" />
                            <Input
                              id="receiver-email"
                              type="email"
                              placeholder="receiver@example.com"
                              value={receiver.email}
                              onChange={(e) =>
                                setReceiver({
                                  ...receiver,
                                  email: e.target.value,
                                })
                              }
                              className={`mt-1.5 bg-(--bg-primary) text-(--text-primary) border-(--border-color) focus:ring-(--color-accent-yellow) focus:ring-(--color-accent-yellow) pl-10 ${customFocusStyle}`}
                              disabled={isFormLocked || isProcessing}
                            />
                          </div>
                        </div>
                        <div>
                          <Label
                            htmlFor="receiver-phone"
                            className="text-(--text-secondary)"
                          >
                            Phone (Optional)
                          </Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-(--text-secondary) h-4 w-4" />
                            <Input
                              id="receiver-phone"
                              placeholder="+234 800 000 0000"
                              value={receiver.phone}
                              onChange={(e) =>
                                setReceiver({
                                  ...receiver,
                                  phone: e.target.value,
                                })
                              }
                              className={`mt-1.5 bg-(--bg-primary) text-(--text-primary) border-(--border-color) focus:ring-(--color-accent-yellow) focus:ring-(--color-accent-yellow) pl-10 ${customFocusStyle}`}
                              disabled={isFormLocked || isProcessing}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Transaction */}
                  <div
                    className="space-y-4 animate-fade-in"
                    style={{ animationDelay: "0.2s" }}
                  >
                    <h2 className="text-lg font-semibold text-(--text-primary) flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full text-xs flex items-center justify-center font-bold bg-[var(--color-accent-yellow)] text-[var(--color-ink)]">
                        3
                      </span>
                      Transaction Details
                    </h2>
                    <ReceiptItemsForm
                      items={items}
                      onChange={setItems}
                      disabled={isFormLocked || isProcessing}
                    />

                    <div className="p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg text-(--text-secondary) font-semibold">
                          Total
                        </span>
                        <span className="text-2xl font-bold text-[var(--color-accent-yellow)]">
                          ₦
                          {calculateTotal().toLocaleString("en-NG", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <Label
                        htmlFor="payment-method"
                        className="text-(--text-secondary)"
                      >
                        Payment Method
                      </Label>
                      <Select
                        value={paymentMethod}
                        onValueChange={(v) =>
                          setPaymentMethod(v as typeof paymentMethod)
                        }
                        disabled={isFormLocked || isProcessing}
                      >
                        <SelectTrigger
                          className={`mt-1.5 bg-(--bg-primary) text-(--text-primary) border-(--border-color) focus:ring-(--color-accent-yellow) focus:ring-(--color-accent-yellow) ${customFocusStyle}`}
                        >
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent className="bg-(--bg-primary) border border-(--border-color)">
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="transfer">
                            Bank Transfer
                          </SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Signature */}
                  <div
                    className="space-y-4 animate-fade-in"
                    style={{ animationDelay: "0.25s" }}
                  >
                    <h2 className="text-lg font-semibold text-(--text-primary) flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full text-xs flex items-center justify-center font-bold bg-[var(--color-accent-yellow)] text-[var(--color-ink)]">
                        4
                      </span>
                      Your Signature
                    </h2>
                    <SignaturePad
                      value={sellerSignature}
                      onChange={handleSignatureChange}
                      label="Your Signature"
                      disabled={isFormLocked || isProcessing}
                      onLoadSaved={loadSignatureManually}
                    />

                    <div className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-lg border border-(--border-color) squircle-md">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <Save className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-(--text-primary)">
                            Save this signature for future use
                          </p>
                          <p className="text-xs text-(--text-secondary)">
                            Your signature will be securely stored
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={saveSignatureForFuture}
                        onCheckedChange={handleSaveSignatureToggle}
                        disabled={!sellerSignature || isProcessing}
                        className="data-[state=checked]:bg-[var(--color-accent-yellow)]"
                      />
                    </div>
                  </div>

                  {/* Email automation */}
                  <div
                    className="space-y-4 animate-fade-in border-t border-(--border-color) pt-6"
                    style={{ animationDelay: "0.3s" }}
                  >
                    <div className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-lg border border-(--border-color) squircle-md">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-[var(--color-lemon-green)]/20 flex items-center justify-center">
                          {sendEmailAutomatically ? (
                            <Mail className="h-4 w-4 text-[var(--color-lemon-green)]" />
                          ) : (
                            <Mail className="h-4 w-4 text-(--text-secondary)" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-(--text-primary)">
                            Send receipt automatically to client
                          </p>
                          <p className="text-xs text-(--text-secondary)">
                            {sendEmailAutomatically
                              ? "An email will be sent to the client with the receipt link"
                              : "You'll need to share the receipt link manually with the client"}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={sendEmailAutomatically}
                        onCheckedChange={setSendEmailAutomatically}
                        disabled={isProcessing}
                        className="data-[state=checked]:bg-[var(--color-accent-yellow)]"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSubmit(true)}
                      disabled={
                        isProcessing ||
                        draftLoading ||
                        isFormLocked ||
                        isSubmitting
                      }
                      className="flex-1 border-(--border-color) text-(--text-primary) hover:bg-[var(--bg-secondary)] focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 squircle-md"
                    >
                      {draftLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          {currentDraftId ? "Update Draft" : "Save Draft"}
                        </>
                      )}
                    </Button>
                    <Button
                      type="submit"
                      variant="default"
                      size="lg"
                      className="flex-1 bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90 focus:ring-2 focus:ring-offset-2 focus:ring-(--color-accent-yellow) squircle-md"
                      disabled={
                        isProcessing ||
                        isSubmitting ||
                        isFormLocked ||
                        draftLoading ||
                        (hasReachedLimit && !hasUnlimitedReceipts)
                      }
                    >
                      {getGenerateButtonText()}
                    </Button>
                  </div>
                </form>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="mt-6">
              <div className="space-y-6">
                <ReceiptPreview
                  receiptType={receiptType}
                  seller={seller}
                  receiver={receiver}
                  items={items}
                  paymentMethod={paymentMethod}
                  sellerSignature={sellerSignature}
                  onLoadSavedSignature={loadSignatureManually}
                  isProcessingPayment={isProcessing}
                />

                <div className="flex justify-between items-center pt-4 border-t border-(--border-color)">
                  <p className="text-sm text-(--text-secondary)">
                    Switch to the "Create Receipt" tab to edit your receipt
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("create")}
                    className="border-[var(--color-accent-yellow)] text-[var(--color-accent-yellow)] hover:bg-[var(--color-accent-yellow)]/10 squircle-md"
                  >
                    <EyeOff className="h-4 w-4 mr-2" />
                    Back to Editor
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}

export default function CreateReceipt({
  userTier,
  hasReachedLimit = false,
}: CreateReceiptProps) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent-yellow)]"></div>
        </div>
      }
    >
      <CreateReceiptPage
        userTier={userTier}
        hasReachedLimit={hasReachedLimit}
      />
    </Suspense>
  );
}