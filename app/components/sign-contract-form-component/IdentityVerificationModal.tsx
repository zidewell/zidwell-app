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
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 400, height: 150 });
  const { toast } = useToast();
  // Initialize form with signee name
  useEffect(() => {
    if (signeeName && open) {
      const names = signeeName.split(" ");
      setFirstName(names[0] || "");
      setLastName(names.slice(1).join(" ") || "");
    }
  }, [signeeName, open]);

  // Update canvas size
  useEffect(() => {
    const updateCanvasSize = () => {
      setCanvasSize({ width: 400, height: 150 });
    };
    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#000000";
  }, [canvasSize]);

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    const { x, y } = getCanvasCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCanvasCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

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
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Check if signature is empty
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hasSignature = imageData.data.some((pixel) => pixel !== 0);

    if (!hasSignature) {
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
      const signatureDataUrl = canvas.toDataURL("image/png");

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
          signature: signatureDataUrl,
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
        clearSignature();
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#C29307]" />
            Identity Verification
          </DialogTitle>
          <DialogDescription>
            We verify your identity to prevent fraudulent contracts and ensure
            legal validity
          </DialogDescription>
        </DialogHeader>

        {step === "form" && (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter your first name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter your last name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nin">
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
              />
              <div className="flex items-start gap-2 text-xs text-muted-foreground mt-1">
                <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
                <p>
                  Your NIN is used to verify your identity and prevent
                  fraudulent contracts
                </p>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#C29307] hover:bg-[#b38606]"
            >
              Continue to Signature
            </Button>
          </form>
        )}

        {step === "signature" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Draw Your Signature *</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                <canvas
                  ref={canvasRef}
                  width={canvasSize.width}
                  height={canvasSize.height}
                  className="w-full h-40 bg-white rounded cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                />
              </div>
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearSignature}
                >
                  Clear Signature
                </Button>
                <span className="text-xs text-gray-500 self-center">
                  Click and drag to draw your signature
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Verification Code *</Label>
              <div className="flex gap-2">
                <Input
                  value={verificationCode}
                  onChange={(e) =>
                    setVerificationCode(
                      e.target.value.replace(/\D/g, "").slice(0, 6)
                    )
                  }
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSendVerificationCode}
                >
                  Send Code
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                A 6-digit verification code has been sent to your email
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setStep("form")}
              >
                Back
              </Button>
              <Button
                type="button"
                className="flex-1 bg-[#C29307] hover:bg-[#b38606]"
                onClick={handleAuthenticate}
              >
                Authenticate & Sign
              </Button>
            </div>
          </div>
        )}

        {step === "verifying" && (
          <div className="py-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-[#C29307] mx-auto mb-4" />
            <p className="text-lg font-semibold mb-2">
              Verifying Your Identity
            </p>
            <p className="text-sm text-muted-foreground">
              Checking NIN and verifying your signature...
            </p>
          </div>
        )}

        {step === "success" && (
          <div className="py-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <p className="text-xl font-bold mb-2">
              Contract Signed Successfully!
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Check your email for the signed contract document
            </p>
            <Badge
              variant="outline"
              className="bg-green-50 text-green-700 border-green-200"
            >
              Legally Binding
            </Badge>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
