// app/components/payment-page-components/FeeSummary.tsx

"use client";

import { Info, CheckCircle } from "lucide-react";
import { calculatePaymentFees } from "@/lib/fees";

interface FeeSummaryProps {
  amount: number;
  showDetails?: boolean;
}

export function FeeSummary({ amount, showDetails = true }: FeeSummaryProps) {
  const feeBreakdown = calculatePaymentFees(amount);

  if (!showDetails) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Info className="h-4 w-4" />
        <span>Fees (3.4%) covered by merchant</span>
        <span className="text-xs text-green-600 ml-2">✅ Withdrawals FREE</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <h4 className="font-bold text-sm mb-3">Fee Breakdown</h4>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Customer Pays</span>
          <span className="font-bold">₦{feeBreakdown.gross.toLocaleString()}</span>
        </div>
        
        <div className="flex justify-between text-yellow-600">
          <span>Zidwell Fee (3%)</span>
          <span>- ₦{feeBreakdown.zidwellFee.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between text-gray-500">
          <span>Nomba Fee (0.4%)</span>
          <span>- ₦{feeBreakdown.nombaFee.toFixed(2)}</span>
        </div>
        
        <div className="border-t pt-2 mt-2 flex justify-between font-bold">
          <span>You Receive</span>
          <span className="text-green-600">₦{feeBreakdown.netAmount.toFixed(2)}</span>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 mt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-green-700 dark:text-green-400 flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5" />
              Withdrawal Fee
            </span>
            <span className="font-bold text-green-700 dark:text-green-400">FREE ✅</span>
          </div>
        </div>
        
        <div className="text-xs text-gray-500 mt-2">
          Total payment fees: 3.4% (3% Zidwell + 0.4% Nomba) • Withdrawals: FREE
        </div>
      </div>
    </div>
  );
}