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
  const [balanceFilter, setBalanceFilter] = useState("all");
  const [isClient, setIsClient] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("active");
  const [exportLoading, setExportLoading] = useState(false);
  const [totalCounts, setTotalCounts] = useState({
    active: 0,
    pending: 0
  });
  const itemsPerPage = 10;

  const LOW_BALANCE_THRESHOLD = 1000;
  const HIGH_BALANCE_THRESHOLD = 100000;

  const { data, error, isLoading, mutate } = useSWR(
    activeTab === "pending"
      ? "/api/admin-apis/users/pending-users"
      : "/api/admin-apis/users",
    fetcher,
  );

  useEffect(() => {
    const fetchTotalCounts = async () => {
      try {
        const activeRes = await fetch("/api/admin-apis/users?limit=1");
        const activeData = await activeRes.json();
        
        const pendingRes = await fetch("/api/admin-apis/users/pending-users?limit=1");
        const pendingData = await pendingRes.json();
        
        setTotalCounts({
          active: activeData.total || 0,
          pending: pendingData.total || 0
        });
      } catch (error) {
        console.error("Failed to fetch total counts:", error);
      }
    };
    
    fetchTotalCounts();
  }, []);

  useEffect(() => {
    if (data) {
      if (activeTab === "active") {
        setTotalCounts(prev => ({
          ...prev,
          active: data.total || data.users?.length || 0,
          pending: data.stats?.pending || prev.pending
        }));
      } else {
        setTotalCounts(prev => ({
          ...prev,
          pending: data.total || data.users?.length || 0,
          active: prev.active
        }));
      }
    }
  }, [data, activeTab]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, roleFilter, activityFilter, activeTab, balanceFilter]);

  const activeUsers = React.useMemo(() => {
    if (!data || activeTab === "pending") return [];
    const usersArray = data?.users ?? data;
    return usersArray.filter((user: any) => user.bvn_verification === "verified").map((user: any) => ({
      ...user,
      full_name: user.full_name || "",
      balance: user.wallet_balance || 0,
      created_at_raw: user.created_at,
      last_login_raw: user.last_login,
      last_logout_raw: user.last_logout,
      is_blocked: user.is_blocked || user.status === "blocked",
      phone: user.phone || "",
    }));
  }, [data, activeTab]);

  const pendingUsers = React.useMemo(() => {
    if (!data || activeTab === "active") return [];
    const usersArray = data?.users ?? data;
    return usersArray.map((user: any) => ({
      ...user,
      full_name: user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
      created_at_raw: user.created_at,
      status: "pending",
      phone: user.phone || "",
      kyc_status: user.kyc_status || user.bvn_verification || "not_submitted",
      source: user.source || (user.bvn_verification === "not_submitted" ? "users_table" : "pending_table"),
    }));
  }, [data, activeTab]);

  const isUserRecentlyActive = (user: any) => {
    const isActiveStatus = !user.is_blocked && user.status === "active";
    const hasRecentLogin = user.last_login_raw;
    if (hasRecentLogin) {
      const lastLogin = new Date(user.last_login_raw);
      const daysSinceLogin = (Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);
      return isActiveStatus && daysSinceLogin <= 30;
    }
    return isActiveStatus;
  };

  const isUserActiveToday = (user: any) => {
    if (user.is_blocked || user.status !== "active" || !user.last_login_raw) return false;
    const lastLogin = new Date(user.last_login_raw);
    const today = new Date();
    return lastLogin.toDateString() === today.toDateString();
  };

  const isUserActiveThisWeek = (user: any) => {
    if (user.is_blocked || user.status !== "active" || !user.last_login_raw) return false;
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

  const recentlyActiveUsers = activeUsers.filter(isUserRecentlyActive);
  const activeTodayCount = activeUsers.filter(isUserActiveToday);
  const activeThisWeekCount = activeUsers.filter(isUserActiveThisWeek);
  const inactiveUsers = activeUsers.filter(isUserInactive);
  const blockedUsers = activeUsers.filter((user: any) => user.is_blocked);
  const lowBalanceUsers = activeUsers.filter(isLowBalance);
  const highBalanceUsers = activeUsers.filter(isHighBalance);
  const negativeBalanceUsers = activeUsers.filter(isNegativeBalance);

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

    const matchesBalance =
      balanceFilter === "all" ||
      (balanceFilter === "low" && isLowBalance(user)) ||
      (balanceFilter === "high" && isHighBalance(user)) ||
      (balanceFilter === "negative" && isNegativeBalance(user)) ||
      (balanceFilter === "zero" && (Number(user.balance) || 0) === 0);

    return matchesSearch && matchesStatus && matchesRole && matchesActivity && matchesBalance;
  });

  const filteredPendingUsers = pendingUsers.filter((user: any) => {
    return (
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const currentUsers = activeTab === "active" ? filteredActiveUsers : filteredPendingUsers;
  const totalPages = Math.ceil(currentUsers.length / itemsPerPage);
  const paginatedUsers = currentUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleUserClick = (user: any) => {
    setSelectedUserId(user.id);
  };

  const handleBackToUsers = () => {
    setSelectedUserId(null);
  };

  const handleExportCSV = async () => {
    setExportLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (roleFilter !== "all") params.append("role", roleFilter);
      if (activityFilter !== "all") params.append("activity", activityFilter);
      if (balanceFilter !== "all") params.append("balance", balanceFilter);
      params.append("type", activeTab);
      params.append("low_threshold", LOW_BALANCE_THRESHOLD.toString());
      params.append("high_threshold", HIGH_BALANCE_THRESHOLD.toString());

      const response = await fetch(`/api/admin-apis/users/export?${params.toString()}`);
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeTab}_users_${new Date().toISOString().split("T")[0]}.csv`;
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
      Swal.fire({ icon: "error", title: "Export Failed", text: error.message });
    } finally {
      setExportLoading(false);
    }
  };

  const handleApprovePendingUser = async (user: any) => {
    const result = await Swal.fire({
      title: "Approve User?",
      text: `This will approve ${user.email} and allow them to access the platform.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      confirmButtonText: "Approve",
    });

    if (!result.isConfirmed) return;

    try {
      const r = await fetch(`/api/admin-apis/users/pending-users/${user.id}/approve`, {
        method: "POST",
      });

      if (!r.ok) throw new Error("Failed to approve user");

      Swal.fire({ icon: "success", title: "User Approved", timer: 2000, showConfirmButton: false });
      mutate();
      
      const pendingRes = await fetch("/api/admin-apis/users/pending-users?limit=1");
      const pendingData = await pendingRes.json();
      setTotalCounts(prev => ({ ...prev, pending: pendingData.total || 0 }));
    } catch (err: any) {
      Swal.fire("Error", err.message || "Failed to approve user", "error");
    }
  };

  const handleRejectPendingUser = async (user: any) => {
    const { value: reason } = await Swal.fire({
      title: "Reject User",
      input: "text",
      inputLabel: "Reason for rejection:",
      showCancelButton: true,
      confirmButtonText: "Reject",
      confirmButtonColor: "#ef4444",
    });

    if (!reason) return;

    try {
      const source = user.source || (user.bvn_verification === "not_submitted" ? "users_table" : "pending_table");
      const r = await fetch(`/api/admin-apis/users/pending-users/${user.id}?source=${source}`, {
        method: "DELETE",
        body: JSON.stringify({ reason }),
      });

      if (!r.ok) throw new Error("Failed to reject user");

      Swal.fire({ icon: "success", title: "User Rejected", timer: 2000, showConfirmButton: false });
      mutate();
      
      const pendingRes = await fetch("/api/admin-apis/users/pending-users?limit=1");
      const pendingData = await pendingRes.json();
      setTotalCounts(prev => ({ ...prev, pending: pendingData.total || 0 }));
    } catch (err: any) {
      Swal.fire("Error", err.message || "Failed to reject user", "error");
    }
  };

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
      const endpoint = activeTab === "pending"
        ? `/api/admin-apis/users/pending-users/${user.id}?source=${user.source || "pending_table"}`
        : `/api/admin-apis/users/${user.id}`;

      const r = await fetch(endpoint, { method: "DELETE" });
      if (!r.ok) throw new Error("Delete failed");

      Swal.fire("Deleted", `${user.email} has been deleted.`, "success");
      mutate();
      
      if (activeTab === "pending") {
        const pendingRes = await fetch("/api/admin-apis/users/pending-users?limit=1");
        const pendingData = await pendingRes.json();
        setTotalCounts(prev => ({ ...prev, pending: pendingData.total || 0 }));
      } else {
        const activeRes = await fetch("/api/admin-apis/users?limit=1");
        const activeData = await activeRes.json();
        setTotalCounts(prev => ({ ...prev, active: activeData.total || 0 }));
      }
    } catch (err) {
      Swal.fire("Error", "Failed to delete user", "error");
    }
  };

  const renderStatusCell = (value: string, row: any) => {
    if (row.is_blocked) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">⛔ Blocked</span>;
    } else if (value === "active") {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">● Active</span>;
    } else if (value === "pending") {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">⏳ Pending</span>;
    }
    return value;
  };

  const renderKycCell = (value: string) => {
    if (value === "verified") {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">✓ Verified</span>;
    } else if (value === "pending" || value === "not_submitted") {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">⏳ Pending</span>;
    } else if (value === "rejected") {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">✗ Rejected</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">○ Not Started</span>;
  };

  const renderBalanceCell = (value: number) => {
    const amount = Number(value) || 0;
    let balanceClass = "";
    if (amount > HIGH_BALANCE_THRESHOLD) balanceClass = "font-bold text-purple-600";
    else if (amount <= LOW_BALANCE_THRESHOLD && amount >= 0) balanceClass = "text-[#2b825b]";
    else if (amount < 0) balanceClass = "font-medium text-red-600";
    else if (amount === 0) balanceClass = "text-gray-500";
    else balanceClass = "text-green-600";

    return <span className={`font-medium ${balanceClass}`}>₦{amount.toLocaleString()}</span>;
  };

  const activeUserColumns = [
    { key: "email", label: "Email" },
    { key: "full_name", label: "Name" },
    { key: "balance", label: "Balance", render: renderBalanceCell },
    { key: "status", label: "Status", render: renderStatusCell },
    { key: "created_at", label: "Created" },
    { key: "phone", label: "Phone" },
    { key: "kyc_status", label: "KYC", render: renderKycCell },
  ];

  const pendingUserColumns = [
    { key: "email", label: "Email" },
    { key: "full_name", label: "Name" },
    { key: "phone", label: "Phone" },
    { key: "created_at", label: "Registered" },
    { key: "kyc_status", label: "KYC", render: renderKycCell },
    { key: "status", label: "Status", render: renderStatusCell },
  ];

  if (selectedUserId) {
    return <UserProfilePage userId={selectedUserId} onBack={handleBackToUsers} />;
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64"><Loader /></div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="p-6"><p className="text-red-600">Failed to load users ❌</p></div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Users Management</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV} disabled={exportLoading}>
              {exportLoading ? "Exporting..." : "📥 Export CSV"}
            </Button>
            <Button variant="outline" onClick={() => mutate()}>🔄 Refresh</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
            <p className="text-2xl font-semibold">{totalCounts.active + totalCounts.pending}</p>
            <p className="text-xs text-gray-500 mt-1">{totalCounts.active} verified + {totalCounts.pending} pending</p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Verified Users</h3>
            <p className="text-2xl font-semibold text-green-600">{totalCounts.active}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Pending Users</h3>
            <p className="text-2xl font-semibold text-yellow-600">{totalCounts.pending}</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="active">Verified Users ({totalCounts.active})</TabsTrigger>
            <TabsTrigger value="pending">Pending Users ({totalCounts.pending})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <Input placeholder="Search by email, name, or phone..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full md:w-1/3" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-1/6"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="blocked">Blocked</SelectItem></SelectContent>
              </Select>
              <Select value={balanceFilter} onValueChange={setBalanceFilter}>
                <SelectTrigger className="w-full md:w-1/6"><SelectValue placeholder="Balance" /></SelectTrigger>
                <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="high">High Balance</SelectItem><SelectItem value="low">Low Balance</SelectItem><SelectItem value="negative">Negative</SelectItem><SelectItem value="zero">Zero</SelectItem></SelectContent>
              </Select>
            </div>
            <AdminTable columns={activeUserColumns} rows={paginatedUsers} onDelete={handleDelete} onRowClick={handleUserClick} />
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            <Input placeholder="Search pending users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full md:w-1/3" />
            <AdminTable
              columns={pendingUserColumns}
              rows={paginatedUsers}
              onDelete={handleDelete}
              onRowClick={handleUserClick}
              customActions={[
                { label: "Approve", onClick: handleApprovePendingUser, variant: "secondary", icon: "✓" },
                { label: "Reject", onClick: handleRejectPendingUser, variant: "destructive", icon: "✗" },
              ]}
            />
          </TabsContent>
        </Tabs>

        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem><PaginationPrevious onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className={currentPage === 1 ? "pointer-events-none opacity-50" : ""} /></PaginationItem>
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => (
                  <PaginationItem key={i}><PaginationLink isActive={i + 1 === currentPage} onClick={() => setCurrentPage(i + 1)}>{i + 1}</PaginationLink></PaginationItem>
                ))}
                <PaginationItem><PaginationNext onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""} /></PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}