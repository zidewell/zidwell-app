// app/api/contact/route.ts

import { NextRequest, NextResponse } from "next/server";
import { transporter } from "@/lib/node-mailer";
import { createClient } from "@supabase/supabase-js";
import {
  emailShell,
  ui,
  esc,
  niceDate,
  EMAIL_BRAND,
} from "@/lib/email/ui";

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
    const internalHtml = emailShell({
      title: `New ${category} message — ${subject}`,
      preheader: `${name} sent a ${category} message via the Zidwell contact form.`,
      footerNote: savedRow?.id
        ? `Message ID: ${esc(savedRow.id)} · ${esc(niceDate(new Date()))}`
        : esc(niceDate(new Date())),
      content: `
        <div style="display:inline-block; padding:4px 10px; border-radius:6px;
          background:#FEF3C7; color:#7C5E00; font-family:${"Arial, Helvetica, sans-serif"};
          font-size:11px; font-weight:700; text-transform:uppercase;
          letter-spacing:0.6px; margin-bottom:14px;">
          ${esc(category)} — new message
        </div>
        ${ui.h1(esc(subject))}
        ${ui.muted(
          `From <strong style="color:${EMAIL_BRAND.ink};">${esc(name)}</strong>
            &lt;<a href="mailto:${esc(email)}" style="color:${EMAIL_BRAND.gold}; text-decoration:none;">${esc(email)}</a>&gt;`
        )}
        ${ui.divider()}
        ${ui.h3("Message")}
        <div style="background:${EMAIL_BRAND.surface}; border-left:3px solid ${EMAIL_BRAND.gold};
          border-radius:6px; padding:16px 18px; margin:0 0 16px;">
          <p style="margin:0; font-family:Arial, Helvetica, sans-serif;
            font-size:14px; line-height:1.7; color:${EMAIL_BRAND.ink};
            white-space:pre-wrap;">${esc(message)}</p>
        </div>
        ${ui.kvCard([
          { label: "Reply-to", value: esc(email) },
          {
            label: "Submitted",
            value: esc(niceDate(new Date())) + " (WAT)",
          },
          ...(ip ? [{ label: "IP address", value: esc(ip) }] : []),
          ...(savedRow?.id
            ? [{ label: "Message ID", value: esc(savedRow.id) }]
            : []),
        ])}
        ${ui.ctaSecondary("Reply now", `mailto:${esc(email)}?subject=Re:%20${encodeURIComponent(subject)}`)}
      `,
    });

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
    const firstName = name.split(" ")[0] || name;

    const ackHtml = emailShell({
      title: "We received your message",
      preheader: `Thanks ${firstName} — we'll reply within 1 business day.`,
      content: `
        ${ui.h1(`Thanks, ${esc(firstName)}`)}
        ${ui.p(
          "We received your message and a member of our team will reply within <strong>1 business day</strong>."
        )}
        ${ui.kvCard([
          { label: "Subject", value: esc(subject) },
          {
            label: "Category",
            value: esc(category.charAt(0).toUpperCase() + category.slice(1)),
          },
          ...(savedRow?.id
            ? [
                {
                  label: "Reference",
                  value: `<span style="font-family:'Courier New',monospace; font-size:12px;">${esc(
                    savedRow.id.slice(0, 8).toUpperCase()
                  )}</span>`,
                },
              ]
            : []),
        ])}
        ${ui.alert(
          "You can reply directly to this email if you need to add anything — it reaches the same inbox.",
          "info"
        )}
        ${ui.signature("Zidwell Support")}
      `,
      footerNote: `Zidwell Ltd · Lagos, Nigeria ·
        <a href="${BASE_URL}" style="color:${EMAIL_BRAND.muted}; text-decoration:underline;">zidwell.com</a>`,
    });

    const ackText = [
      `Thanks, ${firstName} — we got your message.`,
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
        error:
          "Something went wrong on our end. Please try again in a moment.",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}