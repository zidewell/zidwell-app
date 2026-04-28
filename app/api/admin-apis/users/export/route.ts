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
    
    const typeParam = url.searchParams.get("type") || "active";
    const search = url.searchParams.get("search");
    const status = url.searchParams.get("status");
    const role = url.searchParams.get("role");
    const activity = url.searchParams.get("activity");
    const balance = url.searchParams.get("balance");
    const lowThreshold = Number(url.searchParams.get("low_threshold")) || 1000;
    const highThreshold = Number(url.searchParams.get("high_threshold")) || 100000;
    
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

    if (typeParam === "active") {
      query = query.in("bvn_verification", ["verified", "approved"]);
    } else if (typeParam === "pending") {
      query = query.in("bvn_verification", ["not_submitted", "pending", null]);
    }

    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
      );
    }

    if (status && status !== "all") {
      if (status === "blocked") {
        query = query.eq("is_blocked", true);
      } else if (status === "active") {
        query = query.eq("is_blocked", false);
      }
    }

    if (role && role !== "all") {
      query = query.eq("admin_role", role);
    }

    if (activity && activity !== "all") {
      const now = new Date();
      if (activity === "active") {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        query = query.gte("last_login", thirtyDaysAgo.toISOString());
      } else if (activity === "today") {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        query = query.gte("last_login", today.toISOString());
      } else if (activity === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        query = query.gte("last_login", weekAgo.toISOString());
      } else if (activity === "inactive") {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        query = query.lt("last_login", thirtyDaysAgo.toISOString()).or(`last_login.is.null`);
      }
    }

    if (balance && balance !== "all") {
      if (balance === "high") {
        query = query.gte("wallet_balance", highThreshold);
      } else if (balance === "low") {
        query = query.lte("wallet_balance", lowThreshold).gte("wallet_balance", 0);
      } else if (balance === "negative") {
        query = query.lt("wallet_balance", 0);
      } else if (balance === "zero") {
        query = query.eq("wallet_balance", 0);
      }
    }

    const { data: users, error } = await query;

    if (error) {
      console.error("Error fetching users:", error);
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: "No users found matching the criteria" },
        { status: 404 }
      );
    }

    const formattedData = users.map((user: any) => {
      const formatted: any = {};
      
      if (selectedFields.id) formatted["User ID"] = user.id;
      if (selectedFields.email) formatted["Email"] = user.email || "";
      if (selectedFields.fullName) formatted["Full Name"] = user.full_name || "";
      if (selectedFields.phone) formatted["Phone"] = user.phone || "";
      if (selectedFields.status) {
        formatted["Status"] = user.is_blocked ? "Blocked" : "Active";
      }
      if (selectedFields.balance && typeParam === "active") {
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
        formatted["Registration Date"] = user.created_at ? new Date(user.created_at).toLocaleDateString() : "";
      }
      if (selectedFields.lastLogin && typeParam === "active") {
        formatted["Last Login"] = user.last_login ? new Date(user.last_login).toLocaleString() : "Never";
      }
      if (selectedFields.role && typeParam === "active") {
        formatted["Role"] = user.admin_role || "user";
      }
      if (selectedFields.referralCode) formatted["Referral Code"] = user.referral_code || "";
      if (selectedFields.referredBy) formatted["Referred By"] = user.referred_by || "";
      
      return formatted;
    });

    const allHeaders = new Set<string>();
    formattedData.forEach(user => {
      Object.keys(user).forEach(key => allHeaders.add(key));
    });
    const headers = Array.from(allHeaders);

    const csvRows = [];
    csvRows.push(headers.join(','));
    
    for (const user of formattedData) {
      const values = headers.map(header => {
        const value = user[header] || '';
        const escaped = String(value).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }
    
    const csv = csvRows.join('\n');

    const filename = `${typeParam}_users_${new Date().toISOString().split('T')[0]}.csv`;

    await createAuditLog({
      userId: adminUser?.id,
      userEmail: adminUser?.email,
      action: "export_users_csv",
      resourceType: "User",
      description: `Exported ${formattedData.length} ${typeParam} users to CSV`,
      metadata: {
        type: typeParam,
        count: formattedData.length,
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
        "X-Export-Count": formattedData.length.toString(),
        "X-Export-Type": typeParam,
      },
    });
  } catch (err: any) {
    console.error("❌ GET /api/admin-apis/users/export error:", err.message);
    return NextResponse.json(
      { error: "Failed to export users data", details: err.message },
      { status: 500 }
    );
  }
}