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

export interface DeliveryAddress {
  id: string;
  store_id: string;
  label: string;
  contact_name: string;
  contact_phone: string;
  street_address: string;
  city: string;
  state: string;
  country: string;
  delivery_fee: number;
  estimated_days: number;
  is_default: boolean;
  is_active: boolean;
  notes: string | null;
}

export interface DeliverySettings {
  delivery_enabled: boolean;
  local_pickup_enabled: boolean;
  local_pickup_address: string | null;
  local_pickup_notes: string | null;
  delivery_notes: string | null;
}

export type FulfillmentMethod = "delivery" | "pickup" | "digital";

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
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  chosenMethod?: FulfillmentMethod | null;
}): FulfillmentMethod {
  const { pageType, productType, deliveryEnabled, pickupEnabled, chosenMethod } =
    params;

  if (!requiresDelivery(pageType, productType)) return "digital";

  if (chosenMethod === "pickup" && pickupEnabled) return "pickup";
  if (chosenMethod === "delivery" && deliveryEnabled) return "delivery";

  if (deliveryEnabled) return "delivery";
  if (pickupEnabled) return "pickup";

  return "delivery";
}

export function calculateDeliveryFee(params: {
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  method: FulfillmentMethod;
  address?: Pick<DeliveryAddress, "delivery_fee"> | null;
}): number {
  const { deliveryEnabled, method, address } = params;
  if (method === "digital") return 0;
  if (method === "pickup") return 0;
  if (!deliveryEnabled) return 0;
  if (!address) return 0;
  return Number(address.delivery_fee ?? 0);
}

export function snapshotAddress(addr: DeliveryAddress) {
  return {
    id: addr.id,
    label: addr.label,
    contact_name: addr.contact_name,
    contact_phone: addr.contact_phone,
    street_address: addr.street_address,
    city: addr.city,
    state: addr.state,
    country: addr.country,
    delivery_fee: addr.delivery_fee,
    estimated_days: addr.estimated_days,
  };
}

export function sortAddresses(addresses: DeliveryAddress[]): DeliveryAddress[] {
  return [...addresses].sort((a, b) => {
    if (a.is_default !== b.is_default) return a.is_default ? -1 : 1;
    return a.label.localeCompare(b.label);
  });
}