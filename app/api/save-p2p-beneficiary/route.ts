import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  isAuthenticatedWithRefresh,
  createAuthResponse,
} from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── GET: list ─────────────────────────────────────────────
export async function GET(req: Request) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req as any);
  if (!user) {
    const r = NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
    return newTokens ? createAuthResponse(await r.json(), newTokens) : r;
  }

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId || userId !== user.id) {
      return NextResponse.json(
        { success: false, message: "Invalid user" },
        { status: 403 }
      );
    }

    const { data: beneficiaries, error } = await supabase
      .from("p2p_beneficiaries")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false })
      .order("last_used_at", { ascending: false });

    if (error) throw error;

    const res = NextResponse.json({
      success: true,
      beneficiaries: beneficiaries || [],
    });
    return newTokens ? createAuthResponse(await res.json(), newTokens) : res;
  } catch (error: any) {
    console.error("Get P2P beneficiaries error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// ─── POST: manual save ─────────────────────────────────────
export async function POST(req: Request) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req as any);
  if (!user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const {
      userId,
      walletId,
      accountNumber,
      accountName,
      isDefault = false,
    } = await req.json();

    if (userId !== user.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 }
      );
    }
    if (!walletId || !accountNumber || !accountName) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (isDefault) {
      await supabase
        .from("p2p_beneficiaries")
        .update({ is_default: false })
        .eq("user_id", userId)
        .eq("is_default", true);
    }

    const now = new Date().toISOString();

    const { data: existing } = await supabase
      .from("p2p_beneficiaries")
      .select("id, use_count")
      .eq("user_id", userId)
      .eq("wallet_id", walletId)
      .maybeSingle();

    let beneficiary;
    if (existing) {
      const { data, error } = await supabase
        .from("p2p_beneficiaries")
        .update({
          account_number: accountNumber,
          account_name: accountName,
          is_default: isDefault,
          last_used_at: now,
          use_count: (existing.use_count || 0) + 1,
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      beneficiary = data;
    } else {
      const { data, error } = await supabase
        .from("p2p_beneficiaries")
        .insert({
          user_id: userId,
          wallet_id: walletId,
          account_number: accountNumber,
          account_name: accountName,
          is_default: isDefault,
          auto_saved: false,
          last_used_at: now,
          use_count: 1,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          return NextResponse.json(
            { success: false, message: "This beneficiary already exists" },
            { status: 400 }
          );
        }
        throw error;
      }
      beneficiary = data;
    }

    const res = NextResponse.json({
      success: true,
      message: "Beneficiary saved successfully",
      beneficiary,
    });
    return newTokens ? createAuthResponse(await res.json(), newTokens) : res;
  } catch (error: any) {
    console.error("Save P2P beneficiary error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// ─── PATCH: set default ────────────────────────────────────
export async function PATCH(req: Request) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req as any);
  if (!user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { userId, id, isDefault } = await req.json();
    if (userId !== user.id || !id) {
      return NextResponse.json(
        { success: false, message: "Invalid request" },
        { status: 400 }
      );
    }

    if (isDefault === true) {
      await supabase
        .from("p2p_beneficiaries")
        .update({ is_default: false })
        .eq("user_id", userId);
    }

    const { data, error } = await supabase
      .from("p2p_beneficiaries")
      .update({ is_default: isDefault })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;

    const res = NextResponse.json({ success: true, beneficiary: data });
    return newTokens ? createAuthResponse(await res.json(), newTokens) : res;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// ─── DELETE ────────────────────────────────────────────────
export async function DELETE(req: Request) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req as any);
  if (!user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const id = searchParams.get("id");

    if (userId !== user.id || !id) {
      return NextResponse.json(
        { success: false, message: "Invalid request" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("p2p_beneficiaries")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;

    const res = NextResponse.json({ success: true });
    return newTokens ? createAuthResponse(await res.json(), newTokens) : res;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}