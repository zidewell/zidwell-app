// app/lib/delivery-email-block.ts

export interface FulfillmentEmailInput {
  method: "delivery" | "pickup" | "digital" | null | undefined;
  delivery?: {
    full_name?: string | null;
    phone?: string | null;
    street_address?: string | null;
    city?: string | null;
    state?: string | null;
    notes?: string | null;
  } | null;
  pickup?: {
    address?: string | null;
    notes?: string | null;
  } | null;
  fee?: number | null;
}

const s = (v: any) => (v === null || v === undefined ? "" : String(v));

export function renderFulfillmentBlock(
  d: FulfillmentEmailInput | null | undefined,
): string {
  if (!d || !d.method || d.method === "digital") return "";

  if (d.method === "pickup") {
    const addr = s(d.pickup?.address);
    const notes = s(d.pickup?.notes);
    if (!addr && !notes) return "";
    return `
      <div style="margin: 24px 0; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc;">
        <p style="margin: 0 0 8px; font-weight: 600; font-size: 14px;">Pickup details</p>
        ${addr ? `<p style="margin: 0 0 4px; font-size: 14px;"><strong>Pick up at:</strong> ${addr}</p>` : ""}
        ${notes ? `<p style="margin: 8px 0 0; color: #666; font-size: 13px;">${notes}</p>` : ""}
      </div>
    `;
  }

  if (d.method === "delivery") {
    const a = d.delivery;
    if (!a) return "";
    const fee = Number(d.fee ?? 0);
    return `
      <div style="margin: 24px 0; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc;">
        <p style="margin: 0 0 8px; font-weight: 600; font-size: 14px;">Delivery details</p>
        <p style="margin: 0 0 4px; font-size: 14px;"><strong>${s(a.full_name)}</strong> — ${s(a.phone)}</p>
        <p style="margin: 0 0 4px; font-size: 14px;">${s(a.street_address)}, ${s(a.city)}, ${s(a.state)}</p>
        ${a.notes ? `<p style="margin: 4px 0 0; font-size: 13px; color: #666;">Notes: ${s(a.notes)}</p>` : ""}
        ${fee > 0 ? `<p style="margin: 8px 0 0; color: #666; font-size: 13px;">Delivery fee: ₦${fee.toLocaleString()}</p>` : ""}
      </div>
    `;
  }

  return "";
}

export function fulfillmentFromPayment(payment: any, store?: any) {
  return {
    method: payment?.fulfillment_method ?? null,
    delivery: payment?.delivery_address_snapshot ?? null,
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