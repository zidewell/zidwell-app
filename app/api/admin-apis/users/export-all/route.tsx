// app/api/admin-apis/users/export-all/route.ts

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAuditLog, getClientInfo } from "@/lib/audit-log";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SelectedFields {
  id: boolean;
  email: boolean;
  fullName: boolean;
  phone: boolean;
  status: boolean;
  balance: boolean;
  kycStatus: boolean;
  registrationDate: boolean;
  lastLogin: boolean;
  role: boolean;
  referralCode: boolean;
  referredBy: boolean;
}

const defaultSelectedFields: SelectedFields = {
  id: true,
  email: true,
  fullName: true,
  phone: true,
  status: true,
  balance: false,
  kycStatus: false,
  registrationDate: false,
  lastLogin: false,
  role: false,
  referralCode: false,
  referredBy: false,
};

export async function GET(req: NextRequest) {
  try {
    const adminUser = await requireAdmin(req);
    if (adminUser instanceof NextResponse) return adminUser;
    
    const allowedRoles = ['super_admin', 'operations_admin', 'support_admin'];
    if (!allowedRoles.includes(adminUser?.admin_role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const clientInfo = getClientInfo(req.headers);
    const url = new URL(req.url);
    const typeParam = url.searchParams.get("type") || "all";
    
    // Parse selected fields from request
    let selectedFields: SelectedFields = { ...defaultSelectedFields };
    
    const fieldsParam = url.searchParams.get("fields");
    if (fieldsParam) {
      try {
        const parsedFields = JSON.parse(fieldsParam);
        selectedFields = { ...selectedFields, ...parsedFields };
      } catch (e) {
        console.error("Error parsing fields parameter:", e);
      }
    }

    const formattedUsers: any[] = [];

    // Fetch active users (verified) if type is 'active' or 'all'
    if (typeParam === "active" || typeParam === "all") {
      const { data: activeUsers, error: activeError } = await supabaseAdmin
        .from("users")
        .select("*")
        .not("bvn_verification", "in", "('not_submitted','pending')")
        .order("created_at", { ascending: false });

      if (activeError) {
        console.error("Error fetching active users:", activeError);
      } else if (activeUsers && activeUsers.length > 0) {
        activeUsers.forEach((user: any) => {
          const formattedUser: any = {};
          
          if (selectedFields.id) {
            formattedUser["User ID"] = user.id;
          }
          if (selectedFields.email) {
            formattedUser["Email"] = user.email || "";
          }
          if (selectedFields.fullName) {
            formattedUser["Full Name"] = user.full_name || "";
          }
          if (selectedFields.phone) {
            formattedUser["Phone"] = user.phone || "";
          }
          if (selectedFields.status) {
            formattedUser["Status"] = user.is_blocked ? "Blocked" : "Active";
          }
          if (selectedFields.balance) {
            formattedUser["Wallet Balance"] = Number(user.wallet_balance) || 0;
          }
          if (selectedFields.kycStatus) {
            formattedUser["KYC Status"] = user.bvn_verification || "verified";
          }
          if (selectedFields.registrationDate) {
            formattedUser["Registration Date"] = user.created_at 
              ? new Date(user.created_at).toLocaleDateString() 
              : "";
          }
          if (selectedFields.lastLogin) {
            formattedUser["Last Login"] = user.last_login 
              ? new Date(user.last_login).toLocaleString() 
              : "Never";
          }
          if (selectedFields.role) {
            formattedUser["Role"] = user.role || "user";
          }
          if (selectedFields.referralCode) {
            formattedUser["Referral Code"] = user.referral_code || "";
          }
          if (selectedFields.referredBy) {
            formattedUser["Referred By"] = user.referred_by || "";
          }
          
          if (Object.keys(formattedUser).length > 0) {
            formattedUsers.push(formattedUser);
          }
        });
      }
    }

    // Fetch pending users if type is 'pending' or 'all'
    if (typeParam === "pending" || typeParam === "all") {
      // Fetch from pending_users table
      const { data: pendingTableUsers, error: pendingTableError } = await supabaseAdmin
        .from("pending_users")
        .select("*")
        .order("created_at", { ascending: false });

      if (pendingTableError) {
        console.error("Error fetching pending table users:", pendingTableError);
      } else if (pendingTableUsers && pendingTableUsers.length > 0) {
        pendingTableUsers.forEach((user: any) => {
          const formattedUser: any = {};
          
          if (selectedFields.id) {
            formattedUser["User ID"] = user.id;
          }
          if (selectedFields.email) {
            formattedUser["Email"] = user.email || "";
          }
          if (selectedFields.fullName) {
            formattedUser["Full Name"] = `${user.first_name || ''} ${user.last_name || ''}`.trim();
          }
          if (selectedFields.phone) {
            formattedUser["Phone"] = user.phone || "";
          }
          if (selectedFields.status) {
            formattedUser["Status"] = "Pending Approval";
          }
          if (selectedFields.kycStatus) {
            formattedUser["KYC Status"] = "pending";
          }
          if (selectedFields.registrationDate) {
            formattedUser["Registration Date"] = user.created_at 
              ? new Date(user.created_at).toLocaleDateString() 
              : "";
          }
          if (selectedFields.referredBy) {
            formattedUser["Referred By"] = user.referred_by || "";
          }
          
          if (Object.keys(formattedUser).length > 0) {
            formattedUsers.push(formattedUser);
          }
        });
      }

      // Fetch users with pending KYC from users table
      const { data: pendingKYCUsers, error: pendingKYCError } = await supabaseAdmin
        .from("users")
        .select("*")
        .in("bvn_verification", ["not_submitted", "pending", null])
        .order("created_at", { ascending: false });

      if (pendingKYCError) {
        console.error("Error fetching pending KYC users:", pendingKYCError);
      } else if (pendingKYCUsers && pendingKYCUsers.length > 0) {
        pendingKYCUsers.forEach((user: any) => {
          const formattedUser: any = {};
          
          if (selectedFields.id) {
            formattedUser["User ID"] = user.id;
          }
          if (selectedFields.email) {
            formattedUser["Email"] = user.email || "";
          }
          if (selectedFields.fullName) {
            formattedUser["Full Name"] = user.full_name || "";
          }
          if (selectedFields.phone) {
            formattedUser["Phone"] = user.phone || "";
          }
          if (selectedFields.status) {
            formattedUser["Status"] = user.is_blocked ? "Blocked" : "Pending KYC";
          }
          if (selectedFields.kycStatus) {
            formattedUser["KYC Status"] = user.bvn_verification || "not_submitted";
          }
          if (selectedFields.registrationDate) {
            formattedUser["Registration Date"] = user.created_at 
              ? new Date(user.created_at).toLocaleDateString() 
              : "";
          }
          if (selectedFields.lastLogin) {
            formattedUser["Last Login"] = user.last_login 
              ? new Date(user.last_login).toLocaleString() 
              : "Never";
          }
          if (selectedFields.referralCode) {
            formattedUser["Referral Code"] = user.referral_code || "";
          }
          if (selectedFields.referredBy) {
            formattedUser["Referred By"] = user.referred_by || "";
          }
          
          if (Object.keys(formattedUser).length > 0) {
            formattedUsers.push(formattedUser);
          }
        });
      }
    }

    if (formattedUsers.length === 0) {
      return NextResponse.json(
        { error: "No users found for export" },
        { status: 404 }
      );
    }

    // Get all unique headers from formatted users
    const allHeaders = new Set<string>();
    formattedUsers.forEach(user => {
      Object.keys(user).forEach(key => allHeaders.add(key));
    });
    const headers = Array.from(allHeaders);

    // Create CSV
    const csvRows = [];
    csvRows.push(headers.join(','));
    
    for (const user of formattedUsers) {
      const values = headers.map(header => {
        const value = user[header] || '';
        const escaped = String(value).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }
    
    const csv = csvRows.join('\n');

    const typeLabel = typeParam === "all" ? "all" : typeParam;
    const filename = `${typeLabel}_users_${new Date().toISOString().split('T')[0]}.csv`;

    await createAuditLog({
      userId: adminUser?.id,
      userEmail: adminUser?.email,
      action: "export_all_users_csv",
      resourceType: "User",
      description: `Exported ${formattedUsers.length} users (type: ${typeParam}) to CSV with selected fields`,
      metadata: {
        totalCount: formattedUsers.length,
        exportType: typeParam,
        selectedFields: Object.keys(selectedFields).filter(k => selectedFields[k as keyof SelectedFields]),
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
      { error: "Failed to export all users data: " + err.message },
      { status: 500 }
    );
  }
}