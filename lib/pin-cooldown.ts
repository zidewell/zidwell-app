// lib/pin-cooldown.ts

/**
 * Cooldown between successful PIN changes.
 * Configurable via env var PIN_CHANGE_COOLDOWN_HOURS (default 24).
 */
export const PIN_CHANGE_COOLDOWN_MS =
  Number(process.env.PIN_CHANGE_COOLDOWN_HOURS ?? 24) * 60 * 60 * 1000;

export interface CooldownCheck {
  /** True if a change is allowed right now. */
  allowed: boolean;
  /** When the current cooldown expires (only set when allowed === false). */
  nextAllowedAt?: Date;
  /** Whole hours remaining in the cooldown (min 1 when not allowed). */
  hoursRemaining?: number;
  /** Human-friendly error message. */
  message?: string;
}

/**
 * Pure function — given the last update time, tell whether a change
 * is allowed and how long the user must wait.
 */
export function evaluateCooldown(
  lastUpdatedAt: string | Date | null | undefined,
  cooldownMs: number = PIN_CHANGE_COOLDOWN_MS,
): CooldownCheck {
  if (!lastUpdatedAt) {
    return { allowed: true };
  }

  const last = new Date(lastUpdatedAt).getTime();
  if (!Number.isFinite(last)) {
    // Defensive: bad timestamp → treat as "no cooldown"
    return { allowed: true };
  }

  const elapsed = Date.now() - last;
  if (elapsed >= cooldownMs) {
    return { allowed: true };
  }

  const remainingMs = cooldownMs - elapsed;
  const nextAllowedAt = new Date(last + cooldownMs);
  const hoursRemaining = Math.max(
    1,
    Math.ceil(remainingMs / (60 * 60 * 1000)),
  );

  return {
    allowed: false,
    nextAllowedAt,
    hoursRemaining,
    message: `You can only change your transaction PIN once every ${Math.round(
      cooldownMs / (60 * 60 * 1000),
    )} hours. Please try again in ${hoursRemaining} hour${
      hoursRemaining === 1 ? "" : "s"
    }.`,
  };
}