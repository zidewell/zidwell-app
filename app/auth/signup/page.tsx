"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { useState, useMemo, Suspense } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Globe2,
  Building2,
  User,
  Shield,
  Sparkles,
  Copy,
  X,
} from "lucide-react";
import Swal from "sweetalert2";
import confetti from "canvas-confetti";
import logo from "@/public/logo.png";
import { Input } from "@/app/components/ui/input";

type Region = "nigeria" | "outside" | "";
type Purpose = "personal" | "business" | "";

const TOTAL_STEPS = 6;

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

  // Step 6: KYC
  const [bvn, setBvn] = useState("");
  const [nin, setNin] = useState("");
  const [isRegistered, setIsRegistered] = useState<boolean>(true);
  const [businessName, setBusinessName] = useState("");
  const [cacNumber, setCacNumber] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [transactionPin, setTransactionPin] = useState("");
  const [showPin, setShowPin] = useState(false);

  // Activation modal
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [copied, setCopied] = useState(false);


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
      case 6: {
        const idOk = bvn.length === 11 && nin.length === 11;
        const pinOk = !transactionPin || /^\d{4}$/.test(transactionPin);
        if (purpose !== "business") return idOk && pinOk && termsAccepted;
        const nameOk = businessName.trim().length > 1;
        const cacOk = !isRegistered || cacNumber.trim().length > 3;
        const addressOk = businessAddress.trim().length > 4;
        const descOk = businessDescription.trim().length > 10;
        return (
          idOk &&
          nameOk &&
          cacOk &&
          addressOk &&
          descOk &&
          pinOk &&
          termsAccepted
        );
      }
      default:
        return false;
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
    bvn,
    nin,
    isRegistered,
    businessName,
    cacNumber,
    businessAddress,
    businessDescription,
    transactionPin,
    termsAccepted,
  ]);

  const handleBack = () => {
    if (step === 1) router.push("/");
    else setStep(step - 1);
  };

  const generateAccountNumber = () => {
    return Array.from({ length: 10 }, () =>
      Math.floor(Math.random() * 10),
    ).join("");
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

    if (step < TOTAL_STEPS) {
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

      console.log({
        fullName,
        email,
        phone,
        password,
        region,
        purpose,
        heardFrom,
        attractions,
        bvn,
        nin,
        isRegistered,
        businessName: purpose === "business" ? businessName : null,
        cacNumber: isRegistered ? cacNumber : null,
        businessAddress: purpose === "business" ? businessAddress : null,
        mapUrl: purpose === "business" ? mapUrl : null,
        businessDescription:
          purpose === "business" ? businessDescription : null,
        transactionPin: transactionPin || null,
      });

      // const response = await fetch("/api/register", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     fullName,
      //     email,
      //     phone,
      //     password,
      //     region,
      //     purpose,
      //     heardFrom,
      //     attractions,
      //     bvn,
      //     nin,
      //     isRegistered,
      //     businessName: purpose === "business" ? businessName : null,
      //     cacNumber: isRegistered ? cacNumber : null,
      //     businessAddress: purpose === "business" ? businessAddress : null,
      //     mapUrl: purpose === "business" ? mapUrl : null,
      //     businessDescription: purpose === "business" ? businessDescription : null,
      //     transactionPin: transactionPin || null,
      //   }),
      // });

      // const result = await response.json();

      // if (!response.ok) {
      //   throw new Error(result.error || "Registration failed");
      // }

      // Swal.close();

      // const name = purpose === "business" && businessName.trim()
      //   ? businessName.trim()
      //   : fullName.trim() || "Zidwell User";
      // setAccountName(name);
      // setAccountNumber(generateAccountNumber());
      // setShowActivationModal(true);

      confetti({
        particleCount: 180,
        spread: 100,
        origin: { y: 0.6 },
        colors: ["#00B64F", "#FDC020", "#191919", "#FFFFFF"],
      });
    } catch (error: any) {
      Swal.close();
      Swal.fire({
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
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item],
    );
  };

  const handleCopyAccountNumber = async () => {
    try {
      await navigator.clipboard.writeText(accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      Swal.fire({
        icon: "error",
        title: "Copy failed",
        text: "Please copy the account number manually.",
        confirmButtonColor: "#FDC020",
      });
    }
  };

  const ctaLabel = step === TOTAL_STEPS ? "Create Account" : "Continue";

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Top bar */}
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
                style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
              />
            </div>
          </div>

          <div className="hidden sm:block text-sm font-medium text-[var(--text-secondary)] tabular-nums">
            {step} / {TOTAL_STEPS}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-2xl px-5 pt-10 pb-32 sm:pt-16">
        <div key={step} className="animate-fade-in">
          {step === 1 && (
            <StepShell
              eyebrow="Step 1 of 6"
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
                    className="w-full h-14 px-5 rounded-2xl text-base bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] focus:border-[var(--color-accent-yellow)] focus:ring-2 focus:ring-[var(--color-accent-yellow)] outline-none transition-all"
                    autoFocus
                  />
                </Field>
                <Field id="phone" label="Phone Number">
                  <div className="flex items-center rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-sm focus-within:border-[var(--color-accent-yellow)] focus-within:ring-2 focus-within:ring-[var(--color-accent-yellow)] transition-all">
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
                    className="w-full h-14 px-5 rounded-2xl text-base bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] focus:border-[var(--color-accent-yellow)] focus:ring-2 focus:ring-[var(--color-accent-yellow)] outline-none transition-all"
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
                        className="h-14 pr-12"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      >
                        {showPassword ? "👁️" : "👁️‍🗨️"}
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
        className="h-14 pr-12"
      />

      <button
        type="button"
        onClick={() =>
          setShowConfirmPassword(!showConfirmPassword)
        }
        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
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
              eyebrow="Step 2 of 6"
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
                  description="Join the waitlist — we'll notify you when we launch in your region."
                />
              </div>
            </StepShell>
          )}

          {step === 3 && (
            <StepShell
              eyebrow="Step 3 of 6"
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
              eyebrow="Step 4 of 6"
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
              eyebrow="Step 5 of 6"
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

          {step === 6 && (
            <CheckoutStep
              purpose={purpose}
              bvn={bvn}
              setBvn={setBvn}
              nin={nin}
              setNin={setNin}
              isRegistered={isRegistered}
              setIsRegistered={setIsRegistered}
              businessName={businessName}
              setBusinessName={setBusinessName}
              cacNumber={cacNumber}
              setCacNumber={setCacNumber}
              businessAddress={businessAddress}
              setBusinessAddress={setBusinessAddress}
              mapUrl={mapUrl}
              setMapUrl={setMapUrl}
              businessDescription={businessDescription}
              setBusinessDescription={setBusinessDescription}
              termsAccepted={termsAccepted}
              setTermsAccepted={setTermsAccepted}
              transactionPin={transactionPin}
              setTransactionPin={setTransactionPin}
              showPin={showPin}
              setShowPin={setShowPin}
            />
          )}
        </div>
      </main>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-[var(--bg-primary)]/95 backdrop-blur-md border-t border-[var(--border-color)]">
        <div className="mx-auto max-w-2xl px-5 py-4 sm:py-5">
          <button
            onClick={handleContinue}
            disabled={!canContinue || loading}
            className="w-full h-16 rounded-2xl text-base font-semibold font-display bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:opacity-90 hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
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
                {step === TOTAL_STEPS && (
                  <Sparkles className="mr-2 h-5 w-5 inline" />
                )}
                {ctaLabel}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Activation success modal */}
      {showActivationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="max-w-md w-full rounded-2xl border-2 border-[var(--border-color)] bg-[var(--bg-primary)] overflow-hidden">
            <div className="bg-[var(--color-accent-yellow)] p-8 text-[var(--color-ink)] text-center space-y-3">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-[var(--color-ink)]/10 flex items-center justify-center">
                <Sparkles className="h-8 w-8" />
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold">
                Account Created!
              </h2>
              <p className="text-[var(--color-ink)]/80 text-base">
                Fund your business account with ₦2,000 or more to activate it.
              </p>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div className="rounded-2xl bg-[var(--bg-secondary)] border-2 border-[var(--border-color)] p-5 space-y-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[var(--text-secondary)]">
                    Account Name
                  </p>
                  <p className="font-display text-lg font-semibold text-[var(--text-primary)] break-words">
                    {accountName}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-[var(--text-secondary)]">
                    Account Number
                  </p>
                  <div className="flex items-center gap-3">
                    <p className="font-display text-2xl font-bold text-[var(--text-primary)] tracking-widest">
                      {accountNumber}
                    </p>
                    <button
                      onClick={handleCopyAccountNumber}
                      className={`h-10 px-4 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors ${
                        copied
                          ? "bg-[var(--color-accent-yellow)] text-[var(--color-ink)]"
                          : "bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]/80"
                      }`}
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

              <div className="rounded-2xl bg-[rgba(253,192,32,0.1)] border border-[rgba(253,192,32,0.3)] p-4 flex gap-3">
                <Sparkles className="h-5 w-5 text-[var(--color-accent-yellow)] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                  <strong>
                    Fund Your Business Account with ₦2,000 or More to Activate
                    It.
                  </strong>{" "}
                  Your account is ready — once we receive the funding, you'll
                  have full access.
                </p>
              </div>

              <button
                onClick={() => {
                  setShowActivationModal(false);
                  router.push("/dashboard");
                }}
                className="w-full h-14 rounded-2xl text-base font-semibold font-display bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:opacity-90 hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)] transition-all"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------- Sub-components ---------- */

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

/* ---------- Step 6: KYC + Checkout ---------- */

const CheckoutStep = ({
  purpose,
  bvn,
  setBvn,
  nin,
  setNin,
  isRegistered,
  setIsRegistered,
  businessName,
  setBusinessName,
  cacNumber,
  setCacNumber,
  businessAddress,
  setBusinessAddress,
  mapUrl,
  setMapUrl,
  businessDescription,
  setBusinessDescription,
  termsAccepted,
  setTermsAccepted,
  transactionPin,
  setTransactionPin,
  showPin,
  setShowPin,
}: any) => {
  const isBusiness = purpose === "business";

  return (
    <div className="space-y-12">
      <div className="text-center space-y-4">
        <p className="text-sm font-semibold text-[var(--color-accent-yellow)] uppercase tracking-wider">
          Step 6 of 6
        </p>
        <h1 className="font-display text-4xl sm:text-6xl font-bold leading-[1.02] text-[var(--text-primary)]">
          Activate Your {isBusiness ? "Business" : ""} Account
        </h1>
        <p className="text-lg sm:text-xl text-[var(--text-secondary)] max-w-xl mx-auto">
          Complete verification once and unlock everything Zidwell has to offer.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:gap-8">
        <div className="rounded-2xl bg-[var(--bg-primary)] border-2 border-[var(--border-color)] p-6 sm:p-8 text-center shadow-[var(--shadow-soft)]">
          <div className="text-3xl sm:text-4xl">🏆</div>
          <div className="mt-3 font-display text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
            165
          </div>
          <div className="mt-1 text-sm sm:text-base text-[var(--text-secondary)] font-medium">
            Businesses trust Zidwell
          </div>
        </div>
        <div className="rounded-2xl bg-[var(--bg-primary)] border-2 border-[var(--border-color)] p-6 sm:p-8 text-center shadow-[var(--shadow-soft)]">
          <div className="text-3xl sm:text-4xl">🏆</div>
          <div className="mt-3 font-display text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
            1
          </div>
          <div className="mt-1 text-sm sm:text-base text-[var(--text-secondary)] font-medium">
            Customer complaint so far
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="rounded-2xl bg-[rgba(253,192,32,0.05)] p-8 sm:p-10 shadow-[var(--shadow-soft)] border border-[var(--color-accent-yellow)]/10">
          <div className="text-2xl sm:text-3xl mb-4">★★★★★</div>
          <p className="font-display text-xl sm:text-2xl font-medium leading-snug text-[var(--text-primary)]">
            "I thought this was just another transfer app — I was so wrong. It
            helped me structure my business payments. Now I'm no longer confused
            about my finances."
          </p>
          <p className="mt-6 text-sm font-semibold text-[var(--text-secondary)]">
            — A Zidwell Business Owner
          </p>
        </div>
      </div>

      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
            {isBusiness
              ? "Business & Identity Verification"
              : "Identity Verification"}
          </h2>
          <p className="text-base text-[var(--text-secondary)]">
            We only ask for what's needed to open your account securely.
          </p>
        </div>

        <div className="rounded-2xl bg-[var(--bg-primary)] border-2 border-[var(--border-color)] p-6 sm:p-8 space-y-5 shadow-[var(--shadow-soft)]">
          {isBusiness && (
            <>
              <div className="space-y-3">
                <label className="text-base font-medium text-[var(--text-primary)]">
                  Is your business registered?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsRegistered(true)}
                    aria-pressed={isRegistered}
                    className={`h-14 rounded-2xl border-2 font-semibold text-base transition-all ${
                      isRegistered
                        ? "border-[var(--color-accent-yellow)] bg-[rgba(253,192,32,0.05)] text-[var(--text-primary)]"
                        : "border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-[var(--text-primary)]/20"
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRegistered(false)}
                    aria-pressed={!isRegistered}
                    className={`h-14 rounded-2xl border-2 font-semibold text-base transition-all ${
                      !isRegistered
                        ? "border-[var(--color-accent-yellow)] bg-[rgba(253,192,32,0.05)] text-[var(--text-primary)]"
                        : "border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-[var(--text-primary)]/20"
                    }`}
                  >
                    No
                  </button>
                </div>
                {!isRegistered && (
                  <p className="text-sm font-medium text-[var(--text-primary)] bg-[rgba(253,192,32,0.1)] border border-[var(--color-accent-yellow)]/40 rounded-2xl p-4 leading-relaxed">
                    Note: We pay stricter attention to transactions carried out
                    by unregistered businesses.
                  </p>
                )}
              </div>

              <Field
                id="businessName"
                label={
                  isRegistered
                    ? "Registered Business Name"
                    : "Preferred Business Name"
                }
              >
                <input
                  id="businessName"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder={
                    isRegistered
                      ? "Zidwell Technologies Ltd"
                      : "e.g. Johanne's Kitchen"
                  }
                  className="w-full h-14 px-5 rounded-2xl text-base bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] focus:border-[var(--color-accent-yellow)] focus:ring-2 focus:ring-[var(--color-accent-yellow)] outline-none transition-all"
                />
              </Field>
              <div
                className={
                  !isRegistered ? "opacity-40 pointer-events-none" : ""
                }
              >
                <Field id="cac" label="CAC Registration Number">
                  <input
                    id="cac"
                    value={cacNumber}
                    onChange={(e) => setCacNumber(e.target.value)}
                    placeholder="RC1234567"
                    disabled={!isRegistered}
                    className="w-full h-14 px-5 rounded-2xl text-base bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] focus:border-[var(--color-accent-yellow)] focus:ring-2 focus:ring-[var(--color-accent-yellow)] outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </Field>
              </div>

              <Field
                id="businessAddress"
                label="Business Address"
                hint="Answer correctly, we will verify this address"
              >
                <input
                  id="businessAddress"
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  placeholder="12 Admiralty Way, Lekki, Lagos"
                  className="w-full h-14 px-5 rounded-2xl text-base bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] focus:border-[var(--color-accent-yellow)] focus:ring-2 focus:ring-[var(--color-accent-yellow)] outline-none transition-all"
                />
              </Field>
              <Field
                id="mapUrl"
                label="Google Maps URL"
                hint="Paste a link to your location"
              >
                <input
                  id="mapUrl"
                  type="url"
                  value={mapUrl}
                  onChange={(e) => setMapUrl(e.target.value)}
                  placeholder="https://maps.google.com/..."
                  className="w-full h-14 px-5 rounded-2xl text-base bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] focus:border-[var(--color-accent-yellow)] focus:ring-2 focus:ring-[var(--color-accent-yellow)] outline-none transition-all"
                />
              </Field>
              <Field
                id="businessDescription"
                label="Describe your business"
                hint="Up to 100 words"
              >
                <textarea
                  id="businessDescription"
                  value={businessDescription}
                  onChange={(e) => {
                    const words = e.target.value
                      .trim()
                      .split(/\s+/)
                      .filter(Boolean);
                    if (words.length <= 100)
                      setBusinessDescription(e.target.value);
                  }}
                  placeholder="What do you sell or do? Who are your customers?"
                  className="min-h-32 w-full px-5 py-4 rounded-2xl text-base bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] focus:border-[var(--color-accent-yellow)] focus:ring-2 focus:ring-[var(--color-accent-yellow)] outline-none transition-all resize-vertical"
                />
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  {businessDescription.trim()
                    ? businessDescription.trim().split(/\s+/).filter(Boolean)
                        .length
                    : 0}{" "}
                  / 100 words
                </p>
              </Field>
            </>
          )}
          <Field id="bvn" label="BVN" hint="11 digits">
            <input
              id="bvn"
              inputMode="numeric"
              maxLength={11}
              value={bvn}
              onChange={(e) => setBvn(e.target.value.replace(/\D/g, ""))}
              placeholder="•••••••••••"
              className="w-full h-14 px-5 rounded-2xl text-base bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] focus:border-[var(--color-accent-yellow)] focus:ring-2 focus:ring-[var(--color-accent-yellow)] outline-none transition-all tracking-widest"
            />
          </Field>
          <Field id="nin" label="NIN" hint="11 digits">
            <input
              id="nin"
              inputMode="numeric"
              maxLength={11}
              value={nin}
              onChange={(e) => setNin(e.target.value.replace(/\D/g, ""))}
              placeholder="•••••••••••"
              className="w-full h-14 px-5 rounded-2xl text-base bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] focus:border-[var(--color-accent-yellow)] focus:ring-2 focus:ring-[var(--color-accent-yellow)] outline-none transition-all tracking-widest"
            />
          </Field>
          <Field
            id="transactionPin"
            label="Transaction PIN"
            hint="4 digits (optional)"
          >
            <div className="relative">
              <input
                id="transactionPin"
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                maxLength={4}
                value={transactionPin}
                onChange={(e) =>
                  setTransactionPin(e.target.value.replace(/\D/g, ""))
                }
                placeholder="****"
                className="w-full h-14 px-5 pr-12 rounded-2xl text-base bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] focus:border-[var(--color-accent-yellow)] focus:ring-2 focus:ring-[var(--color-accent-yellow)] outline-none transition-all tracking-widest"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                {showPin ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border-2 border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-white)] p-8 sm:p-10 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <h2 className="font-display text-2xl sm:text-3xl font-bold">
              Verify & Activate Your {isBusiness ? "Business" : ""} Bank Account
            </h2>
            <p className="text-base opacity-80">
              Identity verification, compliance checks, and account setup — all
              in one step.
            </p>
          </div>
          <div className="rounded-2xl bg-[var(--color-accent-yellow)] text-[var(--color-ink)] px-5 py-3 font-display">
            <div className="text-xs font-semibold uppercase tracking-wider opacity-80">
              One-time
            </div>
            <div className="text-2xl font-bold">₦1,000</div>
          </div>
        </div>

        <div className="rounded-2xl bg-white/10 border border-white/20 p-6 space-y-3">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-[var(--color-accent-yellow)]" />
            <h3 className="font-display text-lg font-semibold">How it works</h3>
          </div>
          <p className="text-base opacity-90 leading-relaxed">
            Fund your wallet with{" "}
            <strong className="text-[var(--color-accent-yellow)]">
              ₦2,000
            </strong>
            . We debit{" "}
            <strong className="text-[var(--color-accent-yellow)]">
              ₦1,000
            </strong>{" "}
            for verification and leave{" "}
            <strong className="text-[var(--color-accent-yellow)]">
              ₦1,000
            </strong>{" "}
            in your wallet so you can try Zidwell before committing.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-[var(--color-accent-yellow)]" />
            <h3 className="font-display text-lg font-semibold">
              Why we verify everyone
            </h3>
          </div>
          <ul className="grid sm:grid-cols-2 gap-2.5">
            {[
              "Protect users from fraud",
              "Meet compliance requirements",
              "Secure your business account",
              "Keep Zidwell safe for everyone",
            ].map((r) => (
              <li
                key={r}
                className="flex items-center gap-2.5 text-base opacity-95"
              >
                <Check
                  className="h-5 w-5 text-[var(--color-accent-yellow)] flex-shrink-0"
                  strokeWidth={3}
                />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

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