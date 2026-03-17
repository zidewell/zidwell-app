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

// Generate a 6-digit verification code
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

    // Get contract from Supabase
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

    // Verify email matches
    if (contract.signee_email !== signeeEmail) {
      return NextResponse.json(
        { error: "Email does not match the contract signee" },
        { status: 403 },
      );
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();

    // Update contract with verification code
    const { error: updateError } = await supabase
      .from("contracts")
      .update({
        verification_code: verificationCode,
        verification_code_sent_at: new Date().toISOString(),
        verification_code_expires_at: new Date(
          Date.now() + 30 * 60 * 1000,
        ).toISOString(), // 30 minutes
        verification_failed_attempts: 0, // Reset failed attempts
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

    // Send email with verification code
    await transporter.sendMail({
      from: `Zidwell Contracts <${process.env.EMAIL_USER}>`,
      to: signeeEmail,
      subject: `Your Signature Verification Code - ${
        contract.contract_title || "Contract"
      }`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Signature Verification - Zidwell Finance</title>
    
    <style>
        /* Base Styles */
        body {
            margin: 0;
            padding: 0;
            font-family: Arial, Helvetica, sans-serif;
            background-color: #f9fafb;
            color: #374151;
            line-height: 1.6;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            overflow: hidden;
        }
        
        .content-section {
            padding: 40px 30px;
        }
        
        .info-card {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }
        
        .verification-code-box {
            text-align: center;
            margin-bottom: 25px;
        }
        
        .code-display {
            display: inline-block;
            background: #f0f9ff;
            border: 2px dashed #2b825b;
            padding: 30px 50px;
            border-radius: 12px;
        }
        
        .security-notice {
            background: #f0fff4;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #38a169;
            margin: 20px 0;
        }
        
        /* Typography */
        .text-primary { color: #111827 !important; }
        .text-secondary { color: #6b7280 !important; }
        .text-accent { color: #2b825b !important; }
        .text-success { color: #2f855a !important; }
        
        .text-sm { font-size: 14px !important; }
        .text-base { font-size: 16px !important; }
        .text-lg { font-size: 20px !important; }
        .text-xl { font-size: 24px !important; }
        
        .font-semibold { font-weight: 600 !important; }
        .font-bold { font-weight: 700 !important; }
        
        /* Mobile Responsive */
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
<body style="margin:0; padding:0; background-color:#f9fafb;">
    <div class="email-container">
        <!-- ================= CUSTOM HEADER ================= -->
        <img src="${headerImageUrl}" alt="Zidwell Header" style="width: 100%; max-width: 600px; display: block; margin-bottom: 20px;" />

        <!-- ================= CONTENT ================= -->
        <div class="content-section">
            
            <!-- Contract Information -->
            <div class="info-card">
                <h2 class="text-lg font-bold text-primary" style="margin: 0 0 15px 0;">Verification Required</h2>
                <p class="text-base text-secondary" style="margin: 0;">
                    You're about to sign: <strong>"${
                      contract.contract_title || "Contract"
                    }"</strong>
                </p>
                <div class="text-sm text-accent" style="margin-top: 10px;">
                    <strong>Parties:</strong> ${
                      contract.initiator_name
                    } & ${signeeName}
                </div>
            </div>
            
            <!-- Verification Code -->
            <div class="verification-code-box">
                <div class="code-display">
                    <div style="font-size: 12px; color: #2b825b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; font-weight: 600;">
                        Verification Code
                    </div>
                    <div style="font-size: 40px; font-weight: 700; letter-spacing: 8px; color: #1a365d; font-family: monospace; margin: 15px 0;">
                        ${verificationCode}
                    </div>
                    <div style="font-size: 14px; color: #718096; margin-top: 10px;">
                        ⏱️ Valid for 30 minutes
                    </div>
                </div>
            </div>
            
            <!-- Security Notice -->
            <div class="security-notice">
                <p class="font-semibold text-success" style="margin: 0 0 8px 0;">
                    🔒 Security Notice
                </p>
                <p style="margin: 0; color: #2f855a; font-size: 14px;">
                    For your security, never share this code with anyone. Zidwell will never ask for this code via phone or other channels.
                </p>
            </div>
            
            <!-- Warning -->
            <div style="margin-top: 25px; padding: 15px; background: #fef2f2; border-radius: 8px; border: 1px solid #fecaca;">
                <p style="margin: 0; color: #dc2626; font-size: 14px; text-align: center;">
                    ⚠️ If you didn't request this code, please ignore this email or contact support if you're concerned.
                </p>
            </div>
            
            <!-- Automated Message -->
            <div style="background: #fefcf5; padding: 15px; text-align: center; margin-top: 25px; border-radius: 8px;">
                <p style="margin: 0; color: #2b825b; font-size: 12px;">
                    This is an automated message from Zidwell Contracts. Please do not reply to this email.
                </p>
            </div>
        </div>

        <!-- ================= CUSTOM FOOTER ================= -->
        <img src="${footerImageUrl}" alt="Zidwell Footer" style="width: 100%; max-width: 600px; display: block; margin-top: 20px;" />

    </div>
</body>
</html>
  `,
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
