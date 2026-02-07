import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import { transporter } from "@/lib/node-mailer";
import { isAuthenticated } from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface RequestBody {
  userId: string;
  initiator_email: string;
  initiator_name: string;
  invoice_id: string;
  signee_name: string;
  signee_email: string;
  message: string;
  bill_to: string;
  issue_date: string;
  customer_note: string;
  invoice_items: InvoiceItem[];
  total_amount: number;
  payment_type: "single" | "multiple";
  fee_option: "absorbed" | "customer";
  status: "unpaid" | "paid" | "draft";
  business_logo?: string;
  redirect_url?: string;
  business_name: string;
  clientPhone?: string;
  initiator_account_number: string;
  initiator_account_name: string;
  initiator_bank_name: string;
  target_quantity?: number;
  is_draft?: boolean;
}

function generateInvoiceId(): string {
  const randomToken = uuidv4().replace(/-/g, "").substring(0, 4).toUpperCase();
  return `INV_${randomToken}`;
}

function calculateSubtotal(invoiceItems: InvoiceItem[]): number {
  return invoiceItems.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
    0
  );
}

async function uploadLogoToStorage(
  userId: string,
  base64Image: string
): Promise<string | null> {
  try {
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const fileType = base64Image.split(";")[0].split("/")[1];
    const fileName = `${userId}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}.${fileType}`;

    const { data, error } = await supabase.storage
      .from("business-logos")
      .upload(fileName, buffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: `image/${fileType}`,
      });

    if (error) {
      console.error("Logo upload error:", error);
      return null;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("business-logos").getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error("Logo upload error:", error);
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
  try {
    const multiplePaymentsInfo = params.isMultiplePayments
      ? `
      <div style="background:#e8f4fd; padding:15px; border-radius:6px; border-left:4px solid #2196F3; margin:15px 0;">
        <p style="margin:0; font-weight:bold; color:#1976d2;">Multiple Payments Enabled</p>
        <p style="margin:5px 0; color:#1976d2;">
          This invoice allows multiple people to pay. Each person pays the full amount of ₦${Number(
            params.amount
          ).toLocaleString()}.
          ${
            params.targetQuantity
              ? `Target: ${params.targetQuantity} people`
              : ""
          }
        </p>
        <p style="margin:5px 0; color:#1976d2; font-size:14px;">
          <strong>How it works:</strong> Click "View Invoice" below, then "Pay Now" to provide your information and make payment.
        </p>
      </div>
    `
      : "";

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
      html: `
<!DOCTYPE html>
<html>
<body style="margin:0; padding:0; background:#f3f4f6; font-family:Arial, sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="padding:20px;">
  <tr>
    <td align="center">

      <table width="600" cellpadding="0" cellspacing="0"
        style="background:#ffffff; border-radius:8px; overflow:hidden;">

        <!-- Header -->
        <tr>
          <td>
            <img
              src="${headerImageUrl}"
              alt="Zidwell Header"
              style="width:100%; max-width:600px; display:block;"
            />
          </td>
        </tr>

        <!-- Content -->
        <tr>
          <td style="padding:24px; color:#333; line-height:1.6;">
            <div style="max-width: 600px; margin: 0 auto;">
              ${
                params.businessLogo
                  ? `
                <div style="text-align:center; margin-bottom:20px;">
                  <img src="${params.businessLogo}" alt="Business Logo" style="max-height:60px; max-width:200px;" />
                </div>`
                  : `
                <div style="text-align:center; margin-bottom:20px;">
                  <h2 style="color:#C29307; margin:0; font-size:24px;">New Invoice</h2>
                </div>`
              }
              
              <p>Hello <strong>Valued Customer</strong>,</p>
              <p>You have received an invoice from <strong>${
                params.senderName
              }</strong>.</p>
              
              ${multiplePaymentsInfo}

              <div style="
                background:#f8fafc; 
                padding:20px; 
                border-radius:8px; 
                border-left:4px solid #C29307; 
                margin:20px 0;
              ">
                <p style="margin:0 0 15px 0; font-weight:bold; font-size:16px; color:#1f2937;">Invoice Details:</p>
                <div style="display: grid; gap: 10px;">
                  <p style="margin:0;"><strong>Invoice ID:</strong> ${params.invoiceId}</p>
                  <p style="margin:0;"><strong>Amount:</strong> ₦${Number(
                    params.amount
                  ).toLocaleString()}</p>
                  <p style="margin:0;"><strong>From:</strong> ${params.senderName}</p>
                </div>
              </div>
              
              <p style="margin-bottom: 15px; font-size: 15px;">Click the button below to view invoice details and make payment:</p>
              
              <div style="text-align:center; margin:25px 0;">
                <a href="${params.signingLink}" 
                   target="_blank"
                   style="
                     display:inline-block;
                     background-color:#C29307;
                     color:#fff;
                     padding:14px 28px;
                     border-radius:6px;
                     text-decoration:none;
                     font-weight:bold;
                     font-size:16px;
                     box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                   ">
                  📄 View Invoice & Pay
                </a>
              </div>
              
              <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center;">
                <p style="margin:0; font-size: 14px; color: #6b7280;">
                  <strong>Alternative:</strong> Copy and paste this link in your browser:<br>
                  <a href="${params.signingLink}" style="color:#C29307; font-size:13px; word-break: break-all;">
                    ${params.signingLink}
                  </a>
                </p>
              </div>
              
              ${
                params.message
                  ? `
                <div style="
                  background:#f0f8ff; 
                  padding:20px; 
                  border-radius:6px; 
                  margin:20px 0;
                  border-left: 4px solid #3b82f6;
                ">
                  <p style="margin:0 0 10px 0; font-weight:bold; color:#1e40af;">Message from ${params.senderName}:</p>
                  <p style="margin:0; color:#374151;">${params.message}</p>
                </div>`
                  : ""
              }
              
              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
                <p style="color:#6b7280; font-size:14px; margin:0;">
                  <strong>Note:</strong> You'll be able to provide your payment information and complete the payment on the invoice page.
                </p>
              </div>
              
              <div style="margin-top:32px; padding-top:20px; border-top:1px solid #e5e7eb; text-align:center;">
                <p style="font-size:13px; color:#888; margin:0;">– Zidwell Invoice Team</p>
              </div>
            </div>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td>
            <img
              src="${footerImageUrl}"
              alt="Zidwell Footer"
              style="width:100%; max-width:600px; display:block;"
            />
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>

</body>
</html>
`,
    });
  } catch (error) {
    console.error("Email send error:", error);
  }
}

