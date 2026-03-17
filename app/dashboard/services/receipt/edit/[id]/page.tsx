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
  AlertTriangle,
  Edit,
} from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { useUserContextData } from "@/app/context/userData";
import PinPopOver from "@/app/components/PinPopOver";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import Swal from "sweetalert2";
import { ReceiptPreview } from "@/app/components/previews/RecieptPreview";
import Loader from "@/app/components/Loader";

// Import components
import { ReceiptSummary } from "@/app/components/Receipt-component/ReceiptSummary";
import { SignaturePad } from "@/app/components/SignaturePad";
import { ReceiptItemsForm } from "@/app/components/Receipt-component/ReceiptItemsForm";
import { ReceiptTypeSelector } from "@/app/components/Receipt-component/ReceiptTypeSelector";

// Import types
import type {
  ReceiptType,
  SellerInfo,
  ReceiverInfo,
  ReceiptItem,
  ReceiptSummaryItem,
} from "@/app/components/Receipt-component/receiptTypes";

type Receipt = {
  id: string;
  receipt_id: string;
  user_id: string;
  initiator_email: string;
  initiator_name: string;
  initiator_phone: string;
  business_name: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  bill_to: string;
  from_name: string;
  issue_date: string;
  customer_note: string;
  payment_for: string;
  payment_method: string;
  subtotal: number;
  total: number;
  status: "draft" | "pending" | "signed";
  receipt_items: ReceiptItem[] | string;
  seller_signature: string | null;
  client_signature: string | null;
  signed_at: string | null;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  metadata: any;
};

interface PaymentResponse {
  error?: string;
  message?: string;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  receipt?: Receipt;
  data?: any;
}

const UPDATE_FEE = 50;

function EditReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { userData } = useUserContextData();
  const [receiptId, setReceiptId] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isFormLocked, setIsFormLocked] = useState(false);

  // Payment states
  const inputCount = 4;
  const [isOpen, setIsOpen] = useState(false);
  const [pin, setPin] = useState<string[]>(Array(inputCount).fill(""));
  const [isSending, setIsSending] = useState(false);
  const [showReceiptSummary, setShowReceiptSummary] = useState(false);

  const [activeTab, setActiveTab] = useState("create");
  const [saveSignatureForFuture, setSaveSignatureForFuture] = useState(false);

  // Form states
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
  const [customerNote, setCustomerNote] = useState("");
  const [issueDate, setIssueDate] = useState<string>("");

  // Refs
  const sellerNameRef = useRef<HTMLInputElement>(null);
  const sellerPhoneRef = useRef<HTMLInputElement>(null);
  const sellerEmailRef = useRef<HTMLInputElement>(null);
  const receiverNameRef = useRef<HTMLInputElement>(null);
  const receiverEmailRef = useRef<HTMLInputElement>(null);
  const receiverPhoneRef = useRef<HTMLInputElement>(null);

  // Unwrap params
  useEffect(() => {
    const unwrapParams = async () => {
      const unwrapped = await params;
      setReceiptId(unwrapped.id);
    };
    unwrapParams();
  }, [params]);

  const parseReceiptItems = (items: any): ReceiptItem[] => {
    try {
      if (!items) return [];

      if (Array.isArray(items)) {
        // Map the incoming items to match your ReceiptItem type
        return items.map((item: any, index: number) => ({
          id: item.id || `item_${index + 1}`,
          description: item.description || "",
          quantity: item.quantity || 1,
          unitPrice: item.unit_price || item.unitPrice || 0,
          amount: item.total || item.amount || 0,
        }));
      }

      if (typeof items === "string") {
        const parsed = JSON.parse(items);
        if (Array.isArray(parsed)) {
          return parsed.map((item: any, index: number) => ({
            id: item.id || `item_${index + 1}`,
            description: item.description || "",
            quantity: item.quantity || 1,
            unitPrice: item.unit_price || item.unitPrice || 0,
            amount: item.total || item.amount || 0,
          }));
        }
      }

      return [];
    } catch (error) {
      console.error("Error parsing receipt items:", error);
      return [];
    }
  };

  const fetchReceipt = async () => {
    if (!receiptId) return;

    try {
      setLoading(true);

      const res = await fetch(`/api/receipt/get-receipt?id=${receiptId}`);
      const data: ApiResponse = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || `Failed to fetch receipt (${res.status})`,
        );
      }

      if (!data.success || !data.receipt) {
        throw new Error(data.message || "Receipt not found");
      }

      const receipt: Receipt = data.receipt;

      // Parse receipt items
      const receiptItems = parseReceiptItems(receipt.receipt_items);

      // Set form states
      setReceiptType((receipt.payment_for as ReceiptType) || "general");
      setSeller({
        name: receipt.initiator_name || "",
        email: receipt.initiator_email || "",
        phone: receipt.metadata.initiator_phone || "",
      });
      setReceiver({
        name: receipt.client_name || "",
        email: receipt.client_email || "",
        phone: receipt.client_phone || "",
      });

      if (receiptItems.length > 0) {
        setItems(receiptItems);
      } else {
        // Keep at least one empty item
        setItems([
          {
            id: "item_1",
            description: "",
            amount: 0,
            quantity: 1,
            unitPrice: 0,
          },
        ]);
      }

      setPaymentMethod((receipt.payment_method as any) || "transfer");

      if (
        receipt.seller_signature &&
        receipt.seller_signature !== "null" &&
        receipt.seller_signature !== ""
      ) {
        setSellerSignature(receipt.seller_signature);
      }

      setCustomerNote(receipt.customer_note || "");
      setIssueDate(
        receipt.issue_date || new Date().toISOString().split("T")[0],
      );

      // Check if receipt is signed
      if (receipt.status === "signed") {
        Swal.fire({
          icon: "info",
          title: "Receipt Already Signed",
          text: "This receipt has been signed. Editing will reset the signature status and require the client to sign again.",
          confirmButtonColor: "#2b825b",
        });
      }
    } catch (error) {
      console.error("❌ Failed to fetch receipt", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error instanceof Error ? error.message : "Failed to load receipt",
        confirmButtonColor: "#2b825b",
      }).then(() => {
        router.push("/dashboard/services/receipt");
      });
    } finally {
      setLoading(false);
    }
  };

  console.log("Receipt ID to edit:", seller);
  // Update receipt using PUT endpoint
  const updateReceiptInDatabase = async (): Promise<boolean> => {
    try {
      if (!userData?.id) {
        throw new Error("User not authenticated");
      }

      const totalAmount = calculateTotal();
      const subtotalAmount = calculateSubtotal();

      // Prepare items with proper structure
      const receipt_items = items.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        amount: item.amount || 0,
      }));

      const payload = {
        id: receiptId,
        initiator_email: seller.email,
        initiator_name: seller.name,
        initiator_phone: seller.phone,
        business_name: seller.name,
        client_name: receiver.name || "",
        client_email: receiver.email || "",
        client_phone: receiver.phone || "",
        bill_to: receiver.name || "",
        from_name: seller.name,
        issue_date: issueDate || new Date().toISOString().split("T")[0],
        customer_note:
          customerNote ||
          (sellerSignature
            ? "Updated receipt with signature"
            : "Updated receipt"),
        payment_for: receiptType,
        payment_method: paymentMethod,
        subtotal: subtotalAmount,
        total: totalAmount,
        status: "pending",
        receipt_items: receipt_items,
        seller_signature: sellerSignature || null,
      };

      // Call the PUT API to update receipt
      const res = await fetch("/api/receipt/update-receipt", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(
          "Update failed with status:",
          res.status,
          "Response:",
          errorText,
        );
        throw new Error(
          `Failed to update receipt: ${res.status} - ${errorText}`,
        );
      }

      let data: ApiResponse;
      try {
        data = await res.json();
      } catch (parseError) {
        console.error("Error parsing JSON response:", parseError);
        throw new Error("Invalid response from server");
      }

      if (!data.success) {
        console.error("Update failed:", data);
        throw new Error(data.message || data.error || "Receipt update failed");
      }

      console.log("Update successful:", data);
      return true;
    } catch (err) {
      console.error("Update receipt error:", err);
      throw err;
    }
  };

  useEffect(() => {
    if (receiptId) {
      fetchReceipt();
    }
  }, [receiptId]);

  useEffect(() => {
    if (
      seller.name ||
      seller.email ||
      seller.phone ||
      receiver.name ||
      receiver.email ||
      receiver.phone ||
      items.some((item) => item.description || item.amount > 0) ||
      sellerSignature ||
      customerNote ||
      issueDate
    ) {
      setHasUnsavedChanges(true);
    }
  }, [
    seller,
    receiver,
    items,
    sellerSignature,
    receiptType,
    paymentMethod,
    customerNote,
    issueDate,
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

  // Helper functions
  const generateToken = useCallback(() => {
    return `edit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const calculateTotal = () => {
    return items.reduce((total, item) => total + (item.amount || 0), 0);
  };

  const calculateSubtotal = () => {
    return items.reduce((total, item) => {
      const quantity = item.quantity || 1;
      const unitPrice = item.unitPrice || 0;
      return total + quantity * unitPrice;
    }, 0);
  };

  // Payment handling
  const handleDeduct = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      const pinString = pin.join("");

      fetch("/api/pay-app-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userData?.id,
          pin: pinString,
          amount: UPDATE_FEE,
          description: "Receipt update fee",
          service: "receipt_update",
        }),
      })
        .then(async (res) => {
          const data: PaymentResponse = await res.json();
          if (!res.ok) {
            Swal.fire("Error", data.error || "Something went wrong", "error");
            resolve(false);
          } else {
            resolve(true);
          }
        })
        .catch((err) => {
          Swal.fire("Error", err.message, "error");
          resolve(false);
        });
    });
  };

  const handleRefund = async () => {
    try {
      const res = await fetch("/api/refund-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userData?.id,
          amount: UPDATE_FEE,
          description: "Refund for failed receipt update",
        }),
      });

      const data: PaymentResponse = await res.json();

      if (res.ok) {
        Swal.fire({
          icon: "info",
          title: "Refund Processed",
          text: `₦${UPDATE_FEE.toLocaleString()} has been refunded to your wallet due to failed receipt update.`,
          confirmButtonColor: "#2b825b",
        });
      } else {
        throw new Error(data.error || "Refund failed");
      }
    } catch (err) {
      console.error("Refund failed:", err);
      Swal.fire({
        icon: "warning",
        title: "Refund Failed",
        text: "Payment deduction was made, but refund failed. Please contact support.",
        confirmButtonColor: "#2b825b",
      });
    }
  };

  const validateForm = (): { isValid: boolean; errorMessages: string[] } => {
    const errorMessages: string[] = [];

    if (!seller.name.trim()) {
      errorMessages.push("• Seller name is required");
    }

    if (!seller.email.trim()) {
      errorMessages.push("• Seller email is required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(seller.email)) {
      errorMessages.push("• Invalid seller email format");
    }

    if (!receiver.name.trim()) {
      errorMessages.push("• Receiver name is required");
    }

    if (receiver.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(receiver.email)) {
      errorMessages.push("• Invalid receiver email format");
    }

    if (items.every((item) => !item.description && item.amount === 0)) {
      errorMessages.push("• At least one item is required");
    }

    // Validate items
    items.forEach((item, index) => {
      if (
        item.description &&
        (item.amount <= 0 || (item.unitPrice || 0) <= 0)
      ) {
        errorMessages.push(
          `• Item ${index + 1}: Amount must be greater than 0`,
        );
      }
    });

    return { isValid: errorMessages.length === 0, errorMessages };
  };

  const processPaymentAndUpdate = async () => {
    setSaving(true);
    setIsOpen(false);
    setIsFormLocked(true);

    try {
      const paymentSuccess = await handleDeduct();

      if (paymentSuccess) {
        const updateSuccess = await updateReceiptInDatabase();

        if (updateSuccess) {
          triggerConfetti();

          Swal.fire({
            icon: "success",
            title: "Receipt Updated!",
            html: `
              <div class="text-center">
                <p>Your receipt has been updated successfully and sent for signing.</p>
                <p class="text-sm text-gray-600 mt-2">
                  <strong>Update Fee:</strong> ₦${UPDATE_FEE.toLocaleString()}<br>
                  <strong>Status:</strong> Resent for signature<br>
                  <strong>Note:</strong> The client will need to sign the updated receipt
                </p>
              </div>
            `,
            confirmButtonColor: "#2b825b",
            timer: 4000,
            showConfirmButton: false,
          }).then(() => {
            setHasUnsavedChanges(false);
            setIsFormLocked(false);
            router.push("/dashboard/services/receipt");
          });
        } else {
          // If update fails, refund the payment
          await handleRefund();
          setIsFormLocked(false);
          Swal.fire({
            icon: "error",
            title: "Update Failed",
            text: "Failed to update receipt. Your payment has been refunded.",
            confirmButtonColor: "#2b825b",
          });
        }
      } else {
        setIsFormLocked(false);
        Swal.fire({
          icon: "error",
          title: "Payment Failed",
          text: "Payment deduction failed. Please check your PIN and try again.",
          confirmButtonColor: "#2b825b",
        });
      }
    } catch (error) {
      console.error("Error in process:", error);
      setIsFormLocked(false);
      Swal.fire({
        icon: "error",
        title: "Processing Failed",
        text: "Failed to process payment and update receipt. Please try again.",
        confirmButtonColor: "#2b825b",
      });
    } finally {
      setSaving(false);
      setIsSending(false);
      // Reset PIN
      setPin(Array(inputCount).fill(""));
    }
  };

  const handleUpdateReceipt = () => {
    if (isFormLocked || isSending) return;

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
        confirmButtonColor: "#2b825b",
        confirmButtonText: "OK",
        width: 500,
      });
      return;
    }

    setIsSending(true);
    setShowReceiptSummary(true);
    setIsFormLocked(true);
  };

  const handleSummaryConfirm = () => {
    setShowReceiptSummary(false);
    setIsOpen(true);
    setIsSending(false);
  };

  const handleSummaryBack = () => {
    setShowReceiptSummary(false);
    setIsSending(false);
    setIsFormLocked(false);
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#2b825b", "#ffd700", "#ffed4e", "#ffffff", "#fbbf24"],
    });
  };

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

      // Load signature from API
      const res = await fetch(`/api/saved-signature?userId=${userData.id}`);
      const data: ApiResponse = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load signature");
      }

      if (data.data?.signature) {
        setSellerSignature(data.data.signature);
        setSaveSignatureForFuture(true);

        Swal.fire({
          icon: "success",
          title: "Signature Loaded",
          text: "Your saved signature has been loaded.",
          confirmButtonColor: "#2b825b",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "info",
          title: "No Saved Signature",
          text: "No saved signature found. Please create a new one.",
          confirmButtonColor: "#2b825b",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Load Failed",
        text: "Failed to load saved signature. Please try again.",
        confirmButtonColor: "#2b825b",
      });
    }
  };

  const handleSaveSignatureToggle = async (save: boolean) => {
    setSaveSignatureForFuture(save);

    if (save && sellerSignature && userData?.id) {
      try {
        // Save signature via API
        const res = await fetch("/api/saved-signature", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: userData.id,
            signature: sellerSignature,
          }),
        });

        const data: ApiResponse = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to save signature");
        }

        Swal.fire({
          icon: "success",
          title: "Signature Saved",
          text: "Your signature has been saved for future use.",
          confirmButtonColor: "#2b825b",
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (error) {
        // Silent fail for signature save
      }
    }

    if (!save && userData?.id) {
      try {
        await fetch("/api/saved-signature", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: userData.id }),
        });
      } catch (error) {
        console.error("Failed to delete signature:", error);
      }
    }
  };

  const handleSignatureChange = async (signature: string) => {
    setSellerSignature(signature);

    if (!signature && saveSignatureForFuture && userData?.id) {
      try {
        // Delete signature via API
        await fetch("/api/saved-signature", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: userData.id }),
        });
      } catch (error) {
        console.error("Failed to delete signature:", error);
      }
    }

    if (signature && saveSignatureForFuture && userData?.id) {
      try {
        // Save signature via API
        await fetch("/api/saved-signature", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: userData.id,
            signature: signature,
          }),
        });
      } catch (error) {
        console.error("Failed to save signature:", error);
      }
    }
  };

  const resetForm = () => {
    if (isFormLocked) {
      Swal.fire({
        icon: "warning",
        title: "Form is Processing",
        text: "Cannot reset form while processing is in progress.",
        confirmButtonColor: "#2b825b",
      });
      return;
    }

    Swal.fire({
      title: "Reset Changes?",
      text: "This will discard all unsaved changes and reload the original receipt.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#2b825b",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Reset",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        fetchReceipt();
        setHasUnsavedChanges(false);

        Swal.fire({
          icon: "success",
          title: "Changes Reset",
          text: "All changes have been discarded.",
          confirmButtonColor: "#2b825b",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    });
  };

  const handleCancel = () => {
    if (isFormLocked) {
      Swal.fire({
        icon: "warning",
        title: "Form is Processing",
        text: "Cannot cancel while processing is in progress.",
        confirmButtonColor: "#2b825b",
      });
      return;
    }

    if (hasUnsavedChanges) {
      Swal.fire({
        title: "Discard Changes?",
        text: "You have unsaved changes. Are you sure you want to leave?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#2b825b",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, Discard",
        cancelButtonText: "Continue Editing",
      }).then((result) => {
        if (result.isConfirmed) {
          router.push("/dashboard/services/receipt");
        }
      });
    } else {
      router.push("/dashboard/services/receipt");
    }
  };

  // Prepare receipt data for summary
  const getReceiptSummaryData = () => {
    const totalAmount = calculateTotal();
    const subtotalAmount = calculateSubtotal();

    const receiptItems: ReceiptSummaryItem[] = items.map((item) => ({
      item: item.description || "Unnamed item",
      quantity: item.quantity || 1,
      price: item.unitPrice || 0,
    }));

    return {
      name: receiver.name || "Not specified",
      email: receiver.email || "Not provided",
      receiptId: receiptId,
      bill_to: receiver.name || "Not specified",
      from: seller.name || "Not specified",
      issue_date: issueDate || new Date().toLocaleDateString(),
      customer_note: customerNote,
      payment_for: receiptType,
      receipt_items: receiptItems,
      subtotal: subtotalAmount,
      total: totalAmount,
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  const customFocusStyle =
    "focus:ring-2 focus:ring-[#2b825b] focus:ring-offset-2 focus:border-[#2b825b] transition-all duration-200";

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <>
      {/* PinPopOver */}
      {isOpen && !showReceiptSummary && (
        <PinPopOver
          setIsOpen={(newValue) => {
            setIsOpen(newValue);
            if (!newValue) {
              setIsSending(false);
              setIsFormLocked(false);
            }
          }}
          isOpen={isOpen}
          pin={pin}
          setPin={setPin}
          inputCount={inputCount}
          onConfirm={processPaymentAndUpdate}
        />
      )}

      {/* ReceiptSummary */}
      <ReceiptSummary
        receiptData={getReceiptSummaryData()}
        totalAmount={calculateTotal()}
        initiatorName={seller.name}
        initiatorEmail={seller.email}
        amount={UPDATE_FEE}
        confirmReceipt={showReceiptSummary}
        onBack={handleSummaryBack}
        onConfirm={handleSummaryConfirm}
        receiptType={receiptType}
        sellerPhone={seller.phone}
        receiverPhone={receiver.phone}
      />

      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-4 sm:py-6 px-3 sm:px-4">
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  className="text-[#2b825b] hover:bg-white/10"
                  disabled={isFormLocked}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Back</span>
                </Button>

                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">
                    Edit Receipt
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Update and manage your receipt details
                  </p>
                </div>
              </div>

              {/* Responsive badges */}
              <div className="flex flex-wrap gap-2">
                {hasUnsavedChanges && (
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-yellow-700 border-yellow-200 text-xs"
                  >
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Unsaved
                  </Badge>
                )}
                {items.some((item) => item.description || item.amount > 0) && (
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200 text-xs"
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    {items.filter((item) => item.description).length} item(s)
                  </Badge>
                )}
                {isFormLocked && (
                  <Badge
                    variant="outline"
                    className="bg-red-50 text-red-700 border-red-200 text-xs"
                  >
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Processing...
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="w-full max-w-3xl lg:max-w-4xl">
              <Card className="p-4 sm:p-6">
                {/* Responsive Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetForm}
                      disabled={!hasUnsavedChanges || isFormLocked}
                      className="text-xs sm:text-sm"
                    >
                      Reset Changes
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab("preview")}
                      disabled={isFormLocked}
                      className="border-[#2b825b] text-[#2b825b] hover:bg-[#2b825b]/10 text-xs sm:text-sm"
                    >
                      <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      Preview
                    </Button>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 text-right">
                    {/* <div className="font-medium">ID: {receiptId}</div> */}
                    <div>Total: {formatCurrency(calculateTotal())}</div>
                  </div>
                </div>

                <Tabs
                  value={activeTab}
                  onValueChange={(value) => {
                    if (isFormLocked) return;
                    setActiveTab(value);
                  }}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-8">
                    <TabsTrigger
                      value="create"
                      className="gap-1 sm:gap-2 text-xs sm:text-sm"
                      disabled={isFormLocked}
                    >
                      <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                      Edit Receipt
                    </TabsTrigger>
                    <TabsTrigger
                      value="preview"
                      className="gap-1 sm:gap-2 text-xs sm:text-sm"
                      disabled={isFormLocked}
                    >
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                      Preview
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent
                    value="create"
                    className="space-y-6 sm:space-y-8"
                  >
                    {/* Signature Load Banner */}
                    <div className="p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                            !userData?.id || !!sellerSignature || isFormLocked
                          }
                          className="border-gray-300 text-gray-700 hover:bg-gray-100 text-xs sm:text-sm"
                        >
                          {sellerSignature ? (
                            <>
                              <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              Loaded
                            </>
                          ) : (
                            <>
                              <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              Load Signature
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Save for future toggle */}
                      {sellerSignature && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center space-x-2 sm:space-x-3">
                              <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-blue-100 flex items-center justify-center">
                                <Save className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-600" />
                              </div>
                              <span className="text-xs sm:text-sm text-gray-700">
                                Save for future use
                              </span>
                            </div>
                            <Switch
                              checked={saveSignatureForFuture}
                              onCheckedChange={handleSaveSignatureToggle}
                              disabled={isFormLocked}
                              className="data-[state=checked]:bg-[#2b825b] scale-75 sm:scale-90"
                            />
                          </div>
                          {saveSignatureForFuture && (
                            <p className="text-xs text-green-600 mt-2 ml-7 sm:ml-9">
                              ✓ Signature will be saved
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleUpdateReceipt();
                      }}
                      className="space-y-6 sm:space-y-8"
                    >
                      {/* Receipt Type */}
                      <div className="animate-fade-in">
                        <ReceiptTypeSelector
                          value={receiptType}
                          onChange={setReceiptType}
                          disabled={isFormLocked}
                        />
                      </div>

                      {/* Seller Information */}
                      <div
                        className="space-y-3 sm:space-y-4 animate-fade-in"
                        style={{ animationDelay: "0.1s" }}
                      >
                        <h2 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                          <span className="h-5 w-5 sm:h-6 sm:w-6 rounded-full text-xs flex items-center justify-center font-bold bg-[#2b825b] text-white">
                            1
                          </span>
                          Seller Information
                        </h2>
                        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                          <div className="sm:col-span-2">
                            <Label
                              htmlFor="seller-name"
                              className="flex items-center gap-1 text-sm sm:text-base"
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
                              className={`mt-1.5 text-sm sm:text-base ${customFocusStyle}`}
                              disabled={isFormLocked}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  if (sellerPhoneRef.current) {
                                    sellerPhoneRef.current.focus();
                                  }
                                }
                              }}
                            />
                          </div>
                          <div>
                            <Label
                              htmlFor="seller-phone"
                              className="text-sm sm:text-base"
                            >
                              Phone (Optional)
                            </Label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3 sm:h-4 sm:w-4" />
                              <Input
                                id="seller-phone"
                                ref={sellerPhoneRef}
                                placeholder="+234 800 000 0000"
                                value={seller.phone}
                                onChange={(e) =>
                                  setSeller({
                                    ...seller,
                                    phone: e.target.value,
                                  })
                                }
                                className={`mt-1.5 text-sm sm:text-base pl-8 sm:pl-10 ${customFocusStyle}`}
                                disabled={isFormLocked}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    if (sellerEmailRef.current) {
                                      sellerEmailRef.current.focus();
                                    }
                                  }
                                }}
                              />
                            </div>
                          </div>
                          <div>
                            <Label
                              htmlFor="seller-email"
                              className="flex items-center gap-1 text-sm sm:text-base"
                            >
                              Email <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3 sm:h-4 sm:w-4" />
                              <Input
                                id="seller-email"
                                ref={sellerEmailRef}
                                type="email"
                                placeholder="email@example.com"
                                value={seller.email}
                                onChange={(e) =>
                                  setSeller({
                                    ...seller,
                                    email: e.target.value,
                                  })
                                }
                                className={`mt-1.5 text-sm sm:text-base pl-8 sm:pl-10 ${customFocusStyle}`}
                                disabled={isFormLocked}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    if (receiverNameRef.current) {
                                      receiverNameRef.current.focus();
                                    }
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Receiver Information */}
                      <div
                        className="space-y-3 sm:space-y-4 animate-fade-in"
                        style={{ animationDelay: "0.15s" }}
                      >
                        <h2 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                          <span className="h-5 w-5 sm:h-6 sm:w-6 rounded-full text-xs flex items-center justify-center font-bold bg-[#2b825b] text-white">
                            2
                          </span>
                          Receiver Information
                        </h2>

                        <div className="space-y-3 sm:space-y-4">
                          <div>
                            <Label
                              htmlFor="receiver-name"
                              className="flex items-center gap-1 text-sm sm:text-base"
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
                                setReceiver({
                                  ...receiver,
                                  name: e.target.value,
                                })
                              }
                              className={`mt-1.5 text-sm sm:text-base ${customFocusStyle}`}
                              disabled={isFormLocked}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  if (receiverEmailRef.current) {
                                    receiverEmailRef.current.focus();
                                  }
                                }
                              }}
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                              <Label
                                htmlFor="receiver-email"
                                className="text-sm sm:text-base"
                              >
                                Email (Optional)
                              </Label>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3 sm:h-4 sm:w-4" />
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
                                  className={`mt-1.5 text-sm sm:text-base pl-8 sm:pl-10 ${customFocusStyle}`}
                                  disabled={isFormLocked}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      if (receiverPhoneRef.current) {
                                        receiverPhoneRef.current.focus();
                                      }
                                    }
                                  }}
                                />
                              </div>
                            </div>

                            <div>
                              <Label
                                htmlFor="receiver-phone"
                                className="text-sm sm:text-base"
                              >
                                Phone (Optional)
                              </Label>
                              <div className="relative">
                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3 sm:h-4 sm:w-4" />
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
                                  className={`mt-1.5 text-sm sm:text-base pl-8 sm:pl-10 ${customFocusStyle}`}
                                  disabled={isFormLocked}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Issue Date */}
                          <div>
                            <Label
                              htmlFor="issue-date"
                              className="text-sm sm:text-base"
                            >
                              Issue Date
                            </Label>
                            <Input
                              id="issue-date"
                              type="date"
                              value={issueDate}
                              onChange={(e) => setIssueDate(e.target.value)}
                              className={`mt-1.5 text-sm sm:text-base ${customFocusStyle}`}
                              disabled={isFormLocked}
                              max={new Date().toISOString().split("T")[0]}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Transaction Details */}
                      <div
                        className="space-y-3 sm:space-y-4 animate-fade-in"
                        style={{ animationDelay: "0.2s" }}
                      >
                        <h2 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                          <span className="h-5 w-5 sm:h-6 sm:w-6 rounded-full text-xs flex items-center justify-center font-bold bg-[#2b825b] text-white">
                            3
                          </span>
                          Transaction Details
                        </h2>
                        <ReceiptItemsForm
                          items={items}
                          onChange={setItems}
                          disabled={isFormLocked}
                        />

                        <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center mb-1 sm:mb-2">
                            <span className="text-base sm:text-lg text-gray-600 font-semibold">
                              Subtotal
                            </span>
                            <span className="text-lg sm:text-xl font-bold text-gray-800">
                              {formatCurrency(calculateSubtotal())}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t">
                            <span className="text-lg sm:text-xl text-gray-800 font-bold">
                              Total
                            </span>
                            <span className="text-xl sm:text-2xl font-bold text-[#2b825b]">
                              {formatCurrency(calculateTotal())}
                            </span>
                          </div>
                        </div>

                        <div>
                          <Label
                            htmlFor="payment-method"
                            className="text-sm sm:text-base"
                          >
                            Payment Method
                          </Label>
                          <Select
                            value={paymentMethod}
                            onValueChange={(v) =>
                              setPaymentMethod(v as typeof paymentMethod)
                            }
                            disabled={isFormLocked}
                          >
                            <SelectTrigger
                              className={`mt-1.5 text-sm sm:text-base ${customFocusStyle}`}
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

                        {/* Customer Note */}
                        <div>
                          <Label
                            htmlFor="customer-note"
                            className="text-sm sm:text-base"
                          >
                            Customer Note (Optional)
                          </Label>
                          <Input
                            id="customer-note"
                            placeholder="Add any additional notes for the customer"
                            value={customerNote}
                            onChange={(e) => setCustomerNote(e.target.value)}
                            className={`mt-1.5 text-sm sm:text-base ${customFocusStyle}`}
                            disabled={isFormLocked}
                          />
                        </div>
                      </div>

                      {/* Seller Signature */}
                      <div
                        className="space-y-3 sm:space-y-4 animate-fade-in"
                        style={{ animationDelay: "0.25s" }}
                      >
                        <h2 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                          <span className="h-5 w-5 sm:h-6 sm:w-6 rounded-full text-xs flex items-center justify-center font-bold bg-[#2b825b] text-white">
                            4
                          </span>
                          Your Signature
                        </h2>
                        <SignaturePad
                          value={sellerSignature}
                          onChange={handleSignatureChange}
                          label="Seller Signature (Optional)"
                          disabled={isFormLocked}
                        />

                        {/* Toggle Button for Saving Signature */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <Save className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm font-medium text-gray-900">
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
                            disabled={!sellerSignature || isFormLocked}
                            className="data-[state=checked]:bg-[#2b825b]"
                          />
                        </div>
                      </div>

                      {/* Responsive Action Buttons */}
                      <div className="pt-4 flex flex-col sm:flex-row gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancel}
                          disabled={isFormLocked}
                          className="flex-1 focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          variant="default"
                          size="lg"
                          className="flex-1 bg-[#2b825b] hover:bg-[#1e5d42] text-white focus:ring-2 focus:ring-offset-2 focus:ring-[#2b825b] text-sm sm:text-base"
                          disabled={isFormLocked || isSending}
                        >
                          {isSending ? (
                            <>
                              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                              Update Receipt (₦{UPDATE_FEE.toLocaleString()})
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </TabsContent>

                  <TabsContent value="preview">
                    <ReceiptPreview
                      receiptType={receiptType}
                      seller={seller}
                      receiver={receiver}
                      items={items}
                      paymentMethod={paymentMethod}
                      sellerSignature={sellerSignature}
                      onLoadSavedSignature={loadSignatureManually}
                      isProcessingPayment={isFormLocked}
                    />

                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-4 border-t mt-6 gap-3">
                      <div className="text-sm text-gray-500">
                        <p>
                          Switch to the "Edit Receipt" tab to modify your
                          receipt
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab("create")}
                        className="border-[#2b825b] text-[#2b825b] hover:bg-[#2b825b]/10"
                      >
                        <EyeOff className="h-4 w-4 mr-2" />
                        Back to Editor
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function EditReceipt({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditReceiptPage params={params} />
    </Suspense>
  );
}
