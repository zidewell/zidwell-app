"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import {
  CheckCircle,
  Trash2,
  Shield,
  AlertCircle,
  Loader2,
  Save,
  Mail,
  Upload,
  Receipt,
} from "lucide-react";
import Swal from "sweetalert2";
import confetti from "canvas-confetti";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { SignaturePad } from "../SignaturePad";

interface ReceiptSignaturePanelProps {
  receiptId: string;
  receiptToken: string;
  signeeName: string;
  signeeEmail: string;
  receiptTitle: string;
  businessName: string;
  clientName: string;
  totalAmount: number;
  issueDate: string;
  onSignatureComplete: (signatureData: string) => void;
  onCancel: () => void;
}

export const ReceiptSignaturePanel = ({
  receiptId,
  receiptToken,
  signeeName,
  signeeEmail,
  receiptTitle,
  businessName,
  clientName,
  totalAmount,
  issueDate,
  onSignatureComplete,
  onCancel,
}: ReceiptSignaturePanelProps) => {
  const [step, setStep] = useState<"verification" | "signature" | "review">(
    "verification",
  );
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [typedName, setTypedName] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [signingTimestamp, setSigningTimestamp] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [sendCooldown, setSendCooldown] = useState(0);
  const [signatureMode, setSignatureMode] = useState<"draw" | "upload">("draw");
  const [storedVerificationCode, setStoredVerificationCode] =
    useState<string>("");

  // Confetti function
  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#2b825b", "#ffd700", "#ffed4e", "#ffffff", "#fbbf24"],
    });

    setTimeout(() => {
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#2b825b", "#ffd700", "#ffed4e"],
      });
      confetti({
        particleCount: 80,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#2b825b", "#ffd700", "#ffed4e"],
      });
    }, 150);

    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.8 },
        colors: ["#2b825b", "#ffd700", "#ffed4e"],
      });
    }, 300);
  };

  // Initialize with signee name
  useEffect(() => {
    if (signeeName) {
      setTypedName(signeeName);
    }
  }, [signeeName]);

  // Handle cooldown timer for sending verification code
  useEffect(() => {
    if (sendCooldown > 0) {
      const timer = setInterval(() => {
        setSendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [sendCooldown]);

  // Alert functions
  const showSuccessAlert = (title: string, text: string) => {
    return Swal.fire({
      title,
      text,
      icon: "success",
      confirmButtonText: "OK",
      confirmButtonColor: "#2b825b",
      background: "#fafafa",
      iconColor: "#2b825b",
      timer: 3000,
      timerProgressBar: true,
    });
  };

  const showErrorAlert = (title: string, text: string) => {
    return Swal.fire({
      title,
      text,
      icon: "error",
      confirmButtonText: "OK",
      confirmButtonColor: "#ef4444",
      background: "#fafafa",
      iconColor: "#ef4444",
    });
  };

  // Handle signature change from SignaturePad
  const handleSignatureChange = (dataUrl: string) => {
    setSignatureData(dataUrl);
  };

  // Clear signature
  const handleClearSignature = () => {
    setSignatureData(null);
  };

  // Verification functions
  const handleVerification = async () => {
    setIsVerifying(true);

    if (!verificationCode || verificationCode.length !== 6) {
      showErrorAlert(
        "Invalid Code",
        "Please enter a valid 6-digit verification code",
      );
      setIsVerifying(false);
      return;
    }

    try {
      console.log("Verifying code:", verificationCode);

      const response = await fetch("/api/receipt/verify-signature-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiptToken,
          signeeEmail,
          verificationCode,
        }),
      });

      const result = await response.json();
      console.log("Verification response:", result);

      if (!response.ok) {
        throw new Error(result.error || "Verification failed");
      }

      // Store verification code for signing
      setStoredVerificationCode(verificationCode);
      setStep("signature");
      setIsVerifying(false);
      showSuccessAlert(
        "Verified!",
        "Identity verified successfully. You can now sign the receipt.",
      );
    } catch (error) {
      console.error("Verification error:", error);
      setIsVerifying(false);
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= 3) {
        showErrorAlert(
          "Too Many Attempts",
          "Please request a new verification code",
        );
        setVerificationCode("");
      } else {
        showErrorAlert(
          "Verification Failed",
          error instanceof Error ? error.message : "Invalid verification code",
        );
      }
    }
  };

  const handleSendVerificationCode = async () => {
    if (sendCooldown > 0) return;

    setIsSendingCode(true);
    setCodeSent(false);

    try {
      const response = await fetch("/api/receipt/send-signature-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiptToken,
          signeeEmail,
          signeeName,
          businessName,
          totalAmount,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send code");
      }

      setCodeSent(true);
      setSendCooldown(60);
      showSuccessAlert(
        "Code Sent!",
        "Check your email for the verification code",
      );
    } catch (error) {
      console.error("Error sending code:", error);
      showErrorAlert(
        "Error",
        error instanceof Error ? error.message : "Failed to send code",
      );
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleProceedToSignature = () => {
    if (!signatureData) {
      showErrorAlert(
        "Signature Required",
        "Please provide your signature before proceeding",
      );
      return;
    }

    if (!typedName.trim()) {
      showErrorAlert("Name Required", "Please enter your full name");
      return;
    }

    setSigningTimestamp(new Date().toISOString());
    setStep("review");
  };

  const handleConfirmSign = async () => {
    setIsSigning(true);

    try {
      if (!signatureData) {
        throw new Error("No signature data available");
      }

      console.log("Sending sign request with code:", storedVerificationCode);

      const response = await fetch("/api/receipt/sign-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiptToken,
          signeeName: typedName,
          signeeEmail,
          signatureImage: signatureData,
          verificationCode: storedVerificationCode, // Include the verified code
        }),
      });

      const result = await response.json();
      console.log("Sign response:", result);

      if (!response.ok) {
        throw new Error(result.error || "Failed to sign receipt");
      }

      // First close the SignaturePanel
      onSignatureComplete(signatureData);

      // Small delay to ensure panel is closed before showing confetti
      setTimeout(() => {
        // Trigger confetti after panel is closed
        triggerConfetti();

        // Show success message
        Swal.fire({
          title: "🎉 Receipt Signed Successfully!",
          html: `
          <div class="text-center">
            <div class="mb-4">
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#FEFCE8] mb-3">
                <svg class="w-8 h-8 text-[#2b825b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 class="text-lg font-bold text-gray-900 mb-2">Receipt Signed!</h3>
            </div>
            <div class="space-y-2 text-gray-600">
              <p class="flex items-center justify-center gap-1">
                <svg class="w-4 h-4 text-[#2b825b]" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
                Digital signature recorded
              </p>
              <p class="flex items-center justify-center gap-1">
                <svg class="w-4 h-4 text-[#2b825b]" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
                Legal acknowledgement generated
              </p>
              <p class="flex items-center justify-center gap-1">
                <svg class="w-4 h-4 text-[#2b825b]" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
                Email sent with signed copy
              </p>
            </div>
          </div>
        `,
          icon: "success",
          showConfirmButton: false,
          background: "#fafafa",
          iconColor: "#10b981",
          allowOutsideClick: false,
          allowEscapeKey: false,
          timer: 3000,
          timerProgressBar: true,
        }).then(() => {
          // Refresh the page after SweetAlert closes
          window.location.reload();
        });

        // Backup refresh in case SweetAlert has issues
        setTimeout(() => {
          window.location.reload();
        }, 4000);
      }, 300);
    } catch (error) {
      // Show error and reset signing state
      console.error("Signing error:", error);
      showErrorAlert(
        "Error",
        error instanceof Error ? error.message : "Failed to sign receipt",
      );
      setIsSigning(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#2b825b]" />
            Secure Receipt Signature Panel
          </DialogTitle>
          <DialogDescription>
            Sign and acknowledge receipt of items/services
          </DialogDescription>
        </DialogHeader>

        {/* Receipt Summary */}
        <div className="bg-linear-to-r from-[#2b825b]/10 to-[#b38606]/10 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#2b825b]/20 rounded-lg flex items-center justify-center">
                <Receipt className="h-5 w-5 text-[#2b825b]" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{receiptTitle}</h3>
                <p className="text-sm text-gray-600">
                  {businessName} → {clientName}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-[#2b825b]">
                {formatCurrency(totalAmount)}
              </p>
              <p className="text-sm text-gray-600">{formatDate(issueDate)}</p>
            </div>
          </div>
        </div>

        {/* Verification Step */}
        {step === "verification" && (
          <div className="space-y-6 py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-800">
                    Identity Verification Required
                  </h4>
                  <p className="text-sm text-blue-700 mt-1">
                    For security, we need to verify it's really you before
                    acknowledging the receipt.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verificationCode">
                  Email Verification Code *
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="verificationCode"
                    value={verificationCode}
                    onChange={(e) =>
                      setVerificationCode(
                        e.target.value.replace(/\D/g, "").slice(0, 6),
                      )
                    }
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    className="text-center text-lg tracking-widest"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSendVerificationCode}
                    className="whitespace-nowrap min-w-[120px]"
                    disabled={isSendingCode || sendCooldown > 0}
                  >
                    {isSendingCode ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : sendCooldown > 0 ? (
                      `Resend (${sendCooldown}s)`
                    ) : codeSent ? (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Resend Code
                      </>
                    ) : (
                      "Send Code"
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  {codeSent
                    ? `A 6-digit verification code has been sent to ${signeeEmail}`
                    : `Enter the verification code sent to ${signeeEmail}`}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={onCancel}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="flex-1 bg-[#2b825b] hover:bg-[#1e5d42]"
                  onClick={handleVerification}
                  disabled={
                    !verificationCode ||
                    verificationCode.length !== 6 ||
                    isVerifying
                  }
                >
                  {isVerifying ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying...
                    </span>
                  ) : (
                    "Verify & Continue"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Signature Step */}
        {step === "signature" && (
          <div className="space-y-6 py-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-800">
                    Legal Acknowledgement
                  </h4>
                  <p className="text-sm text-amber-700 mt-1">
                    Your signature confirms that you have received and accepted
                    the items/services described in this receipt.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="typedName">Your Full Name *</Label>
                <Input
                  id="typedName"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  placeholder="Enter your full name as it should appear on the receipt"
                  className="text-lg"
                />
                <p className="text-xs text-gray-500">
                  This should match the name provided by {businessName}
                </p>
              </div>

              {/* Signature Mode Selection */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={signatureMode === "draw" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setSignatureMode("draw")}
                >
                  Draw Signature
                </Button>
                <Button
                  type="button"
                  variant={signatureMode === "upload" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setSignatureMode("upload")}
                >
                  Upload Signature
                </Button>
              </div>

              {/* Draw Signature */}
              {signatureMode === "draw" && (
                <div className="space-y-3">
                  <SignaturePad
                    value={signatureData || ""}
                    onChange={handleSignatureChange}
                    label="Draw Your Signature *"
                  />

                  <div className="flex items-start text-xs text-gray-500">
                    <div className="h-2 w-2 bg-gray-400 rounded-full mr-2 mt-1 shrink-0"></div>
                    <p>
                      Draw your signature in the box above. For best results,
                      sign along the line.
                    </p>
                  </div>
                </div>
              )}

              {/* Upload Signature */}
              {signatureMode === "upload" && (
                <div className="space-y-3">
                  <Label>Upload Signature Image</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-sm text-gray-600 mb-2">
                      Upload a clear image of your signature
                    </p>
                    <Input
                      type="file"
                      accept="image/*"
                      className="max-w-xs mx-auto"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setSignatureData(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                </div>
              )}

              {signatureData && (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSignature}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Signature
                  </Button>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep("verification")}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  className="flex-1 bg-[#2b825b] hover:bg-[#1e5d42]"
                  onClick={handleProceedToSignature}
                  disabled={!signatureData || !typedName.trim()}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save & Continue
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Review Step */}
        {step === "review" && (
          <div className="space-y-6 py-4">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-[#2b825b] mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Review Your Acknowledgment
              </h3>
              <p className="text-gray-600">
                Please verify your details before final submission
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">
                        Receipt Information
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">From:</span>
                          <span className="font-medium">{businessName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">To:</span>
                          <span className="font-medium">{clientName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Amount:</span>
                          <span className="font-medium">
                            {formatCurrency(totalAmount)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Date:</span>
                          <span className="font-medium">
                            {formatDate(issueDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-700 mb-2">
                      Your Acknowledgment
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Name:</span>
                        <span className="font-medium">{typedName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Email:</span>
                        <span className="font-medium">{signeeEmail}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">
                          Signed At:
                        </span>
                        <span className="font-medium">
                          {signingTimestamp
                            ? new Date(signingTimestamp).toLocaleString()
                            : "Pending"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium text-gray-700 mb-2">
                    Your Signature
                  </h4>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-center h-32">
                    {signatureData ? (
                      <img
                        src={signatureData}
                        alt="Your signature"
                        className="max-h-20 object-contain"
                      />
                    ) : (
                      <p className="text-gray-400 italic">
                        No signature captured
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-800">
                      Final Confirmation
                    </h4>
                    <p className="text-sm text-red-700 mt-1">
                      By confirming, you acknowledge that you have received and
                      accepted the items/services described in this receipt.
                      This is a legally binding acknowledgment.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep("signature")}
                  disabled={isSigning}
                >
                  Edit Signature
                </Button>
                <Button
                  type="button"
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  onClick={handleConfirmSign}
                  disabled={isSigning}
                >
                  {isSigning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Confirm & Acknowledge Receipt"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
