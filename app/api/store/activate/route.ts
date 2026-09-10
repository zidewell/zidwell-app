// app/api/store/activate/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticated } from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ACTIVATION_FEE_NAIRA = 200;
const baseUrl = process.env.NODE_ENV === "development"
  ? "http://localhost:3000"
  : process.env.NEXT_PUBLIC_BASE_URL || "https://zidwell.com";

export async function POST(req: NextRequest) {
  const user = await isAuthenticated(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { storeData, paymentMethod } = body;

    console.log("📦 Activation request:", {
      hasStoreData: !!storeData,
      userId: user.id,
      paymentMethod: paymentMethod || "wallet",
    });

    // Get user
    const { data: dbUser, error: userErr } = await supabase
      .from("users")
      .select("id, email, bvn_verification")
      .eq("id", user.id)
      .single();

    if (userErr || !dbUser) {
      console.error("❌ User not found:", userErr);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("✅ User found:", dbUser.id);

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

      if (store.is_active && store.activation_paid) {
        return NextResponse.json(
          { error: "Store is already activated" },
          { status: 400 }
        );
      }
    }

    // ============================================================
    // ✅ PROCESS PAYMENT - CHECKOUT ONLY
    // ============================================================
    console.log("💳 Processing checkout payment for activation...");

    const reference = `STORE_ACT_${Date.now()}_${user.id}`;

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from("store_activation_payments")
      .insert({
        user_id: user.id,
        store_id: store.id,
        amount: ACTIVATION_FEE_NAIRA,
        status: "pending",
        reference: reference,
        payment_method: "card",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (paymentError) {
      console.error("❌ Failed to create payment record:", paymentError);
      return NextResponse.json(
        { error: "Failed to initiate payment. Please try again." },
        { status: 500 }
      );
    }

    console.log("✅ Payment record created:", payment.id);

    // ============================================================
    // ✅ CREATE CHECKOUT
    // ============================================================
    try {
      const { getNombaToken } = await import("@/lib/nomba");
      const accessToken = await getNombaToken();

      if (!accessToken) {
        console.error("❌ Failed to get Nomba token");
        await supabase
          .from("store_activation_payments")
          .update({ status: "failed" })
          .eq("id", payment.id);

        return NextResponse.json(
          { error: "Payment service unavailable. Please try again later." },
          { status: 503 }
        );
      }

      const orderReference = `ACT-${payment.id}-${Date.now()}`;

      // Get user email
      const userEmail = dbUser.email || "customer@example.com";

      // Create checkout payload
      const checkoutPayload = {
        order: {
          callbackUrl: `${baseUrl}/api/store/activate/callback?payment_id=${payment.id}`,
          customerEmail: userEmail,
          amount: ACTIVATION_FEE_NAIRA.toString(),
          currency: "NGN",
          orderReference: orderReference,
          customerId: user.id,
          accountId: process.env.NOMBA_ACCOUNT_ID,
          allowedPaymentMethods: ["Card"],
          metadata: {
            type: "store_activation",
            paymentId: payment.id,
            storeId: store.id,
            userId: user.id,
          },
        },
        tokenizeCard: false,
      };

      const response = await fetch(`${process.env.NOMBA_URL}/v1/checkout/order`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          accountId: process.env.NOMBA_ACCOUNT_ID!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkoutPayload),
      });

      const data = await response.json();

      if (!response.ok || data.code !== "00") {
        console.error("❌ Checkout creation failed:", data);
        await supabase
          .from("store_activation_payments")
          .update({ status: "failed" })
          .eq("id", payment.id);

        return NextResponse.json(
          { error: data.description || "Failed to create checkout" },
          { status: 500 }
        );
      }

      // Update payment with order reference
      await supabase
        .from("store_activation_payments")
        .update({ order_reference: orderReference })
        .eq("id", payment.id);

      console.log("✅ Checkout created successfully");

      // Return checkout URL
      return NextResponse.json({
        success: true,
        requiresCheckout: true,
        checkoutUrl: data.data.checkoutLink,
        payment_id: payment.id,
        message: "Please complete payment to activate your store",
      });
    } catch (checkoutError: any) {
      console.error("❌ Checkout error:", checkoutError);
      await supabase
        .from("store_activation_payments")
        .update({ status: "failed" })
        .eq("id", payment.id);

      return NextResponse.json(
        { error: checkoutError.message || "Failed to create checkout" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("❌ Store activation error:", error);
    return NextResponse.json(
      { error: error.message || "Activation failed" },
      { status: 500 }
    );
  }
}