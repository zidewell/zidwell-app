"use client";

import { User, X } from "lucide-react";

interface RecentBeneficiary {
  id: string;
  account_number: string;
  account_name: string;
  bank_name?: string;
  type: "bank" | "p2p";
  last_used: string;
}

interface BeneficiarySuggestionsProps {
  matchingBeneficiaries: RecentBeneficiary[];
  onSelect: (beneficiary: RecentBeneficiary) => void;
  onClose: () => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

export default function BeneficiarySuggestions({
  matchingBeneficiaries,
  onSelect,
  onClose,
  containerRef,
}: BeneficiarySuggestionsProps) {
  if (matchingBeneficiaries.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="beneficiary-suggestions-container relative z-50 mt-1"
    >
      <div className="absolute w-full bg-(--bg-primary) border border-(--border-color) rounded-lg shadow-lg max-h-48 overflow-y-auto">
        <div className="p-2 border-b border-(--border-color) sticky top-0 bg-(--bg-primary) z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-(--text-secondary)">
              MATCHING BENEFICIARIES ({matchingBeneficiaries.length})
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-(--bg-secondary) rounded"
            >
              <X className="h-3 w-3 text-(--text-secondary)" />
            </button>
          </div>
        </div>
        <div className="max-h-40 overflow-y-auto">
          {matchingBeneficiaries.map((beneficiary) => (
            <div
              key={beneficiary.id}
              onClick={() => onSelect(beneficiary)}
              className="p-3 hover:bg-(--bg-secondary) cursor-pointer transition-colors border-b border-(--border-color) last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-(--bg-secondary) flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-(--text-secondary)" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-(--text-primary) truncate">
                    {beneficiary.account_name}
                  </p>
                  <p className="text-xs text-(--text-secondary) truncate">
                    {beneficiary.account_number} •{" "}
                    {beneficiary.bank_name || "Zidwell"}
                  </p>
                </div>
                {beneficiary.type === "p2p" && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 flex-shrink-0">
                    P2P
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}