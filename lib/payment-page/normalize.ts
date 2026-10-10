// lib/payment-page/normalize.ts

/**
 * Normalize variant stock and price for physical products.
 *
 * The dashboard's variant form allows `stock: 0`, which the buyer side
 * interprets as "out of stock". We normalize any non-positive or missing
 * stock value to `null` (unlimited) so:
 *   • New variants are immediately sellable without extra effort
 *   • Merchants who mean "unlimited" don't have to remember to clear it
 *
 * We do NOT alter a positive stock value. We do NOT alter variant prices
 * unless they are missing or non-numeric (coerced to 0, which then makes
 * the buyer side fall back to the page price at render time).
 */
export function normalizeVariants(variants: any[]): any[] {
  if (!Array.isArray(variants)) return variants;

  return variants.map((v: any) => {
    const rawStock = v?.stock;
    const parsedStock =
      rawStock != null && rawStock !== "" ? Number(rawStock) : NaN;
    const hasRealStock = Number.isFinite(parsedStock) && parsedStock > 0;

    const rawPrice = v?.price;
    const parsedPrice = Number(rawPrice);
    const safePrice = Number.isFinite(parsedPrice) ? parsedPrice : 0;

    return {
      ...v,
      stock: hasRealStock ? parsedStock : null,
      price: safePrice,
    };
  });
}