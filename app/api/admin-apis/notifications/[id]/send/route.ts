import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAuditLog, getClientInfo } from '@/lib/audit-log';
import { requireAdmin } from "@/lib/admin-auth";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to extract admin user info from cookies
async function getAdminUserInfo(cookieHeader: string) {
  try {
    // Extract access token from cookies
    const accessTokenMatch = cookieHeader.match(/sb-access-token=([^;]+)/);
    if (!accessTokenMatch) return null;

    const accessToken = accessTokenMatch[1];
    
    // Verify the token and get user info
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      console.error('Error getting admin user:', error);
      return null;
    }

    return {
      id: user.id,
      email: user.email
    };
  } catch (error) {
    console.error('Error extracting admin user info:', error);
    return null;
  }
}

// Send notification to users
async function sendNotificationToUsers({
  title,
  message,
  type,
  channels,
  target_audience,
  admin_notification_id,
  adminUser
}: {
  title: string;
  message: string;
  type: string;
  channels: string[];
  target_audience: string;
  admin_notification_id: string;
  adminUser: any;
}) {
  try {
    console.log('=== START: sendNotificationToUsers ===');
    console.log('Title:', title);
    console.log('Target audience:', target_audience);
    console.log('Channels:', channels);
    
    // 🕵️ AUDIT LOG: Track notification sending start
    await createAuditLog({
      userId: adminUser?.id,
      userEmail: adminUser?.email,
      action: "notification_sending_started",
      resourceType: "Notification",
      resourceId: admin_notification_id,
      description: `Started sending notification: "${title}" to ${target_audience}`,
      metadata: {
        notificationId: admin_notification_id,
        title,
        targetAudience: target_audience,
        channels,
        type,
        startedAt: new Date().toISOString()
      },
      ipAddress: 'system', 
      userAgent: 'system'
    });

    // Get target users based on audience - only select id and email
    let userQuery = supabase
      .from('users')
      .select('id, email'); 

    switch (target_audience) {
      case 'premium_users':
        userQuery = userQuery.eq('subscription_tier', 'enterprise');
        break;
      case 'new_users':
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        userQuery = userQuery.gte('created_at', thirtyDaysAgo.toISOString());
        break;
      case 'inactive_users':
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        userQuery = userQuery.lt('last_login', twoWeeksAgo.toISOString());
        break;
      // 'all_users' - no filter
    }

    const { data: users, error: usersError } = await userQuery;

    if (usersError) {
      console.error('Error fetching users:', usersError);
      
      // 🕵️ AUDIT LOG: Track user fetch failure
      await createAuditLog({
        userId: adminUser?.id,
        userEmail: adminUser?.email,
        action: "notification_users_fetch_failed",
        resourceType: "Notification",
        resourceId: admin_notification_id,
        description: `Failed to fetch users for notification: "${title}" - ${usersError.message}`,
        metadata: {
          notificationId: admin_notification_id,
          title,
          targetAudience: target_audience,
          error: usersError.message,
          attemptedBy: adminUser?.email
        },
        ipAddress: 'system',
        userAgent: 'system'
      });
      
      throw usersError;
    }

    console.log(`Found ${users?.length || 0} users for target: ${target_audience}`);

    if (!users || users.length === 0) {
      console.log('No users found for this target audience');
      
      // 🕵️ AUDIT LOG: Track no users found
      await createAuditLog({
        userId: adminUser?.id,
        userEmail: adminUser?.email,
        action: "notification_no_users_found",
        resourceType: "Notification",
        resourceId: admin_notification_id,
        description: `No users found for target audience: ${target_audience}`,
        metadata: {
          notificationId: admin_notification_id,
          title,
          targetAudience: target_audience,
          userCount: 0,
          attemptedBy: adminUser?.email
        },
        ipAddress: 'system',
        userAgent: 'system'
      });
      
      throw new Error('No users found for the target audience');
    }

    const userIds = users.map(user => user.id);
    console.log('User IDs to notify:', userIds);

    // Send to each user
    const { dispatchBulkNotifications } = await import('@/lib/notification-dispatcher');
    const result = await dispatchBulkNotifications({
      userIds,
      title,
      message,
      type,
      channels
    });

    console.log('Bulk notification result:', result);

    // Update admin notification status
    await supabase
      .from('admin_notifications')
      .update({
        status: result.success ? 'sent' : 'failed',
        sent_at: new Date().toISOString(),
        stats: {
          total_users: users.length,
          successful: result.successful,
          failed: result.failed,
          in_app_sent: channels.includes('in_app') ? result.successful : 0,
          email_sent: channels.includes('email') ? result.successful : 0,
          sms_sent: channels.includes('sms') ? result.successful : 0,
          push_sent: channels.includes('push') ? result.successful : 0,
        }
      })
      .eq('id', admin_notification_id);

    // 🕵️ AUDIT LOG: Track notification sending completion
    if (result.success) {
      await createAuditLog({
        userId: adminUser?.id,
        userEmail: adminUser?.email,
        action: "notification_sent_successfully",
        resourceType: "Notification",
        resourceId: admin_notification_id,
        description: `Successfully sent notification to ${result.successful}/${users.length} users: "${title}"`,
        metadata: {
          notificationId: admin_notification_id,
          title,
          targetAudience: target_audience,
          channels,
          totalUsers: users.length,
          successful: result.successful,
          failed: result.failed,
          deliveryRate: Math.round((result.successful / users.length) * 100),
          inAppSent: channels.includes('in_app') ? result.successful : 0,
          emailSent: channels.includes('email') ? result.successful : 0,
          smsSent: channels.includes('sms') ? result.successful : 0,
          pushSent: channels.includes('push') ? result.successful : 0,
          completedAt: new Date().toISOString(),
          sentBy: adminUser?.email
        },
        ipAddress: 'system',
        userAgent: 'system'
      });
    } else {
      await createAuditLog({
        userId: adminUser?.id,
        userEmail: adminUser?.email,
        action: "notification_sending_failed",
        resourceType: "Notification",
        resourceId: admin_notification_id,
        description: `Failed to send notification: "${title}" - ${result.error}`,
        metadata: {
          notificationId: admin_notification_id,
          title,
          targetAudience: target_audience,
          channels,
          totalUsers: users.length,
          error: result.error,
          attemptedBy: adminUser?.email
        },
        ipAddress: 'system',
        userAgent: 'system'
      });
    }

    console.log('=== END: sendNotificationToUsers - SUCCESS ===');
    return {
      success: result.success,
      total: users.length,
      successful: result.successful,
      failed: result.failed
    };

  } catch (error) {
    console.error('=== END: sendNotificationToUsers - ERROR ===', error);
    
    // 🕵️ AUDIT LOG: Track notification sending error
    await createAuditLog({
      userId: adminUser?.id,
      userEmail: adminUser?.email,
      action: "notification_sending_error",
      resourceType: "Notification",
      resourceId: admin_notification_id,
      description: `Error sending notification: "${title}" - ${error instanceof Error ? error.message : 'Unknown error'}`,
      metadata: {
        notificationId: admin_notification_id,
        title,
        targetAudience: target_audience,
        error: error instanceof Error ? error.message : 'Unknown error',
        attemptedBy: adminUser?.email,
        failedAt: new Date().toISOString()
      },
      ipAddress: 'system',
      userAgent: 'system'
    });

    // Mark as failed
    await supabase
      .from('admin_notifications')
      .update({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        sent_at: new Date().toISOString()
      })
      .eq('id', admin_notification_id);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Correct the function signature for Next.js 13+ App Router
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
     const adminUser = await requireAdmin(request);
  if (adminUser instanceof NextResponse) return adminUser;
  
  const allowedRoles = ['super_admin', 'operations_admin'];
  if (!allowedRoles.includes(adminUser?.admin_role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }
    const clientInfo = getClientInfo(request.headers);

    // Get the ID from params
    const params = await context.params;
    const notificationId = params.id;

    console.log('=== SEND API: Sending notification with ID ===', notificationId);

    if (!notificationId) {
      // 🕵️ AUDIT LOG: Track missing notification ID
      await createAuditLog({
        userId: adminUser?.id,
        userEmail: adminUser?.email,
        action: "notification_send_attempt_failed",
        resourceType: "Notification",
        description: `Attempted to send notification without ID`,
        metadata: {
          error: "Notification ID is required",
          attemptedBy: adminUser?.email
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent
      });

      return NextResponse.json(
        { error: "Notification ID is required" },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(notificationId)) {
      // 🕵️ AUDIT LOG: Track invalid notification ID
      await createAuditLog({
        userId: adminUser?.id,
        userEmail: adminUser?.email,
        action: "notification_send_attempt_failed",
        resourceType: "Notification",
        resourceId: notificationId,
        description: `Attempted to send notification with invalid ID format`,
        metadata: {
          notificationId,
          error: "Invalid notification ID format",
          attemptedBy: adminUser?.email
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent
      });

      return NextResponse.json(
        { error: "Invalid notification ID format" },
        { status: 400 }
      );
    }

    // Get the notification
    const { data: notification, error: fetchError } = await supabase
      .from('admin_notifications')
      .select('*')
      .eq('id', notificationId)
      .single();

    if (fetchError) {
      console.error('Fetch notification error:', fetchError);
      
      // 🕵️ AUDIT LOG: Track notification not found
      await createAuditLog({
        userId: adminUser?.id,
        userEmail: adminUser?.email,
        action: "notification_send_attempt_failed",
        resourceType: "Notification",
        resourceId: notificationId,
        description: `Attempted to send non-existent notification`,
        metadata: {
          notificationId,
          error: fetchError.message,
          attemptedBy: adminUser?.email
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent
      });

      throw fetchError;
    }

    if (!notification) {
      // 🕵️ AUDIT LOG: Track notification not found
      await createAuditLog({
        userId: adminUser?.id,
        userEmail: adminUser?.email,
        action: "notification_send_attempt_failed",
        resourceType: "Notification",
        resourceId: notificationId,
        description: `Attempted to send non-existent notification`,
        metadata: {
          notificationId,
          error: "Notification not found",
          attemptedBy: adminUser?.email
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent
      });

      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    if (notification.status === 'sent') {
      // 🕵️ AUDIT LOG: Track duplicate send attempt
      await createAuditLog({
        userId: adminUser?.id,
        userEmail: adminUser?.email,
        action: "notification_duplicate_send_attempt",
        resourceType: "Notification",
        resourceId: notificationId,
        description: `Attempted to re-send already sent notification: "${notification.title}"`,
        metadata: {
          notificationId,
          title: notification.title,
          status: notification.status,
          targetAudience: notification.target_audience,
          sentAt: notification.sent_at,
          attemptedBy: adminUser?.email,
          reason: "Notification already sent"
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent
      });

      return NextResponse.json(
        { error: "Notification already sent" },
        { status: 400 }
      );
    }

    console.log('Found notification:', notification.title);

    // 🕵️ AUDIT LOG: Track notification send initiation
    await createAuditLog({
      userId: adminUser?.id,
      userEmail: adminUser?.email,
      action: "notification_send_initiated",
      resourceType: "Notification",
      resourceId: notificationId,
      description: `Initiated sending notification: "${notification.title}"`,
      metadata: {
        notificationId,
        title: notification.title,
        targetAudience: notification.target_audience,
        channels: notification.channels,
        type: notification.type,
        isUrgent: notification.is_urgent,
        initiatedBy: adminUser?.email,
        initiatedAt: new Date().toISOString()
      },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent
    });

    // Send to users
    const result = await sendNotificationToUsers({
      title: notification.title,
      message: notification.message,
      type: notification.type,
      channels: notification.channels,
      target_audience: notification.target_audience,
      admin_notification_id: notification.id,
      adminUser
    });

    // 🕵️ AUDIT LOG: Track final send result
    await createAuditLog({
      userId: adminUser?.id,
      userEmail: adminUser?.email,
      action: result.success ? "notification_send_completed" : "notification_send_failed",
      resourceType: "Notification",
      resourceId: notificationId,
      description: result.success 
        ? `Completed sending notification to ${result.successful} users: "${notification.title}"`
        : `Failed to send notification: "${notification.title}"`,
      metadata: {
        notificationId,
        title: notification.title,
        targetAudience: notification.target_audience,
        totalUsers: result.total,
        successful: result.successful,
        failed: result.failed,
        success: result.success,
        error: result.error,
        completedBy: adminUser?.email,
        completedAt: new Date().toISOString()
      },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent
    });

    // Return response
    return NextResponse.json({
      success: result.success,
      total: result.total,
      successful: result.successful,
      failed: result.failed,
      message: result.success ? 'Notification sent successfully' : 'Failed to send notification',
      _admin: {
        performedBy: adminUser?.email,
        performedAt: new Date().toISOString(),
        auditLogged: true
      }
    });

  } catch (error: any) {
    console.error('Send now error:', error);
    
    // 🕵️ AUDIT LOG: Track unexpected errors
    const cookieHeader = request.headers.get("cookie") || "";
    const adminUser = await getAdminUserInfo(cookieHeader);
    const clientInfo = getClientInfo(request.headers);
    
    await createAuditLog({
      userId: adminUser?.id,
      userEmail: adminUser?.email,
      action: "notification_send_unexpected_error",
      resourceType: "Notification",
      description: `Unexpected error during notification sending: ${error.message}`,
      metadata: {
        error: error.message,
        stack: error.stack
      },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent
    });
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message 
      },
      { status: 500 }
    );
  }
}