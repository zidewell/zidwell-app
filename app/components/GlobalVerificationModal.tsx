"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useUserContextData } from "@/app/context/userData";
import Swal from "sweetalert2";
import { useVerificationModal } from "../context/verificationModalContext";

const GlobalVerificationModal = () => {
  const { userData, setUserData } = useUserContextData();
  const { isOpen, closeVerificationModal } = useVerificationModal();
  const [loading, setLoading] = useState(false);
  const [bvn, setBvn] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset all form state when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setBvn("");
      setPin("");
      setConfirmPin("");
      setErrors({});
      setLoading(false);
    }
  }, [isOpen]);

  // Force cleanup on unmount
  useEffect(() => {
    return () => {
      setLoading(false);
    };
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!bvn) {
      newErrors.bvn = "BVN is required";
    } else if (!/^\d{11}$/.test(bvn)) {
      newErrors.bvn = "BVN must be exactly 11 digits";
    }

    if (!pin) {
      newErrors.pin = "Transaction PIN is required";
    } else if (!/^\d{4}$/.test(pin)) {
      newErrors.pin = "PIN must be exactly 4 digits";
    }

    if (pin !== confirmPin) {
      newErrors.confirmPin = "PINs do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    // Prevent multiple submissions
    if (loading) return;
    
    setLoading(true);
    
    try {
      const response = await fetch("/api/verify-bvn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userData?.id,
          bvn,
          transactionPin: pin,
          fullName: userData?.fullName,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Verification failed");
      }

      // Update user data in context
      setUserData({
        ...userData,
        bvnVerification: "verified",
        bankName: result.wallet?.bankName,
        bankAccountName: result.wallet?.bankAccountName,
        bankAccountNumber: result.wallet?.bankAccountNumber,
        walletId: result.wallet?.accountRef,
        pinSet: true,
      });

      // Close modal first
      closeVerificationModal();
      
      // Reset form state
      setBvn("");
      setPin("");
      setConfirmPin("");
      setErrors({});
      setLoading(false);
      
      // Show success message that auto-closes
      Swal.fire({
        icon: "success",
        title: "Verification Successful!",
        text: "Your BVN has been verified and your wallet is ready.",
        timer: 2000,
        showConfirmButton: false,
        allowOutsideClick: false,
        didOpen: () => {
          // Auto close after 2 seconds
          setTimeout(() => {
            Swal.close();
          }, 2000);
        }
      });
    } catch (error: any) {
      console.error("Verification error:", error);
      
      // Reset loading state first so button becomes clickable
      setLoading(false);
      
      // Show error message that auto-closes after 3 seconds
      Swal.fire({
        icon: "error",
        title: "Verification Failed",
        text: error.message || "Something went wrong. Please try again.",
        timer: 3000,
        showConfirmButton: false,
        allowOutsideClick: false,
        didOpen: () => {
          // Auto close after 3 seconds
          setTimeout(() => {
            Swal.close();
          }, 3000);
        }
      });
    }
  };

  const handleClose = () => {
    if (!loading) {
      closeVerificationModal();
      // Reset all state
      setBvn("");
      setPin("");
      setConfirmPin("");
      setErrors({});
      setLoading(false);
    }
  };

  // Handle dialog open state change
  const handleOpenChange = (open: boolean) => {
    if (!open && !loading) {
      handleClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Your BVN Verification</DialogTitle>
          <DialogDescription>
            Set up your wallet by verifying your BVN and creating a transaction
            PIN.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* BVN Field */}
          <div className="space-y-2">
            <Label htmlFor="global-bvn">Bank Verification Number (BVN) *</Label>
            <Input
              id="global-bvn"
              placeholder="Enter 11-digit BVN"
              value={bvn}
              onChange={(e) => setBvn(e.target.value.replace(/\D/g, ""))}
              maxLength={11}
              className={errors.bvn ? "border-red-500" : ""}
              disabled={loading}
            />
            {errors.bvn && <p className="text-xs text-red-500">{errors.bvn}</p>}
          </div>

          {/* PIN Field */}
          <div className="space-y-2">
            <Label htmlFor="global-pin">Transaction PIN *</Label>
            <Input
              id="global-pin"
              type="password"
              placeholder="4-digit PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              maxLength={4}
              className={errors.pin ? "border-red-500" : ""}
              disabled={loading}
            />
            {errors.pin && <p className="text-xs text-red-500">{errors.pin}</p>}
          </div>

          {/* Confirm PIN Field */}
          <div className="space-y-2">
            <Label htmlFor="global-confirmPin">Confirm PIN *</Label>
            <Input
              id="global-confirmPin"
              type="password"
              placeholder="Re-enter PIN"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
              maxLength={4}
              className={errors.confirmPin ? "border-red-500" : ""}
              disabled={loading}
            />
            {errors.confirmPin && (
              <p className="text-xs text-red-500">{errors.confirmPin}</p>
            )}
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-xs text-green-800">
              <strong>CBN Regulation:</strong> BVN verification is required
              before we can issue your virtual account number. Your information
              is encrypted and secure.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose} 
            disabled={loading}
            type="button"
          >
            Later
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !bvn || !pin || !confirmPin}
            type="button"
            className="flex-1 bg-[#2b825b] hover:bg-[#2b825b]/90 text-white dark:bg-[#236b49] dark:hover:bg-[#174c36] py-3 px-4 rounded-md transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify & Create Wallet"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalVerificationModal;