"use client";

import useSWR from "swr";
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import AdminTable from "@/app/components/admin-components/AdminTable";
import AdminLayout from "@/app/components/admin-components/layout";
import Loader from "@/app/components/Loader";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/app/components/ui/pagination";

const fetcher = async (url: string) => {
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(
      data.error || "An error occurred while fetching the data."
    );
    throw error;
  }

  return data;
};

const ROLE_PERMISSIONS = {
  super_admin: {
    name: "Super Admin",
    description:
      "Has full control of the system — all features, all data, and major approvals",
  },
  operations_admin: {
    name: "Operations Admin",
    description:
      "Manages all day-to-day app activities, transactions, and customer wallets",
  },
  support_admin: {
    name: "Customer Support",
    description: "Handles user inquiries, disputes, and verifications",
  },
  finance_admin: {
    name: "Finance & Accounting",
    description:
      "Oversees financial data, tax filing reports, and income management",
  },
  legal_admin: {
    name: "Legal & Compliance",
    description: "Ensures all regulatory and documentation compliance",
  },
};

const getRoleIcon = (role: string) => {
  const icons = {
    super_admin: "👑",
    operations_admin: "⚙️",
    support_admin: "💬",
    finance_admin: "💰",
    legal_admin: "⚖️",
  };
  return icons[role as keyof typeof icons] || "👤";
};

const getRoleColor = (role: string) => {
  const colors = {
    super_admin: "bg-red-100 text-red-800",
    operations_admin: "bg-blue-100 text-blue-800",
    support_admin: "bg-green-100 text-green-800",
    finance_admin: "bg-purple-100 text-purple-800",
    legal_admin: "bg-orange-100 text-orange-800",
  };
  return colors[role as keyof typeof colors] || "bg-gray-100 text-gray-800";
};

const formatDateSafe = (
  dateString: string | null,
  options: Intl.DateTimeFormatOptions = {}
) => {
  if (!dateString) return "Never";

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";

    if (typeof window === "undefined") {
      return date.toISOString().split("T")[0];
    }

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      ...options,
    });
  } catch (error) {
    return "Invalid date";
  }
};

