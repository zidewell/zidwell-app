// lib/dashboard-utils.ts
import { RangeOption } from "@/types/admin-dashoard"; 

export const formatCurrency = (value: number | string) => {
  const n = Number(value || 0);
  if (n === 0) return "₦0";
  return n.toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

export const formatCurrencyShort = (value: number) => {
  const numValue = Number(value);
  if (numValue === 0) return "₦0";

  if (numValue >= 1000000000) {
    return `₦${(numValue / 1000000000).toFixed(1)}B`;
  }
  if (numValue >= 1000000) {
    return `₦${(numValue / 1000000).toFixed(1)}M`;
  }
  if (numValue >= 1000) {
    return `₦${(numValue / 1000).toFixed(1)}K`;
  }
  return `₦${Math.round(numValue)}`;
};

export const formatNumber = (value: number) => {
  return new Intl.NumberFormat("en-NG").format(value);
};

export const formatDateSafely = (dateString: string, isClient: boolean) => {
  if (!isClient) return dateString;
  try {
    return new Date(dateString).toLocaleString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
};

export const calculateGrowth = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

export const getSafeData = <T,>(
  data: T | undefined,
  path: string,
  defaultValue: any = []
): any => {
  if (!data) return defaultValue;

  try {
    const keys = path.split(".");
    let current: any = data;

    for (const key of keys) {
      if (current[key] === undefined || current[key] === null) {
        return defaultValue;
      }
      current = current[key];
    }

    return current;
  } catch {
    return defaultValue;
  }
};