// lib/email/pin-reset.ts
import { transporter } from "@/lib/node-mailer";

export async function sendPinResetEmail(
  email: string, 
  resetToken: string, 
  userId: string,
  userName?: string
) {
  const baseUrl = process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_DEV_URL
    : process.env.NEXT_PUBLIC_BASE_URL;

  const resetUrl = `${baseUrl}/reset-pin?token=${resetToken}&userId=${userId}`;
  const headerImageUrl = `${baseUrl}/zidwell-header.png`;
  const footerImageUrl = `${baseUrl}/zidwell-footer.png`;

  try {
    await transporter.sendMail({
      from: `Zidwell Security <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Reset Your Transaction PIN - Security Alert",
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
              <div style="text-align:center; margin-bottom:20px;">
                <h2 style="color:#2b825b; margin:0; font-size:24px;">🔒 PIN Reset Required</h2>
              </div>
              
              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-bottom: 20px;">
                <p style="margin: 0; color: #856404;">
                  <strong>Security Notice:</strong> Multiple failed PIN attempts were detected on your account.
                </p>
              </div>
              
              <p>Hello ${userName ? `<strong>${userName}</strong>` : "Valued Customer"},</p>
              
              <p>We received a request to reset your transaction PIN due to multiple failed attempts. For your security, your PIN has been temporarily locked.</p>
              
              <div style="
                background:#f8fafc; 
                padding:20px; 
                border-radius:8px; 
                border-left:4px solid #2b825b; 
                margin:20px 0;
              ">
                <p style="margin:0 0 15px 0; font-weight:bold; font-size:16px; color:#1f2937;">Security Details:</p>
                <div style="display: grid; gap: 10px;">
                  <p style="margin:0;"><strong>Action Required:</strong> Reset Transaction PIN</p>
                  <p style="margin:0;"><strong>Reason:</strong> Multiple failed attempts detected</p>
                  <p style="margin:0;"><strong>Valid Until:</strong> ${new Date(Date.now() + 60 * 60 * 1000).toLocaleString()}</p>
                </div>
              </div>
              
              <p style="margin-bottom: 15px; font-size: 15px;">Click the button below to reset your PIN and regain access to transactions:</p>
              
              <div style="text-align:center; margin:25px 0;">
                <a href="${resetUrl}" 
                   target="_blank"
                   style="
                     display:inline-block;
                     background-color:#2b825b;
                     color:#fff;
                     padding:14px 28px;
                     border-radius:6px;
                     text-decoration:none;
                     font-weight:bold;
                     font-size:16px;
                     box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                   ">
                  🔐 Reset Transaction PIN
                </a>
              </div>
              
              <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center;">
                <p style="margin:0; font-size: 14px; color: #6b7280;">
                  <strong>Alternative:</strong> Copy and paste this link in your browser:<br>
                  <a href="${resetUrl}" style="color:#2b825b; font-size:13px; word-break: break-all;">
                    ${resetUrl}
                  </a>
                </p>
              </div>
              
              <div style="background: #f0f8ff; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                <p style="margin:0 0 10px 0; font-weight:bold; color:#1e40af;">Important Security Information:</p>
                <p style="margin:0; color:#374151; font-size:14px;">
                  • This link will expire in <strong>1 hour</strong><br>
                  • If you didn't request this reset, please contact our support team immediately<br>
                  • Never share this link with anyone<br>
                  • Zidwell will never ask for your PIN via phone or email
                </p>
              </div>
              
              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
                <p style="color:#6b7280; font-size:14px; margin:0;">
                  <strong>Why did this happen?</strong> Multiple incorrect PIN attempts triggered our security system to protect your account. 
                  Resetting your PIN will restore full access to your transactions.
                </p>
              </div>
              
              <div style="margin-top:32px; padding-top:20px; border-top:1px solid #e5e7eb; text-align:center;">
                <p style="font-size:13px; color:#888; margin:0;">– Zidwell Security Team</p>
                <p style="font-size:11px; color:#aaa; margin-top:8px;">
                  If you need assistance, contact us at ${process.env.SUPPORT_EMAIL || "support@zidwell.com"}
                </p>
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
    
    console.log(`PIN reset email sent to: ${email}`);
    return true;
  } catch (error) {
    console.error("PIN reset email send error:", error);
    return false;
  }
}