const formatDateTimeSafe = (dateString: string | null) => {
  return formatDateSafe(dateString, {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function AdminManagementPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [activityFilter, setActivityFilter] = useState("all")
  const [isClient, setIsClient] = useState(false);
  const itemsPerPage = 10;

  const { data, error, isLoading, mutate } = useSWR(
    "/api/admin-apis/admins",
    fetcher
  );

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, roleFilter, activityFilter]);

  const admins = React.useMemo(() => {
    if (!data || error) return [];

    if (data.error) {
      return [];
    }

    const adminsData = data.admins || data.data || [];

    if (!Array.isArray(adminsData)) {
      return [];
    }

    return adminsData.map((admin: any) => {
      const roleInfo =
        ROLE_PERMISSIONS[admin.admin_role as keyof typeof ROLE_PERMISSIONS] ||
        ROLE_PERMISSIONS.support_admin;
      return {
        ...admin,
        full_name: `${admin.first_name} ${admin.last_name}`,
        created_at_raw: admin.created_at,
        last_login_raw: admin.last_login,
        last_active_raw: admin.last_active,
        role_display: roleInfo.name,
        role_description: roleInfo.description,
        role_icon: getRoleIcon(admin.admin_role),
        role_color: getRoleColor(admin.admin_role),
        status: admin.is_blocked ? "inactive" : "active",
      };
    });
  }, [data, error]);

  const isAdminRecentlyActive = (admin: any) => {
    const isActiveStatus = !admin.is_blocked;
    const hasRecentLogin = admin.last_login_raw;

    if (hasRecentLogin) {
      const lastLogin = new Date(admin.last_login_raw);
      const daysSinceLogin =
        (Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);
      return isActiveStatus && daysSinceLogin <= 30;
    }

    return isActiveStatus;
  };

  const isAdminActiveToday = (admin: any) => {
    if (admin.is_blocked || !admin.last_login_raw) return false;
    const lastLogin = new Date(admin.last_login_raw);
    const today = new Date();
    return lastLogin.toDateString() === today.toDateString();
  };

  const isAdminActiveThisWeek = (admin: any) => {
    if (admin.is_blocked || !admin.last_login_raw) return false;
    const lastLogin = new Date(admin.last_login_raw);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return lastLogin > weekAgo;
  };

  const isAdminInactive = (admin: any) => {
    if (admin.is_blocked) return false;
    if (!admin.last_login_raw) return true;
    const lastLogin = new Date(admin.last_login_raw);
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return lastLogin < monthAgo;
  };

  const getRoleCounts = () => {
    const counts = {
      super_admin: 0,
      operations_admin: 0,
      support_admin: 0,
      finance_admin: 0,
      legal_admin: 0,
    };

    admins.forEach((admin: any) => {
      if (counts.hasOwnProperty(admin.admin_role)) {
        counts[admin.admin_role as keyof typeof counts]++;
      }
    });

    return counts;
  };

  const roleCounts = getRoleCounts();
  const activeAdmins = admins.filter((admin: any) => !admin.is_blocked);
  const activeToday = admins.filter(isAdminActiveToday);
  const activeThisWeek = admins.filter(isAdminActiveThisWeek);
  const inactiveAdmins = admins.filter(isAdminInactive);
  const blockedAdmins = admins.filter((admin: any) => admin.is_blocked);

  const stats = {
    total: admins.length,
    active: activeAdmins.length,
    super_admin: roleCounts.super_admin,
    operations_admin: roleCounts.operations_admin,
    support_admin: roleCounts.support_admin,
    finance_admin: roleCounts.finance_admin,
    legal_admin: roleCounts.legal_admin,
  };

  const filteredAdmins = admins.filter((admin: any) => {
    const matchesSearch =
      admin.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.role_display?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && !admin.is_blocked) ||
      (statusFilter === "inactive" && admin.is_blocked);

    const matchesRole = roleFilter === "all" || admin.admin_role === roleFilter;
    const matchesActivity =
      activityFilter === "all" ||
      (activityFilter === "active" && isAdminRecentlyActive(admin)) ||
      (activityFilter === "today" && isAdminActiveToday(admin)) ||
      (activityFilter === "week" && isAdminActiveThisWeek(admin)) ||
      (activityFilter === "inactive" && isAdminInactive(admin));

    return matchesSearch && matchesStatus && matchesRole && matchesActivity;
  });

  const totalPages = Math.ceil(filteredAdmins.length / itemsPerPage);
  const paginatedAdmins = filteredAdmins.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDelete = async (admin: any) => {
    if (admin.is_current_user) {
      Swal.fire("Error", "You cannot delete your own account", "error");
      return;
    }

    const res = await Swal.fire({
      title: "Delete admin?",
      text: `This will permanently remove ${admin.email} from admin access`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      confirmButtonColor: "#d33",
    });

    if (!res.isConfirmed) return;

    try {
      const r = await fetch(`/api/admin-apis/admins/${admin.id}`, {
        method: "DELETE",
      });

      const responseData = await r.json();

      if (!r.ok) {
        throw new Error(responseData.error || "Delete failed");
      }

      Swal.fire(
        "Deleted",
        `${admin.email} has been removed as admin.`,
        "success"
      );
      mutate();
    } catch (err: any) {
      console.error(err);
      Swal.fire("Error", err.message || "Failed to delete admin", "error");
    }
  };

  const handleStatusToggle = async (admin: any) => {
    if (admin.is_current_user && !admin.is_blocked) {
      Swal.fire("Error", "You cannot deactivate your own account", "error");
      return;
    }

    const isCurrentlyActive = !admin.is_blocked;
    const action = isCurrentlyActive ? "deactivate" : "activate";
    const actionText = isCurrentlyActive ? "Deactivate" : "Activate";

    let reason = "";
    if (action === "deactivate") {
      const { value: deactivateReason } = await Swal.fire({
        title: "Deactivation Reason",
        input: "text",
        inputLabel: "Please provide a reason for deactivating this admin:",
        inputPlaceholder: "e.g., Role change, security concerns",
        showCancelButton: true,
        confirmButtonText: "Continue to Deactivate",
        cancelButtonText: "Cancel",
        inputValidator: (value) => {
          if (!value) {
            return "Please provide a reason for deactivation";
          }
        },
      });

      if (!deactivateReason) return;
      reason = deactivateReason;
    }

    const confirm = await Swal.fire({
      title: `${actionText} admin?`,
      text: isCurrentlyActive
        ? `Deactivate ${
            admin.email
          }? They will lose access to the admin panel.${
            reason ? ` Reason: ${reason}` : ""
          }`
        : `Activate ${admin.email}? They will be able to access the admin panel.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: actionText,
      confirmButtonColor: isCurrentlyActive ? "#d33" : "#3085d6",
    });

    if (!confirm.isConfirmed) return;

    try {
      const r = await fetch(`/api/admin-apis/admins/${admin.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reason: action === "deactivate" ? reason : "Admin activated",
        }),
      });

      const responseData = await r.json();

      if (!r.ok) {
        throw new Error(responseData.error || `Failed to ${action} admin`);
      }

      Swal.fire(
        `${actionText}d`,
        `${admin.email} has been ${actionText.toLowerCase()}d.`,
        "success"
      );
      mutate();
    } catch (err: any) {
      console.error(err);
      Swal.fire("Error", err.message || `Failed to ${action} admin`, "error");
    }
  };

  const handleEdit = async (admin: any) => {
    const { value: formValues } = await Swal.fire({
      title: `Edit ${admin.email}`,
      html:
        `<input id="swal-first_name" class="swal2-input" placeholder="First name" value="${escapeHtml(
          admin.first_name ?? ""
        )}">` +
        `<input id="swal-last_name" class="swal2-input" placeholder="Last name" value="${escapeHtml(
          admin.last_name ?? ""
        )}">` +
        `<input id="swal-email" class="swal2-input" placeholder="Email" value="${escapeHtml(
          admin.email ?? ""
        )}">` +
        `<select id="swal-role" class="swal2-select">
          ${Object.entries(ROLE_PERMISSIONS)
            .map(
              ([key, role]) =>
                `<option value="${key}" ${
                  admin.admin_role === key ? "selected" : ""
                }>${getRoleIcon(key)} ${role.name}</option>`
            )
            .join("")}
         </select>` +
        `<select id="swal-status" class="swal2-select">
          <option value="active" ${
            !admin.is_blocked ? "selected" : ""
          }>Active</option>
          <option value="inactive" ${
            admin.is_blocked ? "selected" : ""
          }>Inactive</option>
         </select>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Save",
      preConfirm: () => {
        const first_name = (
          document.getElementById("swal-first_name") as HTMLInputElement
        )?.value?.trim();
        const last_name = (
          document.getElementById("swal-last_name") as HTMLInputElement
        )?.value?.trim();
        const email = (
          document.getElementById("swal-email") as HTMLInputElement
        )?.value?.trim();
        const role = (document.getElementById("swal-role") as HTMLSelectElement)
          ?.value;
        const status = (
          document.getElementById("swal-status") as HTMLSelectElement
        )?.value;

        if (!first_name || !last_name) {
          Swal.showValidationMessage("First name and last name are required");
          return null;
        }
        if (!email) {
          Swal.showValidationMessage("Email is required");
          return null;
        }

        return { first_name, last_name, email, role, status };
      },
    });

    if (!formValues) return;

    try {
      const r = await fetch(`/api/admin-apis/admins/${admin.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formValues),
      });

      if (!r.ok) {
        const errText = await r.text().catch(() => "");
        throw new Error(errText || "Failed to update admin");
      }

      Swal.fire("Saved", `${admin.email} updated successfully.`, "success");
      mutate();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to update admin", "error");
    }
  };

  const handleCreateAdmin = async () => {
    const { value: formValues } = await Swal.fire({
      title: "Create New Admin",
      html:
        `<input id="swal-first_name" class="swal2-input" placeholder="First name" required>` +
        `<input id="swal-last_name" class="swal2-input" placeholder="Last name" required>` +
        `<input id="swal-email" class="swal2-input" placeholder="Email" type="email" required>` +
        `<select id="swal-role" class="swal2-select" required>
          ${Object.entries(ROLE_PERMISSIONS)
            .map(
              ([key, role]) =>
                `<option value="${key}">${getRoleIcon(key)} ${
                  role.name
                }</option>`
            )
            .join("")}
         </select>` +
        `<select id="swal-status" class="swal2-select" required>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
         </select>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Create Admin",
      preConfirm: () => {
        const first_name = (
          document.getElementById("swal-first_name") as HTMLInputElement
        )?.value?.trim();
        const last_name = (
          document.getElementById("swal-last_name") as HTMLInputElement
        )?.value?.trim();
        const email = (
          document.getElementById("swal-email") as HTMLInputElement
        )?.value?.trim();
        const role = (document.getElementById("swal-role") as HTMLSelectElement)
          ?.value;
        const status = (
          document.getElementById("swal-status") as HTMLSelectElement
        )?.value;

        if (!first_name || !last_name) {
          Swal.showValidationMessage("First name and last name are required");
          return null;
        }
        if (!email) {
          Swal.showValidationMessage("Email is required");
          return null;
        }

        return { first_name, last_name, email, role, status };
      },
    });

    if (!formValues) return;

    try {
      const r = await fetch(`/api/admin-apis/admins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formValues),
      });

      if (!r.ok) {
        const errText = await r.text().catch(() => "");
        throw new Error(errText || "Failed to create admin");
      }

      Swal.fire(
        "Created",
        `Admin ${formValues.email} created successfully.`,
        "success"
      );
      mutate();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to create admin", "error");
    }
  };

  const handleForceLogout = async (admin: any) => {
    const result = await Swal.fire({
      title: "Force Logout?",
      text: `This will immediately log out ${admin.email} from all admin sessions.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Force Logout",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const r = await fetch(`/api/admin-apis/admins/${admin.id}/force-logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!r.ok) throw new Error("Force logout failed");

      Swal.fire({
        icon: "success",
        title: "Logged Out",
        text: `${admin.email} has been logged out from all sessions.`,
        timer: 2000,
        showConfirmButton: false,
      });
      mutate();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to force logout admin", "error");
    }
  };

  const handleViewLoginHistory = async (admin: any) => {
    try {
      const response = await fetch(
        `/api/admin-apis/admins/${admin.id}/login-history`
      );
      if (!response.ok) throw new Error("Failed to fetch login history");

      const history = await response.json();

      let historyHtml = '<div class="text-left max-h-64 overflow-y-auto">';
      if (history.length === 0) {
        historyHtml += '<p class="text-gray-500">No login history found.</p>';
      } else {
        historyHtml += '<ul class="space-y-2">';
        history.forEach((entry: any) => {
          const loginTime = formatDateTimeSafe(entry.login_time);
          const logoutTime = entry.logout_time
            ? formatDateTimeSafe(entry.logout_time)
            : "Still logged in";
          historyHtml += `
            <li class="border-b pb-2">
              <div class="font-medium">Login: ${loginTime}</div>
              <div class="text-sm text-gray-600">Logout: ${logoutTime}</div>
              <div class="text-xs text-gray-500">IP: ${
                entry.ip_address || "Unknown"
              }</div>
            </li>
          `;
        });
        historyHtml += "</ul>";
      }
      historyHtml += "</div>";

      await Swal.fire({
        title: `Login History - ${admin.email}`,
        html: historyHtml,
        width: 600,
        confirmButtonColor: "#3b82f6",
      });
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to load login history", "error");
    }
  };

  const handleViewPermissions = async (admin: any) => {
    const roleInfo =
      ROLE_PERMISSIONS[admin.admin_role as keyof typeof ROLE_PERMISSIONS] ||
      ROLE_PERMISSIONS.support_admin;

    let permissionsHtml = '<div class="text-left max-h-96 overflow-y-auto">';
    permissionsHtml += `<div class="mb-4 p-3 rounded-lg ${getRoleColor(
      admin.admin_role
    )}">`;
    permissionsHtml += `<h3 class="font-bold text-lg">${getRoleIcon(
      admin.admin_role
    )} ${roleInfo.name}</h3>`;
    permissionsHtml += `<p class="text-sm mt-1">${roleInfo.description}</p>`;
    permissionsHtml += `</div>`;

    permissionsHtml += `<h4 class="font-semibold mb-2">Key Permissions:</h4>`;
    permissionsHtml += `<ul class="space-y-2 text-sm">`;

    const basePermissions = [
      "Access admin dashboard",
      "View user accounts and profiles",
      "Manage user status (block/unblock)",
      "View transaction history",
      "Monitor system activity",
    ];

    basePermissions.forEach((permission) => {
      permissionsHtml += `<li class="flex items-start">
        <span class="text-green-500 mr-2 mt-0.5">✓</span>
        <span>${permission}</span>
      </li>`;
    });

    permissionsHtml += `</ul>`;
    permissionsHtml += `</div>`;

    await Swal.fire({
      title: `Permissions - ${admin.email}`,
      html: permissionsHtml,
      width: 500,
      confirmButtonColor: "#3b82f6",
    });
  };

  const renderStatusCell = (value: string, row: any) => {
    if (!row.is_blocked) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          ● Active
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          ○ Inactive
        </span>
      );
    }
  };

  const renderRoleCell = (value: string, row: any) => {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${row.role_color}`}
      >
        {row.role_icon} {row.role_display}
      </span>
    );
  };

  const render2FACell = (value: boolean) => {
    if (value) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          ✓ Enabled
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          ○ Disabled
        </span>
      );
    }
  };

  const renderLastLoginCell = (value: string, row: any) => {
    if (!row.last_login_raw) {
      return <span className="text-gray-400 italic">Never</span>;
    }

    const formattedDate = formatDateTimeSafe(row.last_login_raw);

    if (!isClient) {
      return formattedDate;
    }

    try {
      const loginDate = new Date(row.last_login_raw);
      if (isNaN(loginDate.getTime())) return "Invalid date";

      const now = new Date();
      const hoursDiff =
        (now.getTime() - loginDate.getTime()) / (1000 * 60 * 60);

      if (hoursDiff < 24) {
        return (
          <span className="text-green-600 font-medium">{formattedDate}</span>
        );
      } else if (hoursDiff < 168) {
        return <span className="text-blue-600">{formattedDate}</span>;
      } else {
        return <span className="text-orange-500">{formattedDate}</span>;
      }
    } catch (error) {
      return "Invalid date";
    }
  };

  const renderLastActiveCell = (value: string, row: any) => {
    return formatDateTimeSafe(row.last_active_raw);
  };

  const renderCreatedAtCell = (value: string, row: any) => {
    return formatDateSafe(row.created_at_raw);
  };

  const columns = [
    { key: "email", label: "Email" },
    { key: "full_name", label: "Name" },
    { key: "role", label: "Role", render: renderRoleCell },
    { key: "status", label: "Status", render: renderStatusCell },
    { key: "last_login", label: "Last Login", render: renderLastLoginCell },
    { key: "last_active", label: "Last Active", render: renderLastActiveCell },
    { key: "created_at", label: "Created", render: renderCreatedAtCell },
    { key: "two_factor_enabled", label: "2FA", render: render2FACell },
  ];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <Loader />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="p-6">
          <p className="text-red-600">
            Access Denied:{" "}
            {error.message ||
              "You do not have permission to access admin management"}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Only Super Admins can access this section.
          </p>
        </div>
      </AdminLayout>
    );
  }

  if (!data || data.error) {
    return (
      <AdminLayout>
        <div className="p-6">
          <p className="text-red-600">
            Access Denied:{" "}
            {data?.error ||
              "You do not have permission to view admin management"}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Only Super Admins can access this section.
          </p>
        </div>
      </AdminLayout>
    );
  }

  if (admins.length === 0 && !isLoading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <p>No admins available.</p>
          <Button onClick={handleCreateAdmin} className="mt-4">
            ➕ Add First Admin
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Admin Management</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => mutate()}>
              🔄 Refresh
            </Button>
            <Button
              className="bg-[#C29307] text-white hover:bg-[#a87e06]"
              onClick={handleCreateAdmin}
            >
              + Add Admin
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Total Admins</h3>
            <p className="text-2xl font-semibold">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Active</h3>
            <p className="text-2xl font-semibold text-green-600">
              {stats.active}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Super Admins</h3>
            <p className="text-2xl font-semibold text-red-600">
              {stats.super_admin}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Operations</h3>
            <p className="text-2xl font-semibold text-blue-600">
              {stats.operations_admin}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Support</h3>
            <p className="text-2xl font-semibold text-green-600">
              {stats.support_admin}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Finance</h3>
            <p className="text-2xl font-semibold text-purple-600">
              {stats.finance_admin}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Legal</h3>
            <p className="text-2xl font-semibold text-orange-600">
              {stats.legal_admin}
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/4">
            <Input
              placeholder="Search by email, name, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="w-full md:w-1/5">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-1/5">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {Object.entries(ROLE_PERMISSIONS).map(([key, role]) => (
                  <SelectItem key={key} value={key}>
                    {getRoleIcon(key)} {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-1/5">
            <Select value={activityFilter} onValueChange={setActivityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Activity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activity</SelectItem>
                <SelectItem value="active">Active (30d)</SelectItem>
                <SelectItem value="today">Active Today</SelectItem>
                <SelectItem value="week">Active This Week</SelectItem>
                <SelectItem value="inactive">Inactive (30d+)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="text-sm text-gray-500">
          Showing {paginatedAdmins.length} of {filteredAdmins.length} admins
          {searchTerm && ` matching "${searchTerm}"`}
          {activityFilter !== "all" && ` (${activityFilter})`}
        </div>

        <AdminTable
          columns={columns}
          rows={paginatedAdmins}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onBlockToggle={handleStatusToggle}
          onForceLogout={handleForceLogout}
          onViewLoginHistory={handleViewLoginHistory}
          customActions={[
            {
              label: "View Permissions",
              onClick: handleViewPermissions,
              className: "text-purple-600",
              icon: "🔐",
            },
          ]}
        />

        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    className={
                      currentPage === 1 ? "pointer-events-none opacity-50" : ""
                    }
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      href="#"
                      isActive={i + 1 === currentPage}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(p + 1, totalPages))
                    }
                    className={
                      currentPage >= totalPages
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function escapeHtml(s: string) {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
