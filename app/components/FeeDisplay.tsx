"use client";

import React from "react";
import {
  calculateFees,
  formatNaira,
  type AccountTier,
  type TransferDirection,
} from "@/lib/fee";

type Props = {
  type: "transfer" | "deposit" | "card";
  amount?: number;
  paymentMethod?: "checkout" | "virtual_account" | "bank_transfer" | "p2p";
  tier?: AccountTier;
  direction?: TransferDirection;

  // ✅ Per-user overrides
  customOutflowPercent?: number | null;
  customOutflowMin?: number | null;
};

export default function FeeDisplay({
  type,
  amount,
  paymentMethod = "checkout",
  tier = "tier_3",
  direction = "outflow",
  customOutflowPercent = null,
  customOutflowMin = null,
}: Props) {
  const feeDetails = amount
    ? calculateFees(amount, type, paymentMethod, tier, direction, {
        custom_outflow_percent: customOutflowPercent,
        custom_outflow_min: customOutflowMin,
      })
    : undefined;

  if (!feeDetails) return null;

  return (
    <div className="text-sm text-gray-700">
      <div className="text-sm text-gray-800 space-y-1">
        <div className="border-t pt-1 mt-1">
          {/*<p className="text-xs text-gray-500">{feeDetails.feeLabel}</p>*/}
          <p className="font-semibold">
            Total fee: <span>{formatNaira(feeDetails.totalFee)}</span>
          </p>
          <p className="font-bold text-green-600">
            Total amount: <span>{formatNaira(feeDetails.totalDebit)}</span>
          </p>
        </div>
      </div>
    </div>
  );
}