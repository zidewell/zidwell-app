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
  const [activeTab, setActiveTab] = useState("verified");
  const [exportLoading, setExportLoading] = useState(false);
  const [totalCounts, setTotalCounts] = useState({
    verified: 0,
    pending: 0
  });
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    exportType: "current" as "current" | "all",
    userType: "both" as "verified" | "pending" | "both",
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

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch verified users
  const { data: verifiedData, error: verifiedError, isLoading: verifiedLoading, mutate: mutateVerified } = useSWR(
    activeTab === "verified" ? "/api/admin-apis/users?status=verified" : null,
    fetcher,
  );

  // Fetch pending KYC users
  const { data: pendingData, error: pendingError, isLoading: pendingLoading, mutate: mutatePending } = useSWR(
    activeTab === "pending" ? "/api/admin-apis/users?status=pending" : null,
    fetcher,
  );

  const data = activeTab === "verified" ? verifiedData : pendingData;
  const isLoading = activeTab === "verified" ? verifiedLoading : pendingLoading;
  const error = activeTab === "verified" ? verifiedError : pendingError;
  const mutate = activeTab === "verified" ? mutateVerified : mutatePending;

  useEffect(() => {
    const fetchTotalCounts = async () => {
      try {
        const allUsersRes = await fetch("/api/admin-apis/users?limit=1");
        const allUsersData = await allUsersRes.json();
        
        setTotalCounts({
          verified: allUsersData.stats?.verified || 0,
          pending: allUsersData.stats?.pending_kyc || 0
        });
      } catch (error) {
        console.error("Failed to fetch total counts:", error);
      }
    };
    
    fetchTotalCounts();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, roleFilter, activityFilter, activeTab, balanceFilter]);

  const getUsers = () => {
    if (!data) return [];
    return data.users || [];
  };

  const filteredUsers = React.useMemo(() => {
    let users = getUsers();
    
    if (searchTerm) {
      users = users.filter((user: any) =>
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (activeTab === "verified" && statusFilter !== "all") {
      users = users.filter((user: any) =>
        statusFilter === "active" ? !user.is_blocked : user.is_blocked
      );
    }
    
    if (activeTab === "verified" && roleFilter !== "all") {
      users = users.filter((user: any) => {
        if (roleFilter === "user") return !user.admin_role || user.admin_role === "user";
        return user.admin_role === roleFilter;
      });
    }
    
    if (activeTab === "verified" && activityFilter !== "all") {
      const now = new Date();
      users = users.filter((user: any) => {
        if (!user.last_login) return activityFilter === "inactive";
        const lastLogin = new Date(user.last_login);
        const daysSinceLogin = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);
        
        if (activityFilter === "active") return daysSinceLogin <= 30;
        if (activityFilter === "today") return lastLogin.toDateString() === now.toDateString();
        if (activityFilter === "week") return daysSinceLogin <= 7;
        if (activityFilter === "inactive") return daysSinceLogin > 30;
        return true;
      });
    }
    
    if (activeTab === "verified" && balanceFilter !== "all") {
      users = users.filter((user: any) => {
        const balance = Number(user.wallet_balance) || 0;
        if (balanceFilter === "high") return balance >= HIGH_BALANCE_THRESHOLD;
        if (balanceFilter === "low") return balance <= LOW_BALANCE_THRESHOLD && balance >= 0;
        if (balanceFilter === "negative") return balance < 0;
        if (balanceFilter === "zero") return balance === 0;
        return true;
      });
    }
    
    return users;
  }, [getUsers(), searchTerm, statusFilter, roleFilter, activityFilter, activeTab, balanceFilter]);

  const currentUsers = filteredUsers;
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

  const handleExport = async () => {
    setExportLoading(true);
    setIsFilterSheetOpen(false);
    
    try {
      if (exportOptions.exportType === "current") {
        // Export current view
        const params = new URLSearchParams();
        if (searchTerm) params.append("search", searchTerm);
        if (statusFilter !== "all") params.append("status", statusFilter);
        if (roleFilter !== "all") params.append("role", roleFilter);
        if (activityFilter !== "all") params.append("activity", activityFilter);
        if (balanceFilter !== "all") params.append("balance", balanceFilter);
        
        params.append("type", activeTab === "verified" ? "active" : "pending");
        params.append("low_threshold", LOW_BALANCE_THRESHOLD.toString());
        params.append("high_threshold", HIGH_BALANCE_THRESHOLD.toString());
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
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        // Export all users
        const params = new URLSearchParams();
        
        if (exportOptions.userType === "verified") {
          params.append("type", "active");
        } else if (exportOptions.userType === "pending") {
          params.append("type", "pending");
        } else {
          params.append("type", "all");
        }
        
        params.append("fields", JSON.stringify(exportOptions.selectedFields));
        
        const response = await fetch(`/api/admin-apis/users/export-all?${params.toString()}`);
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Export failed");
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const userTypeLabel = exportOptions.userType === "both" ? "all" : exportOptions.userType;
        const fileName = `${userTypeLabel}_users_${new Date().toISOString().split("T")[0]}.csv`;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        Swal.fire({
          icon: "success",
          title: "Export Successful",
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
      const r = await fetch(`/api/admin-apis/users?id=${user.id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Delete failed");

      Swal.fire("Deleted", `${user.email} has been deleted.`, "success");
      mutate();
      
      const allUsersRes = await fetch("/api/admin-apis/users?limit=1");
      const allUsersData = await allUsersRes.json();
      setTotalCounts({
        verified: allUsersData.stats?.verified || 0,
        pending: allUsersData.stats?.pending_kyc || 0
      });
    } catch (err) {
      Swal.fire("Error", "Failed to delete user", "error");
    }
  };

  const handleUpdateKYC = async (user: any, status: string) => {
    try {
      const response = await fetch(`/api/admin-apis/users?id=${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bvn_verification: status })
      });
      
      if (!response.ok) throw new Error("Update failed");
      
      Swal.fire("Success", `KYC status updated to ${status}`, "success");
      mutate();
      
      const allUsersRes = await fetch("/api/admin-apis/users?limit=1");
      const allUsersData = await allUsersRes.json();
      setTotalCounts({
        verified: allUsersData.stats?.verified || 0,
        pending: allUsersData.stats?.pending_kyc || 0
      });
    } catch (error) {
      Swal.fire("Error", "Failed to update KYC status", "error");
    }
  };

  const renderStatusCell = (value: string, row: any) => {
    if (row.is_blocked) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">⛔ Blocked</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">● Active</span>;
  };

  const renderKycCell = (value: string) => {
    if (value === "verified" || value === "approved") {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">✓ Verified</span>;
    } else if (value === "pending") {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">⏳ Pending</span>;
    } else if (value === "not_submitted") {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">○ Not Started</span>;
    } else if (value === "rejected") {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">✗ Rejected</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{value || "Unknown"}</span>;
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

  const renderRoleCell = (value: string) => {
    if (!value || value === "user") {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">User</span>;
    } else if (value === "super_admin") {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Super Admin</span>;
    } else if (value === "operations_admin") {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Operations Admin</span>;
    } else if (value === "support_admin") {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Support Admin</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{value || "User"}</span>;
  };

  const verifiedColumns = isMobile ? [
    { key: "email", label: "Email" },
    { key: "full_name", label: "Name" },
    { key: "wallet_balance", label: "Balance", render: renderBalanceCell },
    { key: "is_blocked", label: "Status", render: renderStatusCell },
  ] : [
    { key: "email", label: "Email" },
    { key: "full_name", label: "Name" },
    { key: "phone", label: "Phone" },
    { key: "wallet_balance", label: "Balance", render: renderBalanceCell },
    { key: "is_blocked", label: "Status", render: renderStatusCell },
    { key: "created_at", label: "Registered" },
    { key: "last_login", label: "Last Login" },
    { key: "bvn_verification", label: "KYC", render: renderKycCell },
    { key: "admin_role", label: "Role", render: renderRoleCell },
  ];

  const pendingColumns = isMobile ? [
    { key: "email", label: "Email" },
    { key: "full_name", label: "Name" },
    { key: "phone", label: "Phone" },
    { key: "bvn_verification", label: "KYC", render: renderKycCell },
  ] : [
    { key: "email", label: "Email" },
    { key: "full_name", label: "Name" },
    { key: "phone", label: "Phone" },
    { key: "created_at", label: "Registered" },
    { key: "bvn_verification", label: "KYC Status", render: renderKycCell },
  ];

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
          <SheetDescription>Choose what data to export and which fields to include</SheetDescription>
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
                <Label htmlFor="exportCurrent">Current View ({activeTab === "verified" ? "Verified Users" : "Pending KYC Users"})</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="exportAll"
                  checked={exportOptions.exportType === "all"}
                  onChange={() => setExportOptions({ ...exportOptions, exportType: "all" })}
                  className="w-4 h-4"
                />
                <Label htmlFor="exportAll">All Users (All Users in System)</Label>
              </div>
            </div>
          </div>

          {/* User Type Selection (for All Users export) */}
          {exportOptions.exportType === "all" && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold">User Type</Label>
              <Select
                value={exportOptions.userType}
                onValueChange={(value: "verified" | "pending" | "both") => setExportOptions({ ...exportOptions, userType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">All Users (Both Verified & Pending)</SelectItem>
                  <SelectItem value="verified">Verified Users Only</SelectItem>
                  <SelectItem value="pending">Pending KYC Users Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Field Selection */}
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
                <Label htmlFor="fieldRole">Admin Role</Label>
              </div>
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

          {/* Preview */}
          {exportOptions.exportType === "current" && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Preview:</strong> Will export {filteredUsers.length} users from the current view
              </p>
            </div>
          )}

          {exportOptions.exportType === "all" && (
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Preview:</strong> Will export{" "}
                {exportOptions.userType === "verified" 
                  ? totalCounts.verified 
                  : exportOptions.userType === "pending" 
                    ? totalCounts.pending 
                    : totalCounts.verified + totalCounts.pending} users
              </p>
            </div>
          )}
        </div>
        <SheetFooter className="mt-6">
          <Button 
            onClick={handleExport} 
            disabled={exportLoading} 
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-xl md:text-2xl font-semibold">Users Management</h2>
          <div className="flex gap-2">
            <ExportOptionsSheet />
            <Button variant="outline" onClick={() => mutate()}>
              🔄 Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <div className="bg-white p-3 md:p-4 rounded-lg border shadow-sm">
            <h3 className="text-xs md:text-sm font-medium text-gray-500">Verified Users</h3>
            <p className="text-xl md:text-2xl font-semibold text-green-600">{totalCounts.verified}</p>
            <p className="text-xs text-gray-500 mt-1">Completed KYC</p>
          </div>
          <div className="bg-white p-3 md:p-4 rounded-lg border shadow-sm">
            <h3 className="text-xs md:text-sm font-medium text-gray-500">Pending KYC</h3>
            <p className="text-xl md:text-2xl font-semibold text-yellow-600">{totalCounts.pending}</p>
            <p className="text-xs text-gray-500 mt-1">Awaiting verification</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="verified" className="text-xs md:text-sm">
              Verified ({totalCounts.verified})
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-xs md:text-sm">
              Pending KYC ({totalCounts.pending})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="verified" className="space-y-4">
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
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full sm:w-1/6">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="operations_admin">Operations Admin</SelectItem>
                    <SelectItem value="support_admin">Support Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
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
              <AdminTable 
                columns={verifiedColumns} 
                rows={paginatedUsers} 
                onDelete={handleDelete} 
                onRowClick={handleUserClick}
                customActions={[
                  { 
                    label: "Verify KYC", 
                    onClick: (user) => handleUpdateKYC(user, "verified"), 
                    variant: "secondary"
                  }
                ]}
              />
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
                columns={pendingColumns} 
                rows={paginatedUsers} 
                onDelete={handleDelete} 
                onRowClick={handleUserClick}
                customActions={[
                  { label: "Approve KYC", onClick: (user) => handleUpdateKYC(user, "verified"), variant: "secondary" },
                  { label: "Reject KYC", onClick: (user) => handleUpdateKYC(user, "rejected"), variant: "destructive" },
                ]}
              />
            </div>
          </TabsContent>
        </Tabs>

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