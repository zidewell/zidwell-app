"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { useState, useMemo, Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Globe2,
  Building2,
  User,
  Shield,
  Sparkles,
  X,
  Mail,
  CheckCircle,
  Clock,
  Eye, EyeOff
} from "lucide-react";
import Swal from "sweetalert2";
import confetti from "canvas-confetti";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";


type Region = "nigeria" | "outside" | "";
type Purpose = "personal" | "business" | "";

const TOTAL_STEPS = 7;

const hearAboutOptions = [
  "Instagram",
  "Google Search",
  "YouTube",
  "Facebook",
  "LinkedIn",
  "TikTok",
  "WhatsApp",
  "A Friend Told Me",
  "I Read a Blog Post",
  "Other",
];

const attractionOptions = [
  "Business Bank Account",
  "Easy Bookkeeping & Accounting",
  "Invoices & Receipts",
  "Multi-Signatory Business Accounts",
  "Tax Calculator",
];

// Business type options
const businessTypeOptions = [
  "Freelancer",
  "Agency",
  "Consultant",
  "Ecommerce",
  "Restaurant",
  "Retail",
  "Professional Services",
  "Nonprofit",
  "Other",
];

// Team size options
const teamSizeOptions = ["Just Me", "2–10", "11–50", "50+"];

const freebies = [
  "Business Bank Account",
  "Bookkeeping",
  "Invoices — 5 free",
  "Receipts — 5 free",
  "Payment Links",
  "Payment Pages",
  "Tax Calculator — Free trial",
  "Business Dashboard",
  "7-day Premium Trial (if applicable)",
];

