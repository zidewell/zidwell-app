// lib/delivery-email-block.ts

export interface DeliveryBlockInput {
  method: "delivery" | "pickup" | "digital" | null | undefined;
  address?: {
    label?: string | null;
    contact_name?: string | null;
    contact_phone?: string | null;
    street_address?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    delivery_fee?: number | null;
    estimated_days?: number | null;
  } | null;
  pickup?: {
    address?: string | null;
    notes?: string | null;
  } | null;
  fee?: number | null;
}

const s = (v: any) => (v === null || v === undefined ? "" : String(v));

/**
 * Render the delivery block for ANY email (receipt, completion, merchant notification).
 * Returns "" for digital / missing / invalid — never emits "undefined" or empty rows.
 */
export function renderDeliveryBlock(
  d: DeliveryBlockInput | null | undefined,
): string {
  if (!d || !d.method || d.method === "digital") return "";

  if (d.method === "pickup") {
    const addr = s(d.pickup?.address);
    const notes = s(d.pickup?.notes);
    if (!addr && !notes) return "";
    return `
      <div style="margin: 24px 0; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc;">
        <p style="margin: 0 0 8px; font-weight: 600;">Pickup details</p>
        ${addr ? `<p style="margin: 0 0 4px;">Pickup at: <strong>${addr}</strong></p>` : ""}
        ${notes ? `<p style="margin: 0; color: #666; font-size: 13px;">${notes}</p>` : ""}
      </div>
    `;
  }

  if (d.method === "delivery") {
    const a = d.address;
    if (!a) return "";
    const fee = Number(d.fee ?? a.delivery_fee ?? 0);
    return `
      <div style="margin: 24px 0; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc;">
        <p style="margin: 0 0 8px; font-weight: 600;">Delivery details</p>
        <p style="margin: 0 0 4px;"><strong>${s(a.label)}</strong></p>
        <p style="margin: 0 0 4px;">${s(a.contact_name)} — ${s(a.contact_phone)}</p>
        <p style="margin: 0 0 4px;">${s(a.street_address)}, ${s(a.city)}, ${s(a.state)}</p>
        <p style="margin: 8px 0 0; color: #666; font-size: 13px;">
          Estimated delivery: ~${Number(a.estimated_days ?? 0)} day(s) &nbsp;•&nbsp; Fee: ₦${fee.toLocaleString()}
        </p>
      </div>
    `;
  }

  return "";
}

/**
 * Build a DeliveryBlockInput from a payment_page_payments row.
 * If the payment's fulfillment method is "pickup", pass the store to hydrate pickup details.
 */
export function deliveryFromPayment(payment: any, store?: any) {
  return {
    method: payment?.fulfillment_method ?? null,
    address: payment?.delivery_address_snapshot ?? null,
    pickup:
      payment?.fulfillment_method === "pickup" && store
        ? {
            address: store.local_pickup_address ?? null,
            notes: store.local_pickup_notes ?? null,
          }
        : null,
    fee: payment?.delivery_fee ?? 0,
  };
}