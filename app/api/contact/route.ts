// app/api/contact/route.ts

import { NextRequest, NextResponse } from "next/server";
import { transporter } from "@/lib/node-mailer";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SUPPORT_EMAIL = "support@zidwell.com";
const FROM_EMAIL = process.env.EMAIL_USER!;
const BASE_URL =
  process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_DEV_URL || "http://localhost:3000"
    : process.env.NEXT_PUBLIC_BASE_URL || "https://zidwell.com";

/* ---------------------------------------------------------------- */
/*  Types                                                            */
/* ---------------------------------------------------------------- */

type ContactBody = {
  name: string;
  email: string;
  subject: string;
  message: string;
  category?: string;
  honeypot?: string;
};

const VALID_CATEGORIES = [
  "general",
  "sales",
  "billing",
  "technical",
  "partnership",
  "press",
] as const;

/* ---------------------------------------------------------------- */
/*  Helpers                                                          */
/* ---------------------------------------------------------------- */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

/* ---------------------------------------------------------------- */
/*  POST                                                             */
/* ---------------------------------------------------------------- */

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ContactBody;

    const name = (body.name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const subject = (body.subject || "").trim();
    const message = (body.message || "").trim();
    const category = (body.category || "general").toLowerCase();

    /* --- Honeypot --- */
    if (body.honeypot) {
      return NextResponse.json({ success: true });
    }

    /* --- Validation --- */
    const errors: Record<string, string> = {};

    if (!name || name.length < 2) {
      errors.name = "Please enter your name.";
    }
    if (name.length > 100) {
      errors.name = "Name is too long.";
    }
    if (!email || !isValidEmail(email)) {
      errors.email = "Please enter a valid email address.";
    }
    if (!subject || subject.length < 3) {
      errors.subject = "Please add a subject.";
    }
    if (subject.length > 200) {
      errors.subject = "Subject is too long.";
    }
    if (!message || message.length < 10) {
      errors.message = "Message is too short (minimum 10 characters).";
    }
    if (message.length > 5000) {
      errors.message = "Message is too long (maximum 5000 characters).";
    }
    if (!(VALID_CATEGORIES as readonly string[]).includes(category)) {
      errors.category = "Invalid category.";
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    /* --- Rate limit: 5 per email per hour --- */
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { count, error: countErr } = await supabase
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .eq("email", email)
      .gte("created_at", oneHourAgo);

    if (!countErr && typeof count === "number" && count >= 5) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You've sent several messages recently. Please wait an hour before trying again, or reply to any confirmation email we've already sent.",
        },
        { status: 429 },
      );
    }

    /* --- Persist --- */
    const userAgent = req.headers.get("user-agent") || null;
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null;

    const { data: savedRow, error: saveErr } = await supabase
      .from("contact_messages")
      .insert({
        name,
        email,
        subject,
        message,
        category,
        user_agent: userAgent,
        ip_address: ip,
        status: "new",
      })
      .select("id")
      .single();

    if (saveErr) {
      console.error("[contact] failed to save message:", saveErr);
    }

    /* --- Internal email to support --- */
    const internalHtml = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:640px;margin:0 auto;padding:24px;background:#f9fafb;">
        <div style="background:#fff;border-radius:12px;padding:28px;border:1px solid #e5e7eb;">
          <div style="display:inline-block;padding:4px 10px;border-radius:6px;background:#fef3c7;color:#92400e;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:16px;">
            ${escapeHtml(category)} — new message
          </div>

          <h1 style="margin:0 0 4px;font-size:20px;color:#111;font-weight:700;">
            ${escapeHtml(subject)}
          </h1>
          <p style="margin:0 0 24px;color:#6b7280;font-size:13px;">
            From <strong>${escapeHtml(name)}</strong> &lt;${escapeHtml(email)}&gt;
          </p>

          <div style="background:#f9fafb;border-radius:8px;padding:16px;border-left:3px solid #f5b800;">
            <p style="margin:0;color:#111;font-size:14px;line-height:1.7;white-space:pre-wrap;">${escapeHtml(message)}</p>
          </div>

          <div style="margin-top:24px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;line-height:1.6;">
            <p style="margin:0 0 4px;"><strong>Reply-to:</strong> ${escapeHtml(email)}</p>
            <p style="margin:0 0 4px;"><strong>Submitted:</strong> ${new Date().toLocaleString("en-NG", { timeZone: "Africa/Lagos" })} (WAT)</p>
            ${ip ? `<p style="margin:0 0 4px;"><strong>IP:</strong> ${escapeHtml(ip)}</p>` : ""}
            ${savedRow?.id ? `<p style="margin:0;"><strong>Message ID:</strong> ${savedRow.id}</p>` : ""}
          </div>
        </div>
      </div>
    `;

    const internalText = [
      `Category: ${category}`,
      `From: ${name} <${email}>`,
      `Subject: ${subject}`,
      "",
      message,
      "",
      `Submitted: ${new Date().toISOString()}`,
      ip ? `IP: ${ip}` : "",
      savedRow?.id ? `Message ID: ${savedRow.id}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await transporter.sendMail({
        from: `"Zidwell Contact" <${FROM_EMAIL}>`,
        to: SUPPORT_EMAIL,
        replyTo: email,
        subject: `[${category}] ${subject}`,
        text: internalText,
        html: internalHtml,
      });
    } catch (mailErr) {
      console.error("[contact] support email failed:", mailErr);
    }

    /* --- Auto-acknowledgement to sender --- */
    const ackHtml = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:640px;margin:0 auto;padding:24px;background:#f9fafb;">
        <div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #e5e7eb;">
          <h1 style="margin:0 0 8px;font-size:20px;color:#111;font-weight:700;">Thanks, ${escapeHtml(name.split(" ")[0] || name)} — we got your message.</h1>
          <p style="margin:0 0 20px;color:#4b5563;font-size:15px;line-height:1.6;">
            A member of our team will reply within 1 business day. Your reference number is below.
          </p>

          <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:20px 0;">
            <table style="width:100%;font-size:13px;color:#374151;border-collapse:collapse;">
              <tr>
                <td style="padding:4px 0;color:#6b7280;">Subject</td>
                <td style="padding:4px 0;text-align:right;font-weight:600;">${escapeHtml(subject)}</td>
              </tr>
              <tr>
                <td style="padding:4px 0;color:#6b7280;">Category</td>
                <td style="padding:4px 0;text-align:right;font-weight:600;text-transform:capitalize;">${escapeHtml(category)}</td>
              </tr>
              ${savedRow?.id ? `<tr><td style="padding:4px 0;color:#6b7280;">Reference</td><td style="padding:4px 0;text-align:right;font-family:monospace;font-size:11px;">${savedRow.id.slice(0, 8).toUpperCase()}</td></tr>` : ""}
            </table>
          </div>

          <p style="margin:20px 0 0;color:#4b5563;font-size:14px;line-height:1.6;">
            You can reply directly to this email if you need to add anything — it reaches the same inbox.
          </p>

          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />

          <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.5;">
            Zidwell Ltd · Lagos, Nigeria<br />
            <a href="${BASE_URL}" style="color:#6b7280;text-decoration:none;">zidwell.com</a>
          </p>
        </div>
      </div>
    `;

    const ackText = [
      `Thanks, ${name.split(" ")[0] || name} — we got your message.`,
      "",
      `Subject: ${subject}`,
      `Category: ${category}`,
      savedRow?.id ? `Reference: ${savedRow.id.slice(0, 8).toUpperCase()}` : "",
      "",
      "A member of our team will reply within 1 business day.",
      "You can reply directly to this email if you need to add anything.",
      "",
      "— Zidwell Ltd",
    ]
      .filter((l) => l !== "")
      .join("\n");

    try {
      await transporter.sendMail({
        from: `"Zidwell Support" <${FROM_EMAIL}>`,
        to: email,
        replyTo: SUPPORT_EMAIL,
        subject: `We've received your message — ${subject}`,
        text: ackText,
        html: ackHtml,
      });
    } catch (ackErr) {
      console.error("[contact] ack email failed:", ackErr);
    }

    return NextResponse.json({
      success: true,
      reference: savedRow?.id ? savedRow.id.slice(0, 8).toUpperCase() : null,
    });
  } catch (err: any) {
    console.error("[contact] unhandled:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Something went wrong on our end. Please try again in a moment.",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
