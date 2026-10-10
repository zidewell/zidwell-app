// app/api/_lib/delivery-resolver.ts
import {
  calculateDeliveryFee,
  resolveFulfillmentMethod,
  validateCustomerAddress,
  snapshotPickupLocation,
  CustomerDeliveryAddress,
  PickupLocation,
  PickupLocationSnapshot,
  FulfillmentMethod,
} from "@/lib/delivery-utils";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export interface ResolvedFulfillment {
  method: FulfillmentMethod;
  fee: number;
  delivery: CustomerDeliveryAddress | null;
  pickup: PickupLocationSnapshot | null;
}

export async function resolveFulfillmentForCheckout(params: {
  storeId: string | null | undefined;
  pageType?: string | null;
  productType?: string | null;
  chosenMethod?: FulfillmentMethod | null;
  deliveryAddress?: CustomerDeliveryAddress | null;
  pickupLocationId?: string | null;
  cartSubtotal: number;
}): Promise<ResolvedFulfillment> {
  const {
    storeId,
    pageType,
    productType,
    chosenMethod,
    deliveryAddress,
    pickupLocationId,
    cartSubtotal,
  } = params;

  const supabase = getSupabaseAdmin() as any;

  if (!storeId) {
    const method = resolveFulfillmentMethod({
      pageType,
      productType,
      pickupEnabled: false,
      deliveryEnabled: false,
      chosenMethod: null,
    });
    if (method === "digital") {
      return { method, fee: 0, delivery: null, pickup: null };
    }
    throw new Error(
      "This product is not linked to a store. Please contact the seller.",
    );
  }

  const { data: store, error } = await supabase
    .from("online_stores")
    .select(
      "id, local_pickup_enabled, delivery_enabled, delivery_fee, delivery_free_threshold, delivery_notes",
    )
    .eq("id", storeId)
    .maybeSingle();

  if (error) {
    console.error("[fulfillment-resolver] Supabase error:", error);
    throw new Error(`Fulfillment lookup failed: ${error.message}`);
  }
  if (!store) {
    throw new Error(`Store ${storeId} does not exist. Contact the seller.`);
  }

  const method = resolveFulfillmentMethod({
    pageType,
    productType,
    pickupEnabled: !!store.local_pickup_enabled,
    deliveryEnabled: !!store.delivery_enabled,
    chosenMethod,
  });

  if (method === "digital") {
    return { method, fee: 0, delivery: null, pickup: null };
  }

  if (method === "pickup") {
    if (!store.local_pickup_enabled) {
      throw new Error("Pickup is not enabled for this store");
    }

    let location: PickupLocation | null = null;

    if (pickupLocationId) {
      const { data: loc } = await supabase
        .from("store_pickup_locations")
        .select("*")
        .eq("id", pickupLocationId)
        .eq("store_id", storeId)
        .eq("is_active", true)
        .maybeSingle();
      location = loc ?? null;
    }

    if (!location) {
      // Fall back to default, then first active
      const { data: def } = await supabase
        .from("store_pickup_locations")
        .select("*")
        .eq("store_id", storeId)
        .eq("is_active", true)
        .eq("is_default", true)
        .maybeSingle();

      if (def) location = def;
      else {
        const { data: first } = await supabase
          .from("store_pickup_locations")
          .select("*")
          .eq("store_id", storeId)
          .eq("is_active", true)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();
        location = first ?? null;
      }
    }

    if (!location) {
      throw new Error(
        "This store hasn't set up any pickup locations yet. Contact the seller.",
      );
    }

    return {
      method: "pickup",
      fee: 0,
      delivery: null,
      pickup: snapshotPickupLocation(location),
    };
  }

  // method === "delivery"
  if (!store.delivery_enabled) {
    throw new Error("Delivery is not enabled for this store");
  }

  const validation = validateCustomerAddress(deliveryAddress);
  if (!validation.valid) {
    throw new Error(
      `Delivery address is incomplete (missing: ${validation.missing.join(", ")})`,
    );
  }

  const fee = calculateDeliveryFee({
    deliveryEnabled: true,
    method: "delivery",
    baseFee: Number(store.delivery_fee) || 0,
    freeThreshold: Number(store.delivery_free_threshold) || 0,
    cartSubtotal: Number(cartSubtotal) || 0,
  });

  return {
    method: "delivery",
    fee,
    delivery: deliveryAddress!,
    pickup: null,
  };
}