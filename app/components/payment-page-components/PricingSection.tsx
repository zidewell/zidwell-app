// app/components/payment-page-components/PricingSection.tsx

"use client";

import { Calendar, Info } from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";

interface PricingSectionProps {
  priceType: "fixed" | "installment";
  price: string;
  installmentCount: string;
  installmentPeriod: string;
  installmentAmount: number;
  feeCalculation: {
    subtotal: number;
    fee: number;
    creatorReceives: number;
  };
  getFeePerInstallment: () => number;
  onPriceTypeChange: (type: "fixed" | "installment") => void;
  onPriceChange: (value: string) => void;
  onInstallmentCountChange: (value: string) => void;
  onInstallmentPeriodChange: (value: string) => void;
  isSchool: boolean;
}

export function PricingSection({
  priceType,
  price,
  installmentCount,
  installmentPeriod,
  installmentAmount,
  feeCalculation,
  getFeePerInstallment,
  onPriceTypeChange,
  onPriceChange,
  onInstallmentCountChange,
  onInstallmentPeriodChange,
  isSchool,
}: PricingSectionProps) {
  return (
    <>
      <div>
        <Label className="text-sm font-semibold mb-3 block text-(--text-primary)">
          Pricing
        </Label>
        <div className="grid grid-cols-2 gap-3">
          {(["fixed", "installment"] as const).map((val) => (
            <button
              key={val}
              onClick={() => onPriceTypeChange(val)}
              className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                priceType === val
                  ? "border-(--color-accent-yellow) bg-(--color-accent-yellow)/10 text-(--color-accent-yellow)"
                  : "border-(--border-color) bg-(--bg-secondary) text-(--text-secondary) hover:border-(--color-accent-yellow)/50"
              }`}
            >
              {val === "fixed" ? "Fixed Price" : "Installment"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <Label className="text-sm font-semibold mb-2 block text-(--text-primary)">
            {priceType === "installment" ? "Total Amount (₦)" : "Amount (₦)"}
          </Label>
          <Input
            type="number"
            placeholder="0.00"
            value={price}
            onChange={(e) => onPriceChange(e.target.value)}
            className="h-12 text-base border-(--border-color) bg-(--bg-primary) text-(--text-primary)"
            disabled={isSchool}
          />
        </div>
        {priceType === "installment" && (
          <>
            <div className="w-32">
              <Label className="text-sm font-semibold mb-2 block text-(--text-primary)">
                Installments
              </Label>
              <Input
                type="number"
                value={installmentCount}
                onChange={(e) => onInstallmentCountChange(e.target.value)}
                min={2}
                max={12}
              />
            </div>
            <div className="w-32">
              <Label className="text-sm font-semibold mb-2 block text-(--text-primary)">
                Period
              </Label>
              <select
                value={installmentPeriod}
                onChange={(e) => onInstallmentPeriodChange(e.target.value)}
                className="h-12 w-full rounded-xl border border-(--border-color) bg-(--bg-primary) px-3"
              >
                <option value="weekly">Weekly</option>
                <option value="bi-weekly">Bi-Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </>
        )}
      </div>

      {Number(price) > 0 && (
        <div className="p-4 rounded-xl bg-(--color-accent-yellow)/10 border border-(--color-accent-yellow)/20">
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 text-(--color-accent-yellow)" />
            <h4 className="text-sm font-semibold">Fee Information</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-(--text-secondary)">Customer Pays:</span>
              <span className="font-semibold text-(--color-accent-yellow)">
                ₦{Number(price).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-(--text-secondary)">
                Transaction Fee (2% capped at ₦2,000):
              </span>
              <span className="font-medium text-[var(--destructive)]">
                - ₦{feeCalculation.fee.toLocaleString()}
              </span>
            </div>
            <div className="border-t border-(--color-accent-yellow)/20 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-semibold">You Receive:</span>
                <span className="font-semibold text-(--color-lemon-green)">
                  ₦{feeCalculation.creatorReceives.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          <p className="text-xs text-(--text-secondary) mt-3">
            ✓ The 2% transaction fee is deducted from your payout. Customers pay
            exactly the amount shown.
          </p>
        </div>
      )}

      {priceType === "installment" && installmentAmount > 0 && (
        <div className="p-4 rounded-xl bg-(--color-accent-yellow)/10 border border-(--color-accent-yellow)/20">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-(--color-accent-yellow)" />
            <h4 className="text-sm font-semibold">Installment Breakdown</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-(--text-secondary)">Total Amount:</span>
              <span className="font-semibold">
                ₦{Number(price).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-(--text-secondary)">
                Number of Installments:
              </span>
              <span className="font-semibold">{installmentCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-(--text-secondary)">
                Customer Pays Per Installment:
              </span>
              <span className="font-semibold text-(--color-accent-yellow)">
                ₦{installmentAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-(--text-secondary)">
                Fee Deducted Per Installment:
              </span>
              <span className="font-semibold text-[var(--destructive)]">
                - ₦{getFeePerInstallment().toLocaleString()}
              </span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between">
                <span className="font-semibold">
                  You Receive Per Installment:
                </span>
                <span className="font-semibold text-(--color-lemon-green)">
                  ₦
                  {(
                    installmentAmount - getFeePerInstallment()
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
