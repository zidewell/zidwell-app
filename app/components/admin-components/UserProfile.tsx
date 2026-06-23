// app/components/admin-components/UserProfile.tsx
"use client";

import useSWR from "swr";
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import AdminLayout from "@/app/components/admin-components/layout";
import Loader from "@/app/components/Loader";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/app/components/ui/pagination";
import { ArrowLeft, RefreshCw } from "lucide-react";

const fetcher = async (url: string) => {
  console.log('🔄 Fetching:', url);
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error(`API Error: ${res.status} ${res.statusText}`);
    console.error('❌ Fetch error:', { url, status: res.status, statusText: res.statusText });
    throw error;
  }
  const data = await res.json();
  console.log('✅ Fetch success:', { url, data });
  return data;
};

interface UserProfilePageProps {
  userId: string;
  onBack: () => void;
}

export default function UserProfilePage({ userId, onBack }: UserProfilePageProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPages, setCurrentPages] = useState({
    contracts: 1,
    receipts: 1,
    invoices: 1,
    transactions: 1
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPages(prev => ({
        contracts: 1,
        receipts: 1,
        invoices: 1,
        transactions: 1
      }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const {
    data: userData,
    error: userError,
    isLoading: userLoading,
  } = useSWR(userId ? `/api/admin-apis/users/${userId}` : null, fetcher);

  const { data: contractsCountData } = useSWR(
    userId ? `/api/admin-apis/users/${userId}/contracts?page=1&limit=1` : null,
    fetcher
  );

  const { data: receiptsCountData } = useSWR(
    userId ? `/api/admin-apis/users/${userId}/receipts?page=1&limit=1` : null,
    fetcher
  );

  const { data: invoicesCountData } = useSWR(
    userId ? `/api/admin-apis/users/${userId}/invoices?page=1&limit=1` : null,
    fetcher
  );

  const { data: transactionsCountData } = useSWR(
    userId ? `/api/admin-apis/users/${userId}/transactions?page=1&limit=1` : null,
    fetcher
  );

  const totalCounts = {
    contracts: contractsCountData?.pagination?.totalItems || 0,
    receipts: receiptsCountData?.pagination?.totalItems || 0,
    invoices: invoicesCountData?.pagination?.totalItems || 0,
    transactions: transactionsCountData?.pagination?.totalItems || 0,
  };

  const getApiUrl = (endpoint: string, page: number) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '6',
      ...(debouncedSearch && { search: debouncedSearch })
    });
    return `/api/admin-apis/users/${userId}/${endpoint}?${params}`;
  };

  const { data: contractsData, isLoading: contractsLoading } = useSWR(
    activeTab === "contracts" ? getApiUrl('contracts', currentPages.contracts) : null,
    fetcher
  );

  const { data: receiptsData, isLoading: receiptsLoading } = useSWR(
    activeTab === "receipts" ? getApiUrl('receipts', currentPages.receipts) : null,
    fetcher
  );

  const { data: invoicesData, isLoading: invoicesLoading } = useSWR(
    activeTab === "invoices" ? getApiUrl('invoices', currentPages.invoices) : null,
    fetcher
  );

  const { data: transactionsData, isLoading: transactionsLoading } = useSWR(
    activeTab === "transactions" ? getApiUrl('transactions', currentPages.transactions) : null,
    fetcher
  );

  const handlePageChange = (tab: string, page: number) => {
    setCurrentPages(prev => ({ ...prev, [tab]: page }));
  };

  const handleTabChange = (value: string) => {
    setSearchTerm("");
    setActiveTab(value);
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case "contracts": return { data: contractsData, loading: contractsLoading };
      case "receipts": return { data: receiptsData, loading: receiptsLoading };
      case "invoices": return { data: invoicesData, loading: invoicesLoading };
      case "transactions": return { data: transactionsData, loading: transactionsLoading };
      default: return { data: null, loading: false };
    }
  };

  const { data: currentData, loading: currentLoading } = getCurrentData();
  const currentItems = currentData?.[activeTab] || [];
  const pagination = currentData?.pagination;

  const [pageLoading, setPageLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (pageLoading || userLoading) {
    return (
      <AdminLayout>
        <Loader />
      </AdminLayout>
    );
  }

  if (userError || !userData?.user) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" onClick={onBack} className="border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] squircle-md">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Users
            </Button>
          </div>
          <p className="text-[var(--destructive)]">Failed to load user details ❌</p>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            Error: {userError?.message || 'User not found'}
          </p>
        </div>
      </AdminLayout>
    );
  }

  const user = userData.user;

  const renderStatusBadge = (isBlocked: boolean, status: string) => {
    if (isBlocked) {
      return <Badge variant="destructive" className="squircle-sm">⛔ Blocked</Badge>;
    } else if (status === "active") {
      return (
        <Badge className="bg-[var(--color-lemon-green)]/20 text-[var(--color-lemon-green)] border-[var(--color-lemon-green)]/30 squircle-sm">
          ● Active
        </Badge>
      );
    }
    return <Badge variant="outline" className="squircle-sm">{status}</Badge>;
  };

  const renderRoleBadge = (role: string) => {
    if (role === "admin") {
      return (
        <Badge className="bg-purple-100 text-purple-800 border-purple-200 squircle-sm">
          👑 Admin
        </Badge>
      );
    }
    return <Badge variant="outline" className="squircle-sm">👤 User</Badge>;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  const renderItemStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
      case "completed":
      case "paid":
      case "verified":
        return (
          <Badge className="bg-[var(--color-lemon-green)]/20 text-[var(--color-lemon-green)] border-[var(--color-lemon-green)]/30 squircle-sm">
            {status}
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-[var(--color-accent-yellow)]/20 text-[var(--color-accent-yellow)] border-[var(--color-accent-yellow)]/30 squircle-sm">
            {status}
          </Badge>
        );
      case "failed":
      case "rejected":
      case "cancelled":
        return <Badge variant="destructive" className="squircle-sm">{status}</Badge>;
      default:
        return <Badge variant="outline" className="squircle-sm">{status}</Badge>;
    }
  };

  const renderTransactionTypeBadge = (type: string) => {
    if (type === "credit") {
      return (
        <Badge className="bg-[var(--color-lemon-green)]/20 text-[var(--color-lemon-green)] border-[var(--color-lemon-green)]/30 squircle-sm">
          Credit
        </Badge>
      );
    } else if (type === "debit") {
      return <Badge variant="destructive" className="squircle-sm">Debit</Badge>;
    }
    return <Badge variant="outline" className="squircle-sm">{type}</Badge>;
  };

  const renderPagination = () => {
    if (!pagination || pagination.totalPages <= 1) return null;

    return (
      <div className="flex justify-center mt-6">
        <Pagination>
          <PaginationContent className="flex-wrap gap-1">
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(activeTab, pagination.currentPage - 1)}
                className={!pagination.hasPrevPage ? "pointer-events-none opacity-50" : "cursor-pointer text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] squircle-md"}
              />
            </PaginationItem>
            {Array.from({ length: pagination.totalPages }).map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  isActive={i + 1 === pagination.currentPage}
                  onClick={() => handlePageChange(activeTab, i + 1)}
                  className={i + 1 === pagination.currentPage
                    ? "bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90"
                    : "text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                  }
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(activeTab, pagination.currentPage + 1)}
                className={!pagination.hasNextPage ? "pointer-events-none opacity-50" : "cursor-pointer text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] squircle-md"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  };

  const renderItems = () => {
    switch (activeTab) {
      case "contracts":
        return currentItems.map((contract: any) => (
          <div key={contract.id} className="border border-[var(--border-color)] squircle-lg p-4 hover:shadow-soft transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-[var(--text-primary)]">{contract.title || "Untitled Contract"}</h4>
                <p className="text-sm text-[var(--text-secondary)]">ID: {contract.id}</p>
                <p className="text-sm">Status: {renderItemStatusBadge(contract.status)}</p>
                <p className="text-sm text-[var(--text-secondary)]">Role: {contract.role}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-[var(--text-secondary)]">{formatDate(contract.created_at)}</p>
                {contract.signed_at && (
                  <p className="text-sm text-[var(--color-lemon-green)]">Signed: {formatDate(contract.signed_at)}</p>
                )}
              </div>
            </div>
          </div>
        ));

      case "receipts":
        return currentItems.map((receipt: any) => (
          <div key={receipt.id} className="border border-[var(--border-color)] squircle-lg p-4 hover:shadow-soft transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-[var(--text-primary)]">Receipt #{receipt.receipt_number}</h4>
                <p className="text-sm text-[var(--text-secondary)]">ID: {receipt.id}</p>
                <p className="text-sm">For: {receipt.payment_for}</p>
                <p className="text-sm">Status: {renderItemStatusBadge(receipt.status)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-[var(--text-secondary)]">{formatDate(receipt.created_at)}</p>
                <p className="font-medium text-[var(--color-lemon-green)]">{formatCurrency(receipt.amount)}</p>
                {receipt.signed_at && (
                  <p className="text-sm text-[var(--color-lemon-green)]">Signed: {formatDate(receipt.signed_at)}</p>
                )}
              </div>
            </div>
          </div>
        ));

      case "invoices":
        return currentItems.map((invoice: any) => (
          <div key={invoice.id} className="border border-[var(--border-color)] squircle-lg p-4 hover:shadow-soft transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-[var(--text-primary)]">Invoice #{invoice.invoice_number}</h4>
                <p className="text-sm text-[var(--text-secondary)]">ID: {invoice.id}</p>
                <p className="text-sm">For: {invoice.description}</p>
                <p className="text-sm">Bill To: {invoice.bill_to}</p>
                <p className="text-sm">Status: {renderItemStatusBadge(invoice.status)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-[var(--text-secondary)]">{formatDate(invoice.created_at)}</p>
                <p className="font-medium text-[var(--text-primary)]">{formatCurrency(invoice.total_amount)}</p>
              </div>
            </div>
          </div>
        ));

      case "transactions":
        return currentItems.map((transaction: any) => (
          <div key={transaction.id} className="border border-[var(--border-color)] squircle-lg p-4 hover:shadow-soft transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-[var(--text-primary)]">{transaction.description}</h4>
                <p className="text-sm text-[var(--text-secondary)]">ID: {transaction.id}</p>
                <p className="text-sm">Type: {renderTransactionTypeBadge(transaction.type)}</p>
                <p className="text-sm text-[var(--text-secondary)]">Reference: {transaction.reference}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-[var(--text-secondary)]">{formatDate(transaction.created_at)}</p>
                <p className={`font-medium ${transaction.type === "credit" ? "text-[var(--color-lemon-green)]" : "text-[var(--destructive)]"}`}>
                  {transaction.type === "credit" ? "+" : "-"}{formatCurrency(transaction.amount)}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">Balance: {formatCurrency(transaction.balance_after)}</p>
              </div>
            </div>
          </div>
        ));

      default:
        return null;
    }
  };

  const renderSearchAndResults = () => {
    return (
      <>
        <div className="mb-6">
          <Input
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)] squircle-md"
            style={{ outline: "none", boxShadow: "none" }}
          />
        </div>

        {!currentLoading && (
          <div className="text-sm text-[var(--text-secondary)] mb-4">
            Showing {currentItems.length} of {pagination?.totalItems || 0} {activeTab}
            {debouncedSearch && ` matching "${debouncedSearch}"`}
          </div>
        )}

        {currentLoading ? (
          <div className="flex justify-center py-8">
            <Loader />
          </div>
        ) : currentItems.length > 0 ? (
          <div className="space-y-4">
            {renderItems()}
          </div>
        ) : (
          <p className="text-[var(--text-secondary)] text-center py-8">
            {debouncedSearch 
              ? `No ${activeTab} found matching "${debouncedSearch}"`
              : `No ${activeTab} found for this user.`
            }
          </p>
        )}

        {renderPagination()}
      </>
    );
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onBack} className="border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] squircle-md">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Users
            </Button>
            <div>
              <h2 className="text-2xl font-semibold font-[var(--font-space-grotesk)] text-[var(--text-primary)]">User Profile</h2>
              <p className="text-[var(--text-secondary)]">Detailed view of user account and activities</p>
            </div>
          </div>
          <div className="flex gap-2">
            {renderStatusBadge(user.is_blocked, user.status)}
            {renderRoleBadge(user.role)}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-[var(--bg-secondary)] p-1 squircle-md overflow-x-auto">
            <TabsTrigger 
              value="overview" 
              className="text-xs md:text-sm data-[state=active]:bg-[var(--color-accent-yellow)] data-[state=active]:text-[var(--color-ink)] text-[var(--text-secondary)] squircle-sm transition-all whitespace-nowrap"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="contracts" 
              className="text-xs md:text-sm data-[state=active]:bg-[var(--color-accent-yellow)] data-[state=active]:text-[var(--color-ink)] text-[var(--text-secondary)] squircle-sm transition-all whitespace-nowrap"
            >
              Contracts ({totalCounts.contracts})
            </TabsTrigger>
            <TabsTrigger 
              value="receipts" 
              className="text-xs md:text-sm data-[state=active]:bg-[var(--color-accent-yellow)] data-[state=active]:text-[var(--color-ink)] text-[var(--text-secondary)] squircle-sm transition-all whitespace-nowrap"
            >
              Receipts ({totalCounts.receipts})
            </TabsTrigger>
            <TabsTrigger 
              value="invoices" 
              className="text-xs md:text-sm data-[state=active]:bg-[var(--color-accent-yellow)] data-[state=active]:text-[var(--color-ink)] text-[var(--text-secondary)] squircle-sm transition-all whitespace-nowrap"
            >
              Invoices ({totalCounts.invoices})
            </TabsTrigger>
            <TabsTrigger 
              value="transactions" 
              className="text-xs md:text-sm data-[state=active]:bg-[var(--color-accent-yellow)] data-[state=active]:text-[var(--color-ink)] text-[var(--text-secondary)] squircle-sm transition-all whitespace-nowrap"
            >
              Transactions ({totalCounts.transactions})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-soft squircle-lg">
                <CardHeader>
                  <CardTitle className="font-[var(--font-space-grotesk)] text-[var(--text-primary)]">Basic Information</CardTitle>
                  <CardDescription className="text-[var(--text-secondary)]">User account details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-[var(--text-secondary)]">Full Name</label>
                      <p className="font-medium text-[var(--text-primary)]">{user.first_name} {user.last_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[var(--text-secondary)]">Email</label>
                      <p className="font-medium text-[var(--text-primary)]">{user.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[var(--text-secondary)]">Phone</label>
                      <p className="font-medium text-[var(--text-primary)]">{user.phone || "Not provided"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[var(--text-secondary)]">Wallet Balance</label>
                      <p className="font-medium text-[var(--color-lemon-green)]">{formatCurrency(user.wallet_balance || 0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-soft squircle-lg">
                <CardHeader>
                  <CardTitle className="font-[var(--font-space-grotesk)] text-[var(--text-primary)]">Account Status</CardTitle>
                  <CardDescription className="text-[var(--text-secondary)]">Login and account information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-sm font-medium text-[var(--text-secondary)]">Account Created</label>
                      <p className="font-medium text-[var(--text-primary)]">{formatDate(user.created_at)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[var(--text-secondary)]">Last Login</label>
                      <p className="font-medium text-[var(--text-primary)]">{formatDate(user.last_login)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[var(--text-secondary)]">Last Logout</label>
                      <p className="font-medium text-[var(--text-primary)]">{formatDate(user.last_logout)}</p>
                    </div>
                    {user.is_blocked && (
                      <div>
                        <label className="text-sm font-medium text-[var(--text-secondary)]">Block Reason</label>
                        <p className="font-medium text-[var(--destructive)]">{user.block_reason || "No reason provided"}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-soft squircle-lg md:col-span-2">
                <CardHeader>
                  <CardTitle className="font-[var(--font-space-grotesk)] text-[var(--text-primary)]">Activity Summary</CardTitle>
                  <CardDescription className="text-[var(--text-secondary)]">User engagement metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-[var(--bg-secondary)] squircle-lg">
                      <p className="text-2xl font-bold text-[var(--color-accent-yellow)] font-[var(--font-space-grotesk)]">{totalCounts.contracts}</p>
                      <p className="text-sm text-[var(--text-secondary)]">Contracts</p>
                    </div>
                    <div className="text-center p-4 bg-[var(--bg-secondary)] squircle-lg">
                      <p className="text-2xl font-bold text-[var(--color-lemon-green)] font-[var(--font-space-grotesk)]">{totalCounts.receipts}</p>
                      <p className="text-sm text-[var(--text-secondary)]">Receipts</p>
                    </div>
                    <div className="text-center p-4 bg-[var(--bg-secondary)] squircle-lg">
                      <p className="text-2xl font-bold text-purple-600 font-[var(--font-space-grotesk)]">{totalCounts.invoices}</p>
                      <p className="text-sm text-[var(--text-secondary)]">Invoices</p>
                    </div>
                    <div className="text-center p-4 bg-[var(--bg-secondary)] squircle-lg">
                      <p className="text-2xl font-bold text-orange-500 font-[var(--font-space-grotesk)]">{totalCounts.transactions}</p>
                      <p className="text-sm text-[var(--text-secondary)]">Transactions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="contracts">
            <Card className="bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-soft squircle-lg">
              <CardHeader>
                <CardTitle className="font-[var(--font-space-grotesk)] text-[var(--text-primary)]">User Contracts</CardTitle>
                <CardDescription className="text-[var(--text-secondary)]">All contracts created by this user</CardDescription>
              </CardHeader>
              <CardContent>{renderSearchAndResults()}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="receipts">
            <Card className="bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-soft squircle-lg">
              <CardHeader>
                <CardTitle className="font-[var(--font-space-grotesk)] text-[var(--text-primary)]">User Receipts</CardTitle>
                <CardDescription className="text-[var(--text-secondary)]">All receipts associated with this user</CardDescription>
              </CardHeader>
              <CardContent>{renderSearchAndResults()}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices">
            <Card className="bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-soft squircle-lg">
              <CardHeader>
                <CardTitle className="font-[var(--font-space-grotesk)] text-[var(--text-primary)]">User Invoices</CardTitle>
                <CardDescription className="text-[var(--text-secondary)]">All invoices created for this user</CardDescription>
              </CardHeader>
              <CardContent>{renderSearchAndResults()}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card className="bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-soft squircle-lg">
              <CardHeader>
                <CardTitle className="font-[var(--font-space-grotesk)] text-[var(--text-primary)]">User Transactions</CardTitle>
                <CardDescription className="text-[var(--text-secondary)]">All financial transactions by this user</CardDescription>
              </CardHeader>
              <CardContent>{renderSearchAndResults()}</CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}