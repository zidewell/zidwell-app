// lib/constants.ts
// ─────────────────────────────────────────────────────────────────────────────
// SHARED CONSTANTS
//   • Safe to import from BOTH middleware/proxy (edge runtime) AND client
//     components. Do NOT add "use client" here.
//   • Do NOT import these from a "use client" file — that causes the value to
//     become empty/undefined at edge runtime.
// ─────────────────────────────────────────────────────────────────────────────

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
  ALLOWED_PAYMENT_EMAILS.map((e) => e.toLowerCase())
);

export const canAccessPaymentPage = (userEmail?: string | null): boolean => {
  if (!userEmail) return false;
  return ALLOWED_PAYMENT_EMAIL_SET.has(userEmail.toLowerCase());
};