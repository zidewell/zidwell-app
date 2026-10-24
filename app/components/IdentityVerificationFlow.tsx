"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { fetchWithRetry, isNetworkError } from "@/lib/fetch-with-retry"; 
import {
  Check,
  ShieldCheck,
  Building2,
  Lock,
  Copy,
  Loader2,
  AlertCircle,
  Info,
  WifiOff,
  IdCard,
  BadgeCheck,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import SelfieCapture from "./SelfieCapture";
import { useUserContextData } from "@/app/context/userData";
import Swal from "sweetalert2";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3 | "provisioning" | "success";
type IdType = "bvn" | "nin";

interface AccountDetails {
  accountNumber: string;
  accountName: string;
  bankName: string;
  provider: string;
  accountType: string;
}

interface ApiError {
  error: string;
  code?: string;
  retryable?: boolean;
  step?: "identity" | "pin" | "cac";
}

function parseApiError(err: any): ApiError {
  if (err?.message) {
    try {
      const parsed = JSON.parse(err.message);
      if (parsed?.error) return parsed as ApiError;
    } catch {}
    return { error: err.message };
  }
  if (typeof err === "string") return { error: err };
  return { error: "Something went wrong. Please try again." };
}

const debug = (label: string, data?: any) => {
  console.log(`[IdentityFlow] ${label}`, data ?? "");
};

const IdentityVerificationFlow = () => {
  const router = useRouter();
  const { userData, setUserData } = useUserContextData();

  const isBusiness = userData?.purpose === "business";
  const isRegisteredBusiness =
    isBusiness && userData?.is_business_registered === true;
  const totalSteps = isRegisteredBusiness ? 3 : 2;

  const [step, setStep] = useState<Step>(1);

  // Step 1 — Identity
  const [idType, setIdType] = useState<IdType>("bvn");
  const [idNumber, setIdNumber] = useState("");
  const [selfie, setSelfie] = useState<string | null>(null);
  const [identityLoading, setIdentityLoading] = useState(false);
  const [identityError, setIdentityError] = useState<string | null>(null);
  const [verifiedName, setVerifiedName] = useState<string | null>(null);
  const [faceConfidence, setFaceConfidence] = useState<number | null>(null);
  const [nameMatched, setNameMatched] = useState<boolean | null>(null);
  const [showNameConfirmation, setShowNameConfirmation] = useState(false);

  // Step 2 — PIN
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState(false);

  // Step 3 — CAC
  const [rcNumber, setRcNumber] = useState("");
  const [cacLoading, setCacLoading] = useState(false);
  const [cacError, setCacError] = useState<string | null>(null);
  const [cacAttempts, setCacAttempts] = useState(0);
  const [verifiedBusinessName, setVerifiedBusinessName] = useState<string | null>(null);
  const [showBusinessConfirmation, setShowBusinessConfirmation] = useState(false);

  // Provisioning / Success
  const [account, setAccount] = useState<AccountDetails | null>(null);
  const [copied, setCopied] = useState(false);

  // Network / retry
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [retryAction, setRetryAction] = useState<(() => void) | null>(null);

  const processedRef = useRef(false);

  const clearLocalProgress = () => {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem("zidwell:verification:progress");
  };

  // Already verified guard
  useEffect(() => {
    if (!userData) return;
    const isFullyVerified =
      userData.bvnVerification === "verified" &&
      (userData.bank78Verified === true || userData.verificationCompleted === true);
    if (isFullyVerified) {
      router.replace("/dashboard");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);

  // Resume guard
  useEffect(() => {
    if (!userData || processedRef.current) return;
    if (step !== 1) return;

    const identityDone = userData.bvnVerification === "verified";
    const pinDone = userData.pinSet === true;
    const accountDone =
      userData.bank78Verified === true || userData.verificationCompleted === true;

    if (identityDone && accountDone) {
      router.replace("/dashboard");
      return;
    }

    if (!identityDone) return;
    if (!pinDone) {
      setStep(2);
      return;
    }
    if (isRegisteredBusiness) {
      setStep(3);
      return;
    }
    runProvisioning();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);

  // Success redirect
  useEffect(() => {
    if (step !== "success") return;
    clearLocalProgress();
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/user/me", {
          credentials: "include",
          headers: { "Cache-Control": "no-cache" },
        });
        if (res.ok) {
          const fresh = await res.json();
          if (fresh?.id && !cancelled) setUserData(fresh);
        }
      } catch (e) {
        console.warn("[IdentityFlow] Post-success refresh failed:", e);
      } finally {
        if (!cancelled) router.replace("/dashboard");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [step, router, setUserData]);

  // ─── Step 1: submit identity ───
  const handleVerifyIdentity = async () => {
    setIdentityError(null);
    setNetworkError(null);

    if (!/^\d{11}$/.test(idNumber)) {
      setIdentityError(`${idType.toUpperCase()} must be exactly 11 digits.`);
      return;
    }
    if (!selfie) {
      setIdentityError("Please take a selfie first.");
      return;
    }

    setIdentityLoading(true);
    try {
      const res = await fetchWithRetry("/api/verify/identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          idType,
          idNumber,
          imageBase64: selfie,
        }),
        retries: 2,
        timeoutMs: 30000,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data));

      const verified = data.verifiedName as string;
      setVerifiedName(verified);
      setFaceConfidence(data.faceConfidence ?? null);
      setNameMatched(data.nameMatched ?? true);

      setUserData({
        ...userData,
        bvnVerification: "verified",
        identityVerified: true,
        fullName: verified,
      });

      setIdentityLoading(false);
      setShowNameConfirmation(true);
    } catch (err: any) {
      setIdentityLoading(false);
      if (isNetworkError(err)) {
        setNetworkError("Connection lost. Check your internet and try again.");
        setRetryAction(() => handleVerifyIdentity);
        return;
      }
      const apiErr = parseApiError(err);
      setIdentityError(apiErr.error);
    }
  };

  const handleNameConfirmed = () => {
    setShowNameConfirmation(false);
    setStep(2);
  };

  // ─── Step 2: PIN ───
  const handleSavePin = async () => {
    setPinError(null);
    setNetworkError(null);
    if (!/^\d{4}$/.test(pin)) {
      setPinError("PIN must be exactly 4 digits");
      return;
    }
    if (pin !== confirmPin) {
      setPinError("PINs do not match");
      return;
    }

    setPinLoading(true);
    try {
      const res = await fetchWithRetry("/api/verify/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pin, confirmPin }),
        retries: 2,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data));

      setUserData({ ...userData, pinSet: true });
      setPinLoading(false);
      if (isRegisteredBusiness) setStep(3);
      else await runProvisioning();
    } catch (err: any) {
      setPinLoading(false);
      if (isNetworkError(err)) {
        setNetworkError("Connection lost. Check your internet and try again.");
        setRetryAction(() => handleSavePin);
        return;
      }
      const apiErr = parseApiError(err);
      setPinError(apiErr.error);
    }
  };

  // ─── Step 3: CAC ───
  const handleVerifyCAC = async () => {
    setCacError(null);
    setNetworkError(null);
    if (!rcNumber.trim()) {
      setCacError("Enter your RC number");
      return;
    }

    setCacLoading(true);
    try {
      const res = await fetchWithRetry("/api/verify/business-cac", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rcNumber: rcNumber.trim() }),
        retries: 2,
        timeoutMs: 30000,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data));

      setVerifiedBusinessName(data.verifiedBusinessName || null);
      setCacLoading(false);
      setShowBusinessConfirmation(true);
    } catch (err: any) {
      setCacLoading(false);
      if (isNetworkError(err)) {
        setNetworkError("Connection lost. Check your internet and try again.");
        setRetryAction(() => handleVerifyCAC);
        return;
      }
      const apiErr = parseApiError(err);
      const newAttempts = cacAttempts + 1;
      setCacAttempts(newAttempts);
      if (newAttempts >= 3) {
        Swal.fire({
          icon: "warning",
          title: "CAC Verification Failed",
          text:
            apiErr.error ||
            "We couldn't verify your CAC after 3 attempts. Please contact support.",
          confirmButtonColor: "#FDC020",
        });
        setCacError(apiErr.error);
        return;
      }
      setCacError(`${apiErr.error} (Attempt ${newAttempts}/3)`);
    }
  };

  const handleBusinessConfirmed = async () => {
    setShowBusinessConfirmation(false);
    await runProvisioning();
  };

  // ─── Provisioning ───
  const runProvisioning = async () => {
    setStep("provisioning");
    setNetworkError(null);
    try {
      const res = await fetchWithRetry("/api/verify/provision-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
        retries: 3,
        timeoutMs: 30000,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data));

      setAccount({
        accountNumber: data.account.accountNumber,
        accountName: data.account.accountName,
        bankName: data.account.bankName,
        provider: data.provider,
        accountType: data.accountType,
      });

      setUserData({
        ...userData,
        ...(data.updates || {}),
        verificationCompleted: true,
        identityVerified: true,
        bvnVerification: "verified",
        bankName: data.account.bankName,
        bankAccountName: data.account.accountName,
        bankAccountNumber: data.account.accountNumber,
      });

      triggerConfetti();
      setStep("success");
    } catch (err: any) {
      if (isNetworkError(err)) {
        setNetworkError(
          "Connection lost while creating your account. Your progress is safe — tap retry to continue."
        );
        setRetryAction(() => runProvisioning);
        setStep("provisioning");
        return;
      }
      const apiErr = parseApiError(err);
      if (apiErr.step === "pin") {
        setStep(2);
        setPinError(apiErr.error);
        return;
      }
      if (apiErr.step === "identity") {
        setStep(1);
        setIdentityError(apiErr.error);
        return;
      }
      Swal.fire({
        icon: "error",
        title: "Account Creation Failed",
        text: apiErr.error || "Please try again in a moment.",
        confirmButtonColor: "#FDC020",
      });
      setStep(isRegisteredBusiness ? 3 : 2);
    }
  };

  const triggerConfetti = () => {
    const end = Date.now() + 1500;
    const colors = ["#00B64F", "#FDC020", "#191919", "#FFFFFF"];
    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  };

  const handleCopy = async () => {
    if (!account) return;
    try {
      await navigator.clipboard.writeText(account.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const stepNumber = typeof step === "number" ? step : totalSteps;
  const pct = (stepNumber / totalSteps) * 100;

  return (
    <div className="space-y-10">
      {typeof step === "number" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-(--color-accent-yellow) uppercase tracking-widest text-xs">
              Step {step} of {totalSteps}
            </span>
            <span className="text-(--text-secondary) tabular-nums">
              {step} / {totalSteps}
            </span>
          </div>
          <div className="h-2 w-full bg-(--bg-secondary) rounded-full overflow-hidden">
            <div
              className="h-full bg-(--color-accent-yellow) rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {networkError && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-(--color-accent-yellow)/10 border border-(--color-accent-yellow)/30">
          <WifiOff className="h-5 w-5 text-(--color-accent-yellow) flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-(--text-primary) font-medium mb-2">{networkError}</p>
            {retryAction && (
              <button
                onClick={() => {
                  setNetworkError(null);
                  setRetryAction(null);
                  retryAction();
                }}
                className="text-sm font-semibold text-(--color-accent-yellow) hover:underline cursor-pointer"
              >
                Try again
              </button>
            )}
          </div>
        </div>
      )}

      {/* STEP 1 — IDENTITY */}
      {step === 1 && !showNameConfirmation && (
        <div className="space-y-8">
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl font-bold leading-[1.05] text-(--text-primary)">
              Verify your identity
            </h1>
            <p className="text-lg text-(--text-secondary) max-w-xl">
              Enter your BVN or NIN and take a selfie. We&apos;ll match your
              face to the photo on file.
            </p>
          </div>

          <div className="squircle-lg bg-(--bg-primary) border border-(--border-color) p-6 sm:p-8 shadow-[var(--shadow-soft)] space-y-6">
            {/* ID type toggle */}
            <div className="space-y-2">
              <Label className="text-(--text-primary)">Choose ID type</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["bvn", "nin"] as IdType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setIdType(t);
                      setIdNumber("");
                      setSelfie(null);        // ← force retake
                      setIdentityError(null);
                    }}
                    disabled={identityLoading}
                    className={cn(
                      "h-12 squircle-md border-2 font-semibold text-sm transition-all cursor-pointer",
                      idType === t
                        ? "border-(--color-accent-yellow) bg-(--color-accent-yellow)/5 text-(--text-primary)"
                        : "border-(--border-color) bg-(--bg-primary) text-(--text-secondary) hover:border-(--text-secondary)/40"
                    )}
                  >
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* ID number */}
            <div className="space-y-2">
              <Label htmlFor="idNumber" className="text-(--text-primary)">
                {idType.toUpperCase()} Number
              </Label>
              <Input
                id="idNumber"
                inputMode="numeric"
                maxLength={11}
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter 11 digits"
                disabled={identityLoading}
                className="h-14 squircle-md px-5 text-base tracking-widest border-(--border-color) bg-(--bg-secondary) text-(--text-primary)"
              />
            </div>

            {/* Selfie */}
            <div className="space-y-2">
              <Label className="text-(--text-primary)">Selfie</Label>
              <SelfieCapture
                onCapture={(d) => setSelfie(d)}
                onClear={() => setSelfie(null)}
                disabled={identityLoading}
                cameraEnabled={idNumber.length === 11}
                disabledHint="Enter your 11-digit ID number above to enable the camera."
              />
            </div>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-(--color-accent-yellow)/10 border border-(--color-accent-yellow)/30">
              <Info className="h-4 w-4 text-(--color-accent-yellow) flex-shrink-0 mt-0.5" />
              <p className="text-sm text-(--text-primary)">
                Ensure good lighting and a clear view of your face. Your selfie
                is compared to the photo on file for your {idType.toUpperCase()}.
              </p>
            </div>

            {identityError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-400">{identityError}</p>
              </div>
            )}

            <Button
              onClick={handleVerifyIdentity}
              disabled={identityLoading || idNumber.length !== 11 || !selfie}
              className="w-full h-14 squircle-md text-base font-semibold bg-(--color-accent-yellow) text-(--color-ink) hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              {identityLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Verifying your identity...
                </>
              ) : (
                "Verify Identity"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* STEP 1 — NAME CONFIRMATION */}
      {step === 1 && showNameConfirmation && (
        <div className="space-y-8">
          <div className="space-y-3 text-center">
            <div className="mx-auto h-20 w-20 rounded-full bg-(--color-lemon-green)/20 flex items-center justify-center">
              <BadgeCheck className="h-10 w-10 text-(--color-lemon-green)" strokeWidth={3} />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold leading-[1.05] text-(--text-primary)">
              Identity verified
            </h1>
            <p className="text-lg text-(--text-secondary) max-w-xl mx-auto">
              Here&apos;s the name on record. This is how your name will appear
              across Zidwell.
            </p>
          </div>

          <div className="squircle-lg bg-(--bg-primary) border-2 border-(--color-lemon-green)/40 p-6 sm:p-8 space-y-5">
            <div className="space-y-1">
              <p className="text-sm font-medium text-(--text-secondary)">Verified Name</p>
              <p className="text-2xl font-bold text-(--text-primary) tracking-tight">
                {verifiedName}
              </p>
            </div>

            {faceConfidence !== null && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-(--text-secondary)">Face Match Confidence</p>
                <p className="text-lg font-semibold text-(--text-primary)">
                  {faceConfidence.toFixed(2)}%
                </p>
              </div>
            )}

            {nameMatched === false && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-(--color-accent-yellow)/10 border border-(--color-accent-yellow)/30">
                <AlertCircle className="h-4 w-4 text-(--color-accent-yellow) flex-shrink-0 mt-0.5" />
                <p className="text-sm text-(--text-primary)">
                  The name on your ID is slightly different from what you entered
                  at signup. Your account will use the ID-verified name above.
                </p>
              </div>
            )}
          </div>

          <Button
            onClick={handleNameConfirmed}
            className="w-full h-14 squircle-md text-base font-semibold bg-(--color-accent-yellow) text-(--color-ink) hover:opacity-90 cursor-pointer"
          >
            Continue
          </Button>
        </div>
      )}

      {/* STEP 2 — PIN */}
      {step === 2 && (
        <div className="space-y-8">
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl font-bold leading-[1.05] text-(--text-primary)">
              Create your transaction PIN
            </h1>
            <p className="text-lg text-(--text-secondary) max-w-xl">
              You&apos;ll use this 4-digit PIN to authorize withdrawals and
              payments. Don&apos;t share it with anyone.
            </p>
          </div>

          <div className="squircle-lg bg-(--bg-primary) border border-(--border-color) p-6 sm:p-8 shadow-[var(--shadow-soft)] space-y-5">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 squircle-md bg-(--color-accent-yellow)/20 flex items-center justify-center flex-shrink-0">
                <Lock className="h-6 w-6 text-(--color-accent-yellow)" />
              </div>
              <div>
                <h3 className="font-semibold text-(--text-primary)">Keep it memorable but private</h3>
                <p className="text-sm text-(--text-secondary) mt-1">
                  Avoid 1234, 0000, or your birth year.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-(--text-primary)">Transaction PIN</Label>
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  disabled={pinLoading}
                  className="h-14 squircle-md px-5 text-base tracking-[0.5em] text-center border-(--border-color) bg-(--bg-secondary) text-(--text-primary)"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-(--text-primary)">Confirm PIN</Label>
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="••••"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                  disabled={pinLoading}
                  className="h-14 squircle-md px-5 text-base tracking-[0.5em] text-center border-(--border-color) bg-(--bg-secondary) text-(--text-primary)"
                />
              </div>
            </div>

            {pinError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-400">{pinError}</p>
              </div>
            )}

            <Button
              onClick={handleSavePin}
              disabled={pinLoading || pin.length !== 4 || confirmPin.length !== 4}
              className="w-full h-14 squircle-md text-base font-semibold bg-(--color-accent-yellow) text-(--color-ink) hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              {pinLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : isRegisteredBusiness ? (
                "Continue"
              ) : (
                "Finish & Create Account"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3 — CAC */}
      {step === 3 && !showBusinessConfirmation && (
        <div className="space-y-8">
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl font-bold leading-[1.05] text-(--text-primary)">
              Verify your business
            </h1>
            <p className="text-lg text-(--text-secondary) max-w-xl">
              Enter your CAC registration number to verify your business.
            </p>
          </div>

          <div className="squircle-lg bg-(--bg-primary) border border-(--border-color) p-6 sm:p-8 shadow-[var(--shadow-soft)] space-y-5">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 squircle-md bg-(--color-accent-yellow)/20 flex items-center justify-center flex-shrink-0">
                <Building2 className="h-6 w-6 text-(--color-accent-yellow)" />
              </div>
              <div>
                <h3 className="font-semibold text-(--text-primary)">CAC / RC number</h3>
                <p className="text-sm text-(--text-secondary) mt-1">
                  Found on your CAC certificate. Format: RC1234567 or 1234567.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-(--text-primary)">RC Number</Label>
              <Input
                placeholder="RC1234567"
                value={rcNumber}
                onChange={(e) => setRcNumber(e.target.value.toUpperCase())}
                disabled={cacLoading}
                className="h-14 squircle-md px-5 text-base border-(--border-color) bg-(--bg-secondary) text-(--text-primary)"
              />
            </div>

            {cacError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-400">{cacError}</p>
              </div>
            )}

            <Button
              onClick={handleVerifyCAC}
              disabled={cacLoading || !rcNumber.trim()}
              className="w-full h-14 squircle-md text-base font-semibold bg-(--color-accent-yellow) text-(--color-ink) hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              {cacLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Verifying CAC...
                </>
              ) : (
                "Verify Business"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3 — BUSINESS CONFIRMATION */}
      {step === 3 && showBusinessConfirmation && (
        <div className="space-y-8">
          <div className="space-y-3 text-center">
            <div className="mx-auto h-20 w-20 rounded-full bg-(--color-lemon-green)/20 flex items-center justify-center">
              <BadgeCheck className="h-10 w-10 text-(--color-lemon-green)" strokeWidth={3} />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold leading-[1.05] text-(--text-primary)">
              Business verified
            </h1>
            <p className="text-lg text-(--text-secondary) max-w-xl mx-auto">
              Here&apos;s the company name on record. This is how your business
              name will appear across Zidwell.
            </p>
          </div>

          <div className="squircle-lg bg-(--bg-primary) border-2 border-(--color-lemon-green)/40 p-6 sm:p-8 space-y-5">
            <div className="space-y-1">
              <p className="text-sm font-medium text-(--text-secondary)">Verified Company Name</p>
              <p className="text-2xl font-bold text-(--text-primary) tracking-tight">
                {verifiedBusinessName}
              </p>
            </div>
          </div>

          <Button
            onClick={handleBusinessConfirmed}
            className="w-full h-14 squircle-md text-base font-semibold bg-(--color-accent-yellow) text-(--color-ink) hover:opacity-90 cursor-pointer"
          >
            Continue
          </Button>
        </div>
      )}

      {/* PROVISIONING */}
      {step === "provisioning" && (
        <div className="text-center space-y-6 py-16">
          <div className="mx-auto h-16 w-16 rounded-full bg-(--color-accent-yellow)/20 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-(--color-accent-yellow)" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-(--text-primary)">
              Creating your account...
            </h2>
            <p className="text-(--text-secondary)">
              This takes a few seconds. Don&apos;t close this page.
            </p>
          </div>
        </div>
      )}

      {/* SUCCESS */}
      {step === "success" && account && (
        <div className="space-y-8 text-center">
          <div className="mx-auto h-20 w-20 rounded-full bg-(--color-lemon-green)/20 flex items-center justify-center">
            <Check className="h-10 w-10 text-(--color-lemon-green)" strokeWidth={3} />
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-(--text-primary)">You&apos;re verified!</h1>
            <p className="text-(--text-secondary)">Your Zidwell account is ready to use.</p>
          </div>

          <div className="squircle-lg bg-(--bg-primary) border border-(--border-color) p-6 sm:p-8 shadow-[var(--shadow-soft)] space-y-5 text-left">
            <div className="space-y-1">
              <p className="text-sm text-(--text-secondary) font-medium">Bank Name</p>
              <p className="text-lg font-semibold text-(--text-primary)">{account.bankName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-(--text-secondary) font-medium">Account Name</p>
              <p className="text-lg font-semibold text-(--text-primary)">{account.accountName}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-(--text-secondary) font-medium">Account Number</p>
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-2xl font-bold tracking-widest text-(--text-primary)">
                  {account.accountNumber}
                </p>
                <button
                  onClick={handleCopy}
                  className={cn(
                    "h-10 px-4 squircle-md text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer",
                    copied
                      ? "bg-(--color-lemon-green) text-white"
                      : "bg-(--bg-secondary) text-(--text-primary) border border-(--border-color)"
                  )}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
            <div className="text-xs text-(--text-secondary) pt-2 border-t border-(--border-color)">
              Provider:{" "}
              <span className="font-semibold uppercase">{account.provider}</span>
              {" · "}Type:{" "}
              <span className="font-semibold capitalize">
                {account.accountType.replace(/_/g, " ")}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-(--text-secondary)">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Taking you to your dashboard…</span>
            </div>
            <Button
              onClick={() => router.push("/dashboard")}
              variant="outline"
              className="w-full h-12 squircle-md text-sm font-medium border-(--border-color) text-(--text-primary) hover:bg-(--bg-secondary) cursor-pointer"
            >
              Go now instead
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IdentityVerificationFlow;