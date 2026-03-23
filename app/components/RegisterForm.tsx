"use client";

import { useState } from "react";
import { z } from "zod";
import confetti from "canvas-confetti";
import {
  Eye,
  EyeOff,
  Info,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Progress } from "./ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import Swal from "sweetalert2";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button2 } from "./ui/button2";

// Validation schemas per step
const step1Schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  phone: z
    .string()
    .trim()
    .regex(/^\d{11}$/, "Phone number must be 11 digits"),
  email: z.string().trim().email("Invalid email address").max(255),
});

const step2Schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const step3Schema = z
  .object({
    bvn: z.string().regex(/^\d{11}$/, "BVN must be exactly 11 digits"),
    pin: z.string().regex(/^\d{4}$/, "PIN must be exactly 4 digits"),
    confirmPin: z.string(),
  })
  .refine((d) => d.pin === d.confirmPin, {
    message: "PINs do not match",
    path: ["confirmPin"],
  });

const TOTAL_STEPS = 3;

const RegisterForm = () => {
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  // Step 1
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Step 2
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 3
  const [wantsBankAccount, setWantsBankAccount] = useState(false);
  const [bvn, setBvn] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  const progress = (step / TOTAL_STEPS) * 100;

  const validateStep = (): boolean => {
    setErrors({});
    try {
      if (step === 1) {
        step1Schema.parse({ name, phone, email });
      } else if (step === 2) {
        step2Schema.parse({ password, confirmPassword });
      } else if (step === 3 && wantsBankAccount) {
        step3Schema.parse({ bvn, pin, confirmPin });
      }
      return true;
    } catch (e) {
      if (e instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        e.errors.forEach((err) => {
          const field = err.path[0] as string;
          newErrors[field] = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      setErrors({});
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setErrors({});
    }
  };

  const triggerConfetti = () => {
    const end = Date.now() + 2000;
    const colors = ["#2b825b", "#22c55e", "#3b82f6", "#ef4444", "#8b5cf6"];
    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
          bvn: wantsBankAccount ? bvn : undefined,
          transactionPin: wantsBankAccount ? pin : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      triggerConfetti();
      setShowSuccess(true);

      // Reset form
      setName("");
      setPhone("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setBvn("");
      setPin("");
      setConfirmPin("");
      setWantsBankAccount(false);
      setStep(1);
    } catch (error: any) {
      console.error("Registration error:", error);
      Swal.fire({
        icon: "error",
        title: "Registration Failed",
        text: error.message || "Something went wrong. Please try again.",
        confirmButtonColor: "#2b825b",
      });
      setErrors({ form: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const stepLabels = ["Basic Info", "Security", "Wallet"];

  return (
    <div className="w-full max-w-md mx-auto py-8 px-4">
      {/* Mobile logo - visible only on mobile */}
      <div className="lg:hidden text-center mb-8">
        <h1 className="text-3xl font-bold text-[#2b825b]">Zidwell</h1>
        <p className="text-xs text-[hsl(30,8%,50%)] tracking-widest uppercase font-sans mt-1">
          Financial Wellness
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between mb-3">
          {stepLabels.map((label, i) => (
            <div key={label} className="flex items-center gap-1.5">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold font-sans transition-colors ${
                  i + 1 <= step
                    ? "bg-[#2b825b] text-white"
                    : "bg-[hsl(40,20%,95%)] text-[hsl(30,8%,50%)]"
                }`}
              >
                {i + 1 < step ? <CheckCircle className="h-4 w-4" /> : i + 1}
              </div>
              <span className="text-xs font-sans text-[hsl(30,8%,50%)] hidden sm:inline">
                {label}
              </span>
            </div>
          ))}
        </div>
        <Progress value={progress} className="h-1.5 [&>div]:bg-[#2b825b]" />
      </div>

      {/* Form Error */}
      {errors.form && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{errors.form}</p>
        </div>
      )}

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="space-y-5 animate-fade-in">
          <div>
            <h2 className="text-2xl font-bold">Let's get started!</h2>
            <p className="text-[hsl(30,8%,50%)] font-sans text-sm mt-1">
              Join thousands of Nigerian businesses managing their finances
              smarter.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="font-sans">
                Full Name
              </Label>
              <Input
                id="name"
                placeholder="e.g. Adebayo Olaoluwa"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={errors.name ? "border-[hsl(0,84%,60%)]" : ""}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-xs text-[hsl(0,84%,60%)] mt-1 font-sans">
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="phone" className="font-sans">
                Phone Number
              </Label>
              <Input
                id="phone"
                placeholder="08012345678"
                inputMode="numeric"
                maxLength={11}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                className={errors.phone ? "border-[hsl(0,84%,60%)]" : ""}
                disabled={isLoading}
              />
              {errors.phone && (
                <p className="text-xs text-[hsl(0,84%,60%)] mt-1 font-sans">
                  {errors.phone}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="email" className="font-sans">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={errors.email ? "border-[hsl(0,84%,60%)]" : ""}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-xs text-[hsl(0,84%,60%)] mt-1 font-sans">
                  {errors.email}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Security */}
      {step === 2 && (
        <div className="space-y-5 animate-fade-in">
          <div>
            <h2 className="text-2xl font-bold">Secure your account</h2>
            <p className="text-[hsl(30,8%,50%)] font-sans text-sm mt-1">
              Create a strong password to protect your business data.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="password" className="font-sans">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={
                    errors.password ? "border-[hsl(0,84%,60%)] pr-10" : "pr-10"
                  }
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(30,8%,50%)] hover:text-[hsl(30,10%,12%)]"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-[hsl(0,84%,60%)] mt-1 font-sans">
                  {errors.password}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="font-sans">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={
                    errors.confirmPassword
                      ? "border-[hsl(0,84%,60%)] pr-10"
                      : "pr-10"
                  }
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(30,8%,50%)] hover:text-[hsl(30,10%,12%)]"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-[hsl(0,84%,60%)] mt-1 font-sans">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Bank Account */}
      {step === 3 && (
        <div className="space-y-5 animate-fade-in">
          <div>
            <h2 className="text-2xl font-bold">Business Bank Account</h2>
            <p className="text-[hsl(30,8%,50%)] font-sans text-sm mt-1">
              Optional: Set up a dedicated account for your business finances.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border bg-white p-4">
            <div>
              <p className="font-sans font-medium text-sm">
                Do you want a business bank account?
              </p>
              <p className="text-xs text-[hsl(30,8%,50%)] font-sans mt-0.5">
                You can always set this up later
              </p>
            </div>
            <Switch
              checked={wantsBankAccount}
              onCheckedChange={setWantsBankAccount}
              disabled={isLoading}
            />
          </div>

          {wantsBankAccount && (
            <div className="space-y-4 animate-fade-in">
              {/* BVN info banner */}
              <div className="rounded-lg border border-[#2b825b]/30 bg-[#2b825b]/5 p-3 flex gap-2 items-start">
                <Info className="h-4 w-4 text-[#2b825b] mt-0.5 shrink-0" />
                <p className="text-xs text-[hsl(30,10%,12%)]/80 font-sans">
                  <strong>CBN Regulation:</strong> Your Bank Verification Number
                  (BVN) is required to open a business account. It is securely
                  encrypted and never shared.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-1">
                  <Label htmlFor="bvn" className="font-sans">
                    BVN
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-[hsl(30,8%,50%)] cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs font-sans text-xs">
                      The Central Bank of Nigeria (CBN) requires BVN
                      verification before issuing a virtual account number for
                      financial transactions.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="bvn"
                  placeholder="Enter 11-digit BVN"
                  inputMode="numeric"
                  maxLength={11}
                  value={bvn}
                  onChange={(e) => setBvn(e.target.value.replace(/\D/g, ""))}
                  className={errors.bvn ? "border-[hsl(0,84%,60%)]" : ""}
                  disabled={isLoading}
                />
                {errors.bvn && (
                  <p className="text-xs text-[hsl(0,84%,60%)] mt-1 font-sans">
                    {errors.bvn}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="pin" className="font-sans">
                  Transaction PIN
                </Label>
                <div className="relative">
                  <Input
                    id="pin"
                    type={showPin ? "text" : "password"}
                    placeholder="4-digit PIN"
                    inputMode="numeric"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    className={
                      errors.pin ? "border-[hsl(0,84%,60%)] pr-10" : "pr-10"
                    }
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(30,8%,50%)] hover:text-[hsl(30,10%,12%)]"
                    disabled={isLoading}
                  >
                    {showPin ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.pin && (
                  <p className="text-xs text-[hsl(0,84%,60%)] mt-1 font-sans">
                    {errors.pin}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPin" className="font-sans">
                  Confirm Transaction PIN
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPin"
                    type={showConfirmPin ? "text" : "password"}
                    placeholder="Re-enter PIN"
                    inputMode="numeric"
                    maxLength={4}
                    value={confirmPin}
                    onChange={(e) =>
                      setConfirmPin(e.target.value.replace(/\D/g, ""))
                    }
                    className={
                      errors.confirmPin
                        ? "border-[hsl(0,84%,60%)] pr-10"
                        : "pr-10"
                    }
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPin(!showConfirmPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(30,8%,50%)] hover:text-[hsl(30,10%,12%)]"
                    disabled={isLoading}
                  >
                    {showConfirmPin ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPin && (
                  <p className="text-xs text-[hsl(0,84%,60%)] mt-1 font-sans">
                    {errors.confirmPin}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        {step > 1 ? (
          <Button2
            variant="outline"
            onClick={handleBack}
            className="font-sans gap-2"
            disabled={isLoading}
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button2>
        ) : (
          <div />
        )}
        <Button2
          onClick={handleNext}
          className="font-sans gap-2"
          disabled={isLoading}
        >
          {isLoading ? (
            "Processing..."
          ) : step < TOTAL_STEPS ? (
            <>
              Next <ArrowRight className="h-4 w-4" />
            </>
          ) : (
            "Create Account"
          )}
        </Button2>
      </div>

      {/* Login link */}
      <p className="text-center text-sm text-[hsl(30,8%,50%)] font-sans mt-6">
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="text-[#2b825b] font-medium hover:underline"
        >
          Login instead
        </Link>
      </p>

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="text-center sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-4 text-6xl">🎉</div>
            <DialogTitle className="text-2xl text-center">
              Congratulations!
            </DialogTitle>
            <DialogDescription className="font-sans text-base mt-2 leading-relaxed text-center">
              You've successfully created your Zidwell account! Kindly check
              your email to verify your account.
            </DialogDescription>
          </DialogHeader>
          <Button
            onClick={() => {
              setShowSuccess(false);
              router.push("/auth/login");
            }}
            className="mt-4 font-sans w-full bg-[#2b825b] hover:bg-[#1e5d42]"
          >
            Got it!
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RegisterForm;
