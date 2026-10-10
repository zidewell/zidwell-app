// app/store/[storeSlug]/[productSlug]/components/CompletedPlanCard.tsx
"use client";

import { CircleCheck } from "lucide-react";

interface Props {
  existingAccount: any;
  isSchoolPage: boolean;
  pageTitle: string;
  onBuyAgain: () => void;
  onBuyAgainForStudent: () => void;
}

export function CompletedPlanCard({
  existingAccount,
  isSchoolPage,
  pageTitle,
  onBuyAgain,
  onBuyAgainForStudent,
}: Props) {
  const isSchoolStudent = isSchoolPage && existingAccount.student_name;

  return (
    <div className="mt-6 rounded-xl border border-border bg-muted/20 p-5">
      <div className="flex items-start gap-3">
        <CircleCheck className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold">
            {isSchoolStudent
              ? "This plan is fully paid"
              : "You've completed your payment"}
          </p>
          <p className="mt-1 text-sm text-foreground/70">
            {isSchoolStudent ? (
              <>
                <strong>{existingAccount.student_name}</strong>'s fee has been
                paid in full.
              </>
            ) : (
              <>
                Thank you, {existingAccount.buyer_name || "customer"}. You paid
                the full amount for <strong>{pageTitle}</strong>. A confirmation
                email was sent to {existingAccount.buyer_email || "your email"}.
              </>
            )}
          </p>

          <div className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-foreground/60">Total paid</span>
              <span className="font-medium">
                ₦{Number(existingAccount.total_paid).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/60">Plan amount</span>
              <span className="font-medium">
                ₦{Number(existingAccount.total_amount).toLocaleString()}
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

          <button
            type="button"
            onClick={isSchoolStudent ? onBuyAgainForStudent : onBuyAgain}
            className="mt-4 text-sm font-medium underline text-foreground hover:no-underline"
          >
            {isSchoolStudent ? "Pay for another student" : "Buy again"}
          </button>
        </div>
      </div>
    </div>
  );
}