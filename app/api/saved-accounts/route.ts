import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedWithRefresh, createAuthResponse } from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── GET: list ─────────────────────────────────────────────
export async function GET(req: Request) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req as any);
  if (!user) {
    const r = NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    return newTokens ? createAuthResponse(await r.json(), newTokens) : r;
  }

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId || userId !== user.id) {
      return NextResponse.json({ success: false, message: "Invalid user" }, { status: 403 });
    }

    const { data: accounts, error } = await supabase
      .from("saved_accounts")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false })
      .order("last_used_at", { ascending: false });

    if (error) throw error;

    const res = NextResponse.json({ success: true, accounts: accounts || [] });
    return newTokens ? createAuthResponse(await res.json(), newTokens) : res;
  } catch (error: any) {
    console.error("Get saved accounts error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// ─── POST: manual save (kept for the post-success nudge) ───
export async function POST(req: Request) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req as any);
  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId, accountNumber, accountName, bankCode, bankName, isDefault = false } =
      await req.json();

    if (userId !== user.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }
    if (!accountNumber || !accountName || !bankCode || !bankName) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    if (isDefault) {
      await supabase
        .from("saved_accounts")
        .update({ is_default: false })
        .eq("user_id", userId)
        .eq("is_default", true);
    }

    const now = new Date().toISOString();
    const { data: existing } = await supabase
      .from("saved_accounts")
      .select("id, use_count")
      .eq("user_id", userId)
      .eq("account_number", accountNumber)
      .eq("bank_code", bankCode)
      .maybeSingle();

    let account;
    if (existing) {
      const { data } = await supabase
        .from("saved_accounts")
        .update({
          account_name: accountName,
          bank_name: bankName,
          last_used_at: now,
          use_count: (existing.use_count || 0) + 1,
          is_default: isDefault,
        })
        .eq("id", existing.id)
        .select()
        .single();
      account = data;
    } else {
      const { data, error } = await supabase
        .from("saved_accounts")
        .insert({
          user_id: userId,
          account_number: accountNumber,
          account_name: accountName,
          bank_code: bankCode,
          bank_name: bankName,
          is_default: isDefault,
          auto_saved: false,
          last_used_at: now,
          use_count: 1,
        })
        .select()
        .single();
      if (error) throw error;
      account = data;
    }

    const res = NextResponse.json({
      success: true,
      message: "Account saved successfully",
      account,
    });
    return newTokens ? createAuthResponse(await res.json(), newTokens) : res;
  } catch (error: any) {
    console.error("Save account error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// ─── PATCH: set default / rename ───────────────────────────
export async function PATCH(req: Request) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req as any);
  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId, id, isDefault, accountName } = await req.json();
    if (userId !== user.id || !id) {
      return NextResponse.json({ success: false, message: "Invalid request" }, { status: 400 });
    }

    if (isDefault === true) {
      await supabase
        .from("saved_accounts")
        .update({ is_default: false })
        .eq("user_id", userId);
    }

    const update: Record<string, any> = {};
    if (isDefault !== undefined) update.is_default = isDefault;
    if (accountName) update.account_name = accountName;

    const { data, error } = await supabase
      .from("saved_accounts")
      .update(update)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;

    const res = NextResponse.json({ success: true, account: data });
    return newTokens ? createAuthResponse(await res.json(), newTokens) : res;
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// ─── DELETE ────────────────────────────────────────────────
export async function DELETE(req: Request) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req as any);
  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const id = searchParams.get("id");

    if (userId !== user.id || !id) {
      return NextResponse.json({ success: false, message: "Invalid request" }, { status: 400 });
    }

    const { error } = await supabase
      .from("saved_accounts")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;

    const res = NextResponse.json({ success: true });
    return newTokens ? createAuthResponse(await res.json(), newTokens) : res;
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}