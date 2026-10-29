// app/store/[storeSlug]/[productSlug]/utils/helpers.ts

export const QUANTITY_PAGE_TYPES = [
  "physical",
  "digital",
  "real_estate",
  "stock",
  "savings",
  "crypto",
];

export const PRIMARY_BG = "bg-[#FDC020]";
export const PRIMARY_BG_HOVER = "hover:bg-[#e6a800]";
export const PRIMARY_TEXT = "text-[#191919]";

export const TYPE_LABELS: Record<string, string> = {
  school: "School Fees",
  donation: "Donation",
  physical: "Physical Product",
  digital: "Digital Product",
  services: "Service",
  real_estate: "Real Estate Investment",
  stock: "Stock Investment",
  savings: "Savings / Ajo",
  crypto: "Crypto Investment",
  link: "Payment Link",
};

export function stripHtml(html: string): string {
  if (!html) return "No description";
  if (typeof window !== "undefined") {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "No description";
  }
  return html.replace(/<[^>]*>/g, "").trim() || "No description";
}

export function formatNaira(n: number): string {
  return `₦${Number(n || 0).toLocaleString()}`;
}
