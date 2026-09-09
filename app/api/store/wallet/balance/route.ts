// app/api/store/wallet/balance/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedWithRefresh } from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const { user, newTokens } = await isAuthenticatedWithRefresh(req);
    
    if (!user) {
      return NextResponse.json(
        { error: "Please login to view wallet", logout: true },
        { status: 401 }
      );
    }

    // Get wallet balance using RPC
    const { data: wallet, error } = await supabase.rpc(
      "get_store_owner_wallet_balance",
      { p_user_id: user.id }
    );

    if (error) {
      console.error("Error fetching wallet balance:", error);
      
      // Check if wallet exists, if not create one
      const { data: store, error: storeError } = await supabase
        .from("online_stores")
        .select("id, owner_id, wallet_balance, total_revenue")
        .eq("owner_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (!storeError && store) {
        // Create wallet for existing store
        const { data: newWallet, error: createError } = await supabase
          .from("store_owner_wallets")
          .insert({
            user_id: user.id,
            store_id: store.id,
            available_balance: store.wallet_balance || 0,
            total_earned: store.total_revenue || 0,
            last_activity_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (!createError && newWallet) {
          return NextResponse.json({
            success: true,
            wallet: {
              available_balance: Number(newWallet.available_balance),
              pending_balance: Number(newWallet.pending_balance),
              total_earned: Number(newWallet.total_earned),
              total_withdrawn: Number(newWallet.total_withdrawn),
              last_activity_at: newWallet.last_activity_at,
              created_at: newWallet.created_at,
              updated_at: newWallet.updated_at,
            }
          });
        }
      }

      return NextResponse.json(
        { error: "Wallet not found" },
        { status: 404 }
      );
    }

    // Return wallet data
    const responseData = {
      success: true,
      wallet: {
        available_balance: Number(wallet?.available_balance || 0),
        pending_balance: Number(wallet?.pending_balance || 0),
        total_earned: Number(wallet?.total_earned || 0),
        total_withdrawn: Number(wallet?.total_withdrawn || 0),
        last_activity_at: wallet?.last_activity_at || null,
        created_at: wallet?.created_at || null,
        updated_at: wallet?.updated_at || null,
      }
    };

    if (newTokens) {
      const response = NextResponse.json(responseData);
      return response;
    }

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Error in wallet balance API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}