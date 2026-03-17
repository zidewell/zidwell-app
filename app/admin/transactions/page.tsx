// app/admin/transactions/page.tsx
"use client";

import useSWR from "swr";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import AdminTable from "@/app/components/admin-components/AdminTable";
import AdminLayout from "@/app/components/admin-components/layout";
import Loader from "@/app/components/Loader";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/app/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Progress } from "@/app/components/ui/progress";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// Debounce hook
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

// Transaction interface for better type safety
interface Transaction {
  id: string;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  type: string;
  amount: number | string;
  fee: number | string | null;
  total_deduction: number | string;
  status: string;
  reference: string | null;
  description: string | null;
  phone_number: string | null;
  network: string | null;
  channel: string | null;
  created_at: string;
}

// Unified UserFee interface
interface UserFee {
  user_id: string;
  total_fee: number;
  // Both possible property names from different sources
  transaction_count?: number;
  transactions?: number;
  successful_transactions?: number;
  failed_transactions?: number;
  pending_transactions?: number;
  last_transaction?: string;
  first_transaction?: string;
}

interface ApiStats {
  total: number;
  successful: number;
  failed: number;
  pending: number;
  processing: number;
  totalAmount: number;
  totalFee: number;
  averageFeePerUser: number;
  userFees: UserFee[];
  byType: Record<string, number>;
  byStatus: {
    success: number;
    failed: number;
    pending: number;
    processing: number;
  };
}

interface DirectFeesData {
  calculation_method: string;
  grand_total_fee: number;
  user_fees: Array<{
    user_id: string;
    total_fee: number;
    transactions: number;
  }>;
  summary: {
    average_per_user: number;
  };
  difference_from_csv: number;
}

