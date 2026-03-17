import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAuditLog, getClientInfo } from "@/lib/audit-log";
import { requireAdmin } from "@/lib/admin-auth";
import { transporter } from "@/lib/node-mailer";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Helper function to extract admin user info from cookies
async function getAdminUserInfo(cookieHeader: string) {
  try {
    const accessTokenMatch = cookieHeader.match(/sb-access-token=([^;]+)/);
    if (!accessTokenMatch) return null;

    const accessToken = accessTokenMatch[1];

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      console.error("Error getting admin user:", error);
      return null;
    }

    const { data: adminUser } = await supabase
      .from("users")
      .select("first_name, last_name, email, admin_role")
      .eq("id", user.id)
      .single();

    return {
      id: user.id,
      email: adminUser?.email || user.email,
      first_name: adminUser?.first_name,
      last_name: adminUser?.last_name,
      admin_role: adminUser?.admin_role || user.user_metadata?.role,
    };
  } catch (error) {
    console.error("Error extracting admin user info:", error);
    return null;
  }
}

// Helper function to get sender display name - PRIORITIZE FIRST NAME
function getSenderDisplayName(adminUser: any) {
  if (adminUser?.first_name) {
    return adminUser.first_name;
  }

  if (adminUser?.email) {
    const emailName = adminUser.email.split("@")[0];
    return emailName.charAt(0).toUpperCase() + emailName.slice(1);
  }

  return "Zidwell Team";
}

const parseMarkdown = (text: string, context: "email" | "app" = "app") => {
  if (!text) return "";

  console.log("parseMarkdown input (first 200 chars):", text.substring(0, 200));

  let processed = text;

  // First, check if the text contains HTML tags that are already escaped
  if (processed.includes("&lt;") || processed.includes("&gt;")) {
    console.log("Found escaped HTML, unescaping...");
    processed = processed
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }

  if (context === "email") {
    // CRITICAL FIX: Handle image tags FIRST, before any other processing
    // Match img tags with src attribute
    const imgRegex = /<img\s+([^>]*)src=["']([^"']+)["']([^>]*)>/gi;

    processed = processed.replace(
      imgRegex,
      (match, beforeSrc, src, afterSrc) => {
        console.log("Processing img tag with src:", src.substring(0, 100));

        // Check if it's a base64 image
        if (src.startsWith("data:image")) {
          return `<div style="background: #f8fafc; padding: 15px; border-radius: 6px; border-left: 4px solid #2b825b; margin: 15px 0; font-size: 14px; color: #666666; text-align: center;">
                  🖼️ <strong>Image included in notification</strong><br>
                  <small>(View in the app to see the image)</small>
                </div>`;
        }

        // For uploaded images, create email-friendly version
        return `
        <div style="margin: 20px 0; text-align: center;">
          <img 
            src="${src}" 
            alt="Notification Image" 
            style="display: block; max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #e5e7eb; margin: 0 auto; max-width: 600px; width: 100%;"
            width="600"
            border="0"
          />
        </div>
      `;
      },
    );

    // Also handle markdown image syntax
    processed = processed.replace(
      /!\[([^\]]*)\]\(([^)]+)\)/g,
      (match, altText, imageUrl) => {
        if (imageUrl.startsWith("data:image")) {
          return `<div style="background: #f8fafc; padding: 15px; border-radius: 6px; border-left: 4px solid #2b825b; margin: 15px 0; font-size: 14px; color: #666666; text-align: center;">
                    🖼️ <strong>${
                      altText || "Image included in notification"
                    }</strong><br>
                    <small>(View in the app to see the image)</small>
                  </div>`;
        }

        return `
          <div style="margin: 20px 0; text-align: center;">
            <img 
              src="${imageUrl}" 
              alt="${altText || "Notification Image"}" 
              style="display: block; max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #e5e7eb; margin: 0 auto; max-width: 600px; width: 100%;"
              width="600"
              border="0"
            />
            ${
              altText
                ? `<div style="font-size: 12px; color: #6b7280; margin-top: 10px; font-style: italic;">${altText}</div>`
                : ""
            }
          </div>
        `;
      },
    );
  }

  // Then handle other markdown formatting...
  // (keep your existing code for headers, bold, italic, etc.)

  console.log(
    "parseMarkdown output (first 200 chars):",
    processed.substring(0, 200),
  );
  return processed;
};
// Function to extract image URLs from markdown
function extractImageUrlsFromMarkdown(markdown: string): string[] {
  const imageUrls: string[] = [];

  // Match HTML img tags
  const htmlImgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*>/g;
  let match;

  while ((match = htmlImgRegex.exec(markdown)) !== null) {
    const url = match[1];
    if (url && !url.startsWith("#") && !url.startsWith("data:image")) {
      imageUrls.push(url);
    }
  }

  // Match markdown image syntax
  const mdImgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  while ((match = mdImgRegex.exec(markdown)) !== null) {
    const url = match[2];
    if (url && !url.startsWith("#") && !url.startsWith("data:image")) {
      imageUrls.push(url);
    }
  }

  return imageUrls;
}

