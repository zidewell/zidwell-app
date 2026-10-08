// app/api/_lib/delivery-resolver.ts
import {
  calculateDeliveryFee,
  resolveFulfillmentMethod,
  validateCustomerAddress,
  CustomerDeliveryAddress,
  FulfillmentMethod,
} from "@/lib/delivery-utils";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export interface ResolvedFulfillment {
  method: FulfillmentMethod;
  fee: number;
  delivery: CustomerDeliveryAddress | null;
  pickup: { address: string | null; notes: string | null } | null;
}

export async function resolveFulfillmentForCheckout(params: {
  storeId: string | null | undefined;
  pageType?: string | null;
  productType?: string | null;
  chosenMethod?: FulfillmentMethod | null;
  deliveryAddress?: CustomerDeliveryAddress | null;
  cartSubtotal: number;
}): Promise<ResolvedFulfillment> {
  const {
    storeId,
    pageType,
    productType,
    chosenMethod,
    deliveryAddress,
    cartSubtotal,
  } = params;

  const supabase = getSupabaseAdmin() as any;

  // Non-physical pages → digital, no fulfillment required
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
      "id, local_pickup_enabled, local_pickup_address, local_pickup_notes, delivery_enabled, delivery_fee, delivery_free_threshold, delivery_notes",
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
    if (!store.local_pickup_address?.trim()) {
      throw new Error(
        "This store hasn't set up a pickup address yet. Contact the seller.",
      );
    }
    return {
      method,
      fee: 0,
      delivery: null,
      pickup: {
        address: store.local_pickup_address,
        notes: store.local_pickup_notes,
      },
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