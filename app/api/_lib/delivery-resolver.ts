// app/api/_lib/delivery-resolver.ts
import {
  calculateDeliveryFee,
  resolveFulfillmentMethod,
  snapshotAddress,
  FulfillmentMethod,
  DeliveryAddress,
} from "@/lib/delivery-utils";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export interface ResolvedDelivery {
  method: FulfillmentMethod;
  fee: number;
  address: DeliveryAddress | null;
  snapshot: ReturnType<typeof snapshotAddress> | null;
  pickup: { address: string | null; notes: string | null } | null;
}

export async function resolveDeliveryForCheckout(params: {
  storeId: string | null | undefined;
  pageType?: string | null;
  productType?: string | null;
  deliveryAddressId?: string | null;
  chosenMethod?: FulfillmentMethod | null;
}): Promise<ResolvedDelivery> {
  const { storeId, pageType, productType, deliveryAddressId, chosenMethod } =
    params;

  // Cast to `any` to avoid deep inference errors on the generated DB types
  const supabase = getSupabaseAdmin() as any;

  // ─── Guard: no store id at all → not a physical product ───
  if (!storeId) {
    // If the page doesn't require delivery anyway, this is fine.
    // Digital / service / school / donation pages can legitimately have no store.
    const method = resolveFulfillmentMethod({
      pageType,
      productType,
      deliveryEnabled: false,
      pickupEnabled: false,
      chosenMethod: null,
    });

    if (method === "digital") {
      return { method, fee: 0, address: null, snapshot: null, pickup: null };
    }

    throw new Error(
      "Delivery resolution failed: this product is not linked to a store. Contact the seller.",
    );
  }

  // ─── Load the store ───
  const { data: store, error } = await supabase
    .from("online_stores")
    .select(
      "id, delivery_enabled, local_pickup_enabled, local_pickup_address, local_pickup_notes",
    )
    .eq("id", storeId)
    .maybeSingle();

  if (error) {
    console.error("[delivery-resolver] Supabase error:", error);
    throw new Error(
      `Delivery resolution failed: ${error.message || "database error"}`,
    );
  }

  if (!store) {
    throw new Error(
      `Delivery resolution failed: store ${storeId} does not exist. Contact the seller.`,
    );
  }

  const method = resolveFulfillmentMethod({
    pageType,
    productType,
    deliveryEnabled: !!store.delivery_enabled,
    pickupEnabled: !!store.local_pickup_enabled,
    chosenMethod,
  });

  // ─── Digital page: no delivery needed ───
  if (method === "digital") {
    return { method, fee: 0, address: null, snapshot: null, pickup: null };
  }

  // ─── Pickup ───
  if (method === "pickup") {
    if (!store.local_pickup_enabled) {
      throw new Error("Pickup is not enabled for this store");
    }
    return {
      method,
      fee: 0,
      address: null,
      snapshot: null,
      pickup: {
        address: store.local_pickup_address,
        notes: store.local_pickup_notes,
      },
    };
  }

  // ─── Delivery ───
  if (!store.delivery_enabled) {
    throw new Error(
      "Delivery is not enabled for this store. Enable it in Store Settings → Delivery.",
    );
  }

  let addressId = deliveryAddressId;

  if (!addressId) {
    const { data: defaultAddr } = await supabase
      .from("store_delivery_addresses")
      .select("id")
      .eq("store_id", storeId)
      .eq("is_active", true)
      .eq("is_default", true)
      .maybeSingle();
    addressId = defaultAddr?.id ?? null;
  }

  // If no default, fall back to the first active address
  if (!addressId) {
    const { data: firstActive } = await supabase
      .from("store_delivery_addresses")
      .select("id")
      .eq("store_id", storeId)
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    addressId = firstActive?.id ?? null;
  }

  if (!addressId) {
    throw new Error(
      "No delivery address is configured for this store. Add one in Store Settings → Delivery.",
    );
  }

  const { data: address, error: addrErr } = await supabase
    .from("store_delivery_addresses")
    .select("*")
    .eq("id", addressId)
    .eq("store_id", storeId)
    .eq("is_active", true)
    .maybeSingle();

  if (addrErr || !address) {
    throw new Error(
      "The selected delivery address is no longer available. Please pick another.",
    );
  }

  const fee = calculateDeliveryFee({
    deliveryEnabled: !!store.delivery_enabled,
    pickupEnabled: !!store.local_pickup_enabled,
    method: "delivery",
    address,
  });

  return {
    method: "delivery",
    fee,
    address,
    snapshot: snapshotAddress(address),
    pickup: null,
  };
}