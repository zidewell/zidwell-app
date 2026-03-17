"use client";

import useSWR from "swr";
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import AdminTable from "@/app/components/admin-components/AdminTable";
import UserProfilePage from "@/app/components/admin-components/UserProfile";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function UsersPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [activityFilter, setActivityFilter] = useState("all");
  const [balanceFilter, setBalanceFilter] = useState("all"); // NEW: Balance filter
  const [isClient, setIsClient] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("active");
  const [exportLoading, setExportLoading] = useState(false);
  const itemsPerPage = 10;

  // Balance thresholds
  const LOW_BALANCE_THRESHOLD = 1000; // ₦1,000
  const HIGH_BALANCE_THRESHOLD = 100000; // ₦100,000

  // Fetch data based on active tab
  const { data, error, isLoading, mutate } = useSWR(
    activeTab === "pending"
      ? "/api/admin-apis/users/pending-users"
      : "/api/admin-apis/users",
    fetcher,
  );

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    statusFilter,
    roleFilter,
    activityFilter,
    activeTab,
    balanceFilter,
  ]);

  // Process users data for active users tab
  const activeUsers = React.useMemo(() => {
    if (!data || activeTab === "pending") return [];
    return (data?.users ?? data).map((user: any) => ({
      ...user,
      full_name: `${user.first_name} ${user.last_name}`,
      balance: user.wallet_balance || 0,
      created_at_raw: user.created_at,
      last_login_raw: user.last_login,
      last_logout_raw: user.last_logout,
      is_blocked: user.is_blocked || user.status === "blocked",
    }));
  }, [data, activeTab]);

  // Process pending users data
  const pendingUsers = React.useMemo(() => {
    if (!data || activeTab === "active") return [];
    return (data?.users ?? data).map((user: any) => ({
      ...user,
      full_name: `${user.first_name} ${user.last_name}`,
      created_at_raw: user.created_at,
      status: "pending",
    }));
  }, [data, activeTab]);

  // Helper functions for user activity
  const isUserRecentlyActive = (user: any) => {
    const isActiveStatus = !user.is_blocked && user.status === "active";
    const hasRecentLogin = user.last_login_raw;

    if (hasRecentLogin) {
      const lastLogin = new Date(user.last_login_raw);
      const daysSinceLogin =
        (Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);
      return isActiveStatus && daysSinceLogin <= 30;
    }

    return isActiveStatus;
  };

  const isUserActiveToday = (user: any) => {
    if (user.is_blocked || user.status !== "active" || !user.last_login_raw)
      return false;
    const lastLogin = new Date(user.last_login_raw);
    const today = new Date();
    return lastLogin.toDateString() === today.toDateString();
  };

  const isUserActiveThisWeek = (user: any) => {
    if (user.is_blocked || user.status !== "active" || !user.last_login_raw)
      return false;
    const lastLogin = new Date(user.last_login_raw);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return lastLogin > weekAgo;
  };

  const isUserInactive = (user: any) => {
    if (user.is_blocked || user.status !== "active") return false;
    if (!user.last_login_raw) return true;
    const lastLogin = new Date(user.last_login_raw);
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return lastLogin < monthAgo;
  };

  // Helper functions for balance filtering
  const isLowBalance = (user: any) => {
    const balance = Number(user.balance) || 0;
    return balance <= LOW_BALANCE_THRESHOLD && balance >= 0;
  };

  const isHighBalance = (user: any) => {
    const balance = Number(user.balance) || 0;
    return balance >= HIGH_BALANCE_THRESHOLD;
  };

  const isNegativeBalance = (user: any) => {
    const balance = Number(user.balance) || 0;
    return balance < 0;
  };

  // Calculate user counts
  const recentlyActiveUsers = activeUsers.filter(isUserRecentlyActive);
  const activeTodayCount = activeUsers.filter(isUserActiveToday);
  const activeThisWeekCount = activeUsers.filter(isUserActiveThisWeek);
  const inactiveUsers = activeUsers.filter(isUserInactive);
  const blockedUsers = activeUsers.filter((user: any) => user.is_blocked);
  const lowBalanceUsers = activeUsers.filter(isLowBalance);
  const highBalanceUsers = activeUsers.filter(isHighBalance);
  const negativeBalanceUsers = activeUsers.filter(isNegativeBalance);
  const pendingUsersCount =
    activeTab === "active"
      ? data?.stats?.pending || pendingUsers.length
      : pendingUsers.length;

  // Filter users based on search and filters
  const filteredActiveUsers = activeUsers.filter((user: any) => {
    const matchesSearch =
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && !user.is_blocked) ||
      (statusFilter === "blocked" && user.is_blocked);

    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    const matchesActivity =
      activityFilter === "all" ||
      (activityFilter === "active" && isUserRecentlyActive(user)) ||
      (activityFilter === "today" && isUserActiveToday(user)) ||
      (activityFilter === "week" && isUserActiveThisWeek(user)) ||
      (activityFilter === "inactive" && isUserInactive(user));

    // NEW: Balance filter logic
    const matchesBalance =
      balanceFilter === "all" ||
      (balanceFilter === "low" && isLowBalance(user)) ||
      (balanceFilter === "high" && isHighBalance(user)) ||
      (balanceFilter === "negative" && isNegativeBalance(user)) ||
      (balanceFilter === "zero" && (Number(user.balance) || 0) === 0);

    return (
      matchesSearch &&
      matchesStatus &&
      matchesRole &&
      matchesActivity &&
      matchesBalance
    );
  });

  // Filter pending users based on search
  const filteredPendingUsers = pendingUsers.filter((user: any) => {
    return (
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Determine which data to use based on active tab
  const currentUsers =
    activeTab === "active" ? filteredActiveUsers : filteredPendingUsers;
  const currentData = activeTab === "active" ? activeUsers : pendingUsers;

  // Pagination
  const totalPages = Math.ceil(currentUsers.length / itemsPerPage);
  const paginatedUsers = currentUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // ---------- User Profile Navigation ----------
  const handleUserClick = (user: any) => {
    setSelectedUserId(user.id);
  };

  const handleBackToUsers = () => {
    setSelectedUserId(null);
  };

  // ---------- Export to CSV ----------
  const handleExportCSV = async () => {
    setExportLoading(true);
    try {
      // Build query parameters with all current filters
      const params = new URLSearchParams();

      // Basic filters
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (roleFilter !== "all") params.append("role", roleFilter);
      if (activityFilter !== "all") params.append("activity", activityFilter);
      if (balanceFilter !== "all") params.append("balance", balanceFilter);

      // Add tab type and current page info
      params.append("type", activeTab);
      params.append("page", currentPage.toString());
      params.append("limit", itemsPerPage.toString());

      // Add balance thresholds for accurate server-side filtering
      params.append("low_threshold", LOW_BALANCE_THRESHOLD.toString());
      params.append("high_threshold", HIGH_BALANCE_THRESHOLD.toString());

      console.log("Exporting with params:", params.toString());

      const response = await fetch(
        `/api/admin-apis/users/export?${params.toString()}`,
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Export failed: ${errorText}`);
      }

      // Get the filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `${activeTab}_users_${
        new Date().toISOString().split("T")[0]
      }.csv`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
        );
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, "");
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      Swal.fire({
        icon: "success",
        title: "Export Successful",
        text: `Exported ${currentUsers.length} users to CSV`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error: any) {
      console.error("Export error:", error);
      Swal.fire({
        icon: "error",
        title: "Export Failed",
        text: error.message || "Failed to export users data. Please try again.",
      });
    } finally {
      setExportLoading(false);
    }
  };

  // ---------- Handle Pending User Actions ----------
  const handleApprovePendingUser = async (user: any) => {
    const result = await Swal.fire({
      title: "Approve User?",
      text: `This will approve ${user.email} and allow them to access the platform.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Approve",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const r = await fetch(
        `/api/admin-apis/users/pending-users/${user.id}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (!r.ok) {
        const errorData = await r.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to approve user");
      }

      Swal.fire({
        icon: "success",
        title: "User Approved",
        text: `${user.email} has been approved and can now access the platform.`,
        timer: 2000,
        showConfirmButton: false,
      });

      mutate();
    } catch (err: any) {
      console.error(err);
      Swal.fire("Error", err.message || "Failed to approve user", "error");
    }
  };

  const handleRejectPendingUser = async (user: any) => {
    const { value: reason } = await Swal.fire({
      title: "Reject User Registration",
      input: "text",
      inputLabel: "Please provide a reason for rejection:",
      inputPlaceholder: "e.g., Invalid documentation, incomplete information",
      showCancelButton: true,
      confirmButtonText: "Reject User",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
      inputValidator: (value) => {
        if (!value) {
          return "Please provide a reason for rejection";
        }
      },
    });

    if (!reason) return;

    const confirm = await Swal.fire({
      title: "Confirm Rejection?",
      text: `This will permanently reject ${user.email}'s registration.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Reject",
      cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;

    try {
      const r = await fetch(
        `/api/admin-apis/users/pending-users/${user.id}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
        },
      );

      if (!r.ok) {
        const errorData = await r.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to reject user");
      }

      Swal.fire({
        icon: "success",
        title: "User Rejected",
        text: `${user.email} has been rejected.`,
        timer: 2000,
        showConfirmButton: false,
      });

      mutate();
    } catch (err: any) {
      console.error(err);
      Swal.fire("Error", err.message || "Failed to reject user", "error");
    }
  };

  // ---------- Delete ----------
  const handleDelete = async (user: any) => {
    const res = await Swal.fire({
      title: "Delete user?",
      text: `This will permanently delete ${user.email}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      confirmButtonColor: "#d33",
    });

    if (!res.isConfirmed) return;

    try {
      const endpoint =
        activeTab === "pending"
          ? `/api/admin-apis/users/pending-users/${user.id}`
          : `/api/admin-apis/users/${user.id}`;

      const r = await fetch(endpoint, {
        method: "DELETE",
      });

      if (!r.ok) throw new Error("Delete failed");

      Swal.fire("Deleted", `${user.email} has been deleted.`, "success");
      mutate();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to delete user", "error");
    }
  };

  // ---------- Block / Unblock ----------
  const handleBlockToggle = async (user: any) => {
    const isCurrentlyBlocked = user.is_blocked;
    const action = isCurrentlyBlocked ? "unblock" : "block";
    const actionText = isCurrentlyBlocked ? "Unblock" : "Block";

    let reason = "";
    if (action === "block") {
      const { value: blockReason } = await Swal.fire({
        title: "Block Reason",
        input: "text",
        inputLabel: "Please provide a reason for blocking this user:",
        inputPlaceholder: "e.g., Violation of terms of service",
        showCancelButton: true,
        confirmButtonText: "Continue to Block",
        cancelButtonText: "Cancel",
        inputValidator: (value) => {
          if (!value) {
            return "Please provide a reason for blocking";
          }
        },
      });

      if (!blockReason) return;
      reason = blockReason;
    }

    const confirm = await Swal.fire({
      title: `${actionText} user?`,
      text: isCurrentlyBlocked
        ? `Unblock ${user.email}? They will be able to log in again.`
        : `Block ${user.email}? They will not be able to log in.${
            reason ? ` Reason: ${reason}` : ""
          }`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: actionText,
      confirmButtonColor: isCurrentlyBlocked ? "#3085d6" : "#d33",
    });

    if (!confirm.isConfirmed) return;

    try {
      const r = await fetch(`/api/admin-apis/users/${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reason: action === "block" ? reason : "Admin unblocked",
        }),
      });

      if (!r.ok) {
        const errorData = await r.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to ${action} user`);
      }

      const result = await r.json();

      Swal.fire(
        `${actionText}ed`,
        `${user.email} has been ${actionText.toLowerCase()}ed.`,
        "success",
      );
      mutate();
    } catch (err: any) {
      console.error(err);
      Swal.fire("Error", err.message || `Failed to ${action} user`, "error");
    }
  };

  // ---------- Edit modal ----------
  const handleEdit = async (user: any) => {
    const { value: formValues } = await Swal.fire({
      title: `Edit ${user.email}`,
      html:
        `<input id="swal-first_name" class="swal2-input" placeholder="First name" value="${escapeHtml(
          user.first_name ?? "",
        )}">` +
        `<input id="swal-last_name" class="swal2-input" placeholder="Last name" value="${escapeHtml(
          user.last_name ?? "",
        )}">` +
        `<input id="swal-email" class="swal2-input" placeholder="Email" value="${escapeHtml(
          user.email ?? "",
        )}">` +
        `<input id="swal-phone" class="swal2-input" placeholder="Phone" value="${escapeHtml(
          user.phone ?? "",
        )}">` +
        `<select id="swal-role" class="swal2-select">
           <option value="user" ${
             user.role === "user" ? "selected" : ""
           }>user</option>
           <option value="admin" ${
             user.role === "admin" ? "selected" : ""
           }>admin</option>
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
        const phone = (
          document.getElementById("swal-phone") as HTMLInputElement
        )?.value?.trim();
        const role = (document.getElementById("swal-role") as HTMLSelectElement)
          ?.value;

        if (!first_name || !last_name) {
          Swal.showValidationMessage("First name and last name are required");
          return null;
        }
        if (!email) {
          Swal.showValidationMessage("Email is required");
          return null;
        }

        return { first_name, last_name, email, phone, role };
      },
    });

    if (!formValues) return;

    try {
      const r = await fetch(`/api/admin-apis/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formValues),
      });

      if (!r.ok) {
        const errText = await r.text().catch(() => "");
        throw new Error(errText || "Failed to update user");
      }

      Swal.fire("Saved", `${user.email} updated successfully.`, "success");
      mutate();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to update user", "error");
    }
  };

  // ---------- Force Logout ----------
  const handleForceLogout = async (user: any) => {
    const result = await Swal.fire({
      title: "Force Logout?",
      text: `This will immediately log out ${user.email} from all sessions.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Force Logout",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const r = await fetch(`/api/admin-apis/users/${user.id}/force-logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!r.ok) throw new Error("Force logout failed");

      Swal.fire({
        icon: "success",
        title: "Logged Out",
        text: `${user.email} has been logged out from all sessions.`,
        timer: 2000,
        showConfirmButton: false,
      });
      mutate();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to force logout user", "error");
    }
  };

  // ---------- View Login History ----------
  const handleViewLoginHistory = async (user: any) => {
    try {
      const response = await fetch(
        `/api/admin-apis/users/${user.id}/login-history`,
      );
      if (!response.ok) throw new Error("Failed to fetch login history");

      const history = await response.json();

      let historyHtml = '<div class="text-left max-h-64 overflow-y-auto">';
      if (history.length === 0) {
        historyHtml += '<p class="text-gray-500">No login history found.</p>';
      } else {
        historyHtml += '<ul class="space-y-2">';
        history.forEach((entry: any) => {
          const loginTime = isClient
            ? new Date(entry.login_time).toLocaleString()
            : entry.login_time;
          const logoutTime = entry.logout_time
            ? isClient
              ? new Date(entry.logout_time).toLocaleString()
              : entry.logout_time
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
        title: `Login History - ${user.email}`,
        html: historyHtml,
        width: 600,
        confirmButtonColor: "#3b82f6",
      });
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to load login history", "error");
    }
  };

  // Custom cell renderers
  const renderStatusCell = (value: string, row: any) => {
    if (row.is_blocked) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          ⛔ Blocked
        </span>
      );
    } else if (value === "active") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          ● Active
        </span>
      );
    } else if (value === "pending") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          ⏳ Pending
        </span>
      );
    }
    return value;
  };

  const renderKycCell = (value: string) => {
    if (value === "verified" || value === "approved") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          ✓ Verified
        </span>
      );
    } else if (value === "pending") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          ⏳ Pending
        </span>
      );
    } else if (value === "rejected" || value === "failed") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          ✗ Rejected
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          ○ Not Started
        </span>
      );
    }
  };

  const renderBalanceCell = (value: number, row: any) => {
    const amount = Number(value) || 0;
    let balanceClass = "";

    if (amount > HIGH_BALANCE_THRESHOLD) {
      balanceClass = "font-bold text-purple-600";
    } else if (amount <= LOW_BALANCE_THRESHOLD && amount >= 0) {
      balanceClass = "text-[#2b825b]";
    } else if (amount < 0) {
      balanceClass = "font-medium text-red-600";
    } else if (amount === 0) {
      balanceClass = "text-gray-500";
    } else {
      balanceClass = "text-green-600";
    }

    return (
      <span className={`font-medium ${balanceClass}`}>
        ₦{amount.toLocaleString()}
        {amount > HIGH_BALANCE_THRESHOLD && " 💰"}
        {amount < 0 && " ⚠️"}
        {amount <= LOW_BALANCE_THRESHOLD && amount >= 0 && " 📉"}
      </span>
    );
  };

  const renderLastLoginCell = (value: string, row: any) => {
    if (!row.last_login_raw) {
      return <span className="text-gray-400 italic">Never</span>;
    }

    if (!isClient) {
      return row.last_login_raw;
    }

    try {
      const loginDate = new Date(row.last_login_raw);
      if (isNaN(loginDate.getTime())) return "Invalid date";

      const now = new Date();
      const hoursDiff =
        (now.getTime() - loginDate.getTime()) / (1000 * 60 * 60);

      const formattedDate = loginDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

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

  const renderCreatedAtCell = (value: string, row: any) => {
    if (!row.created_at_raw) return "-";

    if (!isClient) {
      return row.created_at_raw;
    }

    try {
      const date = new Date(row.created_at_raw);
      if (isNaN(date.getTime())) return "Invalid date";

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  const renderLastLogoutCell = (value: string, row: any) => {
    if (!row.last_logout_raw) {
      return <span className="text-gray-400 italic">Never</span>;
    }

    if (!isClient) {
      return row.last_logout_raw;
    }

    try {
      const logoutDate = new Date(row.last_logout_raw);
      if (isNaN(logoutDate.getTime())) return "Invalid date";

      return logoutDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  const renderPhoneCell = (value: string) => {
    if (!value) {
      return <span className="text-gray-400 italic">Not set</span>;
    }
    return <span className="text-gray-700">{value}</span>;
  };

  // Define columns for active users
  const activeUserColumns = [
    { key: "email", label: "Email" },
    { key: "full_name", label: "Name" },
    { key: "balance", label: "Balance", render: renderBalanceCell },
    { key: "status", label: "Status", render: renderStatusCell },
    { key: "last_login", label: "Last Login", render: renderLastLoginCell },
    { key: "last_logout", label: "Last Logout", render: renderLastLogoutCell },
    { key: "created_at", label: "Created", render: renderCreatedAtCell },
    { key: "phone", label: "Phone", render: renderPhoneCell },
    { key: "kyc_status", label: "KYC", render: renderKycCell },
  ];

  // Define columns for pending users
  const pendingUserColumns = [
    { key: "email", label: "Email" },
    { key: "full_name", label: "Name" },
    { key: "phone", label: "Phone", render: renderPhoneCell },
    { key: "created_at", label: "Registered", render: renderCreatedAtCell },
    { key: "kyc_status", label: "KYC", render: renderKycCell },
    { key: "status", label: "Status", render: renderStatusCell },
  ];

  // Show user profile if a user is selected
  if (selectedUserId) {
    return (
      <UserProfilePage userId={selectedUserId} onBack={handleBackToUsers} />
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <Loader />
        </div>
      </AdminLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <AdminLayout>
        <div className="p-6">
          <p className="text-red-600">Failed to load users ❌</p>
        </div>
      </AdminLayout>
    );
  }

  // Show empty state
  if (!data || currentData.length === 0) {
    return (
      <AdminLayout>
        <div className="p-6">
          <p>No {activeTab} users available.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Users Management</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={exportLoading || currentUsers.length === 0}
            >
              {exportLoading ? "Exporting..." : "📥 Export CSV"}
            </Button>
            <Button variant="outline" onClick={() => mutate()}>
              🔄 Refresh
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Cards - Added Balance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
            <p className="text-2xl font-semibold">
              {activeUsers.length + pendingUsersCount}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {activeUsers.length} active + {pendingUsersCount} pending
            </p>
          </div>

          {activeTab === "active" ? (
            <>
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <h3 className="text-sm font-medium text-gray-500">
                  High Balance
                </h3>
                <p className="text-2xl font-semibold text-purple-600">
                  {highBalanceUsers.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  ≥ ₦{HIGH_BALANCE_THRESHOLD.toLocaleString()}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <h3 className="text-sm font-medium text-gray-500">
                  Low Balance
                </h3>
                <p className="text-2xl font-semibold text-[#2b825b]">
                  {lowBalanceUsers.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  ≤ ₦{LOW_BALANCE_THRESHOLD.toLocaleString()}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <h3 className="text-sm font-medium text-gray-500">
                  Negative Balance
                </h3>
                <p className="text-2xl font-semibold text-red-600">
                  {negativeBalanceUsers.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  ⚠️ Overdrawn accounts
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <h3 className="text-sm font-medium text-gray-500">
                  Blocked Users
                </h3>
                <p className="text-2xl font-semibold text-red-600">
                  {blockedUsers.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Cannot login</p>
              </div>
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <h3 className="text-sm font-medium text-gray-500">
                  Active (30d)
                </h3>
                <p className="text-2xl font-semibold text-green-600">
                  {recentlyActiveUsers.length}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <h3 className="text-sm font-medium text-gray-500">
                  Active Today
                </h3>
                <p className="text-2xl font-semibold text-blue-600">
                  {activeTodayCount.length}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <h3 className="text-sm font-medium text-gray-500">
                  Active This Week
                </h3>
                <p className="text-2xl font-semibold text-purple-600">
                  {activeThisWeekCount.length}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <h3 className="text-sm font-medium text-gray-500">
                  Inactive (30d+)
                </h3>
                <p className="text-2xl font-semibold text-orange-600">
                  {inactiveUsers.length}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <h3 className="text-sm font-medium text-gray-500">
                  Total Pending
                </h3>
                <p className="text-2xl font-semibold text-[#2b825b]">
                  {pendingUsersCount}
                </p>
                <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
              </div>
              <div className="bg-white p-4 rounded-lg border shadow-sm col-span-7">
                <h3 className="text-sm font-medium text-gray-500">
                  Pending Registration
                </h3>
                <p className="text-lg font-medium">
                  Review and approve new user registrations
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Click on a user to review details, then approve or reject
                </p>
              </div>
            </>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="active">
              Active Users ({activeUsers.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending Users ({pendingUsersCount})
            </TabsTrigger>
          </TabsList>

          {/* Active Users Tab */}
          <TabsContent value="active" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-1/5">
                <Input
                  placeholder="Search by email, name, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="w-full md:w-1/6">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full md:w-1/6">
                <Select
                  value={activityFilter}
                  onValueChange={setActivityFilter}
                >
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

              {/* NEW: Balance Filter */}
              <div className="w-full md:w-1/6">
                <Select value={balanceFilter} onValueChange={setBalanceFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Balances" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Balances</SelectItem>
                    <SelectItem value="high">
                      High Balance (≥ ₦{HIGH_BALANCE_THRESHOLD.toLocaleString()}
                      )
                    </SelectItem>
                    <SelectItem value="low">
                      Low Balance (≤ ₦{LOW_BALANCE_THRESHOLD.toLocaleString()})
                    </SelectItem>
                    <SelectItem value="negative">Negative Balance</SelectItem>
                    <SelectItem value="zero">Zero Balance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results Count */}
            <div className="text-sm text-gray-500">
              Showing {paginatedUsers.length} of {filteredActiveUsers.length}{" "}
              active users
              {searchTerm && ` matching "${searchTerm}"`}
              {activityFilter !== "all" && ` (${activityFilter})`}
              {balanceFilter !== "all" && ` (${balanceFilter} balance)`}
            </div>

            {/* Table */}
            <AdminTable
              columns={activeUserColumns}
              rows={paginatedUsers}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onBlockToggle={handleBlockToggle}
              onForceLogout={handleForceLogout}
              onViewLoginHistory={handleViewLoginHistory}
              onRowClick={handleUserClick}
            />
          </TabsContent>

          {/* Pending Users Tab */}
          <TabsContent value="pending" className="space-y-4">
            {/* Filters for Pending Users */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-1/3">
                <Input
                  placeholder="Search pending users by email, name, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Results Count */}
            <div className="text-sm text-gray-500">
              Showing {paginatedUsers.length} of {filteredPendingUsers.length}{" "}
              pending users
              {searchTerm && ` matching "${searchTerm}"`}
            </div>

            {/* Table */}
            <AdminTable
              columns={pendingUserColumns}
              rows={paginatedUsers}
              onDelete={handleDelete}
              onRowClick={handleUserClick}
              customActions={[
                {
                  label: "Approve",
                  onClick: handleApprovePendingUser,
                  variant: "secondary",
                  className: "font-medium",
                  icon: "✓",
                },
                {
                  label: "Reject",
                  onClick: handleRejectPendingUser,
                  variant: "destructive",
                  className: "font-medium",
                  icon: "✗",
                },
              ]}
            />
          </TabsContent>
        </Tabs>

        {/* Pagination */}
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

/**
 * Small helper to escape input values used inside html template string
 * to avoid breaking the SweetAlert HTML.
 */
function escapeHtml(s: string) {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
