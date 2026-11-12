// app/api/profile/update-transaction-pin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { evaluateCooldown, PIN_CHANGE_COOLDOWN_MS } from "@/lib/pin-cooldown";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  try {
    const { userId, currentPin, newPin } = await req.json();

    if (!userId || !currentPin || !newPin) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (!/^\d{4}$/.test(newPin)) {
      return NextResponse.json(
        { error: "PIN must be exactly 4 digits" },
        { status: 400 },
      );
    }

    if (currentPin === newPin) {
      return NextResponse.json(
        { error: "New PIN must be different from current PIN" },
        { status: 400 },
      );
    }

    // ─── Fetch user ─────────────────────────────────────────
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select(
        "transaction_pin, pin_set, bvn_verification, pin_updated_at",
      )
      .eq("id", userId)
      .single();

    if (fetchError || !user) {
      console.error("[update-transaction-pin] fetch failed:", fetchError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ─── BVN requirement ────────────────────────────────────
    if (
      user.bvn_verification === "not_submitted" ||
      user.bvn_verification !== "verified"
    ) {
      return NextResponse.json(
        { error: "BVN verification required to change PIN" },
        { status: 403 },
      );
    }

    // ─── Cooldown check ─────────────────────────────────────
    const cooldown = evaluateCooldown(user.pin_updated_at);
    if (!cooldown.allowed) {
      return NextResponse.json(
        {
          error: cooldown.message,
          nextAllowedAt: cooldown.nextAllowedAt?.toISOString(),
          hoursRemaining: cooldown.hoursRemaining,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil(
                ((cooldown.nextAllowedAt?.getTime() ?? Date.now()) -
                  Date.now()) /
                  1000,
              ),
            ),
          },
        },
      );
    }

    // ─── Verify current PIN ─────────────────────────────────
    if (!user.transaction_pin) {
      return NextResponse.json(
        { error: "No transaction PIN set. Please set one first." },
        { status: 400 },
      );
    }

    const isValid = await bcrypt.compare(currentPin, user.transaction_pin);
    if (!isValid) {
      return NextResponse.json(
        { error: "Current PIN is incorrect" },
        { status: 401 },
      );
    }

    // ─── Hash new PIN ───────────────────────────────────────
    const hashedPin = await bcrypt.hash(newPin, 10);
    const now = new Date().toISOString();

    // ─── Atomic conditional update ──────────────────────────
    // Guard 1: current hash still matches (prevents concurrent races)
    // Guard 2: cooldown window respected (prevents two rapid changes)
    const cooldownCutoff = new Date(
      Date.now() - PIN_CHANGE_COOLDOWN_MS,
    ).toISOString();

    const { data: updated, error: updateError } = await supabase
      .from("users")
      .update({
        transaction_pin: hashedPin,
        pin_set: true,
        pin_updated_at: now,
        updated_at: now,
      })
      .eq("id", userId)
      .eq("transaction_pin", user.transaction_pin) // 👈 race guard
      .or(
        `pin_updated_at.is.null,pin_updated_at.lt.${cooldownCutoff}`,
      ) // 👈 cooldown guard
      .select("id, pin_updated_at");

    if (updateError) {
      console.error("[update-transaction-pin] update failed:", updateError);
      return NextResponse.json(
        { error: "Failed to update PIN" },
        { status: 500 },
      );
    }

    if (!updated || updated.length === 0) {
      // Diagnose: cooldown active? concurrent change?
      const { data: fresh } = await supabase
        .from("users")
        .select("pin_updated_at")
        .eq("id", userId)
        .single();

      const freshCooldown = evaluateCooldown(fresh?.pin_updated_at);
      if (!freshCooldown.allowed) {
        return NextResponse.json(
          {
            error: freshCooldown.message,
            nextAllowedAt: freshCooldown.nextAllowedAt?.toISOString(),
            hoursRemaining: freshCooldown.hoursRemaining,
          },
          { status: 429 },
        );
      }

      return NextResponse.json(
        {
          error:
            "PIN was just changed by another request. Please refresh and try again.",
        },
        { status: 409 },
      );
    }

    // ─── Audit (non-fatal) ──────────────────────────────────
    await supabase
      .from("security_events")
      .insert({
        user_id: userId,
        event_type: "pin_changed",
        details: {
          method: "current_pin",
          timestamp: now,
          ip:
            req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            req.headers.get("x-real-ip") ||
            "unknown",
          user_agent: req.headers.get("user-agent") || "unknown",
        },
      })
      .then(({ error }) => {
        if (error) console.warn("[update-transaction-pin] audit failed:", error);
      });

    const nextAllowedAt = new Date(
      Date.now() + PIN_CHANGE_COOLDOWN_MS,
    ).toISOString();

    return NextResponse.json({
      success: true,
      message: "PIN updated successfully",
      nextAllowedAt,
    });
  } catch (error: any) {
    console.error("[update-transaction-pin] unexpected:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}