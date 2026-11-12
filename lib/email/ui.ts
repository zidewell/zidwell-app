// lib/email/ui.ts
// Email-safe HTML primitives. Table layout, inline styles, Outlook fallbacks.
// Brand: gold #F5B800 · green #008A3D · ink #171717 · surface #F8F8F7 · border #E5E5E3

const BASE_URL =
  process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_DEV_URL || "http://localhost:3000"
    : process.env.NEXT_PUBLIC_BASE_URL || "https://zidwell.com";

export const EMAIL_BRAND = {
  gold: "#F5B800",
  goldDark: "#DFA900",
  green: "#008A3D",
  greenDark: "#006B2F",
  ink: "#171717",
  inkSoft: "#262624",
  surface: "#F8F8F7",
  surface2: "#F1F1EF",
  border: "#E5E5E3",
  muted: "#666663",
  white: "#FFFFFF",
  red: "#DC2626",
  redSoft: "#F87171",
} as const;

const FONT =
  "Arial, Helvetica, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif";

// ─── HTML escape ──────────────────────────────────────────
export function esc(s: unknown): string {
  if (s === null || s === undefined) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ─── Currency ─────────────────────────────────────────────
export function naira(v: number | string | null | undefined): string {
  const n = Number(v) || 0;
  return `₦${n.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ─── Date ─────────────────────────────────────────────────
export function niceDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return String(d);
  return date.toLocaleString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  });
}

// ─── Full email wrapper ───────────────────────────────────
// Every email body goes inside this.
export function emailShell(opts: {
  title: string;
  preheader: string;
  content: string;    // inner HTML for the body card
  footerNote?: string;
}): string {
  const { title, preheader, content, footerNote } = opts;
  const headerImg = `${BASE_URL}/zidwell-header.png`;
  const footerImg = `${BASE_URL}/zidwell-footer.png`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<title>${esc(title)}</title>
</head>
<body style="margin:0; padding:0; background-color:${EMAIL_BRAND.surface};">
  <!-- Preheader -->
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">
    ${esc(preheader)}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    bgcolor="${EMAIL_BRAND.surface}" style="background-color:${EMAIL_BRAND.surface};">
    <tr>
      <td align="center" style="padding:24px 12px;">

        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
          bgcolor="${EMAIL_BRAND.white}"
          style="width:100%; max-width:600px; background-color:${EMAIL_BRAND.white};
          border-radius:12px; overflow:hidden; border:1px solid ${EMAIL_BRAND.border};">

          <!-- Header -->
          <tr>
            <td align="center" style="padding:0;">
              <img src="${headerImg}" alt="Zidwell" width="600"
                style="display:block; width:100%; max-width:600px; height:auto; border:0; outline:none; text-decoration:none;" />
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 32px 24px 32px; font-family:${FONT}; color:${EMAIL_BRAND.ink};">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:0;">
              <img src="${footerImg}" alt="Zidwell" width="600"
                style="display:block; width:100%; max-width:600px; height:auto; border:0;" />
            </td>
          </tr>
        </table>

        <!-- Legal -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
          style="width:100%; max-width:600px;">
          <tr>
            <td align="center"
              style="padding:20px 16px 0 16px; font-family:${FONT}; font-size:12px;
              line-height:1.5; color:${EMAIL_BRAND.muted};">
              ${
                footerNote ||
                `&copy; ${new Date().getFullYear()} Zidwell Ltd. All rights reserved.<br />
                <a href="mailto:support@zidwell.com" style="color:${EMAIL_BRAND.muted}; text-decoration:underline;">Contact support</a>
                &nbsp;·&nbsp;
                <a href="${BASE_URL}" style="color:${EMAIL_BRAND.muted}; text-decoration:underline;">zidwell.com</a>`
              }
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Content primitives ───────────────────────────────────
export const ui = {
  h1: (s: string) =>
    `<h1 style="margin:0 0 12px 0; font-size:22px; line-height:1.3; font-weight:700; color:${EMAIL_BRAND.ink}; font-family:${FONT};">${s}</h1>`,

  h2: (s: string) =>
    `<h2 style="margin:0 0 10px 0; font-size:18px; line-height:1.35; font-weight:700; color:${EMAIL_BRAND.ink}; font-family:${FONT};">${s}</h2>`,

  h3: (s: string) =>
    `<h3 style="margin:0 0 8px 0; font-size:15px; line-height:1.4; font-weight:700; color:${EMAIL_BRAND.ink}; font-family:${FONT};">${s}</h3>`,

  p: (s: string) =>
    `<p style="margin:0 0 14px 0; font-size:15px; line-height:1.6; color:${EMAIL_BRAND.ink}; font-family:${FONT};">${s}</p>`,

  muted: (s: string) =>
    `<p style="margin:0 0 14px 0; font-size:13px; line-height:1.6; color:${EMAIL_BRAND.muted}; font-family:${FONT};">${s}</p>`,

  // Bullet list
  ul: (items: string[]) =>
    `<ul style="margin:0 0 14px 0; padding-left:20px; font-size:15px; line-height:1.7; color:${EMAIL_BRAND.ink}; font-family:${FONT};">
      ${items.map((i) => `<li style="margin-bottom:6px;">${i}</li>`).join("")}
    </ul>`,

  divider: () =>
    `<div style="height:1px; background:${EMAIL_BRAND.border}; margin:20px 0;"></div>`,

  // Key-value rows inside a subtle card
  kvCard: (rows: Array<{ label: string; value: string; bold?: boolean; color?: string }>) =>
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      bgcolor="${EMAIL_BRAND.surface}"
      style="background-color:${EMAIL_BRAND.surface}; border:1px solid ${EMAIL_BRAND.border};
      border-radius:8px; margin:16px 0;">
      <tr>
        <td style="padding:16px 20px; font-family:${FONT}; font-size:14px; line-height:1.7; color:${EMAIL_BRAND.ink};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            ${rows
              .map(
                (r) => `
              <tr>
                <td style="padding:4px 0; color:${EMAIL_BRAND.muted};">${esc(r.label)}</td>
                <td align="right"
                  style="padding:4px 0; font-weight:${r.bold ? "700" : "500"};
                  color:${r.color || EMAIL_BRAND.ink}; text-align:right;">
                  ${r.value}
                </td>
              </tr>`
              )
              .join("")}
          </table>
        </td>
      </tr>
    </table>`,

  // Alert box — tones: success | warning | error | info | neutral
  alert: (
    s: string,
    tone: "success" | "warning" | "error" | "info" | "neutral" = "info"
  ) => {
    const tones = {
      success: { bg: "#ECFDF5", border: EMAIL_BRAND.green, text: "#065F46" },
      warning: { bg: "#FFFBEB", border: EMAIL_BRAND.gold, text: "#7C5E00" },
      error: { bg: "#FEF2F2", border: EMAIL_BRAND.red, text: "#991B1B" },
      info: { bg: "#EFF6FF", border: "#2563EB", text: "#1E40AF" },
      neutral: {
        bg: EMAIL_BRAND.surface,
        border: EMAIL_BRAND.border,
        text: EMAIL_BRAND.ink,
      },
    } as const;
    const t = tones[tone];
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      bgcolor="${t.bg}"
      style="background-color:${t.bg}; border-left:4px solid ${t.border};
      border-radius:6px; margin:16px 0;">
      <tr>
        <td style="padding:14px 16px; font-family:${FONT}; font-size:14px;
          line-height:1.6; color:${t.text};">
          ${s}
        </td>
      </tr>
    </table>`;
  },

  // Primary gold CTA button — table-based for Outlook
  cta: (label: string, href: string) =>
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0"
      align="center" style="margin:24px auto;">
      <tr>
        <td align="center" bgcolor="${EMAIL_BRAND.gold}"
          style="border-radius:8px;">
          <a href="${esc(href)}" target="_blank"
            style="display:inline-block; padding:14px 28px; font-family:${FONT};
            font-size:15px; font-weight:700; color:${EMAIL_BRAND.ink};
            text-decoration:none; border-radius:8px;">
            ${esc(label)}
          </a>
        </td>
      </tr>
    </table>`,

  // Secondary outline button
  ctaSecondary: (label: string, href: string) =>
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0"
      align="center" style="margin:12px auto;">
      <tr>
        <td align="center" bgcolor="${EMAIL_BRAND.white}"
          style="border-radius:8px; border:1px solid ${EMAIL_BRAND.border};">
          <a href="${esc(href)}" target="_blank"
            style="display:inline-block; padding:12px 26px; font-family:${FONT};
            font-size:14px; font-weight:600; color:${EMAIL_BRAND.ink};
            text-decoration:none; border-radius:8px;">
            ${esc(label)}
          </a>
        </td>
      </tr>
    </table>`,

  // OTP / verification code block
  codeBlock: (code: string, opts?: { label?: string; expiry?: string }) =>
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      bgcolor="#FFFBEB"
      style="background-color:#FFFBEB; border:1px dashed ${EMAIL_BRAND.gold};
      border-radius:10px; margin:20px 0;">
      <tr>
        <td align="center" style="padding:24px;">
          ${
            opts?.label
              ? `<div style="font-family:${FONT}; font-size:11px; font-weight:700;
                  letter-spacing:1.2px; text-transform:uppercase;
                  color:${EMAIL_BRAND.goldDark}; margin-bottom:10px;">
                  ${esc(opts.label)}
                </div>`
              : ""
          }
          <div style="font-family:'Courier New',Consolas,monospace; font-size:36px;
            font-weight:700; letter-spacing:8px; color:${EMAIL_BRAND.ink};
            margin:8px 0;">
            ${esc(code)}
          </div>
          ${
            opts?.expiry
              ? `<div style="font-family:${FONT}; font-size:12px;
                  color:${EMAIL_BRAND.muted}; margin-top:10px;">
                  ⏱️ ${esc(opts.expiry)}
                </div>`
              : ""
          }
        </td>
      </tr>
    </table>`,

  // Sign-off
  signature: (name = "The Zidwell Team") =>
    `<p style="margin:24px 0 0 0; font-size:15px; line-height:1.6;
      color:${EMAIL_BRAND.ink}; font-family:${FONT};">
      Best regards,<br /><strong>${esc(name)}</strong>
    </p>`,

  // Item table
  itemsTable: (
    items: Array<{ description: string; quantity: number; unitPrice: number; total?: number }>,
    currency = naira
  ) =>
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      style="border:1px solid ${EMAIL_BRAND.border}; border-radius:8px;
      border-collapse:separate; overflow:hidden; margin:12px 0;">
      <thead>
        <tr bgcolor="${EMAIL_BRAND.surface}" style="background-color:${EMAIL_BRAND.surface};">
          <th align="left" style="padding:10px 14px; font-family:${FONT};
            font-size:12px; font-weight:700; color:${EMAIL_BRAND.muted};
            text-transform:uppercase; letter-spacing:0.5px;
            border-bottom:1px solid ${EMAIL_BRAND.border};">Description</th>
          <th align="center" style="padding:10px 14px; font-family:${FONT};
            font-size:12px; font-weight:700; color:${EMAIL_BRAND.muted};
            text-transform:uppercase; letter-spacing:0.5px;
            border-bottom:1px solid ${EMAIL_BRAND.border}; width:60px;">Qty</th>
          <th align="right" style="padding:10px 14px; font-family:${FONT};
            font-size:12px; font-weight:700; color:${EMAIL_BRAND.muted};
            text-transform:uppercase; letter-spacing:0.5px;
            border-bottom:1px solid ${EMAIL_BRAND.border}; width:110px;">Price</th>
          <th align="right" style="padding:10px 14px; font-family:${FONT};
            font-size:12px; font-weight:700; color:${EMAIL_BRAND.muted};
            text-transform:uppercase; letter-spacing:0.5px;
            border-bottom:1px solid ${EMAIL_BRAND.border}; width:110px;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${items
          .map(
            (it, idx) => `
          <tr ${idx % 2 ? `bgcolor="${EMAIL_BRAND.surface}"` : ""}
            style="${idx % 2 ? `background-color:${EMAIL_BRAND.surface};` : ""}">
            <td style="padding:12px 14px; font-family:${FONT};
              font-size:14px; color:${EMAIL_BRAND.ink};
              border-bottom:1px solid ${EMAIL_BRAND.border};">
              ${esc(it.description)}
            </td>
            <td align="center" style="padding:12px 14px; font-family:${FONT};
              font-size:14px; color:${EMAIL_BRAND.ink};
              border-bottom:1px solid ${EMAIL_BRAND.border};">
              ${it.quantity}
            </td>
            <td align="right" style="padding:12px 14px; font-family:${FONT};
              font-size:14px; color:${EMAIL_BRAND.ink};
              border-bottom:1px solid ${EMAIL_BRAND.border};">
              ${currency(it.unitPrice)}
            </td>
            <td align="right" style="padding:12px 14px; font-family:${FONT};
              font-size:14px; font-weight:600; color:${EMAIL_BRAND.ink};
              border-bottom:1px solid ${EMAIL_BRAND.border};">
              ${currency(it.total ?? it.quantity * it.unitPrice)}
            </td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>`,

  // Totals block aligned right
  totals: (rows: Array<{ label: string; value: string; emphasis?: boolean }>) =>
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      style="margin:12px 0 4px;">
      <tr>
        <td width="55%"></td>
        <td width="45%">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            ${rows
              .map(
                (r) => `
              <tr>
                <td style="padding:6px 0; font-family:${FONT}; font-size:${
                  r.emphasis ? "16px" : "14px"
                }; font-weight:${r.emphasis ? "700" : "500"};
                  color:${r.emphasis ? EMAIL_BRAND.ink : EMAIL_BRAND.muted};">
                  ${esc(r.label)}
                </td>
                <td align="right" style="padding:6px 0; font-family:${FONT};
                  font-size:${r.emphasis ? "18px" : "14px"};
                  font-weight:${r.emphasis ? "700" : "600"};
                  color:${r.emphasis ? EMAIL_BRAND.gold : EMAIL_BRAND.ink};
                  text-align:right;">
                  ${r.value}
                </td>
              </tr>`
              )
              .join("")}
          </table>
        </td>
      </tr>
    </table>`,
};