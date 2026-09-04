import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { isAuthenticated } from "@/lib/auth-check-api";
import { getSupabaseAdmin } from "@/lib/suabase-admin";

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
    const { pin, storeData } = body;

    if (!pin || pin.length < 4) {
      return NextResponse.json(
        { error: "PIN is required and must be at least 4 digits" },
        { status: 400 }
      );
    }

    // Get user with PIN info
    const { data: dbUser, error: userErr } = await supabase
      .from("users")
      .select("id, email, bvn_verification, transaction_pin, pin_attempts, pin_locked_until")
      .eq("id", user.id)
      .single();

    if (userErr || !dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check BVN verification
    if (dbUser.bvn_verification !== "verified") {
      return NextResponse.json(
        { error: "BVN verification is required before activation" },
        { status: 403 }
      );
    }

    // Check if PIN is locked
    if (dbUser.pin_locked_until) {
      const lockUntil = new Date(dbUser.pin_locked_until);
      const now = new Date();
      if (lockUntil > now) {
        const remainingMinutes = Math.ceil((lockUntil.getTime() - now.getTime()) / 60000);
        return NextResponse.json(
          { 
            error: `PIN is locked. Please wait ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''} or reset your PIN.`,
            locked: true,
            lockedUntil: lockUntil.toISOString()
          },
          { status: 403 }
        );
      }
    }

    // Verify PIN
    const plainPin = Array.isArray(pin) ? pin.join("") : pin;
    const isPinValid = await bcrypt.compare(plainPin, dbUser.transaction_pin);
    
    if (!isPinValid) {
      // Increment failed attempts
      const newAttempts = (dbUser.pin_attempts || 0) + 1;
      
      // Lock after 3 failed attempts
      if (newAttempts >= 3) {
        const lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lock
        await supabase
          .from("users")
          .update({
            pin_attempts: newAttempts,
            pin_locked_until: lockUntil.toISOString(),
          })
          .eq("id", user.id);

        return NextResponse.json(
          {
            error: "PIN locked due to too many failed attempts. Please wait 15 minutes or reset your PIN.",
            locked: true,
            lockedUntil: lockUntil.toISOString(),
            attempts: newAttempts,
          },
          { status: 403 }
        );
      }

      // Update attempts count
      await supabase
        .from("users")
        .update({ pin_attempts: newAttempts })
        .eq("id", user.id);

      const remainingAttempts = 3 - newAttempts;
      return NextResponse.json(
        {
          error: `Invalid PIN. ${remainingAttempts} attempt${remainingAttempts > 1 ? 's' : ''} remaining before PIN is locked.`,
          attempts: newAttempts,
        },
        { status: 403 }
      );
    }

    // ✅ PIN is valid - reset attempts
    await supabase
      .from("users")
      .update({ pin_attempts: 0, pin_locked_until: null })
      .eq("id", user.id);

    // Check if user already has a store
    const { data: existingStore } = await supabase
      .from("online_stores")
      .select("*")
      .eq("owner_id", user.id)
      .maybeSingle();

    let store = existingStore;

    // If no store exists, create one with the provided data
    if (!store) {
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
        console.error("Create store error:", createError);
        return NextResponse.json(
          { error: createError?.message || "Failed to create store" },
          { status: 500 }
        );
      }

      store = newStore;
    }

    // Check if store is already activated
    if (store.is_active && store.activation_paid) {
      return NextResponse.json(
        { error: "Store is already activated" },
        { status: 400 }
      );
    }

    // Check wallet balance
    const currentBalance = Number(store.wallet_balance || 0);
    if (currentBalance < ACTIVATION_FEE_NAIRA) {
      return NextResponse.json(
        { error: "Insufficient wallet balance. Please fund your wallet first." },
        { status: 400 }
      );
    }

    // ✅ Atomic: deduct activation fee from wallet using RPC
    const reference = `STORE_ACT_${Date.now()}_${user.id}`;
    
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
      console.error("Deduction error:", deductionError);
      return NextResponse.json(
        { error: "Failed to deduct activation fee. Please try again." },
        { status: 500 }
      );
    }

    // ✅ Activate store
    const { error: updateError } = await supabase
      .from("online_stores")
      .update({
        is_active: true,
        activation_paid: true,
        activated_at: new Date().toISOString(),
      })
      .eq("id", store.id);

    if (updateError) {
      console.error("Activation update error:", updateError);
      // Refund the user if activation fails
      await supabase.rpc("increment_wallet_balance", {
        user_id: user.id,
        amt: ACTIVATION_FEE_NAIRA,
      });
      
      return NextResponse.json(
        { error: "Failed to activate store. Funds have been refunded." },
        { status: 500 }
      );
    }

    // ✅ Record transaction
    const { error: txError } = await supabase.from("transactions").insert({
      user_id: user.id,
      type: "debit",
      amount: ACTIVATION_FEE_NAIRA,
      fee: 0,
      net_amount: ACTIVATION_FEE_NAIRA,
      status: "success",
      reference: reference,
      description: "Online store activation fee",
      channel: "store_activation",
      external_response: {
        store_id: store.id,
        store_name: store.name,
        activation_date: new Date().toISOString(),
      },
    });

    if (txError) {
      console.error("Transaction record error:", txError);
      // Don't fail the activation, just log the error
    }

    // Update wallet balance cache
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/user/wallet/balance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: user.id,
          forceBalance: currentBalance - ACTIVATION_FEE_NAIRA 
        }),
      });
    } catch (cacheError) {
      console.error("Failed to update wallet cache:", cacheError);
    }

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
    });

  } catch (error: any) {
    console.error("Store activation error:", error);
    return NextResponse.json(
      { error: error.message || "Activation failed" },
      { status: 500 }
    );
  }
}