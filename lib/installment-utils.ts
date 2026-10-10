// lib/installment-utils.ts

export interface PaymentRecord {
  id: string;
  amount: number;
  date: string;
  installmentNumber: number;
  customerName: string;
  customerEmail: string;
}

export interface PaymentEntity {
  id: string;
  name: string;
  totalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  installmentCount: number;
  installmentsPaid: number;
  isFullyPaid: boolean;
  isPartiallyPaid: boolean;
  payments: PaymentRecord[];
  lastPaidAt: string | null;
  metadata?: Record<string, any>;
}

export interface InstallmentPlan {
  totalAmount: number;
  installmentCount: number;
  installmentAmount: number;
  period: "weekly" | "bi-weekly" | "monthly";
  startDate: string;
  nextDueDate: string;
}

// ─────────────────────────────────────────────────────────────
// CORE HELPERS
// ─────────────────────────────────────────────────────────────

export function computeEntityStatus(
  totalAmount: number,
  paidAmount: number
): {
  isFullyPaid: boolean;
  isPartiallyPaid: boolean;
  remainingBalance: number;
  percentage: number;
} {
  const remainingBalance = Math.max(0, totalAmount - paidAmount);
  const isFullyPaid = totalAmount > 0 && paidAmount >= totalAmount;
  const isPartiallyPaid = paidAmount > 0 && !isFullyPaid;
  const percentage =
    totalAmount > 0 ? Math.min(100, (paidAmount / totalAmount) * 100) : 0;

  return { isFullyPaid, isPartiallyPaid, remainingBalance, percentage };
}

export function computeInstallmentAmount(
  totalAmount: number,
  installmentCount: number
): number {
  if (installmentCount <= 0) return totalAmount;
  return Math.round((totalAmount / installmentCount) * 100) / 100;
}

export function computeNextInstallmentPayment(entity: PaymentEntity): number {
  if (entity.isFullyPaid) return 0;
  const installmentAmount = computeInstallmentAmount(
    entity.totalAmount,
    entity.installmentCount
  );
  return Math.min(installmentAmount, entity.remainingBalance);
}

export function applyPaymentToEntity(
  entity: PaymentEntity,
  payment: PaymentRecord
): PaymentEntity {
  const newPaidAmount = entity.paidAmount + payment.amount;
  const status = computeEntityStatus(entity.totalAmount, newPaidAmount);

  return {
    ...entity,
    paidAmount: Math.round(newPaidAmount * 100) / 100,
    remainingBalance: Math.round(status.remainingBalance * 100) / 100,
    isFullyPaid: status.isFullyPaid,
    isPartiallyPaid: status.isPartiallyPaid,
    installmentsPaid: entity.installmentsPaid + 1,
    payments: [...entity.payments, payment],
    lastPaidAt: payment.date,
  };
}

/**
 * Convenience helper for the UI. Binds directly to a single
 * progress number so components never recompute it themselves.
 */
export function computeProgressPercent(entity: {
  totalAmount: number;
  paidAmount: number;
}): number {
  if (entity.totalAmount <= 0) return 0;
  return Math.min(
    100,
    Math.round((entity.paidAmount / entity.totalAmount) * 10000) / 100
  );
}

// ─────────────────────────────────────────────────────────────
// ENTITY EXTRACTORS BY PAGE TYPE
// ─────────────────────────────────────────────────────────────
//
// SCHOOL pages are driven by `paidStudentsMap` — a map of student
// name → amount paid, sourced from completed payment rows. The
// account table is not consulted for schools.
//
// PHYSICAL / DIGITAL / SERVICES / INVESTMENTS / LINKS / DONATIONS
// are driven by `installmentAccount`. The account table is the
// single source of truth for those page types.
// ─────────────────────────────────────────────────────────────

