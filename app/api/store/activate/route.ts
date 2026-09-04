import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
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
    const { pin, storeData } = body;

    console.log("📦 Activation request:", { 
      hasPin: !!pin, 
      hasStoreData: !!storeData,
      userId: user.id 
    });

    if (!pin || pin.length < 4) {
      return NextResponse.json(
        { error: "PIN is required and must be at least 4 digits" },
        { status: 400 }
      );
    }

    // ✅ Get user with PIN info AND wallet balance from users table
    const { data: dbUser, error: userErr } = await supabase
      .from("users")
      .select("id, email, bvn_verification, transaction_pin, pin_attempts, pin_locked_until, wallet_balance")
      .eq("id", user.id)
      .single();

    if (userErr || !dbUser) {
      console.error("❌ User not found:", userErr);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("✅ User found:", dbUser.id);
    console.log("💰 User wallet balance:", dbUser.wallet_balance);

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
        const lockUntil = new Date(Date.now() + 15 * 60 * 1000);
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

    console.log("✅ PIN verified");

    // ✅ Check if user already has a store
    let { data: store, error: storeErr } = await supabase
      .from("online_stores")
      .select("*")
      .eq("owner_id", user.id)
      .maybeSingle();

    console.log("🔍 Store lookup:", { hasStore: !!store, storeId: store?.id });

    // ✅ If no store exists, create one with the provided data
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
      
      // ✅ If store already exists and is active, return error
      if (store.is_active && store.activation_paid) {
        return NextResponse.json(
          { error: "Store is already activated" },
          { status: 400 }
        );
      }
    }

    // ✅ CHECK USER WALLET BALANCE FROM USERS TABLE (not store)
    const userBalance = Number(dbUser.wallet_balance || 0);
    console.log("💰 User wallet balance:", userBalance);
    
    if (userBalance < ACTIVATION_FEE_NAIRA) {
      return NextResponse.json(
        { 
          error: `Insufficient wallet balance. ₦${ACTIVATION_FEE_NAIRA.toLocaleString()} required. You have ₦${userBalance.toLocaleString()}`,
          required: ACTIVATION_FEE_NAIRA,
          current: userBalance,
          shortfall: ACTIVATION_FEE_NAIRA - userBalance
        },
        { status: 400 }
      );
    }

    // ✅ Atomic: deduct activation fee from USER wallet using RPC
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
      console.error("❌ Deduction error:", deductionError);
      return NextResponse.json(
        { error: "Failed to deduct activation fee. Please try again." },
        { status: 500 }
      );
    }

    console.log("✅ Fee deducted from user wallet:", ACTIVATION_FEE_NAIRA);
    console.log("📊 Deduction result:", deductionResult);

    // ✅ Get the transaction ID from the deduction result
    let transactionId = null;
    if (deductionResult && Array.isArray(deductionResult) && deductionResult.length > 0) {
      transactionId = deductionResult[0]?.transaction_id;
      console.log("📊 Transaction ID from deduction:", transactionId);
    }

    // ✅ If we have a transaction ID, update its status to 'success'
    if (transactionId) {
      const { error: updateTxError } = await supabase
        .from("transactions")
        .update({ 
          status: 'success',
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId);

      if (updateTxError) {
        console.error("❌ Failed to update transaction status:", updateTxError);
      } else {
        console.log("✅ Transaction status updated to 'success'");
      }
    } else {
      // If no transaction ID from RPC, try to find and update the pending transaction
      const { data: pendingTx, error: findTxError } = await supabase
        .from("transactions")
        .select("id")
        .eq("reference", reference)
        .eq("user_id", user.id)
        .eq("status", "pending")
        .maybeSingle();

      if (pendingTx) {
        const { error: updateTxError } = await supabase
          .from("transactions")
          .update({ 
            status: 'success',
            updated_at: new Date().toISOString()
          })
          .eq('id', pendingTx.id);

        if (updateTxError) {
          console.error("❌ Failed to update transaction status:", updateTxError);
        } else {
          console.log("✅ Transaction status updated to 'success'");
        }
      } else {
        // No pending transaction found, create a new one
        console.log("📝 No pending transaction found, creating new one...");
        const { error: createTxError } = await supabase
          .from("transactions")
          .insert({
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

        if (createTxError) {
          console.error("❌ Failed to create transaction record:", createTxError);
        } else {
          console.log("✅ Transaction record created");
        }
      }
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
      console.error("❌ Activation update error:", updateError);
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

    console.log("✅ Store activated:", store.id);

    // Update wallet balance cache
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/user/wallet/balance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: user.id,
          forceBalance: userBalance - ACTIVATION_FEE_NAIRA 
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
    console.error("❌ Store activation error:", error);
    return NextResponse.json(
      { error: error.message || "Activation failed" },
      { status: 500 }
    );
  }
}