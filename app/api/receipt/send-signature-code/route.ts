import { NextRequest, NextResponse } from "next/server";
import { transporter } from "@/lib/node-mailer";
import { createClient } from "@supabase/supabase-js";
import {
  emailShell,
  ui,
  esc,
  naira,
} from "@/lib/email/ui";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { receiptToken, signeeEmail, signeeName, businessName, totalAmount } =
      body;

    if (!receiptToken || !signeeEmail) {
      return NextResponse.json(
        { success: false, error: "Receipt token and email are required" },
        { status: 400 },
      );
    }

    const { data: receipt, error } = await supabase
      .from("receipts")
      .select("*")
      .eq("token", receiptToken)
      .single();

    if (error || !receipt) {
      return NextResponse.json(
        { success: false, error: "Receipt not found" },
        { status: 404 },
      );
    }

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    await supabase
      .from("receipts")
      .update({
        verification_code: verificationCode,
        sent_at: new Date().toISOString(),
      })
      .eq("token", receiptToken);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const headerImageUrl = `${baseUrl}/zidwell-header.png`;
    const footerImageUrl = `${baseUrl}/zidwell-footer.png`;

    await transporter.sendMail({
      from: `Zidwell Receipts <${process.env.EMAIL_FROM}>`,
      to: signeeEmail,
      subject: `Verification code for receipt #${receipt.receipt_id}`,
      html: emailShell({
        title: `Verify receipt #${receipt.receipt_id}`,
        preheader: "Enter this code to acknowledge your Zidwell receipt.",
        content: `
          ${ui.h1("🧾 Verify your receipt")}
          ${ui.p(`Hi ${esc(signeeName || receipt.client_name || "there")},`)}
          ${ui.p("Use this code to confirm your identity and sign the receipt:")}
          ${ui.codeBlock(verificationCode, {
            label: "Verification code",
            expiry: "Valid for 30 minutes",
          })}
          ${ui.kvCard([
            { label: "From", value: esc(businessName || receipt.business_name || "—") },
            { label: "To", value: esc(signeeName || receipt.client_name || "—") },
            { label: "Amount", value: naira(totalAmount || receipt.total || 0) },
            { label: "Receipt ID", value: esc(receipt.receipt_id) },
          ])}
          ${ui.alert(
            "Never share this code with anyone — Zidwell will never ask for it over the phone.",
            "warning"
          )}
          ${ui.muted(
            "If you didn't request this code, you can safely ignore this email."
          )}
          ${ui.signature("Zidwell Receipts")}
        `,
      }),
    });

    return NextResponse.json({
      success: true,
      message: "Verification code sent successfully",
      code: verificationCode,
    });
  } catch (error: any) {
    console.error("Error sending verification code:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}