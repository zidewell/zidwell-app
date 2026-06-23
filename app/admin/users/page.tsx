// app/admin/users/page.tsx
"use client";

import useSWR from "swr";
import React, { useState, useEffect, useCallback, useRef } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetDescription,
} from "@/app/components/ui/sheet";
import { Checkbox } from "@/app/components/ui/checkbox";
import { 
  Download, 
  ChevronDown, 
  RefreshCw,
  UserX,
  UserCheck,
  Shield,
  Wallet,
  Flag,
  CheckCircle,
  XCircle,
  FileText,
  Search,
  X,
  Loader2
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ============================================
// DEBOUNCE HOOK
// ============================================
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ============================================
// SEARCH INPUT COMPONENT
// ============================================
function SearchInput({ 
  value, 
  onChange, 
  placeholder, 
  isLoading,
  className = ""
}: { 
  value: string; 
  onChange: (value: string) => void; 
  placeholder: string;
  isLoading?: boolean;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    onChange("");
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`}>
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Search className="w-4 h-4" />
        )}
      </div>
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 pr-9 border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)] squircle-md"
        style={{ outline: "none", boxShadow: "none" }}
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ============================================
// SUSPEND USER MODAL
// ============================================
function SuspendUserModal({ user, isOpen, onClose, onConfirm }: any) {
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("7");

  const handleConfirm = () => {
    onConfirm({ reason, duration: parseInt(duration) });
    setReason("");
    setDuration("7");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-pop squircle-lg max-w-md">
        <DialogHeader>
          <DialogTitle className="font-[var(--font-space-grotesk)] text-[var(--text-primary)] flex items-center gap-2">
            <UserX className="w-5 h-5 text-[var(--destructive)]" />
            Suspend User
          </DialogTitle>
          <DialogDescription className="text-[var(--text-secondary)]">
            Temporarily suspend {user?.email}'s account access.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-[var(--text-primary)]">Suspension Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className="border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] squircle-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[var(--bg-primary)] border-[var(--border-color)]">
                <SelectItem value="1" className="text-[var(--text-primary)]">1 Day</SelectItem>
                <SelectItem value="3" className="text-[var(--text-primary)]">3 Days</SelectItem>
                <SelectItem value="7" className="text-[var(--text-primary)]">7 Days</SelectItem>
                <SelectItem value="14" className="text-[var(--text-primary)]">14 Days</SelectItem>
                <SelectItem value="30" className="text-[var(--text-primary)]">30 Days</SelectItem>
                <SelectItem value="permanent" className="text-[var(--destructive)]">Permanent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[var(--text-primary)]">Reason (Optional)</Label>
            <Textarea
              placeholder="Enter reason for suspension..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] squircle-md min-h-[80px]"
              style={{ outline: "none", boxShadow: "none" }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] squircle-md">
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="bg-[var(--destructive)] text-white hover:bg-[var(--destructive)]/90 squircle-md">
            Suspend User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// FLAG USER MODAL
// ============================================
function FlagUserModal({ user, isOpen, onClose, onConfirm }: any) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const handleConfirm = () => {
    onConfirm({ reason, notes });
    setReason("");
    setNotes("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-pop squircle-lg max-w-md">
        <DialogHeader>
          <DialogTitle className="font-[var(--font-space-grotesk)] text-[var(--text-primary)] flex items-center gap-2">
            <Flag className="w-5 h-5 text-[var(--color-accent-yellow)]" />
            Flag User
          </DialogTitle>
          <DialogDescription className="text-[var(--text-secondary)]">
            Flag {user?.email}'s account as suspicious or high-risk.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-[var(--text-primary)]">Flag Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] squircle-md">
                <SelectValue placeholder="Select reason..." />
              </SelectTrigger>
              <SelectContent className="bg-[var(--bg-primary)] border-[var(--border-color)]">
                <SelectItem value="suspicious_activity" className="text-[var(--text-primary)]">Suspicious Activity</SelectItem>
                <SelectItem value="multiple_failures" className="text-[var(--text-primary)]">Multiple Login Failures</SelectItem>
                <SelectItem value="unusual_transactions" className="text-[var(--text-primary)]">Unusual Transactions</SelectItem>
                <SelectItem value="identity_verification" className="text-[var(--text-primary)]">Identity Verification Issue</SelectItem>
                <SelectItem value="policy_violation" className="text-[var(--text-primary)]">Policy Violation</SelectItem>
                <SelectItem value="other" className="text-[var(--text-primary)]">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[var(--text-primary)]">Internal Notes</Label>
            <Textarea
              placeholder="Add internal notes about this flag..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] squircle-md min-h-[80px]"
              style={{ outline: "none", boxShadow: "none" }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] squircle-md">
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90 squircle-md">
            Flag User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// FREEZE WALLET MODAL
// ============================================
function FreezeWalletModal({ user, isOpen, onClose, onConfirm }: any) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    onConfirm({ reason });
    setReason("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-pop squircle-lg max-w-md">
        <DialogHeader>
          <DialogTitle className="font-[var(--font-space-grotesk)] text-[var(--text-primary)] flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[var(--color-accent-yellow)]" />
            Freeze Wallet
          </DialogTitle>
          <DialogDescription className="text-[var(--text-secondary)]">
            Temporarily freeze {user?.email}'s wallet to prevent transactions.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-[var(--text-primary)]">Reason for Freezing</Label>
            <Textarea
              placeholder="Enter reason for freezing wallet..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] squircle-md min-h-[80px]"
              style={{ outline: "none", boxShadow: "none" }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] squircle-md">
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90 squircle-md">
            Freeze Wallet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// SET TRANSACTION LIMIT MODAL
// ============================================
function SetTransactionLimitModal({ user, isOpen, onClose, onConfirm }: any) {
  const [dailyLimit, setDailyLimit] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState("");

  const handleConfirm = () => {
    onConfirm({ 
      dailyLimit: parseFloat(dailyLimit), 
      monthlyLimit: parseFloat(monthlyLimit) 
    });
    setDailyLimit("");
    setMonthlyLimit("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-pop squircle-lg max-w-md">
        <DialogHeader>
          <DialogTitle className="font-[var(--font-space-grotesk)] text-[var(--text-primary)] flex items-center gap-2">
            <Shield className="w-5 h-5 text-[var(--color-accent-yellow)]" />
            Set Transaction Limits
          </DialogTitle>
          <DialogDescription className="text-[var(--text-secondary)]">
            Set daily and monthly transaction limits for {user?.email}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-[var(--text-primary)]">Daily Transaction Limit (₦)</Label>
            <Input
              type="number"
              placeholder="Enter daily limit..."
              value={dailyLimit}
              onChange={(e) => setDailyLimit(e.target.value)}
              className="border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] squircle-md"
              style={{ outline: "none", boxShadow: "none" }}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[var(--text-primary)]">Monthly Transaction Limit (₦)</Label>
            <Input
              type="number"
              placeholder="Enter monthly limit..."
              value={monthlyLimit}
              onChange={(e) => setMonthlyLimit(e.target.value)}
              className="border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] squircle-md"
              style={{ outline: "none", boxShadow: "none" }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] squircle-md">
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90 squircle-md">
            Set Limits
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// REQUEST DOCUMENTS MODAL
// ============================================
function RequestDocumentsModal({ user, isOpen, onClose, onConfirm }: any) {
  const [documentType, setDocumentType] = useState("");
  const [message, setMessage] = useState("");

  const handleConfirm = () => {
    onConfirm({ documentType, message });
    setDocumentType("");
    setMessage("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-pop squircle-lg max-w-md">
        <DialogHeader>
          <DialogTitle className="font-[var(--font-space-grotesk)] text-[var(--text-primary)] flex items-center gap-2">
            <FileText className="w-5 h-5 text-[var(--color-accent-yellow)]" />
            Request Additional Documents
          </DialogTitle>
          <DialogDescription className="text-[var(--text-secondary)]">
            Request additional verification documents from {user?.email}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-[var(--text-primary)]">Document Type</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger className="border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] squircle-md">
                <SelectValue placeholder="Select document type..." />
              </SelectTrigger>
              <SelectContent className="bg-[var(--bg-primary)] border-[var(--border-color)]">
                <SelectItem value="id_verification" className="text-[var(--text-primary)]">ID Verification</SelectItem>
                <SelectItem value="proof_of_address" className="text-[var(--text-primary)]">Proof of Address</SelectItem>
                <SelectItem value="bank_statement" className="text-[var(--text-primary)]">Bank Statement</SelectItem>
                <SelectItem value="business_registration" className="text-[var(--text-primary)]">Business Registration</SelectItem>
                <SelectItem value="tax_clearance" className="text-[var(--text-primary)]">Tax Clearance</SelectItem>
                <SelectItem value="other" className="text-[var(--text-primary)]">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[var(--text-primary)]">Message to User</Label>
            <Textarea
              placeholder="Enter message explaining what documents are needed..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] squircle-md min-h-[80px]"
              style={{ outline: "none", boxShadow: "none" }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] squircle-md">
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90 squircle-md">
            Request Documents
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// MAIN USERS PAGE COMPONENT
// ============================================
export default function UsersPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [activityFilter, setActivityFilter] = useState("all");
  const [balanceFilter, setBalanceFilter] = useState("all");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("verified");
  const [exportLoading, setExportLoading] = useState(false);
  
  // Store both counts separately
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // Modal states
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

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
    },
  });
  const [isMobile, setIsMobile] = useState(false);

  const itemsPerPage = 10;
  const LOW_BALANCE_THRESHOLD = 1000;
  const HIGH_BALANCE_THRESHOLD = 100000;

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearchTerm, 
    statusFilter, 
    roleFilter, 
    activityFilter, 
    activeTab, 
    balanceFilter
  ]);

  useEffect(() => {
    if (searchTerm) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        setIsSearching(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setIsSearching(false);
    }
  }, [searchTerm]);

  // Build API URL with all filters
  const buildApiUrl = useCallback((tab: string, page: number) => {
    let url = `/api/admin-apis/users?status=${tab === "verified" ? "verified" : "pending"}&page=${page}&limit=${itemsPerPage}`;
    
    if (debouncedSearchTerm) {
      url += `&q=${encodeURIComponent(debouncedSearchTerm)}`;
    }
    
    if (statusFilter !== "all") {
      url += `&filter_status=${statusFilter}`;
    }
    
    if (roleFilter !== "all") {
      url += `&role=${roleFilter}`;
    }
    
    if (activityFilter !== "all") {
      url += `&activity=${activityFilter}`;
    }
    
    if (balanceFilter !== "all") {
      url += `&balance=${balanceFilter}`;
      url += `&low_threshold=${LOW_BALANCE_THRESHOLD}`;
      url += `&high_threshold=${HIGH_BALANCE_THRESHOLD}`;
    }
    
    return url;
  }, [
    debouncedSearchTerm, 
    statusFilter, 
    roleFilter, 
    activityFilter, 
    balanceFilter,
    itemsPerPage,
    LOW_BALANCE_THRESHOLD,
    HIGH_BALANCE_THRESHOLD
  ]);

  // Fetch verified users
  const {
    data: verifiedData,
    error: verifiedError,
    isLoading: verifiedLoading,
    mutate: mutateVerified,
  } = useSWR(
    activeTab === "verified" ? buildApiUrl("verified", currentPage) : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 2000,
      keepPreviousData: true,
    }
  );

  // Fetch pending users
  const {
    data: pendingData,
    error: pendingError,
    isLoading: pendingLoading,
    mutate: mutatePending,
  } = useSWR(
    activeTab === "pending" ? buildApiUrl("pending", currentPage) : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 2000,
      keepPreviousData: true,
    }
  );

  const data = activeTab === "verified" ? verifiedData : pendingData;
  const isLoading = activeTab === "verified" ? verifiedLoading : pendingLoading;
  const error = activeTab === "verified" ? verifiedError : pendingError;
  const mutate = activeTab === "verified" ? mutateVerified : mutatePending;

  // Fetch BOTH counts on page load and when filters change
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // Build URL without KYC status filter to get both counts
        const params = new URLSearchParams();
        
        if (debouncedSearchTerm) {
          params.append("q", debouncedSearchTerm);
        }
        
        if (statusFilter !== "all") {
          params.append("filter_status", statusFilter);
        }
        
        if (roleFilter !== "all") {
          params.append("role", roleFilter);
        }
        
        if (activityFilter !== "all") {
          params.append("activity", activityFilter);
        }
        
        if (balanceFilter !== "all") {
          params.append("balance", balanceFilter);
          params.append("low_threshold", LOW_BALANCE_THRESHOLD.toString());
          params.append("high_threshold", HIGH_BALANCE_THRESHOLD.toString());
        }
        
        // Set limit=1 to just get stats
        params.append("limit", "1");
        
        const url = `/api/admin-apis/users?${params.toString()}`;
        console.log("📊 Fetching counts from:", url);
        
        const response = await fetch(url);
        const result = await response.json();
        
        console.log("📊 Counts response:", result);
        
        setVerifiedCount(result.stats?.verified || 0);
        setPendingCount(result.stats?.pending_kyc || 0);
        
      } catch (error) {
        console.error("Failed to fetch counts:", error);
      }
    };
    
    const timer = setTimeout(fetchCounts, 300);
    return () => clearTimeout(timer);
  }, [debouncedSearchTerm, statusFilter, roleFilter, activityFilter, balanceFilter]);

  const getUsers = () => {
    if (!data) return [];
    return data.users || [];
  };

  const total = data?.total || 0;
  const totalPages = Math.ceil(total / itemsPerPage);

  // ============================================
  // HANDLER FUNCTIONS
  // ============================================

  const handleSuspendUser = async (user: any) => {
    setSelectedUser(user);
    setShowSuspendModal(true);
  };

  const handleConfirmSuspend = async ({ reason, duration }: any) => {
    try {
      const response = await fetch(`/api/admin-apis/users?id=${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_blocked: true,
          block_reason: reason || "Suspended by admin",
          blocked_at: new Date().toISOString(),
          suspension_duration: duration === "permanent" ? -1 : duration,
        }),
      });

      if (!response.ok) throw new Error("Failed to suspend user");

      Swal.fire({
        icon: "success",
        title: "User Suspended",
        text: `${selectedUser.email} has been suspended successfully.`,
        timer: 2000,
        showConfirmButton: false,
      });

      mutate();
      setShowSuspendModal(false);
      setSelectedUser(null);
    } catch (error) {
      Swal.fire("Error", "Failed to suspend user", "error");
    }
  };

  const handleReactivateUser = async (user: any) => {
    const result = await Swal.fire({
      title: "Reactivate User?",
      text: `This will restore ${user.email}'s account access.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, reactivate",
      confirmButtonColor: "#00B64F",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`/api/admin-apis/users?id=${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_blocked: false,
          block_reason: null,
          blocked_at: null,
          suspension_duration: null,
        }),
      });

      if (!response.ok) throw new Error("Failed to reactivate user");

      Swal.fire({
        icon: "success",
        title: "User Reactivated",
        text: `${user.email} has been reactivated.`,
        timer: 2000,
        showConfirmButton: false,
      });

      mutate();
    } catch (error) {
      Swal.fire("Error", "Failed to reactivate user", "error");
    }
  };

  const handleFlagUser = async (user: any) => {
    setSelectedUser(user);
    setShowFlagModal(true);
  };

  const handleConfirmFlag = async ({ reason, notes }: any) => {
    try {
      const response = await fetch(`/api/admin-apis/users?id=${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_flagged: true,
          flag_reason: reason,
          flag_notes: notes,
          flagged_at: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error("Failed to flag user");

      Swal.fire({
        icon: "success",
        title: "User Flagged",
        text: `${selectedUser.email} has been flagged for review.`,
        timer: 2000,
        showConfirmButton: false,
      });

      mutate();
      setShowFlagModal(false);
      setSelectedUser(null);
    } catch (error) {
      Swal.fire("Error", "Failed to flag user", "error");
    }
  };

  const handleFreezeWallet = async (user: any) => {
    setSelectedUser(user);
    setShowFreezeModal(true);
  };

  const handleConfirmFreeze = async ({ reason }: any) => {
    try {
      const response = await fetch(`/api/admin-apis/users?id=${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet_frozen: true,
          wallet_freeze_reason: reason,
          wallet_frozen_at: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error("Failed to freeze wallet");

      Swal.fire({
        icon: "success",
        title: "Wallet Frozen",
        text: `${selectedUser.email}'s wallet has been frozen.`,
        timer: 2000,
        showConfirmButton: false,
      });

      mutate();
      setShowFreezeModal(false);
      setSelectedUser(null);
    } catch (error) {
      Swal.fire("Error", "Failed to freeze wallet", "error");
    }
  };

  const handleUnfreezeWallet = async (user: any) => {
    const result = await Swal.fire({
      title: "Unfreeze Wallet?",
      text: `This will unfreeze ${user.email}'s wallet.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, unfreeze",
      confirmButtonColor: "#00B64F",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`/api/admin-apis/users?id=${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet_frozen: false,
          wallet_freeze_reason: null,
          wallet_frozen_at: null,
        }),
      });

      if (!response.ok) throw new Error("Failed to unfreeze wallet");

      Swal.fire({
        icon: "success",
        title: "Wallet Unfrozen",
        text: `${user.email}'s wallet has been unfrozen.`,
        timer: 2000,
        showConfirmButton: false,
      });

      mutate();
    } catch (error) {
      Swal.fire("Error", "Failed to unfreeze wallet", "error");
    }
  };

  const handleSetTransactionLimit = async (user: any) => {
    setSelectedUser(user);
    setShowLimitModal(true);
  };

  const handleConfirmLimit = async ({ dailyLimit, monthlyLimit }: any) => {
    try {
      const response = await fetch(`/api/admin-apis/users?id=${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          daily_transaction_limit: dailyLimit,
          monthly_transaction_limit: monthlyLimit,
          limit_updated_at: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error("Failed to set transaction limits");

      Swal.fire({
        icon: "success",
        title: "Transaction Limits Set",
        text: `Daily: ₦${dailyLimit.toLocaleString()}, Monthly: ₦${monthlyLimit.toLocaleString()}`,
        timer: 2000,
        showConfirmButton: false,
      });

      mutate();
      setShowLimitModal(false);
      setSelectedUser(null);
    } catch (error) {
      Swal.fire("Error", "Failed to set transaction limits", "error");
    }
  };

  const handleRequestDocuments = async (user: any) => {
    setSelectedUser(user);
    setShowDocumentsModal(true);
  };

  const handleConfirmDocuments = async ({ documentType, message }: any) => {
    try {
      const response = await fetch(`/api/admin-apis/users/${selectedUser.id}/request-documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType,
          message,
          requested_at: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error("Failed to request documents");

      Swal.fire({
        icon: "success",
        title: "Documents Requested",
        text: `Document request sent to ${selectedUser.email}.`,
        timer: 2000,
        showConfirmButton: false,
      });

      setShowDocumentsModal(false);
      setSelectedUser(null);
    } catch (error) {
      Swal.fire("Error", "Failed to request documents", "error");
    }
  };

  const handleApproveKYC = async (user: any) => {
    const result = await Swal.fire({
      title: "Approve KYC?",
      text: `This will approve ${user.email}'s KYC verification.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, approve",
      confirmButtonColor: "#00B64F",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`/api/admin-apis/users?id=${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bvn_verification: "verified",
          kyc_approved_at: new Date().toISOString(),
          kyc_approved_by: "admin",
        }),
      });

      if (!response.ok) throw new Error("Failed to approve KYC");

      Swal.fire({
        icon: "success",
        title: "KYC Approved",
        text: `${user.email}'s KYC has been approved.`,
        timer: 2000,
        showConfirmButton: false,
      });

      mutate();
    } catch (error) {
      Swal.fire("Error", "Failed to approve KYC", "error");
    }
  };

  const handleRejectKYC = async (user: any) => {
    setSelectedUser(user);
    setShowRejectModal(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      Swal.fire("Error", "Please provide a reason for rejection", "error");
      return;
    }

    try {
      const response = await fetch(`/api/admin-apis/users?id=${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bvn_verification: "rejected",
          kyc_rejected_at: new Date().toISOString(),
          kyc_rejection_reason: rejectReason,
          kyc_rejected_by: "admin",
        }),
      });

      if (!response.ok) throw new Error("Failed to reject KYC");

      Swal.fire({
        icon: "success",
        title: "KYC Rejected",
        text: `${selectedUser.email}'s KYC has been rejected.`,
        timer: 2000,
        showConfirmButton: false,
      });

      mutate();
      setShowRejectModal(false);
      setSelectedUser(null);
      setRejectReason("");
    } catch (error) {
      Swal.fire("Error", "Failed to reject KYC", "error");
    }
  };

  const handleDelete = async (user: any) => {
    const res = await Swal.fire({
      title: "Delete user?",
      text: `This will permanently delete ${user.email}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      confirmButtonColor: "#ef4444",
    });

    if (!res.isConfirmed) return;

    try {
      const r = await fetch(`/api/admin-apis/users?id=${user.id}`, {
        method: "DELETE",
      });
      if (!r.ok) throw new Error("Delete failed");

      Swal.fire("Deleted", `${user.email} has been deleted.`, "success");
      mutate();
    } catch (err) {
      Swal.fire("Error", "Failed to delete user", "error");
    }
  };

  const handleUserClick = (user: any) => {
    setSelectedUserId(user.id);
  };

  const handleBackToUsers = () => {
    setSelectedUserId(null);
  };

  // ============================================
  // RENDER FUNCTIONS
  // ============================================

  const renderStatusCell = (value: string, row: any) => {
    if (row.is_blocked) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 squircle-sm text-xs font-medium bg-[var(--destructive)]/20 text-[var(--destructive)]">
          ⛔ Suspended
        </span>
      );
    }
    if (row.is_flagged) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 squircle-sm text-xs font-medium bg-[var(--color-accent-yellow)]/20 text-[var(--color-accent-yellow)]">
          🚩 Flagged
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 squircle-sm text-xs font-medium bg-[var(--color-lemon-green)]/20 text-[var(--color-lemon-green)]">
        ● Active
      </span>
    );
  };

  const renderKycCell = (value: string) => {
    if (value === "verified" || value === "approved") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 squircle-sm text-xs font-medium bg-[var(--color-lemon-green)]/20 text-[var(--color-lemon-green)]">
          ✓ Verified
        </span>
      );
    } else if (value === "pending") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 squircle-sm text-xs font-medium bg-[var(--color-accent-yellow)]/20 text-[var(--color-accent-yellow)]">
          ⏳ Pending
        </span>
      );
    } else if (value === "not_submitted") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 squircle-sm text-xs font-medium bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
          ○ Not Started
        </span>
      );
    } else if (value === "rejected") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 squircle-sm text-xs font-medium bg-[var(--destructive)]/20 text-[var(--destructive)]">
          ✗ Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 squircle-sm text-xs font-medium bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
        {value || "Unknown"}
      </span>
    );
  };

  const renderBalanceCell = (value: number) => {
    const amount = Number(value) || 0;
    let balanceClass = "";
    if (amount > HIGH_BALANCE_THRESHOLD) balanceClass = "font-bold text-purple-600";
    else if (amount <= LOW_BALANCE_THRESHOLD && amount >= 0) balanceClass = "text-[var(--color-accent-yellow)]";
    else if (amount < 0) balanceClass = "font-medium text-[var(--destructive)]";
    else if (amount === 0) balanceClass = "text-[var(--text-secondary)]";
    else balanceClass = "text-[var(--color-lemon-green)]";

    return <span className={`font-medium ${balanceClass}`}>₦{amount.toLocaleString()}</span>;
  };

  const renderRoleCell = (value: string) => {
    if (!value || value === "user") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 squircle-sm text-xs font-medium bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
          User
        </span>
      );
    } else if (value === "super_admin") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 squircle-sm text-xs font-medium bg-purple-100 text-purple-800">
          Super Admin
        </span>
      );
    } else if (value === "operations_admin") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 squircle-sm text-xs font-medium bg-blue-100 text-blue-800">
          Operations Admin
        </span>
      );
    } else if (value === "support_admin") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 squircle-sm text-xs font-medium bg-green-100 text-green-800">
          Support Admin
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 squircle-sm text-xs font-medium bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
        {value || "User"}
      </span>
    );
  };

  const verifiedColumns = isMobile
    ? [
        { key: "email", label: "Email" },
        { key: "full_name", label: "Name" },
        { key: "wallet_balance", label: "Balance", render: renderBalanceCell },
        { key: "is_blocked", label: "Status", render: renderStatusCell },
      ]
    : [
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

  const pendingColumns = isMobile
    ? [
        { key: "email", label: "Email" },
        { key: "full_name", label: "Name" },
        { key: "phone", label: "Phone" },
        { key: "bvn_verification", label: "KYC", render: renderKycCell },
      ]
    : [
        { key: "email", label: "Email" },
        { key: "full_name", label: "Name" },
        { key: "phone", label: "Phone" },
        { key: "created_at", label: "Registered" },
        { key: "bvn_verification", label: "KYC Status", render: renderKycCell },
      ];

  const getUserControlsActions = (isVerified: boolean) => {
    const actions = [];

    actions.push({
      label: "Suspend User",
      onClick: handleSuspendUser,
      icon: <UserX className="w-4 h-4" />,
      className: "text-[var(--destructive)]"
    });

    actions.push({
      label: "Reactivate User",
      onClick: handleReactivateUser,
      icon: <UserCheck className="w-4 h-4" />,
      className: "text-[var(--color-lemon-green)]"
    });

    if (!isVerified) {
      actions.push({
        label: "Approve KYC",
        onClick: handleApproveKYC,
        icon: <CheckCircle className="w-4 h-4" />,
        className: "text-[var(--color-lemon-green)]"
      });
      actions.push({
        label: "Reject KYC",
        onClick: handleRejectKYC,
        icon: <XCircle className="w-4 h-4" />,
        className: "text-[var(--destructive)]"
      });
      actions.push({
        label: "Request Documents",
        onClick: handleRequestDocuments,
        icon: <FileText className="w-4 h-4" />,
        className: "text-[var(--color-accent-yellow)]"
      });
    }

    actions.push({
      label: "Set Transaction Limit",
      onClick: handleSetTransactionLimit,
      icon: <Shield className="w-4 h-4" />,
      className: "text-blue-600"
    });

    actions.push({
      label: "Freeze Wallet",
      onClick: handleFreezeWallet,
      icon: <Wallet className="w-4 h-4" />,
      className: "text-[var(--color-accent-yellow)]"
    });

    actions.push({
      label: "Flag User",
      onClick: handleFlagUser,
      icon: <Flag className="w-4 h-4" />,
      className: "text-[var(--color-accent-yellow)]"
    });

    return actions;
  };

  // ============================================
  // EXPORT OPTIONS SHEET
  // ============================================
  const ExportOptionsSheet = () => (
    <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="border-[var(--color-accent-yellow)] text-[var(--color-accent-yellow)] hover:bg-[var(--color-accent-yellow)]/10 squircle-md font-[var(--font-be-vietnam)]"
        >
          <Download className="w-4 h-4 mr-2" />
          Export
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:w-[500px] overflow-y-auto bg-[var(--bg-primary)] border-l border-[var(--border-color)]"
      >
        <SheetHeader>
          <SheetTitle className="font-[var(--font-space-grotesk)] text-[var(--text-primary)]">
            Export Options
          </SheetTitle>
          <SheetDescription className="text-[var(--text-secondary)]">
            Choose what data to export and which fields to include
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-[var(--text-primary)]">Export Type</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="exportCurrent"
                  checked={exportOptions.exportType === "current"}
                  onChange={() => setExportOptions({ ...exportOptions, exportType: "current" })}
                  className="w-4 h-4 accent-[var(--color-accent-yellow)]"
                />
                <Label htmlFor="exportCurrent" className="text-[var(--text-secondary)]">
                  Current View ({activeTab === "verified" ? "Verified Users" : "Pending KYC Users"})
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="exportAll"
                  checked={exportOptions.exportType === "all"}
                  onChange={() => setExportOptions({ ...exportOptions, exportType: "all" })}
                  className="w-4 h-4 accent-[var(--color-accent-yellow)]"
                />
                <Label htmlFor="exportAll" className="text-[var(--text-secondary)]">
                  All Users (All Users in System)
                </Label>
              </div>
            </div>
          </div>

          {exportOptions.exportType === "all" && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-[var(--text-primary)]">User Type</Label>
              <Select
                value={exportOptions.userType}
                onValueChange={(value: "verified" | "pending" | "both") =>
                  setExportOptions({ ...exportOptions, userType: value })
                }
              >
                <SelectTrigger className="border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[var(--bg-primary)] border-[var(--border-color)]">
                  <SelectItem value="both" className="text-[var(--text-primary)]">All Users (Both Verified & Pending)</SelectItem>
                  <SelectItem value="verified" className="text-[var(--text-primary)]">Verified Users Only</SelectItem>
                  <SelectItem value="pending" className="text-[var(--text-primary)]">Pending KYC Users Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-3">
            <Label className="text-sm font-semibold text-[var(--text-primary)]">
              Select Fields to Export
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(exportOptions.selectedFields).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`field${key}`}
                    checked={value}
                    onCheckedChange={(checked) =>
                      setExportOptions({
                        ...exportOptions,
                        selectedFields: {
                          ...exportOptions.selectedFields,
                          [key]: checked === true,
                        },
                      })
                    }
                    className="data-[state=checked]:bg-[var(--color-accent-yellow)] data-[state=checked]:border-[var(--color-accent-yellow)]"
                  />
                  <Label htmlFor={`field${key}`} className="text-[var(--text-secondary)] text-sm">
                    {key === "fullName" ? "Full Name" :
                     key === "kycStatus" ? "KYC Status" :
                     key === "registrationDate" ? "Registration Date" :
                     key === "lastLogin" ? "Last Login" :
                     key === "referralCode" ? "Referral Code" :
                     key === "referredBy" ? "Referred By" :
                     key.charAt(0).toUpperCase() + key.slice(1)}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className={`p-3 squircle-lg ${
            exportOptions.exportType === "current" 
              ? "bg-[var(--color-accent-yellow)]/10 text-[var(--color-accent-yellow)]" 
              : "bg-[var(--color-lemon-green)]/10 text-[var(--color-lemon-green)]"
          }`}>
            <p className="text-sm">
              <strong>Preview:</strong> Will export{" "}
              {exportOptions.exportType === "current"
                ? `${getUsers().length} users from the current view`
                : `${exportOptions.userType === "verified" ? verifiedCount : exportOptions.userType === "pending" ? pendingCount : verifiedCount + pendingCount} users`
              }
            </p>
          </div>
        </div>
        <SheetFooter className="mt-6">
          <Button
            onClick={handleExport}
            disabled={exportLoading}
            className="w-full bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90 squircle-md font-[var(--font-be-vietnam)]"
          >
            {exportLoading ? "Exporting..." : `Export ${exportOptions.exportType === "current" ? "Current View" : "All Users"}`}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );

  // ============================================
  // EXPORT HANDLER
  // ============================================
  const handleExport = async () => {
    setExportLoading(true);
    setIsFilterSheetOpen(false);

    try {
      if (exportOptions.exportType === "current") {
        const params = new URLSearchParams();
        if (debouncedSearchTerm) params.append("q", debouncedSearchTerm);
        if (statusFilter !== "all") params.append("filter_status", statusFilter);
        if (roleFilter !== "all") params.append("role", roleFilter);
        if (activityFilter !== "all") params.append("activity", activityFilter);
        if (balanceFilter !== "all") {
          params.append("balance", balanceFilter);
          params.append("low_threshold", LOW_BALANCE_THRESHOLD.toString());
          params.append("high_threshold", HIGH_BALANCE_THRESHOLD.toString());
        }
        params.append("status", activeTab === "verified" ? "verified" : "pending");
        params.append("fields", JSON.stringify(exportOptions.selectedFields));
        params.append("page", "1");
        params.append("limit", total.toString());

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
        const params = new URLSearchParams();
        if (exportOptions.userType === "verified") {
          params.append("type", "verified");
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
        text: error.message || "An error occurred during export",
      });
    } finally {
      setExportLoading(false);
    }
  };

  // ============================================
  // MAIN RENDER
  // ============================================

  if (selectedUserId) {
    return <UserProfilePage userId={selectedUserId} onBack={handleBackToUsers} />;
  }

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
          <p className="text-[var(--destructive)]">Failed to load users ❌</p>
        </div>
      </AdminLayout>
    );
  }

  const users = getUsers();

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Modals */}
        <SuspendUserModal
          user={selectedUser}
          isOpen={showSuspendModal}
          onClose={() => setShowSuspendModal(false)}
          onConfirm={handleConfirmSuspend}
        />

        <FlagUserModal
          user={selectedUser}
          isOpen={showFlagModal}
          onClose={() => setShowFlagModal(false)}
          onConfirm={handleConfirmFlag}
        />

        <FreezeWalletModal
          user={selectedUser}
          isOpen={showFreezeModal}
          onClose={() => setShowFreezeModal(false)}
          onConfirm={handleConfirmFreeze}
        />

        <SetTransactionLimitModal
          user={selectedUser}
          isOpen={showLimitModal}
          onClose={() => setShowLimitModal(false)}
          onConfirm={handleConfirmLimit}
        />

        <RequestDocumentsModal
          user={selectedUser}
          isOpen={showDocumentsModal}
          onClose={() => setShowDocumentsModal(false)}
          onConfirm={handleConfirmDocuments}
        />

        <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
          <DialogContent className="bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-pop squircle-lg max-w-md">
            <DialogHeader>
              <DialogTitle className="font-[var(--font-space-grotesk)] text-[var(--text-primary)] flex items-center gap-2">
                <XCircle className="w-5 h-5 text-[var(--destructive)]" />
                Reject KYC
              </DialogTitle>
              <DialogDescription className="text-[var(--text-secondary)]">
                Please provide a reason for rejecting {selectedUser?.email}'s KYC.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-[var(--text-primary)]">Rejection Reason</Label>
                <Textarea
                  placeholder="Enter reason for KYC rejection..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] squircle-md min-h-[100px]"
                  style={{ outline: "none", boxShadow: "none" }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectModal(false)} className="border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] squircle-md">
                Cancel
              </Button>
              <Button onClick={handleConfirmReject} className="bg-[var(--destructive)] text-white hover:bg-[var(--destructive)]/90 squircle-md">
                Reject KYC
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-xl md:text-2xl font-semibold font-[var(--font-space-grotesk)] text-[var(--text-primary)]">
            Users Management
          </h2>
          <div className="flex gap-2 flex-wrap">
            <ExportOptionsSheet />
            <Button 
              variant="outline" 
              onClick={() => mutate()}
              className="border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] squircle-md"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <div className="bg-[var(--bg-primary)] p-3 md:p-4 border border-[var(--border-color)] shadow-soft squircle-lg">
            <h3 className="text-xs md:text-sm font-medium text-[var(--text-secondary)]">
              Verified Users
            </h3>
            <p className="text-xl md:text-2xl font-semibold text-[var(--color-lemon-green)] font-[var(--font-space-grotesk)]">
              {verifiedCount}
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Completed KYC</p>
          </div>
          <div className="bg-[var(--bg-primary)] p-3 md:p-4 border border-[var(--border-color)] shadow-soft squircle-lg">
            <h3 className="text-xs md:text-sm font-medium text-[var(--text-secondary)]">
              Pending KYC
            </h3>
            <p className="text-xl md:text-2xl font-semibold text-[var(--color-accent-yellow)] font-[var(--font-space-grotesk)]">
              {pendingCount}
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Awaiting verification</p>
          </div>
        </div>

        {/* Tabs with counts */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-[var(--bg-secondary)] p-1 squircle-md">
            <TabsTrigger 
              value="verified" 
              className="text-xs md:text-sm data-[state=active]:bg-[var(--color-accent-yellow)] data-[state=active]:text-[var(--color-ink)] text-[var(--text-secondary)] squircle-sm transition-all"
            >
              Verified ({verifiedCount})
            </TabsTrigger>
            <TabsTrigger 
              value="pending" 
              className="text-xs md:text-sm data-[state=active]:bg-[var(--color-accent-yellow)] data-[state=active]:text-[var(--color-ink)] text-[var(--text-secondary)] squircle-sm transition-all"
            >
              Pending KYC ({pendingCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="verified" className="space-y-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <SearchInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Search by email, name, or phone..."
                  isLoading={isSearching}
                  className="w-full sm:w-1/3"
                />
                <Select 
                  value={statusFilter} 
                  onValueChange={(value) => {
                    setStatusFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-1/6 border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] squircle-md">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--bg-primary)] border-[var(--border-color)]">
                    <SelectItem value="all" className="text-[var(--text-primary)]">All</SelectItem>
                    <SelectItem value="active" className="text-[var(--text-primary)]">Active</SelectItem>
                    <SelectItem value="blocked" className="text-[var(--text-primary)]">Suspended</SelectItem>
                  </SelectContent>
                </Select>
                <Select 
                  value={roleFilter} 
                  onValueChange={(value) => {
                    setRoleFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-1/6 border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] squircle-md">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--bg-primary)] border-[var(--border-color)]">
                    <SelectItem value="all" className="text-[var(--text-primary)]">All Roles</SelectItem>
                    <SelectItem value="user" className="text-[var(--text-primary)]">User</SelectItem>
                    <SelectItem value="super_admin" className="text-[var(--text-primary)]">Super Admin</SelectItem>
                    <SelectItem value="operations_admin" className="text-[var(--text-primary)]">Operations Admin</SelectItem>
                    <SelectItem value="support_admin" className="text-[var(--text-primary)]">Support Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Select 
                  value={activityFilter} 
                  onValueChange={(value) => {
                    setActivityFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-1/6 border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] squircle-md">
                    <SelectValue placeholder="Activity" />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--bg-primary)] border-[var(--border-color)]">
                    <SelectItem value="all" className="text-[var(--text-primary)]">All Activity</SelectItem>
                    <SelectItem value="active" className="text-[var(--text-primary)]">Active (30 days)</SelectItem>
                    <SelectItem value="today" className="text-[var(--text-primary)]">Today</SelectItem>
                    <SelectItem value="week" className="text-[var(--text-primary)]">This Week</SelectItem>
                    <SelectItem value="inactive" className="text-[var(--text-primary)]">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Select 
                  value={balanceFilter} 
                  onValueChange={(value) => {
                    setBalanceFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-1/6 border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] squircle-md">
                    <SelectValue placeholder="Balance" />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--bg-primary)] border-[var(--border-color)]">
                    <SelectItem value="all" className="text-[var(--text-primary)]">All Balances</SelectItem>
                    <SelectItem value="high" className="text-[var(--text-primary)]">High Balance</SelectItem>
                    <SelectItem value="low" className="text-[var(--text-primary)]">Low Balance</SelectItem>
                    <SelectItem value="negative" className="text-[var(--text-primary)]">Negative</SelectItem>
                    <SelectItem value="zero" className="text-[var(--text-primary)]">Zero</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {debouncedSearchTerm && (
                <div className="text-sm text-[var(--text-secondary)]">
                  Found <span className="font-medium text-[var(--text-primary)]">{total}</span> results for "{debouncedSearchTerm}"
                </div>
              )}
              
              {(statusFilter !== "all" || roleFilter !== "all" || activityFilter !== "all" || balanceFilter !== "all") && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-[var(--text-secondary)]">Active filters:</span>
                  {statusFilter !== "all" && (
                    <span className="inline-flex items-center px-2 py-1 squircle-sm text-xs bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                      Status: {statusFilter === "active" ? "Active" : "Suspended"}
                      <button 
                        onClick={() => setStatusFilter("all")}
                        className="ml-1 hover:text-[var(--destructive)]"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {roleFilter !== "all" && (
                    <span className="inline-flex items-center px-2 py-1 squircle-sm text-xs bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                      Role: {roleFilter}
                      <button 
                        onClick={() => setRoleFilter("all")}
                        className="ml-1 hover:text-[var(--destructive)]"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {activityFilter !== "all" && (
                    <span className="inline-flex items-center px-2 py-1 squircle-sm text-xs bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                      Activity: {activityFilter}
                      <button 
                        onClick={() => setActivityFilter("all")}
                        className="ml-1 hover:text-[var(--destructive)]"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {balanceFilter !== "all" && (
                    <span className="inline-flex items-center px-2 py-1 squircle-sm text-xs bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                      Balance: {balanceFilter}
                      <button 
                        onClick={() => setBalanceFilter("all")}
                        className="ml-1 hover:text-[var(--destructive)]"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <AdminTable
                columns={verifiedColumns}
                rows={users}
                onDelete={handleDelete}
                onRowClick={handleUserClick}
                customActions={getUserControlsActions(true)}
              />
            </div>
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search pending users..."
              isLoading={isSearching}
              className="w-full sm:w-1/3"
            />
            
            {debouncedSearchTerm && (
              <div className="text-sm text-[var(--text-secondary)]">
                Found <span className="font-medium text-[var(--text-primary)]">{total}</span> results for "{debouncedSearchTerm}"
              </div>
            )}
            
            <div className="overflow-x-auto">
              <AdminTable
                columns={pendingColumns}
                rows={users}
                onDelete={handleDelete}
                onRowClick={handleUserClick}
                customActions={getUserControlsActions(false)}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center overflow-x-auto">
            <Pagination>
              <PaginationContent className="flex-wrap gap-1">
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] squircle-md"}
                  />
                </PaginationItem>
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5) {
                    if (currentPage > 3 && i < 2) pageNum = i + 1;
                    else if (currentPage > 3 && i === 2) pageNum = currentPage;
                    else if (currentPage > 3 && i > 2) pageNum = totalPages - (4 - i);
                  }
                  return (
                    <PaginationItem key={i}>
                      <PaginationLink
                        isActive={pageNum === currentPage}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`${isMobile ? "hidden sm:inline-flex" : "inline-flex"} ${
                          pageNum === currentPage
                            ? "bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90"
                            : "text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                        } squircle-md transition-all`}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] squircle-md"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        <div className="text-sm text-[var(--text-secondary)] text-center">
          Showing {users.length} of {total} users
          {debouncedSearchTerm && ` matching "${debouncedSearchTerm}"`}
        </div>
      </div>
    </AdminLayout>
  );
}