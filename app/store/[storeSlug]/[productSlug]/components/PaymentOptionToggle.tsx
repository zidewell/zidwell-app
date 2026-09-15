// app/store/[storeSlug]/[productSlug]/components/PaymentOptionToggle.tsx
"use client";

import { PaymentOption } from "../utils/types";
import { PRIMARY_BG, PRIMARY_TEXT } from "../utils/helpers";

interface Props {
  value: PaymentOption;
  onChange: (v: PaymentOption) => void;
  lockedFields: boolean;
}

export function PaymentOptionToggle({ value, onChange, lockedFields }: Props) {
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange("full")}
        disabled={lockedFields}
        className={`rounded-full px-5 py-2.5 text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed ${
          value === "full"
            ? `${PRIMARY_BG} ${PRIMARY_TEXT}`
            : "border border-border text-foreground/70 hover:bg-muted"
        }`}
      >
        Pay in full
      </button>
      <button
        type="button"
        onClick={() => onChange("installment")}
        disabled={lockedFields}
        className={`rounded-full px-5 py-2.5 text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed ${
          value === "installment"
            ? `${PRIMARY_BG} ${PRIMARY_TEXT}`
            : "border border-border text-foreground/70 hover:bg-muted"
        }`}
      >
        Pay in installments
      </button>
    </div>
  );
}