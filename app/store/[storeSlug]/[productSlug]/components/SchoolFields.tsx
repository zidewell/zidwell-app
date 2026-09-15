// app/store/[storeSlug]/[productSlug]/components/SchoolFields.tsx
"use client";

import { Users, CircleCheck, CircleAlert, CircleDot } from "lucide-react";
import { computeNextInstallmentPayment } from "@/lib/installment-utils";
import { PaymentOption } from "../utils/types";

interface Props {
  entities: any[];
  selectedEntityIds: Set<string>;
  myPaidStudents: Record<string, number> | null;
  lockedFields: boolean;
  selectedPaymentOption: PaymentOption;
  currentTotalAmount: number;
  paidCount: number;
  partialCount: number;
  unpaidCount: number;
  onEntityClick: (entity: any) => void;
}

export function SchoolFields({
  entities,
  selectedEntityIds,
  myPaidStudents,
  lockedFields,
  selectedPaymentOption,
  currentTotalAmount,
  paidCount,
  partialCount,
  unpaidCount,
  onEntityClick,
}: Props) {
  if (entities.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center gap-2">
        <Users className="h-4 w-4 text-foreground/60" />
        <h3 className="text-sm font-semibold">Students</h3>
        <span className="ml-auto text-xs text-foreground/50">
          {entities.length} student(s)
        </span>
      </div>

      {entities.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-foreground/70">
            <CircleCheck className="h-3 w-3" /> {paidCount} paid
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-foreground/70">
            <CircleAlert className="h-3 w-3" /> {partialCount} partial
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-foreground/70">
            <CircleDot className="h-3 w-3" /> {unpaidCount} pending
          </span>
        </div>
      )}

      <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
        {entities.map((entity) => {
          const isSelected = selectedEntityIds.has(entity.id);
          const nextPayment = computeNextInstallmentPayment(entity);
          const isMine =
            myPaidStudents != null &&
            myPaidStudents[entity.name] != null &&
            myPaidStudents[entity.name] > 0;

          if (entity.isFullyPaid) {
            return (
              <div
                key={entity.id}
                aria-disabled="true"
                onClick={(e) => e.stopPropagation()}
                className={`rounded-lg border-2 bg-green-500/10 p-3 cursor-not-allowed select-none opacity-90 ${
                  isMine
                    ? "border-green-600 ring-2 ring-[#FDC020]/60"
                    : "border-green-500"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <CircleCheck className="h-4 w-4 text-green-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-green-800 dark:text-green-300">
                        {entity.name}
                        {isMine && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-[#FDC020] px-2 py-0.5 text-[10px] font-semibold text-[#191919]">
                            You
                          </span>
                        )}
                      </p>
                      {entity.metadata?.className && (
                        <p className="mt-0.5 text-xs text-green-700/70 dark:text-green-400/70">
                          Class {entity.metadata.className}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                      ₦{entity.paidAmount.toLocaleString()}
                    </p>
                    <p className="mt-0.5 text-[10px] font-medium text-green-700 dark:text-green-400">
                      Paid
                    </p>
                  </div>
                </div>
              </div>
            );
          }

          if (entity.isPartiallyPaid) {
            return (
              <div
                key={entity.id}
                className={`rounded-lg border-2 bg-[#FDC020]/5 p-3 ${
                  isMine
                    ? "border-[#FDC020] ring-2 ring-[#FDC020]/60"
                    : "border-[#FDC020]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {entity.name}
                      {isMine && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-[#FDC020] px-2 py-0.5 text-[10px] font-semibold text-[#191919]">
                          You
                        </span>
                      )}
                    </p>
                    {entity.metadata?.className && (
                      <p className="mt-0.5 text-xs text-foreground/50">
                        Class {entity.metadata.className}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-[#191919] dark:text-[#FDC020]">
                      ₦{entity.paidAmount.toLocaleString()}
                      <span className="text-xs font-normal text-foreground/50">
                        {" "}
                        / ₦{entity.totalAmount.toLocaleString()}
                      </span>
                    </p>
                    <p className="mt-0.5 text-[10px] text-foreground/50">
                      ₦{entity.remainingBalance.toLocaleString()} left
                    </p>
                  </div>
                </div>
              </div>
            );
          }

          const canSelect = !lockedFields;
          return (
            <div
              key={entity.id}
              onClick={() => canSelect && onEntityClick(entity)}
              className={`rounded-lg border p-3 transition ${
                canSelect ? "cursor-pointer" : "cursor-default"
              } ${
                isSelected
                  ? "border-[#FDC020] bg-[#FDC020]/5"
                  : isMine
                  ? "border-[#FDC020] bg-[#FDC020]/5 ring-2 ring-[#FDC020]/40"
                  : "border-border hover:border-[#FDC020]/60"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {entity.name}
                    {isMine && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-[#FDC020] px-2 py-0.5 text-[10px] font-semibold text-[#191919]">
                        You
                      </span>
                    )}
                  </p>
                  {entity.metadata?.className && (
                    <p className="mt-0.5 text-xs text-foreground/50">
                      Class {entity.metadata.className}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold">
                    ₦
                    {(selectedPaymentOption === "installment"
                      ? nextPayment
                      : entity.remainingBalance
                    ).toLocaleString()}
                  </p>
                  {selectedPaymentOption === "installment" && (
                    <p className="mt-0.5 text-[10px] text-foreground/50">
                      per installment
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedEntityIds.size > 0 && (
        <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Total</span>
            <span className="font-semibold">
              ₦{currentTotalAmount.toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}