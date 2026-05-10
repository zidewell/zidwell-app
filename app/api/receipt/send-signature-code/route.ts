import { NextRequest, NextResponse } from "next/server";
import { transporter } from "@/lib/node-mailer";
import { createClient } from "@supabase/supabase-js";

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

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: signeeEmail,
      subject: `Verification Code for Receipt #${receipt.receipt_id}`,
      html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verification Code - Zidwell Receipts</title>
    <style>
        body { margin: 0; padding: 0; font-family: 'Inter', Arial, sans-serif; background-color: #f9fafb; }
        .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; }
        .content-section { padding: 40px 30px; }
        .code-display { 
            font-family: 'Courier New', monospace; 
            font-size: 36px; 
            font-weight: bold; 
            letter-spacing: 8px; 
            color: #FDC020;
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background: rgba(253, 192, 32, 0.1);
            border-radius: 12px;
            border: 2px dashed #FDC020;
        }
        .security-note { 
            background: rgba(0, 182, 79, 0.1);
            border-left: 4px solid #00B64F;
            padding: 15px;
            margin: 20px 0;
            border-radius: 8px;
        }
        .receipt-details {
            background: #f8fafc;
            padding: 20px;
            border-radius: 12px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <img src="${headerImageUrl}" alt="Zidwell Header" style="width: 100%; max-width: 600px; display: block;" />
        
        <div class="content-section">
            <h1 style="color: #191919; text-align: center; margin-bottom: 10px;">
                Your Verification Code
            </h1>
            <p style="text-align: center; color: #666666; margin-bottom: 30px;">
                Use this code to verify your identity and sign the receipt
            </p>
            
            <div class="code-display">
                ${verificationCode}
            </div>
            
            <div class="receipt-details">
                <h3 style="color: #191919; margin-top: 0;">Receipt Details</h3>
                <p style="margin: 8px 0;"><strong>From:</strong> ${businessName || receipt.business_name}</p>
                <p style="margin: 8px 0;"><strong>To:</strong> ${signeeName || receipt.client_name}</p>
                <p style="margin: 8px 0;"><strong>Amount:</strong> ₦${(totalAmount || receipt.total || 0).toLocaleString()}</p>
                <p style="margin: 8px 0;"><strong>Receipt ID:</strong> ${receipt.receipt_id}</p>
            </div>
            
            <div class="security-note">
                <p style="margin: 0; color: #00B64F; font-weight: 500;">
                    🔒 For your security, never share this code with anyone. 
                    Zidwell will never ask for your verification code via phone or other channels.
                </p>
            </div>
            
            <p style="color: #666666; font-size: 12px; text-align: center; margin-top: 30px;">
                This code will expire in 30 minutes. If you didn't request this code, please ignore this email.
            </p>
        </div>
        
        <img src="${footerImageUrl}" alt="Zidwell Footer" style="width: 100%; max-width: 600px; display: block;" />
    </div>
</body>
</html>`,
    };

    await transporter.sendMail(mailOptions);

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