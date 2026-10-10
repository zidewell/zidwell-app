// app/components/payment-page-components/InvestmentFields.tsx
"use client";

import { AlertTriangle, Info } from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";

interface Props {
  minimumAmount: string;
  setMinimumAmount: (v: string) => void;
  expectedReturn: string;
  setExpectedReturn: (v: string) => void;
  tenure: string;
  setTenure: (v: string) => void;
  charges: string;
  setCharges: (v: string) => void;
  paymentFrequency: "one-time" | "recurring";
  setPaymentFrequency: (v: "one-time" | "recurring") => void;
  termsAndConditions: string;
  setTermsAndConditions: (v: string) => void;
  riskExplanation: string;
  setRiskExplanation: (v: string) => void;
  // Stock / multiple
  stock: number | null;
  setStock: (v: number | null) => void;
  allowMultiple: boolean;
  setAllowMultiple: (v: boolean) => void;
  // Optional price updater
  price?: number;
  onPriceChange?: (price: number) => void;
}

const InvestmentFields = ({
  minimumAmount,
  setMinimumAmount,
  expectedReturn,
  setExpectedReturn,
  tenure,
  setTenure,
  charges,
  setCharges,
  paymentFrequency,
  setPaymentFrequency,
  termsAndConditions,
  setTermsAndConditions,
  riskExplanation,
  setRiskExplanation,
  stock,
  setStock,
  allowMultiple,
  setAllowMultiple,
  price,
  onPriceChange,
}: Props) => {
  const handleMinimumAmountChange = (value: string) => {
    setMinimumAmount(value);
    if (onPriceChange && Number(value)) {
      onPriceChange(Number(value));
    }
  };

  return (
    <div className="space-y-5">
      {/* ─── Units Available ─── */}
      <div className="p-4 rounded-xl border border-(--border-color) bg-(--bg-primary)">
        <div className="flex items-start gap-2 mb-3">
          <Info className="h-4 w-4 text-(--color-accent-yellow) mt-0.5 shrink-0" />
          <div>
            <Label className="text-sm font-bold text-(--text-primary)">
              Units Available
            </Label>
            <p className="text-xs text-(--text-secondary) mt-0.5">
              Number of units/slots/plots available. Leave empty for unlimited.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Input
            type="number"
            min={0}
            value={stock === null ? "" : stock}
            onChange={(e) => {
              const val = e.target.value;
              setStock(val === "" ? null : Math.max(0, parseInt(val) || 0));
            }}
            placeholder="e.g. 100 (leave empty for unlimited)"
            className="flex-1 h-11 text-sm border-(--border-color) bg-(--bg-primary) text-(--text-primary)"
          />
          {stock !== null && (
            <button
              type="button"
              onClick={() => setStock(null)}
              className="text-xs text-(--text-secondary) hover:text-(--text-primary) underline whitespace-nowrap"
            >
              Unlimited
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          {[10, 50, 100, 500, 1000].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setStock(n)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${
                stock === n
                  ? "border-(--color-accent-yellow) bg-(--color-accent-yellow)/10 text-(--color-accent-yellow)"
                  : "border-(--border-color) text-(--text-secondary) hover:border-(--color-accent-yellow)/50"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Allow multiple units ─── */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-(--border-color) bg-(--bg-primary)">
        <div className="pr-4">
          <Label className="text-sm font-bold text-(--text-primary)">
            Allow buying multiple units
          </Label>
          <p className="text-xs text-(--text-secondary) mt-1">
            {allowMultiple
              ? "Investors can buy several units at once"
              : "Investors buy exactly one unit at a time"}
          </p>
        </div>
        <Switch
          checked={allowMultiple}
          onCheckedChange={setAllowMultiple}
          className="data-[state=checked]:bg-(--color-accent-yellow)"
        />
      </div>

      {/* ─── Minimum amount ─── */}
      <div>
        <Label className="text-sm font-semibold mb-1.5 block text-(--text-primary)">
          Minimum Investment Amount (₦) *
        </Label>
        <Input
          type="number"
          placeholder="e.g. 50000"
          value={minimumAmount}
          onChange={(e) => handleMinimumAmountChange(e.target.value)}
          className="h-12 border-(--border-color) bg-(--bg-primary) text-(--text-primary)"
        />
        <p className="text-xs text-(--text-secondary) mt-1">
          This will be the minimum amount investors can contribute
        </p>
      </div>

      {/* ─── Expected Return ─── */}
      <div>
        <Label className="text-sm font-semibold mb-1.5 block text-(--text-primary)">
          Expected Return (optional)
        </Label>
        <Input
          placeholder='e.g. "10-15% per annum" — clearly state this is an estimate'
          value={expectedReturn}
          onChange={(e) => setExpectedReturn(e.target.value)}
          className="h-12 border-(--border-color) bg-(--bg-primary) text-(--text-primary)"
        />
        <p className="text-xs text-(--text-secondary) mt-1">
          This is displayed as an estimate only — not a guarantee.
        </p>
      </div>

      {/* ─── Tenure ─── */}
      <div>
        <Label className="text-sm font-semibold mb-1.5 block text-(--text-primary)">
          Tenure / Maturity Period *
        </Label>
        <Input
          placeholder='e.g. "6 months", "1 year", "Flexible"'
          value={tenure}
          onChange={(e) => setTenure(e.target.value)}
          className="h-12 border-(--border-color) bg-(--bg-primary) text-(--text-primary)"
        />
      </div>

      {/* ─── Fees ─── */}
      <div>
        <Label className="text-sm font-semibold mb-1.5 block text-(--text-primary)">
          Fees / Charges
        </Label>
        <Input
          placeholder='e.g. "2% management fee", "₦500 processing fee"'
          value={charges}
          onChange={(e) => setCharges(e.target.value)}
          className="h-12 border-(--border-color) bg-(--bg-primary) text-(--text-primary)"
        />
      </div>

      {/* ─── Payment Frequency ─── */}
      <div>
        <Label className="text-sm font-semibold mb-3 block text-(--text-primary)">
          Payment Frequency
        </Label>
        <div className="grid grid-cols-2 gap-3">
          {(["one-time", "recurring"] as const).map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => setPaymentFrequency(val)}
              className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                paymentFrequency === val
                  ? "border-(--color-accent-yellow) bg-(--color-accent-yellow)/10 text-(--color-accent-yellow)"
                  : "border-(--border-color) bg-(--bg-secondary) text-(--text-secondary) hover:border-(--color-accent-yellow)/50"
              }`}
            >
              {val === "one-time" ? "One-time" : "Recurring"}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Terms & Conditions ─── */}
      <div className="p-4 rounded-2xl border-2 border-yellow-500/30 bg-yellow-500/5">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <Label className="text-sm font-bold text-(--text-primary)">
            Terms & Conditions (Required)
          </Label>
        </div>
        <Textarea
          placeholder="Enter the full terms and conditions for this investment. Must be at least 100 characters..."
          value={termsAndConditions}
          onChange={(e) => setTermsAndConditions(e.target.value)}
          rows={5}
          className="resize-none mb-2"
        />
        <p
          className={`text-xs ${
            termsAndConditions.length >= 100
              ? "text-(--color-lemon-green)"
              : "text-(--text-secondary)"
          }`}
        >
          {termsAndConditions.length}/100 characters minimum
        </p>
      </div>

      {/* ─── Risk Explanation ─── */}
      <div className="p-4 rounded-2xl border-2 border-yellow-500/30 bg-yellow-500/5">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <Label className="text-sm font-bold text-(--text-primary)">
            Risk Explanation (Required)
          </Label>
        </div>
        <Textarea
          placeholder="Clearly explain the risks involved with this investment..."
          value={riskExplanation}
          onChange={(e) => setRiskExplanation(e.target.value)}
          rows={4}
          className="resize-none"
        />
        {!riskExplanation.trim() && (
          <p className="text-xs text-(--destructive) mt-1">
            This field is required before publishing
          </p>
        )}
      </div>
    </div>
  );
};

export default InvestmentFields;