export function extractEntitiesForPage(
  pageType: string,
  metadata: any,
  pagePrice: number,
  installmentCount: number = 1,
  installmentAccount?: {
    remaining_amount?: number;
    total_amount?: number;
    total_paid?: number;
    installments_paid?: number;
    installment_count?: number | null;
    installment_amount?: number | null;
    installment_period?: string | null;
    selection?: {
      selectedStudents?: string[] | null;
      selectedVariantSku?: string | null;
      quantity?: number | null;
      [key: string]: any;
    } | null;
  } | null,
  paidStudentsMap?: Record<string, number> | null
): PaymentEntity[] {
  const entities: PaymentEntity[] = [];
  const state = metadata?.installmentState || {};
  const meta = metadata || {};

  const hasAccount =
    installmentAccount != null &&
    (Number(installmentAccount.total_amount) > 0 ||
      Number(installmentAccount.remaining_amount) > 0 ||
      Number(installmentAccount.total_paid) > 0);

  const accountTotal = hasAccount
    ? Number(installmentAccount!.total_amount) || 0
    : 0;
  const accountPaid = hasAccount
    ? Number(installmentAccount!.total_paid) || 0
    : 0;
  const accountRemaining = hasAccount
    ? Math.max(0, Number(installmentAccount!.remaining_amount) || 0)
    : 0;
  const accountInstallmentsPaid = hasAccount
    ? Number(installmentAccount!.installments_paid) || 0
    : 0;
  const accountInstallmentCount = hasAccount
    ? installmentAccount!.installment_count != null
      ? Number(installmentAccount!.installment_count)
      : null
    : null;

  const effectiveInstallmentCount =
    accountInstallmentCount ??
    Number(meta.installmentCount) ??
    installmentCount ??
    1;

  switch (pageType) {
    // ─────────────────────────────────────────────
    // SCHOOL — driven purely by paidStudentsMap
    // ─────────────────────────────────────────────
    case "school": {
      const students = meta.students || [];
      const feeBreakdown = meta.feeBreakdown || [];
      const totalPerStudent =
        feeBreakdown.length > 0
          ? feeBreakdown.reduce(
              (s: number, f: any) => s + (Number(f.amount) || 0),
              0
            )
          : Number(meta.totalAmount) || pagePrice;

      const paidMap = paidStudentsMap || {};

      students.forEach((s: any, i: number) => {
        const name = s.name || s.studentName || `Student ${i + 1}`;
        const entityId = s.id || name;

        const paidAmount = Number(paidMap[name]) || 0;
        const remainingBalance = Math.max(0, totalPerStudent - paidAmount);
        const isFullyPaid =
          totalPerStudent > 0 && paidAmount >= totalPerStudent;
        const isPartiallyPaid = paidAmount > 0 && !isFullyPaid;

        entities.push({
          id: entityId,
          name,
          totalAmount: totalPerStudent,
          paidAmount,
          remainingBalance,
          installmentCount: effectiveInstallmentCount,
          installmentsPaid: 0,
          isFullyPaid,
          isPartiallyPaid,
          payments: [],
          lastPaidAt: null,
          metadata: s,
        });
      });

      break;
    }

    // ─────────────────────────────────────────────
    // PHYSICAL — driven by account table
    // ─────────────────────────────────────────────
    case "physical": {
      const variants = meta.variants || [];

      if (variants.length === 0) {
        const entityId = "default";
        const entityState = state[entityId] || {};

        if (hasAccount) {
          entities.push({
            id: entityId,
            name: meta.title || "Product",
            totalAmount: accountTotal,
            paidAmount: accountPaid,
            remainingBalance: accountRemaining,
            installmentCount: effectiveInstallmentCount,
            installmentsPaid: accountInstallmentsPaid,
            isFullyPaid: accountRemaining <= 0,
            isPartiallyPaid: accountPaid > 0 && accountRemaining > 0,
            payments: entityState.payments || [],
            lastPaidAt: entityState.lastPaidAt || null,
          });
          break;
        }

        entities.push({
          id: entityId,
          name: meta.title || "Product",
          totalAmount: pagePrice,
          paidAmount: 0,
          remainingBalance: pagePrice,
          installmentCount: effectiveInstallmentCount,
          installmentsPaid: 0,
          isFullyPaid: false,
          isPartiallyPaid: false,
          payments: [],
          lastPaidAt: null,
        });
      } else {
        variants.forEach((v: any) => {
          const name = v.name || `Variant ${v.sku || ""}`;
          const entityId = v.sku || v.name;
          const totalAmount = Number(v.price) || pagePrice;
          const entityState = state[entityId] || {};

          if (hasAccount) {
            entities.push({
              id: entityId,
              name,
              totalAmount: accountTotal || totalAmount,
              paidAmount: accountPaid,
              remainingBalance: accountRemaining,
              installmentCount: effectiveInstallmentCount,
              installmentsPaid: accountInstallmentsPaid,
              isFullyPaid: accountRemaining <= 0,
              isPartiallyPaid: accountPaid > 0 && accountRemaining > 0,
              payments: entityState.payments || [],
              lastPaidAt: entityState.lastPaidAt || null,
              metadata: v,
            });
          } else {
            entities.push({
              id: entityId,
              name,
              totalAmount,
              paidAmount: 0,
              remainingBalance: totalAmount,
              installmentCount: effectiveInstallmentCount,
              installmentsPaid: 0,
              isFullyPaid: false,
              isPartiallyPaid: false,
              payments: [],
              lastPaidAt: null,
              metadata: v,
            });
          }
        });
      }
      break;
    }

    // ─────────────────────────────────────────────
    // DIGITAL / SERVICES / DONATION / LINK / INVESTMENTS
    // driven by account table
    // ─────────────────────────────────────────────
    default: {
      const entityId = "default";
      const entityState = state[entityId] || {};

      if (hasAccount) {
        entities.push({
          id: entityId,
          name: meta.title || "Payment",
          totalAmount: accountTotal,
          paidAmount: accountPaid,
          remainingBalance: accountRemaining,
          installmentCount: effectiveInstallmentCount,
          installmentsPaid: accountInstallmentsPaid,
          isFullyPaid: accountRemaining <= 0,
          isPartiallyPaid: accountPaid > 0 && accountRemaining > 0,
          payments: entityState.payments || [],
          lastPaidAt: entityState.lastPaidAt || null,
        });
        break;
      }

      const totalAmount = Number(meta.totalAmount) || Number(pagePrice) || 0;

      entities.push({
        id: entityId,
        name: meta.title || "Payment",
        totalAmount,
        paidAmount: 0,
        remainingBalance: totalAmount,
        installmentCount: effectiveInstallmentCount,
        installmentsPaid: 0,
        isFullyPaid: false,
        isPartiallyPaid: false,
        payments: [],
        lastPaidAt: null,
      });
      break;
    }
  }

  return entities;
}

