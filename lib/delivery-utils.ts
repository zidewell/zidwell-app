// app/lib/delivery-utils.ts

export type PageType =
  | "physical"
  | "digital"
  | "service"
  | "donation"
  | "school"
  | "investment"
  | "subscription"
  | "event"
  | "other";

export type FulfillmentMethod = "delivery" | "pickup" | "digital";

export interface CustomerDeliveryAddress {
  full_name: string;
  phone: string;
  street_address: string;
  city: string;
  state: string;
  notes?: string | null;
}

export interface PickupLocation {
  id: string;
  store_id: string;
  label: string;
  address: string;
  notes: string | null;
  phone: string | null;
  is_default: boolean;
  is_active: boolean;
}

export interface PickupLocationSnapshot {
  id: string;
  label: string;
  address: string;
  notes: string | null;
  phone: string | null;
}

export interface FulfillmentSelection {
  // ✅ null = no method chosen yet
  method: "delivery" | "pickup" | null;
  address: CustomerDeliveryAddress | null;
  pickup: PickupLocationSnapshot | null;
  fee: number;
}

export function requiresDelivery(
  pageType?: PageType | string | null,
  productType?: PageType | string | null,
): boolean {
  const t = (productType || pageType || "").toLowerCase();
  if (!t) return false;
  return t === "physical";
}

export function resolveFulfillmentMethod(params: {
  pageType?: string | null;
  productType?: string | null;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  chosenMethod?: FulfillmentMethod | null;
}): FulfillmentMethod {
  const { pageType, productType, pickupEnabled, deliveryEnabled, chosenMethod } =
    params;

  if (!requiresDelivery(pageType, productType)) return "digital";

  if (chosenMethod === "pickup" && pickupEnabled) return "pickup";
  if (chosenMethod === "delivery" && deliveryEnabled) return "delivery";

  if (pickupEnabled) return "pickup";
  if (deliveryEnabled) return "delivery";

  return "delivery";
}

export function calculateDeliveryFee(params: {
  deliveryEnabled: boolean;
  method: FulfillmentMethod;
  baseFee: number;
  freeThreshold: number;
  cartSubtotal: number;
}): number {
  const { deliveryEnabled, method, baseFee, freeThreshold, cartSubtotal } =
    params;

  if (method !== "delivery") return 0;
  if (!deliveryEnabled) return 0;

  const fee = Number(baseFee) || 0;
  const threshold = Number(freeThreshold) || 0;

  if (threshold > 0 && cartSubtotal >= threshold) return 0;
  return fee;
}

export function validateCustomerAddress(
  addr: CustomerDeliveryAddress | null | undefined,
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!addr) {
    return {
      valid: false,
      missing: ["full_name", "phone", "street_address", "city", "state"],
    };
  }
  if (!addr.full_name?.trim()) missing.push("full_name");
  if (!addr.phone?.trim()) missing.push("phone");
  if (!addr.street_address?.trim()) missing.push("street_address");
  if (!addr.city?.trim()) missing.push("city");
  if (!addr.state?.trim()) missing.push("state");
  return { valid: missing.length === 0, missing };
}

export function snapshotPickupLocation(
  loc: PickupLocation,
): PickupLocationSnapshot {
  return {
    id: loc.id,
    label: loc.label,
    address: loc.address,
    notes: loc.notes,
    phone: loc.phone,
  };
}

export function sortPickupLocations(
  locations: PickupLocation[],
): PickupLocation[] {
  return [...locations].sort((a, b) => {
    if (a.is_default !== b.is_default) return a.is_default ? -1 : 1;
    return a.label.localeCompare(b.label);
  });
}