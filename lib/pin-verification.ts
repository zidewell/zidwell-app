import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MAX_PIN_ATTEMPTS = 5;
const PIN_LOCK_DURATION_MS = 30 * 60 * 1000;

export async function verifyPinWithLockout(
  userId: string,
  plainPin: string
): Promise<{ valid: boolean; locked?: boolean; lockedUntil?: string | null; error?: string; attemptsRemaining?: number }> {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("transaction_pin, pin_attempts, pin_locked_until")
      .eq("id", userId)
      .single();

    if (error || !user) {
      return { valid: false, error: "User not found" };
    }

    if (!user.transaction_pin) {
      return { valid: false, error: "PIN not set" };
    }

    if (user.pin_locked_until && new Date(user.pin_locked_until) > new Date()) {
      return { valid: false, locked: true, lockedUntil: user.pin_locked_until };
    }

    const isValid = await bcrypt.compare(plainPin, user.transaction_pin);

    if (!isValid) {
      const attempts = (user.pin_attempts || 0) + 1;

      if (attempts >= MAX_PIN_ATTEMPTS) {
        const lockedUntil = new Date(Date.now() + PIN_LOCK_DURATION_MS).toISOString();
        await supabase
          .from("users")
          .update({ pin_attempts: attempts, pin_locked_until: lockedUntil })
          .eq("id", userId);
        return { valid: false, locked: true, lockedUntil };
      }

      await supabase
        .from("users")
        .update({ pin_attempts: attempts })
        .eq("id", userId);

      return { valid: false, error: "Invalid PIN", attemptsRemaining: MAX_PIN_ATTEMPTS - attempts };
    }

    if (user.pin_attempts > 0 || user.pin_locked_until) {
      await supabase
        .from("users")
        .update({ pin_attempts: 0, pin_locked_until: null })
        .eq("id", userId);
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: "PIN verification failed" };
  }
}
