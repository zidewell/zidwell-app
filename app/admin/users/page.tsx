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
import { Checkbox } from "@/app/components/ui/checkbox";
import { Label } from "@/app/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetDescription } from "@/app/components/ui/sheet";
import { Download, ChevronDown } from "lucide-react";

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
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    exportType: "current" as "current" | "all",
    userType: "both" as "active" | "pending" | "both",
    includeSearch: true,
    includeStatus: true,
    includeRole: true,
    includeActivity: true,
    includeBalance: true,
    // Field selection for CSV columns
    selectedFields: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      status: true,
      balance: true,
      kycStatus: false,
      registrationDate: false,
      lastLogin: false,
      role: false,
      referralCode: false,
      referredBy: false,
    }
  });
  const [isMobile, setIsMobile] = useState(false);
  
  const itemsPerPage = 10;

  const LOW_BALANCE_THRESHOLD = 1000;
  const HIGH_BALANCE_THRESHOLD = 100000;

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // Get active users (verified users)
  const activeUsers = React.useMemo(() => {
    if (!data || activeTab === "pending") return [];
    const usersArray = data?.users ?? data;
    return usersArray
      .filter((user: any) => user.bvn_verification === "verified" || user.bvn_verification === "approved")
      .map((user: any) => ({
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

  // Get pending users
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

  // Activity helper functions
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

  // Filter active users
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

  // Filter pending users
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

  // Function to format user data based on selected fields
  const formatUserForExport = (user: any, type: string) => {
    const formatted: any = {};
    
    if (exportOptions.selectedFields.id) {
      formatted["User ID"] = user.id;
    }
    if (exportOptions.selectedFields.email) {
      formatted["Email"] = user.email || "";
    }
    if (exportOptions.selectedFields.fullName) {
      formatted["Full Name"] = user.full_name || user.fullName || "";
    }
    if (exportOptions.selectedFields.phone) {
      formatted["Phone"] = user.phone || "";
    }
    if (exportOptions.selectedFields.status) {
      if (type === "pending") {
        formatted["Status"] = "Pending";
      } else {
        formatted["Status"] = user.is_blocked ? "Blocked" : "Active";
      }
    }
    if (exportOptions.selectedFields.balance && type === "active") {
      formatted["Wallet Balance"] = Number(user.balance || user.wallet_balance) || 0;
    }
    if (exportOptions.selectedFields.kycStatus) {
      formatted["KYC Status"] = user.kyc_status || user.bvn_verification || "Not Started";
    }
    if (exportOptions.selectedFields.registrationDate) {
      formatted["Registration Date"] = user.created_at_raw || user.created_at 
        ? new Date(user.created_at_raw || user.created_at).toLocaleDateString() 
        : "";
    }
    if (exportOptions.selectedFields.lastLogin && type === "active") {
      formatted["Last Login"] = user.last_login_raw || user.last_login 
        ? new Date(user.last_login_raw || user.last_login).toLocaleString() 
        : "Never";
    }
    if (exportOptions.selectedFields.role && type === "active") {
      formatted["Role"] = user.role || "user";
    }
    if (exportOptions.selectedFields.referralCode) {
      formatted["Referral Code"] = user.referral_code || "";
    }
    if (exportOptions.selectedFields.referredBy) {
      formatted["Referred By"] = user.referred_by || "";
    }
    
    return formatted;
  };

 const handleExportWithOptions = async () => {
  setExportLoading(true);
  setIsFilterSheetOpen(false);
  
  try {
    if (exportOptions.exportType === "current") {
      // Export current view with applied filters and selected fields
      const params = new URLSearchParams();
      
      if (exportOptions.includeSearch && searchTerm) params.append("search", searchTerm);
      if (exportOptions.includeStatus && statusFilter !== "all") params.append("status", statusFilter);
      if (exportOptions.includeRole && roleFilter !== "all") params.append("role", roleFilter);
      if (exportOptions.includeActivity && activityFilter !== "all") params.append("activity", activityFilter);
      if (exportOptions.includeBalance && balanceFilter !== "all") params.append("balance", balanceFilter);
      params.append("type", activeTab);
      params.append("low_threshold", LOW_BALANCE_THRESHOLD.toString());
      params.append("high_threshold", HIGH_BALANCE_THRESHOLD.toString());
      
      // Send selected fields to API
      params.append("fields", JSON.stringify(exportOptions.selectedFields));

      const response = await fetch(`/api/admin-apis/users/export?${params.toString()}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const fileName = `${activeTab}_users_${new Date().toISOString().split("T")[0]}.csv`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      Swal.fire({
        icon: "success",
        title: "Export Successful",
        text: `Exported with selected fields`,
        timer: 2000,
        showConfirmButton: false,
      });
    } else {
      // Export all users with selected fields
      const params = new URLSearchParams();
      
      if (exportOptions.userType === "active") {
        params.append("type", "active");
      } else if (exportOptions.userType === "pending") {
        params.append("type", "pending");
      } else {
        params.append("type", "all");
      }
      
      // Send selected fields to API
      params.append("fields", JSON.stringify(exportOptions.selectedFields));
      
      const queryString = params.toString();
      const apiUrl = `/api/admin-apis/users/export-all${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(apiUrl);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const userTypeLabel = exportOptions.userType === "both" ? "all" : exportOptions.userType;
      a.download = `${userTypeLabel}_users_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      Swal.fire({
        icon: "success",
        title: "Export Successful",
        text: `Export completed successfully`,
        timer: 2000,
        showConfirmButton: false,
      });
    }
  } catch (error: any) {
    Swal.fire({ 
      icon: "error", 
      title: "Export Failed", 
      text: error.message || "An error occurred during export" 
    });
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
    if (value === "verified" || value === "approved") {
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

  // Responsive column configuration
  const activeUserColumns = isMobile ? [
    { key: "email", label: "Email" },
    { key: "full_name", label: "Name" },
    { key: "balance", label: "Balance", render: renderBalanceCell },
    { key: "status", label: "Status", render: renderStatusCell },
  ] : [
    { key: "email", label: "Email" },
    { key: "full_name", label: "Name" },
    { key: "balance", label: "Balance", render: renderBalanceCell },
    { key: "status", label: "Status", render: renderStatusCell },
    { key: "created_at", label: "Created" },
    { key: "phone", label: "Phone" },
    { key: "kyc_status", label: "KYC", render: renderKycCell },
  ];

  const pendingUserColumns = isMobile ? [
    { key: "email", label: "Email" },
    { key: "full_name", label: "Name" },
    { key: "phone", label: "Phone" },
    { key: "status", label: "Status", render: renderStatusCell },
  ] : [
    { key: "email", label: "Email" },
    { key: "full_name", label: "Name" },
    { key: "phone", label: "Phone" },
    { key: "created_at", label: "Registered" },
    { key: "kyc_status", label: "KYC", render: renderKycCell },
    { key: "status", label: "Status", render: renderStatusCell },
  ];

  // Field Selection Component
  const FieldSelectionSection = () => (
    <div className="space-y-3">
      <Label className="text-sm font-semibold">Select Fields to Export</Label>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="fieldId"
            checked={exportOptions.selectedFields.id}
            onCheckedChange={(checked) => 
              setExportOptions({ 
                ...exportOptions, 
                selectedFields: { ...exportOptions.selectedFields, id: checked === true }
              })
            }
          />
          <Label htmlFor="fieldId">User ID</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="fieldEmail"
            checked={exportOptions.selectedFields.email}
            onCheckedChange={(checked) => 
              setExportOptions({ 
                ...exportOptions, 
                selectedFields: { ...exportOptions.selectedFields, email: checked === true }
              })
            }
          />
          <Label htmlFor="fieldEmail">Email</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="fieldFullName"
            checked={exportOptions.selectedFields.fullName}
            onCheckedChange={(checked) => 
              setExportOptions({ 
                ...exportOptions, 
                selectedFields: { ...exportOptions.selectedFields, fullName: checked === true }
              })
            }
          />
          <Label htmlFor="fieldFullName">Full Name</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="fieldPhone"
            checked={exportOptions.selectedFields.phone}
            onCheckedChange={(checked) => 
              setExportOptions({ 
                ...exportOptions, 
                selectedFields: { ...exportOptions.selectedFields, phone: checked === true }
              })
            }
          />
          <Label htmlFor="fieldPhone">Phone Number</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="fieldStatus"
            checked={exportOptions.selectedFields.status}
            onCheckedChange={(checked) => 
              setExportOptions({ 
                ...exportOptions, 
                selectedFields: { ...exportOptions.selectedFields, status: checked === true }
              })
            }
          />
          <Label htmlFor="fieldStatus">Status</Label>
        </div>
        {activeTab === "active" && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="fieldBalance"
              checked={exportOptions.selectedFields.balance}
              onCheckedChange={(checked) => 
                setExportOptions({ 
                  ...exportOptions, 
                  selectedFields: { ...exportOptions.selectedFields, balance: checked === true }
                })
              }
            />
            <Label htmlFor="fieldBalance">Wallet Balance</Label>
          </div>
        )}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="fieldKycStatus"
            checked={exportOptions.selectedFields.kycStatus}
            onCheckedChange={(checked) => 
              setExportOptions({ 
                ...exportOptions, 
                selectedFields: { ...exportOptions.selectedFields, kycStatus: checked === true }
              })
            }
          />
          <Label htmlFor="fieldKycStatus">KYC Status</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="fieldRegistrationDate"
            checked={exportOptions.selectedFields.registrationDate}
            onCheckedChange={(checked) => 
              setExportOptions({ 
                ...exportOptions, 
                selectedFields: { ...exportOptions.selectedFields, registrationDate: checked === true }
              })
            }
          />
          <Label htmlFor="fieldRegistrationDate">Registration Date</Label>
        </div>
        {activeTab === "active" && (
          <>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="fieldLastLogin"
                checked={exportOptions.selectedFields.lastLogin}
                onCheckedChange={(checked) => 
                  setExportOptions({ 
                    ...exportOptions, 
                    selectedFields: { ...exportOptions.selectedFields, lastLogin: checked === true }
                  })
                }
              />
              <Label htmlFor="fieldLastLogin">Last Login</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="fieldRole"
                checked={exportOptions.selectedFields.role}
                onCheckedChange={(checked) => 
                  setExportOptions({ 
                    ...exportOptions, 
                    selectedFields: { ...exportOptions.selectedFields, role: checked === true }
                  })
                }
              />
              <Label htmlFor="fieldRole">Role</Label>
            </div>
          </>
        )}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="fieldReferralCode"
            checked={exportOptions.selectedFields.referralCode}
            onCheckedChange={(checked) => 
              setExportOptions({ 
                ...exportOptions, 
                selectedFields: { ...exportOptions.selectedFields, referralCode: checked === true }
              })
            }
          />
          <Label htmlFor="fieldReferralCode">Referral Code</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="fieldReferredBy"
            checked={exportOptions.selectedFields.referredBy}
            onCheckedChange={(checked) => 
              setExportOptions({ 
                ...exportOptions, 
                selectedFields: { ...exportOptions.selectedFields, referredBy: checked === true }
              })
            }
          />
          <Label htmlFor="fieldReferredBy">Referred By</Label>
        </div>
      </div>
    </div>
  );

  // Export Options Sheet Component
  const ExportOptionsSheet = () => (
    <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="bg-blue-50 hover:bg-blue-100 border-blue-200">
          <Download className="w-4 h-4 mr-2" />
          Export
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Export Options</SheetTitle>
          <SheetDescription>
            Choose what data to export and which fields to include
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          {/* Export Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Export Type</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="exportCurrent"
                  checked={exportOptions.exportType === "current"}
                  onChange={() => setExportOptions({ ...exportOptions, exportType: "current" })}
                  className="w-4 h-4"
                />
                <Label htmlFor="exportCurrent">Current View ({activeTab === "active" ? "Verified Users" : "Pending Users"})</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="exportAll"
                  checked={exportOptions.exportType === "all"}
                  onChange={() => setExportOptions({ ...exportOptions, exportType: "all" })}
                  className="w-4 h-4"
                />
                <Label htmlFor="exportAll">All Users (Active + Pending)</Label>
              </div>
            </div>
          </div>

          {/* User Type Selection (for All Users export) */}
          {exportOptions.exportType === "all" && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold">User Type</Label>
              <Select
                value={exportOptions.userType}
                onValueChange={(value: "active" | "pending" | "both") => setExportOptions({ ...exportOptions, userType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Both Active & Pending</SelectItem>
                  <SelectItem value="active">Active Users Only</SelectItem>
                  <SelectItem value="pending">Pending Users Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Field Selection */}
          <FieldSelectionSection />

          {/* Current Filters Section (for Current View export) */}
          {exportOptions.exportType === "current" && (
            <>
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold mb-3">Apply Current Filters</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeSearch"
                      checked={exportOptions.includeSearch}
                      onCheckedChange={(checked) => setExportOptions({ ...exportOptions, includeSearch: checked === true })}
                    />
                    <Label htmlFor="includeSearch">Include Search Term: {searchTerm || "(none)"}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeStatus"
                      checked={exportOptions.includeStatus}
                      onCheckedChange={(checked) => setExportOptions({ ...exportOptions, includeStatus: checked === true })}
                    />
                    <Label htmlFor="includeStatus">Include Status Filter</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeRole"
                      checked={exportOptions.includeRole}
                      onCheckedChange={(checked) => setExportOptions({ ...exportOptions, includeRole: checked === true })}
                    />
                    <Label htmlFor="includeRole">Include Role Filter</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeActivity"
                      checked={exportOptions.includeActivity}
                      onCheckedChange={(checked) => setExportOptions({ ...exportOptions, includeActivity: checked === true })}
                    />
                    <Label htmlFor="includeActivity">Include Activity Filter</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeBalance"
                      checked={exportOptions.includeBalance}
                      onCheckedChange={(checked) => setExportOptions({ ...exportOptions, includeBalance: checked === true })}
                    />
                    <Label htmlFor="includeBalance">Include Balance Filter</Label>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Preview:</strong> Will export {currentUsers.length} users from the current {activeTab} view
                </p>
              </div>
            </>
          )}

          {/* All Users Preview */}
          {exportOptions.exportType === "all" && (
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Preview:</strong> Will export{" "}
                {exportOptions.userType === "active" 
                  ? totalCounts.active 
                  : exportOptions.userType === "pending" 
                    ? totalCounts.pending 
                    : totalCounts.active + totalCounts.pending} users
              </p>
            </div>
          )}
        </div>
        <SheetFooter className="mt-6">
          <Button 
            onClick={handleExportWithOptions} 
            disabled={exportLoading || Object.values(exportOptions.selectedFields).every(v => v === false)}
            className="w-full"
          >
            {exportLoading ? "Exporting..." : `Export ${exportOptions.exportType === "current" ? "Current View" : "All Users"}`}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );

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
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Header Section - Responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-xl md:text-2xl font-semibold">Users Management</h2>
          <div className="flex gap-2">
            <ExportOptionsSheet />
            <Button variant="outline" onClick={() => mutate()}>
              🔄 Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards - Responsive Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          <div className="bg-white p-3 md:p-4 rounded-lg border shadow-sm">
            <h3 className="text-xs md:text-sm font-medium text-gray-500">Total Users</h3>
            <p className="text-xl md:text-2xl font-semibold">{totalCounts.active + totalCounts.pending}</p>
            <p className="text-xs text-gray-500 mt-1 hidden sm:block">{totalCounts.active} verified + {totalCounts.pending} pending</p>
          </div>
          <div className="bg-white p-3 md:p-4 rounded-lg border shadow-sm">
            <h3 className="text-xs md:text-sm font-medium text-gray-500">Verified</h3>
            <p className="text-xl md:text-2xl font-semibold text-green-600">{totalCounts.active}</p>
          </div>
          <div className="bg-white p-3 md:p-4 rounded-lg border shadow-sm">
            <h3 className="text-xs md:text-sm font-medium text-gray-500">Pending</h3>
            <p className="text-xl md:text-2xl font-semibold text-yellow-600">{totalCounts.pending}</p>
          </div>
        </div>

        {/* Tabs - Responsive */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="active" className="text-xs md:text-sm">
              Verified ({totalCounts.active})
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-xs md:text-sm">
              Pending ({totalCounts.pending})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {/* Filters - Responsive layout */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input 
                  placeholder="Search by email, name, or phone..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="w-full sm:w-1/3"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-1/6">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full sm:w-1/6">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={activityFilter} onValueChange={setActivityFilter}>
                  <SelectTrigger className="w-full sm:w-1/6">
                    <SelectValue placeholder="Activity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Activity</SelectItem>
                    <SelectItem value="active">Active (30 days)</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={balanceFilter} onValueChange={setBalanceFilter}>
                  <SelectTrigger className="w-full sm:w-1/6">
                    <SelectValue placeholder="Balance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Balances</SelectItem>
                    <SelectItem value="high">High Balance</SelectItem>
                    <SelectItem value="low">Low Balance</SelectItem>
                    <SelectItem value="negative">Negative</SelectItem>
                    <SelectItem value="zero">Zero</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <AdminTable columns={activeUserColumns} rows={paginatedUsers} onDelete={handleDelete} onRowClick={handleUserClick} />
            </div>
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            <Input 
              placeholder="Search pending users..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full sm:w-1/3"
            />
            <div className="overflow-x-auto">
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
            </div>
          </TabsContent>
        </Tabs>

        {/* Pagination - Responsive */}
        {totalPages > 1 && (
          <div className="flex justify-center overflow-x-auto">
            <Pagination>
              <PaginationContent className="flex-wrap gap-1">
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink 
                      isActive={i + 1 === currentPage} 
                      onClick={() => setCurrentPage(i + 1)}
                      className={isMobile ? "hidden sm:inline-flex" : "inline-flex"}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
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