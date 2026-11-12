import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailShell, ui, esc, naira } from "@/lib/email/ui";
import { transporter } from "@/lib/node-mailer";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Send confirmation email
async function sendConfirmationEmail(
  email: string,
  fullName: string,
  amount: number
) {
  await transporter.sendMail({
    from: `"Subscription Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Payment successful — subscription active",
    html: emailShell({
      title: "Subscription active",
      preheader: `Your payment of ${naira(amount)} was successful.`,
      content: `
        ${ui.h1("✅ Payment successful")}
        ${ui.p(`Hi ${esc(fullName)},`)}
        ${ui.p(
          `Your payment of <strong>${naira(amount)}</strong> was successful and your subscription is now active.`
        )}
        ${ui.cta("Go to dashboard", `${process.env.NEXT_PUBLIC_BASE_URL || "https://zidwell.com"}/dashboard`)}
        ${ui.signature("The Zidwell Subscription Team")}
      `,
    }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    const eventType = payload?.eventType;
    const paymentStatus = payload?.data?.status;
    const orderReference = payload?.data?.orderReference;

    // Ignore irrelevant webhook events
    if (eventType !== "charge.success" || paymentStatus !== "successful") {
      return NextResponse.json({ message: "Ignored non-success event" });
    }

    // Extract metadata from frontend setup
    const subEmail = payload?.data?.meta?.email;
    const subFullName = payload?.data?.meta?.fullName || "Subscriber";
    const subPlanId = payload?.data?.meta?.planId;
    const subAmount = payload?.data?.meta?.amount ?? payload?.data?.amount ?? 0;

    // Save to Supabase
    if (subEmail && subPlanId) {
      await supabase.from("subscribers").insert([
        {
          email: subEmail,
          full_name: subFullName,
          plan_id: subPlanId,
          amount: subAmount,
          reference: orderReference,
          status: "active",
          paid_at: new Date().toISOString(),
        },
      ]);
    }

    // Send confirmation email
    await sendConfirmationEmail(subEmail, subFullName, subAmount);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Webhook Error:", error);
    return new NextResponse("Webhook error", { status: 500 });
  }
}
