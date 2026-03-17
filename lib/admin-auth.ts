// lib/admin-auth.ts
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Permission definitions
export const ROLE_PERMISSIONS = {
  super_admin: {
    name: "Super Admin",
    description: "Has full control of the system — all features, all data, and major approvals",
    permissions: [
      "create_admin_roles",
      "edit_admin_roles", 
      "delete_admin_roles",
      "approve_system_integrations",
      "override_user_accounts",
      "view_system_analytics",
      "access_audit_trails",
      "view_all_transactions"
    ]
  },
  operations_admin: {
    name: "Operations Admin",
    description: "Manages all day-to-day app activities, transactions, and customer wallets",
    permissions: [
      "monitor_inflows_outflows",
      "credit_debit_wallets",
      "approve_transactions",
      "block_user_accounts",
      "reconcile_master_account",
      "generate_operations_reports"
    ]
  },
  support_admin: {
    name: "Customer Support",
    description: "Handles user inquiries, disputes, and verifications",
    permissions: [
      "view_user_profiles",
      "view_kyc_data",
      "view_transaction_history",
      "view_wallet_balances",
      "escalate_suspicious_accounts",
      "update_user_contact_info",
      "respond_to_tickets",
      "assign_tickets"
    ]
  },
  finance_admin: {
    name: "Finance & Accounting",
    description: "Oversees financial data, tax filing reports, and income management",
    permissions: [
      "view_wallet_transactions",
      "view_commissions_fees",
      "approve_vendor_payouts",
      "generate_financial_reports",
      "monitor_revenue",
      "track_referral_balances",
      "approve_tax_filing"
    ]
  },
  legal_admin: {
    name: "Legal & Compliance",
    description: "Ensures all regulatory and documentation compliance",
    permissions: [
      "review_contracts",
      "manage_lawyer_verification",
      "oversee_data_privacy",
      "oversee_aml_compliance",
      "generate_compliance_reports",
      "approve_reject_transactions",
      "monitor_high_risk_users"
    ]
  },
  blog_admin: {
    name: "Blog Manager",
    description: "Manages blog posts, content, and publications",
    permissions: [
      "create_blog_posts",
      "edit_blog_posts",
      "delete_blog_posts",
      "publish_blog_posts",
      "manage_blog_categories",
      "manage_blog_tags",
      "view_blog_analytics",
      "manage_blog_comments"
    ]
  }
};

export async function requireAdmin(request: NextRequest, requiredPermission?: string) {
  const authHeader = request.headers.get("authorization");
  let authToken = authHeader?.replace("Bearer ", "");
  
  if (!authToken) {
    const cookieHeader = request.headers.get("cookie");
    if (cookieHeader) {
      const cookies = Object.fromEntries(
        cookieHeader.split("; ").map(c => c.split("="))
      );
      authToken = cookies["sb-access-token"];
    }
  }
  
  const result = await verifyAdmin(authToken || "", requiredPermission);
  
  if (!result.isAdmin) {
    return NextResponse.json(
      { error: result.error || "Unauthorized" },
      { status: 403 }
    );
  }
  
  return result.user;
}

export async function verifyAdmin(authToken: string, requiredPermission?: string) {
  try {
    if (!authToken) {
      return { 
        isAdmin: false, 
        error: "No authentication token provided" 
      };
    }

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authToken);

    if (userError || !user) {
      return { 
        isAdmin: false, 
        error: "Invalid authentication token" 
      };
    }

    const { data: profile } = await supabaseAdmin
      .from("users")
      .select("admin_role")
      .eq("id", user.id)
      .single();

    const allowedAdminRoles = [
      "super_admin",
      "finance_admin",
      "operations_admin",
      "support_admin",
      "legal_admin",
      "blog_admin", // Added blog_admin here
    ];

    if (!profile || !allowedAdminRoles.includes(profile.admin_role)) {
      return {
        isAdmin: false,
        error: "Insufficient permissions - Admin access required",
      };
    }
    
    // Check specific permission if required
    if (requiredPermission) {
      const rolePermissions = ROLE_PERMISSIONS[profile.admin_role as keyof typeof ROLE_PERMISSIONS];
      if (!rolePermissions?.permissions.includes(requiredPermission)) {
        return { 
          isAdmin: false, 
          error: `Insufficient permissions. Required: ${requiredPermission}` 
        };
      }
    }

    return { 
      isAdmin: true, 
      user: {
        ...user,
        admin_role: profile.admin_role,
        permissions: ROLE_PERMISSIONS[profile.admin_role as keyof typeof ROLE_PERMISSIONS]?.permissions || []
      }
    };
  } catch (error) {
    console.error("Admin verification error:", error);
    return { 
      isAdmin: false, 
      error: "Authentication failed" 
    };
  }
}

// Helper function to check permissions
export function hasPermission(user: any, permission: string): boolean {
  return user?.permissions?.includes(permission) || false;
}