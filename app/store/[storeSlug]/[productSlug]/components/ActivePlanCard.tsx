// app/store/[storeSlug]/[productSlug]/components/ActivePlanCard.tsx
"use client";

import { CreditCard } from "lucide-react";
import { Button } from "@/app/components/ui/button";

interface Props {
  existingAccount: any;
  isSchoolPage: boolean;
  submissionLock: boolean;
  onContinue: () => void;
  onClearAccount: () => void;
}

export function ActivePlanCard({
  existingAccount,
  isSchoolPage,
  submissionLock,
  onContinue,
  onClearAccount,
}: Props) {
  return (
    <div className="mt-6 rounded-xl border border-border bg-muted/20 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">Active payment plan</p>
          <p className="mt-1 text-sm text-foreground/60">
            {existingAccount.buyer_name
              ? `Welcome back, ${existingAccount.buyer_name}`
              : "Welcome back"}
          </p>
          {isSchoolPage && existingAccount.student_name && (
            <p className="mt-1 text-xs text-foreground/50">
              Plan for <strong>{existingAccount.student_name}</strong>
            </p>
          )}
        </div>
        <button
          onClick={onClearAccount}
          className="text-xs text-foreground/50 hover:text-foreground underline"
        >
          Not you?
        </button>
      </div>

      <div className="mt-4 space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-foreground/60">Paid</span>
          <span className="font-medium">
            ₦{Number(existingAccount.total_paid).toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-foreground/60">Remaining</span>
          <span className="font-medium">
            ₦{Number(existingAccount.remaining_amount).toLocaleString()}
          </span>
        </div>
        {existingAccount.installment_count && (
          <div className="flex justify-between">
            <span className="text-foreground/60">Installments</span>
            <span className="font-medium">
              {existingAccount.installments_paid}/
              {existingAccount.installment_count}
            </span>
          </div>
        )}
      </div>

      {Number(existingAccount.total_amount) > 0 && (
        <div className="mt-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full bg-[#FDC020] transition-all"
              style={{
                width: `${Math.min(
                  100,
                  (Number(existingAccount.total_paid) /
                    Number(existingAccount.total_amount)) *
                    100
                )}%`,
              }}
            />
          </div>
        </div>
      )}

      <Button
        onClick={onContinue}
        disabled={submissionLock}
        className="mt-4 w-full rounded-lg bg-[#FDC020] text-[#191919] hover:bg-[#e6a800] py-5 text-sm font-semibold disabled:opacity-60"
      >
        <CreditCard className="mr-2 h-4 w-4" />
        Continue paying installment
        {existingAccount.installment_amount && (
          <span className="ml-2 text-xs font-normal opacity-70">
            (₦{Number(existingAccount.installment_amount).toLocaleString()})
          </span>
        )}
      </Button>
    </div>
  );
}