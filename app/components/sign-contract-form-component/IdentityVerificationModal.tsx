"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Badge } from "@/app/components/ui/badge";
import { CheckCircle, Shield, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/app/hooks/use-toast";
import { SignaturePad } from "@/app/components/SignaturePad";

interface IdentityVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string;
  contractToken: string;
  signeeName: string;
  signeeEmail: string;
  onSuccess: () => void;
}

export const IdentityVerificationModal = ({
  open,
  onOpenChange,
  contractId,
  contractToken,
  signeeName,
  signeeEmail,
  onSuccess,
}: IdentityVerificationModalProps) => {
  const [step, setStep] = useState<
    "form" | "signature" | "verifying" | "success"
  >("form");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nin, setNin] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [signature, setSignature] = useState("");
  const [isLoadingSignature, setIsLoadingSignature] = useState(false);
  const { toast } = useToast();

  // Load saved signature from database
  const loadSavedSignature = async () => {
    try {
      const res = await fetch(`/api/saved-signature?userId=${contractId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (res.ok && data.success && data.signature) {
        setSignature(data.signature);
        toast({
          title: "Signature Loaded",
          description: "Your saved signature has been loaded.",
        });
      } else {
        toast({
          title: "No Saved Signature",
          description: "No saved signature found. Please draw your signature.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error loading signature:", error);
      toast({
        title: "Error",
        description: "Failed to load saved signature.",
        variant: "destructive",
      });
    }
  };

  // Initialize form with signee name
  useEffect(() => {
    if (signeeName && open) {
      const names = signeeName.split(" ");
      setFirstName(names[0] || "");
      setLastName(names.slice(1).join(" ") || "");
    }
  }, [signeeName, open]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !nin) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    if (nin.length !== 11) {
      toast({
        title: "Error",
        description: "NIN must be 11 digits",
        variant: "destructive",
      });
      return;
    }
    setStep("signature");
  };

  const handleAuthenticate = async () => {
    if (!signature || signature === "") {
      toast({
        title: "Error",
        description: "Please provide your signature",
        variant: "destructive",
      });
      return;
    }

    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter the 6-digit verification code",
        variant: "destructive",
      });
      return;
    }

    setStep("verifying");

    try {
      const response = await fetch("/api/contract/sign-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractId,
          contractToken,
          signeeName: `${firstName} ${lastName}`.trim(),
          signeeEmail,
          nin,
          verificationCode,
          signature: signature,
          step: "verify",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to sign contract");
      }

      setStep("success");

      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
        // Reset state
        setStep("form");
        setFirstName("");
        setLastName("");
        setNin("");
        setVerificationCode("");
        setSignature("");
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to sign contract",
        variant: "destructive",
      });
      setStep("signature");
    }
  };

  const handleSendVerificationCode = async () => {
    if (!signeeEmail) {
      toast({
        title: "Error",
        description: "No email address found",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/contract/sign-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractToken,
          signeeEmail,
          step: "send-code",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send verification code");
      }

      toast({
        title: "Verification code sent",
        description: "Check your email for the 6-digit code",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to send verification code",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-pop squircle-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[var(--text-primary)]">
            <Shield className="h-5 w-5 text-[var(--color-accent-yellow)]" />
            Identity Verification
          </DialogTitle>
          <DialogDescription className="text-[var(--text-secondary)]">
            We verify your identity to prevent fraudulent contracts and ensure
            legal validity
          </DialogDescription>
        </DialogHeader>

        {step === "form" && (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-[var(--text-secondary)]">
                First Name *
              </Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter your first name"
                required
                className="border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)]"
                style={{ outline: "none", boxShadow: "none" }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-[var(--text-secondary)]">
                Last Name *
              </Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter your last name"
                required
                className="border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)]"
                style={{ outline: "none", boxShadow: "none" }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nin" className="text-[var(--text-secondary)]">
                National Identification Number (NIN) *
              </Label>
              <Input
                id="nin"
                value={nin}
                onChange={(e) =>
                  setNin(e.target.value.replace(/\D/g, "").slice(0, 11))
                }
                placeholder="Enter your 11-digit NIN"
                required
                maxLength={11}
                className="border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)]"
                style={{ outline: "none", boxShadow: "none" }}
              />
              <div className="flex items-start gap-2 text-xs text-[var(--text-secondary)] mt-1">
                <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
                <p>
                  Your NIN is used to verify your identity and prevent
                  fraudulent contracts
                </p>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-[var(--color-accent-yellow)] hover:bg-[var(--color-accent-yellow)]/90 text-[var(--color-ink)] squircle-md"
            >
              Continue to Signature
            </Button>
          </form>
        )}

        {step === "signature" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <SignaturePad
                value={signature}
                onChange={setSignature}
                label="Draw Your Signature *"
                disabled={false}
                onLoadSaved={loadSavedSignature}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[var(--text-secondary)]">
                Verification Code *
              </Label>
              <div className="flex gap-2">
                <Input
                  value={verificationCode}
                  onChange={(e) =>
                    setVerificationCode(
                      e.target.value.replace(/\D/g, "").slice(0, 6),
                    )
                  }
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="flex-1 border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)]"
                  style={{ outline: "none", boxShadow: "none" }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSendVerificationCode}
                  className="border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] squircle-md"
                >
                  Send Code
                </Button>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                A 6-digit verification code has been sent to your email
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] squircle-md"
                onClick={() => setStep("form")}
              >
                Back
              </Button>
              <Button
                type="button"
                className="flex-1 bg-[var(--color-accent-yellow)] hover:bg-[var(--color-accent-yellow)]/90 text-[var(--color-ink)] squircle-md"
                onClick={handleAuthenticate}
              >
                Authenticate & Sign
              </Button>
            </div>
          </div>
        )}

        {step === "verifying" && (
          <div className="py-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-[var(--color-accent-yellow)] mx-auto mb-4" />
            <p className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              Verifying Your Identity
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              Checking NIN and verifying your signature...
            </p>
          </div>
        )}

        {step === "success" && (
          <div className="py-8 text-center">
            <CheckCircle className="h-16 w-16 text-[var(--color-lemon-green)] mx-auto mb-4" />
            <p className="text-xl font-bold text-[var(--text-primary)] mb-2">
              Contract Signed Successfully!
            </p>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Check your email for the signed contract document
            </p>
            <Badge
              variant="outline"
              className="bg-[var(--color-lemon-green)]/10 text-[var(--color-lemon-green)] border-[var(--color-lemon-green)]/20"
            >
              Legally Binding
            </Badge>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};