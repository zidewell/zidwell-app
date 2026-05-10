// app/api/contract/send-signature-code/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { transporter } from "@/lib/node-mailer";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const baseUrl =
  process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_DEV_URL
    : process.env.NEXT_PUBLIC_BASE_URL;

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const { contractToken, signeeEmail, signeeName } = await request.json();

    if (!contractToken || !signeeEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const { data: contract, error } = await supabase
      .from("contracts")
      .select("*")
      .eq("token", contractToken)
      .single();

    if (error || !contract) {
      console.error("Contract not found:", error);
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 },
      );
    }

    if (contract.signee_email !== signeeEmail) {
      return NextResponse.json(
        { error: "Email does not match the contract signee" },
        { status: 403 },
      );
    }

    const verificationCode = generateVerificationCode();

    const { error: updateError } = await supabase
      .from("contracts")
      .update({
        verification_code: verificationCode,
        verification_code_sent_at: new Date().toISOString(),
        verification_code_expires_at: new Date(
          Date.now() + 30 * 60 * 1000,
        ).toISOString(),
        verification_failed_attempts: 0,
      })
      .eq("token", contractToken);

    if (updateError) {
      console.error("Error updating verification code:", updateError);
      return NextResponse.json(
        { error: "Failed to generate verification code" },
        { status: 500 },
      );
    }

    const headerImageUrl = `${baseUrl}/zidwell-header.png`;
    const footerImageUrl = `${baseUrl}/zidwell-footer.png`;

    await transporter.sendMail({
      from: `Zidwell Contracts <${process.env.EMAIL_USER}>`,
      to: signeeEmail,
      subject: `Your Signature Verification Code - ${
        contract.contract_title || "Contract"
      }`,
      html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Signature Verification - Zidwell Finance</title>
    
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Inter', Arial, Helvetica, sans-serif;
            background-color: #f9fafb;
            color: #666666;
            line-height: 1.6;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
        }
        
        .content-section {
            padding: 40px 30px;
        }
        
        .info-card {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
        }
        
        .verification-code-box {
            text-align: center;
            margin-bottom: 25px;
        }
        
        .code-display {
            display: inline-block;
            background: rgba(253, 192, 32, 0.1);
            border: 2px dashed #FDC020;
            padding: 30px 50px;
            border-radius: 16px;
        }
        
        .security-notice {
            background: rgba(0, 182, 79, 0.1);
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #00B64F;
            margin: 20px 0;
        }
        
        .text-primary { color: #191919 !important; }
        .text-secondary { color: #666666 !important; }
        .text-accent { color: #FDC020 !important; }
        .text-success { color: #00B64F !important; }
        
        .text-sm { font-size: 14px !important; }
        .text-base { font-size: 16px !important; }
        .text-lg { font-size: 20px !important; }
        .text-xl { font-size: 24px !important; }
        
        .font-semibold { font-weight: 600 !important; }
        .font-bold { font-weight: 700 !important; }
        
        @media screen and (max-width: 600px) {
            .content-section {
                padding: 30px 20px !important;
            }
            .code-display {
                padding: 20px 30px !important;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <img src="${headerImageUrl}" alt="Zidwell Header" style="width: 100%; max-width: 600px; display: block;" />

        <div class="content-section">
            <div class="info-card">
                <h2 class="text-lg font-bold text-primary" style="margin: 0 0 15px 0;">Verification Required</h2>
                <p class="text-base text-secondary" style="margin: 0;">
                    You're about to sign: <strong>"${contract.contract_title || "Contract"}"</strong>
                </p>
                <div class="text-sm text-accent" style="margin-top: 10px;">
                    <strong>Parties:</strong> ${contract.initiator_name} & ${signeeName}
                </div>
            </div>
            
            <div class="verification-code-box">
                <div class="code-display">
                    <div style="font-size: 12px; color: #FDC020; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; font-weight: 600;">
                        Verification Code
                    </div>
                    <div style="font-size: 40px; font-weight: 700; letter-spacing: 8px; color: #FDC020; font-family: monospace; margin: 15px 0;">
                        ${verificationCode}
                    </div>
                    <div style="font-size: 14px; color: #666666; margin-top: 10px;">
                        ⏱️ Valid for 30 minutes
                    </div>
                </div>
            </div>
            
            <div class="security-notice">
                <p class="font-semibold text-success" style="margin: 0 0 8px 0;">
                    🔒 Security Notice
                </p>
                <p style="margin: 0; color: #00B64F; font-size: 14px;">
                    For your security, never share this code with anyone. Zidwell will never ask for this code via phone or other channels.
                </p>
            </div>
            
            <div style="margin-top: 25px; padding: 15px; background: #fef2f2; border-radius: 8px; border: 1px solid #fecaca;">
                <p style="margin: 0; color: #dc2626; font-size: 14px; text-align: center;">
                    ⚠️ If you didn't request this code, please ignore this email or contact support if you're concerned.
                </p>
            </div>
            
            <div style="background: rgba(253, 192, 32, 0.05); padding: 15px; text-align: center; margin-top: 25px; border-radius: 8px;">
                <p style="margin: 0; color: #FDC020; font-size: 12px;">
                    This is an automated message from Zidwell Contracts. Please do not reply to this email.
                </p>
            </div>
        </div>

        <img src="${footerImageUrl}" alt="Zidwell Footer" style="width: 100%; max-width: 600px; display: block;" />
    </div>
</body>
</html>`,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Verification code sent successfully",
        data: {
          email: signeeEmail,
          expiresIn: "30 minutes",
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in contract/send-signature-code:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to send verification code",
      },
      { status: 500 },
    );
  }
}