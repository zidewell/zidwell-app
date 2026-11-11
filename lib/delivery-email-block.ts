// app/lib/delivery-email-block.ts

export interface FulfillmentEmailInput {
  method: "delivery" | "pickup" | "digital" | null | undefined;
  snapshot?: any | null;
  fee?: number | null;
}

const s = (v: any) => (v === null || v === undefined ? "" : String(v));

export function renderFulfillmentBlock(
  d: FulfillmentEmailInput | null | undefined,
): string {
  if (!d || !d.method || d.method === "digital") return "";

  if (d.method === "pickup") {
    const p = d.snapshot ?? {};
    if (!p.label && !p.address) return "";
    return `
      <div style="margin: 24px 0; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc;">
        <p style="margin: 0 0 8px; font-weight: 600; font-size: 14px;">Pickup details</p>
        ${p.label ? `<p style="margin: 0 0 4px; font-size: 14px;"><strong>${s(p.label)}</strong></p>` : ""}
        ${p.address ? `<p style="margin: 0 0 4px; font-size: 14px;">${s(p.address)}</p>` : ""}
        ${p.notes ? `<p style="margin: 4px 0 0; font-size: 13px; color: #666;">${s(p.notes)}</p>` : ""}
        ${p.phone ? `<p style="margin: 4px 0 0; font-size: 13px; color: #666;">📞 ${s(p.phone)}</p>` : ""}
      </div>
    `;
  }

  if (d.method === "delivery") {
    // Snapshot may be { zone, customer } (new) or a flat customer address (legacy)
    const snap = d.snapshot ?? {};
    const zone = snap.zone ?? null;
    const customer = snap.customer ?? snap;

    if (!customer?.full_name && !customer?.street_address) return "";
    const fee = Number(d.fee ?? zone?.fee ?? 0);

    return `
      <div style="margin: 24px 0; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc;">
        <p style="margin: 0 0 8px; font-weight: 600; font-size: 14px;">Delivery details</p>
        ${
          zone
            ? `<p style="margin: 0 0 6px; font-size: 13px; color: #666;"><strong>Zone:</strong> ${s(zone.label)}</p>`
            : ""
        }
        <p style="margin: 0 0 4px; font-size: 14px;"><strong>${s(customer.full_name)}</strong> — ${s(customer.phone)}</p>
        <p style="margin: 0 0 4px; font-size: 14px;">${s(customer.street_address)}, ${s(customer.city)}, ${s(customer.state)}</p>
        ${customer.notes ? `<p style="margin: 4px 0 0; font-size: 13px; color: #666;">Notes: ${s(customer.notes)}</p>` : ""}
        ${fee > 0 ? `<p style="margin: 8px 0 0; color: #666; font-size: 13px;">Delivery fee: ₦${fee.toLocaleString()}</p>` : ""}
      </div>
    `;
  }

  return "";
}

export function fulfillmentFromPayment(payment: any) {
  return {
    method: payment?.fulfillment_method ?? null,
    snapshot: payment?.delivery_address_snapshot ?? null,
    fee: payment?.delivery_fee ?? 0,
  };
}