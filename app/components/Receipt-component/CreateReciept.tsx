"use client";

import React, {
  useEffect,
  useState,
  Suspense,
  useCallback,
  useRef,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  History,
  Save,
  Loader2,
  Eye,
  Mail,
  Phone,
  Trash2,
  EyeOff,
  Check,
  Download,
  AlertCircle,
  Wallet,
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
import PinPopOver from "../PinPopOver";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import Swal from "sweetalert2";
import { Badge } from "../ui/badge";
import { GenerateReceiptModal } from "./GenerateReceiptModal";
import { ReceiptPreview } from "../previews/RecieptPreview";
import Link from "next/link";

// Import separated components
import { ReceiptSummary } from "./ReceiptSummary";
import { SignaturePad } from "../SignaturePad";
import { ReceiptItemsForm } from "./ReceiptItemsForm";
import { ReceiptTypeSelector } from "./ReceiptTypeSelector";

// Import types
import type {
  ReceiptType,
  SellerInfo,
  ReceiverInfo,
  ReceiptItem,
  ReceiptDraft,
  DraftsResponse,
  SaveReceiptResponse,
  PaymentResponse,
  ReceiptSummaryItem,
} from "./receiptTypes";

interface ReceiptUsageInfo {
  used: number;
  limit: number;
  remaining: number;
  hasAccess: boolean;
  isChecking: boolean;
  isPayPerUse?: boolean;
}

interface CreateReceiptProps {
  userTier?: 'free' | 'growth' | 'premium' | 'elite';
  hasReachedLimit?: boolean;
}

const RECEIPT_FEE = 100; // ₦100 per receipt after limit

function CreateReceiptPage({ userTier = 'free', hasReachedLimit = false }: CreateReceiptProps) {
  const inputCount = 4;
  const [pin, setPin] = useState(Array(inputCount).fill(""));
  const [isPinOpen, setIsPinOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
  const [isFormLocked, setIsFormLocked] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showReceiptSummary, setShowReceiptSummary] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [activeTab, setActiveTab] = useState<"create" | "preview">("create");
  const [saveSignatureForFuture, setSaveSignatureForFuture] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentDeducted, setPaymentDeducted] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { userData, balance } = useUserContextData();

  const sellerNameRef = useRef<HTMLInputElement>(null);
  const sellerPhoneRef = useRef<HTMLInputElement>(null);
  const sellerEmailRef = useRef<HTMLInputElement>(null);
  const receiverNameRef = useRef<HTMLInputElement>(null);
  const receiverEmailRef = useRef<HTMLInputElement>(null);
  const receiverPhoneRef = useRef<HTMLInputElement>(null);

  // Receipt usage tracking
  const [receiptUsage, setReceiptUsage] = useState<ReceiptUsageInfo>({
    used: 0,
    limit: userTier === 'free' ? 5 : Infinity,
    remaining: userTier === 'free' ? 5 : Infinity,
    hasAccess: true,
    isChecking: true,
    isPayPerUse: false,
  });

  // Safe balance value
  const safeBalance = balance || 0;

  // Determine user tier
  const isPremium = userTier === 'premium' || userTier === 'elite';
  const isGrowth = userTier === 'growth';
  const hasUnlimitedReceipts = isPremium || isGrowth;

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

  // Drafts state
  const [userDrafts, setUserDrafts] = useState<ReceiptDraft[]>([]);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);

  // Modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedSigningLink, setGeneratedSigningLink] = useState<string>("");
  const [savedReceiptId, setSavedReceiptId] = useState<string>("");

  // Fetch receipt usage
  useEffect(() => {
    const fetchUsage = async () => {
      if (!userData?.id) return;

      try {
        const res = await fetch("/api/user/usage");
        if (res.ok) {
          const data = await res.json();
          
          setReceiptUsage({
            used: data.receipts.used || 0,
            limit: data.receipts.limit || (userTier === 'free' ? 5 : Infinity),
            remaining: data.receipts.remaining || (userTier === 'free' ? 5 : Infinity),
            hasAccess: true,
            isChecking: false,
            isPayPerUse: data.receipts.remaining <= 0 && !hasUnlimitedReceipts,
          });
        }
      } catch (error) {
        console.error("Error fetching usage:", error);
        setReceiptUsage((prev) => ({ ...prev, isChecking: false }));
      }
    };

    fetchUsage();
  }, [userData?.id, userTier, hasUnlimitedReceipts]);

  // Check if user has free receipt access
  const hasFreeReceiptAccess = (): boolean => {
    if (hasUnlimitedReceipts) return true;
    return receiptUsage.remaining > 0;
  };

  // Determine if PIN confirmation is needed
  const requiresPinConfirmation = (): boolean => {
    if (isPremium) return false; // Premium users never need PIN
    if (hasUnlimitedReceipts) return false; // Growth users with unlimited
    if (receiptUsage.remaining > 0) return false; // Free receipt available
    return true; // Pay-per-use
  };

  // Check if user has sufficient balance
  const hasSufficientBalance = (): boolean => {
    return safeBalance >= RECEIPT_FEE;
  };

  // Generate receipt ID
  const generateReceiptId = useCallback(() => {
    const datePart = new Date().getFullYear();
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    return `REC-${datePart}-${randomPart}`;
  }, []);

  const generateReceiptNumber = useCallback(() => {
    return `REC-${Date.now().toString().slice(-6)}`;
  }, []);

  // Generate unique token
  const generateToken = useCallback(() => {
    return `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Initialize form with user data
  useEffect(() => {
    if (userData) {
      const sellerInfo = {
        name:
          userData.fullName
            ? `${userData.fullName}`
            : userData.email || "",
        email: userData.email || "",
        phone: userData.phone || "",
      };

      setSeller(sellerInfo);

      // Focus on seller name field on initial load
      setTimeout(() => {
        if (sellerNameRef.current) {
          sellerNameRef.current.focus();
        }
      }, 500);

      // Only set unsaved changes if not initial load
      if (
        !isInitialLoad &&
        (sellerInfo.name || sellerInfo.email || sellerInfo.phone)
      ) {
        setHasUnsavedChanges(true);
      }
    }
  }, [userData, isInitialLoad]);

  // Load drafts on component mount
  useEffect(() => {
    if (userData?.id) {
      loadUserDrafts();
    }
  }, [userData?.id]);

  // Detect unsaved changes
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

      if (hasContent) {
        setHasUnsavedChanges(true);
      }
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

  // Before unload warning
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

  // SIGNATURE SAVE/LOAD FUNCTIONS
  const loadSignatureManually = async () => {
    try {
      if (!userData?.id) {
        Swal.fire({
          icon: "warning",
          title: "Not Logged In",
          text: "You need to be logged in to load saved signatures.",
        });
        return;
      }

      const res = await fetch(`/api/saved-signature?userId=${userData.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (data.signature) {
          setSellerSignature(data.signature);
          setSaveSignatureForFuture(true);

          Swal.fire({
            icon: "success",
            title: "Signature Loaded",
            text: "Your saved signature has been loaded.",
            confirmButtonColor: "#C29307",
            timer: 2000,
            showConfirmButton: false,
          });
        } else {
          Swal.fire({
            icon: "info",
            title: "No Saved Signature",
            text: "No saved signature found. Please create a new one.",
            confirmButtonColor: "#C29307",
            timer: 2000,
            showConfirmButton: false,
          });
        }
      } else {
        Swal.fire({
          icon: "error",
          title: "Load Failed",
          text: "Failed to load saved signature. Please try again.",
          confirmButtonColor: "#C29307",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Load Failed",
        text: "Failed to load saved signature. Please try again.",
        confirmButtonColor: "#C29307",
      });
    }
  };

  const saveSignatureToDatabase = async (signatureDataUrl: string) => {
    try {
      if (!userData?.id) {
        return false;
      }

      const res = await fetch("/api/receipt/saved-signature", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userData.id,
          signature: signatureDataUrl,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  };

  const handleSaveSignatureToggle = async (save: boolean) => {
    setSaveSignatureForFuture(save);

    if (save && sellerSignature && userData?.id) {
      try {
        const saved = await saveSignatureToDatabase(sellerSignature);
        if (saved) {
          Swal.fire({
            icon: "success",
            title: "Signature Saved",
            text: "Your signature has been saved for future use.",
            confirmButtonColor: "#C29307",
            timer: 2000,
            showConfirmButton: false,
          });
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Save Failed",
          text: "Failed to save signature. Please try again.",
          confirmButtonColor: "#C29307",
        });
      }
    }

    if (!save && userData?.id) {
      try {
        await deleteSavedSignature();
      } catch (error) {}
    }
  };

  const handleSignatureChange = async (signature: string) => {
    setSellerSignature(signature);

    if (!signature && saveSignatureForFuture && userData?.id) {
      try {
        await deleteSavedSignature();
      } catch (error) {}
    }

    if (signature && saveSignatureForFuture && userData?.id) {
      try {
        await saveSignatureToDatabase(signature);
      } catch (error) {}
    }
  };

  const deleteSavedSignature = async () => {
    try {
      if (!userData?.id) return false;

      const res = await fetch("/api/receipt/saved-signature", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: userData.id }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  };

  const loadUserDrafts = async () => {
    try {
      if (!userData?.id) {
        console.log("No user data found");
        return;
      }

      setIsLoadingDrafts(true);
      const res = await fetch(
        `/api/receipt/receipt-drafts?userId=${userData.id}`
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const result: DraftsResponse = await res.json();

      if (result.success && result.drafts && result.drafts.length > 0) {
        setUserDrafts(result.drafts);

        // Show draft prompt if form is empty
        if (
          !seller.name &&
          !receiver.name &&
          items.every((item) => !item.description && item.amount === 0) &&
          !sellerSignature
        ) {
          setTimeout(() => {
            Swal.fire({
              title: "Drafts Found!",
              html: `You have <strong>${
                result.drafts.length
              }</strong> saved draft${
                result.drafts.length !== 1 ? "s" : ""
              }.<br><br>Would you like to load the most recent one?`,
              icon: "info",
              showCancelButton: true,
              showDenyButton: true,
              confirmButtonText: "Load Recent",
              denyButtonText: "View All Drafts",
              cancelButtonText: "Start Fresh",
              confirmButtonColor: "#C29307",
              cancelButtonColor: "#6b7280",
              denyButtonColor: "#3b82f6",
              width: 500,
            }).then((swalResult) => {
              if (swalResult.isConfirmed) {
                const recentDraft = result.drafts[0];
                loadDraftIntoForm(recentDraft);
              } else if (swalResult.isDenied) {
                showDraftsList(result.drafts);
              }
            });
          }, 1000);
        }
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
      // Parse receipt_items if it's a string
      let receiptItems: any[] = [];
      if (typeof draft.receipt_items === "string") {
        try {
          receiptItems = JSON.parse(draft.receipt_items);
        } catch (e) {
          console.error("Failed to parse receipt_items:", e);
          receiptItems = [];
        }
      } else if (Array.isArray(draft.receipt_items)) {
        receiptItems = draft.receipt_items;
      }

      // Load items from draft.receipt_items
      if (receiptItems && receiptItems.length > 0) {
        const items = receiptItems.map((item: any) => ({
          id:
            item.id ||
            `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          description: item.description || "",
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || item.amount || 0,
          amount: item.amount || (item.quantity || 1) * (item.unitPrice || 0),
        }));
        setItems(items);
      }

      // Set seller info - using correct field names from sample data
      setSeller({
        name: draft.initiator_name || draft.business_name || "",
        email: draft.initiator_email || "",
        phone: "",
      });

      // Set receiver info
      setReceiver({
        name: draft.client_name || "",
        email: draft.client_email || "",
        phone: draft.client_phone || "",
      });

      // LOAD SIGNATURE from draft data
      if (draft.seller_signature) {
        setSellerSignature(draft.seller_signature);
        setSaveSignatureForFuture(true);
      } else {
        setSellerSignature(""); // Clear signature if none exists
      }

      // Try to extract receipt type from payment_for field
      if (draft.payment_for) {
        const typeMatch = draft.payment_for.toLowerCase();
        if (typeMatch.includes("product")) setReceiptType("product");
        else if (typeMatch.includes("service")) setReceiptType("service");
        else if (typeMatch.includes("booking")) setReceiptType("bookings");
        else if (typeMatch.includes("rental")) setReceiptType("rental");
        else if (typeMatch.includes("fund") || typeMatch.includes("transfer"))
          setReceiptType("funds_transfer");
        else setReceiptType("general");
      }

      // Set payment method if available
      if (draft.payment_method) {
        setPaymentMethod(draft.payment_method as any);
      }

      // Set current draft ID for updating
      setCurrentDraftId(draft.id);

      setHasUnsavedChanges(false);

      Swal.fire({
        icon: "success",
        title: "Draft Loaded!",
        text: "Your receipt draft has been loaded successfully.",
        confirmButtonColor: "#C29307",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Error loading draft:", error);
      Swal.fire({
        icon: "error",
        title: "Error Loading Draft",
        text: "Failed to load draft data. Please try again.",
        confirmButtonColor: "#C29307",
      });
    }
  };

  const showDraftsList = (draftsList: ReceiptDraft[]) => {
    const draftListHTML = draftsList
      .map(
        (draft, index) => `
          <div style="padding: 12px; border-bottom: 1px solid #e5e7eb; cursor: pointer; transition: background-color 0.2s;" 
               data-draft-index="${index}"
               class="hover:bg-gray-50 rounded flex justify-between items-start">
            <div>
              <strong class="text-gray-900">${
                draft.business_name || "Untitled Receipt"
              }</strong><br>
              <small class="text-gray-600">To: ${
                draft.client_name || "No recipient"
              }</small><br>
              <small class="text-gray-500">Email: ${
                draft.client_email || "Not provided"
              }</small><br>
              <small class="text-gray-500">Phone: ${
                draft.client_phone || "Not provided"
              }</small><br>
              <small class="text-gray-500">Amount: ₦${draft.total.toLocaleString()}</small><br>
              <small class="text-gray-500">Created: ${new Date(
                draft.created_at
              ).toLocaleDateString()}</small>
            </div>
            <button 
              class="text-red-500 hover:text-red-700 ml-4 p-1" 
              data-delete-index="${index}"
              onclick="event.stopPropagation();"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </div>
        `
      )
      .join("");

    Swal.fire({
      title: "Select a Draft to Load",
      html: `
        <div style="text-align: left; max-height: 300px; overflow-y auto; padding-right: 4px;">
          ${draftListHTML}
        </div>
      `,
      showConfirmButton: true,
      confirmButtonText: "Close",
      confirmButtonColor: "#C29307",
      width: 600,
      didOpen: () => {
        // Add click handlers for loading drafts
        const draftElements = document.querySelectorAll("[data-draft-index]");
        draftElements.forEach((element) => {
          element.addEventListener("click", (e) => {
            if (!(e.target as HTMLElement).closest("[data-delete-index]")) {
              const index = parseInt(
                element.getAttribute("data-draft-index") || "0"
              );
              loadDraftIntoForm(draftsList[index]);
              Swal.close();
            }
          });
        });

        // Add delete handlers
        const deleteButtons = document.querySelectorAll("[data-delete-index]");
        deleteButtons.forEach((button) => {
          button.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();

            const index = parseInt(
              button.getAttribute("data-delete-index") || "0"
            );
            const draftToDelete = draftsList[index];

            const result = await Swal.fire({
              title: "Delete Draft?",
              text: `Are you sure you want to delete "${
                draftToDelete.business_name || "Untitled Receipt"
              }"?`,
              icon: "warning",
              showCancelButton: true,
              confirmButtonColor: "#C29307",
              cancelButtonColor: "#6b7280",
              confirmButtonText: "Yes, delete it!",
              cancelButtonText: "Cancel",
            });

            if (result.isConfirmed) {
              await deleteDraft(draftToDelete.id);
              Swal.close();
            }
          });
        });
      },
    });
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => total + (item.amount || 0), 0);
  };

  const validateForm = (): { isValid: boolean; errorMessages: string[] } => {
    const newErrors = {
      sellerName: "",
      sellerEmail: "",
      receiverName: "",
      receiverEmail: "",
      items: "",
    };

    let hasErrors = false;
    const errorMessages: string[] = [];

    if (!seller.name.trim()) {
      newErrors.sellerName = "Seller name is required.";
      hasErrors = true;
      errorMessages.push("• Seller name is required");
    }

    if (!seller.email.trim()) {
      newErrors.sellerEmail = "Seller email is required.";
      hasErrors = true;
      errorMessages.push("• Seller email is required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(seller.email)) {
      newErrors.sellerEmail = "Invalid seller email format.";
      hasErrors = true;
      errorMessages.push("• Invalid seller email format");
    }

    if (!receiver.name.trim()) {
      newErrors.receiverName = "Receiver name is required.";
      hasErrors = true;
      errorMessages.push("• Receiver name is required");
    }

    if (receiver.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(receiver.email)) {
      newErrors.receiverEmail = "Invalid receiver email format.";
      hasErrors = true;
      errorMessages.push("• Invalid receiver email format");
    }

    if (items.every((item) => !item.description && item.amount === 0)) {
      newErrors.items = "At least one item is required.";
      hasErrors = true;
      errorMessages.push("• At least one item is required");
    }

    return { isValid: !hasErrors, errorMessages };
  };

  const handleSaveDraft = async () => {
    try {
      setDraftLoading(true);
      setIsFormLocked(true);

      if (!userData?.id) {
        Swal.fire({
          icon: "warning",
          title: "Unauthorized",
          text: "You must be logged in to save a draft.",
        });
        setIsFormLocked(false);
        return;
      }

      if (
        !seller.name &&
        !receiver.name &&
        items.every((item) => !item.description && item.amount === 0) &&
        !sellerSignature
      ) {
        Swal.fire({
          icon: "warning",
          title: "No Content",
          text: "Please add some content before saving as draft.",
        });
        setIsFormLocked(false);
        return;
      }

      const receiptId = generateReceiptId();
      const totalAmount = calculateTotal();
      const token = generateToken();

    
      const receipt_items = items.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        amount: item.amount || 0,
      }));

    
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
        receipt_items: receipt_items,
        seller_signature: sellerSignature || null,
      };

      // Determine if we're creating new or updating existing
      let method = "POST";
      let endpoint = "/api/receipt/receipt-drafts";

      if (currentDraftId) {
        // Update existing draft
        method = "PUT";
        payload.id = currentDraftId;
      }

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(
          result.error || result.message || "Failed to save draft"
        );
      }

      Swal.fire({
        icon: "success",
        title: currentDraftId ? "Draft Updated!" : "Draft Saved!",
        text: currentDraftId
          ? "Your receipt draft has been updated successfully."
          : "Your receipt draft has been saved successfully.",
        confirmButtonColor: "#C29307",
      });

      setHasUnsavedChanges(false);
      await loadUserDrafts();
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Failed to Save Draft",
        text: err.message || "An unexpected error occurred.",
      });
    } finally {
      setDraftLoading(false);
      setIsFormLocked(false);
    }
  };

  const deleteDraft = async (draftId: string) => {
    try {
      const res = await fetch(
        `/api/receipt/receipt-drafts?id=${draftId}&userId=${userData?.id}`,
        {
          method: "DELETE",
        }
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to delete draft");
      }

      toast.success("Draft deleted successfully");

      // If we're deleting the current draft, reset the form
      if (currentDraftId === draftId) {
        setCurrentDraftId(null);
        resetForm();
      }

      await loadUserDrafts();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete draft");
    }
  };

  const baseUrl =
    process.env.NODE_ENV === "development"
      ? process.env.NEXT_PUBLIC_DEV_URL
      : process.env.NEXT_PUBLIC_BASE_URL;

  const handleSaveReceipt = async (
    isDraft: boolean = false
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
        signing_link: isDraft
          ? ""
          : `https://yourapp.com/receipt/sign/${token}`,
        verification_code: isDraft
          ? ""
          : Math.random().toString(36).substr(2, 6).toUpperCase(),
        redirect_url: "",
        status: isDraft ? "draft" : "pending",
        receipt_items: items,
        seller_signature: sellerSignature || null,
        pin: isDraft ? "" : pin.join(""),
      };

      // For final receipt (not draft), include the PIN
      const requestBody = isDraft
        ? payload
        : {
            ...payload,
            pin: pin.join(""),
          };

      const endpoint = "/api/receipt/send-receipt";
      const method = "POST";

      console.log("Sending receipt data:", requestBody);

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const result: SaveReceiptResponse = await res.json();

      if (!res.ok) {
        throw new Error(
          result.error ||
            result.message ||
            `Failed to save receipt: ${res.status}`
        );
      }

      if (!isDraft) {
        setGeneratedSigningLink(
          result.signingLink || `${baseUrl}/sign-receipt/${token}`
        );
        setSavedReceiptId(receiptId);
        setShowSuccessModal(true);
      }

      return {
        success: true,
        signingLink:
          result.signingLink || `https://yourapp.com/receipt/sign/${token}`,
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
          amount: RECEIPT_FEE,
          description: "Receipt creation",
          isReceiptCreation: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          Swal.fire({
            icon: "warning",
            title: "Limit Reached",
            text: data.message || "You've reached your monthly receipt limit.",
          });
          router.push("/pricing?upgrade=growth");
        } else if (res.status === 400 && data.error?.includes("Insufficient")) {
          Swal.fire({
            icon: "error",
            title: "Insufficient Balance",
            text: data.message || "Please fund your wallet to continue.",
          });
          router.push("/dashboard/fund-account");
        } else {
          Swal.fire({
            icon: "error",
            title: "Payment Failed",
            text: data.error || "Something went wrong",
          });
        }
        return false;
      }

      // Update receipt usage if returned
      if (data.usedThisMonth !== undefined) {
        setReceiptUsage((prev) => ({
          ...prev,
          used: data.usedThisMonth,
          remaining: data.remaining === "unlimited" ? 999 : data.remaining,
          isPayPerUse: data.pay_per_use || false,
        }));
      }

      return true;
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message,
      });
      return false;
    }
  };

  const handleRefund = async () => {
    try {
      const res = await fetch("/api/refund-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userData?.id,
          amount: RECEIPT_FEE,
          description: "Refund for failed receipt generation",
        }),
      });

      const data: PaymentResponse = await res.json();

      if (res.ok) {
        Swal.fire({
          icon: "info",
          title: "Refund Processed",
          text: `₦${RECEIPT_FEE.toLocaleString()} has been refunded to your wallet due to failed receipt sending.`,
        });
      } else {
        throw new Error(data.error || "Refund failed");
      }
    } catch (err) {
      Swal.fire({
        icon: "warning",
        title: "Refund Failed",
        text: "Payment deduction was made, but refund failed. Please contact support.",
      });
    }
  };

  // Helper function to reset all loading states
  const resetAllLoadingStates = () => {
    setIsProcessingPayment(false);
    setIsSubmitting(false);
    setPaymentDeducted(false);
    setPin(Array(inputCount).fill(""));
  };

  const processPaymentAndSubmit = async () => {
    let deducted = false;
    
    try {
      setIsProcessingPayment(true);
      setIsSubmitting(true);

      // Step 1: Handle payment if required
      if (requiresPinConfirmation()) {
        deducted = await handleDeduct();
        setPaymentDeducted(deducted);
        
        if (!deducted) {
          resetAllLoadingStates();
          setIsPinOpen(false);
          return;
        }
      } else {
        // Free receipt - mark as deducted for tracking
        deducted = true;
        setPaymentDeducted(true);
      }

      // Step 2: Save the receipt
      const result = await handleSaveReceipt(false);
      
      if (result.success) {
        setGeneratedSigningLink(result.signingLink || "");
        setSavedReceiptId(result.receiptId || "");

        triggerConfetti();

        resetAllLoadingStates();
        setIsPinOpen(false);

        setHasUnsavedChanges(false);
        setCurrentDraftId(null);

        // Reset form
        setSeller({
          name:
            userData?.fullName
              ? `${userData.fullName}`
              : userData?.email || "",
          email: userData?.email || "",
          phone: userData?.phone || "",
        });
        setReceiver({ name: "", email: "", phone: "" });
        setItems([
          {
            id: "item_1",
            description: "",
            amount: 0,
            quantity: 1,
            unitPrice: 0,
          },
        ]);
        setSellerSignature("");
        setReceiptType("general");

        setShowSuccessModal(true);
      } else {
        // Receipt save failed - refund if payment was deducted
        if (deducted) {
          await handleRefund();
        }
        resetAllLoadingStates();
        setIsPinOpen(false);
      }
    } catch (error) {
      // Unexpected error - refund if payment was deducted
      if (deducted) {
        await handleRefund();
      }
      resetAllLoadingStates();
      setIsPinOpen(false);
      
      Swal.fire({
        icon: "error",
        title: "Processing Failed",
        text: "Failed to process your request. Please try again.",
        confirmButtonColor: "#C29307",
      });
    }
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    // Check if user has reached limit
    if (!isPremium && hasReachedLimit && !isDraft) {
      setShowUpgradePrompt(true);
      return;
    }

    // Prevent multiple submissions
    if (isSubmitting || isProcessingPayment || draftLoading) {
      return;
    }

    if (isDraft) {
      await handleSaveDraft();
      return;
    }

    // Don't set loading state here - just validate and show summary
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
          confirmButtonColor: "#C29307",
          confirmButtonText: "OK",
          width: 500,
        });
        setIsSubmitting(false);
        return;
      }

      setShowReceiptSummary(true);
    } catch (error) {
      console.error("Submit error:", error);
      Swal.fire({
        icon: "error",
        title: "Submission Error",
        text: "An error occurred while processing your request.",
        confirmButtonColor: "#C29307",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSummaryConfirm = () => {
    setShowReceiptSummary(false);
    
    // Check if user has sufficient balance for pay-per-use
    if (requiresPinConfirmation() && !hasSufficientBalance()) {
      Swal.fire({
        icon: "warning",
        title: "Insufficient Balance",
        text: `You need ₦${RECEIPT_FEE} in your wallet. Would you like to fund your wallet?`,
        showCancelButton: true,
        confirmButtonText: "Fund Wallet",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#C29307",
      }).then((result) => {
        if (result.isConfirmed) {
          router.push("/dashboard/fund-account");
        }
      });
      return;
    }

    if (requiresPinConfirmation()) {
      setIsPinOpen(true);
    } else {
      processPaymentAndSubmit();
    }
  };

  const handleSummaryBack = () => {
    setShowReceiptSummary(false);
    resetAllLoadingStates();
    setIsPinOpen(false);
    setPin(Array(inputCount).fill(""));
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#C29307", "#ffd700", "#ffed4e", "#ffffff", "#fbbf24"],
    });
  };

  const handleCopySigningLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success("Receipt link copied to clipboard");
  };

  const handleDownloadPDF = async () => {
    toast.success("Your receipt has been downloaded as PDF");
  };

  const resetForm = () => {
    if (isFormLocked || isProcessingPayment) {
      Swal.fire({
        icon: "warning",
        title: "Form is Processing",
        text: "Cannot clear form while submission is in progress.",
        confirmButtonColor: "#C29307",
      });
      return;
    }

    Swal.fire({
      title: "Clear Form?",
      text: "This will remove all current form data including signature.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#C29307",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Clear",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        setSeller({
          name:
            userData?.fullName
              ? `${userData.fullName}`
              : userData?.email || "",
          email: userData?.email || "",
          phone: userData?.phone || "",
        });
        setReceiver({ name: "", email: "", phone: "" });
        setItems([
          {
            id: "item_1",
            description: "",
            amount: 0,
            quantity: 1,
            unitPrice: 0,
          },
        ]);
        setPaymentMethod("transfer");
        setSellerSignature("");
        setReceiptType("general");
        setCurrentDraftId(null);
        setHasUnsavedChanges(false);
        setSaveSignatureForFuture(false);

        toast.success("Form has been cleared successfully.");

        // Focus on seller name field after reset
        setTimeout(() => {
          if (sellerNameRef.current) {
            sellerNameRef.current.focus();
          }
        }, 100);
      }
    });
  };

  // Prepare receipt data for summary
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

  // Get button text based on state
  const getGenerateButtonText = () => {
    if (isProcessingPayment || isSubmitting) {
      return (
        <>
          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          Processing...
        </>
      );
    }
    if (!hasFreeReceiptAccess()) {
      return (
        <>
          <Wallet className="h-5 w-5 mr-2" />
          Pay ₦{RECEIPT_FEE} & Generate
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

  // Custom CSS for better focus styling
  const customFocusStyle =
    "focus:ring-2 focus:ring-[#C29307] focus:ring-offset-2 focus:border-[#C29307] transition-all duration-200";

  return (
    <>
      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-center mb-2">Limit Reached</h3>
            <p className="text-gray-600 text-center mb-6">
              You've used all your free receipts this month. 
              {userTier === 'free' 
                ? ` You can pay ₦${RECEIPT_FEE} per receipt or upgrade to Growth plan for unlimited receipts.`
                : ' Upgrade to Premium for unlimited receipts.'}
            </p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => {
                  setShowUpgradePrompt(false);
                  setShowReceiptSummary(true);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Pay ₦{RECEIPT_FEE} & Generate
              </Button>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowUpgradePrompt(false)}
                >
                  Cancel
                </Button>
                <Link 
                  href={userTier === 'free' ? "/pricing?upgrade=growth" : "/pricing?upgrade=premium"} 
                  className="flex-1"
                >
                  <Button className="w-full bg-[#C29307] hover:bg-[#b38606] text-white">
                    Upgrade
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pin Popup */}
      <PinPopOver
        setIsOpen={(newValue) => {
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
          isFree: !requiresPinConfirmation(),
          freeInvoicesLeft: receiptUsage.remaining,
          totalInvoicesCreated: receiptUsage.used,
          feeAmount: RECEIPT_FEE,
        }}
      />

      <ReceiptSummary
        receiptData={getReceiptSummaryData()}
        totalAmount={calculateTotal()}
        initiatorName={seller.name}
        initiatorEmail={seller.email}
        amount={RECEIPT_FEE}
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
        onDownload={handleDownloadPDF}
        onCopyLink={handleCopySigningLink}
        signingLink={generatedSigningLink}
      />

      <div className="min-h-screen">
        <div className="py-6 sm:py-8">
          {/* Usage Warning Banner */}
          {!hasUnlimitedReceipts && !receiptUsage.isChecking && receiptUsage.remaining <= 2 && (
            <div className={`mb-4 p-3 rounded-lg border ${
              receiptUsage.remaining <= 0
                ? "bg-blue-50 border-blue-200"
                : "bg-yellow-50 border-yellow-200"
            } max-w-3xl mx-auto`}>
              <div className="flex items-start gap-3">
                <AlertCircle
                  className={`w-5 h-5 mt-0.5 ${
                    receiptUsage.remaining <= 0
                      ? "text-blue-500"
                      : "text-yellow-500"
                  }`}
                />
                <div className="flex-1">
                  <p
                    className={`font-medium ${
                      receiptUsage.remaining <= 0
                        ? "text-blue-700"
                        : "text-yellow-700"
                    }`}
                  >
                    {receiptUsage.remaining <= 0
                      ? "Pay-per-use mode active"
                      : `Only ${receiptUsage.remaining} free receipt${receiptUsage.remaining !== 1 ? 's' : ''} remaining`}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {receiptUsage.remaining <= 0
                      ? `This receipt will cost ₦${RECEIPT_FEE}.`
                      : `After your free limit, receipts cost ₦${RECEIPT_FEE} each.`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Premium Badge */}
          {isPremium && (
            <div className="mb-4 p-3 bg-[#C29307]/10 border border-[#C29307] rounded-lg max-w-3xl mx-auto">
              <p className="text-[#C29307] font-medium flex items-center gap-2 text-sm">
                <span className="bg-[#C29307] text-white px-2 py-0.5 rounded text-xs uppercase">
                  {userTier}
                </span>
                You have unlimited receipts! No charges for receipt creation.
              </p>
            </div>
          )}

          {/* Wallet Balance */}
          <div className="mb-4 max-w-3xl mx-auto flex justify-end">
            <div className="flex items-center gap-1 bg-green-50 px-3 py-1 rounded-full border border-green-200">
              <Wallet className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">
                ₦{safeBalance.toLocaleString()}
              </span>
            </div>
          </div>

          <Tabs
            defaultValue="create"
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as "create" | "preview")
            }
            className="w-full mb-6"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Create Receipt
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Preview Receipt
              </TabsTrigger>
            </TabsList>

            {/* Create Receipt Tab */}
            <TabsContent value="create" className="mt-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start space-x-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (isFormLocked || isProcessingPayment) {
                        Swal.fire({
                          icon: "warning",
                          title: "Form is Processing",
                          text: "Cannot navigate away while submission is in progress.",
                          confirmButtonColor: "#C29307",
                        });
                        return;
                      }
                      router.back();
                    }}
                    className="text-[#C29307] hover:bg-white/10"
                    disabled={isProcessingPayment}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>

                  <div>
                    <h1 className="text-2xl font-bold text-foreground">
                      Create Receipt
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      Generate a receipt for your transaction
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!receiptUsage.isChecking && (
                    <Badge
                      variant="outline"
                      className={
                        receiptUsage.remaining <= 0
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : receiptUsage.remaining <= 2
                          ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                          : "bg-green-50 text-green-700 border-green-200"
                      }
                    >
                      {receiptUsage.remaining <= 0
                        ? "Pay-per-use"
                        : `${receiptUsage.remaining} left`}
                    </Badge>
                  )}
                  {currentDraftId && (
                    <Badge
                      variant="outline"
                      className="bg-purple-50 text-purple-700 border-purple-200"
                    >
                      Editing Draft
                    </Badge>
                  )}
                  {hasUnsavedChanges && (
                    <Badge
                      variant="outline"
                      className="bg-yellow-50 text-yellow-700 border-yellow-200"
                    >
                      Unsaved changes
                    </Badge>
                  )}
                  {sellerSignature && (
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200"
                    >
                      ✓ Signed
                    </Badge>
                  )}
                </div>
              </div>

              <div className="md:max-w-3xl mx-auto bg-card p-6 rounded-lg shadow-sm border">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (isFormLocked || isProcessingPayment) {
                          Swal.fire({
                            icon: "warning",
                            title: "Form is Processing",
                            text: "Cannot view drafts while submission is in progress.",
                            confirmButtonColor: "#C29307",
                          });
                          return;
                        }
                        if (userDrafts.length > 0) {
                          showDraftsList(userDrafts);
                        } else {
                          Swal.fire({
                            icon: "info",
                            title: "No Drafts",
                            text: "You don't have any saved drafts.",
                            confirmButtonColor: "#C29307",
                          });
                        }
                      }}
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                      disabled={isLoadingDrafts || isProcessingPayment}
                    >
                      {isLoadingDrafts ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <History className="h-4 w-4 mr-2" />
                      )}
                      View Drafts ({userDrafts.length})
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetForm}
                      className="text-gray-600 hover:text-gray-900"
                      disabled={isFormLocked || isProcessingPayment}
                    >
                      Clear Form
                    </Button>
                    {currentDraftId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteDraft(currentDraftId)}
                        className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                        disabled={isFormLocked || isProcessingPayment}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete Draft
                      </Button>
                    )}
                  </div>
                </div>

                {/* Signature Load Banner */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Your Saved Signature
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Load your saved signature to use in this receipt
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadSignatureManually}
                      disabled={
                        !userData?.id ||
                        !!sellerSignature ||
                        isProcessingPayment
                      }
                      className="border-gray-300 text-gray-700 hover:bg-gray-100"
                    >
                      {sellerSignature ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Signature Loaded
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Load Saved Signature
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Save for future toggle */}
                  {sellerSignature && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                            <Save className="h-3 w-3 text-blue-600" />
                          </div>
                          <span className="text-sm text-gray-700">
                            Save this signature for future use
                          </span>
                        </div>
                        <Switch
                          checked={saveSignatureForFuture}
                          onCheckedChange={handleSaveSignatureToggle}
                          disabled={isProcessingPayment}
                          className="data-[state=checked]:bg-[#C29307] scale-90"
                        />
                      </div>
                      {saveSignatureForFuture && (
                        <p className="text-xs text-green-600 mt-2 ml-9">
                          ✓ Your signature will be saved for future receipts
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit(false);
                  }}
                  className="space-y-8"
                >
                  {/* Receipt Type */}
                  <div className="animate-fade-in">
                    <ReceiptTypeSelector
                      value={receiptType}
                      onChange={setReceiptType}
                      disabled={isFormLocked || isProcessingPayment}
                    />
                  </div>

                  {/* Seller Information */}
                  <div
                    className="space-y-4 animate-fade-in"
                    style={{ animationDelay: "0.1s" }}
                  >
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full text-xs flex items-center justify-center font-bold bg-[#C29307] text-white">
                        1
                      </span>
                      Seller Information
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <Label
                          htmlFor="seller-name"
                          className="flex items-center gap-1"
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
                          className={`mt-1.5 bg-card ${customFocusStyle}`}
                          disabled={isFormLocked || isProcessingPayment}
                        />
                      </div>
                      <div>
                        <Label htmlFor="seller-phone">Phone (Optional)</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            id="seller-phone"
                            ref={sellerPhoneRef}
                            placeholder="+234 800 000 0000"
                            value={seller.phone}
                            onChange={(e) =>
                              setSeller({ ...seller, phone: e.target.value })
                            }
                            className={`mt-1.5 bg-card pl-10 ${customFocusStyle}`}
                            disabled={isFormLocked || isProcessingPayment}
                          />
                        </div>
                      </div>
                      <div>
                        <Label
                          htmlFor="seller-email"
                          className="flex items-center gap-1"
                        >
                          Email <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            id="seller-email"
                            ref={sellerEmailRef}
                            type="email"
                            placeholder="email@example.com"
                            value={seller.email}
                            onChange={(e) =>
                              setSeller({ ...seller, email: e.target.value })
                            }
                            className={`mt-1.5 bg-card pl-10 ${customFocusStyle}`}
                            disabled={isFormLocked || isProcessingPayment}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Receiver Information */}
                  <div
                    className="space-y-4 animate-fade-in"
                    style={{ animationDelay: "0.15s" }}
                  >
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full text-xs flex items-center justify-center font-bold bg-[#C29307] text-white">
                        2
                      </span>
                      Receiver Information
                    </h2>

                    <div className="grid gap-4">
                      <div>
                        <Label
                          htmlFor="receiver-name"
                          className="flex items-center gap-1"
                        >
                          Name (Individual or Business){" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="receiver-name"
                          ref={receiverNameRef}
                          placeholder="Enter receiver's full name"
                          value={receiver.name}
                          onChange={(e) =>
                            setReceiver({ ...receiver, name: e.target.value })
                          }
                          className={`mt-1.5 bg-card ${customFocusStyle}`}
                          disabled={isFormLocked || isProcessingPayment}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="receiver-email">
                            Email (Optional)
                          </Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                              id="receiver-email"
                              ref={receiverEmailRef}
                              type="email"
                              placeholder="receiver@example.com"
                              value={receiver.email}
                              onChange={(e) =>
                                setReceiver({
                                  ...receiver,
                                  email: e.target.value,
                                })
                              }
                              className={`mt-1.5 bg-card pl-10 ${customFocusStyle}`}
                              disabled={isFormLocked || isProcessingPayment}
                            />
                          </div>
                          {receiver.email &&
                            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                              receiver.email
                            ) && (
                              <p className="text-xs text-red-500 mt-1">
                                Please enter a valid email address
                              </p>
                            )}
                        </div>

                        <div>
                          <Label htmlFor="receiver-phone">
                            Phone (Optional)
                          </Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                              id="receiver-phone"
                              ref={receiverPhoneRef}
                              placeholder="+234 800 000 0000"
                              value={receiver.phone}
                              onChange={(e) =>
                                setReceiver({
                                  ...receiver,
                                  phone: e.target.value,
                                })
                              }
                              className={`mt-1.5 bg-card pl-10 ${customFocusStyle}`}
                              disabled={isFormLocked || isProcessingPayment}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Transaction Details */}
                  <div
                    className="space-y-4 animate-fade-in"
                    style={{ animationDelay: "0.2s" }}
                  >
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full text-xs flex items-center justify-center font-bold bg-[#C29307] text-white">
                        3
                      </span>
                      Transaction Details
                    </h2>
                    <ReceiptItemsForm
                      items={items}
                      onChange={setItems}
                      disabled={isFormLocked || isProcessingPayment}
                    />

                    <div className="p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg text-gray-400 font-semibold">
                          Total
                        </span>
                        <span className="text-2xl font-bold text-[#C29307]">
                          ₦
                          {calculateTotal().toLocaleString("en-NG", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <Label htmlFor="payment-method">Payment Method</Label>
                      <Select
                        value={paymentMethod}
                        onValueChange={(v) =>
                          setPaymentMethod(v as typeof paymentMethod)
                        }
                        disabled={isFormLocked || isProcessingPayment}
                      >
                        <SelectTrigger
                          className={`mt-1.5 bg-card ${customFocusStyle}`}
                        >
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
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

                  {/* Seller Signature */}
                  <div
                    className="space-y-4 animate-fade-in"
                    style={{ animationDelay: "0.25s" }}
                  >
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full text-xs flex items-center justify-center font-bold bg-[#C29307] text-white">
                        4
                      </span>
                      Your Signature
                    </h2>
                    <SignaturePad
                      value={sellerSignature}
                      onChange={handleSignatureChange}
                      label="Seller Signature (Optional)"
                      disabled={isFormLocked || isProcessingPayment}
                    />

                    {/* Toggle Button for Saving Signature */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <Save className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Save this signature for future use
                          </p>
                          <p className="text-xs text-gray-600">
                            Your signature will be securely stored
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={saveSignatureForFuture}
                        onCheckedChange={handleSaveSignatureToggle}
                        disabled={!sellerSignature || isProcessingPayment}
                        className="data-[state=checked]:bg-[#C29307]"
                      />
                    </div>
                  </div>

                  {/* Insufficient balance warning */}
                  {requiresPinConfirmation() && !hasSufficientBalance() && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        Insufficient balance. Please fund your wallet to create receipts.
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-4 flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSubmit(true)}
                      disabled={
                        isProcessingPayment ||
                        draftLoading ||
                        isFormLocked ||
                        isSubmitting
                      }
                      className="flex-1 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                      className={`flex-1 ${
                        requiresPinConfirmation() && !hasFreeReceiptAccess()
                          ? "bg-blue-600 hover:bg-blue-700"
                          : "bg-[#C29307] hover:bg-[#b38606]"
                      } text-white focus:ring-2 focus:ring-offset-2 focus:ring-[#C29307]`}
                      disabled={
                        isProcessingPayment ||
                        isSubmitting ||
                        isFormLocked ||
                        draftLoading ||
                        (requiresPinConfirmation() && !hasSufficientBalance())
                      }
                    >
                      {getGenerateButtonText()}
                    </Button>
                  </div>

                  {/* Limit Warning */}
                  {!isPremium && hasReachedLimit && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                        <div>
                          <h3 className="font-medium text-red-800">
                            Monthly Limit Reached
                          </h3>
                          <p className="text-sm text-red-700 mt-1">
                            You've used all your free receipts for this month. 
                            Pay ₦{RECEIPT_FEE} per receipt or upgrade to Growth plan for unlimited receipts.
                          </p>
                          <div className="flex gap-3 mt-3">
                            <Button
                              size="sm"
                              onClick={() => {
                                setShowUpgradePrompt(false);
                                setShowReceiptSummary(true);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <Wallet className="w-4 h-4 mr-2" />
                              Pay ₦{RECEIPT_FEE} & Continue
                            </Button>
                            <Link href="/pricing?upgrade=growth">
                              <Button size="sm" className="bg-[#C29307] hover:bg-[#b38606] text-white">
                                Upgrade Plan
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </TabsContent>

            {/* Preview Receipt Tab */}
            <TabsContent value="preview" className="mt-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start space-x-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (isFormLocked || isProcessingPayment) {
                        Swal.fire({
                          icon: "warning",
                          title: "Form is Processing",
                          text: "Cannot navigate away while submission is in progress.",
                          confirmButtonColor: "#C29307",
                        });
                        return;
                      }
                      router.back();
                    }}
                    className="text-[#C29307] hover:bg-white/10"
                    disabled={isProcessingPayment}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>

                  <div>
                    <h1 className="text-2xl font-bold text-foreground">
                      Receipt Preview
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      Live preview of your receipt as you fill out the form
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
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Processing Payment...
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                {/* Info Banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Eye className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                    <div>
                      <h3 className="font-medium text-blue-800">
                        Live Preview Mode
                      </h3>
                      <p className="text-sm text-blue-700 mt-1">
                        This is a real-time preview of how your receipt will
                        look. Any changes made in the "Create Receipt" tab will
                        be reflected here instantly.
                      </p>
                    </div>
                  </div>
                </div>

                <ReceiptPreview
                  receiptType={receiptType}
                  seller={seller}
                  receiver={receiver}
                  items={items}
                  paymentMethod={paymentMethod}
                  sellerSignature={sellerSignature}
                  onLoadSavedSignature={loadSignatureManually}
                  isProcessingPayment={isProcessingPayment}
                />

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-sm text-gray-500">
                    <p>
                      Switch to the "Create Receipt" tab to edit your receipt
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("create")}
                    className="border-[#C29307] text-[#C29307] hover:bg-[#C29307]/10"
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

export default function CreateReceipt({ userTier = 'free', hasReachedLimit = false }: CreateReceiptProps) {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C29307]"></div>
    </div>}>
      <CreateReceiptPage userTier={userTier} hasReachedLimit={hasReachedLimit} />
    </Suspense>
  );
}