// Function to delete images from storage
async function deleteImagesFromStorage(imageUrls: string[]) {
  try {
    const imagesToDelete: string[] = [];

    // Extract file paths from URLs
    for (const url of imageUrls) {
      try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split("/");
        const bucketIndex = pathParts.indexOf("notification-images");

        if (bucketIndex !== -1 && bucketIndex + 1 < pathParts.length) {
          const filePath = pathParts.slice(bucketIndex + 1).join("/");
          imagesToDelete.push(filePath);
        }
      } catch (error) {
        console.error("Error parsing URL:", url, error);
      }
    }

    if (imagesToDelete.length > 0) {
      const { error } = await supabase.storage
        .from("notification-images")
        .remove(imagesToDelete);

      if (error) {
        console.error("Error deleting images:", error);
      }
    }
  } catch (error) {
    console.error("Error in deleteImagesFromStorage:", error);
  }
}

// Updated sendEmailNotification function with enhanced image support
async function sendEmailNotification({
  to,
  subject,
  message,
  type = "info",
  adminUser,
}: {
  to: string;
  subject: string;
  message: string;
  type?: string;
  adminUser: any;
}) {
  try {
    console.log(`📧 Sending email to: ${to}`);

    const emailHtml = parseMarkdown(message, "email");

    const senderName = getSenderDisplayName(adminUser);
    const signatureName =
      senderName !== "Zidwell Team" ? senderName : "Zidwell Team";

    // Create plain text version
    const plainText = message
      .replace(/<[^>]*>/g, "")
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "Image: $1")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/~~(.*?)~~/g, "$1")
      .replace(/\n{3,}/g, "\n\n");

    const mailOptions = {
      from: `Zidwell <${process.env.EMAIL_USER}>`,
      to,
      subject: `🔔 ${subject}`,
      html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { 
          font-family: Arial, Helvetica, sans-serif; 
          line-height: 1.6; 
          color: #333333; 
          margin: 0; 
          padding: 0; 
          background-color: #F9F9F9;
          -webkit-text-size-adjust: 100%;
          -ms-text-size-adjust: 100%;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px; 
          background-color: #ffffff;
        }
        .header { 
          background: linear-gradient(135deg, #2b825b 0%, #a87e06 100%);
          padding: 30px 20px; 
          border-radius: 10px 10px 0 0; 
          margin-bottom: 30px; 
          text-align: center;
          color: white;
        }
        .content { 
          background: white; 
          padding: 40px 30px; 
          border-radius: 0 0 10px 10px; 
          border: 1px solid #e5e7eb; 
        }
        .message-content {
          background: #f8fafc;
          padding: 25px;
          border-radius: 8px;
          border-left: 4px solid #2b825b;
          margin: 30px 0;
          font-size: 16px;
          line-height: 1.6;
        }
        .message-content img {
          max-width: 100% !important;
          height: auto !important;
          display: block !important;
          margin: 20px auto !important;
          border-radius: 8px !important;
          border: 1px solid #e5e7eb !important;
        }
        .footer { 
          margin-top: 40px; 
          padding-top: 30px; 
          border-top: 1px solid #e5e7eb; 
          color: #6b7280; 
          font-size: 14px;
          text-align: center;
        }
        .logo { 
          font-size: 28px; 
          font-weight: bold; 
          margin-bottom: 15px;
          color: white;
        }
        .headline {
          font-size: 24px;
          font-weight: bold;
          margin: 0 0 20px 0;
          line-height: 1.4;
        }
        .zidwell-brand {
          color: #2b825b;
          font-weight: bold;
        }
        .support-link {
          color: #2b825b;
          text-decoration: none;
          font-weight: 500;
        }
        .support-link:hover {
          text-decoration: underline;
        }
        .paragraph {
          margin-bottom: 20px;
          font-size: 16px;
          line-height: 1.6;
        }
        .signature {
          margin-top: 30px;
          font-style: italic;
          color: #666666;
        }
        @media only screen and (max-width: 600px) {
          .container {
            padding: 15px;
            width: 100% !important;
          }
          .content {
            padding: 30px 20px;
          }
          .header {
            padding: 30px 15px;
          }
          .logo {
            font-size: 24px;
          }
          .headline {
            font-size: 22px;
          }
          .message-content {
            padding: 20px;
            font-size: 16px;
          }
          .message-content img {
            margin: 10px auto !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
        <div class="logo">It's ${senderName} at Zidwell</div>
         
          <hr style="border: none; height: 1px; background: rgba(255, 255, 255, 0.3); margin: 20px 0;"/>
          <h1 class="headline">${subject}</h1>
        </div>
        
        <div class="content">
          <p class="paragraph">Hello,</p>
          
          <div class="message-content">
            ${emailHtml}
          </div>
          
          <p class="paragraph">Thank you for choosing <span class="zidwell-brand">Zidwell</span>.</p>
          
          <div class="signature">
            With love from ${signatureName}
          </div>
        </div>
        
        <div class="footer">
          <p class="paragraph">This is an automated notification from the <span class="zidwell-brand">Zidwell</span> platform.</p>
          <p class="paragraph">If you have any questions, please contact our <a href="mailto:support@zidwell.com" class="support-link">support team</a>.</p>
          <p style="margin-top: 30px; font-size: 12px; color: #9ca3af; line-height: 1.4;">
            &copy; ${new Date().getFullYear()} Zidwell. All rights reserved.<br>
            Empowering your financial journey
          </p>
        </div>
      </div>
    </body>
    </html>

  `,
      text: plainText,
    };
    const result = await transporter.sendMail(mailOptions);

    console.log(`✅ Email sent successfully to: ${to}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown email error",
    };
  }
}

async function sendNotificationToUsers({
  title,
  message,
  type,
  target_audience,
  specific_users = [],
  channels = ["in_app"],
  admin_notification_id,
  adminUser,
}: {
  title: string;
  message: string;
  type: string;
  target_audience: string;
  specific_users?: string[];
  channels?: string[];
  admin_notification_id: string;
  adminUser: any;
}) {
  try {
    console.log("Sending notification to users...");

    let userQuery = supabase
      .from("users")
      .select("id, email, first_name, last_name, notification_preferences");

    // Handle specific users targeting
    if (target_audience === "specific_users" && specific_users.length > 0) {
      userQuery = userQuery.in("id", specific_users);
    } else {
      // Handle other target audiences
      switch (target_audience) {
        case "premium_users":
          userQuery = userQuery.eq("subscription_tier", "premium");
          break;
        case "new_users":
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          userQuery = userQuery.gte("created_at", thirtyDaysAgo.toISOString());
          break;
        case "inactive_users":
          const twoWeeksAgo = new Date();
          twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
          userQuery = userQuery.lt("last_login", twoWeeksAgo.toISOString());
          break;
      }
    }

    const { data: users, error: usersError } = await userQuery;

    if (usersError) {
      console.error("Error fetching users:", usersError);
      throw usersError;
    }

    console.log(`Found ${users?.length || 0} users`);

    if (!users || users.length === 0) {
      throw new Error("No users found for the target audience");
    }

    // Track delivery results
    const deliveryResults = {
      in_app: { successful: 0, failed: 0 },
      email: { successful: 0, failed: 0 },
      total: users.length,
    };

    // Create in-app notifications
    if (channels.includes("in_app")) {
      try {
        // Parse message for in-app display
        const inAppMessage = parseMarkdown(message, "app");

        const notifications = users.map((user) => ({
          user_id: user.id,
          title,
          message: inAppMessage,
          type,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        const { data, error: insertError } = await supabase
          .from("notifications")
          .insert(notifications)
          .select();

        if (insertError) {
          console.error("Error creating in-app notifications:", insertError);
          deliveryResults.in_app.failed = users.length;
        } else {
          deliveryResults.in_app.successful = data?.length || 0;
          deliveryResults.in_app.failed = users.length - (data?.length || 0);
        }
      } catch (error) {
        console.error("Error in in-app notification creation:", error);
        deliveryResults.in_app.failed = users.length;
      }
    }

    // Send email notifications
    if (channels.includes("email")) {
      console.log(`Sending ${users.length} email notifications...`);

      const emailPromises = users.map(async (user) => {
        try {
          const emailResult = await sendEmailNotification({
            to: user.email,
            subject: title,
            message,
            type,
            adminUser,
          });

          return {
            userId: user.id,
            email: user.email,
            success: emailResult.success,
            error: emailResult.error,
          };
        } catch (error) {
          return {
            userId: user.id,
            email: user.email,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      });

      const emailResults = await Promise.all(emailPromises);

      deliveryResults.email.successful = emailResults.filter(
        (r) => r.success,
      ).length;
      deliveryResults.email.failed = emailResults.filter(
        (r) => !r.success,
      ).length;

      console.log(
        `Email results: ${deliveryResults.email.successful} successful, ${deliveryResults.email.failed} failed`,
      );
    }

    // Update admin notification with delivery stats
    await supabase
      .from("admin_notifications")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        stats: {
          total_users: users.length,
          successful:
            deliveryResults.in_app.successful +
            deliveryResults.email.successful,
          failed: deliveryResults.in_app.failed + deliveryResults.email.failed,
          in_app_sent: deliveryResults.in_app.successful,
          in_app_failed: deliveryResults.in_app.failed,
          email_sent: deliveryResults.email.successful,
          email_failed: deliveryResults.email.failed,
          users_notified: users.map((u) => ({
            id: u.id,
            email: u.email,
            name: `${u.first_name} ${u.last_name}`,
          })),
          sender_name: getSenderDisplayName(adminUser),
        },
      })
      .eq("id", admin_notification_id);

    return {
      success: true,
      total: users.length,
      successful:
        deliveryResults.in_app.successful + deliveryResults.email.successful,
      failed: deliveryResults.in_app.failed + deliveryResults.email.failed,
      deliveryResults,
      sender: getSenderDisplayName(adminUser),
    };
  } catch (error) {
    console.error("Error sending notification to users:", error);

    await supabase
      .from("admin_notifications")
      .update({
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
        sent_at: new Date().toISOString(),
      })
      .eq("id", admin_notification_id);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check admin authentication
    const adminUser = await requireAdmin(req);
    if (adminUser instanceof NextResponse) return adminUser;

    const allowedRoles = ["super_admin", "operations_admin", "support_admin"];
    if (!allowedRoles.includes(adminUser?.admin_role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    // Parse request body
    const body = await req.json();

    // Validate required fields
    if (!body.title || !body.message) {
      return NextResponse.json(
        { error: "Title and message are required" },
        { status: 400 },
      );
    }

    // Validate specific users selection
    if (
      body.target_audience === "specific_users" &&
      (!body.specific_users || body.specific_users.length === 0)
    ) {
      return NextResponse.json(
        {
          error:
            "At least one user must be selected for specific user notifications",
        },
        { status: 400 },
      );
    }

    // Validate channels
    if (!body.channels || body.channels.length === 0) {
      return NextResponse.json(
        { error: "At least one channel must be selected" },
        { status: 400 },
      );
    }

    // Create audit log for notification creation
    await createAuditLog({
      userId: adminUser?.id,
      userEmail: adminUser?.email,
      action: "create_notification",
      resourceType: "Notification",
      description: `Created notification: "${body.title}"`,
      metadata: {
        title: body.title,
        targetAudience: body.target_audience,
        type: body.type,
      },
    });

    // Prepare notification data
    const notificationData: any = {
      title: body.title,
      message: body.message,
      type: body.type || "info",
      target_audience: body.target_audience || "all_users",
      specific_users:
        body.specific_users?.length > 0 ? body.specific_users : [],
      channels: body.channels || ["in_app"],
      is_urgent: body.is_urgent || false,
      status: body.scheduled_for ? "scheduled" : "sending",
      created_by: adminUser?.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Add optional fields only if they have values
    if (body.scheduled_for) {
      notificationData.scheduled_for = body.scheduled_for;
    }

    // Insert into database
    const { data: notification, error: notifError } = await supabase
      .from("admin_notifications")
      .insert(notificationData)
      .select()
      .single();

    if (notifError) {
      console.error("Database insertion error:", notifError);
      throw notifError;
    }

    // If notification is scheduled, return success without sending immediately
    if (body.scheduled_for) {
      return NextResponse.json({
        success: true,
        notification: {
          ...notification,
          status: "scheduled",
        },
        message: "Notification scheduled successfully",
      });
    }

    // Send notification immediately if not scheduled
    const sendResult = await sendNotificationToUsers({
      title: body.title,
      message: body.message,
      type: body.type || "info",
      target_audience: body.target_audience || "all_users",
      specific_users: body.specific_users || [],
      channels: body.channels || ["in_app"],
      admin_notification_id: notification.id,
      adminUser,
    });

    return NextResponse.json({
      success: sendResult.success,
      notification: {
        ...notification,
        status: sendResult.success ? "sent" : "failed",
      },
      sendResult,
      message: sendResult.success
        ? "Notification sent successfully"
        : "Failed to send notification",
    });
  } catch (error: any) {
    console.error("Notification creation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const adminUser = await requireAdmin(req);
    if (adminUser instanceof NextResponse) return adminUser;

    const allowedRoles = ["super_admin", "operations_admin", "support_admin"];
    if (!allowedRoles.includes(adminUser?.admin_role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "15");
    const search = searchParams.get("search");
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const range = searchParams.get("range");

    const offset = (page - 1) * limit;

    let query = supabase
      .from("admin_notifications")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(`title.ilike.%${search}%,message.ilike.%${search}%`);
    }

    if (type && type !== "all") {
      query = query.eq("type", type);
    }

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (range && range !== "total") {
      const date = new Date();
      switch (range) {
        case "today":
          date.setHours(0, 0, 0, 0);
          query = query.gte("created_at", date.toISOString());
          break;
        case "week":
          date.setDate(date.getDate() - 7);
          query = query.gte("created_at", date.toISOString());
          break;
        case "month":
          date.setMonth(date.getMonth() - 1);
          query = query.gte("created_at", date.toISOString());
          break;
      }
    }

    query = query.range(offset, offset + limit - 1);

    const { data: notifications, error, count } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      notifications: notifications || [],
      total: count || 0,
      page,
      limit,
    });
  } catch (error: any) {
    console.error("Fetch notifications error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const adminUser = await requireAdmin(req);
    if (adminUser instanceof NextResponse) return adminUser;

    const allowedRoles = ["super_admin", "operations_admin"];
    if (!allowedRoles.includes(adminUser?.admin_role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Notification ID is required" },
        { status: 400 },
      );
    }

    const { data: existingNotification, error: fetchError } = await supabase
      .from("admin_notifications")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Notification not found" },
          { status: 404 },
        );
      }
      throw fetchError;
    }

    if (existingNotification.status === "sent") {
      return NextResponse.json(
        { error: "Cannot delete already sent notifications" },
        { status: 400 },
      );
    }

    // Extract image URLs from the message before deleting
    const imageUrls = extractImageUrlsFromMarkdown(
      existingNotification.message,
    );

    // Delete the notification
    const { error } = await supabase
      .from("admin_notifications")
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }

    // Delete associated images from storage (async)
    if (imageUrls.length > 0) {
      deleteImagesFromStorage(imageUrls).catch((error) => {
        console.error("Failed to delete images:", error);
      });
    }

    // Create audit log for deletion
    await createAuditLog({
      userId: adminUser?.id,
      userEmail: adminUser?.email,
      action: "delete_notification",
      resourceType: "Notification",
      resourceId: id,
      description: `Deleted notification: "${existingNotification.title}"`,
      metadata: {
        title: existingNotification.title,
        status: existingNotification.status,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete notification error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const adminUser = await getAdminUserInfo(cookieHeader);

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Notification ID is required" },
        { status: 400 },
      );
    }

    // Get current notification state
    const { data: currentNotification, error: fetchError } = await supabase
      .from("admin_notifications")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 },
      );
    }

    // Prevent updates to sent notifications
    if (currentNotification.status === "sent") {
      return NextResponse.json(
        { error: "Cannot modify already sent notifications" },
        { status: 400 },
      );
    }

    // If message is being updated, check for image changes
    let imagesToDelete: string[] = [];
    if (updates.message && updates.message !== currentNotification.message) {
      // Extract old image URLs
      const oldImageUrls = extractImageUrlsFromMarkdown(
        currentNotification.message,
      );
      const newImageUrls = extractImageUrlsFromMarkdown(updates.message);

      // Find images that were removed
      imagesToDelete = oldImageUrls.filter(
        (url) => !newImageUrls.includes(url),
      );
    }

    // Handle scheduled_for updates
    let status = currentNotification.status;
    if (updates.scheduled_for !== undefined) {
      if (updates.scheduled_for) {
        status = "scheduled";
      } else if (currentNotification.status === "scheduled") {
        status = "draft";
      }
    }

    // Prepare update data
    const updateData: any = {
      ...updates,
      status,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedNotification, error } = await supabase
      .from("admin_notifications")
      .update(updateData)
      .select()
      .single();

    if (error) throw error;

    // Delete orphaned images (async)
    if (imagesToDelete.length > 0) {
      deleteImagesFromStorage(imagesToDelete).catch((error) => {
        console.error("Failed to delete orphaned images:", error);
      });
    }

    // Create audit log for update
    await createAuditLog({
      userId: adminUser?.id,
      userEmail: adminUser?.email,
      action: "update_notification",
      resourceType: "Notification",
      resourceId: id,
      description: `Updated notification: "${currentNotification.title}"`,
      metadata: {
        title: currentNotification.title,
        changedFields: Object.keys(updates),
      },
    });

    return NextResponse.json({
      notification: updatedNotification,
      message: "Notification updated successfully",
    });
  } catch (error: any) {
    console.error("Update notification error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const adminUser = await requireAdmin(req);
    if (adminUser instanceof NextResponse) return adminUser;

    const allowedRoles = ["super_admin", "operations_admin"];
    if (!allowedRoles.includes(adminUser?.admin_role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const { id, ...updates } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Notification ID is required" },
        { status: 400 },
      );
    }

    // Get current notification state
    const { data: currentNotification, error: fetchError } = await supabase
      .from("admin_notifications")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 },
      );
    }

    // Check if notification can be sent
    if (currentNotification.status === "sent") {
      return NextResponse.json(
        { error: "Cannot update and send already sent notifications" },
        { status: 400 },
      );
    }

    // If message is being updated, check for image changes
    let imagesToDelete: string[] = [];
    if (updates.message && updates.message !== currentNotification.message) {
      // Extract old image URLs
      const oldImageUrls = extractImageUrlsFromMarkdown(
        currentNotification.message,
      );
      const newImageUrls = extractImageUrlsFromMarkdown(updates.message);

      // Find images that were removed
      imagesToDelete = oldImageUrls.filter(
        (url) => !newImageUrls.includes(url),
      );
    }

    // First update the notification
    const updateData = {
      ...updates,
      status: "sending",
      updated_at: new Date().toISOString(),
    };

    const { data: updatedNotification, error: updateError } = await supabase
      .from("admin_notifications")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Delete orphaned images (async)
    if (imagesToDelete.length > 0) {
      deleteImagesFromStorage(imagesToDelete).catch((error) => {
        console.error("Failed to delete orphaned images:", error);
      });
    }

    // Send the notification
    const sendResult = await sendNotificationToUsers({
      title: updatedNotification.title,
      message: updatedNotification.message,
      type: updatedNotification.type,
      target_audience: updatedNotification.target_audience,
      specific_users: updatedNotification.specific_users || [],
      channels: updatedNotification.channels,
      admin_notification_id: updatedNotification.id,
      adminUser,
    });

    return NextResponse.json({
      success: sendResult.success,
      notification: updatedNotification,
      sendResult,
      message: sendResult.success
        ? "Notification updated and sent successfully"
        : "Failed to send notification after update",
    });
  } catch (error: any) {
    console.error("Update and send notification error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
