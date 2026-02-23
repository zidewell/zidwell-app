export function calculateCIT(revenue: number, expenses: number, companyType: string): number {
  const profit = revenue - expenses;
  if (profit <= 0) return 0;
  if (companyType === "small") return 0;
  return profit * 0.25;
}

export function calculateVAT(taxableSales: number, inputVAT: number): { outputVAT: number; vatPayable: number } {
  const outputVAT = taxableSales * 0.075;
  const vatPayable = outputVAT - inputVAT;
  return { outputVAT, vatPayable };
}

const WHT_RATES: Record<string, number> = {
  consultancy: 0.10,
  rent: 0.10,
  dividend: 0.10,
  contract: 0.05,
};

export function calculateWHT(contractValue: number, transactionType: string): { wht: number; netAmount: number } {
  const rate = WHT_RATES[transactionType] || 0.05;
  const wht = contractValue * rate;
  const netAmount = contractValue - wht;
  return { wht, netAmount };
}

export function calculatePIT(income: number): number {
  let tax = 0;
  let remaining = income;

  if (remaining > 50000000) {
    tax += (remaining - 50000000) * 0.25;
    remaining = 50000000;
  }
  if (remaining > 25000000) {
    tax += (remaining - 25000000) * 0.23;
    remaining = 25000000;
  }
  if (remaining > 12000000) {
    tax += (remaining - 12000000) * 0.21;
    remaining = 12000000;
  }
  if (remaining > 3000000) {
    tax += (remaining - 3000000) * 0.18;
    remaining = 3000000;
  }
  if (remaining > 800000) {
    tax += (remaining - 800000) * 0.15;
  }

  return tax;
}

export function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
