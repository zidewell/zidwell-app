// app/onboarding/page.tsx
"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUserContextData } from "@/app/context/userData";
import {
  ArrowRight,
  Loader2,
  Sparkles,
  Check,
  Copy,
  CheckCircle2,
  Building2,
  Eye,
  EyeOff,
  Lock,
  Shield,
  LogOut,
} from "lucide-react";
import confetti from "canvas-confetti";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/app/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Image from "next/image";
import Swal from "sweetalert2";

type Purpose = "personal" | "business";

type CacData = {
  companyName: string;
  rcNumber: string;
  companyStatus: string;
  companyAddress: string;
  entityType: string;
  registrationDate: string;
  directors: any[];
};

type BvnData = {
  fullName: string;
  bvn: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  stateOfOrigin: string;
  lgaOfOrigin: string;
  residentialAddress: string;
  enrollmentBank: string;
  nationality: string;
  verificationReference: string;
  base64Image?: string | null;
  isSandbox?: boolean;
};

type BusinessState = {
  isRegistered: boolean | null;
  businessName: string;
  cacNumber: string;
  businessAddress: string;
  businessCategory: string;
  cacData: CacData | null;
};

type CompleteResult = {
  accountNumber: string;
  accountName: string;
  bankName: string;
};

// ✅ Helper function to show error with SweetAlert2
const showErrorAlert = (title: string, message: string, details?: string) => {
  Swal.fire({
    icon: 'error',
    title: title,
    text: message,
    html: details ? `
      <div style="text-align: left; margin-top: 12px; padding: 12px; background: #f8f9fa; border-radius: 8px; font-size: 13px; color: #6b7280;">
        <strong>Details:</strong><br />
        <span style="font-family: monospace; font-size: 12px;">${details}</span>
      </div>
    ` : undefined,
    confirmButtonColor: '#FDC020',
    confirmButtonText: 'OK',
    background: '#ffffff',
    customClass: {
      popup: 'dark:bg-gray-800 dark:text-gray-100',
      title: 'dark:text-gray-100',
      htmlContainer: 'dark:text-gray-300',
    },
  });
};

// ✅ Helper function to show warning with SweetAlert2
const showWarningAlert = (title: string, message: string) => {
  Swal.fire({
    icon: 'warning',
    title: title,
    text: message,
    confirmButtonColor: '#FDC020',
    confirmButtonText: 'OK',
    background: '#ffffff',
    customClass: {
      popup: 'dark:bg-gray-800 dark:text-gray-100',
      title: 'dark:text-gray-100',
      htmlContainer: 'dark:text-gray-300',
    },
  });
};

// ✅ Helper function to show info with SweetAlert2
const showInfoAlert = (title: string, message: string) => {
  Swal.fire({
    icon: 'info',
    title: title,
    text: message,
    confirmButtonColor: '#FDC020',
    confirmButtonText: 'OK',
    background: '#ffffff',
    customClass: {
      popup: 'dark:bg-gray-800 dark:text-gray-100',
      title: 'dark:text-gray-100',
      htmlContainer: 'dark:text-gray-300',
    },
  });
};

