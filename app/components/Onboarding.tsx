"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import {
  ArrowLeft,
  Check,
  Globe2,
  Building2,
  User,
  Sparkles,
  Copy,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import Swal from "sweetalert2";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import VerificationModal from "./VerificationModal";

type Region = "nigeria" | "outside" | "";
type Purpose = "personal" | "business" | "";

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

const calcPasswordStrength = (password: string) => {
  const reqs = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "1 uppercase letter (A-Z)", met: /[A-Z]/.test(password) },
    { label: "1 lowercase letter (a-z)", met: /[a-z]/.test(password) },
    { label: "1 number (0-9)", met: /[0-9]/.test(password) },
    {
      label: "1 special character (!@#$%^&*)",
      met: /[^A-Za-z0-9]/.test(password),
    },
  ];
  const metCount = reqs.filter((r) => r.met).length;
  const score = (metCount / reqs.length) * 100;
  return { score, requirements: reqs };
};

const safeSwalFire = (options: any): Promise<any> => {
  try {
    const result = (Swal as any).fire(options);
    if (result && typeof result.then === "function") return result;
    return Promise.resolve(result);
  } catch (err) {
    console.error("Swal.fire threw synchronously:", err);
    return Promise.resolve(undefined);
  }
};

const Onboarding = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1
  const [fullName, setFullName] = useState("");
  const [countryCode, setCountryCode] = useState("+234");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 2
  const [region, setRegion] = useState<Region>("");

  // Step 3
  const [purpose, setPurpose] = useState<Purpose>("");

  // Step 4
  const [heardFrom, setHeardFrom] = useState<string>("");

  // Step 5
  const [attractions, setAttractions] = useState<string[]>([]);

  // Step 6 (business only)
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState<string>("");
  const [teamSize, setTeamSize] = useState<string>("");

  // Terms
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Activation modal
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [copied, setCopied] = useState(false);

  // Email verification modal
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const totalSteps = purpose === "business" ? 7 : 6;
  const isReviewStep = step === totalSteps;
  const isBusinessProfileStep = purpose === "business" && step === 6;
  const isOutsideNigeria = region === "outside";

  const passwordStrength = useMemo(
    () => calcPasswordStrength(password),
    [password]
  );

  const canContinue = useMemo(() => {
    switch (step) {
      case 1:
        return (
          fullName.trim().length > 1 &&
          /\S+@\S+\.\S+/.test(email) &&
          phone.trim().length >= 7 &&
          passwordStrength.score === 100 &&
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
          return businessType !== "" && teamSize !== "";
        }
        return termsAccepted;
      case 7:
        return termsAccepted;
      default:
        return false;
    }
  }, [
    step,
    isBusinessProfileStep,
    fullName,
    email,
    phone,
    password,
    confirmPassword,
    passwordStrength.score,
    region,
    purpose,
    heardFrom,
    attractions,
    businessType,
    teamSize,
    termsAccepted,
  ]);

  const handleBack = () => {
    if (step === 1) router.push("/");
    else setStep(step - 1);
  };

  const generateAccountNumber = () =>
    Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join("");

  const firstName = fullName.trim().split(/\s+/)[0] || "there";

  const toggleAttraction = (item: string) => {
    setAttractions((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  const handleCopyAccountNumber = async () => {
    try {
      await navigator.clipboard.writeText(accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      safeSwalFire({
        icon: "error",
        title: "Copy failed",
        text: "Please copy the account number manually.",
        confirmButtonColor: "#FDC020",
      });
    }
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
    } catch (error: any) {
      safeSwalFire({
        icon: "error",
        title: "Failed to Resend",
        text: error.message || "Please try again later.",
        confirmButtonColor: "#FDC020",
      });
    } finally {
      setResendingVerification(false);
    }
  };

  const triggerConfetti = () => {
    const end = Date.now() + 1500;
    const colors = ["#00B64F", "#FDC020", "#191919", "#FFFFFF"];
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

  const handleContinue = async () => {
    if (!canContinue || isSubmitting) return;

    if (step < totalSteps) {
      setStep(step + 1);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    // ─── FINAL STEP ───
    setIsSubmitting(true);

    try {
      safeSwalFire({
        title: "Creating your account...",
        text: "Please wait",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const payload = {
        fullName,
        email,
        phone: `${countryCode}${phone}`,
        password,
        region,
        purpose,
        heardFrom,
        attractions,
        businessName:
          purpose === "business" ? businessName || undefined : undefined,
        businessType:
          purpose === "business" ? businessType || undefined : undefined,
        teamSize: purpose === "business" ? teamSize || undefined : undefined,
      };

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      Swal.close();
      setRegisteredEmail(email);
      triggerConfetti();

      if (isOutsideNigeria) {
        safeSwalFire({
          icon: "success",
          title: "Welcome to Zidwell!",
          text: "Your account is ready. Let's finish setting things up.",
          confirmButtonColor: "#FDC020",
        }).then(() => {
          router.push("/auth/login");
        });
        return;
      }

      const name =
        purpose === "business" && businessName.trim()
          ? businessName.trim()
          : fullName.trim() || "Zidwell User";
      setAccountName(name);
      setAccountNumber(generateAccountNumber());
      setShowActivationModal(true);
    } catch (err: any) {
      Swal.close();
      safeSwalFire({
        icon: "error",
        title: "Registration Failed",
        text: err.message || "Something went wrong. Please try again.",
        confirmButtonColor: "#FDC020",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivationModalClose = () => {
    setShowActivationModal(false);
    setShowVerificationModal(true);
  };

  const handleVerificationModalClose = () => {
    setShowVerificationModal(false);
    router.push("/auth/login");
  };

  const ctaLabel = isReviewStep ? "Activate Account" : "Continue";

  return (
    <div className="flex-1 flex flex-col relative min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-(--bg-primary)/85 backdrop-blur-md border-b border-(--border-color)">
        <div className="mx-auto max-w-2xl px-5 py-4 flex items-center gap-4">
          <button
            onClick={handleBack}
            className="h-11 w-11 -ml-2 rounded-full flex items-center justify-center hover:bg-(--bg-secondary) transition-colors cursor-pointer"
            aria-label="Back"
            disabled={isSubmitting}
          >
            <ArrowLeft className="h-5 w-5 text-(--text-primary)" />
          </button>

          <div className="flex-1">
            <ProgressBar current={step} total={totalSteps} />
          </div>

          <div className="hidden sm:block text-sm font-medium text-(--text-secondary) tabular-nums">
            {step} / {totalSteps}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 mx-auto w-full max-w-2xl px-5 pt-10 pb-8 sm:pt-16">
        <div key={step} className="fade-in">
          {/* ─── STEP 1: ACCOUNT ─── */}
          {step === 1 && (
            <StepShell
              eyebrow={`Step 1 of ${totalSteps}`}
              title="Create your account"
              subtitle="Just a few quick details to get you started."
            >
              <div className="space-y-5">
                <Field id="fullName" label="Full Name" hint="Your birth name">
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Johanne Thompson"
                    className="h-14 squircle-md px-5 text-base border-(--border-color) bg-(--bg-secondary) text-(--text-primary)"
                    autoFocus
                    disabled={isSubmitting}
                  />
                </Field>

                <Field id="phone" label="Phone Number">
                  <div className="flex gap-3">
                    <Select
                      value={countryCode}
                      onValueChange={setCountryCode}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="h-14 w-32 squircle-md px-4 text-base border-(--border-color) bg-(--bg-secondary) text-(--text-primary)">
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
                      className="h-14 flex-1 squircle-md px-5 text-base border-(--border-color) bg-(--bg-secondary) text-(--text-primary)"
                      disabled={isSubmitting}
                    />
                  </div>
                </Field>

                <Field id="email" label="Email Address">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-14 squircle-md px-5 text-base border-(--border-color) bg-(--bg-secondary) text-(--text-primary)"
                    disabled={isSubmitting}
                  />
                </Field>

                <Field id="password" label="Password">
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 chars, uppercase, number & symbol"
                      className="h-14 squircle-md px-5 pr-12 text-base border-(--border-color) bg-(--bg-secondary) text-(--text-primary)"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-(--text-secondary) hover:text-(--text-primary) cursor-pointer"
                      disabled={isSubmitting}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {password && passwordStrength.score < 100 && (
                    <div className="mt-3 p-3 bg-(--bg-secondary) squircle-md space-y-1.5">
                      <p className="text-xs font-medium text-(--text-primary) mb-2 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Password must contain:
                      </p>
                      {passwordStrength.requirements.map((req, i) => (
                        <div key={i} className="flex items-center gap-2">
                          {req.met ? (
                            <Check
                              className="h-3 w-3 text-(--color-lemon-green)"
                              strokeWidth={3}
                            />
                          ) : (
                            <span className="h-3 w-3 rounded-full border border-(--text-secondary)" />
                          )}
                          <span
                            className={cn(
                              "text-xs",
                              req.met
                                ? "text-(--text-primary)"
                                : "text-(--text-secondary)"
                            )}
                          >
                            {req.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </Field>

                <Field id="confirmPassword" label="Confirm Password">
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="h-14 squircle-md px-5 pr-12 text-base border-(--border-color) bg-(--bg-secondary) text-(--text-primary)"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-(--text-secondary) hover:text-(--text-primary) cursor-pointer"
                      disabled={isSubmitting}
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Passwords do not match
                    </p>
                  )}
                </Field>
              </div>
            </StepShell>
          )}

          {/* ─── STEP 2: REGION ─── */}
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

          {/* ─── STEP 3: PURPOSE ─── */}
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

          {/* ─── STEP 4: REFERRAL ─── */}
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

          {/* ─── STEP 5: ATTRACTION ─── */}
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

          {/* ─── STEP 6 (BUSINESS ONLY): BUSINESS PROFILE ─── */}
          {isBusinessProfileStep && (
            <StepShell
              eyebrow={`Step 6 of ${totalSteps}`}
              title="Tell us about your business"
              subtitle="This helps us tailor the right tools and templates for you."
            >
              <div className="space-y-10">
                <Field
                  id="businessName"
                  label="Business Name"
                  hint="Optional — you can add this later"
                >
                  <Input
                    id="businessName"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Zidwell Technologies Ltd"
                    className="h-14 squircle-md px-5 text-base border-(--border-color) bg-(--bg-secondary) text-(--text-primary)"
                    disabled={isSubmitting}
                  />
                </Field>

                <div className="space-y-4">
                  <h3 className="font-bold text-xl text-(--text-primary)">
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
                  <h3 className="font-bold text-xl text-(--text-primary)">
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
              </div>
            </StepShell>
          )}

          {/* ─── REVIEW STEP ─── */}
          {isReviewStep && (
            <div className="space-y-10">
              <div className="text-center space-y-4">
                <p className="text-sm font-semibold text-(--color-accent-yellow) uppercase tracking-widest">
                  Step {totalSteps} of {totalSteps}
                </p>
                <h1 className="text-4xl sm:text-5xl font-bold leading-[1.05] text-(--text-primary)">
                  You&apos;re all set, {firstName}
                </h1>
                <p className="text-lg text-(--text-secondary) max-w-xl mx-auto">
                  Review and activate your Zidwell account.
                </p>
              </div>

              {/* Trust laurels */}
              <div className="grid grid-cols-2 gap-4 sm:gap-8">
                <TrustLaurel
                  emoji="🏆"
                  title="165"
                  subtitle="Businesses trust Zidwell"
                />
                <TrustLaurel
                  emoji="🏆"
                  title="1"
                  subtitle="Customer complaint so far"
                />
              </div>

              {/* Testimonial */}
              <div className="squircle-lg gradient-subtle p-8 sm:p-10 border border-(--color-accent-yellow)/30">
                <div
                  className="text-2xl sm:text-3xl mb-4 text-(--color-accent-yellow)"
                  aria-label="5 stars"
                >
                  ★★★★★
                </div>
                <p className="text-xl sm:text-2xl font-medium leading-snug text-(--text-primary)">
                  &ldquo;I thought this was just another transfer app — I was so
                  wrong. It helped me structure my business payments. Now
                  I&apos;m no longer confused about my finances.&rdquo;
                </p>
                <p className="mt-6 text-sm font-semibold text-(--text-secondary)">
                  — A Zidwell Business Owner
                </p>
              </div>

              {/* Freebies */}
              <section className="space-y-5">
                <h2 className="text-3xl sm:text-4xl font-bold text-(--text-primary)">
                  What you get, free
                </h2>
                <div className="squircle-lg bg-(--bg-primary) border border-(--border-color) p-6 sm:p-8 shadow-[var(--shadow-soft)]">
                  <ul className="grid sm:grid-cols-2 gap-4">
                    {freebies.map((item) => (
                      <li key={item} className="flex items-center gap-3">
                        <span className="h-8 w-8 rounded-full bg-(--color-accent-yellow)/20 flex items-center justify-center flex-shrink-0">
                          <Check
                            className="h-4 w-4 text-(--color-accent-yellow)"
                            strokeWidth={3}
                          />
                        </span>
                        <span className="text-base font-medium text-(--text-primary)">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* Terms */}
              <section className="squircle-lg bg-(--bg-primary) border border-(--border-color) p-6 sm:p-8 shadow-[var(--shadow-soft)]">
                <label
                  htmlFor="terms"
                  className="flex items-start gap-4 cursor-pointer"
                >
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(v) => setTermsAccepted(v === true)}
                    className="mt-1 h-6 w-6 rounded-md data-[state=checked]:bg-(--color-accent-yellow) data-[state=checked]:border-(--color-accent-yellow) data-[state=checked]:text-(--color-ink)"
                  />
                  <span className="text-base text-(--text-primary) leading-relaxed">
                    I acknowledge and agree to Zidwell&apos;s{" "}
                    <a
                      href="#"
                      className="text-(--color-accent-yellow) font-semibold underline underline-offset-2"
                    >
                      Terms of Use
                    </a>{" "}
                    and{" "}
                    <a
                      href="#"
                      className="text-(--color-accent-yellow) font-semibold underline underline-offset-2"
                    >
                      Privacy Policy
                    </a>
                    . I confirm the information I&apos;ve provided is accurate.
                  </span>
                </label>
              </section>
            </div>
          )}
        </div>
      </main>

      {/* ─── STICKY CTA (inside left column) ─── */}
      <div className="sticky bottom-0 z-30 bg-(--bg-primary)/95 backdrop-blur-md border-t border-(--border-color) mt-auto">
        <div className="mx-auto max-w-2xl px-5 py-4 sm:py-5 space-y-3">
          <Button
            onClick={handleContinue}
            disabled={!canContinue || isSubmitting}
            className={cn(
              "w-full h-16 squircle-md text-base font-semibold cursor-pointer",
              "bg-(--color-accent-yellow) text-(--color-ink) hover:opacity-90",
              "disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            )}
          >
            {isSubmitting ? (
              "Creating account..."
            ) : (
              <>
                {isReviewStep && <Sparkles className="mr-2 h-5 w-5" />}
                {ctaLabel}
              </>
            )}
          </Button>

          <p className="text-center text-sm text-(--text-secondary)">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-(--color-accent-yellow) font-medium hover:underline"
            >
              Login instead
            </Link>
          </p>
        </div>
      </div>

      {/* Activation modal */}
      <Dialog
        open={showActivationModal}
        onOpenChange={(open) => {
          if (!open) handleActivationModalClose();
        }}
      >
        <DialogContent className="max-w-md squircle-lg border border-(--border-color) bg-(--bg-primary) p-0 overflow-hidden gap-0">
          <div className="bg-(--color-accent-yellow) p-8 text-center space-y-3">
            <div className="mx-auto h-16 w-16 squircle-md bg-black/10 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-(--color-ink)" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-2xl sm:text-3xl font-bold text-(--color-ink)">
                Account Created!
              </DialogTitle>
              <DialogDescription className="text-(--color-ink)/80 text-base">
                Fund your account with ₦2,000 or more to activate it.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="squircle-md bg-(--bg-secondary) border border-(--border-color) p-5 space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-(--text-secondary)">
                  Bank Name
                </p>
                <p className="text-lg font-semibold text-(--text-primary) break-words">
                  Wema Bank
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-(--text-secondary)">
                  Account Name
                </p>
                <p className="text-lg font-semibold text-(--text-primary) break-words">
                  {accountName}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-(--text-secondary)">
                  Account Number
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-2xl font-bold text-(--text-primary) tracking-widest">
                    {accountNumber}
                  </p>
                  <button
                    onClick={handleCopyAccountNumber}
                    className={cn(
                      "h-10 px-4 squircle-md text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer",
                      copied
                        ? "bg-(--color-lemon-green) text-white"
                        : "bg-(--bg-primary) text-(--text-primary) hover:bg-(--bg-secondary) border border-(--border-color)"
                    )}
                    aria-label={copied ? "Copied" : "Copy account number"}
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            </div>

            <div className="squircle-md gradient-subtle border border-(--color-accent-yellow)/30 p-4 flex gap-3">
              <Sparkles className="h-5 w-5 text-(--color-accent-yellow) flex-shrink-0 mt-0.5" />
              <p className="text-sm text-(--text-primary) leading-relaxed">
                <strong>
                  Fund Your Account with ₦2,000 or More to Activate It.
                </strong>{" "}
                Account activation happens instantly once the account is funded.
              </p>
            </div>

            <Button
              onClick={handleActivationModalClose}
              className="w-full h-14 squircle-md text-base font-semibold bg-(--color-accent-yellow) text-(--color-ink) hover:opacity-90 cursor-pointer"
            >
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Verification modal */}
      <VerificationModal
        isOpen={showVerificationModal}
        onClose={handleVerificationModalClose}
        email={registeredEmail}
        onResend={handleResendVerification}
        isResending={resendingVerification}
      />
    </div>
  );
};

/* ─── Sub-components ─── */

const ProgressBar = ({
  current,
  total,
}: {
  current: number;
  total: number;
}) => {
  const pct = (current / total) * 100;
  return (
    <div className="h-2 w-full bg-(--bg-secondary) rounded-full overflow-hidden">
      <div
        className="h-full bg-(--color-accent-yellow) rounded-full transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

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
      <p className="text-sm font-semibold text-(--color-accent-yellow) uppercase tracking-widest">
        {eyebrow}
      </p>
      <h1 className="text-4xl sm:text-5xl font-bold leading-[1.05] text-(--text-primary)">
        {title}
      </h1>
      {subtitle && (
        <p className="text-lg text-(--text-secondary) max-w-xl">{subtitle}</p>
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
    <Label
      htmlFor={id}
      className="text-base font-medium text-(--text-primary)"
    >
      {label}
      {hint && (
        <span className="ml-2 font-normal text-sm text-(--text-secondary)">
          ({hint})
        </span>
      )}
    </Label>
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
    className={cn(
      "group relative text-left w-full p-6 sm:p-7 cursor-pointer",
      "squircle-lg border bg-(--bg-primary) transition-all duration-200",
      selected
        ? "border-(--color-accent-yellow) gradient-subtle shadow-[var(--shadow-soft)]"
        : "border-(--border-color) hover:border-(--text-secondary)/40"
    )}
  >
    <div className="flex items-start gap-5">
      <div
        className={cn(
          "flex-shrink-0 h-16 w-16 squircle-md flex items-center justify-center text-3xl",
          selected
            ? "bg-(--color-accent-yellow) text-(--color-ink)"
            : "bg-(--bg-secondary) text-(--text-primary)"
        )}
      >
        {emoji ?? icon}
      </div>
      <div className="flex-1 pt-1">
        <h3 className="text-2xl font-bold text-(--text-primary)">{title}</h3>
        <p className="mt-1 text-base text-(--text-secondary) leading-snug">
          {description}
        </p>
      </div>
      <div
        className={cn(
          "flex-shrink-0 h-7 w-7 rounded-full border-2 flex items-center justify-center mt-1 transition-colors",
          selected
            ? "border-(--color-accent-yellow) bg-(--color-accent-yellow)"
            : "border-(--border-color) bg-transparent"
        )}
      >
        {selected && (
          <Check className="h-4 w-4 text-(--color-ink)" strokeWidth={3} />
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
    className={cn(
      "w-full h-16 px-6 squircle-md border text-left font-medium text-base transition-all cursor-pointer",
      "flex items-center justify-between",
      selected
        ? "border-(--color-accent-yellow) bg-(--color-accent-yellow)/5 text-(--text-primary)"
        : "border-(--border-color) bg-(--bg-primary) hover:border-(--text-secondary)/40 text-(--text-primary)"
    )}
  >
    <span>{label}</span>
    <span
      className={cn(
        "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors",
        selected
          ? "border-(--color-accent-yellow) bg-(--color-accent-yellow)"
          : "border-(--border-color)"
      )}
    >
      {selected && (
        <Check className="h-3.5 w-3.5 text-(--color-ink)" strokeWidth={3} />
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
    className={cn(
      "w-full min-h-[64px] px-6 py-4 squircle-md border text-left transition-all cursor-pointer",
      "flex items-center gap-4",
      selected
        ? "border-(--color-accent-yellow) bg-(--color-accent-yellow)/5"
        : "border-(--border-color) bg-(--bg-primary) hover:border-(--text-secondary)/40"
    )}
  >
    <span
      className={cn(
        "flex-shrink-0 h-7 w-7 squircle-sm border-2 flex items-center justify-center transition-colors",
        selected
          ? "border-(--color-accent-yellow) bg-(--color-accent-yellow)"
          : "border-(--border-color)"
      )}
    >
      {selected && (
        <Check className="h-4 w-4 text-(--color-ink)" strokeWidth={3} />
      )}
    </span>
    <span className="text-base font-medium text-(--text-primary)">
      {label}
    </span>
  </button>
);

const TrustLaurel = ({
  emoji,
  title,
  subtitle,
}: {
  emoji: string;
  title: string;
  subtitle: string;
}) => (
  <div className="squircle-lg bg-(--bg-primary) border border-(--border-color) p-6 sm:p-8 text-center shadow-[var(--shadow-soft)]">
    <div className="flex items-center justify-center gap-2 text-(--text-primary)">
      <LaurelSide side="left" />
      <span className="text-3xl sm:text-4xl">{emoji}</span>
      <LaurelSide side="right" />
    </div>
    <div className="mt-3 text-3xl sm:text-4xl font-bold text-(--text-primary)">
      {title}
    </div>
    <div className="mt-1 text-sm sm:text-base text-(--text-secondary) font-medium">
      {subtitle}
    </div>
  </div>
);

const LaurelSide = ({ side }: { side: "left" | "right" }) => (
  <svg
    width="36"
    height="56"
    viewBox="0 0 36 56"
    fill="none"
    className={cn(
      "text-(--color-accent-yellow)",
      side === "right" && "-scale-x-100"
    )}
    aria-hidden
  >
    <path
      d="M30 4 Q10 28 24 52"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
    {[8, 16, 24, 32, 40, 48].map((y, i) => (
      <ellipse
        key={i}
        cx={22 - i * 1.2}
        cy={y}
        rx="6"
        ry="2.4"
        transform={`rotate(${-40 + i * 5} ${22 - i * 1.2} ${y})`}
        fill="currentColor"
      />
    ))}
  </svg>
);

export default Onboarding;