export default function TransactionsPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("total");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isClient, setIsClient] = useState(false);
  const itemsPerPage = 20;

  // Helper function to get transaction count from UserFee
  const getUserTransactionCount = useCallback((user: UserFee): number => {
    return user.transaction_count || user.transactions || 0;
  }, []);

  // Debounce search term to prevent too many API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Build API URL with all filters for server-side filtering
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: itemsPerPage.toString(),
      range: dateRange,
      includeStats: "true", // IMPORTANT: Request stats from API
    });

    if (debouncedSearchTerm) params.append("search", debouncedSearchTerm);
    if (typeFilter !== "all") params.append("type", typeFilter);
    if (statusFilter !== "all") params.append("status", statusFilter);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    return `/api/admin-apis/transactions?${params.toString()}`;
  }, [
    currentPage,
    dateRange,
    debouncedSearchTerm,
    typeFilter,
    statusFilter,
    startDate,
    endDate,
    itemsPerPage,
  ]);

  const { data, error, isLoading, mutate } = useSWR(apiUrl, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  // Direct fee calculation API call
  const directFeesApiUrl = useMemo(() => {
    const params = new URLSearchParams({
      directFees: "true",
      range: dateRange,
    });

    if (debouncedSearchTerm) params.append("search", debouncedSearchTerm);
    if (typeFilter !== "all") params.append("type", typeFilter);
    if (statusFilter !== "all") params.append("status", statusFilter);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    return `/api/admin-apis/transactions?${params.toString()}`;
  }, [
    dateRange,
    debouncedSearchTerm,
    typeFilter,
    statusFilter,
    startDate,
    endDate,
  ]);

  const { data: directFeesData } = useSWR(directFeesApiUrl, fetcher, {
    revalidateOnFocus: false,
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearchTerm,
    typeFilter,
    statusFilter,
    dateRange,
    startDate,
    endDate,
  ]);

  // Memoize calculations
  const transactions = useMemo(
    () => data?.transactions || [],
    [data],
  ) as Transaction[];
  const totalTransactions = useMemo(() => data?.total || 0, [data]);
  const totalPages = useMemo(
    () => Math.ceil(totalTransactions / itemsPerPage),
    [totalTransactions, itemsPerPage],
  );

  // Get stats from API response (server-side calculated)
  const apiStats = useMemo(() => data?.stats || {}, [data]) as ApiStats;

  // Use direct fees data for accurate calculations
  const directFees = useMemo(
    () => directFeesData?.data || {},
    [directFeesData],
  ) as DirectFeesData;

  // IMPORTANT: Use server-side calculated stats, not frontend calculations
  const totalAmount = useMemo(() => apiStats?.totalAmount || 0, [apiStats]);
  const totalFee = useMemo(() => {
    // Try to get from direct calculation first, then from API stats
    if (directFees?.grand_total_fee !== undefined) {
      return directFees.grand_total_fee;
    }
    return apiStats?.totalFee || 0;
  }, [apiStats, directFees]);

  // Get user fees breakdown - unified format
  const userFees = useMemo(() => {
    if (directFees?.user_fees) {
      return directFees.user_fees.map((fee) => ({
        ...fee,
        // Add transaction_count as alias for transactions for consistency
        transaction_count: fee.transactions,
      })) as UserFee[];
    }
    return apiStats?.userFees || [];
  }, [apiStats, directFees]);

  // Calculate other stats from API stats
  const successfulTransactionsCount = useMemo(
    () => apiStats?.successful || 0,
    [apiStats],
  );
  const failedTransactionsCount = useMemo(
    () => apiStats?.failed || 0,
    [apiStats],
  );
  const pendingTransactionsCount = useMemo(
    () => apiStats?.pending || 0,
    [apiStats],
  );
  const processingTransactionsCount = useMemo(
    () => apiStats?.processing || 0,
    [apiStats],
  );

  // Calculate rates using server-side data
  const successRate = useMemo(
    () =>
      apiStats?.total
        ? (successfulTransactionsCount / apiStats.total) * 100
        : 0,
    [apiStats, successfulTransactionsCount],
  );

  const failureRate = useMemo(
    () =>
      apiStats?.total ? (failedTransactionsCount / apiStats.total) * 100 : 0,
    [apiStats, failedTransactionsCount],
  );

  const pendingRate = useMemo(
    () =>
      apiStats?.total ? (pendingTransactionsCount / apiStats.total) * 100 : 0,
    [apiStats, pendingTransactionsCount],
  );

  // Get transaction type distribution from API stats
  const transactionTypes = useMemo(() => apiStats?.byType || {}, [apiStats]);

  // Calculate top types by count (not volume)
  const topTypesByCount = useMemo(
    () =>
      Object.entries(transactionTypes)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 3),
    [transactionTypes],
  );

  // Calculate average fee per transaction
  const avgFeePerTransaction = useMemo(
    () => (apiStats?.total ? totalFee / apiStats.total : 0),
    [apiStats, totalFee],
  );

  // Calculate average transaction amount
  const avgTransactionAmount = useMemo(
    () => (apiStats?.total ? totalAmount / apiStats.total : 0),
    [apiStats, totalAmount],
  );

  // Handle user click to navigate to user-specific transactions
  const handleUserClick = useCallback(
    (userId: string, userEmail?: string) => {
      if (userId) {
        router.push(
          `/admin/transactions/user/${userId}?email=${encodeURIComponent(
            userEmail || "",
          )}`,
        );
      }
    },
    [router],
  );

  // Handle fee verification
  const handleVerifyFees = useCallback(async () => {
    try {
      const response = await fetch(
        "/api/admin-apis/transactions?action=verifyFees",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const result = await response.json();

      if (result.success) {
        const verification = result.verification;

        let html = `
          <div class="text-left space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div><strong>Calculation Method:</strong></div>
              <div>${
                verification.direct_calculation?.calculation_method || "N/A"
              }</div>
              
              <div><strong>Range Applied:</strong></div>
              <div>${verification.range}</div>
              
              <div><strong>CSV Expected Total:</strong></div>
              <div class="font-semibold">₦${
                verification.csv_expected?.toLocaleString() || "N/A"
              }</div>
              
              <div><strong>Direct Calculation Total:</strong></div>
              <div class="font-semibold ${
                verification.direct_calculation?.grand_total_fee ===
                verification.csv_expected
                  ? "text-green-600"
                  : "text-red-600"
              }">
                ₦${
                  verification.direct_calculation?.grand_total_fee?.toLocaleString() ||
                  "N/A"
                }
              </div>
              
              <div><strong>Stats API Total:</strong></div>
              <div class="font-semibold">₦${
                verification.cached_stats?.totalFee?.toLocaleString() || "N/A"
              }</div>
              
              <div><strong>Difference from CSV:</strong></div>
              <div class="${
                verification.comparison?.direct_vs_csv === "0.00"
                  ? "text-green-600"
                  : "text-red-600"
              }">
                ₦${verification.comparison?.direct_vs_csv || "N/A"}
              </div>
            </div>
        `;

        // Add user breakdown
        if (verification.direct_calculation?.user_fees?.length > 0) {
          html += `
            <div class="border-t pt-4">
              <h4 class="font-semibold mb-2">Top 5 Users by Fees:</h4>
              <div class="max-h-60 overflow-y-auto">
                <table class="min-w-full text-sm">
                  <thead>
                    <tr class="border-b">
                      <th class="text-left py-1">User ID</th>
                      <th class="text-left py-1">Total Fee</th>
                      <th class="text-left py-1">Transactions</th>
                    </tr>
                  </thead>
                  <tbody>
          `;

          verification.direct_calculation.user_fees
            .slice(0, 5)
            .forEach((user: any) => {
              html += `
              <tr class="border-b">
                <td class="py-1 font-mono text-xs">${user.user_id?.substring(
                  0,
                  8,
                )}...</td>
                <td class="py-1 font-semibold">₦${user.total_fee?.toLocaleString()}</td>
                <td class="py-1">${user.transactions}</td>
              </tr>
            `;
            });

          html += `
                  </tbody>
                </table>
              </div>
            </div>
          `;
        }

        html += `</div>`;

        await Swal.fire({
          title: "Fee Verification",
          html,
          width: 700,
          confirmButtonColor: "#3b82f6",
        });

        // Refresh data
        mutate();
      } else {
        Swal.fire("Error", "Failed to verify fees", "error");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to verify fees", "error");
    }
  }, [mutate]);

  // ---------- Export to CSV ----------
  const handleExportCSV = async () => {
    try {
      // Get all transactions for export (without pagination)
      const exportParams = new URLSearchParams({
        range: dateRange,
        limit: "10000", // Large limit to get all transactions
      });

      if (debouncedSearchTerm)
        exportParams.append("search", debouncedSearchTerm);
      if (typeFilter !== "all") exportParams.append("type", typeFilter);
      if (statusFilter !== "all") exportParams.append("status", statusFilter);
      if (startDate) exportParams.append("startDate", startDate);
      if (endDate) exportParams.append("endDate", endDate);

      const exportResponse = await fetch(
        `/api/admin-apis/transactions?${exportParams.toString()}`,
      );
      const exportData = await exportResponse.json();
      const exportTransactions = exportData.transactions || [];

      // Convert to CSV
      const headers = [
        "ID",
        "User ID",
        "User Email",
        "User Name",
        "Type",
        "Amount",
        "Fee",
        "Total",
        "Status",
        "Reference",
        "Description",
        "Phone",
        "Network",
        "Channel",
        "Created At",
      ];
      const csvData = exportTransactions.map((t: any) => [
        t.id,
        t.user_id || "",
        t.user_email || "",
        t.user_name || "",
        t.type,
        t.amount,
        t.fee || 0,
        t.total_deduction || t.amount,
        t.status,
        t.reference || "",
        t.description || "",
        t.phone_number || "",
        t.network || "",
        t.channel || "",
        isClient ? new Date(t.created_at).toLocaleString() : t.created_at,
      ]);

      const csvContent = [
        headers.join(","),
        ...csvData.map((row: any[]) =>
          row.map((field) => `"${field}"`).join(","),
        ),
      ].join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      Swal.fire({
        icon: "success",
        title: "Export Successful",
        text: `${exportTransactions.length} transactions exported to CSV`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to export transactions", "error");
    }
  };

  // ---------- View Transaction Details ----------
  const handleViewDetails = async (transaction: Transaction) => {
    let detailsHtml = `
      <div class="text-left space-y-3">
        <div class="grid grid-cols-2 gap-4">
          <div><strong>Transaction ID:</strong></div>
          <div class="font-mono text-sm">${transaction.id}</div>
          
          <div><strong>Reference:</strong></div>
          <div>${transaction.reference || "N/A"}</div>
          
          <div><strong>User ID:</strong></div>
          <div class="font-mono text-sm">${transaction.user_id || "N/A"}</div>
          
          ${
            transaction.user_email
              ? `
            <div><strong>User Email:</strong></div>
            <div>${transaction.user_email}</div>
          `
              : ""
          }
          
          ${
            transaction.user_name
              ? `
            <div><strong>User Name:</strong></div>
            <div>${transaction.user_name}</div>
          `
              : ""
          }
          
          <div><strong>Type:</strong></div>
          <div>${transaction.type}</div>
          
          <div><strong>Amount:</strong></div>
          <div class="font-semibold">₦${Number(
            transaction.amount,
          ).toLocaleString()}</div>
          
          <div><strong>Fee:</strong></div>
          <div>₦${Number(transaction.fee || 0).toLocaleString()}</div>
          
          <div><strong>Total:</strong></div>
          <div class="font-semibold">₦${Number(
            transaction.total_deduction || transaction.amount,
          ).toLocaleString()}</div>
          
          <div><strong>Status:</strong></div>
          <div>${transaction.status}</div>
          
          <div><strong>Created:</strong></div>
          <div>${
            isClient
              ? new Date(transaction.created_at).toLocaleString()
              : transaction.created_at
          }</div>
        </div>
    `;

    // Add additional fields if available
    if (transaction.description) {
      detailsHtml += `
        <div class="border-t pt-2">
          <div><strong>Description:</strong></div>
          <div>${transaction.description}</div>
        </div>
      `;
    }

    if (transaction.phone_number) {
      detailsHtml += `
        <div class="grid grid-cols-2 gap-4">
          <div><strong>Phone Number:</strong></div>
          <div>${transaction.phone_number}</div>
        </div>
      `;
    }

    if (transaction.network) {
      detailsHtml += `
        <div class="grid grid-cols-2 gap-4">
          <div><strong>Network:</strong></div>
          <div>${transaction.network}</div>
        </div>
      `;
    }

    if (transaction.channel) {
      detailsHtml += `
        <div class="grid grid-cols-2 gap-4">
          <div><strong>Channel:</strong></div>
          <div>${transaction.channel}</div>
        </div>
      `;
    }

    // Add fraud detection alerts
    const fraudAlerts = detectFraudAlerts(transaction);
    if (fraudAlerts.length > 0) {
      detailsHtml += `
        <div class="border-t pt-2">
          <div class="flex items-center space-x-2 text-red-600">
            <span class="font-semibold">⚠️ Fraud Alerts:</span>
          </div>
          <ul class="list-disc list-inside text-sm text-red-600 mt-1">
            ${fraudAlerts.map((alert) => `<li>${alert}</li>`).join("")}
          </ul>
        </div>
      `;
    }

    detailsHtml += `</div>`;

    await Swal.fire({
      title: `Transaction Details`,
      html: detailsHtml,
      width: 600,
      confirmButtonColor: "#3b82f6",
    });
  };

  // ---------- Fraud Detection ----------
  const detectFraudAlerts = (transaction: Transaction): string[] => {
    const alerts: string[] = [];
    const amount = Number(transaction.amount) || 0;

    // High amount alert
    if (amount > 1000000) {
      // 1 million Naira
      alerts.push(`High transaction amount: ₦${amount.toLocaleString()}`);
    }

    // Failed but high amount
    if (transaction.status === "failed" && amount > 500000) {
      alerts.push(`Failed high-value transaction: ₦${amount.toLocaleString()}`);
    }

    // Multiple rapid transactions (this would need additional context)
    if (transaction.type === "transfer" && amount > 200000) {
      alerts.push(`Large transfer transaction`);
    }

    // Unusual transaction type patterns
    const unusualTypes = ["reversal", "chargeback", "refund"];
    if (transaction.type && unusualTypes.includes(transaction.type)) {
      alerts.push(`Unusual transaction type: ${transaction.type}`);
    }

    return alerts;
  };

  // ---------- Retry Failed Transaction ----------
  const handleRetryTransaction = async (transaction: Transaction) => {
    if (transaction.status !== "failed") {
      Swal.fire("Info", "Only failed transactions can be retried", "info");
      return;
    }

    const result = await Swal.fire({
      title: "Retry Transaction?",
      text: `Retry this failed transaction (${transaction.reference})?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Retry",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      // This would call your transaction retry API
      const r = await fetch(
        `/api/admin-apis/transactions/${transaction.id}/retry`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (!r.ok) throw new Error("Retry failed");

      Swal.fire({
        icon: "success",
        title: "Retry Initiated",
        text: "Transaction retry has been initiated",
        timer: 2000,
        showConfirmButton: false,
      });
      mutate();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to retry transaction", "error");
    }
  };

  // Custom cell renderers with proper typing
  const renderReferenceCell = (value: string | null | undefined) => {
    if (!value)
      return <span className="text-gray-400 italic">No reference</span>;
    return <span className="font-mono text-sm">{value}</span>;
  };

  const renderUserIdCell = (
    value: string | null | undefined,
    row: Transaction,
  ) => {
    if (!value) return <span className="text-gray-400 italic">No user ID</span>;
    return (
      <button
        onClick={() => handleUserClick(value, row.user_email || undefined)}
        className="text-blue-600 hover:text-blue-800 underline font-medium text-left"
        title="View all transactions for this user"
      >
        {value.substring(0, 8)}...
      </button>
    );
  };

  const renderAmountCell = (
    value: number | string | null | undefined,
    row: Transaction,
  ) => {
    const amount = Number(value) || 0;
    const isPositive = [
      "deposit",
      "credit",
      "refund",
      "virtual_account_deposit",
    ].includes(row.type);
    const colorClass = isPositive ? "text-green-600" : "text-red-600";
    const symbol = isPositive ? "+" : "-";

    return (
      <span className={`font-semibold ${colorClass}`}>
        {symbol}₦{Math.abs(amount).toLocaleString()}
      </span>
    );
  };

  const renderStatusCell = (value: string | null | undefined) => {
    if (!value) return <span className="text-gray-400 italic">No status</span>;

    const statusConfig: Record<string, { color: string; text: string }> = {
      success: { color: "bg-green-100 text-green-800", text: "✓ Success" },
      failed: { color: "bg-red-100 text-red-800", text: "✗ Failed" },
      pending: { color: "bg-yellow-100 text-yellow-800", text: "⏳ Pending" },
      processing: { color: "bg-blue-100 text-blue-800", text: "🔄 Processing" },
    };

    const config = statusConfig[value] || {
      color: "bg-gray-100 text-gray-800",
      text: value,
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.text}
      </span>
    );
  };

  const renderTypeCell = (value: string | null | undefined) => {
    if (!value) return <span className="text-gray-400 italic">No type</span>;

    const typeConfig: Record<string, { color: string; emoji: string }> = {
      deposit: { color: "bg-green-100 text-green-800", emoji: "📥" },
      withdrawal: { color: "bg-red-100 text-red-800", emoji: "📤" },
      transfer: { color: "bg-blue-100 text-blue-800", emoji: "🔄" },
      airtime: { color: "bg-purple-100 text-purple-800", emoji: "📞" },
      electricity: { color: "bg-orange-100 text-orange-800", emoji: "💡" },
      data: { color: "bg-indigo-100 text-indigo-800", emoji: "📶" },
      cable: { color: "bg-pink-100 text-pink-800", emoji: "📺" },
      virtual_account_deposit: {
        color: "bg-teal-100 text-teal-800",
        emoji: "🏦",
      },
      debit: { color: "bg-rose-100 text-rose-800", emoji: "💸" },
      credit: { color: "bg-emerald-100 text-emerald-800", emoji: "💰" },
    };

    const config = typeConfig[value] || {
      color: "bg-gray-100 text-gray-800",
      emoji: "💳",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.emoji} {value}
      </span>
    );
  };

  const renderDateCell = (value: string | null | undefined) => {
    if (!value) return "-";

    if (!isClient) {
      return value;
    }

    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return value;

      const now = new Date();
      const hoursDiff = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      const formattedDate = date.toLocaleString();

      if (hoursDiff < 1) {
        return (
          <span className="text-green-600 font-medium">{formattedDate}</span>
        );
      } else if (hoursDiff < 24) {
        return <span className="text-blue-600">{formattedDate}</span>;
      } else {
        return <span className="text-gray-600">{formattedDate}</span>;
      }
    } catch (error) {
      return value;
    }
  };

  const renderFeeCell = (value: number | string | null | undefined) => {
    const fee = Number(value) || 0;
    if (fee === 0) return <span className="text-gray-400">₦0</span>;
    return (
      <span className="text-orange-600 font-medium">
        ₦{fee.toLocaleString()}
      </span>
    );
  };

  // Define columns with render functions
  const columns = [
    {
      key: "reference" as const,
      label: "Reference",
      render: renderReferenceCell,
    },
    {
      key: "user_id" as const,
      label: "User ID",
      render: renderUserIdCell,
    },
    {
      key: "user_email" as const,
      label: "User Email",
      render: (value: string | null | undefined) => value || "-",
    },
    {
      key: "type" as const,
      label: "Type",
      render: renderTypeCell,
    },
    {
      key: "amount" as const,
      label: "Amount",
      render: renderAmountCell,
    },
    {
      key: "fee" as const,
      label: "Fee",
      render: renderFeeCell,
    },
    {
      key: "status" as const,
      label: "Status",
      render: renderStatusCell,
    },
    {
      key: "description" as const,
      label: "Description",
      render: (value: string | null | undefined) => value || "-",
    },
    {
      key: "created_at" as const,
      label: "Created",
      render: renderDateCell,
    },
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

  if (error)
    return (
      <AdminLayout>
        <div className="p-6">
          <p className="text-red-600">Failed to load transactions ❌</p>
        </div>
      </AdminLayout>
    );

  if (!data)
    return (
      <AdminLayout>
        <div className="p-6">
          <p>No data available.</p>
        </div>
      </AdminLayout>
    );

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Transactions Management</h2>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleVerifyFees}>
              🔍 Verify Fees
            </Button>
            <Button variant="outline" onClick={handleExportCSV}>
              📊 Export CSV
            </Button>
            <Button variant="outline" onClick={() => mutate()}>
              🔄 Refresh
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Total Volume Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Total Volume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₦{totalAmount.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {apiStats?.total || 0} transactions
              </div>
              <div className="mt-2 space-y-1">
                {topTypesByCount.map(([type, count]) => (
                  <div key={type} className="flex justify-between text-xs">
                    <span className="text-gray-600">{type}:</span>
                    <span className="font-medium">{count} transactions</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Total Fees Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Total Fees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                ₦{totalFee.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Avg: ₦{avgFeePerTransaction.toFixed(2)} per transaction
              </div>
              {directFees?.grand_total_fee !== undefined && (
                <div className="mt-2">
                  <div className="text-xs text-green-600">
                    ✓ Direct calculation
                    {directFees?.difference_from_csv === 0 && " (Matches CSV)"}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Successful Transactions Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Successful
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {successfulTransactionsCount}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {successfulTransactionsCount > 0 &&
                  `${successRate.toFixed(1)}% success rate`}
              </div>
              <div className="mt-2">
                <Progress value={successRate} className="h-2" />
                <div className="text-xs text-gray-500 mt-1">
                  of {apiStats?.total || 0} total transactions
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Failed Transactions Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Failed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {failedTransactionsCount}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {failedTransactionsCount > 0 &&
                  `${failureRate.toFixed(1)}% failure rate`}
              </div>
              <div className="mt-2">
                <Progress value={failureRate} className="h-2 bg-red-100" />
                <div className="text-xs text-gray-500 mt-1">
                  of {apiStats?.total || 0} total transactions
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Pending Transactions Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#2b825b]">
                {pendingTransactionsCount}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {pendingTransactionsCount > 0 &&
                  `${pendingRate.toFixed(1)}% pending rate`}
              </div>
              <div className="mt-2">
                <Progress value={pendingRate} className="h-2 bg-yellow-100" />
                <div className="text-xs text-gray-500 mt-1">
                  of {apiStats?.total || 0} total transactions
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Average Transaction Size */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Avg Transaction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₦{avgTransactionAmount.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Average amount across all transactions
              </div>
              {directFees?.summary?.average_per_user && (
                <div className="mt-2 text-xs">
                  <span className="text-gray-600">Avg per user:</span>
                  <span className="font-medium ml-1">
                    ₦
                    {directFees.summary.average_per_user
                      .toFixed(2)
                      .toLocaleString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Payer */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Top Payer
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userFees.length > 0 ? (
                <>
                  <div className="text-lg font-bold truncate">
                    {userFees[0].user_id?.substring(0, 8)}...
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    ₦{userFees[0].total_fee.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {getUserTransactionCount(userFees[0])} transactions
                  </div>
                </>
              ) : (
                <div className="text-gray-400 italic">No fee data</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="md:col-span-2">
                <Input
                  placeholder="Search by reference, user ID, email, name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Search across references, user IDs, emails, and names
                </p>
              </div>
              <div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="deposit">Deposit</SelectItem>
                    <SelectItem value="withdrawal">Transfer</SelectItem>
                    <SelectItem value="airtime">Airtime</SelectItem>
                    <SelectItem value="electricity">Electricity</SelectItem>
                    <SelectItem value="data">Data</SelectItem>
                    <SelectItem value="cable">Cable TV</SelectItem>
                    <SelectItem value="virtual_account_deposit">
                      Virtual Deposit
                    </SelectItem>
                    <SelectItem value="debit">Debit</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="total">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSearchTerm("");
                    setTypeFilter("all");
                    setStatusFilter("all");
                    setDateRange("total");
                    setStartDate("");
                    setEndDate("");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>

            {/* Custom Date Range */}
            {dateRange === "custom" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Date
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To Date
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="text-sm text-gray-500">
          Showing {transactions.length} of {totalTransactions} transactions
          {debouncedSearchTerm && ` matching "${debouncedSearchTerm}"`}
          {typeFilter !== "all" && ` | Type: ${typeFilter}`}
          {statusFilter !== "all" && ` | Status: ${statusFilter}`}
          {dateRange !== "total" && ` | Date: ${dateRange}`}
          {` - Page ${currentPage} of ${totalPages}`}
        </div>

        {/* Table */}
        <Card>
          <CardContent className="pt-6">
            <AdminTable
              columns={columns}
              rows={transactions}
              onViewDetails={handleViewDetails}
              onRetryTransaction={handleRetryTransaction}
            />
          </CardContent>
        </Card>

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

                {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                  let pageNum;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (currentPage <= 4) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = currentPage - 3 + i;
                  }

                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href="#"
                        isActive={pageNum === currentPage}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

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
