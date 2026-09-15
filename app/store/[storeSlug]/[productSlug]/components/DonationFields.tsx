// app/store/[storeSlug]/[productSlug]/components/DonationFields.tsx
"use client";

import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { PRIMARY_BG, PRIMARY_TEXT } from "../utils/helpers";

interface Props {
  suggestedAmounts: number[];
  donorAmount: string;
  setDonorAmount: (v: string) => void;
  minimumDonation: number;
  error?: string;
}

export function DonationFields({
  suggestedAmounts,
  donorAmount,
  setDonorAmount,
  minimumDonation,
  error,
}: Props) {
  return (
    <div className="mt-6 space-y-4">
      {suggestedAmounts.length > 0 && (
        <div>
          <Label className="mb-2 block text-sm font-medium">
            Suggested amounts
          </Label>
          <div className="flex flex-wrap gap-2">
            {suggestedAmounts.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setDonorAmount(String(amt))}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  Number(donorAmount) === amt
                    ? `${PRIMARY_BG} ${PRIMARY_TEXT}`
                    : "border border-border text-foreground/70 hover:bg-muted"
                }`}
              >
                ₦{amt.toLocaleString()}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <Label className="mb-1.5 block text-sm font-medium">
          Amount (min ₦{minimumDonation.toLocaleString()})
        </Label>
        <Input
          type="number"
          min={minimumDonation}
          value={donorAmount}
          onChange={(e) => setDonorAmount(e.target.value)}
          placeholder={`${minimumDonation}`}
        />
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    </div>
  );
}