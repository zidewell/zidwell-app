// lib/constants.ts
// ─────────────────────────────────────────────────────────────────────────────
// SHARED CONSTANTS
//   • Safe to import from BOTH middleware/proxy (edge runtime) AND client
//     components. Do NOT add "use client" here.
//   • Do NOT import these from a "use client" file — that causes the value to
//     become empty/undefined at edge runtime.
// ─────────────────────────────────────────────────────────────────────────────

// Kept for backward compatibility with any UI that renders the list.
// No longer used to gate access.
export const ALLOWED_PAYMENT_EMAILS = [
  "characterinternational@gmail.com",
  "ibrahimlawalabbalolo@gmail.com",
  "abbalolo360@gmail.com",
  "boluwatife525@gmail.com",
  "verifiedaboki@gmail.com",
  "vivianakuche@gmail.com",
  "nenyeattah@gmail.com",
] as const;

// Pre-normalized lowercase set for O(1) lookups everywhere.
export const ALLOWED_PAYMENT_EMAIL_SET: ReadonlySet<string> = new Set(
  ALLOWED_PAYMENT_EMAILS.map((e) => e.toLowerCase()),
);

/**
 * The payment page / online store is now available to **everyone**.
 *
 * This helper is kept so existing imports keep compiling. It always
 * returns `true` and no longer inspects the email.
 *
 * Do not re-introduce email gating here without also reverting:
 *   - proxy.ts                       (requiresPaymentEmailRestriction,
 *                                     requiresStoreOwnership bypass)
 *   - app/.../FeatureCards.tsx       (getFeatures push + locked check)
 *   - app/.../DashboardSidebar.tsx   (showPaymentPage)
 */
export const canAccessPaymentPage = (_userEmail?: string | null): boolean => {
  return true;
};