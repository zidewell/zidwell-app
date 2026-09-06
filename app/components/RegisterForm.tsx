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
  Mail,
  Clock,
  RefreshCw,
  X,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Progress } from "./ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import Swal from "sweetalert2";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ─── CUSTOM VERIFICATION MODAL ───
interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onResend: () => Promise<void>;
  isResending?: boolean;
}

const VerificationModal = ({
  isOpen,
  onClose,
  email,
  onResend,
  isResending = false,
}: VerificationModalProps) => {
  const [resendSuccess, setResendSuccess] = useState(false);

  if (!isOpen) return null;

  const handleResend = async () => {
    await onResend();
    setResendSuccess(true);
    setTimeout(() => setResendSuccess(false), 3000);
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem",
    }}>
      {/* Backdrop */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(4px)",
          animation: "fadeIn 0.3s ease-out",
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div style={{
        position: "relative",
        background: "var(--bg-primary)",
        borderRadius: "1rem",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        maxWidth: "28rem",
        width: "100%",
        animation: "zoomIn 0.3s ease-out",
        overflow: "hidden",
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            color: "var(--text-secondary)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "0.25rem",
            zIndex: 10,
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
          onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
        >
          <X size={20} />
        </button>

        {/* Header with gradient */}
        <div style={{
          background: "linear-gradient(135deg, var(--color-accent-yellow), #f59e0b)",
          padding: "2rem 1.5rem",
          textAlign: "center",
        }}>
          <div style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "0.75rem",
          }}>
            <div style={{
              background: "rgba(255, 255, 255, 0.2)",
              backdropFilter: "blur(4px)",
              borderRadius: "9999px",
              padding: "0.75rem",
            }}>
              <Mail size={32} style={{ color: "var(--color-ink)" }} />
            </div>
          </div>
          <h2 style={{
            fontSize: "1.5rem",
            fontWeight: "bold",
            color: "var(--color-ink)",
            margin: 0,
          }}>
            Check Your Email
          </h2>
          <p style={{
            color: "rgba(25, 25, 25, 0.8)",
            fontSize: "0.875rem",
            marginTop: "0.25rem",
          }}>
            We've sent a verification link to:
          </p>
          <p style={{
            color: "var(--color-ink)",
            fontWeight: "600",
            fontSize: "0.875rem",
            marginTop: "0.25rem",
            background: "rgba(255, 255, 255, 0.2)",
            padding: "0.25rem 1rem",
            borderRadius: "9999px",
            display: "inline-block",
          }}>
            {email}
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Steps */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.75rem",
              padding: "0.75rem",
              background: "var(--bg-secondary)",
              borderRadius: "0.5rem",
            }}>
              <div style={{ marginTop: "0.125rem" }}>
                <div style={{
                  width: "1.5rem",
                  height: "1.5rem",
                  borderRadius: "9999px",
                  background: "rgba(253, 192, 32, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <span style={{
                    fontSize: "0.75rem",
                    fontWeight: "bold",
                    color: "var(--color-accent-yellow)",
                  }}>1</span>
                </div>
              </div>
              <div>
                <p style={{
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "var(--text-primary)",
                  margin: 0,
                }}>Open your inbox</p>
                <p style={{
                  fontSize: "0.75rem",
                  color: "var(--text-secondary)",
                  margin: "0.125rem 0 0",
                }}>
                  Check the email we just sent to <strong>{email}</strong>
                </p>
              </div>
            </div>

            <div style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.75rem",
              padding: "0.75rem",
              background: "var(--bg-secondary)",
              borderRadius: "0.5rem",
            }}>
              <div style={{ marginTop: "0.125rem" }}>
                <div style={{
                  width: "1.5rem",
                  height: "1.5rem",
                  borderRadius: "9999px",
                  background: "rgba(253, 192, 32, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <span style={{
                    fontSize: "0.75rem",
                    fontWeight: "bold",
                    color: "var(--color-accent-yellow)",
                  }}>2</span>
                </div>
              </div>
              <div>
                <p style={{
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "var(--text-primary)",
                  margin: 0,
                }}>Click the verification link</p>
                <p style={{
                  fontSize: "0.75rem",
                  color: "var(--text-secondary)",
                  margin: "0.125rem 0 0",
                }}>
                  It will verify your email and activate your account
                </p>
              </div>
            </div>

            <div style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.75rem",
              padding: "0.75rem",
              background: "var(--bg-secondary)",
              borderRadius: "0.5rem",
            }}>
              <div style={{ marginTop: "0.125rem" }}>
                <div style={{
                  width: "1.5rem",
                  height: "1.5rem",
                  borderRadius: "9999px",
                  background: "rgba(253, 192, 32, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <span style={{
                    fontSize: "0.75rem",
                    fontWeight: "bold",
                    color: "var(--color-accent-yellow)",
                  }}>3</span>
                </div>
              </div>
              <div>
                <p style={{
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "var(--text-primary)",
                  margin: 0,
                }}>Start using Zidwell</p>
                <p style={{
                  fontSize: "0.75rem",
                  color: "var(--text-secondary)",
                  margin: "0.125rem 0 0",
                }}>
                  Once verified, you'll have access to all features
                </p>
              </div>
            </div>
          </div>

          {/* Resend section */}
          <div style={{
            borderTop: "1px solid var(--border-color)",
            paddingTop: "1rem",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div>
                <p style={{
                  fontSize: "0.875rem",
                  color: "var(--text-secondary)",
                  margin: 0,
                }}>Didn't receive the email?</p>
                <p style={{
                  fontSize: "0.75rem",
                  color: "var(--text-secondary)",
                  margin: "0.125rem 0 0",
                }}>Check your spam folder or resend</p>
              </div>
              <button
                onClick={handleResend}
                disabled={isResending || resendSuccess}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  padding: "0.5rem 1rem",
                  borderRadius: "0.5rem",
                  border: "1px solid var(--color-accent-yellow)",
                  background: "transparent",
                  color: "var(--color-accent-yellow)",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  cursor: isResending || resendSuccess ? "not-allowed" : "pointer",
                  opacity: isResending || resendSuccess ? 0.6 : 1,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!isResending && !resendSuccess) {
                    e.currentTarget.style.background = "rgba(253, 192, 32, 0.1)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                {isResending ? (
                  <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} />
                ) : resendSuccess ? (
                  "Sent! ✓"
                ) : (
                  <>
                    <RefreshCw size={16} />
                    Resend
                  </>
                )}
              </button>
            </div>
            {resendSuccess && (
              <p style={{
                fontSize: "0.75rem",
                color: "#16a34a",
                marginTop: "0.5rem",
                animation: "slideDown 0.3s ease-out",
              }}>
                ✓ Verification email resent successfully!
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div style={{
            display: "flex",
            gap: "0.75rem",
            paddingTop: "0.5rem",
          }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                border: "1px solid var(--border-color)",
                background: "transparent",
                color: "var(--text-primary)",
                fontSize: "0.875rem",
                fontWeight: "500",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-secondary)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              Close
            </button>
            <button
              onClick={() => {
                window.location.href = "https://mail.google.com";
              }}
              style={{
                flex: 1,
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                border: "none",
                background: "var(--color-accent-yellow)",
                color: "var(--color-ink)",
                fontSize: "0.875rem",
                fontWeight: "600",
                cursor: "pointer",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
            >
              Open Gmail
            </button>
          </div>

          {/* Footer */}
          <p style={{
            textAlign: "center",
            fontSize: "0.625rem",
            color: "var(--text-secondary)",
            margin: "0.5rem 0 0",
          }}>
            If you didn't create this account, please ignore this email.
          </p>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes zoomIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-0.5rem);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

// ─── VALIDATION SCHEMAS ───
const step1Schema = z.object({
  businessName: z.string().trim().optional(),
  fullName: z.string().trim().min(1, "Full name is required").max(100),
  phone: z
    .string()
    .trim()
    .regex(/^\d{11}$/, "Phone number must be 11 digits"),
  email: z.string().trim().email("Invalid email address").max(255),
});

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

// ─── PASSWORD STRENGTH CALCULATOR ───
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
  let color = "#ef4444";

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

// ─── MAIN REGISTER FORM ───
const RegisterForm = () => {
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Modal state
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  // Step 1
  const [businessName, setBusinessName] = useState("");
  const [fullName, setFullName] = useState("");
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

  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(password));
  }, [password]);

  const validateStep = (): boolean => {
    setErrors({});
    try {
      if (step === 1) {
        step1Schema.parse({ businessName, fullName, phone, email });
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

const handleResendVerification = async (): Promise<void> => {
  setResendingVerification(true);
  try {
    const response = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: registeredEmail }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to resend verification");
    }

    // Success - no need to return anything
  } catch (error: any) {
    Swal.fire({
      icon: "error",
      title: "Failed to Resend",
      text: error.message || "Please try again later.",
      confirmButtonColor: "var(--color-accent-yellow)",
    });
  } finally {
    setResendingVerification(false);
  }
};


  const handleSubmit = async () => {
    if (!validateStep()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          businessName: businessName || undefined,
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

      // 🎉 Trigger confetti
      triggerConfetti();

      // Store email for modal
      setRegisteredEmail(email);

      // Show custom modal
      setShowVerificationModal(true);

      // Reset form
      setBusinessName("");
      setFullName("");
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
    <>
      <div className="w-full max-w-md mx-auto py-8 px-4">
        {/* Mobile logo */}
        <div className="lg:hidden text-center mb-8">
          <h1 className="text-3xl font-bold text-(--color-accent-yellow)">
            Zidwell
          </h1>
          <p className="text-xs text-(--text-secondary) tracking-widest uppercase font-sans mt-1">
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
                      : "bg-(--bg-secondary) text-(--text-secondary)"
                  }`}
                >
                  {i + 1 < step ? <CheckCircle className="h-4 w-4" /> : i + 1}
                </div>
                <span className="text-xs font-sans text-(--text-secondary) hidden sm:inline">
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
              <h2 className="text-2xl font-bold text-(--text-primary)">
                Let's get started!
              </h2>
              <p className="text-(--text-secondary) font-sans text-sm mt-1">
                Join thousands of Nigerian businesses managing their finances
                smarter.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="businessName"
                  className="font-sans text-(--text-primary)"
                >
                  Business Name{" "}
                  <span className="text-xs text-(--text-secondary)">
                    (Optional)
                  </span>
                </Label>
                <Input
                  id="businessName"
                  placeholder="e.g. Adebayo Enterprises Ltd"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:ring-(--color-accent-yellow) focus:border-(--color-accent-yellow) squircle-md"
                  disabled={isLoading}
                  style={{ outline: "none", boxShadow: "none" }}
                />
                <p className="text-xs text-(--text-secondary) mt-1 font-sans">
                  Enter your business name to personalize your experience
                </p>
              </div>

              <div>
                <Label
                  htmlFor="fullName"
                  className="font-sans text-(--text-primary)"
                >
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fullName"
                  placeholder="e.g. Adebayo Olaoluwa"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:ring-(--color-accent-yellow) focus:border-(--color-accent-yellow) squircle-md ${errors.fullName ? "border-destructive" : ""}`}
                  disabled={isLoading}
                  style={{ outline: "none", boxShadow: "none" }}
                />
                {errors.fullName && (
                  <p className="text-xs text-destructive mt-1 font-sans">
                    {errors.fullName}
                  </p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="phone"
                  className="font-sans text-(--text-primary)"
                >
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  placeholder="08**********"
                  inputMode="numeric"
                  maxLength={11}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  className={`border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:ring-(--color-accent-yellow) focus:border-(--color-accent-yellow) squircle-md ${errors.phone ? "border-destructive" : ""}`}
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
                  className="font-sans text-(--text-primary)"
                >
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:ring-(--color-accent-yellow) focus:border-(--color-accent-yellow) squircle-md ${errors.email ? "border-destructive" : ""}`}
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

        {/* Step 2: Security */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h2 className="text-2xl font-bold text-(--text-primary)">
                Secure your account
              </h2>
              <p className="text-(--text-secondary) font-sans text-sm mt-1">
                Create a strong password to protect your business data.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="password"
                  className="font-sans text-(--text-primary)"
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
                    className={`border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:ring-(--color-accent-yellow) focus:border-(--color-accent-yellow) pr-10 squircle-md ${errors.password ? "border-destructive" : ""}`}
                    disabled={isLoading}
                    style={{ outline: "none", boxShadow: "none" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-(--text-secondary) hover:text-(--text-primary)"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

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
                      <span className="text-xs text-(--text-secondary)">
                        {Math.round(passwordStrength.score)}%
                      </span>
                    </div>
                    <Progress value={passwordStrength.score} className="h-2" />
                  </div>
                )}

                {password && (
                  <div className="mt-3 p-3 bg-(--bg-secondary) rounded-lg space-y-1.5 squircle-md">
                    <p className="text-xs font-medium text-(--text-primary) mb-2 flex items-center gap-1">
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
                          className={`text-xs font-sans ${req.met ? "text-(--text-primary)" : "text-(--text-secondary)"}`}
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
                  className="font-sans text-(--text-primary)"
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
                    className={`border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:ring-(--color-accent-yellow) focus:border-(--color-accent-yellow) pr-10 squircle-md ${errors.confirmPassword ? "border-destructive" : ""}`}
                    disabled={isLoading}
                    style={{ outline: "none", boxShadow: "none" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-(--text-secondary) hover:text-(--text-primary)"
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

              <div className="rounded-lg bg-(--color-accent-yellow)/10 border border-(--color-accent-yellow)/30 p-3 squircle-md">
                <p className="text-xs font-medium text-(--text-primary) mb-1">
                  Password Tip:
                </p>
                <p className="text-xs text-(--text-secondary)">
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
              <h2 className="text-2xl font-bold text-(--text-primary)">
                Business Bank Account
              </h2>
              <p className="text-(--text-secondary) font-sans text-sm mt-1">
                Optional: Set up a dedicated account for your business finances.
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-(--border-color) bg-(--bg-primary) p-4 squircle-lg">
              <div>
                <p className="font-sans font-medium text-sm text-(--text-primary)">
                  Do you want a business bank account?
                </p>
                <p className="text-xs text-(--text-secondary) font-sans mt-0.5">
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
                <div className="rounded-lg border border-(--color-accent-yellow)/30 bg-(--color-accent-yellow)/5 p-3 flex gap-2 items-start squircle-md">
                  <Info className="h-4 w-4 text-(--color-accent-yellow) mt-0.5 shrink-0" />
                  <p className="text-xs text-(--text-secondary) font-sans">
                    <strong className="text-(--text-primary)">
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
                      className="font-sans text-(--text-primary)"
                    >
                      BVN
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-(--text-secondary) cursor-help" />
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
                    className={`border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:ring-(--color-accent-yellow) focus:border-(--color-accent-yellow) squircle-md ${errors.bvn ? "border-destructive" : ""}`}
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
                    className="font-sans text-(--text-primary)"
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
                      className={`border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:ring-(--color-accent-yellow) focus:border-(--color-accent-yellow) pr-10 squircle-md ${errors.pin ? "border-destructive" : ""}`}
                      disabled={isLoading}
                      style={{ outline: "none", boxShadow: "none" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-(--text-secondary) hover:text-(--text-primary)"
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
                    className="font-sans text-(--text-primary)"
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
                      className={`border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:ring-(--color-accent-yellow) focus:border-(--color-accent-yellow) pr-10 squircle-md ${errors.confirmPin ? "border-destructive" : ""}`}
                      disabled={isLoading}
                      style={{ outline: "none", boxShadow: "none" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPin(!showConfirmPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-(--text-secondary) hover:text-(--text-primary)"
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
              className="font-sans gap-2 border-(--border-color) text-(--text-primary) hover:bg-(--bg-secondary) squircle-md"
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

        {step === 2 && password && passwordStrength.score !== 100 && (
          <p className="text-xs text-amber-600 text-center mt-4 flex items-center justify-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Please meet all password requirements to continue
          </p>
        )}

        <p className="text-center text-sm text-(--text-secondary) font-sans mt-6">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="text-(--color-accent-yellow) font-medium hover:underline"
          >
            Login instead
          </Link>
        </p>
      </div>

      {/* ─── CUSTOM VERIFICATION MODAL ─── */}
      <VerificationModal
        isOpen={showVerificationModal}
        onClose={() => {
          setShowVerificationModal(false);
          router.push("/auth/login");
        }}
        email={registeredEmail}
        onResend={handleResendVerification}
        isResending={resendingVerification}
      />
    </>
  );
};

export default RegisterForm;