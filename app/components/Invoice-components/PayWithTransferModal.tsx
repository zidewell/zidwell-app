"use client";

import { useState, useCallback } from "react";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { TransferCheckout } from "@/app/components/Invoice-components/TransferCheckout";
import { useToast } from "@/app/hooks/use-toast";

interface PayerInfo {
  fullName: string;
  email: string;
  phone: string;
}

interface PayWithTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string;
  amount: number;
  payerInfo: PayerInfo;
  initiatorAccountName?: string;
  initiatorAccountNumber?: string;
  initiatorBankName?: string;
}

export function PayWithTransferModal({
  isOpen,
  onClose,
  invoiceId,
  amount,
  payerInfo,
  initiatorAccountName,
  initiatorAccountNumber,
  initiatorBankName,
}: PayWithTransferModalProps) {
  const [paymentVerified, setPaymentVerified] = useState(false);
  const { toast } = useToast();

  const handleClose = () => {
    setPaymentVerified(false);
    onClose();
  };

  const handlePaymentVerified = useCallback(() => {
    setPaymentVerified(true);
    toast({
      title: "🎉 Payment Verified!",
      description: "Your payment has been confirmed successfully.",
    });

    // Auto-close after 5 seconds
    setTimeout(() => {
      handleClose();
    }, 5000);
  }, [toast, handleClose]);

  const bankDetails = {
    bankName: initiatorBankName || "",
    accountName: initiatorAccountName || "",
    accountNumber: initiatorAccountNumber || "",
  };

  const invoiceDetails = {
    invoiceId: invoiceId,
    amount: amount,
    currency: "NGN",
    description: `Payment for invoice ${invoiceId}`,
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border-border dark:border-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-foreground dark:text-gray-100">
            Pay with Bank Transfer
            {paymentVerified && (
              <span className="text-sm px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full">
                ✅ Verified
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <TransferCheckout
            bankDetails={bankDetails}
            invoiceDetails={invoiceDetails}
            payerInfo={{
              email: payerInfo.email,
              name: payerInfo.fullName,
              phone: payerInfo.phone,
            }}
            onPaymentVerified={handlePaymentVerified}
          />
        </div>

        <div className="flex justify-end pt-4 border-t border-border dark:border-gray-800">
          <Button
            variant="outline"
            onClick={handleClose}
            className="border-gray-300 dark:border-gray-700 text-foreground dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {paymentVerified ? "Close" : "Cancel"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