export function computeChargeAmount(
  entities: PaymentEntity[],
  selectedIds: string[],
  mode: "full" | "installment"
): {
  total: number;
  breakdown: { entity: PaymentEntity; amount: number }[];
} {
  const selected = entities.filter((e) => selectedIds.includes(e.id));
  const breakdown: { entity: PaymentEntity; amount: number }[] = [];

  let total = 0;
  for (const entity of selected) {
    if (entity.isFullyPaid) continue;
    const amount =
      mode === "full"
        ? entity.remainingBalance
        : computeNextInstallmentPayment(entity);
    total += amount;
    breakdown.push({ entity, amount });
  }

  return { total: Math.round(total * 100) / 100, breakdown };
}

// ─────────────────────────────────────────────────────────────
// SERVER-SIDE HELPERS
// ─────────────────────────────────────────────────────────────

export function determineEntityIds(
  pageType: string,
  payment: any,
  matchedStudentNames: string[] = []
): string[] {
  if (pageType === "school") {
    return matchedStudentNames;
  }
  if (pageType === "physical") {
    const sku = payment?.metadata?.selectedVariantSku;
    return sku ? [sku] : ["default"];
  }
  return ["default"];
}

export function computeNextDueDate(
  period: "weekly" | "bi-weekly" | "monthly",
  installmentIndex: number
): string {
  const days = period === "weekly" ? 7 : period === "bi-weekly" ? 14 : 30;
  const due = new Date();
  due.setDate(due.getDate() + days * Math.max(1, installmentIndex));
  return due.toISOString();
}