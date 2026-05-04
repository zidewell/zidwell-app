// app/components/RegisterForm.tsx
"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import confetti from "canvas-confetti";
import {
  Eye,
  EyeOff,
  Info,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Shield,
  XCircle,
  AlertCircle,
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

// Validation schemas per step
const step1Schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  phone: z
    .string()
    .trim()
    .regex(/^\d{11}$/, "Phone number must be 11 digits"),
  email: z.string().trim().email("Invalid email address").max(255),
});

// Enhanced password validation schema
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be less than 128 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character",
  );

const step2Schema = z
  .object({
    password: passwordSchema,
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

// Password strength calculator
const calculatePasswordStrength = (
  password: string,
): {
  score: number;
  strength: string;
  color: string;
  requirements: { label: string; met: boolean }[];
} => {
  const requirements = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "At least 1 uppercase letter (A-Z)", met: /[A-Z]/.test(password) },
    { label: "At least 1 lowercase letter (a-z)", met: /[a-z]/.test(password) },
    { label: "At least 1 number (0-9)", met: /[0-9]/.test(password) },
    {
      label: "At least 1 special character (!@#$%^&*)",
      met: /[^A-Za-z0-9]/.test(password),
    },
  ];

  const metCount = requirements.filter((r) => r.met).length;
  const score = (metCount / requirements.length) * 100;

  let strength = "Very Weak";
  let color = "#ef4444"; // red

  if (score === 100) {
    strength = "Strong";
    color = "var(--color-accent-yellow)";
  } else if (score >= 80) {
    strength = "Good";
    color = "#eab308";
  } else if (score >= 60) {
    strength = "Fair";
    color = "#f97316";
  } else if (score >= 40) {
    strength = "Weak";
    color = "#ef4444";
  }

  return { score, strength, color, requirements };
};

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
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    strength: "Very Weak",
    color: "#ef4444",
    requirements: [] as { label: string; met: boolean }[],
  });

  // Step 3
  const [wantsBankAccount, setWantsBankAccount] = useState(false);
  const [bvn, setBvn] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  const progress = (step / TOTAL_STEPS) * 100;

  // Update password strength whenever password changes
  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(password));
  }, [password]);

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
    const colors = [
      "var(--color-accent-yellow)",
      "#FDC020",
      "#eab308",
      "#ca8a04",
    ];
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
        confirmButtonColor: "var(--color-accent-yellow)",
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
        <h1 className="text-3xl font-bold text-(--color-accent-yellow)">
          Zidwell
        </h1>
        <p className="text-xs text-[var(--text-secondary)] tracking-widest uppercase font-sans mt-1">
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
                    ? "bg-(--color-accent-yellow) text-(--color-ink)"
                    : "bg-(--bg-secondary) text-[var(--text-secondary)]"
                }`}
              >
                {i + 1 < step ? <CheckCircle className="h-4 w-4" /> : i + 1}
              </div>
              <span className="text-xs font-sans text-[var(--text-secondary)] hidden sm:inline">
                {label}
              </span>
            </div>
          ))}
        </div>
        <Progress value={progress} className="h-1.5" />
        <style jsx>{`
          :global(.progress-bar-fill) {
            background-color: var(--color-accent-yellow) !important;
          }
        `}</style>
      </div>

      {/* Form Error */}
      {errors.form && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive rounded-lg squircle-md">
          <p className="text-sm text-destructive">{errors.form}</p>
        </div>
      )}

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="space-y-5 animate-fade-in">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">
              Let's get started!
            </h2>
            <p className="text-[var(--text-secondary)] font-sans text-sm mt-1">
              Join thousands of Nigerian businesses managing their finances
              smarter.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label
                htmlFor="name"
                className="font-sans text-[var(--text-primary)]"
              >
                Full Name
              </Label>
              <Input
                id="name"
                placeholder="e.g. Adebayo Olaoluwa"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)] squircle-md ${errors.name ? "border-destructive" : ""}`}
                disabled={isLoading}
                style={{ outline: "none", boxShadow: "none" }}
              />
              {errors.name && (
                <p className="text-xs text-destructive mt-1 font-sans">
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <Label
                htmlFor="phone"
                className="font-sans text-[var(--text-primary)]"
              >
                Phone Number
              </Label>
              <Input
                id="phone"
                placeholder="08012345678"
                inputMode="numeric"
                maxLength={11}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                className={`border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)] squircle-md ${errors.phone ? "border-destructive" : ""}`}
                disabled={isLoading}
                style={{ outline: "none", boxShadow: "none" }}
              />
              {errors.phone && (
                <p className="text-xs text-destructive mt-1 font-sans">
                  {errors.phone}
                </p>
              )}
            </div>

            <div>
              <Label
                htmlFor="email"
                className="font-sans text-[var(--text-primary)]"
              >
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)] squircle-md ${errors.email ? "border-destructive" : ""}`}
                disabled={isLoading}
                style={{ outline: "none", boxShadow: "none" }}
              />
              {errors.email && (
                <p className="text-xs text-destructive mt-1 font-sans">
                  {errors.email}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Security with Enhanced Password Requirements */}
      {step === 2 && (
        <div className="space-y-5 animate-fade-in">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">
              Secure your account
            </h2>
            <p className="text-[var(--text-secondary)] font-sans text-sm mt-1">
              Create a strong password to protect your business data.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label
                htmlFor="password"
                className="font-sans text-[var(--text-primary)]"
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters with uppercase, lowercase, number & special char"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)] pr-10 squircle-md ${errors.password ? "border-destructive" : ""}`}
                  disabled={isLoading}
                  style={{ outline: "none", boxShadow: "none" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Password Strength Progress Bar */}
              {password && (
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Shield
                        className="h-3.5 w-3.5"
                        style={{ color: passwordStrength.color }}
                      />
                      <span
                        className="text-xs font-sans"
                        style={{ color: passwordStrength.color }}
                      >
                        Password Strength: {passwordStrength.strength}
                      </span>
                    </div>
                    <span className="text-xs text-[var(--text-secondary)]">
                      {Math.round(passwordStrength.score)}%
                    </span>
                  </div>
                  <Progress value={passwordStrength.score} className="h-2" />
                </div>
              )}

              {/* Password Requirements Checklist */}
              {password && (
                <div className="mt-3 p-3 bg-(--bg-secondary) rounded-lg space-y-1.5 squircle-md">
                  <p className="text-xs font-medium text-[var(--text-primary)] mb-2 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Password Requirements:
                  </p>
                  {passwordStrength.requirements.map((req, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      {req.met ? (
                        <CheckCircle className="h-3 w-3 text-(--color-accent-yellow)" />
                      ) : (
                        <XCircle className="h-3 w-3 text-destructive" />
                      )}
                      <span
                        className={`text-xs font-sans ${req.met ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}
                      >
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {errors.password && (
                <p className="text-xs text-destructive mt-1 font-sans">
                  {errors.password}
                </p>
              )}
            </div>

            <div>
              <Label
                htmlFor="confirmPassword"
                className="font-sans text-[var(--text-primary)]"
              >
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)] pr-10 squircle-md ${errors.confirmPassword ? "border-destructive" : ""}`}
                  disabled={isLoading}
                  style={{ outline: "none", boxShadow: "none" }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-amber-600 mt-1 font-sans flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Passwords do not match
                </p>
              )}
              {errors.confirmPassword && (
                <p className="text-xs text-destructive mt-1 font-sans">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Password Tips */}
            <div className="rounded-lg bg-(--color-accent-yellow)/10 border border-[var(--color-accent-yellow)]/30 p-3 squircle-md">
              <p className="text-xs font-medium text-[var(--text-primary)] mb-1">
                Password Tip:
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                Use a combination of words, numbers, and symbols that's easy for
                you to remember but hard for others to guess. Consider using a
                passphrase like "MyDogLoves2Eat!@#"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Bank Account */}
      {step === 3 && (
        <div className="space-y-5 animate-fade-in">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">
              Business Bank Account
            </h2>
            <p className="text-[var(--text-secondary)] font-sans text-sm mt-1">
              Optional: Set up a dedicated account for your business finances.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] p-4 squircle-lg">
            <div>
              <p className="font-sans font-medium text-sm text-[var(--text-primary)]">
                Do you want a business bank account?
              </p>
              <p className="text-xs text-[var(--text-secondary)] font-sans mt-0.5">
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
              <div className="rounded-lg border border-[var(--color-accent-yellow)]/30 bg-(--color-accent-yellow)/5 p-3 flex gap-2 items-start squircle-md">
                <Info className="h-4 w-4 text-(--color-accent-yellow) mt-0.5 shrink-0" />
                <p className="text-xs text-[var(--text-secondary)] font-sans">
                  <strong className="text-[var(--text-primary)]">
                    CBN Regulation:
                  </strong>{" "}
                  Your Bank Verification Number (BVN) is required to open a
                  business account. It is securely encrypted and never shared.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-1">
                  <Label
                    htmlFor="bvn"
                    className="font-sans text-[var(--text-primary)]"
                  >
                    BVN
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-[var(--text-secondary)] cursor-help" />
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
                  className={`border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)] squircle-md ${errors.bvn ? "border-destructive" : ""}`}
                  disabled={isLoading}
                  style={{ outline: "none", boxShadow: "none" }}
                />
                {errors.bvn && (
                  <p className="text-xs text-destructive mt-1 font-sans">
                    {errors.bvn}
                  </p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="pin"
                  className="font-sans text-[var(--text-primary)]"
                >
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
                    className={`border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)] pr-10 squircle-md ${errors.pin ? "border-destructive" : ""}`}
                    disabled={isLoading}
                    style={{ outline: "none", boxShadow: "none" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
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
                  <p className="text-xs text-destructive mt-1 font-sans">
                    {errors.pin}
                  </p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="confirmPin"
                  className="font-sans text-[var(--text-primary)]"
                >
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
                    className={`border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)] pr-10 squircle-md ${errors.confirmPin ? "border-destructive" : ""}`}
                    disabled={isLoading}
                    style={{ outline: "none", boxShadow: "none" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPin(!showConfirmPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
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
                  <p className="text-xs text-destructive mt-1 font-sans">
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
          <Button
            variant="outline"
            onClick={handleBack}
            className="font-sans gap-2 border-[var(--border-color)] text-[var(--text-primary)] hover:bg-(--bg-secondary) squircle-md"
            disabled={isLoading}
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        ) : (
          <div />
        )}
        <Button
          onClick={handleNext}
          className="font-sans gap-2 bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90 squircle-md"
          disabled={isLoading || (step === 2 && passwordStrength.score !== 100)}
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
        </Button>
      </div>

      {/* Password strength warning message */}
      {step === 2 && password && passwordStrength.score !== 100 && (
        <p className="text-xs text-amber-600 text-center mt-4 flex items-center justify-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Please meet all password requirements to continue
        </p>
      )}

      {/* Login link */}
      <p className="text-center text-sm text-[var(--text-secondary)] font-sans mt-6">
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="text-(--color-accent-yellow) font-medium hover:underline"
        >
          Login instead
        </Link>
      </p>

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="text-center sm:max-w-md bg-[var(--bg-primary)] border-[var(--border-color)] squircle-lg">
          <DialogHeader>
            <div className="mx-auto mb-4 text-6xl">🎉</div>
            <DialogTitle className="text-2xl text-center text-[var(--text-primary)]">
              Congratulations!
            </DialogTitle>
            <DialogDescription className="font-sans text-base mt-2 leading-relaxed text-center text-[var(--text-secondary)]">
              You've successfully created your Zidwell account! Kindly check
              your email to verify your account.
            </DialogDescription>
          </DialogHeader>
          <Button
            onClick={() => {
              setShowSuccess(false);
              router.push("/auth/login");
            }}
            className="mt-4 font-sans w-full bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90 squircle-md"
          >
            Got it!
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RegisterForm;
