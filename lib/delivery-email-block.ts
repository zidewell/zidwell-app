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
    const a = d.snapshot ?? {};
    if (!a.full_name && !a.street_address) return "";
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

export function fulfillmentFromPayment(payment: any) {
  return {
    method: payment?.fulfillment_method ?? null,
    snapshot: payment?.delivery_address_snapshot ?? null,
    fee: payment?.delivery_fee ?? 0,
  };
}