// lib/session-config.ts
// ─────────────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH for session timeout configuration.
//
// Imported by:
//   • app/components/SessionWatcher.tsx         (client)
//   • app/api/login/route.ts                    (server)
//   • app/api/auth/extend-session/route.ts      (server)
//
// The client and server cannot literally share a JS variable across
// the network, but they can share a source file. That's what this is.
//
// To change the timeout for testing: set
//   NEXT_PUBLIC_SESSION_TEST_MODE=true
// in .env.local and restart the dev server. Everything below picks
// it up automatically.
// ─────────────────────────────────────────────────────────────────────

// ─── Toggle ───
// Set NEXT_PUBLIC_SESSION_TEST_MODE=true in .env.local for short
// timeouts during development. Leave unset (or "false") in production.
export const TEST_MODE_ENABLED =
  process.env.NEXT_PUBLIC_SESSION_TEST_MODE === "true";

// ─── Durations ───
const PRODUCTION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const TEST_TIMEOUT_MS = 2 * 60 * 1000; //  2 minutes

export const SESSION_TIMEOUT_MS = TEST_MODE_ENABLED
  ? TEST_TIMEOUT_MS
  : PRODUCTION_TIMEOUT_MS;

// ─── Warning threshold ───
// How long before expiry the warning banner appears.
//   Production: 60 seconds before expiry
//   Testing:    30 seconds before expiry
export const WARNING_THRESHOLD_MS = TEST_MODE_ENABLED
  ? 30 * 1000
  : 60 * 1000;

// ─── Dev-only bypass ───
// Outside production, the timeout is disabled unless TEST_MODE is on.
// This lets you work locally without the banner constantly popping up.
export const SESSION_TIMEOUT_DISABLED =
  process.env.NODE_ENV !== "production" && !TEST_MODE_ENABLED;