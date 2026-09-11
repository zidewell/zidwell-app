// app/api/store/activate/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticated } from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ACTIVATION_FEE_NAIRA = 200;
const baseUrl =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : process.env.NEXT_PUBLIC_BASE_URL || "https://zidwell.com";

function generateOrderReference(paymentId: string): string {
  const shortId = paymentId.slice(0, 8);
  const timestamp = Date.now().toString(36);
  return `ACT-${shortId}-${timestamp}`;
}

function cleanSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/\s/g, "-")
    .replace(/-+/g, "-");
}

function validateStoreData(storeData: any): string | null {
  const {
    name,
    slug,
    description,
    country,
    state,
    city,
    streetAddress,
  } = storeData || {};

  if (!name?.trim() || !slug?.trim() || !description?.trim()) {
    return "Name, slug and description are required";
  }
  if (
    !country?.trim() ||
    !state?.trim() ||
    !city?.trim() ||
    !streetAddress?.trim()
  ) {
    return "Complete location details are required";
  }
  if (cleanSlug(slug).length < 3) {
    return "Store URL must be at least 3 characters";
  }
  return null;
}

function buildStorePayload(storeData: any) {
  const {
    name,
    slug,
    description,
    keywords,
    cacNumber,
    country,
    state,
    city,
    streetAddress,
    locationEnabled,
    latitude,
    longitude,
    locationAccuracy,
  } = storeData;

  return {
    name: name.trim(),
    slug: cleanSlug(slug),
    description: description.trim(),
    keywords: keywords || [],
    cac_number: cacNumber?.trim() || null,
    country: country.trim(),
    state: state.trim(),
    city: city.trim(),
    street_address: streetAddress.trim(),
    location_enabled: locationEnabled !== false,
    latitude: typeof latitude === "number" ? latitude : null,
    longitude: typeof longitude === "number" ? longitude : null,
    location_accuracy:
      typeof locationAccuracy === "number" ? locationAccuracy : null,
  };
}

export async function POST(req: NextRequest) {
  const user = await isAuthenticated(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { storeData } = await req.json();

    // Get user
    const { data: dbUser, error: userErr } = await supabase
      .from("users")
      .select("id, email")
      .eq("id", user.id)
      .single();

    if (userErr || !dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get existing store (if any)
    let { data: store } = await supabase
      .from("online_stores")
      .select("*")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!store) {
      // ─── CREATE NEW STORE ───
      const validationError = validateStoreData(storeData);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }

      const payload = buildStorePayload(storeData);

      // Slug uniqueness
      const { data: slugTaken } = await supabase
        .from("online_stores")
        .select("id")
        .eq("slug", payload.slug)
        .maybeSingle();

      if (slugTaken) {
        return NextResponse.json(
          { error: "That store URL is taken. Please choose a different one." },
          { status: 409 }
        );
      }

      const { data: newStore, error: createError } = await supabase
        .from("online_stores")
        .insert({
          owner_id: user.id,
          ...payload,
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
        return NextResponse.json(
          { error: createError?.message || "Failed to create store" },
          { status: 500 }
        );
      }

      store = newStore;
    } else {
      // ─── UPDATE EXISTING (pending activation) STORE ───
      if (store.is_active && store.activation_paid) {
        return NextResponse.json(
          { error: "Store is already activated" },
          { status: 400 }
        );
      }

      if (storeData) {
        const validationError = validateStoreData(storeData);
        if (validationError) {
          return NextResponse.json(
            { error: validationError },
            { status: 400 }
          );
        }

        const payload = buildStorePayload(storeData);

        // Slug uniqueness — ignore this store's own row
        const { data: slugTaken } = await supabase
          .from("online_stores")
          .select("id")
          .eq("slug", payload.slug)
          .neq("id", store.id)
          .maybeSingle();

        if (slugTaken) {
          return NextResponse.json(
            {
              error:
                "That store URL is taken. Please choose a different one.",
            },
            { status: 409 }
          );
        }

        const { error: updateErr } = await supabase
          .from("online_stores")
          .update(payload)
          .eq("id", store.id);

        if (updateErr) {
          return NextResponse.json(
            { error: "Failed to update store details" },
            { status: 500 }
          );
        }
      }
    }

    // ─── CREATE PENDING PAYMENT ───
    const reference = `STORE_ACT_${Date.now()}_${user.id.slice(0, 8)}`;

    const { data: payment, error: paymentError } = await supabase
      .from("store_activation_payments")
      .insert({
        user_id: user.id,
        store_id: store.id,
        amount: ACTIVATION_FEE_NAIRA,
        status: "pending",
        reference,
        payment_method: "card",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (paymentError || !payment) {
      return NextResponse.json(
        { error: "Failed to initiate payment. Please try again." },
        { status: 500 }
      );
    }

    // NOTE: Draft is intentionally NOT deleted here.
    // It's cleared only after payment is confirmed successful.

    // ─── CREATE CHECKOUT ───
    const { getNombaToken } = await import("@/lib/nomba");
    const accessToken = await getNombaToken();

    if (!accessToken) {
      await supabase
        .from("store_activation_payments")
        .update({ status: "failed" })
        .eq("id", payment.id);

      return NextResponse.json(
        { error: "Payment service unavailable. Please try again later." },
        { status: 503 }
      );
    }

    const orderReference = generateOrderReference(payment.id);

    const checkoutPayload = {
      order: {
        callbackUrl: `${baseUrl}/api/store/activate/callback?payment_id=${payment.id}`,
        customerEmail: dbUser.email || "customer@example.com",
        amount: ACTIVATION_FEE_NAIRA.toString(),
        currency: "NGN",
        orderReference,
        customerId: user.id,
        accountId: process.env.NOMBA_ACCOUNT_ID,
        allowedPaymentMethods: ["Card", "Transfer"],
        metadata: {
          type: "store_activation",
          paymentId: payment.id,
          storeId: store.id,
          userId: user.id,
        },
      },
      tokenizeCard: false,
    };

    const response = await fetch(
      `${process.env.NOMBA_URL}/v1/checkout/order`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          accountId: process.env.NOMBA_ACCOUNT_ID!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkoutPayload),
      }
    );

    const data = await response.json();

    if (!response.ok || data.code !== "00") {
      await supabase
        .from("store_activation_payments")
        .update({ status: "failed" })
        .eq("id", payment.id);

      return NextResponse.json(
        {
          error:
            data.description || data.message || "Failed to create checkout",
        },
        { status: 500 }
      );
    }

    await supabase
      .from("store_activation_payments")
      .update({ order_reference: orderReference })
      .eq("id", payment.id);

    return NextResponse.json({
      success: true,
      requiresCheckout: true,
      checkoutUrl: data.data.checkoutLink,
      payment_id: payment.id,
      message: "Please complete payment to activate your store",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Activation failed" },
      { status: 500 }
    );
  }
}