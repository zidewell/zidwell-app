// app/api/admin-apis/users/[id]/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createAuditLog, getClientInfo } from "@/lib/audit-log";
import { requireAdmin } from "@/lib/admin-auth";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ═════════════════════════════════════════════════════════════
// GET — fetch single user
// ═════════════════════════════════════════════════════════════
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const adminUser = await requireAdmin(req);
    if (adminUser instanceof NextResponse) return adminUser;

    const allowedRoles = ["super_admin", "operations_admin", "support_admin"];
    if (!allowedRoles.includes(adminUser?.admin_role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }
    const id = (await params).id;

    const { data, error } = await supabaseAdmin
      .from("users")
      .select(
        "id, email, first_name, last_name, full_name, wallet_balance, phone, admin_role, created_at, is_blocked, blocked_at, block_reason, last_login, last_logout, account_tier, custom_outflow_percent, custom_outflow_min, custom_fee_note, email_verified, email_verification_token, email_verification_token_expires, bvn_verification, is_flagged, flag_reason, flag_notes, flagged_at, wallet_frozen, wallet_freeze_reason, wallet_frozen_at, pin_set, pin_attempts, pin_locked_until, kyc_approved_at, kyc_approved_by, kyc_rejected_at, kyc_rejection_reason, kyc_rejected_by, suspension_duration",
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("❌ Error fetching user:", error);
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ user: data });
  } catch (error: any) {
    console.error("User detail fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ═════════════════════════════════════════════════════════════
// PATCH — update user (WITH account_tier + custom fee support)
// ═════════════════════════════════════════════════════════════
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const adminUser = await requireAdmin(req);
    if (adminUser instanceof NextResponse) return adminUser;

    const allowedRoles = ["super_admin", "operations_admin"];
    if (!allowedRoles.includes(adminUser?.admin_role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const clientInfo = getClientInfo(req.headers);
    const id = (await params).id;
    const body = await req.json();

    // Get current state
    const { data: currentUser, error: fetchError } = await supabaseAdmin
      .from("users")
      .select(
        "id, email, first_name, last_name, phone, admin_role, wallet_balance, created_at, is_blocked, blocked_at, block_reason, account_tier, custom_outflow_percent, custom_outflow_min, custom_fee_note",
      )
      .eq("id", id)
      .single();

    if (fetchError) {
      await createAuditLog({
        userId: adminUser.id,
        userEmail: adminUser.email,
        action: "user_detail_update_failed",
        resourceType: "User",
        resourceId: id,
        description: `Failed to update user ${id}: User not found`,
        metadata: {
          userId: id,
          attemptedUpdates: body,
          error: fetchError.message,
          attemptedBy: adminUser.email,
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
      });

      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ✅ Whitelist including account_tier + custom fees
    const allowedFields = [
      "first_name",
      "last_name",
      "full_name",
      "phone",
      "email",
      "admin_role",
      "account_tier",
      "custom_outflow_percent",
      "custom_outflow_min",
      "custom_fee_note",
      "bvn_verification",
      "email_verified",
      "is_blocked",
      "is_flagged",
      "wallet_frozen",
    ];

    const updateData: Record<string, any> = {};
    for (const key of allowedFields) {
      if (key in body) updateData[key] = body[key];
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update." },
        { status: 400 },
      );
    }

    // ── Validate account_tier if provided ──
    if ("account_tier" in updateData) {
      const validTiers = ["tier_1", "tier_2", "tier_3"];
      if (
        updateData.account_tier !== null &&
        updateData.account_tier !== undefined &&
        !validTiers.includes(updateData.account_tier)
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid account_tier. Must be tier_1, tier_2, or tier_3",
          },
          { status: 400 },
        );
      }
    }

    // ── Validate custom_outflow_percent ──
    if (
      "custom_outflow_percent" in updateData &&
      updateData.custom_outflow_percent !== null &&
      updateData.custom_outflow_percent !== ""
    ) {
      const pct = Number(updateData.custom_outflow_percent);
      if (isNaN(pct) || pct < 0 || pct > 1) {
        return NextResponse.json(
          {
            error:
              "custom_outflow_percent must be between 0 and 1 (e.g. 0.001 = 0.1%)",
          },
          { status: 400 },
        );
      }
      updateData.custom_outflow_percent = pct;
    } else if (
      "custom_outflow_percent" in updateData &&
      (updateData.custom_outflow_percent === null ||
        updateData.custom_outflow_percent === "")
    ) {
      updateData.custom_outflow_percent = null;
    }

    // ── Validate custom_outflow_min ──
    if (
      "custom_outflow_min" in updateData &&
      updateData.custom_outflow_min !== null &&
      updateData.custom_outflow_min !== ""
    ) {
      const min = Number(updateData.custom_outflow_min);
      if (isNaN(min) || min < 0) {
        return NextResponse.json(
          { error: "custom_outflow_min must be ≥ 0" },
          { status: 400 },
        );
      }
      updateData.custom_outflow_min = min;
    } else if (
      "custom_outflow_min" in updateData &&
      (updateData.custom_outflow_min === null ||
        updateData.custom_outflow_min === "")
    ) {
      updateData.custom_outflow_min = null;
    }

    // ── Prevent self-role modification ──
    if (
      id === adminUser.id &&
      "admin_role" in updateData &&
      updateData.admin_role !== currentUser.admin_role
    ) {
      return NextResponse.json(
        { error: "Cannot modify your own admin role" },
        { status: 400 },
      );
    }

    // ── Email uniqueness check ──
    if (updateData.email && updateData.email !== currentUser.email) {
      const { data: dup } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("email", updateData.email)
        .neq("id", id)
        .maybeSingle();

      if (dup) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 409 },
        );
      }
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("users")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      await createAuditLog({
        userId: adminUser.id,
        userEmail: adminUser.email,
        action: "user_detail_update_failed",
        resourceType: "User",
        resourceId: id,
        description: `Failed to update user ${id}: ${error.message}`,
        metadata: {
          userId: id,
          userEmail: currentUser.email,
          attemptedUpdates: updateData,
          error: error.message,
          attemptedBy: adminUser.email,
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
      });

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Audit log
    await createAuditLog({
      userId: adminUser.id,
      userEmail: adminUser.email,
      action: "update_user_detail",
      resourceType: "User",
      resourceId: id,
      description: `Updated user ${currentUser.email}: ${Object.keys(updateData).join(", ")}`,
      metadata: {
        userId: id,
        userEmail: currentUser.email,
        changedFields: Object.keys(updateData),
        previousValues: currentUser,
        newValues: data,
        updatedBy: adminUser.email,
      },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
    });

    // Special audit for tier change
    if (
      "account_tier" in updateData &&
      updateData.account_tier !== currentUser.account_tier
    ) {
      await createAuditLog({
        userId: adminUser.id,
        userEmail: adminUser.email,
        action: "change_account_tier",
        resourceType: "User",
        resourceId: id,
        description: `Changed account tier for ${currentUser.email} from ${currentUser.account_tier} to ${updateData.account_tier}`,
        metadata: {
          userId: id,
          userEmail: currentUser.email,
          previousTier: currentUser.account_tier,
          newTier: updateData.account_tier,
          changedBy: adminUser.email,
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
      });
    }

    return NextResponse.json({
      user: data,
      message: "✅ User updated successfully",
      _admin: {
        performedBy: adminUser.email,
        performedAt: new Date().toISOString(),
        auditLogged: true,
      },
    });
  } catch (error: any) {
    console.error("User detail update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ═════════════════════════════════════════════════════════════
// POST — action handler (block, suspend, flag, kyc, verify_email, etc.)
// ═════════════════════════════════════════════════════════════
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const adminUser = await requireAdmin(req);
    if (adminUser instanceof NextResponse) return adminUser;

    const allowedRoles = ["super_admin", "operations_admin", "support_admin"];
    if (!allowedRoles.includes(adminUser?.admin_role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const clientInfo = getClientInfo(req.headers);
    const id = (await params).id;
    const body = await req.json();
    const { action, reason, duration, notes } = body;

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    const { data: user, error: fetchError } = await supabaseAdmin
      .from("users")
      .select(
        "id, email, first_name, last_name, is_blocked, is_flagged, wallet_frozen, admin_role, bvn_verification, email_verified",
      )
      .eq("id", id)
      .single();

    if (fetchError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.id === adminUser.id) {
      return NextResponse.json(
        { error: `Cannot ${action} your own account` },
        { status: 400 },
      );
    }

    // ── Per-action role checks ──
    const actionPermissions: Record<string, string[]> = {
      block: ["super_admin", "operations_admin"],
      unblock: ["super_admin", "operations_admin"],
      suspend: ["super_admin", "operations_admin"],
      flag: ["super_admin", "operations_admin"],
      unflag: ["super_admin", "operations_admin"],
      freeze: ["super_admin", "operations_admin", "finance_admin"],
      unfreeze: ["super_admin", "operations_admin", "finance_admin"],
      approve_kyc: ["super_admin", "operations_admin", "support_admin"],
      reject_kyc: ["super_admin", "operations_admin", "support_admin"],
      verify_email: ["super_admin", "operations_admin", "support_admin"],
      reset_pin: ["super_admin", "operations_admin", "support_admin"],
    };

    const permittedRoles = actionPermissions[action];
    if (permittedRoles && !permittedRoles.includes(adminUser.admin_role)) {
      return NextResponse.json(
        {
          error: `Your role (${adminUser.admin_role}) cannot perform "${action}"`,
        },
        { status: 403 },
      );
    }

    let updateData: any = {};
    let auditAction = "";
    let auditDescription = "";
    let auditExtra: Record<string, any> = {};
    let extraAction: (() => Promise<void>) | undefined;

    switch (action) {
      case "block":
      case "unblock": {
        const isBlock = action === "block";
        updateData = {
          is_blocked: isBlock,
          blocked_at: isBlock ? new Date().toISOString() : null,
          block_reason: isBlock ? reason || "Blocked by admin" : null,
          suspension_duration: null,
          updated_at: new Date().toISOString(),
        };
        auditAction = isBlock ? "block_user" : "unblock_user";
        auditDescription = `${isBlock ? "Blocked" : "Unblocked"} ${user.email}${reason ? `: ${reason}` : ""}`;
        extraAction = async () => {
          try {
            await supabaseAdmin.auth.admin.updateUserById(id, {
              ban_duration: isBlock ? "87600h" : "none",
            });
          } catch (e) {
            console.error("[block] auth ban update failed:", e);
          }
        };
        break;
      }
      case "suspend": {
        const isPermanent = duration === "permanent";
        const durationDays = isPermanent ? -1 : parseInt(duration, 10) || 7;
        updateData = {
          is_blocked: true,
          blocked_at: new Date().toISOString(),
          block_reason: reason || "Suspended by admin",
          suspension_duration: durationDays,
          updated_at: new Date().toISOString(),
        };
        auditAction = "suspend_user";
        auditDescription = `Suspended ${user.email} for ${isPermanent ? "permanently" : `${durationDays} days`}${reason ? `: ${reason}` : ""}`;
        extraAction = async () => {
          try {
            await supabaseAdmin.auth.admin.updateUserById(id, {
              ban_duration: isPermanent ? "87600h" : `${durationDays * 24}h`,
            });
          } catch (e) {
            console.error("[suspend] auth ban update failed:", e);
          }
        };
        break;
      }
      case "flag": {
        updateData = {
          is_flagged: true,
          flag_reason: reason || "Flagged by admin",
          flag_notes: notes || null,
          flagged_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        auditAction = "flag_user";
        auditDescription = `Flagged ${user.email}: ${reason}`;
        break;
      }
      case "unflag": {
        updateData = {
          is_flagged: false,
          flag_reason: null,
          flag_notes: null,
          flagged_at: null,
          updated_at: new Date().toISOString(),
        };
        auditAction = "unflag_user";
        auditDescription = `Unflagged ${user.email}`;
        break;
      }
      case "freeze": {
        updateData = {
          wallet_frozen: true,
          wallet_freeze_reason: reason || "Frozen by admin",
          wallet_frozen_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        auditAction = "freeze_wallet";
        auditDescription = `Froze wallet for ${user.email}: ${reason}`;
        break;
      }
      case "unfreeze": {
        updateData = {
          wallet_frozen: false,
          wallet_freeze_reason: null,
          wallet_frozen_at: null,
          updated_at: new Date().toISOString(),
        };
        auditAction = "unfreeze_wallet";
        auditDescription = `Unfroze wallet for ${user.email}`;
        break;
      }
      case "approve_kyc": {
        updateData = {
          bvn_verification: "verified",
          kyc_approved_at: new Date().toISOString(),
          kyc_approved_by: adminUser.email,
          updated_at: new Date().toISOString(),
        };
        auditAction = "approve_kyc";
        auditDescription = `Approved KYC for ${user.email}`;
        break;
      }
      case "reject_kyc": {
        if (!reason) {
          return NextResponse.json(
            { error: "Rejection reason is required" },
            { status: 400 },
          );
        }
        updateData = {
          bvn_verification: "rejected",
          kyc_rejected_at: new Date().toISOString(),
          kyc_rejection_reason: reason,
          kyc_rejected_by: adminUser.email,
          updated_at: new Date().toISOString(),
        };
        auditAction = "reject_kyc";
        auditDescription = `Rejected KYC for ${user.email}: ${reason}`;
        break;
      }

      // ═════════════════════════════════════════════════════════
      // ✅ FIXED: verify_email — AUTH FIRST, then mirror to DB
      // ═════════════════════════════════════════════════════════
      case "verify_email": {
        // Short-circuit: already verified in DB — still ensure auth is confirmed
        if (user.email_verified === true) {
          try {
            const { data: authLookup } =
              await supabaseAdmin.auth.admin.getUserById(id);
            if (!authLookup?.user?.email_confirmed_at) {
              await supabaseAdmin.auth.admin.updateUserById(id, {
                email_confirm: true,
              });
              console.log(
                `[verify_email] auth re-confirmed for already-verified user ${id}`,
              );
            }
          } catch (e) {
            console.error(
              "[verify_email] auth re-confirm failed for already-verified user:",
              e,
            );
          }

          await createAuditLog({
            userId: adminUser.id,
            userEmail: adminUser.email,
            action: "verify_email_already_verified",
            resourceType: "User",
            resourceId: id,
            description: `Email already verified for ${user.email} — no changes made`,
            metadata: {
              targetUserId: id,
              targetEmail: user.email,
              performedBy: adminUser.email,
              alreadyVerified: true,
            },
            ipAddress: clientInfo.ipAddress,
            userAgent: clientInfo.userAgent,
          });

          return NextResponse.json({
            ok: true,
            alreadyVerified: true,
            message: `Email was already verified for ${user.email}`,
            _admin: {
              performedBy: adminUser.email,
              performedAt: new Date().toISOString(),
              auditLogged: true,
            },
          });
        }

        // ── STEP 1: Confirm in Supabase Auth FIRST (source of truth) ──
        // If this fails, we MUST NOT flip email_verified in public.users,
        // otherwise the login flow will be permanently blocked for the user.
        let authConfirmed = false;
        try {
          const { data: authLookup } =
            await supabaseAdmin.auth.admin.getUserById(id);

          if (authLookup?.user?.email_confirmed_at) {
            authConfirmed = true;
            console.log(`[verify_email] ${id}: auth already confirmed`);
          } else {
            const { error: authErr } =
              await supabaseAdmin.auth.admin.updateUserById(id, {
                email_confirm: true,
              });

            if (authErr) {
              console.error("[verify_email] auth confirm failed:", authErr);
              return NextResponse.json(
                {
                  error: `Failed to confirm email in Supabase Auth: ${authErr.message}`,
                },
                { status: 500 },
              );
            }
            authConfirmed = true;
            console.log(`[verify_email] ${id}: auth confirmed`);
          }
        } catch (e: any) {
          console.error("[verify_email] auth confirm threw:", e);
          return NextResponse.json(
            { error: `Auth confirmation error: ${e?.message ?? "unknown"}` },
            { status: 500 },
          );
        }

        // Auth failed check — defensive (shouldn't be reachable)
        if (!authConfirmed) {
          return NextResponse.json(
            { error: "Failed to confirm email in Supabase Auth" },
            { status: 500 },
          );
        }

        // ── STEP 2: Mirror to public.users (auth succeeded) ──
        updateData = {
          email_verified: true,
          email_verification_token: null,
          email_verification_token_expires: null,
          updated_at: new Date().toISOString(),
        };

        auditAction = "manually_verify_email";
        auditDescription = `Manually verified email for ${user.email}`;
        auditExtra = {
          authConfirmed: true,
          tokenCleared: true,
        };

        // No extraAction — auth was already handled in STEP 1
        break;
      }

      case "reset_pin": {
        updateData = {
          pin_set: false,
          transaction_pin: null,
          pin_attempts: 0,
          pin_locked_until: null,
          pin_reset_token: null,
          pin_reset_token_expires: null,
          pin_reset_otp_hash: null,
          pin_reset_otp_expires: null,
          pin_reset_otp_attempts: 0,
          updated_at: new Date().toISOString(),
        };
        auditAction = "reset_transaction_pin";
        auditDescription = `Reset transaction PIN for ${user.email}`;
        break;
      }
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 },
        );
    }

    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update(updateData)
      .eq("id", id);

    if (updateError) {
      // For verify_email, if the DB mirror fails AFTER auth succeeded,
      // surface it clearly but note the auth state.
      if (action === "verify_email") {
        await createAuditLog({
          userId: adminUser.id,
          userEmail: adminUser.email,
          action: "verify_email_db_mirror_failed",
          resourceType: "User",
          resourceId: id,
          description: `Auth confirmed but DB mirror failed for ${user.email}: ${updateError.message}`,
          metadata: {
            targetUserId: id,
            targetEmail: user.email,
            authConfirmed: true,
            dbError: updateError.message,
            performedBy: adminUser.email,
          },
          ipAddress: clientInfo.ipAddress,
          userAgent: clientInfo.userAgent,
        });

        // Auth is confirmed — user CAN log in. Warn but don't fail hard.
        return NextResponse.json(
          {
            ok: true,
            authConfirmed: true,
            warning: "db_mirror_failed",
            message: `Email confirmed in Supabase Auth, but DB update failed: ${updateError.message}. User can still log in.`,
            _admin: {
              performedBy: adminUser.email,
              performedAt: new Date().toISOString(),
              auditLogged: true,
            },
          },
          { status: 200 },
        );
      }

      return NextResponse.json(
        { error: updateError.message },
        { status: 500 },
      );
    }

    if (extraAction) await extraAction();

    await createAuditLog({
      userId: adminUser.id,
      userEmail: adminUser.email,
      action: auditAction,
      resourceType: "User",
      resourceId: id,
      description: auditDescription,
      metadata: {
        targetUserId: id,
        targetEmail: user.email,
        action,
        reason,
        duration,
        notes,
        performedBy: adminUser.email,
        ...auditExtra,
      },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
    });

    return NextResponse.json({
      ok: true,
      message: `${action.replace(/_/g, " ")} successful`,
      ...(action === "verify_email" && {
        authConfirmed: true,
        emailVerified: true,
      }),
      _admin: {
        performedBy: adminUser.email,
        performedAt: new Date().toISOString(),
        auditLogged: true,
      },
    });
  } catch (err: any) {
    console.error("User action error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ═════════════════════════════════════════════════════════════
// DELETE — remove user (auth-first, cascades to public.users)
// ═════════════════════════════════════════════════════════════
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const adminUser = await requireAdmin(req);
    if (adminUser instanceof NextResponse) return adminUser;

    const allowedRoles = ["super_admin", "operations_admin"];
    if (!allowedRoles.includes(adminUser?.admin_role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const clientInfo = getClientInfo(req.headers);
    const id = (await params).id;

    const { data: user, error: fetchError } = await supabaseAdmin
      .from("users")
      .select(
        "id, email, first_name, last_name, phone, admin_role, wallet_balance, created_at",
      )
      .eq("id", id)
      .single();

    if (fetchError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.id === adminUser.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 },
      );
    }

    // ── Delete auth user FIRST — cascades to public.users via FK ──
    let authDeleteOk = false;
    try {
      const { error: authDelErr } =
        await supabaseAdmin.auth.admin.deleteUser(id);

      if (authDelErr) {
        // Some cases: user exists in public.users but has no auth row,
        // or auth delete fails due to constraints. Log and fall back.
        console.warn(
          "[DELETE user] auth delete failed, falling back to public.users delete:",
          authDelErr.message,
        );
      } else {
        authDeleteOk = true;
      }
    } catch (e: any) {
      console.error("[DELETE user] auth delete threw:", e);
    }

    // ── Fallback: if auth delete didn't cascade, explicitly delete from public.users ──
    // Also runs if the user had no auth record to begin with.
    const { data: stillExists } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (stillExists) {
      const { error: dbDelErr } = await supabaseAdmin
        .from("users")
        .delete()
        .eq("id", id);

      if (dbDelErr) {
        await createAuditLog({
          userId: adminUser.id,
          userEmail: adminUser.email,
          action: "user_delete_failed",
          resourceType: "User",
          resourceId: id,
          description: `Failed to delete user ${id}: ${dbDelErr.message}`,
          metadata: {
            userId: id,
            userEmail: user.email,
            authDeleteOk,
            dbError: dbDelErr.message,
            attemptedBy: adminUser.email,
          },
          ipAddress: clientInfo.ipAddress,
          userAgent: clientInfo.userAgent,
        });

        return NextResponse.json(
          { error: dbDelErr.message },
          { status: 500 },
        );
      }
    }

    await createAuditLog({
      userId: adminUser.id,
      userEmail: adminUser.email,
      action: "delete_user_detail",
      resourceType: "User",
      resourceId: id,
      description: `Deleted user account: ${user.email}`,
      metadata: {
        userId: id,
        userEmail: user.email,
        authDeleteOk,
        deletedBy: adminUser.email,
        deletionTime: new Date().toISOString(),
      },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
    });

    return NextResponse.json({
      ok: true,
      message: "✅ User deleted successfully",
    });
  } catch (error: any) {
    console.error("User detail deletion error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}