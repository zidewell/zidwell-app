"use client";

import { useState } from "react";
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

      Swal.fire({
        icon: "success",
        title: "Verification Successful!",
        text: "Your BVN has been verified and your wallet is ready.",
        timer: 2000,
        showConfirmButton: false,
      });

      closeVerificationModal();
      setBvn("");
      setPin("");
      setConfirmPin("");
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Verification Failed",
        text: error.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      closeVerificationModal();
      setBvn("");
      setPin("");
      setConfirmPin("");
      setErrors({});
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
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

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-800">
              <strong>CBN Regulation:</strong> BVN verification is required
              before we can issue your virtual account number. Your information
              is encrypted and secure.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Later
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-[#2b825b] hover:bg-[#a67905]"
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