function isValidUrl(string: string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

export async function POST(req: NextRequest) {
     const user = await isAuthenticated(req);
        
        if (!user) {
          return NextResponse.json(
            { error: "Please login to access transactions" },
            { status: 401 }
          );
        }
    
  try {
    const body: RequestBody = await req.json();

    // Debug logging
    console.log("API /send-invoice received:", {
      userId: body.userId,
      signee_email: body.signee_email,
      invoice_items_count: body.invoice_items?.length,
      payment_type: body.payment_type,
      is_draft: body.is_draft,
      allowMultiplePayments: body.payment_type === "multiple"
    });

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
    } = body;

    // VALIDATION: Check required fields
    if (!userId) {
      console.error("Missing userId");
      return NextResponse.json(
        { message: "Missing required field: userId" },
        { status: 400 }
      );
    }

    if (!invoice_items || invoice_items.length === 0) {
      console.error("No invoice items provided");
      return NextResponse.json(
        { message: "Invoice must have at least one item" },
        { status: 400 }
      );
    }

    // Validate each invoice item
    for (let i = 0; i < invoice_items.length; i++) {
      const item = invoice_items[i];
      if (!item.description || !item.quantity || !item.unitPrice) {
        console.error(`Invalid item at index ${i}:`, item);
        return NextResponse.json(
          { message: `Item ${i + 1} is missing required fields (description, quantity, or price)` },
          { status: 400 }
        );
      }
    }

    // Email validation only for single payments
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (payment_type === "single") {
      if (!signee_email) {
        console.error("Missing email for single payment");
        return NextResponse.json(
          { message: "Email is required for single payment invoices" },
          { status: 400 }
        );
      }
      
      if (!emailRegex.test(signee_email)) {
        console.error("Invalid email format:", signee_email);
        return NextResponse.json(
          { message: "Invalid email format for single payment invoice" },
          { status: 400 }
        );
      }
    }

    // Validate target_quantity for multiple payments
    if (payment_type === "multiple") {
      if (!target_quantity || target_quantity < 1) {
        console.error("Invalid target quantity for multiple payments:", target_quantity);
        return NextResponse.json(
          { message: "Target quantity must be at least 1 for multiple payments" },
          { status: 400 }
        );
      }
      
      // For multiple payments, we can accept an empty email
      // but if provided, it should be valid
      if (signee_email && signee_email.trim() !== "" && !emailRegex.test(signee_email)) {
        console.error("Invalid optional email for multiple payments:", signee_email);
        return NextResponse.json(
          { message: "If email is provided for multiple payments, it must be valid" },
          { status: 400 }
        );
      }
    }

    const invoiceId = invoice_id;
    const baseUrl =
      process.env.NODE_ENV === "development"
        ? process.env.NEXT_PUBLIC_DEV_URL
        : process.env.NEXT_PUBLIC_BASE_URL;

    if (!baseUrl) {
      console.error("Base URL not configured");
      return NextResponse.json(
        { message: "Base URL not configured" },
        { status: 500 }
      );
    }

    // FIRST: Check if invoice already exists (could be a draft)
    const { data: existingInvoice, error: checkError } = await supabase
      .from("invoices")
      .select("id, status, is_draft, invoice_id")
      .eq("invoice_id", invoice_id)
      .single();

    let isUpdatingDraft = false;
    let existingInvoiceId: string | null = null;

    if (existingInvoice && existingInvoice.is_draft) {
      console.log(`Found existing draft invoice: ${invoice_id}, ID: ${existingInvoice.id}`);
      isUpdatingDraft = true;
      existingInvoiceId = existingInvoice.id;
    } else if (existingInvoice && !existingInvoice.is_draft) {
      console.error(`Invoice ${invoice_id} already exists and is not a draft`);
      return NextResponse.json(
        { message: "Invoice with this ID already exists as a final invoice. Please use a different invoice ID." },
        { status: 409 }
      );
    }

    const publicToken = uuidv4();
    const signingLink = `${baseUrl}/pay-invoice/${publicToken}`;

    // Calculate subtotal only (fee calculation is now handled in frontend)
    const subtotal = calculateSubtotal(invoice_items);
    
    // Calculate fee amount based on fee_option (use the total_amount from frontend to derive fee)
    let feeAmount = 0;
    if (fee_option === "customer") {
      // Fee is already included in the total_amount from frontend
      feeAmount = total_amount - subtotal;
    }

    const issueDate = new Date(issue_date);

    if (isNaN(issueDate.getTime())) {
      console.error("Invalid date format:", issue_date);
      return NextResponse.json(
        { message: "Invalid date format" },
        { status: 400 }
      );
    }

    let finalLogoUrl: string | undefined = undefined;

    if (business_logo && business_logo.startsWith("data:image/")) {
      finalLogoUrl =
        (await uploadLogoToStorage(userId, business_logo)) || undefined;
      if (!finalLogoUrl) {
        console.warn("Failed to upload logo, proceeding without it");
      }
    } else if (business_logo && isValidUrl(business_logo)) {
      finalLogoUrl = business_logo;
    } else if (business_logo) {
      console.warn("Invalid logo format provided, proceeding without logo");
    }

    let invoice: any;

    if (isUpdatingDraft && existingInvoiceId) {
      // UPDATE existing draft to final invoice
      console.log(`Updating draft invoice ${invoice_id} to final invoice`);
      
      const { data: updatedInvoice, error: updateError } = await supabase
        .from("invoices")
        .update({
          business_name: business_name,
          business_logo: finalLogoUrl,
          from_email: initiator_email,
          from_name: initiator_name,
          client_name: signee_name || null,
          client_email: signee_email || null,
          client_phone: clientPhone,
          bill_to: bill_to,
          issue_date: issueDate.toISOString().split("T")[0],
          status: status || "unpaid",
          payment_type: payment_type,
          fee_option: fee_option,
          allow_multiple_payments: payment_type === "multiple",
          target_quantity:
            payment_type === "multiple" ? target_quantity || 1 : 1,
          subtotal: subtotal,
          fee_amount: feeAmount,
          total_amount: total_amount,
          message: message,
          customer_note: customer_note,
          redirect_url: redirect_url,
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

      if (updateError) {
        console.error("Supabase update error:", updateError);
        return NextResponse.json(
          { message: "Failed to update draft invoice", error: updateError.message },
          { status: 500 }
        );
      }

      invoice = updatedInvoice;

      // Delete old invoice items and insert new ones
      const { error: deleteError } = await supabase
        .from("invoice_items")
        .delete()
        .eq("invoice_id", existingInvoiceId);

      if (deleteError) {
        console.error("Error deleting old invoice items:", deleteError);
      }

    } else {
      // CREATE new invoice (not from draft)
      console.log(`Creating new invoice: ${invoice_id}`);
      
      const { data: newInvoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert([
          {
            user_id: userId,
            invoice_id: invoiceId,
            order_reference: uuidv4(),
            business_name: business_name,
            business_logo: finalLogoUrl,
            from_email: initiator_email,
            from_name: initiator_name,
            client_name: signee_name || null,
            client_email: signee_email || null,
            client_phone: clientPhone,
            bill_to: bill_to,
            issue_date: issueDate.toISOString().split("T")[0],
            status: status || "unpaid",
            payment_type: payment_type,
            fee_option: fee_option,
            allow_multiple_payments: payment_type === "multiple",
            target_quantity:
              payment_type === "multiple" ? target_quantity || 1 : 1,
            paid_quantity: 0,
            subtotal: subtotal,
            fee_amount: feeAmount,
            total_amount: total_amount,
            paid_amount: 0,
            message: message,
            customer_note: customer_note,
            redirect_url: redirect_url,
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

      if (invoiceError) {
        console.error("Supabase invoice error:", invoiceError);

        if (invoiceError.code === "23505") {
          return NextResponse.json(
            { message: "Invoice with this ID already exists" },
            { status: 409 }
          );
        }

        return NextResponse.json(
          { message: "Failed to save invoice", error: invoiceError.message },
          { status: 500 }
        );
      }

      invoice = newInvoice;
    }

    // Insert invoice items (same for both update and create)
    const { error: itemsError } = await supabase.from("invoice_items").insert(
      invoice_items.map((item) => ({
        invoice_id: invoice.id,
        item_description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_amount: item.total,
      }))
    );

    if (itemsError) {
      console.error("Supabase items error:", itemsError);
      // Only delete if we created a new invoice (not updating draft)
      if (!isUpdatingDraft) {
        await supabase.from("invoices").delete().eq("id", invoice.id);
      }
      return NextResponse.json(
        { message: "Failed to save invoice items", error: itemsError.message },
        { status: 500 }
      );
    }

    // Send email notification only if we have a valid email
    if (signee_email && emailRegex.test(signee_email)) {
      await sendInvoiceEmail({
        to: signee_email,
        subject: `New Invoice from ${initiator_name}`,
        invoiceId,
        amount: total_amount,
        signingLink,
        senderName: initiator_name,
        message,
        businessLogo: finalLogoUrl,
        isMultiplePayments: payment_type === "multiple",
        targetQuantity: target_quantity,
      });
      console.log("Invoice email sent to:", signee_email);
    } else if (payment_type === "multiple") {
      console.log("No email sent for multiple payments (email not required)");
    } else {
      console.log("No email sent - invalid or missing email address");
    }

    return NextResponse.json(
      {
        message: isUpdatingDraft 
          ? "Draft updated and invoice sent successfully" 
          : "Invoice created successfully",
        signingLink,
        invoiceId: invoice.invoice_id,
        targetQuantity: target_quantity,
        paymentType: payment_type,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Invoice creation error:", error);
    return NextResponse.json(
      { message: "Failed to create invoice", error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
     const user = await isAuthenticated(req);
        
        if (!user) {
          return NextResponse.json(
            { error: "Please login to access transactions" },
            { status: 401 }
          );
        }
    
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      );
    }

    const { data: invoices, error } = await supabase
      .from("invoices")
      .select(
        `
        *,
        invoice_items (*)
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase fetch error:", error);
      return NextResponse.json(
        { message: "Failed to fetch invoices", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ invoices }, { status: 200 });
  } catch (error: any) {
    console.error("Fetch invoices error:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}