// app/api/admin-apis/users/export-all/route.ts

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAuditLog, getClientInfo } from "@/lib/audit-log";
import { Parser } from "json2csv";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const adminUser = await requireAdmin(req);
    if (adminUser instanceof NextResponse) return adminUser;
    
    const allowedRoles = ['super_admin', 'operations_admin', 'support_admin'];
    if (!allowedRoles.includes(adminUser?.admin_role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const clientInfo = getClientInfo(req.headers);
    
    // Fetch active users (verified)
    const { data: activeUsers, error: activeError } = await supabaseAdmin
      .from("users")
      .select("*")
      .not("bvn_verification", "in", "('not_submitted','pending')")
      .order("created_at", { ascending: false });

    // Fetch pending users from pending_users table
    const { data: pendingTableUsers, error: pendingTableError } = await supabaseAdmin
      .from("pending_users")
      .select("*")
      .order("created_at", { ascending: false });

    // Fetch users with pending KYC
    const { data: pendingKYCUsers, error: pendingKYCError } = await supabaseAdmin
      .from("users")
      .select("*")
      .in("bvn_verification", ["not_submitted", "pending", null])
      .order("created_at", { ascending: false });

    if (activeError || pendingTableError || pendingKYCError) {
      throw new Error("Failed to fetch users data");
    }

    // Format all users
    const formattedUsers: any[] = [];

    // Add active users
    if (activeUsers) {
      activeUsers.forEach((user: any) => {
        const nameParts = (user.full_name || "").split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";
        
        formattedUsers.push({
          "User ID": user.id,
          "Email": user.email || "",
          "First Name": firstName,
          "Last Name": lastName,
          "Full Name": user.full_name || "",
          "Phone": user.phone || "",
          "Role": user.role || "user",
          "Status": user.is_blocked ? "Blocked" : "Active",
          "User Type": "Verified",
          "KYC Status": user.bvn_verification || "verified",
          "Wallet Balance": Number(user.wallet_balance) || 0,
          "Last Login": user.last_login ? new Date(user.last_login).toLocaleString() : "Never",
          "Registration Date": user.created_at ? new Date(user.created_at).toLocaleDateString() : "",
          "Registration DateTime": user.created_at ? new Date(user.created_at).toISOString() : "",
          "Account Age (Days)": user.created_at ? 
            Math.floor((new Date().getTime() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0,
          "BVN Verification": user.bvn_verification || "not_submitted",
          "Referral Code": user.referral_code || "",
          "Referred By": user.referred_by || "",
        });
      });
    }

    // Add pending table users
    if (pendingTableUsers) {
      pendingTableUsers.forEach((user: any) => {
        formattedUsers.push({
          "User ID": user.id,
          "Email": user.email || "",
          "First Name": user.first_name || "",
          "Last Name": user.last_name || "",
          "Full Name": `${user.first_name || ''} ${user.last_name || ''}`.trim(),
          "Phone": user.phone || "",
          "Role": "user",
          "Status": "Pending",
          "User Type": "Pending Approval",
          "KYC Status": "pending",
          "Wallet Balance": 0,
          "Last Login": "Never",
          "Registration Date": user.created_at ? new Date(user.created_at).toLocaleDateString() : "",
          "Registration DateTime": user.created_at ? new Date(user.created_at).toISOString() : "",
          "Account Age (Days)": user.created_at ? 
            Math.floor((new Date().getTime() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0,
          "BVN Verification": "pending",
          "Referral Code": "",
          "Referred By": user.referred_by || "",
        });
      });
    }

    // Add pending KYC users
    if (pendingKYCUsers) {
      pendingKYCUsers.forEach((user: any) => {
        const nameParts = (user.full_name || "").split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";
        
        formattedUsers.push({
          "User ID": user.id,
          "Email": user.email || "",
          "First Name": firstName,
          "Last Name": lastName,
          "Full Name": user.full_name || "",
          "Phone": user.phone || "",
          "Role": user.role || "user",
          "Status": user.is_blocked ? "Blocked" : "Active",
          "User Type": "Pending KYC",
          "KYC Status": user.bvn_verification || "not_submitted",
          "Wallet Balance": Number(user.wallet_balance) || 0,
          "Last Login": user.last_login ? new Date(user.last_login).toLocaleString() : "Never",
          "Registration Date": user.created_at ? new Date(user.created_at).toLocaleDateString() : "",
          "Registration DateTime": user.created_at ? new Date(user.created_at).toISOString() : "",
          "Account Age (Days)": user.created_at ? 
            Math.floor((new Date().getTime() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0,
          "BVN Verification": user.bvn_verification || "not_submitted",
          "Referral Code": user.referral_code || "",
          "Referred By": user.referred_by || "",
        });
      });
    }

    const fields = [
      "User ID", "Email", "First Name", "Last Name", "Full Name", "Phone",
      "Role", "Status", "User Type", "KYC Status", "Wallet Balance",
      "Last Login", "Registration Date", "Registration DateTime", "Account Age (Days)",
      "BVN Verification", "Referral Code", "Referred By"
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(formattedUsers);

    const filename = `all_users_${new Date().toISOString().split('T')[0]}.csv`;

    await createAuditLog({
      userId: adminUser?.id,
      userEmail: adminUser?.email,
      action: "export_all_users_csv",
      resourceType: "User",
      description: `Exported all ${formattedUsers.length} users (active + pending) to CSV`,
      metadata: {
        totalCount: formattedUsers.length,
        activeCount: activeUsers?.length || 0,
        pendingTableCount: pendingTableUsers?.length || 0,
        pendingKYCCount: pendingKYCUsers?.length || 0,
      },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
    });

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Export-Count": formattedUsers.length.toString(),
      },
    });
  } catch (err: any) {
    console.error("❌ GET /api/admin-apis/users/export-all error:", err.message);
    return NextResponse.json(
      { error: "Failed to export all users data" },
      { status: 500 }
    );
  }
}