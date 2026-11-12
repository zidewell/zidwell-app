// app/api/store/activate/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  isAuthenticatedWithRefresh,
  createAuthResponse,
} from "@/lib/auth-check-api";
import { STORE_ACTIVATION_CONFIG } from "@/lib/store-activation";
import { paystackInitialize } from "@/lib/paystack";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ZIDWELL_PAYSTACK_SECRET_KEY = process.env.ZIDWELL_PAYSTACK_SECRET_KEY;

if (!ZIDWELL_PAYSTACK_SECRET_KEY) {
  console.error("[store-activate] FATAL: ZIDWELL_PAYSTACK_SECRET_KEY is not set");
}

const baseUrl =
  process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_DEV_URL || "http://localhost:3000"
    : process.env.NEXT_PUBLIC_BASE_URL || "https://zidwell.com";

function cleanSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/\s/g, "-")
    .replace(/-+/g, "-");
}

function normalizeWhatsapp(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const digits = input.trim().replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return null;
  return digits;
}

function validateStoreData(storeData: any): string | null {
  const { name, slug, description, country, state, city, streetAddress } =
    storeData || {};

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
    whatsappNumber,
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
    whatsapp_number: normalizeWhatsapp(whatsappNumber),
  };
}

export async function POST(req: NextRequest) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req);

  if (!user) {
    const unauthorized = NextResponse.json(
      { error: "Please login to activate store", logout: true },
      { status: 401 }
    );
    if (newTokens)
      return createAuthResponse(await unauthorized.json(), newTokens);
    return unauthorized;
  }

  try {
    if (!ZIDWELL_PAYSTACK_SECRET_KEY) {
      const err = NextResponse.json(
        { error: "Payment service not configured. Please contact support." },
        { status: 500 }
      );
      if (newTokens) return createAuthResponse(await err.json(), newTokens);
      return err;
    }

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

    if (!dbUser.email) {
      return NextResponse.json(
        { error: "Email is required for activation" },
        { status: 400 }
      );
    }

    // Get existing store (if any)
    let { data: store } = await supabase
      .from("online_stores")
      .select("*")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!store) {
      const validationError = validateStoreData(storeData);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }

      const payload = buildStorePayload(storeData);

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

        const { data: slugTaken } = await supabase
          .from("online_stores")
          .select("id")
          .eq("slug", payload.slug)
          .neq("id", store.id)
          .maybeSingle();

        if (slugTaken) {
          return NextResponse.json(
            { error: "That store URL is taken. Please choose a different one." },
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

    // ─── CHECK FOR ACTIVE PROMO ───
    let activePromo: any = null;
    let activationFee = STORE_ACTIVATION_CONFIG.ORIGINAL_FEE;

    const { data: promoData } = await supabase
      .from("store_activation_promos")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (promoData) {
      const now = new Date();
      const expiresAt = new Date(promoData.expires_at);
      if (expiresAt > now) {
        activePromo = promoData;
        activationFee = STORE_ACTIVATION_CONFIG.PROMO_FEE;
        if (promoData.discounted_fee !== STORE_ACTIVATION_CONFIG.PROMO_FEE) {
          await supabase
            .from("store_activation_promos")
            .update({
              discounted_fee: STORE_ACTIVATION_CONFIG.PROMO_FEE,
              updated_at: now.toISOString(),
            })
            .eq("id", promoData.id);
        }
      } else {
        await supabase
          .from("store_activation_promos")
          .update({ status: "expired", updated_at: now.toISOString() })
          .eq("id", promoData.id);
      }
    }

    // ─── CREATE PENDING PAYMENT ───
    const reference = `ZA-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 7)}`;

    const { data: payment, error: paymentError } = await supabase
      .from("store_activation_payments")
      .insert({
        user_id: user.id,
        store_id: store.id,
        amount: activationFee,
        reference,
        status: "pending",
        payment_method: "paystack",
        order_reference: reference,
        promo_id: activePromo?.id ?? null,
      })
      .select()
      .single();

    if (paymentError || !payment) {
      console.error("[activate] insert failed:", paymentError);
      return NextResponse.json(
        { error: "Failed to initiate payment. Please try again." },
        { status: 500 }
      );
    }

    // ─── INITIALIZE PAYSTACK ───
    try {
      const paystack = await paystackInitialize({
        email: dbUser.email,
        amountNaira: activationFee,
        reference,
        callbackUrl: `${baseUrl}/dashboard/store/activation?status=success`,
       channels: ["card", "bank_transfer"], 
        metadata: {
          type: "store_activation",
          user_id: user.id,
          store_id: store.id,
          payment_id: payment.id,
          ...(activePromo && {
            promo_id: activePromo.id,
            promo_code: activePromo.promo_code,
          }),
        },
      });

      const responseData = {
        success: true,
        reference,
        authorization_url: paystack.authorization_url,
        access_code: paystack.access_code,
      };

      if (newTokens) return createAuthResponse(responseData, newTokens);
      return NextResponse.json(responseData);
    } catch (paystackErr: any) {
      console.error("[activation checkout] paystack error:", paystackErr);

      await supabase
        .from("store_activation_payments")
        .update({ status: "failed" })
        .eq("reference", reference);

      const err = NextResponse.json(
        { error: paystackErr.message || "Paystack initialization failed" },
        { status: 502 }
      );
      if (newTokens) return createAuthResponse(await err.json(), newTokens);
      return err;
    }
  } catch (error: any) {
    console.error("[activate] unhandled:", error);
    return NextResponse.json(
      { error: error.message || "Activation failed" },
      { status: 500 }
    );
  }
}
