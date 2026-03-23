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
    const url = new URL(req.url);
    
    const type = url.searchParams.get("type") || "active";
    const search = url.searchParams.get("search");
    const status = url.searchParams.get("status");
    const role = url.searchParams.get("role");
    const activity = url.searchParams.get("activity");
    const balance = url.searchParams.get("balance");
    const lowThreshold = Number(url.searchParams.get("low_threshold")) || 1000;
    const highThreshold = Number(url.searchParams.get("high_threshold")) || 100000;

    let allData: any[] = [];

    if (type === "pending") {
      // Get pending users from both sources
      
      // From pending_users table
      let pendingTableQuery = supabaseAdmin
        .from("pending_users")
        .select("*")
        .order("created_at", { ascending: false });

      if (search) {
        pendingTableQuery = pendingTableQuery.or(
          `email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%`
        );
      }

      const { data: pendingTableData, error: pendingTableError } = await pendingTableQuery;
      
      if (!pendingTableError && pendingTableData) {
        const formattedPendingTableData = pendingTableData.map((user: any) => ({
          ...user,
          full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
          source: 'pending_table',
          kyc_status: 'pending',
          bvn_verification: 'pending',
          status: 'pending',
          is_blocked: false,
        }));
        allData.push(...formattedPendingTableData);
      }

      // From users table with bvn_verification = 'not_submitted' OR users who are not verified
      let usersQuery = supabaseAdmin
        .from("users")
        .select("*")
        .in("bvn_verification", ["not_submitted", "pending", null])
        .order("created_at", { ascending: false });

      if (search) {
        usersQuery = usersQuery.or(
          `full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
        );
      }

      const { data: usersData, error: usersError } = await usersQuery;
      
      if (!usersError && usersData) {
        const formattedUsersData = usersData.map((user: any) => ({
          ...user,
          source: 'users_table',
          kyc_status: user.bvn_verification || 'not_submitted',
          first_name: user.full_name?.split(' ')[0] || '',
          last_name: user.full_name?.split(' ').slice(1).join(' ') || '',
          status: 'pending',
        }));
        allData.push(...formattedUsersData);
      }

    } else {
      // ACTIVE USERS - Include ALL approved users (not in pending state)
      // These are users who are in the users table and have bvn_verification not in pending states
      let query = supabaseAdmin
        .from("users")
        .select("*")
        // Exclude users with pending KYC status - use not in
        .not("bvn_verification", "in", "('not_submitted','pending')")
        .order("created_at", { ascending: false });

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
        query = query.eq("role", role);
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

      const { data, error } = await query;
      if (!error && data) {
        allData = data;
      } else if (error) {
        console.error("Error fetching active users:", error);
      }
    }

    // Format data for CSV
    const formattedData = allData.map((user: any) => {
      if (type === "pending") {
        return {
          "User ID": user.id,
          "Email": user.email || "",
          "First Name": user.first_name || "",
          "Last Name": user.last_name || "",
          "Full Name": user.full_name || "",
          "Phone": user.phone || "",
          "Registration Date": user.created_at ? new Date(user.created_at).toLocaleDateString() : "",
          "Registration DateTime": user.created_at ? new Date(user.created_at).toISOString() : "",
          "KYC Status": user.kyc_status || user.bvn_verification || "pending",
          "Status": user.status || "Pending",
          "Source": user.source === 'pending_table' ? 'Awaiting Approval' : 'Incomplete KYC',
          "BVN Verification": user.bvn_verification || "not_submitted",
          "Referred By": user.referred_by || "",
          "Referral Source": user.referral_source || "",
        };
      } else {
        const walletBalance = Number(user.wallet_balance) || 0;
        let balanceCategory = "Normal";
        
        if (walletBalance >= highThreshold) balanceCategory = "High";
        else if (walletBalance <= lowThreshold && walletBalance >= 0) balanceCategory = "Low";
        else if (walletBalance < 0) balanceCategory = "Negative";
        else if (walletBalance === 0) balanceCategory = "Zero";

        const nameParts = (user.full_name || "").split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        return {
          "User ID": user.id,
          "Email": user.email || "",
          "First Name": firstName,
          "Last Name": lastName,
          "Full Name": user.full_name || "",
          "Phone": user.phone || "",
          "Role": user.role || "user",
          "Status": user.is_blocked ? "Blocked" : "Active",
          "KYC Status": user.bvn_verification || "not_started",
          "Wallet Balance": walletBalance,
          "Balance Category": balanceCategory,
          "Last Login": user.last_login ? new Date(user.last_login).toLocaleString() : "Never",
          "Last Logout": user.last_logout ? new Date(user.last_logout).toLocaleString() : "Never",
          "Blocked": user.is_blocked ? "Yes" : "No",
          "Blocked At": user.blocked_at ? new Date(user.blocked_at).toLocaleString() : "",
          "Blocked Reason": user.block_reason || "",
          "Registration Date": user.created_at ? new Date(user.created_at).toLocaleDateString() : "",
          "Registration DateTime": user.created_at ? new Date(user.created_at).toISOString() : "",
          "Updated At": user.updated_at ? new Date(user.updated_at).toLocaleString() : "",
          "Account Age (Days)": user.created_at ? 
            Math.floor((new Date().getTime() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0,
          "Subscription Tier": user.subscription_tier || "free",
          "BVN Verification": user.bvn_verification || "not_submitted",
          "Referral Code": user.referral_code || "",
          "Referred By": user.referred_by || "",
        };
      }
    });

    let fields: string[];
    if (type === "pending") {
      fields = [
        "User ID", "Email", "First Name", "Last Name", "Full Name", "Phone",
        "Registration Date", "Registration DateTime", "KYC Status", "Status",
        "Source", "BVN Verification", "Referred By", "Referral Source"
      ];
    } else {
      fields = [
        "User ID", "Email", "First Name", "Last Name", "Full Name", "Phone",
        "Role", "Status", "KYC Status", "Wallet Balance", "Balance Category",
        "Last Login", "Last Logout", "Blocked", "Blocked At", "Blocked Reason",
        "Registration Date", "Registration DateTime", "Updated At", "Account Age (Days)",
        "Subscription Tier", "BVN Verification", "Referral Code", "Referred By"
      ];
    }

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(formattedData);

    let filename = `${type}_users_${new Date().toISOString().split('T')[0]}.csv`;
    
    // Add filter info to filename
    const filterParts = [];
    if (search) filterParts.push(`search-${search.substring(0, 10)}`);
    if (status && status !== 'all') filterParts.push(status);
    if (activity && activity !== 'all') filterParts.push(activity);
    if (balance && balance !== 'all') filterParts.push(`${balance}-balance`);
    
    if (filterParts.length > 0) {
      filename = filename.replace('.csv', `_${filterParts.join('_')}.csv`);
    }

    await createAuditLog({
      userId: adminUser?.id,
      userEmail: adminUser?.email,
      action: "export_users_csv",
      resourceType: "User",
      description: `Exported ${formattedData.length} ${type} users to CSV`,
      metadata: {
        type,
        count: formattedData.length,
        filters: { search, status, role, activity, balance }
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
        "X-Export-Type": type,
      },
    });
  } catch (err: any) {
    console.error("❌ GET /api/admin-apis/users/export error:", err.message);
    
    // Audit log for failure
    try {
      const adminUser = await requireAdmin(req);
      if (!(adminUser instanceof NextResponse)) {
        const clientInfo = getClientInfo(req.headers);
        await createAuditLog({
          userId: adminUser?.id,
          userEmail: adminUser?.email,
          action: "export_users_csv_failed",
          resourceType: "User",
          description: `Failed to export users CSV: ${err.message}`,
          ipAddress: clientInfo.ipAddress,
          userAgent: clientInfo.userAgent,
        });
      }
    } catch (auditError) {
      console.error("Failed to create audit log:", auditError);
    }

    return NextResponse.json(
      { error: "Failed to export users data", details: err.message },
      { status: 500 }
    );
  }
}