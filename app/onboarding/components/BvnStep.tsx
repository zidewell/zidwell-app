// app/onboarding/components/BvnStep.tsx
import { useState } from "react";
import { 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Loader2, 
  User, 
  Calendar, 
  Phone, 
  Mail, 
  Shield,
  Image as ImageIcon
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type BvnData = {
  fullName: string;
  bvn: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  verificationReference: string;
  base64Image?: string | null;
  isSandbox?: boolean;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  phoneNumber1?: string;
  phoneNumber2?: string;
  verificationId?: string;
  verificationStatus?: string;
};

type Purpose = "personal" | "business";

export default function BvnStep({
  bvn,
  setBvn,
  bvnData,
  setBvnData,
  purpose,
  userData,
}: {
  bvn: string;
  setBvn: (v: string) => void;
  bvnData: BvnData | null;
  setBvnData: (v: BvnData | null) => void;
  purpose: Purpose;
  userData: any;
}) {
  const [loading, setLoading] = useState(false);
  const [showBvn, setShowBvn] = useState(false);
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);

  async function verifyBvn() {
    if (bvn.length !== 11) {
      setError("Enter a valid 11-digit BVN");
      return;
    }

    if (!consentGiven) {
      setError("Please consent to BVN verification");
      toast.error("Consent required", {
        description: "You must agree to the terms to verify your BVN",
      });
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/users-verification/bvn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: bvn,
          userId: userData?.id,
          consentGiven: consentGiven,
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        const result = data.data;

        setBvnData({
          fullName: `${result.firstName || ""} ${result.lastName || ""}`.trim(),
          firstName: result.firstName || "",
          lastName: result.lastName || "",
          middleName: result.middleName || "",
          bvn: result.bvn || bvn,
          phone: result.phone || result.phoneNumber1 || "",
          phoneNumber1: result.phoneNumber1 || "",
          phoneNumber2: result.phoneNumber2 || "",
          email: result.email || "",
          dateOfBirth: result.dateOfBirth || "",
          gender: result.gender || "",
          verificationReference: result.verification_reference || "",
          base64Image: result.base64Image || null,
          isSandbox: result.is_sandbox_mode || false,
          verificationId: result.verification_id || "",
          verificationStatus: result.verification_status || "",
        });

        toast.success("BVN verified successfully");
      } else {
        setError(data.message || "BVN verification failed");
        toast.error("Verification failed", { description: data.message });
      }
    } catch (error: any) {
      setError(error.message || "Verification failed");
      toast.error("Error", { description: "Failed to verify BVN" });
    } finally {
      setLoading(false);
    }
  }

  const getImageSrc = () => {
    if (!bvnData?.base64Image) return null;
    if (bvnData.base64Image.startsWith("data:image")) {
      return bvnData.base64Image;
    }
    return `data:image/jpeg;base64,${bvnData.base64Image}`;
  };

  const imageSrc = getImageSrc();

  // Format date for display
  const formatDate = (date: string) => {
    if (!date) return "N/A";
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return date;
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return date;
    }
  };

  // Get verification status
  const getVerificationStatus = () => {
    if (bvnData) {
      return {
        label: "Verified",
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-50 dark:bg-green-900/20",
        borderColor: "border-green-200 dark:border-green-800",
        icon: CheckCircle2,
      };
    }
    return {
      label: "Pending",
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
      borderColor: "border-yellow-200 dark:border-yellow-800",
      icon: Shield,
    };
  };

  const status = getVerificationStatus();
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Verify your identity
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your BVN to verify your identity for your {purpose} account.
            </p>
          </div>
          {bvnData && (
            <div className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium",
              status.bgColor,
              status.color
            )}>
              <StatusIcon className="h-4 w-4" />
              {status.label}
            </div>
          )}
        </div>

        {bvnData?.isSandbox && (
          <div className="mt-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3">
            <p className="text-xs text-yellow-700 dark:text-yellow-400">
              ⚠️ Sandbox mode - Using test data. Switch to production for live verification.
            </p>
          </div>
        )}
      </div>

      {/* BVN Input Section - Disabled when verified */}
      <div className="space-y-2">
        <Label htmlFor="bvn-input" className="text-gray-700 dark:text-gray-300">
          BVN
        </Label>
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
                bvnData && "border-green-500 bg-gray-50 dark:bg-gray-800/50"
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
            disabled={loading || !!bvnData || bvn.length !== 11 || !consentGiven}
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
              <>
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Verified
              </>
            ) : (
              "Verify"
            )}
          </Button>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex items-start gap-3 mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <input
            type="checkbox"
            id="bvn-consent"
            checked={consentGiven}
            onChange={(e) => setConsentGiven(e.target.checked)}
            disabled={!!bvnData}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-yellow-400 focus:ring-yellow-400 disabled:opacity-50"
          />
          <label
            htmlFor="bvn-consent"
            className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed"
          >
            I consent to Zidwell verifying my BVN for identity verification
            purposes. My data will be encrypted and used only for KYC compliance
            in accordance with data protection regulations.
          </label>
        </div>
      </div>

      {/* Verified User Info Section - Shows when BVN is verified */}
      {bvnData && (
        <div className={cn(
          "mt-4 rounded-xl border p-5 space-y-4",
          status.borderColor,
          status.bgColor
        )}>
          {/* Header with verified badge */}
          <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Identity Verified
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                BVN verification completed
              </p>
            </div>
          </div>

          {/* User Photo */}
          <div className="flex justify-center py-3">
            {imageSrc ? (
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-green-200 dark:border-green-800 shadow-md">
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
                <div className="absolute bottom-0 right-0 rounded-full bg-green-500 p-0.5">
                  <CheckCircle2 className="h-3 w-3 text-white" />
                </div>
              </div>
            ) : (
              <div className="relative w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600">
                <User className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                <div className="absolute bottom-0 right-0 rounded-full bg-green-500 p-0.5">
                  <CheckCircle2 className="h-3 w-3 text-white" />
                </div>
              </div>
            )}
          </div>

          {/* Personal Information - Disabled Inputs */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <User className="h-3 w-3" />
                Full Name
              </Label>
              <Input
                value={bvnData.fullName || "N/A"}
                disabled
                className="bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Shield className="h-3 w-3" />
                BVN
              </Label>
              <Input
                value={`•••••••${bvnData.bvn.slice(-4)}`}
                disabled
                className="bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Date of Birth
              </Label>
              <Input
                value={formatDate(bvnData.dateOfBirth)}
                disabled
                className="bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Phone className="h-3 w-3" />
                Phone Number
              </Label>
              <Input
                value={bvnData.phone || bvnData.phoneNumber1 || "N/A"}
                disabled
                className="bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Mail className="h-3 w-3" />
                Email
              </Label>
              <Input
                value={bvnData.email || "N/A"}
                disabled
                className="bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <User className="h-3 w-3" />
                Gender
              </Label>
              <Input
                value={bvnData.gender || "N/A"}
                disabled
                className="bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Verification Badge */}
          <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <Shield className="h-3.5 w-3.5" />
              <span>Verified by Zidwell Identity Service</span>
            </div>
            <div className="ml-auto">
              <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-400">
                ✓ KYC Verified
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}