// app/lib/dashboard-utils.ts
export function formatCurrency(amount: number, currency = "₦"): string {
  const n = Number(amount) || 0;
  return `${currency}${n.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatNumber(value: number): string {
  return (Number(value) || 0).toLocaleString("en-NG");
}

export function calculateGrowth(current: number, previous: number): number {
  if (!previous) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function getSafeData<T>(data: any, fallback: T): T {
  if (data === null || data === undefined) return fallback;
  return data as T;
}
