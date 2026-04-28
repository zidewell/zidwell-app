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

    let query = supabaseAdmin
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    // Filter by type
    if (typeParam === "active") {
      query = query.in("bvn_verification", ["verified", "approved"]);
    } else if (typeParam === "pending") {
      query = query.in("bvn_verification", ["not_submitted", "pending", null]);
    }
    // if typeParam === "all", no filter

    const { data: users, error } = await query;

    if (error) {
      console.error("Error fetching users:", error);
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: "No users found for export" },
        { status: 404 }
      );
    }

    // Format data based on selected fields
    const formattedUsers = users.map((user: any) => {
      const formatted: any = {};
      
      if (selectedFields.id) {
        formatted["User ID"] = user.id;
      }
      if (selectedFields.email) {
        formatted["Email"] = user.email || "";
      }
      if (selectedFields.fullName) {
        formatted["Full Name"] = user.full_name || "";
      }
      if (selectedFields.phone) {
        formatted["Phone"] = user.phone || "";
      }
      if (selectedFields.status) {
        formatted["Status"] = user.is_blocked ? "Blocked" : "Active";
      }
      if (selectedFields.balance) {
        formatted["Wallet Balance"] = Number(user.wallet_balance) || 0;
      }
      if (selectedFields.kycStatus) {
        const kycMap: Record<string, string> = {
          'verified': 'Verified',
          'approved': 'Verified',
          'pending': 'Pending',
          'not_submitted': 'Not Started',
        };
        formatted["KYC Status"] = kycMap[user.bvn_verification] || user.bvn_verification || "Not Started";
      }
      if (selectedFields.registrationDate) {
        formatted["Registration Date"] = user.created_at 
          ? new Date(user.created_at).toLocaleDateString() 
          : "";
      }
      if (selectedFields.lastLogin) {
        formatted["Last Login"] = user.last_login 
          ? new Date(user.last_login).toLocaleString() 
          : "Never";
      }
      if (selectedFields.role) {
        formatted["Role"] = user.admin_role || "user";
      }
      if (selectedFields.referralCode) {
        formatted["Referral Code"] = user.referral_code || "";
      }
      if (selectedFields.referredBy) {
        formatted["Referred By"] = user.referred_by || "";
      }
      
      return formatted;
    });

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
      description: `Exported ${formattedUsers.length} users (type: ${typeParam}) to CSV`,
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