import { transporter } from "@/lib/node-mailer";
import { NextRequest, NextResponse } from "next/server";
import { emailShell, ui, esc, naira, niceDate, EMAIL_BRAND } from "@/lib/email/ui";

interface EmailNotificationData {
  type: "login" | "debit" | "credit" | "alert";
  user: {
    email: string;
    full_name: string;
    account_number?: string;
  };
  transaction?: {
    amount: number;
    type: string;
    description: string;
    reference: string;
    balance_after?: number;
    recipient_name?: string;
    recipient_account?: string;
    recipient_bank?: string;
    sender_name?: string;
    sender_account?: string;
  };
  device?: {
    browser?: string;
    os?: string;
    ip_address?: string;
    location?: string;
  };
  timestamp: string;
}

const baseUrl =
  process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_DEV_URL
    : process.env.NEXT_PUBLIC_BASE_URL;

export async function POST(request: NextRequest) {
  try {
    const body: EmailNotificationData = await request.json();

    const { type, user, transaction, device, timestamp } = body;

    let emailSubject = "";
    let emailHtml = "";

    console.log("Preparing to send email notification:", user);

    switch (type) {
      case "login":
        emailSubject = `Security Alert: New Login to Your Account`;
        emailHtml = generateLoginEmail(user, device, timestamp);
        break;

      case "debit":
        emailSubject = `Debit Alert: ₦${transaction?.amount.toLocaleString()} ${transaction?.description}`;
        emailHtml = generateDebitEmail(user, transaction!, timestamp);
        break;

      case "credit":
        emailSubject = `Credit Alert: ₦${transaction?.amount.toLocaleString()} ${transaction?.description}`;
        emailHtml = generateCreditEmail(user, transaction!, timestamp);
        break;

      case "alert":
        emailSubject = `Account Alert: ${transaction?.description}`;
        emailHtml = generateAlertEmail(user, transaction!, timestamp);
        break;

      default:
        return NextResponse.json(
          { error: "Invalid notification type" },
          { status: 400 },
        );
    }

    // Send email using Nodemailer

    const mailOptions = {
      from: `Zidwell <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: emailSubject,
      html: emailHtml,
    };

    const result = await transporter.sendMail(mailOptions);

    // // Log notification for audit purposes
    console.log(
      `Email notification sent: ${type} to ${user.email}`,
      result.messageId,
    );

    return NextResponse.json({
      success: true,
      message: "Notification sent successfully",
      messageId: result.messageId,
    });
  } catch (error) {
    console.error("Notification API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

function generateLoginEmail(user: any, device: any, timestamp: string): string {
  return emailShell({
    title: "New login to your Zidwell account",
    preheader: "Security alert: new sign-in detected on your account.",
    content: `
      ${ui.h1("🔐 New login detected")}
      ${ui.p(`Hi ${esc(user.full_name || "there")},`)}
      ${ui.p(
        "We noticed a new sign-in to your Zidwell account with the following details:"
      )}
      ${ui.kvCard([
        { label: "Account", value: esc(user.email || "—") },
        { label: "Time", value: niceDate(timestamp) },
        ...(device?.browser ? [{ label: "Browser", value: esc(device.browser) }] : []),
        ...(device?.os ? [{ label: "Operating system", value: esc(device.os) }] : []),
        ...(device?.location ? [{ label: "Location", value: esc(device.location) }] : []),
        ...(device?.ip_address ? [{ label: "IP address", value: esc(device.ip_address) }] : []),
      ])}
      ${ui.alert(
        `<strong>If this wasn't you</strong>, change your password immediately and contact support.`,
        "warning"
      )}
      ${ui.cta("Change password", `${baseUrl}/auth/password-reset`)}
      ${ui.signature()}
    `,
  });
}

function generateDebitEmail(user: any, transaction: any, timestamp: string): string {
  return emailShell({
    title: `Debit alert: ${naira(transaction.amount)}`,
    preheader: `${naira(transaction.amount)} was debited from your account.`,
    content: `
      ${ui.h1(`💸 Debit alert`)}
      ${ui.p(`Hi ${esc(user.full_name || "there")},`)}
      ${ui.p(
        `A debit of <strong>${naira(transaction.amount)}</strong> was made on your Zidwell account.`
      )}
      ${ui.kvCard([
        { label: "Amount", value: naira(transaction.amount), bold: true, color: EMAIL_BRAND.red },
        { label: "Description", value: esc(transaction.description || "—") },
        { label: "Type", value: esc(transaction.type || "—") },
        { label: "Reference", value: esc(transaction.reference || "—") },
        { label: "Date", value: niceDate(timestamp) },
        ...(transaction.balance_after !== undefined
          ? [{ label: "Balance", value: naira(transaction.balance_after) }]
          : []),
      ])}
      ${
        transaction.recipient_name
          ? ui.alert(
              `<strong>Recipient:</strong> ${esc(transaction.recipient_name)}${
                transaction.recipient_account
                  ? ` · ${esc(transaction.recipient_account)}`
                  : ""
              }${transaction.recipient_bank ? ` · ${esc(transaction.recipient_bank)}` : ""}`,
              "neutral"
            )
          : ""
      }
      ${ui.muted(
        "If you didn't authorize this transaction, contact support immediately."
      )}
      ${ui.signature()}
    `,
  });
}


function generateCreditEmail(user: any, transaction: any, timestamp: string): string {
  return emailShell({
    title: `Credit alert: ${naira(transaction.amount)}`,
    preheader: `${naira(transaction.amount)} was credited to your account.`,
    content: `
      ${ui.h1("💰 Credit alert")}
      ${ui.p(`Hi ${esc(user.full_name || "there")},`)}
      ${ui.p(
        `Your account was credited with <strong>${naira(transaction.amount)}</strong>.`
      )}
      ${ui.kvCard([
        { label: "Amount", value: naira(transaction.amount), bold: true, color: EMAIL_BRAND.green },
        { label: "Description", value: esc(transaction.description || "—") },
        { label: "Type", value: esc(transaction.type || "—") },
        { label: "Reference", value: esc(transaction.reference || "—") },
        { label: "Date", value: niceDate(timestamp) },
        ...(transaction.balance_after !== undefined
          ? [{ label: "Balance", value: naira(transaction.balance_after) }]
          : []),
      ])}
      ${
        transaction.sender_name
          ? ui.alert(
              `<strong>From:</strong> ${esc(transaction.sender_name)}${
                transaction.sender_account ? ` · ${esc(transaction.sender_account)}` : ""
              }`,
              "success"
            )
          : ""
      }
      ${ui.signature()}
    `,
  });
}



function generateAlertEmail(user: any, transaction: any, timestamp: string): string {
  return emailShell({
    title: transaction?.description || "Account alert",
    preheader: transaction?.description || "Important notice from Zidwell",
    content: `
      ${ui.h1("🔔 Account alert")}
      ${ui.p(`Hi ${esc(user.full_name || "there")},`)}
      ${ui.alert(`<strong>${esc(transaction?.description || "—")}</strong>`, "info")}
      ${ui.kvCard([
        ...(transaction?.amount !== undefined
          ? [{ label: "Amount", value: naira(transaction.amount) }]
          : []),
        ...(transaction?.reference
          ? [{ label: "Reference", value: esc(transaction.reference) }]
          : []),
        { label: "Time", value: niceDate(timestamp) },
        { label: "Account", value: esc(user.account_number || "—") },
      ])}
      ${ui.muted("This is an automated alert from your Zidwell account.")}
      ${ui.signature()}
    `,
  });
}
