export type FeeResult = {
  nombaFee: number;
  appFee: number;
  totalFee: number;
  totalDebit: number;
};

export function calculateFees(
  amount: number,
 type: "transfer" | "deposit" | "card",
  paymentMethod: "checkout" | "virtual_account" | "bank_transfer" | "p2p" = "checkout"
): FeeResult {
  const am = Number(amount) || 0;

  let nombaFee = 0;
  let appFee = 0;

  // Calculate fees based on payment method
  if (paymentMethod === "checkout") {
    // Checkout: Nomba charges 1.4% + ₦1800, we charge same to customer
    const nombaPercentage = am * 0.014; // 1.4%
    nombaFee = nombaPercentage + 1800; // + ₦1800 flat fee
    appFee = nombaFee; // Pass through to customer
  } 
  else if (paymentMethod === "virtual_account") {
    // Virtual Account: Nomba charges 0.5% (₦10 min, ₦100 cap), we charge same
    const nombaPercentage = am * 0.005; // 0.5%
    nombaFee = Math.min(Math.max(nombaPercentage, 10), 100); // Min ₦10, Max ₦100
    appFee = nombaFee; // Pass through to customer
  } 
  else if (paymentMethod === "bank_transfer") {
    // Pay by Transfer: Nomba charges 0.5% (₦20 min, ₦100 cap)
    const nombaPercentage = am * 0.005; // 0.5%
    nombaFee = Math.min(Math.max(nombaPercentage, 20), 100); // Min ₦20, Max ₦100
    
    // Zidwell charges 0.5% (₦5 min, ₦50 cap) for bank transfers
    const ourPercentage = am * 0.005; // 0.5%
    const zidwellFee = Math.min(Math.max(ourPercentage, 5), 50); 
    
    // Customer pays BOTH Nomba fee and Zidwell fee
    // appFee = nombaFee + zidwellFee;
    appFee = 50;
  }

  const totalFee = appFee;
  const totalDebit = am + totalFee;

  // round to 2 decimals
  return {
    nombaFee: Math.round(nombaFee * 100) / 100,
    appFee: Math.round(appFee * 100) / 100,
    totalFee: Math.round(totalFee * 100) / 100,
    totalDebit: Math.round(totalDebit * 100) / 100,
  };
}


// currency formatter ₦1,000.00
export const formatNaira = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

