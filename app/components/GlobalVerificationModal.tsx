// GlobalVerificationModal.tsx
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

      setUserData({
        ...userData,
        bvnVerification: "verified",
        bankName: result.wallet?.bankName,
        bankAccountName: result.wallet?.bankAccountName,
        bankAccountNumber: result.wallet?.bankAccountNumber,
        walletId: result.wallet?.accountRef,
        pinSet: true,
      });

      closeVerificationModal();

      setBvn("");
      setPin("");
      setConfirmPin("");
      setErrors({});
      setLoading(false);

      Swal.fire({
        icon: "success",
        title: "Verification Successful!",
        text: "Your BVN has been verified and your wallet is ready.",
        timer: 2000,
        showConfirmButton: false,
        allowOutsideClick: false,
        didOpen: () => {
          setTimeout(() => {
            Swal.close();
          }, 2000);
        },
      });
    } catch (error: any) {
      console.error("Verification error:", error);
      setLoading(false);

      Swal.fire({
        icon: "error",
        title: "Verification Failed",
        text: error.message || "Something went wrong. Please try again.",
        timer: 3000,
        showConfirmButton: false,
        allowOutsideClick: false,
        didOpen: () => {
          setTimeout(() => {
            Swal.close();
          }, 3000);
        },
      });
    }
  };

  const handleClose = () => {
    if (!loading) {
      closeVerificationModal();
      setBvn("");
      setPin("");
      setConfirmPin("");
      setErrors({});
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !loading) {
      handleClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-(--bg-primary) border border-(--border-color)">
        <DialogHeader>
          <DialogTitle className="text-(--text-primary)">
            Complete Your BVN Verification
          </DialogTitle>
          <DialogDescription className="text-(--text-secondary)">
            Set up your wallet by verifying your BVN and creating a transaction
            PIN.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* BVN Field */}
          <div className="space-y-2">
            <Label htmlFor="global-bvn" className="text-(--text-primary)">
              Bank Verification Number (BVN) *
            </Label>
            <Input
              id="global-bvn"
              placeholder="Enter 11-digit BVN"
              value={bvn}
              onChange={(e) => setBvn(e.target.value.replace(/\D/g, ""))}
              maxLength={11}
              className={`border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:ring-(--color-accent-yellow) focus:border-(--color-accent-yellow) ${
                errors.bvn ? "border-red-500" : ""
              }`}
              style={{ outline: "none", boxShadow: "none" }}
              disabled={loading}
            />
            {errors.bvn && <p className="text-xs text-red-500">{errors.bvn}</p>}
          </div>

          {/* PIN Field */}
          <div className="space-y-2">
            <Label htmlFor="global-pin" className="text-(--text-primary)">
              Transaction PIN *
            </Label>
            <Input
              id="global-pin"
              type="password"
              placeholder="4-digit PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              maxLength={4}
              className={`border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:ring-(--color-accent-yellow) focus:border-(--color-accent-yellow) ${
                errors.pin ? "border-red-500" : ""
              }`}
              style={{ outline: "none", boxShadow: "none" }}
              disabled={loading}
            />
            {errors.pin && <p className="text-xs text-red-500">{errors.pin}</p>}
          </div>

          {/* Confirm PIN Field */}
          <div className="space-y-2">
            <Label
              htmlFor="global-confirmPin"
              className="text-(--text-primary)"
            >
              Confirm PIN *
            </Label>
            <Input
              id="global-confirmPin"
              type="password"
              placeholder="Re-enter PIN"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
              maxLength={4}
              className={`border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:ring-(--color-accent-yellow) focus:border-(--color-accent-yellow) ${
                errors.confirmPin ? "border-red-500" : ""
              }`}
              style={{ outline: "none", boxShadow: "none" }}
              disabled={loading}
            />
            {errors.confirmPin && (
              <p className="text-xs text-red-500">{errors.confirmPin}</p>
            )}
          </div>

          <div className="bg-(--color-lemon-green)/10 border border-(--color-lemon-green)/20 rounded-lg p-3">
            <p className="text-xs text-(--color-lemon-green)">
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
            className="border-(--border-color) text-(--text-primary) hover:bg-(--bg-secondary)"
          >
            Later
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !bvn || !pin || !confirmPin}
            type="button"
            className="flex-1 bg-(--color-accent-yellow) hover:bg-(--color-accent-yellow)/90 text-(--color-ink) py-3 px-4 rounded-md transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2"
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