function Stepper({ steps, current }: { steps: { id: string; label: string }[]; current: number }) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((step, idx) => {
        const isCurrent = idx === current;
        const isCompleted = idx < current;
        const isNotLast = idx < steps.length - 1;
        
        return (
          <div key={step.id} className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all",
                isCurrent
                  ? "bg-yellow-400 text-black"
                  : isCompleted
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
              )}
            >
              {isCompleted ? <Check className="h-4 w-4" /> : idx + 1}
            </div>
            <span
              className={cn(
                "text-xs font-medium",
                isCurrent
                  ? "text-gray-900 dark:text-gray-100"
                  : isCompleted
                  ? "text-gray-500 dark:text-gray-400"
                  : "text-gray-400 dark:text-gray-500"
              )}
            >
              {step.label}
            </span>
            {isNotLast && (
              <div
                className={cn(
                  "h-0.5 w-6",
                  isCompleted ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function BvnStep({
  bvn,
  setBvn,
  bvnData,
  setBvnData,
  purpose,
  userData
}: {
  bvn: string;
  setBvn: (v: string) => void;
  bvnData: BvnData | null;
  setBvnData: (v: BvnData | null) => void;
  purpose: Purpose;
  userData?: any;
}) {
  const [loading, setLoading] = useState(false);
  const [showBvn, setShowBvn] = useState(false);
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState(false);

  console.log(bvnData);

  async function verifyBvn() {
    if (bvn.length !== 11) {
      setError("Enter a valid 11-digit BVN");
      showWarningAlert("Invalid BVN", "Please enter an 11-digit BVN number.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/users-verification/bvn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: bvn }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        const result = data.data;
        
        console.log("📥 BVN Response Data:", result);
        console.log("📞 Phone from BVN:", result.phone);
        
        const phoneNumber = result.phone || result.phoneNumber1 || "";

        setBvnData({
          fullName: `${result.firstName || ""} ${result.lastName || ""}`.trim(),
          bvn: result.bvn || bvn,
          phone: phoneNumber || userData?.phone || "",
          email: result.email || "",
          dateOfBirth: result.dateOfBirth || "",
          gender: result.gender || "",
          stateOfOrigin: result.stateOfOrigin || "",
          lgaOfOrigin: result.lgaOfOrigin || "",
          residentialAddress: result.residentialAddress || "",
          enrollmentBank: result.enrollmentBank || "",
          nationality: result.nationality || "",
          verificationReference: result.verification_reference || result.reference || "",
          base64Image: result.base64Image || null,
          isSandbox: result.is_sandbox_mode || false,
        });
        
        toast.success("BVN verified successfully");
        
        // Show success alert
        Swal.fire({
          icon: 'success',
          title: 'BVN Verified!',
          text: 'Your identity has been successfully verified.',
          timer: 2000,
          showConfirmButton: false,
          background: '#ffffff',
          customClass: {
            popup: 'dark:bg-gray-800 dark:text-gray-100',
          },
        });
      } else {
        setError(data.message || "BVN verification failed");
        toast.error("Verification failed", { description: data.message });
        showErrorAlert(
          "Verification Failed",
          data.message || "Unable to verify your BVN. Please check and try again.",
          data.details || undefined
        );
      }
    } catch (error: any) {
      setError(error.message || "Verification failed");
      toast.error("Error", { description: "Failed to verify BVN" });
      showErrorAlert(
        "Connection Error",
        "Failed to verify BVN. Please check your internet connection and try again.",
        error.message
      );
    } finally {
      setLoading(false);
    }
  }

  const getImageSrc = () => {
    if (!bvnData?.base64Image) return null;
    if (bvnData.base64Image.startsWith('data:image')) {
      return bvnData.base64Image;
    }
    return `data:image/jpeg;base64,${bvnData.base64Image}`;
  };

  const imageSrc = getImageSrc();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Verify your identity
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Enter your BVN to verify your identity for your {purpose} account.
        </p>
        {bvnData?.isSandbox && (
          <div className="mt-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3">
            <p className="text-xs text-yellow-700 dark:text-yellow-400">
              ⚠️ Sandbox mode - Using test data. Switch to production for live verification.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bvn-input" className="text-gray-700 dark:text-gray-300">BVN</Label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Input
              id="bvn-input"
              inputMode="numeric"
              maxLength={11}
              value={bvn}
              onChange={(e) => {
                setBvn(e.target.value.replace(/\D/g, ""));
                setError("");
              }}
              type={showBvn ? "text" : "password"}
              placeholder="Enter 11-digit BVN"
              disabled={!!bvnData}
              className={cn(
                "h-12 pr-10 font-mono tracking-widest",
                bvnData && "border-green-500"
              )}
            />
            <button
              type="button"
              onClick={() => setShowBvn((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              {showBvn ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <Button
            type="button"
            onClick={verifyBvn}
            disabled={loading || !!bvnData || bvn.length !== 11}
            className={cn(
              "h-12 min-w-28",
              bvnData
                ? "bg-green-500 text-white hover:bg-green-600"
                : "bg-yellow-400 text-black hover:bg-yellow-500"
            )}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : bvnData ? (
              "Verified"
            ) : (
              "Verify"
            )}
          </Button>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        {bvnData && (
          <div className="mt-4 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="font-medium text-gray-900 dark:text-gray-100">Identity Verified</span>
            </div>
            
            {imageSrc && (
              <div className="flex justify-center py-2">
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  <img
                    src={imageSrc}
                    alt="BVN Photo"
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                  {imageError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400 text-xs">
                      No photo
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Full Name</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{bvnData.fullName}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Phone</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{bvnData.phone || "Not provided"}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Date of Birth</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{bvnData.dateOfBirth}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">BVN</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">•••••••{bvnData.bvn.slice(-4)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PinStep({
  pin,
  confirmPin,
  setPin,
  setConfirmPin,
}: {
  pin: string;
  confirmPin: string;
  setPin: (v: string) => void;
  setConfirmPin: (v: string) => void;
}) {
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const mismatch = pin.length === 4 && confirmPin.length === 4 && pin !== confirmPin;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Set your transaction PIN
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          You'll use this 4-digit PIN to authorize payments and transfers.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pin" className="text-gray-700 dark:text-gray-300">New PIN</Label>
          <div className="relative">
            <Input
              id="pin"
              inputMode="numeric"
              type={show1 ? "text" : "password"}
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
              className="h-12 text-center text-2xl tracking-[0.6em] pr-10 font-semibold"
            />
            <button
              type="button"
              onClick={() => setShow1((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              {show1 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm" className="text-gray-700 dark:text-gray-300">Confirm PIN</Label>
          <div className="relative">
            <Input
              id="confirm"
              inputMode="numeric"
              type={show2 ? "text" : "password"}
              maxLength={4}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
              className="h-12 text-center text-2xl tracking-[0.6em] pr-10 font-semibold"
            />
            <button
              type="button"
              onClick={() => setShow2((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              {show2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {mismatch && <p className="text-sm text-red-500">PINs do not match.</p>}

      <div className="flex items-start gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
        <Lock className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400" />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Choose a PIN you can remember — avoid birthdays or repeating digits like 1111.
        </p>
      </div>
    </div>
  );
}

function BusinessStep({
  state,
  setState,
}: {
  state: BusinessState;
  setState: (updater: (s: BusinessState) => BusinessState) => void;
}) {
  const [loading, setLoading] = useState(false);
  const cacVerified = !!state.cacData;

  async function verifyCac() {
    if (!state.cacNumber || state.cacNumber.trim().length < 4) {
      showWarningAlert("Invalid CAC Number", "Please enter a valid CAC/RC number.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/users-verification/cac", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rc_number: state.cacNumber, company_type: "RC" }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        const result = data.data;
        const businessInfo = result.business_info;

        const cacData: CacData = {
          companyName: businessInfo?.company_name || "",
          rcNumber: businessInfo?.rc_number || state.cacNumber,
          companyStatus: businessInfo?.company_status || "",
          companyAddress: businessInfo?.company_address || "",
          entityType: businessInfo?.entity_type || "",
          registrationDate: businessInfo?.registration_date || "",
          directors: businessInfo?.directors || [],
        };

        setState((s) => ({
          ...s,
          cacData,
          businessName: cacData.companyName || s.businessName,
          businessAddress: cacData.companyAddress || s.businessAddress,
        }));

        toast.success("CAC verified", { description: cacData.companyName });
        
        Swal.fire({
          icon: 'success',
          title: 'CAC Verified!',
          text: `Business "${cacData.companyName}" has been verified successfully.`,
          timer: 2000,
          showConfirmButton: false,
          background: '#ffffff',
          customClass: {
            popup: 'dark:bg-gray-800 dark:text-gray-100',
          },
        });
      } else {
        toast.error("CAC verification failed", { description: data.message });
        showErrorAlert(
          "CAC Verification Failed",
          data.message || "Unable to verify your CAC number. Please check and try again.",
          data.details || undefined
        );
      }
    } catch (e: any) {
      toast.error("CAC verification failed", { description: e.message });
      showErrorAlert(
        "Connection Error",
        "Failed to verify CAC. Please check your internet connection and try again.",
        e.message
      );
    } finally {
      setLoading(false);
    }
  }

  const CATEGORIES = [
    "Technology",
    "Retail",
    "Services",
    "Manufacturing",
    "Agriculture",
    "Education",
    "Healthcare",
    "Finance",
    "Real Estate",
    "Other",
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Tell us about your business
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          We'll set up your business wallet and payout account.
        </p>
      </div>

      <div className="space-y-3">
        <Label className="text-gray-700 dark:text-gray-300">Is your business registered with CAC?</Label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: true, label: "Yes, it's registered" },
            { key: false, label: "No, not yet" },
          ].map((opt) => {
            const active = state.isRegistered === opt.key;
            return (
              <button
                key={String(opt.key)}
                type="button"
                onClick={() =>
                  setState((s) => ({ ...s, isRegistered: opt.key }))
                }
                className={cn(
                  "flex h-14 items-center justify-center gap-2 rounded-xl border-2 font-medium transition-all",
                  active
                    ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 text-gray-900 dark:text-gray-100"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:border-yellow-400/50"
                )}
              >
                {active && <Check className="h-4 w-4 text-yellow-400" />}
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {state.isRegistered !== null && (
        <div className="space-y-4">
          {state.isRegistered && (
            <div className="space-y-2">
              <Label htmlFor="cac" className="text-gray-700 dark:text-gray-300">CAC / RC number</Label>
              <div className="flex gap-3">
                <Input
                  id="cac"
                  value={state.cacNumber}
                  onChange={(e) =>
                    setState((s) => ({ ...s, cacNumber: e.target.value }))
                  }
                  placeholder="e.g. RC1234567"
                  disabled={cacVerified}
                  className={cn("h-12", cacVerified && "border-green-500")}
                />
                <Button
                  type="button"
                  onClick={verifyCac}
                  disabled={loading || cacVerified || state.cacNumber.trim().length < 4}
                  className={cn(
                    "h-12 min-w-28",
                    cacVerified
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "bg-purple-600 text-white hover:bg-purple-700"
                  )}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : cacVerified ? (
                    "Verified"
                  ) : (
                    "Verify"
                  )}
                </Button>
              </div>
              {state.cacData && (
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-3 py-2 text-xs text-gray-900 dark:text-gray-100">
                  <Building2 className="h-4 w-4 text-green-500" />
                  <span className="font-medium">{state.cacData.companyName}</span>
                  <span className="text-gray-500 dark:text-gray-400">•</span>
                  <span className="text-gray-500 dark:text-gray-400">{state.cacData.companyStatus}</span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="bname" className="text-gray-700 dark:text-gray-300">Business name</Label>
            <Input
              id="bname"
              value={state.businessName}
              onChange={(e) =>
                setState((s) => ({ ...s, businessName: e.target.value }))
              }
              placeholder={state.isRegistered ? "Registered business name" : "e.g. Johanne's Kitchen"}
              disabled={cacVerified}
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="baddr" className="text-gray-700 dark:text-gray-300">Business address</Label>
            <Input
              id="baddr"
              value={state.businessAddress}
              onChange={(e) =>
                setState((s) => ({ ...s, businessAddress: e.target.value }))
              }
              placeholder="12 Admiralty Way, Lekki, Lagos"
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700 dark:text-gray-300">Business category</Label>
            <Select
              value={state.businessCategory}
              onValueChange={(v) =>
                setState((s) => ({ ...s, businessCategory: v }))
              }
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewStep({
  purpose,
  bvnData,
  business,
}: {
  purpose: Purpose;
  bvnData: BvnData;
  business: BusinessState;
}) {
  const rows: { label: string; value: string }[] = [
    { label: "Account type", value: purpose === "business" ? "Business" : "Personal" },
    { label: "Full name", value: bvnData.fullName },
    { label: "Phone", value: bvnData.phone || "Not provided" },
    { label: "BVN", value: `••••••• ${bvnData.bvn.slice(-4)}` },
  ];
  if (purpose === "business") {
    rows.push(
      { label: "Business", value: business.businessName || "—" },
      {
        label: "CAC",
        value: business.isRegistered
          ? business.cacData?.rcNumber || "—"
          : "Not registered",
      },
      { label: "Address", value: business.businessAddress || "—" },
      { label: "Category", value: business.businessCategory || "—" },
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Review & activate
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Confirm everything looks right, then activate your wallet.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
        <dl className="divide-y divide-gray-200 dark:divide-gray-700">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <dt className="text-sm text-gray-500 dark:text-gray-400">{r.label}</dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-gray-100 text-right truncate max-w-[60%]" title={r.value}>
                {r.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="relative overflow-hidden rounded-2xl border-2 border-yellow-400 bg-black p-6 text-white">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-yellow-400/20 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-400" />
              <p className="text-xs font-semibold uppercase tracking-widest text-yellow-400">
                One-time activation
              </p>
            </div>
            <h3 className="mt-2 text-xl font-bold">Activate your Zidwell wallet</h3>
            <p className="mt-1 max-w-md text-sm text-white/70">
              Fund with <span className="font-semibold text-yellow-400">₦2,000</span>. We debit{" "}
              <span className="font-semibold text-yellow-400">₦1,000</span> for KYC verification —
              the rest stays in your wallet.
            </p>
          </div>
          <div className="rounded-xl bg-yellow-400 px-4 py-2 text-lg font-bold text-black shadow-lg">
            ₦1,000
          </div>
        </div>

        <ul className="relative mt-5 grid gap-2 text-sm text-white/80 sm:grid-cols-2">
          {[
            "Dedicated NUBAN account number",
            "Send & receive nationwide",
            "Pay bills, buy airtime & data",
            "Bank-grade encryption",
          ].map((f) => (
            <li key={f} className="flex items-center gap-2">
              <ArrowRight className="h-3.5 w-3.5 text-yellow-400" />
              {f}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
        <Shield className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400" />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Insured by NDIC. Zidwell is a licensed partner and never has direct
          access to funds outside your wallet.
        </p>
      </div>
    </div>
  );
}

function SuccessModal({
  open,
  onOpenChange,
  result,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  result: CompleteResult | null;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.accountNumber);
      setCopied(true);
      toast.success("Account number copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copy failed");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden p-0">
        <div className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle2 className="h-9 w-9 text-green-500" />
          </div>
          <div className="space-y-1">
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Account activated 🎉
            </DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              Your Zidwell wallet is live. Save your account details below.
            </DialogDescription>
          </div>

          {result && (
            <div className="w-full space-y-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-5 text-left">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Bank
                </p>
                <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-gray-100">{result.bankName}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Account name
                </p>
                <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-gray-100">{result.accountName}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Account number
                </p>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <p className="font-mono text-2xl font-bold tracking-wider text-gray-900 dark:text-gray-100">
                    {result.accountNumber}
                  </p>
                  <Button
                    type="button"
                    onClick={copy}
                    size="sm"
                    className="bg-yellow-400 text-black hover:bg-yellow-500"
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={() => {
              onOpenChange(false);
              window.location.href = "/dashboard";
            }}
            className="mt-2 h-12 w-full bg-yellow-400 text-black hover:bg-yellow-500"
          >
            Go to dashboard
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { userData, loading: userLoading, refreshUserData, setUserData } = useUserContextData();
  const logoutInProgress = useRef(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [purpose] = useState<Purpose>(userData?.purpose === "business" ? "business" : "personal");
  const [bvn, setBvn] = useState("");
  const [bvnData, setBvnData] = useState<BvnData | null>(null);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [business, setBusiness] = useState<BusinessState>({
    isRegistered: null,
    businessName: "",
    cacNumber: "",
    businessAddress: "",
    businessCategory: "",
    cacData: null,
  });

  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CompleteResult | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [verificationChecked, setVerificationChecked] = useState(false);

  const steps = useMemo(() => {
    const base = [
      { id: "bvn", label: "Identity" },
      { id: "pin", label: "Security" },
    ];
    if (purpose === "business") base.push({ id: "biz", label: "Business" });
    base.push({ id: "review", label: "Review" });
    return base;
  }, [purpose]);

  const current = steps[stepIndex];

  const isUserVerified = useCallback((): boolean => {
    if (!userData) return false;
    return (
      userData.bvn_verification === 'verified' ||
      userData.identity_verified === true ||
      userData.kyc_level === 'personal_verified' ||
      userData.kyc_level === 'business_verified' ||
      userData.verification_completed === true
    );
  }, [userData]);

  useEffect(() => {
    if (isRedirecting || userLoading) return;
    if (!userData) return;

    if (verificationChecked) {
      const verified = isUserVerified();
      if (verified) {
        setIsRedirecting(true);
        router.replace("/dashboard");
      }
      return;
    }

    const verified = isUserVerified();
    setVerificationChecked(true);

    if (verified) {
      setIsRedirecting(true);
      router.replace("/dashboard");
    }
  }, [userData, userLoading, router, isRedirecting, verificationChecked, isUserVerified]);

  useEffect(() => {
    if (userData?.id) {
      setVerificationChecked(false);
      setIsRedirecting(false);
    }
  }, [userData?.id]);

  const handleLogout = async () => {
    if (logoutInProgress.current || isLoggingOut) return;

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You will be logged out of your account",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#FDC020",
      cancelButtonColor: "#6b6b6b",
      confirmButtonText: "Yes, logout",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      background: '#ffffff',
      customClass: {
        popup: 'dark:bg-gray-800 dark:text-gray-100',
        title: 'dark:text-gray-100',
        htmlContainer: 'dark:text-gray-300',
      },
    });

    if (!result.isConfirmed) return;

    logoutInProgress.current = true;
    setIsLoggingOut(true);

    Swal.fire({
      title: "Logging out...",
      text: "Please wait",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
      background: '#ffffff',
      customClass: {
        popup: 'dark:bg-gray-800 dark:text-gray-100',
        title: 'dark:text-gray-100',
        htmlContainer: 'dark:text-gray-300',
      },
    });

    const clearLocalData = () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("userData");
        sessionStorage.removeItem("userData");
        document.cookie.split(";").forEach((cookie) => {
          const [name] = cookie.split("=");
          const trimmedName = name.trim();
          if (trimmedName === "verified" || 
              trimmedName === "session" || 
              trimmedName === "sb-access-token" ||
              trimmedName === "sb-refresh-token" ||
              trimmedName === "sb-client-session" ||
              trimmedName === "sb-login-time") {
            document.cookie = `${trimmedName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          }
        });
      }
      setUserData(null);
    };

    clearLocalData();

    const apiCalls = [];

    apiCalls.push(
      fetch("/api/logout", { method: "POST" }).catch((err) =>
        console.error("Logout API error:", err)
      )
    );

    if (userData) {
      apiCalls.push(
        fetch("/api/activity/last-logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userData.id,
            email: userData.email,
            login_history_id: userData.current_login_session,
          }),
        }).catch((err) => console.error("Error tracking logout activity:", err))
      );
    }

    Promise.allSettled(apiCalls).catch((err) =>
      console.error("Background logout tasks failed:", err)
    );

    Swal.close();

    await Swal.fire({
      icon: "success",
      title: "Logged Out!",
      text: "You have been successfully logged out",
      timer: 1500,
      showConfirmButton: false,
      background: '#ffffff',
      customClass: {
        popup: 'dark:bg-gray-800 dark:text-gray-100',
        title: 'dark:text-gray-100',
        htmlContainer: 'dark:text-gray-300',
      },
    });

    router.push("/auth/login");

    setTimeout(() => {
      logoutInProgress.current = false;
      setIsLoggingOut(false);
    }, 500);
  };

  const canContinue = (() => {
    switch (current?.id) {
      case "bvn":
        return !!bvnData;
      case "pin":
        return pin.length === 4 && pin === confirmPin;
      case "biz":
        if (business.isRegistered === null) return false;
        if (business.isRegistered && !business.cacData) return false;
        if (business.businessName.trim().length < 2) return false;
        if (business.businessAddress.trim().length < 5) return false;
        if (!business.businessCategory) return false;
        return true;
      case "review":
        return true;
      default:
        return false;
    }
  })();

  const isLast = stepIndex === steps.length - 1;

  async function handleActivate() {
    // ✅ Validate before sending
    if (!bvnData || !purpose || !userData) {
      showErrorAlert(
        "Missing Information",
        "Please complete all steps before activating your account."
      );
      return;
    }

    console.log("🔍 bvnData before activation:", {
      phone: bvnData.phone,
      fullName: bvnData.fullName,
      bvn: bvnData.bvn,
    });

    if (!bvnData.bvn || bvnData.bvn.length !== 11) {
      showWarningAlert(
        "Invalid BVN",
        "Please verify your BVN first before activating your account."
      );
      return;
    }

    if (!pin || pin.length !== 4) {
      showWarningAlert(
        "Invalid PIN",
        "Please set a 4-digit transaction PIN before activating."
      );
      return;
    }

    if (pin !== confirmPin) {
      showWarningAlert(
        "PIN Mismatch",
        "Your PIN and confirm PIN do not match. Please try again."
      );
      return;
    }

    setSubmitting(true);

    try {
      const phoneNumber = bvnData.phone || userData.phone || "";
      
      console.log("📞 Phone number to send:", phoneNumber);

      if (!phoneNumber) {
        showErrorAlert(
          "Phone Number Required",
          "Please ensure your phone number is available from BVN verification."
        );
        setSubmitting(false);
        return;
      }

      const payload: any = {
        userId: userData.id,
        fullName: bvnData.fullName || userData.full_name || userData.fullName || "",
        email: userData.email || "",
        phone: phoneNumber, 
        purpose: purpose,
        bvn: bvnData.bvn,
        transactionPin: pin,
        businessAddress: business.businessAddress || "",
        mapUrl: "",
        utilityBillName: "",
      };

      if (purpose === "business") {
        payload.business = {
          isRegistered: business.isRegistered || false,
          businessName: business.businessName || "",
          cacNumber: business.isRegistered ? business.cacNumber : null,
          businessAddress: business.businessAddress || "",
          businessCategory: business.businessCategory || "",
          businessDescription: "",
          mapUrl: "",
          businessEmail: "",
          businessPhone: "",
          businessWebsite: "",
          businessType: business.cacData?.entityType || "",
          businessIndustry: "",
          cacVerified: !!business.cacData,
          businessData: business.cacData || null,
          dateOfBirth: bvnData.dateOfBirth || "",
        };
      }

      console.log("📤 Sending onboarding payload:", {
        userId: payload.userId,
        fullName: payload.fullName,
        email: payload.email,
        phone: payload.phone,
        purpose: payload.purpose,
        bvn: payload.bvn ? `${payload.bvn.slice(0, 3)}...${payload.bvn.slice(-4)}` : 'missing',
        transactionPin: payload.transactionPin ? '***' : 'missing',
        hasBusiness: !!payload.business,
      });

      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("📥 Response status:", response.status);

      const data = await response.json();

      if (!response.ok) {
        console.error("❌ Onboarding error response:", data);
        
        // Show detailed error with SweetAlert2
        showErrorAlert(
          "Activation Failed",
          data.error || data.message || "Unable to activate your account. Please try again.",
          data.details || `Status: ${response.status}`
        );
        setSubmitting(false);
        return;
      }

      let accountNumber = "";
      let accountName = bvnData.fullName;
      let bankName = "Zidwell";

      if (data.bank78?.personal) {
        accountNumber = data.bank78.personal.accountNumber;
        accountName = data.bank78.personal.accountName || bvnData.fullName;
        bankName = data.bank78.personal.bankName || "Bank78";
      } else if (data.nomba) {
        accountNumber = data.nomba.accountNumber;
        accountName = data.nomba.accountName || bvnData.fullName;
        bankName = data.nomba.bankName || "Wema Bank";
      } else {
        accountNumber = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join("");
      }

      setResult({
        accountNumber,
        accountName,
        bankName,
      });

      setShowSuccess(true);

      confetti({
        particleCount: 180,
        spread: 100,
        origin: { y: 0.6 },
        colors: ["#00B64F", "#FDC020", "#191919", "#FFFFFF"],
      });

      await refreshUserData();

    } catch (error: any) {
      console.error("Activation error:", error);
      showErrorAlert(
        "Activation Error",
        "An unexpected error occurred while activating your account.",
        error.message || "Please try again or contact support."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (userLoading || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  if (userData && isUserVerified()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100/40 dark:from-gray-900 dark:to-gray-800/40 py-10 px-4 sm:px-6 lg:py-16">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
              <Image
                src="/logo.png"
                alt="Zidwell Logo"
                width={49}
                height={40}
                className="w-10 object-contain transition-transform group-hover:scale-105"
              />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight text-gray-900 dark:text-gray-100">Zidwell</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {purpose === "business" ? "Business" : "Personal"} account activation
              </p>
            </div>
          </div>
          
          <Button
            type="button"
            variant="ghost"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="h-10 gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 disabled:opacity-60"
          >
            {isLoggingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            Sign out
          </Button>
        </header>

        <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 p-5">
            <Stepper steps={steps} current={stepIndex} />
          </div>

          <div className="p-6 sm:p-8">
            {current?.id === "bvn" && (
              <BvnStep
                bvn={bvn}
                setBvn={setBvn}
                bvnData={bvnData}
                setBvnData={setBvnData}
                purpose={purpose}
                userData={userData}
              />
            )}
            {current?.id === "pin" && (
              <PinStep
                pin={pin}
                confirmPin={confirmPin}
                setPin={setPin}
                setConfirmPin={setConfirmPin}
              />
            )}
            {current?.id === "biz" && (
              <BusinessStep state={business} setState={setBusiness} />
            )}
            {current?.id === "review" && bvnData && purpose && (
              <ReviewStep
                purpose={purpose}
                bvnData={bvnData}
                business={business}
              />
            )}
          </div>

          <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 p-4 sm:px-6">
            <div className="flex items-center gap-3">
              {stepIndex > 0 && (
                <Button
                  type="button"
                  onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                  variant="ghost"
                  className="h-11 gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                >
                  <ArrowRight className="h-4 w-4 rotate-180" />
                  Back
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <p className="hidden text-xs text-gray-500 dark:text-gray-400 sm:block">
                Step {stepIndex + 1} of {steps.length}
              </p>
              {isLast ? (
                <Button
                  type="button"
                  onClick={handleActivate}
                  disabled={!canContinue || submitting}
                  className="h-11 min-w-40 bg-yellow-400 text-black hover:bg-yellow-500"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Activate account
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() =>
                    setStepIndex((i) => Math.min(steps.length - 1, i + 1))
                  }
                  disabled={!canContinue}
                  className="h-11 min-w-32 bg-yellow-400 text-black hover:bg-yellow-500"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          By continuing, you agree to Zidwell's Terms of Service and Privacy Policy.
        </p>
      </div>

      <SuccessModal
        open={showSuccess}
        onOpenChange={setShowSuccess}
        result={result}
      />
    </div>
  );
}