"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { CreditCard, Banknote } from "lucide-react";
import { useToast } from "@/app/hooks/use-toast";
import { PayWithTransferModal } from "../Invoice-components/PayWithTransferModal";

// Types
interface PayerInfo {
  fullName: string;
  email: string;
  phone: string;
}

interface PaymentFormProps {
  invoiceId: string;
  amount: number;
  initiatorAccountName?: string;
  initiatorAccountNumber?: string;
  initiatorBankName?: string;
  status?: string;
  allow_multiple_payments?: boolean;
}

// Validation utility
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[0-9]{10,15}$/;
  return phoneRegex.test(phone.replace(/\D/g, ""));
};

const validatePayerInfo = (payerInfo: PayerInfo): string | null => {
  if (!payerInfo.fullName || !payerInfo.email || !payerInfo.phone) {
    return "Please fill in all your information before proceeding with payment.";
  }

  if (!validateEmail(payerInfo.email)) {
    return "Please enter a valid email address.";
  }

  if (!validatePhone(payerInfo.phone)) {
    return "Please enter a valid phone number (10-15 digits).";
  }

  return null;
};

export default function PaymentForm({
  invoiceId,
  amount,
  initiatorAccountName,
  initiatorAccountNumber,
  initiatorBankName,
  status,
  allow_multiple_payments = false,
}: PaymentFormProps) {
  const [payerInfo, setPayerInfo] = useState<PayerInfo>({
    fullName: "",
    email: "",
    phone: "",
  });
  const [isGeneratingPayment, setIsGeneratingPayment] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    "card" | "transfer" | null
  >(null);

  const { toast } = useToast();

  const handlePayerInfoChange = (field: keyof PayerInfo, value: string) => {
    setPayerInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePaymentMethodSelect = (method: "card" | "transfer") => {
    const validationError = validatePayerInfo(payerInfo);

    if (validationError) {
      toast({
        title: "Validation Error",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setSelectedPaymentMethod(method);

    if (method === "transfer") {
      setShowTransferModal(true);
    } else {
      generatePaymentLink();
    }
  };

  const generatePaymentLink = async () => {
    setIsGeneratingPayment(true);

    try {
      const response = await fetch("/api/generate-payment-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoiceId: invoiceId,
          amount: amount,
          payerName: payerInfo.fullName,
          payerEmail: payerInfo.email,
          payerPhone: payerInfo.phone,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.paymentUrl) {
        toast({
          title: "Redirecting to Payment",
          description: "You are being redirected to the secure payment page...",
        });

        // Add a small delay for better UX
        setTimeout(() => {
          window.location.href = data.paymentUrl;
        }, 1500);
      } else {
        toast({
          title: "Payment Error",
          description:
            data.error || "Failed to generate payment link. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Payment generation error:", error);
      toast({
        title: "Connection Error",
        description:
          "An error occurred. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPayment(false);
    }
  };

  return (
    <>
      {/* Payer Information Form */}
      {showPaymentForm && (
        <div className="mb-6 p-6 bg-muted/30 rounded-lg border">
          <h3 className="font-semibold text-foreground mb-4">
            Your Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={payerInfo.fullName}
                onChange={(e) =>
                  handlePayerInfoChange("fullName", e.target.value)
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={payerInfo.email}
                onChange={(e) => handlePayerInfoChange("email", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter your phone number"
                value={payerInfo.phone}
                onChange={(e) => handlePayerInfoChange("phone", e.target.value)}
                required
              />
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="mt-6">
            <h3 className="font-semibold text-foreground mb-4">
              Select Payment Method
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                type="button"
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2 hover:border-[#2b825b] hover:bg-amber-50"
                disabled={true}
                title="Card payments are currently disabled"
              >
                <CreditCard className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-semibold">Pay with Card</div>
                  <div className="text-xs text-muted-foreground">
                    Visa, Mastercard, etc.
                  </div>
                </div>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2 hover:border-[#2b825b] hover:bg-amber-50"
                onClick={() => handlePaymentMethodSelect("transfer")}
                disabled={isGeneratingPayment}
              >
                <Banknote className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-semibold">Bank Transfer</div>
                  <div className="text-xs text-muted-foreground">
                    Direct bank transfer
                  </div>
                </div>
              </Button>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowPaymentForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      <PayWithTransferModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        invoiceId={invoiceId}
        amount={amount}
        payerInfo={payerInfo}
        initiatorAccountName={initiatorAccountName}
        initiatorAccountNumber={initiatorAccountNumber}
        initiatorBankName={initiatorBankName}
      />

      {/* Pay Now Button */}
      {!showPaymentForm && (
        <div className="mb-6">
          <Button
            size="lg"
            className="w-full bg-[#2b825b] hover:bg-[#1e5d42] text-white"
            onClick={() => setShowPaymentForm(true)}
            disabled={status === "paid" && allow_multiple_payments === false}
          >
            <CreditCard className="h-5 w-5 mr-2" />
            {status === "paid" && allow_multiple_payments === false
              ? "Payment Completed"
              : "Pay Now"}
          </Button>
        </div>
      )}
    </>
  );
}
