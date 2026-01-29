"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/app/components/ui/dialog";
import {
  CheckCircle,
  XCircle,
  Trash2,
  Shield,
  Fingerprint,
  AlertCircle,
  Loader2,
  Save,
  Eye,
  EyeOff,
  Mail,
  Upload,
  X,
  ArrowLeft,
  Smartphone,
  Monitor,
} from "lucide-react";
import Swal from "sweetalert2";
import confetti from "canvas-confetti";

import { SignaturePad } from "../SignaturePad";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";

interface SignaturePanelProps {
  contractId: string;
  contractToken: string;
  signeeName: string;
  signeeEmail: string;
  onSignatureComplete: (signatureData: string) => void;
  onCancel: () => void;
}

export const SignaturePanel = ({
  contractId,
  contractToken,
  signeeName,
  signeeEmail,
  onSignatureComplete,
  onCancel,
}: SignaturePanelProps) => {
  const [step, setStep] = useState<
    "verification" | "signature" | "review" | "confirm"
  >("verification");
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [typedName, setTypedName] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [signingTimestamp, setSigningTimestamp] = useState<string | null>(null);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [sendCooldown, setSendCooldown] = useState(0);
  const [signatureMode, setSignatureMode] = useState<"draw" | "upload">("draw");

  // Confetti function
  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#C29307", "#ffd700", "#ffed4e", "#ffffff", "#fbbf24"],
    });

    setTimeout(() => {
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#C29307", "#ffd700", "#ffed4e"],
      });
      confetti({
        particleCount: 80,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#C29307", "#ffd700", "#ffed4e"],
      });
    }, 150);

    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.8 },
        colors: ["#C29307", "#ffd700", "#ffed4e"],
      });
    }, 300);
  };

  // Initialize with signee name
  useEffect(() => {
    if (signeeName) {
      setTypedName(signeeName);
    }
  }, [signeeName]);

  // Check if WebAuthn (biometric) is available
  useEffect(() => {
    if (typeof window !== "undefined" && window.PublicKeyCredential) {
      setIsBiometricEnabled(true);
    }
  }, []);

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
      confirmButtonColor: "#C29307",
      background: "#fafafa",
      iconColor: "#C29307",
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

  const showInfoAlert = (title: string, text: string) => {
    return Swal.fire({
      title,
      text,
      icon: "info",
      confirmButtonText: "OK",
      confirmButtonColor: "#3b82f6",
      background: "#fafafa",
      iconColor: "#3b82f6",
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
        "Please enter a valid 6-digit verification code"
      );
      setIsVerifying(false);
      return;
    }

    try {
      const response = await fetch("/api/contract/verify-signature-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractToken,
          signeeEmail,
          verificationCode,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Verification failed");
      }

      setStep("signature");
      setIsVerifying(false);
      showSuccessAlert(
        "Verified!",
        "Identity verified successfully. You can now sign the contract."
      );
    } catch (error) {
      setIsVerifying(false);
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= 3) {
        showErrorAlert(
          "Too Many Attempts",
          "Please request a new verification code"
        );
        setVerificationCode("");
      } else {
        showErrorAlert(
          "Verification Failed",
          error instanceof Error ? error.message : "Invalid verification code"
        );
      }
    }
  };

  const handleSendVerificationCode = async () => {
    if (sendCooldown > 0) return;

    setIsSendingCode(true);
    setCodeSent(false);

    try {
      const response = await fetch("/api/contract/send-signature-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractToken,
          signeeEmail,
          signeeName,
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
        "Check your email for the verification code"
      );
    } catch (error) {
      showErrorAlert(
        "Error",
        error instanceof Error ? error.message : "Failed to send code"
      );
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleBiometricSign = async () => {
    if (!isBiometricEnabled) {
      showErrorAlert(
        "Biometric Not Available",
        "Your device doesn't support biometric authentication"
      );
      return;
    }

    try {
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32),
          rp: {
            name: "Zidwell Contracts",
            id: window.location.hostname,
          },
          user: {
            id: new Uint8Array(16),
            name: signeeEmail,
            displayName: signeeName,
          },
          pubKeyCredParams: [
            { type: "public-key", alg: -7 },
            { type: "public-key", alg: -257 },
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
          },
          timeout: 60000,
          attestation: "direct",
        },
      });

      if (credential) {
        setStep("review");
        showSuccessAlert(
          "Biometric Verified!",
          "Your identity has been verified with biometrics"
        );
      }
    } catch (error) {
      showErrorAlert(
        "Biometric Failed",
        "Please use traditional signature method"
      );
    }
  };

  const handleProceedToSignature = () => {
    if (!signatureData) {
      showErrorAlert(
        "Signature Required",
        "Please provide your signature before proceeding"
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

      const response = await fetch("/api/contract/sign-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractToken,
          signeeName: typedName,
          signeeEmail,
          signatureImage: signatureData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to sign contract");
      }

      // First close the SignaturePanel
      onSignatureComplete(signatureData);

      // Small delay to ensure panel is closed before showing confetti
      setTimeout(() => {
        // Trigger confetti after panel is closed
        triggerConfetti();

        // Show success message
        Swal.fire({
          title: "🎉 Contract Signed Successfully!",
          html: `
          <div class="text-center">
            <div class="mb-4">
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#FEFCE8] mb-3">
                <svg class="w-8 h-8 text-[#C29307]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 class="text-lg font-bold text-gray-900 mb-2">Contract Signed!</h3>
            </div>
            <div class="space-y-2 text-gray-600">
              <p class="flex items-center justify-center gap-1">
                <svg class="w-4 h-4 text-[#C29307]" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
                Digital signature recorded
              </p>
              <p class="flex items-center justify-center gap-1">
                <svg class="w-4 h-4 text-[#C29307]" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
                Legal certificate generated
              </p>
              <p class="flex items-center justify-center gap-1">
                <svg class="w-4 h-4 text-[#C29307]" fill="currentColor" viewBox="0 0 20 20">
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
      showErrorAlert(
        "Error",
        error instanceof Error ? error.message : "Failed to sign contract"
      );
      setIsSigning(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="w-[95vw] max-w-lg sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-0 sm:p-6">
        {/* Mobile Header */}
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 sm:hidden">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (step === "signature") setStep("verification");
                else if (step === "review") setStep("signature");
                else onCancel();
              }}
              className="text-[#C29307] h-8 w-8 p-0"
            >
              {step === "verification" ? (
                <X className="h-5 w-5" />
              ) : (
                <ArrowLeft className="h-5 w-5" />
              )}
            </Button>
            <div className="text-center flex-1">
              <h3 className="text-sm font-semibold">
                {step === "verification" && "Verify Identity"}
                {step === "signature" && "Add Signature"}
                {step === "review" && "Review Signature"}
              </h3>
            </div>
            <div className="w-8" /> {/* Spacer for balance */}
          </div>
          {/* Progress Steps */}
          <div className="flex items-center justify-center mt-3">
            <div className="flex items-center">
              <div
                className={`h-2 w-2 rounded-full ${
                  step === "verification" ? "bg-[#C29307]" : "bg-gray-300"
                }`}
              />
              <div
                className={`h-0.5 w-8 ${
                  step !== "verification" ? "bg-[#C29307]" : "bg-gray-300"
                }`}
              />
              <div
                className={`h-2 w-2 rounded-full ${
                  step === "signature"
                    ? "bg-[#C29307]"
                    : step === "review"
                    ? "bg-[#C29307]"
                    : "bg-gray-300"
                }`}
              />
              <div
                className={`h-0.5 w-8 ${
                  step === "review" ? "bg-[#C29307]" : "bg-gray-300"
                }`}
              />
              <div
                className={`h-2 w-2 rounded-full ${
                  step === "review" ? "bg-[#C29307]" : "bg-gray-300"
                }`}
              />
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-0">
          {/* Desktop Header */}
          <DialogHeader className="hidden sm:block">
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#C29307]" />
              Secure Signature Panel
            </DialogTitle>
          </DialogHeader>

          {/* Verification Step */}
          {step === "verification" && (
            <div className="space-y-6 py-2 sm:py-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-800 text-sm sm:text-base">
                      Two-Factor Authentication Required
                    </h4>
                    <p className="text-xs sm:text-sm text-blue-700 mt-1">
                      For security, we need to verify it's really you before
                      signing.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="verificationCode"
                    className="text-sm sm:text-base"
                  >
                    Email Verification Code *
                  </Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      id="verificationCode"
                      value={verificationCode}
                      onChange={(e) =>
                        setVerificationCode(
                          e.target.value.replace(/\D/g, "").slice(0, 6)
                        )
                      }
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      className="text-center text-lg tracking-widest h-12 sm:h-10"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSendVerificationCode}
                      className="whitespace-nowrap h-12 sm:h-10"
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

                <div className="flex flex-col sm:flex-row gap-3 pt-2 sm:pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-12 sm:h-10"
                    onClick={onCancel}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="flex-1 h-12 sm:h-10 bg-[#C29307] hover:bg-[#b38606]"
                    onClick={handleVerification}
                    disabled={
                      !verificationCode ||
                      verificationCode.length !== 6 ||
                      isVerifying
                    }
                  >
                    {isVerifying ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Checking...
                      </span>
                    ) : (
                      "Verify & Continue"
                    )}
                  </Button>
                </div>

                {/* Mobile Helper */}
                <div className="block sm:hidden pt-4">
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                    <Smartphone className="h-4 w-4" />
                    <span>
                      Use landscape mode for better signature experience
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Signature Step with SignaturePad */}
          {step === "signature" && (
            <div className="space-y-6 py-2 sm:py-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-amber-800 text-sm sm:text-base">
                      Legal Notice
                    </h4>
                    <p className="text-xs sm:text-sm text-amber-700 mt-1">
                      Your signature is legally binding. By signing, you
                      acknowledge that you have read, understood, and agree to
                      all terms of this contract.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="typedName" className="text-sm sm:text-base">
                    Contract Signer Name *
                  </Label>
                  <Input
                    id="typedName"
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    placeholder="Enter your full name as it should appear on the contract"
                    className="text-base sm:text-lg h-12 sm:h-10"
                    disabled
                  />
                </div>

                {/* Use SignaturePad component with mobile optimizations */}
                <div className="space-y-3">
                  <div className="relative">
                    <SignaturePad
                      value={signatureData || ""}
                      onChange={handleSignatureChange}
                      label="Your Signature *"
                    />
                    {signatureData && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleClearSignature}
                        className="absolute top-2 right-2 z-10 h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="flex items-start text-xs text-gray-500">
                    <div className="h-2 w-2 bg-gray-400 rounded-full mr-2 mt-1 shrink-0"></div>
                    <p className="text-xs sm:text-sm">
                      Draw your signature using your finger or mouse. For best
                      results on mobile, use landscape mode.
                    </p>
                  </div>
                </div>

                {/* Mobile Helper */}
                <div className="block sm:hidden bg-blue-50 border border-blue-100 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="shrink-0">
                      <Monitor className="h-4 w-4 text-blue-600" />
                    </div>
                    <p className="text-xs text-blue-700">
                      <strong>Tip:</strong> Rotate your phone sideways for a
                      larger drawing area
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2 sm:pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-12 sm:h-10"
                    onClick={() => setStep("verification")}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    className="flex-1 h-12 sm:h-10 bg-[#C29307] hover:bg-[#b38606]"
                    onClick={handleProceedToSignature}
                    disabled={!signatureData || !typedName.trim()}
                  >
                    <Save className="h-4 w-4 mr-2 hidden sm:inline" />
                    Save & Continue
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Review Step */}
          {step === "review" && (
            <div className="space-y-6 py-2 sm:py-4">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 text-[#C29307] mx-auto mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">
                  Review Your Signature
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Please verify your signature before final submission
                </p>
              </div>

              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-700 text-sm sm:text-base mb-2">
                          Signatory Information
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs sm:text-sm text-gray-500">
                              Name:
                            </span>
                            <span className="font-medium text-sm sm:text-base">
                              {typedName}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs sm:text-sm text-gray-500">
                              Email:
                            </span>
                            <span className="font-medium text-sm sm:text-base">
                              {signeeEmail}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs sm:text-sm text-gray-500">
                              Signed At:
                            </span>
                            <span className="font-medium text-xs sm:text-sm">
                              {signingTimestamp
                                ? new Date(signingTimestamp).toLocaleString()
                                : "Pending"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-700 text-sm sm:text-base mb-2">
                        Your Signature
                      </h4>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4 flex items-center justify-center h-24 sm:h-32">
                        {signatureData ? (
                          <img
                            src={signatureData}
                            alt="Your signature"
                            className="max-h-16 sm:max-h-20 object-contain"
                          />
                        ) : (
                          <p className="text-gray-400 italic text-sm">
                            No signature captured
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-semibold text-red-800 text-sm sm:text-base">
                        Final Warning
                      </h4>
                      <p className="text-xs sm:text-sm text-red-700 mt-1">
                        Once confirmed, this action cannot be undone. Your
                        signature will be legally binding.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-12 sm:h-10"
                    onClick={() => setStep("signature")}
                    disabled={isSigning}
                  >
                    Edit Signature
                  </Button>
                  <Button
                    type="button"
                    className="flex-1 h-12 sm:h-10 bg-red-600 hover:bg-red-700"
                    onClick={handleConfirmSign}
                    disabled={isSigning}
                  >
                    {isSigning ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Confirm & Sign Contract"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 sm:hidden">
          <div className="text-center">
            <p className="text-xs text-gray-500">
              <Shield className="inline h-3 w-3 mr-1" />
              Secure signing powered by Zidwell
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
