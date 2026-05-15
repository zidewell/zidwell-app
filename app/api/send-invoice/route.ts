// app/api/send-invoice/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import { transporter } from "@/lib/node-mailer";
import {
  isAuthenticatedWithRefresh,
  createAuthResponse,
} from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

function calculateSubtotal(invoiceItems: InvoiceItem[]): number {
  return invoiceItems.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
    0,
  );
}

async function uploadLogoToStorage(
  userId: string,
  base64Image: string,
): Promise<string | null> {
  try {
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const fileType = base64Image.split(";")[0].split("/")[1];
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileType}`;
    const { data, error } = await supabase.storage
      .from("business-logos")
      .upload(fileName, buffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: `image/${fileType}`,
      });
    if (error) return null;
    const {
      data: { publicUrl },
    } = supabase.storage.from("business-logos").getPublicUrl(data.path);
    return publicUrl;
  } catch (error) {
    return null;
  }
}

async function sendInvoiceEmail(params: {
  to: string;
  subject: string;
  invoiceId: string;
  amount: number;
  signingLink: string;
  senderName: string;
  message?: string;
  businessLogo?: string;
  isMultiplePayments?: boolean;
  targetQuantity?: number;
}) {
  const baseUrl =
    process.env.NODE_ENV === "development"
      ? process.env.NEXT_PUBLIC_DEV_URL
      : process.env.NEXT_PUBLIC_BASE_URL;
  const headerImageUrl = `${baseUrl}/zidwell-header.png`;
  const footerImageUrl = `${baseUrl}/zidwell-footer.png`;

  await transporter.sendMail({
    from: `Zidwell Invoice <${process.env.EMAIL_USER}>`,
    to: params.to,
    subject: params.subject,
    html: `<div><img src="${headerImageUrl}" style="width:100%;" /><div style="padding:20px;"><h2>New Invoice</h2><p>Hello,</p><p>You have received an invoice from <strong>${params.senderName}</strong>.</p><div><p><strong>Invoice ID:</strong> ${params.invoiceId}</p><p><strong>Amount:</strong> ₦${Number(params.amount).toLocaleString()}</p></div><a href="${params.signingLink}" style="background:#FDC020; color:#fff; padding:12px 24px; text-decoration:none;">View Invoice & Pay</a></div><img src="${footerImageUrl}" style="width:100%;" /></div>`,
  });
}

function isValidUrl(string: string) {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req);

  if (!user) {
    const response = NextResponse.json(
      { error: "Please login to access transactions", logout: true },
      { status: 401 },
    );
    if (newTokens) return createAuthResponse(await response.json(), newTokens);
    return response;
  }

  try {
    const body = await req.json();
    const {
      userId,
      initiator_email,
      initiator_name,
      invoice_id,
      signee_name,
      signee_email,
      message,
      bill_to,
      issue_date,
      customer_note,
      invoice_items,
      total_amount,
      payment_type,
      fee_option,
      status,
      business_logo,
      redirect_url,
      business_name,
      clientPhone,
      initiator_account_number,
      initiator_account_name,
      initiator_bank_name,
      target_quantity,
      is_draft,
      send_email_automatically = true,
    } = body;

    if (!userId || userId !== user.id)
      return NextResponse.json(
        { error: "Unauthorized: User ID mismatch" },
        { status: 403 },
      );
    if (!invoice_items?.length)
      return NextResponse.json(
        { message: "Invoice must have at least one item" },
        { status: 400 },
      );

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (payment_type === "single" && send_email_automatically && !signee_email)
      return NextResponse.json(
        { message: "Email is required for single payment invoices" },
        { status: 400 },
      );
    if (
      payment_type === "multiple" &&
      (!target_quantity || target_quantity < 1)
    )
      return NextResponse.json(
        { message: "Target quantity must be at least 1" },
        { status: 400 },
      );

    const baseUrl =
      process.env.NODE_ENV === "development"
        ? process.env.NEXT_PUBLIC_DEV_URL
        : process.env.NEXT_PUBLIC_BASE_URL;
    const publicToken = uuidv4();
    const signingLink = `${baseUrl}/pay-invoice/${publicToken}`;
    const subtotal = calculateSubtotal(invoice_items);
    const feeAmount = fee_option === "customer" ? total_amount - subtotal : 0;
    const issueDate = new Date(issue_date);
    if (isNaN(issueDate.getTime()))
      return NextResponse.json(
        { message: "Invalid date format" },
        { status: 400 },
      );

    let finalLogoUrl: string | undefined;
    if (business_logo?.startsWith("data:image/"))
      finalLogoUrl =
        (await uploadLogoToStorage(userId, business_logo)) || undefined;
    else if (business_logo && isValidUrl(business_logo))
      finalLogoUrl = business_logo;

    const { data: existingInvoice } = await supabase
      .from("invoices")
      .select("id, status, is_draft, invoice_id")
      .eq("invoice_id", invoice_id)
      .single();
    let isUpdatingDraft = false;
    let existingInvoiceId: string | null = null;

    if (existingInvoice?.is_draft) {
      isUpdatingDraft = true;
      existingInvoiceId = existingInvoice.id;
    } else if (existingInvoice && !existingInvoice.is_draft)
      return NextResponse.json(
        { message: "Invoice with this ID already exists" },
        { status: 409 },
      );

    let invoice: any;
    if (isUpdatingDraft && existingInvoiceId) {
      const { data: updatedInvoice, error: updateError } = await supabase
        .from("invoices")
        .update({
          business_name,
          business_logo: finalLogoUrl,
          from_email: initiator_email,
          from_name: initiator_name,
          client_name: signee_name || null,
          client_email: signee_email || null,
          client_phone: clientPhone,
          bill_to,
          issue_date: issueDate.toISOString().split("T")[0],
          status: status || "unpaid",
          payment_type,
          fee_option,
          allow_multiple_payments: payment_type === "multiple",
          target_quantity:
            payment_type === "multiple" ? target_quantity || 1 : 1,
          subtotal,
          fee_amount: feeAmount,
          total_amount,
          message,
          customer_note,
          redirect_url,
          payment_link: signingLink,
          signing_link: signingLink,
          public_token: publicToken,
          initiator_account_number,
          initiator_account_name,
          initiator_bank_name,
          is_draft: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingInvoiceId)
        .select()
        .single();
      if (updateError) throw updateError;
      invoice = updatedInvoice;
      await supabase
        .from("invoice_items")
        .delete()
        .eq("invoice_id", existingInvoiceId);
    } else {
      const { data: newInvoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert([
          {
            user_id: userId,
            invoice_id,
            order_reference: uuidv4(),
            business_name,
            business_logo: finalLogoUrl,
            from_email: initiator_email,
            from_name: initiator_name,
            client_name: signee_name || null,
            client_email: signee_email || null,
            client_phone: clientPhone,
            bill_to,
            issue_date: issueDate.toISOString().split("T")[0],
            status: status || "unpaid",
            payment_type,
            fee_option,
            allow_multiple_payments: payment_type === "multiple",
            target_quantity:
              payment_type === "multiple" ? target_quantity || 1 : 1,
            paid_quantity: 0,
            subtotal,
            fee_amount: feeAmount,
            total_amount,
            paid_amount: 0,
            message,
            customer_note,
            redirect_url,
            payment_link: signingLink,
            signing_link: signingLink,
            public_token: publicToken,
            initiator_account_number,
            initiator_account_name,
            initiator_bank_name,
            is_draft: false,
          },
        ])
        .select()
        .single();
      if (invoiceError) throw invoiceError;
      invoice = newInvoice;
    }

    await supabase.from("invoice_items").insert(
      invoice_items.map((item: any) => ({
        invoice_id: invoice.id,
        item_description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_amount: item.total,
      })),
    );

    await supabase
      .from("users")
      .update({
        invoices_used_lifetime:
          (
            await supabase
              .from("users")
              .select("invoices_used_lifetime")
              .eq("id", userId)
              .single()
          ).data?.invoices_used_lifetime + 1,
      })
      .eq("id", userId);

    let emailSent = false;
    if (
      send_email_automatically &&
      signee_email &&
      emailRegex.test(signee_email)
    ) {
      await sendInvoiceEmail({
        to: signee_email,
        subject: `New Invoice from ${initiator_name}`,
        invoiceId: invoice_id,
        amount: total_amount,
        signingLink,
        senderName: initiator_name,
        message,
        businessLogo: finalLogoUrl,
        isMultiplePayments: payment_type === "multiple",
        targetQuantity: target_quantity,
      });
      emailSent = true;
    }

    const responseData = {
      message: isUpdatingDraft
        ? "Draft updated and invoice sent successfully"
        : "Invoice created successfully",
      signingLink,
      invoiceId: invoice.invoice_id,
      emailSent,
    };
    if (newTokens) return createAuthResponse(responseData, newTokens);
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Invoice creation error:", error);
    return NextResponse.json(
      { message: "Failed to create invoice", error: error.message },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req);

  if (!user) {
    const response = NextResponse.json(
      { error: "Please login to access transactions", logout: true },
      { status: 401 },
    );
    if (newTokens) return createAuthResponse(await response.json(), newTokens);
    return response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId || userId !== user.id)
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 },
      );

    const { data: invoices, error } = await supabase
      .from("invoices")
      .select(`*, invoice_items (*)`)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;

    const responseData = { invoices };
    if (newTokens) return createAuthResponse(responseData, newTokens);
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Fetch invoices error:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 },
    );
  }
}