const RegisterForm = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Account details
  const [fullName, setFullName] = useState("");
  const [countryCode, setCountryCode] = useState("+234");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 2: Region
  const [region, setRegion] = useState<Region>("");

  // Step 3: Purpose
  const [purpose, setPurpose] = useState<Purpose>("");

  // Step 4: How heard
  const [heardFrom, setHeardFrom] = useState<string>("");

  // Step 5: Attractions
  const [attractions, setAttractions] = useState<string[]>([]);

  // Step 6: Business Profile (ALL business fields EXCEPT CAC number)
  const [businessType, setBusinessType] = useState<string>("");
  const [teamSize, setTeamSize] = useState<string>("");
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessWebsite, setBusinessWebsite] = useState("");

  // Step 7: Terms
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Confirmation modal state
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [confettiTriggered, setConfettiTriggered] = useState(false);

  // Dynamic total steps based on purpose
  const totalSteps = purpose === "business" ? 7 : 6;
  const isBusinessProfileStep = purpose === "business" && step === 6;
  const isCheckoutStep = step === totalSteps && step >= 6;

  // Confetti effect
  useEffect(() => {
    if (showConfirmationModal && !confettiTriggered) {
      setConfettiTriggered(true);
      
      const colors = ["#FDC020", "#00B64F", "#191919", "#FF6B6B", "#4ECDC4", "#45B7D1"];
      
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.6, x: 0.5 },
        colors: colors,
        startVelocity: 30,
        gravity: 0.8,
        scalar: 1.2,
      });

      setTimeout(() => {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.5, x: 0.2 },
          colors: colors,
          startVelocity: 25,
          gravity: 0.6,
          scalar: 1,
        });
      }, 200);

      setTimeout(() => {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.5, x: 0.8 },
          colors: colors,
          startVelocity: 25,
          gravity: 0.6,
          scalar: 1,
        });
      }, 400);

      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 50,
          origin: { y: 0.3, x: 0.5 },
          colors: ["#FDC020", "#FFFFFF", "#00B64F"],
          startVelocity: 20,
          gravity: 0.4,
          scalar: 1.5,
        });
      }, 600);

      setTimeout(() => {
        confetti({
          particleCount: 80,
          spread: 30,
          origin: { y: 0.7, x: 0.5 },
          colors: ["#FDC020", "#FF6B6B", "#4ECDC4"],
          startVelocity: 15,
          gravity: 0.2,
          scalar: 0.8,
        });
      }, 800);

      setTimeout(() => {
        setConfettiTriggered(false);
      }, 3000);
    }
  }, [showConfirmationModal, confettiTriggered]);

  const passwordValidation = useMemo(
    () => ({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      symbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }),
    [password]
  );

  const isPasswordStrong = Object.values(passwordValidation).every(Boolean);

  const canContinue = useMemo(() => {
    switch (step) {
      case 1:
        return (
          fullName.trim().length > 1 &&
          /\S+@\S+\.\S+/.test(email) &&
          phone.trim().length >= 7 &&
          isPasswordStrong &&
          password === confirmPassword
        );
      case 2:
        return region !== "";
      case 3:
        return purpose !== "";
      case 4:
        return heardFrom !== "";
      case 5:
        return attractions.length > 0;
      case 6:
        if (isBusinessProfileStep) {
          const typeOk = businessType !== "";
          const teamOk = teamSize !== "";
          const regOk = isRegistered !== null;
          const nameOk = businessName.trim().length > 1;
          const addressOk = businessAddress.trim().length > 4;
          const descOk = businessDescription.trim().length > 10;
          return typeOk && teamOk && regOk && nameOk && addressOk && descOk;
        }
        return checkoutValid();
      case 7:
        return checkoutValid();
      default:
        return false;
    }

    function checkoutValid() {
      if (purpose === "business") {
        const nameOk = businessName.trim().length > 1;
        const addressOk = businessAddress.trim().length > 4;
        const descOk = businessDescription.trim().length > 10;
        return nameOk && addressOk && descOk && termsAccepted;
      }
      const personalAddressOk = businessAddress.trim().length > 4;
      return personalAddressOk && termsAccepted;
    }
  }, [
    step,
    fullName,
    email,
    phone,
    password,
    confirmPassword,
    region,
    purpose,
    heardFrom,
    attractions,
    termsAccepted,
    businessType,
    teamSize,
    isRegistered,
    businessName,
    businessAddress,
    businessDescription,
    isBusinessProfileStep,
  ]);

  const handleBack = () => {
    if (step === 1) router.push("/");
    else setStep(step - 1);
  };

  const handleResendVerification = async (email: string) => {
    try {
      Swal.fire({
        title: "Sending verification email...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const response = await fetch("/api/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      Swal.close();

      if (response.ok) {
        await Swal.fire({
          icon: "success",
          title: "Verification Email Sent",
          html: `
            <p>A new verification link has been sent to <strong>${email}</strong></p>
            <p class="text-sm text-gray-600 mt-2">Please check your inbox and spam folder.</p>
          `,
          confirmButtonColor: "#FDC020",
        });
      } else {
        throw new Error(result.error || "Failed to resend verification");
      }
    } catch (error: any) {
      Swal.close();
      await Swal.fire({
        icon: "error",
        title: "Failed to Resend",
        text: error.message || "Please try again later.",
        confirmButtonColor: "#FDC020",
      });
    }
  };

  const handleContinue = async () => {
    if (!canContinue) return;

    if (step === 2 && region === "outside") {
      Swal.fire({
        icon: "info",
        title: "You're on the waitlist",
        text: "We'll email you once Zidwell is available in your region.",
        confirmButtonColor: "#FDC020",
      });
      return;
    }

    if (step < totalSteps) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setLoading(true);
    try {
      Swal.fire({
        title: "Creating your account...",
        text: "Please wait while we set up your Zidwell account",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          password,
          region,
          purpose,
          heardFrom,
          attractions,
          businessType: purpose === "business" ? businessType : null,
          teamSize: purpose === "business" ? teamSize : null,
          isRegistered: purpose === "business" ? isRegistered : null,
          businessName: purpose === "business" ? businessName : null,
          businessAddress: purpose === "business" ? businessAddress : null,
          mapUrl: purpose === "business" ? mapUrl : null,
          businessDescription: purpose === "business" ? businessDescription : null,
          businessEmail: purpose === "business" ? businessEmail : null,
          businessPhone: purpose === "business" ? businessPhone : null,
          businessWebsite: purpose === "business" ? businessWebsite : null,
        }),
      });

      const result = await response.json();

      if (response.status === 409) {
        Swal.close();
        
        if (result.user_exists && !result.email_verified) {
          if (result.verification_sent) {
            await Swal.fire({
              icon: "info",
              title: "Account Already Exists",
              html: `
                <div class="text-left">
                  <p class="mb-3">An account with <strong>${email}</strong> already exists but is not verified.</p>
                  <p class="mb-3">A new verification email has been sent to your inbox.</p>
                  <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                    <p class="font-medium">📧 Please check your email</p>
                    <p class="text-gray-600 mt-1">Click the verification link to activate your account.</p>
                  </div>
                </div>
              `,
              confirmButtonText: "Check Email",
              confirmButtonColor: "#FDC020",
            });
          } else {
            await Swal.fire({
              icon: "warning",
              title: "Account Not Verified",
              html: `
                <div class="text-left">
                  <p class="mb-3">An account with <strong>${email}</strong> already exists but is not verified.</p>
                  <p class="mb-3">Please check your email for the verification link or try logging in.</p>
                  <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                    <p class="font-medium">💡 Tip</p>
                    <p class="text-gray-600 mt-1">Check your spam folder if you don't see the verification email.</p>
                  </div>
                </div>
              `,
              confirmButtonText: "OK",
              confirmButtonColor: "#FDC020",
              showCancelButton: true,
              cancelButtonText: "Resend Email",
              cancelButtonColor: "#6B7280",
            }).then((result) => {
              if (result.isDismissed) {
                handleResendVerification(email);
              }
            });
          }
        } else if (result.user_exists && result.email_verified) {
          await Swal.fire({
            icon: "warning",
            title: "Account Already Exists",
            html: `
              <div class="text-left">
                <p class="mb-3">An account with <strong>${email}</strong> already exists and is verified.</p>
                <p>Please login to access your account.</p>
              </div>
            `,
            confirmButtonText: "Go to Login",
            confirmButtonColor: "#FDC020",
          }).then((result) => {
            if (result.isConfirmed) {
              router.push("/auth/login");
            }
          });
        } else {
          await Swal.fire({
            icon: "error",
            title: "Registration Failed",
            text: result.error || "An account with this email already exists.",
            confirmButtonColor: "#FDC020",
          });
        }
        return;
      }

      if (!response.ok) {
        throw new Error(result.error || "Registration failed");
      }

      Swal.close();

      setUserEmail(email);
      setConfettiTriggered(false);
      setShowConfirmationModal(true);
    } catch (error: any) {
      Swal.close();
      await Swal.fire({
        icon: "error",
        title: "Registration Failed",
        text: error.message || "Something went wrong. Please try again.",
        confirmButtonColor: "#FDC020",
        confirmButtonText: "Try Again",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAttraction = (item: string) => {
    setAttractions((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  const ctaLabel = isCheckoutStep ? "Create Account" : "Continue";

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <header className="sticky top-0 z-40 bg-[var(--bg-primary)]/85 backdrop-blur-md border-b border-[var(--border-color)]">
        <div className="mx-auto max-w-4xl px-5 py-4 flex items-center gap-4">
          <button
            onClick={handleBack}
            className="h-11 w-11 -ml-2 rounded-full flex items-center justify-center hover:bg-[var(--bg-secondary)] transition-colors text-[var(--text-primary)]"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex-1">
            <div className="h-2 w-full bg-[var(--bg-secondary)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--color-accent-yellow)] rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          <div className="hidden sm:block text-sm font-medium text-[var(--text-secondary)] tabular-nums">
            {step} / {totalSteps}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 pt-10 pb-32 sm:pt-16">
        <div key={step} className="animate-fade-in">
          {step === 1 && (
            <StepShell
              eyebrow={`Step 1 of ${totalSteps}`}
              title="Create your account"
              subtitle="Just a few details to get you started."
            >
              <div className="space-y-5">
                <Field id="fullName" label="Full Name" hint="Your birth name">
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Johanne Thompson"
                    className="w-full h-14 px-5 rounded-4xl text-base bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] focus:border-[var(--color-accent-yellow)] focus:ring-2 focus:ring-[var(--color-accent-yellow)] outline-none transition-all"
                    autoFocus
                  />
                </Field>
                <Field id="phone" label="Phone Number">
                  <div className="flex items-center rounded-4xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-sm focus-within:border-[var(--color-accent-yellow)] focus-within:ring-2 focus-within:ring-[var(--color-accent-yellow)] transition-all">
                    <Select value={countryCode} onValueChange={setCountryCode}>
                      <SelectTrigger className="h-14 w-28 rounded-l-2xl rounded-r-none border-0 border-r border-[var(--border-color)] bg-transparent shadow-none focus:ring-0">
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="+234">🇳🇬 +234</SelectItem>
                        <SelectItem value="+233">🇬🇭 +233</SelectItem>
                        <SelectItem value="+254">🇰🇪 +254</SelectItem>
                        <SelectItem value="+27">🇿🇦 +27</SelectItem>
                        <SelectItem value="+44">🇬🇧 +44</SelectItem>
                        <SelectItem value="+1">🇺🇸 +1</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) =>
                        setPhone(e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="800 000 0000"
                      className="h-14 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                </Field>
                <Field id="email" label="Email Address">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-14 px-5 rounded-4xl text-base bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] focus:border-[var(--color-accent-yellow)] focus:ring-2 focus:ring-[var(--color-accent-yellow)] outline-none transition-all"
                  />
                </Field>
                <Field id="password" label="Password" hint="Must be strong">
                  <div className="space-y-3">
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a strong password"
                         className="w-full h-14 px-5 rounded-4xl text-base bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] focus:border-[var(--color-accent-yellow)] focus:ring-2 focus:ring-[var(--color-accent-yellow)] outline-none transition-all"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      >
                        {showPassword ? (
                          <span className="text-xl">👁️</span>
                        ) : (
                          <span className="text-xl">👁️‍🗨️</span>
                        )}
                      </button>
                    </div>

                    {password.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
                        <PasswordRule
                          valid={passwordValidation.length}
                          text="8+ characters"
                        />
                        <PasswordRule
                          valid={passwordValidation.uppercase}
                          text="Uppercase letter"
                        />
                        <PasswordRule
                          valid={passwordValidation.lowercase}
                          text="Lowercase letter"
                        />
                        <PasswordRule
                          valid={passwordValidation.number}
                          text="Number"
                        />
                        <PasswordRule
                          valid={passwordValidation.symbol}
                          text="Special character"
                        />
                      </div>
                    )}
                  </div>
                </Field>
                <Field id="confirmPassword" label="Confirm Password">
                  <div className="space-y-3">
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        className="w-full h-14 px-5 rounded-4xl text-base bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] focus:border-[var(--color-accent-yellow)] focus:ring-2 focus:ring-[var(--color-accent-yellow)] outline-none transition-all"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      >
                        {showConfirmPassword ? (
                         <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                        ) : (
                          <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                        )}
                      </button>
                    </div>

                    {confirmPassword.length > 0 && (
                      <div
                        className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
                          password === confirmPassword
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {password === confirmPassword ? (
                          <>
                            <Check className="h-4 w-4" />
                            Passwords match
                          </>
                        ) : (
                          <>
                            <X className="h-4 w-4" />
                            Passwords do not match
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </Field>
              </div>
            </StepShell>
          )}

          {step === 2 && (
            <StepShell
              eyebrow={`Step 2 of ${totalSteps}`}
              title="Select your region"
              subtitle="This helps us tailor your Zidwell experience."
            >
              <div className="grid gap-4">
                <BigChoiceCard
                  selected={region === "nigeria"}
                  onClick={() => setRegion("nigeria")}
                  emoji="🇳🇬"
                  title="Nigeria"
                  description="Full access to business accounts, bookkeeping, invoicing and more."
                />
                <BigChoiceCard
                  selected={region === "outside"}
                  onClick={() => setRegion("outside")}
                  icon={<Globe2 className="h-8 w-8" />}
                  title="Outside Nigeria"
                  description="Global access to invoicing, bookkeeping and business tools. Local bank accounts coming soon in your region."
                />
              </div>
            </StepShell>
          )}

          {step === 3 && (
            <StepShell
              eyebrow={`Step 3 of ${totalSteps}`}
              title="What are you using Zidwell for?"
              subtitle="We'll customize the experience just for you."
            >
              <div className="grid gap-4">
                <BigChoiceCard
                  selected={purpose === "personal"}
                  onClick={() => setPurpose("personal")}
                  icon={<User className="h-8 w-8" />}
                  title="Personal"
                  description="Manage your personal finances, payments, and savings."
                />
                <BigChoiceCard
                  selected={purpose === "business"}
                  onClick={() => setPurpose("business")}
                  icon={<Building2 className="h-8 w-8" />}
                  title="Business"
                  description="Open a business bank account and run your business smarter."
                />
              </div>
            </StepShell>
          )}

          {step === 4 && (
            <StepShell
              eyebrow={`Step 4 of ${totalSteps}`}
              title="How did you hear about Zidwell?"
              subtitle="Pick the one that fits best."
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {hearAboutOptions.map((option) => (
                  <PillChoice
                    key={option}
                    selected={heardFrom === option}
                    onClick={() => setHeardFrom(option)}
                    label={option}
                  />
                ))}
              </div>
            </StepShell>
          )}

          {step === 5 && (
            <StepShell
              eyebrow={`Step 5 of ${totalSteps}`}
              title="What attracted you to Zidwell?"
              subtitle="Select all that apply — this helps us serve you better."
            >
              <div className="grid gap-3">
                {attractionOptions.map((option) => (
                  <MultiChoice
                    key={option}
                    selected={attractions.includes(option)}
                    onClick={() => toggleAttraction(option)}
                    label={option}
                  />
                ))}
              </div>
            </StepShell>
          )}

          {isBusinessProfileStep && (
            <StepShell
              eyebrow={`Step 6 of ${totalSteps}`}
              title="Tell us about your business"
              subtitle="This helps us tailor the right tools and templates for you."
            >
              <div className="space-y-10">
                <div className="space-y-4">
                  <h3 className="font-display text-xl font-bold text-[var(--text-primary)]">
                    What best describes your business?
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {businessTypeOptions.map((option) => (
                      <PillChoice
                        key={option}
                        selected={businessType === option}
                        onClick={() => setBusinessType(option)}
                        label={option}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-display text-xl font-bold text-[var(--text-primary)]">
                    Team size
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {teamSizeOptions.map((option) => (
                      <PillChoice
                        key={option}
                        selected={teamSize === option}
                        onClick={() => setTeamSize(option)}
                        label={option}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-display text-xl font-bold text-[var(--text-primary)]">
                    Is your business registered with CAC?
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setIsRegistered(true)}
                      aria-pressed={isRegistered === true}
                      className={`h-14 rounded-2xl border-2 font-semibold text-base transition-all ${
                        isRegistered === true
                          ? "border-[var(--color-accent-yellow)] bg-[rgba(253,192,32,0.05)] text-[var(--text-primary)]"
                          : "border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-[var(--text-primary)]/20"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsRegistered(false)}
                      aria-pressed={isRegistered === false}
                      className={`h-14 rounded-2xl border-2 font-semibold text-base transition-all ${
                        isRegistered === false
                          ? "border-[var(--color-accent-yellow)] bg-[rgba(253,192,32,0.05)] text-[var(--text-primary)]"
                          : "border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-[var(--text-primary)]/20"
                      }`}
                    >
                      No
                    </button>
                  </div>
                  {isRegistered === false && (
                    <p className="text-sm font-medium text-[var(--text-primary)] bg-yellow-50 border border-yellow-200 rounded-2xl p-4 leading-relaxed">
                      Note: We pay stricter attention to transactions carried out by unregistered businesses.
                    </p>
                  )}
                </div>

                <Field id="businessName" label={isRegistered ? "Registered Business Name" : "Preferred Business Name"}>
                  <Input
                    id="businessName"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder={isRegistered ? "Zidwell Technologies Ltd" : "e.g. Johanne's Kitchen"}
                    className="h-14 rounded-2xl px-5 text-base"
                  />
                </Field>

                <Field id="businessAddress" label="Business Address" hint="Answer correctly, we will verify this address">
                  <Input
                    id="businessAddress"
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    placeholder="12 Admiralty Way, Lekki, Lagos"
                    className="h-14 rounded-2xl px-5 text-base"
                  />
                </Field>

                <Field id="mapUrl" label="Google Maps URL" hint="Paste a link to your location">
                  <Input
                    id="mapUrl"
                    type="url"
                    value={mapUrl}
                    onChange={(e) => setMapUrl(e.target.value)}
                    placeholder="https://maps.google.com/..."
                    className="h-14 rounded-2xl px-5 text-base"
                  />
                </Field>

                <Field id="businessDescription" label="Describe your business" hint="Up to 100 words">
                  <Textarea
                    id="businessDescription"
                    value={businessDescription}
                    onChange={(e) => {
                      const words = e.target.value.trim().split(/\s+/).filter(Boolean);
                      if (words.length <= 100) setBusinessDescription(e.target.value);
                    }}
                    placeholder="What do you sell or do? Who are your customers?"
                    className="min-h-32 rounded-2xl px-5 py-4 text-base"
                  />
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    {businessDescription.trim() ? businessDescription.trim().split(/\s+/).filter(Boolean).length : 0} / 100 words
                  </p>
                </Field>

                <Field id="businessEmail" label="Business Email" hint="Optional">
                  <Input
                    id="businessEmail"
                    type="email"
                    value={businessEmail}
                    onChange={(e) => setBusinessEmail(e.target.value)}
                    placeholder="business@example.com"
                    className="h-14 rounded-2xl px-5 text-base"
                  />
                </Field>

                <Field id="businessPhone" label="Business Phone" hint="Optional">
                  <Input
                    id="businessPhone"
                    value={businessPhone}
                    onChange={(e) => setBusinessPhone(e.target.value)}
                    placeholder="080 0000 0000"
                    className="h-14 rounded-2xl px-5 text-base"
                  />
                </Field>

                <Field id="businessWebsite" label="Business Website" hint="Optional">
                  <Input
                    id="businessWebsite"
                    type="url"
                    value={businessWebsite}
                    onChange={(e) => setBusinessWebsite(e.target.value)}
                    placeholder="https://www.yourbusiness.com"
                    className="h-14 rounded-2xl px-5 text-base"
                  />
                </Field>
              </div>
            </StepShell>
          )}

          {isCheckoutStep && (
            <FinalStep
              purpose={purpose}
              businessName={businessName}
              businessAddress={businessAddress}
              totalSteps={totalSteps}
              termsAccepted={termsAccepted}
              setTermsAccepted={setTermsAccepted}
            />
          )}
        </div>
      </main>

      <div className="fixed bottom-0 inset-x-0 z-30 bg-[var(--bg-primary)]/95 backdrop-blur-md border-t border-[var(--border-color)]">
        <div className="mx-auto max-w-2xl px-5 py-4 sm:py-5">
          <button
            onClick={handleContinue}
            disabled={!canContinue || loading}
            className="w-full h-16 rounded-4xl text-base font-semibold font-display bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:opacity-90 hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Creating Account...
              </span>
            ) : (
              <>
                {isCheckoutStep && <Sparkles className="mr-2 h-5 w-5 inline" />}
                {ctaLabel}
              </>
            )}
          </button>
        </div>
      </div>

      {showConfirmationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="max-w-md w-full rounded-2xl border-2 border-[var(--border-color)] bg-[var(--bg-primary)] overflow-hidden animate-scale-in">
            <div className="bg-[var(--color-accent-yellow)] p-8 text-[var(--color-ink)] text-center space-y-3">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-[var(--color-ink)]/10 flex items-center justify-center animate-bounce-in">
                <CheckCircle className="h-8 w-8" />
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold animate-fade-in-up">
                Registration Successful! 🎉
              </h2>
              <p className="text-[var(--color-ink)]/80 text-base animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                Your account has been created successfully.
              </p>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div className="rounded-2xl bg-[var(--bg-secondary)] border-2 border-[var(--border-color)] p-5 space-y-3 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-[var(--color-accent-yellow)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      Verification Email Sent
                    </p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      We've sent a verification link to <strong>{userEmail}</strong>
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-[rgba(253,192,32,0.1)] border border-[rgba(253,192,32,0.3)] p-4 flex gap-3 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
                <Sparkles className="h-5 w-5 text-[var(--color-accent-yellow)] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                  <strong>Next Steps:</strong> After verifying your email, log in to complete your 
                  profile setup and access your dashboard.
                </p>
              </div>

              <button
                onClick={() => {
                  setShowConfirmationModal(false);
                  router.push("/auth/login");
                }}
                className="w-full h-14 rounded-2xl text-base font-semibold font-display bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:opacity-90 hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)] transition-all animate-fade-in-up"
                style={{ animationDelay: "0.4s" }}
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-components
const StepShell = ({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-8">
    <div className="space-y-3">
      <p className="text-sm font-semibold text-[var(--color-accent-yellow)] uppercase tracking-wider">
        {eyebrow}
      </p>
      <h1 className="font-display text-4xl sm:text-5xl font-bold leading-[1.05] text-[var(--text-primary)]">
        {title}
      </h1>
      {subtitle && (
        <p className="text-lg text-[var(--text-secondary)] max-w-xl">
          {subtitle}
        </p>
      )}
    </div>
    <div>{children}</div>
  </div>
);

const Field = ({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-2">
    <label
      htmlFor={id}
      className="text-base font-medium text-[var(--text-primary)]"
    >
      {label}
      {hint && (
        <span className="ml-2 font-normal text-sm text-[var(--text-secondary)]">
          ({hint})
        </span>
      )}
    </label>
    {children}
  </div>
);

const BigChoiceCard = ({
  selected,
  onClick,
  emoji,
  icon,
  title,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  emoji?: string;
  icon?: React.ReactNode;
  title: string;
  description: string;
}) => (
  <button
    onClick={onClick}
    aria-pressed={selected}
    className={`group relative text-left w-full p-6 sm:p-7 rounded-2xl border-2 bg-[var(--bg-primary)] transition-all duration-200 hover:shadow-[var(--shadow-pop)] ${
      selected
        ? "border-[var(--color-accent-yellow)] bg-[rgba(253,192,32,0.05)] shadow-[var(--shadow-soft)]"
        : "border-[var(--border-color)] hover:border-[var(--text-primary)]/20"
    }`}
  >
    <div className="flex items-start gap-5">
      <div
        className={`flex-shrink-0 h-16 w-16 rounded-2xl flex items-center justify-center text-3xl ${
          selected
            ? "bg-[var(--color-accent-yellow)] text-[var(--color-ink)]"
            : "bg-[var(--bg-secondary)] text-[var(--text-primary)]"
        }`}
      >
        {emoji ?? icon}
      </div>
      <div className="flex-1 pt-1">
        <h3 className="font-display text-2xl font-bold text-[var(--text-primary)]">
          {title}
        </h3>
        <p className="mt-1 text-base text-[var(--text-secondary)] leading-snug">
          {description}
        </p>
      </div>
      <div
        className={`flex-shrink-0 h-7 w-7 rounded-full border-2 flex items-center justify-center mt-1 transition-colors ${
          selected
            ? "border-[var(--color-accent-yellow)] bg-[var(--color-accent-yellow)]"
            : "border-[var(--border-color)] bg-transparent"
        }`}
      >
        {selected && (
          <Check className="h-4 w-4 text-[var(--color-ink)]" strokeWidth={3} />
        )}
      </div>
    </div>
  </button>
);

const PillChoice = ({
  selected,
  onClick,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
}) => (
  <button
    onClick={onClick}
    aria-pressed={selected}
    className={`w-full h-16 px-6 rounded-2xl border-2 text-left font-medium text-base transition-all flex items-center justify-between ${
      selected
        ? "border-[var(--color-accent-yellow)] bg-[rgba(253,192,32,0.05)] text-[var(--text-primary)]"
        : "border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-[var(--text-primary)]/20"
    }`}
  >
    <span>{label}</span>
    <span
      className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${
        selected
          ? "border-[var(--color-accent-yellow)] bg-[var(--color-accent-yellow)]"
          : "border-[var(--border-color)]"
      }`}
    >
      {selected && (
        <Check
          className="h-3.5 w-3.5 text-[var(--color-ink)]"
          strokeWidth={3}
        />
      )}
    </span>
  </button>
);

const MultiChoice = ({
  selected,
  onClick,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
}) => (
  <button
    onClick={onClick}
    aria-pressed={selected}
    className={`w-full min-h-[64px] px-6 py-4 rounded-2xl border-2 text-left transition-all flex items-center gap-4 ${
      selected
        ? "border-[var(--color-accent-yellow)] bg-[rgba(253,192,32,0.05)]"
        : "border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-[var(--text-primary)]/20"
    }`}
  >
    <span
      className={`flex-shrink-0 h-7 w-7 rounded-lg border-2 flex items-center justify-center transition-colors ${
        selected
          ? "border-[var(--color-accent-yellow)] bg-[var(--color-accent-yellow)]"
          : "border-[var(--border-color)]"
      }`}
    >
      {selected && (
        <Check className="h-4 w-4 text-[var(--color-ink)]" strokeWidth={3} />
      )}
    </span>
    <span className="text-base font-medium text-[var(--text-primary)]">
      {label}
    </span>
  </button>
);

const PasswordRule = ({
  valid,
  text,
}: {
  valid: boolean;
  text: string;
}) => (
  <div
    className={`flex items-center gap-2 text-sm transition-colors ${
      valid ? "text-green-600" : "text-[var(--text-secondary)]"
    }`}
  >
    {valid ? (
      <Check className="h-4 w-4" />
    ) : (
      <X className="h-4 w-4" />
    )}
    <span>{text}</span>
  </div>
);

const FinalStep = ({
  purpose,
  businessName,
  businessAddress,
  totalSteps,
  termsAccepted,
  setTermsAccepted,
}: {
  purpose: string;
  businessName: string;
  businessAddress: string;
  totalSteps: number;
  termsAccepted: boolean;
  setTermsAccepted: (value: boolean) => void;
}) => {
  const isBusiness = purpose === "business";

  return (
    <div className="space-y-12">
      <div className="text-center space-y-4">
        <p className="text-sm font-semibold text-[var(--color-accent-yellow)] uppercase tracking-wider">
          Step {totalSteps} of {totalSteps}
        </p>
        <h1 className="font-display text-4xl sm:text-6xl font-bold leading-[1.02] text-[var(--text-primary)]">
          Almost There!
        </h1>
        <p className="text-lg sm:text-xl text-[var(--text-secondary)] max-w-xl mx-auto">
          {isBusiness
            ? "Review your business details and accept our terms to complete registration."
            : "Review your details and accept our terms to complete registration."}
        </p>
      </div>

      <div className="rounded-2xl bg-[var(--bg-secondary)] border-2 border-[var(--border-color)] p-6 sm:p-8 space-y-4">
        <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">Review Your Information</h3>
        
        {isBusiness && (
          <>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-[var(--text-secondary)]">Business Name</span>
              <span className="text-[var(--text-primary)] font-medium">{businessName || "Not specified"}</span>
              <span className="text-[var(--text-secondary)]">Business Address</span>
              <span className="text-[var(--text-primary)] font-medium">{businessAddress || "Not specified"}</span>
            </div>
            <div className="border-t border-[var(--border-color)] pt-3">
              <p className="text-xs text-[var(--text-secondary)]">
                Your business details will be used for verification purposes.
              </p>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:gap-8">
        <TrustLaurel title="165" subtitle="Businesses trust Zidwell" />
        <TrustLaurel title="1" subtitle="Customer complaint so far" />
      </div>

      <section className="space-y-5">
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
          What you get, free
        </h2>
        <div className="rounded-2xl bg-[var(--bg-primary)] border-2 border-[var(--border-color)] p-6 sm:p-8 shadow-[var(--shadow-soft)]">
          <ul className="grid sm:grid-cols-2 gap-4">
            {freebies.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="h-8 w-8 rounded-full bg-[rgba(253,192,32,0.1)] flex items-center justify-center flex-shrink-0">
                  <Check
                    className="h-4 w-4 text-[var(--color-accent-yellow)]"
                    strokeWidth={3}
                  />
                </span>
                <span className="text-base font-medium text-[var(--text-primary)]">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-2xl bg-[var(--bg-primary)] border-2 border-[var(--border-color)] p-6 sm:p-8 shadow-[var(--shadow-soft)]">
        <label className="flex items-start gap-4 cursor-pointer">
          <input
            type="checkbox"
            id="terms"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-1 h-6 w-6 rounded-md border-[var(--border-color)] accent-[var(--color-accent-yellow)]"
          />
          <span className="text-base text-[var(--text-primary)] leading-relaxed">
            I acknowledge and agree to Zidwell's{" "}
            <a
              href="#"
              className="text-[var(--color-accent-yellow)] font-semibold underline underline-offset-2"
            >
              Terms of Use
            </a>{" "}
            and{" "}
            <a
              href="#"
              className="text-[var(--color-accent-yellow)] font-semibold underline underline-offset-2"
            >
              Privacy Policy
            </a>
            . I confirm the information I've provided is accurate.
          </span>
        </label>
      </section>
    </div>
  );
};

const TrustLaurel = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="rounded-2xl bg-[var(--bg-primary)] border-2 border-[var(--border-color)] p-6 sm:p-8 text-center shadow-[var(--shadow-soft)]">
    <div className="text-3xl sm:text-4xl">🏆</div>
    <div className="mt-3 font-display text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
      {title}
    </div>
    <div className="mt-1 text-sm sm:text-base text-[var(--text-secondary)] font-medium">
      {subtitle}
    </div>
  </div>
);

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-accent-yellow)]" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}