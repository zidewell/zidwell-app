"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { startPremblyVerification } from "@/lib/prembly-sdk";
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
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useUserContextData } from "@/app/context/userData";
import Swal from "sweetalert2";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3 | "provisioning" | "success";

interface AccountDetails {
  accountNumber: string;
  accountName: string;
  bankName: string;
  provider: string;
  accountType: string;
}

interface PremblyRedirectResult {
  status: string | null;
  code: string | null;
  message: string | null;
  sessionId: string | null;
}

interface Props {
  premblyResult?: PremblyRedirectResult | null;
}

const IdentityVerificationFlow = ({ premblyResult = null }: Props) => {
  const router = useRouter();
  const { userData, setUserData } = useUserContextData();

  const isBusiness = userData?.purpose === "business";
  const isRegisteredBusiness =
    isBusiness && userData?.is_business_registered === true;
  const totalSteps = isRegisteredBusiness ? 3 : 2;

  const [step, setStep] = useState<Step>(1);

  const [identityLoading, setIdentityLoading] = useState(false);
  const [identityError, setIdentityError] = useState<string | null>(null);

  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState(false);

  const [rcNumber, setRcNumber] = useState("");
  const [cacLoading, setCacLoading] = useState(false);
  const [cacError, setCacError] = useState<string | null>(null);
  const [cacAttempts, setCacAttempts] = useState(0);

  const [account, setAccount] = useState<AccountDetails | null>(null);
  const [copied, setCopied] = useState(false);

  const [networkError, setNetworkError] = useState<string | null>(null);
  const [retryAction, setRetryAction] = useState<(() => void) | null>(null);

  const [countdown, setCountdown] = useState(5);

  const processedResultRef = useRef(false);

  // ─── Clean URL query params ───
  const cleanUrl = () => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.delete("status");
    url.searchParams.delete("code");
    url.searchParams.delete("message");
    url.searchParams.delete("session_id");
    window.history.replaceState({}, "", url.toString());
  };

  // ─── Clear local progress ───
  const clearLocalProgress = () => {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem("prembly_session_id");
    sessionStorage.removeItem("zidwell:verification:progress");
  };

  // ═══════════════════════════════════════════════════════════
  // GUARD: already-verified users get redirected immediately
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    if (!userData) return;

    const isFullyVerified =
      userData.bvnVerification === "verified" &&
      userData.bank78Verified === true;

    if (isFullyVerified) {
      router.replace("/dashboard");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);

  // ═══════════════════════════════════════════════════════════
  // RESUME: skip completed steps on mount
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    if (!userData) return;
    if (processedResultRef.current && premblyResult) return; // prembly handling in flight
    if (step !== 1) return; // only auto-skip when we're on step 1

    const identityDone = userData.bvnVerification === "verified";
    const pinDone = userData.pinSet === true;
    const accountDone = userData.bank78Verified === true;

    // Fully done — the guard above handles this, but just in case
    if (identityDone && accountDone) {
      router.replace("/dashboard");
      return;
    }

    if (!identityDone) return; // start at step 1

    if (!pinDone) {
      setStep(2);
      return;
    }

    // PIN done but no account yet → either CAC (business registered) or provisioning
    if (isRegisteredBusiness) {
      setStep(3);
      return;
    }

    // Personal → resume provisioning
    runProvisioning();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);

  // ═══════════════════════════════════════════════════════════
  // AUTO-REDIRECT on success
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    if (step !== "success") return;

    setCountdown(5);
    clearLocalProgress();

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          router.push("/dashboard");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [step, router]);

  // ═══════════════════════════════════════════════════════════
  // CORE: save identity result
  // ═══════════════════════════════════════════════════════════
  async function handlePremblyResult(response: any) {
    setIdentityError(null);
    setNetworkError(null);

    if (response?.code === "E02") {
      setIdentityLoading(false);
      setIdentityError("Verification cancelled. You can try again anytime.");
      return;
    }

    if (response?.code !== "00" || response?.status !== "success") {
      setIdentityLoading(false);
      setIdentityError(
        response?.message || "Identity verification failed. Please try again."
      );
      return;
    }

    try {
      const res = await fetchWithRetry("/api/verify/identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ premblyResponse: response }),
        retries: 2,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save identity verification");
      }

      setUserData({
        ...userData,
        bvnVerification: "verified",
        identityVerified: true,
      });

      setIdentityLoading(false);
      setStep(2);
    } catch (err: any) {
      setIdentityLoading(false);

      if (isNetworkError(err)) {
        setNetworkError(
          "Connection lost. Check your internet and try again."
        );
        setRetryAction(() => () => handlePremblyResult(response));
      } else {
        setIdentityError(err.message || "Something went wrong. Please retry.");
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // HANDLE Prembly redirect back from SDK
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    if (!premblyResult || processedResultRef.current) return;
    if (!premblyResult.code || !premblyResult.status) return;

    processedResultRef.current = true;

    const handleReturn = async () => {
      setIdentityLoading(true);
      setIdentityError(null);

      if (premblyResult.code === "E02") {
        setIdentityLoading(false);
        setIdentityError("Verification cancelled. You can try again anytime.");
        cleanUrl();
        return;
      }

      if (premblyResult.code !== "00" || premblyResult.status !== "success") {
        setIdentityLoading(false);
        setIdentityError(
          premblyResult.message || "Verification failed. Please try again."
        );
        cleanUrl();
        return;
      }

      const premblyResponse = {
        code: premblyResult.code,
        status: premblyResult.status,
        message: premblyResult.message,
        session_id: premblyResult.sessionId,
      };

      await handlePremblyResult(premblyResponse);
      cleanUrl();
    };

    handleReturn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [premblyResult]);

  // ═══════════════════════════════════════════════════════════
  // Start identity verification
  // ═══════════════════════════════════════════════════════════
  const handleStartIdentity = async () => {
    setIdentityLoading(true);
    setIdentityError(null);
    setNetworkError(null);

    try {
      const returnUrl = `${window.location.origin}/verification`;
      await startPremblyVerification(returnUrl);
    } catch (err: any) {
      setIdentityLoading(false);
      if (isNetworkError(err)) {
        setNetworkError("Connection lost. Check your internet and try again.");
        setRetryAction(() => handleStartIdentity);
      } else {
        setIdentityError(err.message || "Could not start verification.");
      }
    }
  };

  // ═══════════════════════════════════════════════════════════
  // Save PIN
  // ═══════════════════════════════════════════════════════════
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

      if (!res.ok) throw new Error(data.error || "Failed to save PIN");

      setUserData({ ...userData, pinSet: true });
      setPinLoading(false);

      if (isRegisteredBusiness) {
        setStep(3);
      } else {
        await runProvisioning();
      }
    } catch (err: any) {
      setPinLoading(false);
      if (isNetworkError(err)) {
        setNetworkError("Connection lost. Check your internet and try again.");
        setRetryAction(() => handleSavePin);
      } else {
        setPinError(err.message);
      }
    }
  };

  // ═══════════════════════════════════════════════════════════
  // Verify CAC
  // ═══════════════════════════════════════════════════════════
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
        body: JSON.stringify({
          rcNumber: rcNumber.trim(),
          companyType: "RC",
        }),
        retries: 2,
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "CAC verification failed");

      setCacLoading(false);
      await runProvisioning();
    } catch (err: any) {
      setCacLoading(false);

      if (isNetworkError(err)) {
        setNetworkError("Connection lost. Check your internet and try again.");
        setRetryAction(() => handleVerifyCAC);
        return;
      }

      const newAttempts = cacAttempts + 1;
      setCacAttempts(newAttempts);

      if (newAttempts >= 3) {
        Swal.fire({
          icon: "warning",
          title: "CAC Verification Failed",
          text: "We couldn't verify your CAC after 3 attempts. Please contact support.",
          confirmButtonColor: "#FDC020",
        });
        setCacError("Verification failed after 3 attempts. Contact support.");
        return;
      }

      setCacError(`${err.message} (Attempt ${newAttempts}/3)`);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // Provision account
  // ═══════════════════════════════════════════════════════════
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
        timeoutMs: 30_000,
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Account creation failed");

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
        bank78Verified: true,
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
        // Stay on provisioning screen so user sees the retry button
        setStep("provisioning");
        return;
      }

      Swal.fire({
        icon: "error",
        title: "Account Creation Failed",
        text: err.message || "Please try again in a moment.",
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
    await navigator.clipboard.writeText(account.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

      {/* ─── Network error banner ─── */}
      {networkError && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-(--color-accent-yellow)/10 border border-(--color-accent-yellow)/30">
          <WifiOff className="h-5 w-5 text-(--color-accent-yellow) flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-(--text-primary) font-medium mb-2">
              {networkError}
            </p>
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

      {/* ─── STEP 1 — Identity ─── */}
      {step === 1 && (
        <div className="space-y-8">
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl font-bold leading-[1.05] text-(--text-primary)">
              Verify your identity
            </h1>
            <p className="text-lg text-(--text-secondary) max-w-xl">
              We use Prembly to verify your BVN, NIN, or other government ID.
              This keeps Zidwell safe for everyone.
            </p>
          </div>

          <div className="squircle-lg bg-(--bg-primary) border border-(--border-color) p-6 sm:p-8 shadow-[var(--shadow-soft)] space-y-5">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 squircle-md bg-(--color-accent-yellow)/20 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="h-6 w-6 text-(--color-accent-yellow)" />
              </div>
              <div>
                <h3 className="font-semibold text-(--text-primary)">
                  Secure identity check
                </h3>
                <p className="text-sm text-(--text-secondary) mt-1">
                  Choose BVN, NIN, Passport, Driver&apos;s License, or Voter&apos;s
                  card. Takes about 60 seconds.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-(--color-accent-yellow)/10 border border-(--color-accent-yellow)/30">
              <Info className="h-4 w-4 text-(--color-accent-yellow) flex-shrink-0 mt-0.5" />
              <p className="text-sm text-(--text-primary)">
                You&apos;ll be redirected to a secure verification page and
                brought back here automatically.
              </p>
            </div>

            {identityError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-400">
                  {identityError}
                </p>
              </div>
            )}

            <Button
              onClick={handleStartIdentity}
              disabled={identityLoading}
              className="w-full h-14 squircle-md text-base font-semibold bg-(--color-accent-yellow) text-(--color-ink) hover:opacity-90 cursor-pointer"
            >
              {identityLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Redirecting to verification...
                </>
              ) : (
                "Start Identity Verification"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ─── STEP 2 — PIN ─── */}
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
                <h3 className="font-semibold text-(--text-primary)">
                  Keep it memorable but private
                </h3>
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
                  onChange={(e) =>
                    setConfirmPin(e.target.value.replace(/\D/g, ""))
                  }
                  disabled={pinLoading}
                  className="h-14 squircle-md px-5 text-base tracking-[0.5em] text-center border-(--border-color) bg-(--bg-secondary) text-(--text-primary)"
                />
              </div>
            </div>

            {pinError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-400">
                  {pinError}
                </p>
              </div>
            )}

            <Button
              onClick={handleSavePin}
              disabled={
                pinLoading || pin.length !== 4 || confirmPin.length !== 4
              }
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

      {/* ─── STEP 3 — CAC ─── */}
      {step === 3 && (
        <div className="space-y-8">
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl font-bold leading-[1.05] text-(--text-primary)">
              Verify your business
            </h1>
            <p className="text-lg text-(--text-secondary) max-w-xl">
              Enter your CAC registration number to verify your business and
              unlock full business accounts.
            </p>
          </div>

          <div className="squircle-lg bg-(--bg-primary) border border-(--border-color) p-6 sm:p-8 shadow-[var(--shadow-soft)] space-y-5">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 squircle-md bg-(--color-accent-yellow)/20 flex items-center justify-center flex-shrink-0">
                <Building2 className="h-6 w-6 text-(--color-accent-yellow)" />
              </div>
              <div>
                <h3 className="font-semibold text-(--text-primary)">
                  CAC / RC number
                </h3>
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
                <p className="text-sm text-red-600 dark:text-red-400">
                  {cacError}
                </p>
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
                "Verify & Create Business Account"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ─── PROVISIONING ─── */}
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

      {/* ─── SUCCESS ─── */}
      {step === "success" && account && (
        <div className="space-y-8 text-center">
          <div className="mx-auto h-20 w-20 rounded-full bg-(--color-lemon-green)/20 flex items-center justify-center">
            <Check
              className="h-10 w-10 text-(--color-lemon-green)"
              strokeWidth={3}
            />
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-(--text-primary)">
              You&apos;re verified!
            </h1>
            <p className="text-(--text-secondary)">
              Your Zidwell account is ready to use.
            </p>
          </div>

          <div className="squircle-lg bg-(--bg-primary) border border-(--border-color) p-6 sm:p-8 shadow-[var(--shadow-soft)] space-y-5 text-left">
            <div className="space-y-1">
              <p className="text-sm text-(--text-secondary) font-medium">
                Bank Name
              </p>
              <p className="text-lg font-semibold text-(--text-primary)">
                {account.bankName}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-(--text-secondary) font-medium">
                Account Name
              </p>
              <p className="text-lg font-semibold text-(--text-primary)">
                {account.accountName}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-(--text-secondary) font-medium">
                Account Number
              </p>
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
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
            <div className="text-xs text-(--text-secondary) pt-2 border-t border-(--border-color)">
              Provider:{" "}
              <span className="font-semibold uppercase">
                {account.provider}
              </span>
              {" · "}
              Type:{" "}
              <span className="font-semibold capitalize">
                {account.accountType.replace(/_/g, " ")}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => router.push("/dashboard")}
              className="w-full h-14 squircle-md text-base font-semibold bg-(--color-accent-yellow) text-(--color-ink) hover:opacity-90 cursor-pointer"
            >
              Go to Dashboard {countdown > 0 ? `(${countdown})` : ""}
            </Button>
            <p className="text-sm text-(--text-secondary) text-center">
              Redirecting automatically...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default IdentityVerificationFlow;