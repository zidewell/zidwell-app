// app/api/store/activate/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticated } from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ACTIVATION_FEE_NAIRA = 2000;

export async function POST(req: NextRequest) {
  const user = await isAuthenticated(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { storeData } = body;

    console.log("📦 Activation request:", {
      hasStoreData: !!storeData,
      userId: user.id,
    });

    // Get user with wallet balance
    const { data: dbUser, error: userErr } = await supabase
      .from("users")
      .select("id, email, bvn_verification, wallet_balance")
      .eq("id", user.id)
      .single();

    if (userErr || !dbUser) {
      console.error("❌ User not found:", userErr);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("✅ User found:", dbUser.id);
    
    // ✅ Get user's MAIN wallet balance (from users table)
    const userMainBalance = Number(dbUser.wallet_balance || 0);
    console.log("💰 User main wallet balance:", userMainBalance);

    // Check if user already has a store
    let { data: store, error: storeErr } = await supabase
      .from("online_stores")
      .select("*")
      .eq("owner_id", user.id)
      .maybeSingle();

    console.log("🔍 Store lookup:", { hasStore: !!store, storeId: store?.id });

    // If no store exists, create one with the provided data
    if (!store) {
      console.log("🏪 No store found, creating one...");

      if (!storeData) {
        return NextResponse.json(
          { error: "Store data is required to create a store" },
          { status: 400 }
        );
      }

      // Validate store data
      const { name, slug, description, country, state, city, streetAddress } = storeData;

      if (!name?.trim() || !slug?.trim() || !description?.trim()) {
        return NextResponse.json(
          { error: "Name, slug and description are required" },
          { status: 400 }
        );
      }
      if (!country?.trim() || !state?.trim() || !city?.trim() || !streetAddress?.trim()) {
        return NextResponse.json(
          { error: "Complete location details are required" },
          { status: 400 }
        );
      }

      // Slugify and validate
      const cleanSlug = slug.toLowerCase()
        .replace(/[^a-z0-9-]/g, "")
        .replace(/\s/g, "-")
        .replace(/-+/g, "-");

      if (cleanSlug.length < 3) {
        return NextResponse.json(
          { error: "Store URL must be at least 3 characters" },
          { status: 400 }
        );
      }

      // Check if slug is taken
      const { data: slugTaken } = await supabase
        .from("online_stores")
        .select("id")
        .eq("slug", cleanSlug)
        .maybeSingle();

      if (slugTaken) {
        return NextResponse.json(
          { error: "That store URL is taken. Please choose a different one." },
          { status: 409 }
        );
      }

      // Create the store
      const { data: newStore, error: createError } = await supabase
        .from("online_stores")
        .insert({
          owner_id: user.id,
          name: name.trim(),
          slug: cleanSlug,
          description: description.trim(),
          keywords: storeData.keywords || [],
          cac_number: storeData.cacNumber?.trim() || null,
          country: country.trim(),
          state: state.trim(),
          city: city.trim(),
          street_address: streetAddress.trim(),
          location_enabled: storeData.locationEnabled !== false,
          is_active: false,
          activation_paid: false,
          wallet_balance: 0,
          total_revenue: 0,
          total_orders: 0,
          total_views: 0,
        })
        .select()
        .single();

      if (createError || !newStore) {
        console.error("❌ Create store error:", createError);
        return NextResponse.json(
          { error: createError?.message || "Failed to create store" },
          { status: 500 }
        );
      }

      console.log("✅ Store created:", newStore.id);
      store = newStore;
    } else {
      console.log("✅ Store already exists:", store.id);

      // If store already exists and is active, return error
      if (store.is_active && store.activation_paid) {
        return NextResponse.json(
          { error: "Store is already activated" },
          { status: 400 }
        );
      }
    }

    // ============================================================
    // ✅ CHECK USER MAIN BALANCE (from users table)
    // ============================================================
    console.log("💰 Checking user main balance:", userMainBalance);

    if (userMainBalance < ACTIVATION_FEE_NAIRA) {
      return NextResponse.json(
        {
          error: `Insufficient wallet balance. ₦${ACTIVATION_FEE_NAIRA.toLocaleString()} required. You have ₦${userMainBalance.toLocaleString()}`,
          required: ACTIVATION_FEE_NAIRA,
          current: userMainBalance,
          shortfall: ACTIVATION_FEE_NAIRA - userMainBalance,
          needsFunding: true,
        },
        { status: 400 }
      );
    }

    // ============================================================
    // ✅ DEDUCT FROM USER MAIN BALANCE (users.wallet_balance)
    // ============================================================
    const reference = `STORE_ACT_${Date.now()}_${user.id}`;

    // Deduct from user's main wallet using RPC
    const { data: deductionResult, error: deductionError } = await supabase.rpc(
      "deduct_wallet_balance",
      {
        user_id: user.id,
        amt: ACTIVATION_FEE_NAIRA,
        transaction_type: "debit",
        reference: reference,
        description: "Online store activation fee",
      }
    );

    if (deductionError) {
      console.error("❌ Deduction error:", deductionError);
      return NextResponse.json(
        { error: "Failed to deduct activation fee. Please try again." },
        { status: 500 }
      );
    }

    console.log("✅ Fee deducted from user main balance:", ACTIVATION_FEE_NAIRA);
    console.log("📊 Deduction result:", deductionResult);

    // ============================================================
    // ✅ CREATE WALLET FOR STORE OWNER (store_owner_wallets)
    // ============================================================
    // Check if store owner wallet exists
    const { data: existingWallet } = await supabase
      .from("store_owner_wallets")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existingWallet) {
      console.log("🏦 Creating store owner wallet...");
      
      const { error: createWalletError } = await supabase
        .from("store_owner_wallets")
        .insert({
          user_id: user.id,
          store_id: store.id,
          available_balance: 0,
          pending_balance: 0,
          total_earned: 0,
          total_withdrawn: 0,
          last_activity_at: new Date().toISOString(),
        });

      if (createWalletError) {
        console.error("❌ Failed to create store owner wallet:", createWalletError);
        // Non-critical - continue activation
      } else {
        console.log("✅ Store owner wallet created");
      }
    }

    // ============================================================
    // ✅ ACTIVATE STORE
    // ============================================================
    const { error: updateError } = await supabase
      .from("online_stores")
      .update({
        is_active: true,
        activation_paid: true,
        activated_at: new Date().toISOString(),
        activation_reference: reference,
      })
      .eq("id", store.id);

    if (updateError) {
      console.error("❌ Activation update error:", updateError);
      
      // Refund user main balance if activation fails
      await supabase.rpc("increment_wallet_balance", {
        user_id: user.id,
        amt: ACTIVATION_FEE_NAIRA,
      });

      return NextResponse.json(
        { error: "Failed to activate store. Funds have been refunded." },
        { status: 500 }
      );
    }

    console.log("✅ Store activated:", store.id);

    // Get updated user balance
    const { data: updatedUser } = await supabase
      .from("users")
      .select("wallet_balance")
      .eq("id", user.id)
      .single();

    return NextResponse.json({
      success: true,
      message: "Store activated successfully",
      store: {
        id: store.id,
        name: store.name,
        slug: store.slug,
        is_active: true,
        activation_paid: true,
      },
      wallet: {
        new_balance: updatedUser?.wallet_balance || 0,
        deducted: ACTIVATION_FEE_NAIRA,
      },
    });
  } catch (error: any) {
    console.error("❌ Store activation error:", error);
    return NextResponse.json(
      { error: error.message || "Activation failed" },
      { status: 500 }
    );
  }
}