// app/onboarding/components/BusinessStep.tsx
import { useState } from "react";
import {
  Building2,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type CacData = {
  companyName: string;
  rcNumber: string;
  companyStatus: string;
  companyAddress: string;
  entityType: string;
  registrationDate: string;
  directors: any[];
};

export type BusinessState = {
  isRegistered: boolean | null;
  cacNumber: string;
  cacData: CacData | null;
};

export default function BusinessStep({
  state,
  setState,
}: {
  state: BusinessState;
  setState: (updater: (s: BusinessState) => BusinessState) => void;
}) {
  const [loading, setLoading] = useState(false);
  const cacVerified = !!state.cacData;
  const [consentGiven, setConsentGiven] = useState(false);
console.log(state, "state")
  async function verifyCac() {
    if (!consentGiven) {
      toast.error("Consent required", {
        description: "Please consent to CAC verification",
      });
      return;
    }

    if (!state.cacNumber || state.cacNumber.trim().length < 1) {
      toast.error("Invalid CAC number", {
        description: "Please enter a valid CAC/RC number",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/users-verification/cac", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rc_number: state.cacNumber,
          company_type: "RC",
          consentGiven: consentGiven,
        }),
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
          cacNumber: state.cacNumber,
        }));

        toast.success("CAC verified", { description: cacData.companyName });
      } else {
        toast.error("CAC verification failed", { 
          description: data.message || data.error || "Please check your RC number and try again." 
        });
      }
    } catch (e: any) {
      toast.error("CAC verification failed", { description: e.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Verify Your Business
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          We need to verify your business registration with CAC.
        </p>
      </div>

      <div className="space-y-4">
        {state.isRegistered ? (
          <div className="space-y-2">
            <Label
              htmlFor="cac"
              className="text-gray-700 dark:text-gray-300"
            >
              CAC / RC Number
            </Label>
            <div className="flex gap-3">
              <Input
                id="cac"
                value={state.cacNumber}
                onChange={(e) =>
                  setState((s) => ({ ...s, cacNumber: e.target.value }))
                }
                placeholder="e.g. RC1234567 or 1234567"
                disabled={cacVerified}
                className={cn("h-12", cacVerified && "border-green-500")}
              />
              <Button
                type="button"
                onClick={verifyCac}
                disabled={
                  loading ||
                  cacVerified ||
                  state.cacNumber.trim().length < 1
                }
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
                <span className="text-gray-500 dark:text-gray-400">
                  {state.cacData.companyStatus}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              Your business is not registered with CAC. You'll be able to use 
              Zidwell's business features, but some features may be limited.
            </p>
          </div>
        )}

        {state.isRegistered && (
          <div className="flex items-start gap-3 mt-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <input
              type="checkbox"
              id="cac-consent"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-yellow-400 focus:ring-yellow-400"
            />
            <label
              htmlFor="cac-consent"
              className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed"
            >
              I consent to Zidwell verifying my CAC registration for business
              verification purposes. My data will be used only for KYC
              compliance.
            </label>
          </div>
        )}
      </div>
    </div>
  );
}