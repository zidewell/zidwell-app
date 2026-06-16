"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  Search,
  Download,
  Eye,
  Loader2,
  Calendar,
  ChevronDown,
  Filter,
  X,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import Loader from "./Loader";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useIsMobile } from "../hooks/use-mobile";

const statusConfig: any = {
  success: {
    label: "Completed",
    className:
      "bg-(--color-accent-yellow)/20 text-(--color-accent-yellow) border-(--color-accent-yellow)/30 dark:bg-(--color-accent-yellow)/20 dark:text-(--color-accent-yellow) dark:border-(--color-accent-yellow)/30",
    dotColor: "bg-(--color-accent-yellow) dark:bg-(--color-accent-yellow)",
  },
  pending: {
    label: "Pending",
    className:
      "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
    dotColor: "bg-amber-500 dark:bg-amber-400",
  },
  failed: {
    label: "Failed",
    className:
      "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
    dotColor: "bg-red-500 dark:bg-red-400",
  },
  processing: {
    label: "Processing",
    className:
      "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
    dotColor: "bg-blue-500 dark:bg-blue-400",
  },
};

// Define transaction types that should show as positive amounts (incoming money)
const inflowTypes = [
  "deposit",
  "virtual_account_deposit",
  "card_deposit",
  "p2p_received",
  "p2p_credit",
  "referral",
  "referral_reward",
];

const outflowTypes = [
  "transfer",
  "withdrawal",
  "debit",
  "airtime",
  "data",
  "electricity",
  "cable",
  "p2p_transfer",
  "p2p_debit",
];

// Duration filter options
const durationOptions = [
  { label: "All time", value: "all" },
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "This week", value: "week" },
  { label: "Last week", value: "last_week" },
  { label: "This month", value: "month" },
  { label: "Last month", value: "last_month" },
  { label: "Last 3 months", value: "3months" },
  { label: "Last 6 months", value: "6months" },
  { label: "This year", value: "year" },
  { label: "Custom range", value: "custom" },
];

// Number of transactions to load per "Load More"
const TRANSACTIONS_PER_PAGE = 10;

// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
  const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
};

// Mobile Card Component
const MobileCard = ({
  tx,
  formatAmount,
  isEligibleForReceipt,
  isDownloadingReceipt,
  handleViewTransaction,
  handleDownloadReceipt,
}: any) => {
  const amountInfo = formatAmount(tx);
  const isDownloading = isDownloadingReceipt(tx.id);
  const config = statusConfig[tx.status?.toLowerCase()] || statusConfig.pending;

  const description =
    tx.narration ||
    tx.description ||
    tx.external_response?.data?.transaction?.narration ||
    tx.external_response?.withdrawal_details?.narration ||
    "Transaction";

  return (
    <div className="border-b border-(--border-color) dark:border-gray-700 p-4 last:border-0">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-medium text-(--text-primary) dark:text-gray-100">
            {description}
          </p>
          <p className="text-xs text-(--text-secondary) dark:text-gray-400">
            {new Date(tx.created_at).toLocaleDateString()}
          </p>
          {tx.reference && (
            <p className="text-xs text-(--text-secondary) dark:text-gray-400 mt-1">
              Ref: {tx.reference.substring(0, 8)}...
            </p>
          )}
        </div>
        <span
          className={`font-semibold ${amountInfo.isOutflow ? "text-red-600 dark:text-red-400" : "text-(--color-accent-yellow) dark:text-(--color-accent-yellow)"}`}
        >
          {amountInfo.signedDisplay}
        </span>
      </div>

      {tx.fee > 0 && (
        <p className="text-xs text-(--text-secondary) dark:text-gray-400 mb-2">
          Fee: ₦
          {Number(tx.fee).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
        </p>
      )}

      <div className="flex items-center justify-between">
        <StatusBadge status={tx.status} />
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewTransaction(tx)}
            className="h-8 px-2 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <Eye className="w-4 h-4" />
          </Button>
          {isEligibleForReceipt(tx) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDownloadReceipt(tx)}
              disabled={isDownloading}
              className="h-8 px-2 dark:text-gray-400 dark:hover:text-gray-300"
            >
              {isDownloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const formatCurrency = (amount: number) => {
  const formatted = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(Math.abs(amount));
  return formatted;
};

const getStatusMeta = (status: string) => {
  const s = (status || "pending").toLowerCase();
  if (s === "success") return { title: "Transfer Successful", message: "Your transaction has been completed successfully.", statusClass: "success", color: "#E5B333" };
  if (s === "pending") return { title: "Transfer Pending", message: "Your transaction is being processed.", statusClass: "pending", color: "#f5a524" };
  return { title: "Transfer Failed", message: "Transaction could not be completed.", statusClass: "failed", color: "#ff3b30" };
};

export default function TransactionHistory() {
  const isMobile = useIsMobile();
  const [filter, setFilter] = useState("All transactions");
  const [downloadingReceipts, setDownloadingReceipts] = useState<Set<string>>(
    new Set(),
  );
  const [pageLoading, setPageLoading] = useState(true);
  const [durationFilter, setDurationFilter] = useState("all");
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: "",
    to: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [downloadingStatement, setDownloadingStatement] = useState(false);
  const [statementDateRange, setStatementDateRange] = useState<{
    from: string;
    to: string;
  }>({ from: "", to: "" });
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [base64Logo, setBase64Logo] = useState<string>("");

  const router = useRouter();

  // Load logo as base64 for PDF generation
  const getBase64Logo = async (): Promise<string> => {
    try {
      const response = await fetch("/logo.png");
      if (!response.ok) throw new Error("Logo not found");
      const blob = await response.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error loading logo:", error);
      return "";
    }
  };

  // Pre-load logo when component mounts
  useEffect(() => {
    const loadLogo = async () => {
      const logo = await getBase64Logo();
      setBase64Logo(logo);
    };
    loadLogo();
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("userData");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserData(parsedUser);
      } catch (error) {
        console.error("Failed to parse user data from localStorage:", error);
      }
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!userData?.id) return;

    const fetchInitialTransactions = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          userId: userData.id,
          page: "1",
          limit: TRANSACTIONS_PER_PAGE.toString(),
        });

        const response = await fetch(
          `/api/bill-transactions?${params.toString()}`,
        );
        const data = await response.json();

        if (data.transactions && data.transactions.length > 0) {
          setAllTransactions(data.transactions);
          setHasMore(data.hasMore || false);
          setCurrentPage(1);
        } else {
          setAllTransactions([]);
          setHasMore(false);
        }
      } catch (error) {
        console.error("Error fetching transactions:", error);
        setAllTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialTransactions();
  }, [userData]);

  useEffect(() => {
    if (!userData?.id) return;

    const searchTimeout = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          userId: userData.id,
          page: "1",
          limit: TRANSACTIONS_PER_PAGE.toString(),
        });

        if (searchTerm) {
          params.set("search", searchTerm);
        }

        const response = await fetch(
          `/api/bill-transactions?${params.toString()}`,
        );
        const data = await response.json();

        if (data.transactions && data.transactions.length > 0) {
          setAllTransactions(data.transactions);
          setHasMore(data.hasMore || false);
          setCurrentPage(1);
        } else {
          setAllTransactions([]);
          setHasMore(false);
        }
      } catch (error) {
        console.error("Error searching transactions:", error);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(searchTimeout);
  }, [searchTerm, userData]);

  const applyDurationFilter = useCallback(
    (txs: any[]) => {
      if (durationFilter === "all") return txs;

      const now = new Date();
      let startDate: Date;

      switch (durationFilter) {
        case "today":
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case "yesterday":
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 1);
          startDate.setHours(0, 0, 0, 0);
          const yesterdayEnd = new Date(startDate);
          yesterdayEnd.setHours(23, 59, 59, 999);
          return txs.filter((tx) => {
            const txDate = new Date(tx.created_at);
            return txDate >= startDate && txDate <= yesterdayEnd;
          });
        case "week":
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case "last_week":
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 14);
          const lastWeekEnd = new Date(now);
          lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);
          lastWeekEnd.setHours(23, 59, 59, 999);
          return txs.filter((tx) => {
            const txDate = new Date(tx.created_at);
            return txDate >= startDate && txDate <= lastWeekEnd;
          });
        case "month":
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case "last_month":
          startDate = new Date(now);
          startDate.setMonth(startDate.getMonth() - 2);
          const lastMonthEnd = new Date(now);
          lastMonthEnd.setMonth(lastMonthEnd.getMonth() - 1);
          lastMonthEnd.setDate(0);
          lastMonthEnd.setHours(23, 59, 59, 999);
          return txs.filter((tx) => {
            const txDate = new Date(tx.created_at);
            return txDate >= startDate && txDate <= lastMonthEnd;
          });
        case "3months":
          startDate = new Date(now.setMonth(now.getMonth() - 3));
          break;
        case "6months":
          startDate = new Date(now.setMonth(now.getMonth() - 6));
          break;
        case "year":
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        case "custom":
          if (dateRange.from && dateRange.to) {
            const from = new Date(dateRange.from);
            from.setHours(0, 0, 0, 0);
            const to = new Date(dateRange.to);
            to.setHours(23, 59, 59, 999);
            return txs.filter((tx) => {
              const txDate = new Date(tx.created_at);
              return txDate >= from && txDate <= to;
            });
          }
          return txs;
        default:
          return txs;
      }

      const filtered = txs.filter((tx) => {
        const txDate = new Date(tx.created_at);
        return txDate >= startDate && txDate <= now;
      });

      return filtered;
    },
    [durationFilter, dateRange],
  );

  const filteredTransactions = allTransactions.filter((tx) => {
    const matchesFilter =
      filter === "All transactions" ||
      tx.status?.toLowerCase() === filter.toLowerCase();

    const description =
      tx.narration ||
      tx.description ||
      tx.external_response?.data?.transaction?.narration ||
      tx.external_response?.withdrawal_details?.narration ||
      "";

    const matchesSearch =
      searchTerm === "" ||
      description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.reference?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      tx.amount?.toString().includes(searchTerm);

    return matchesFilter && matchesSearch;
  });

  const durationFilteredTransactions =
    applyDurationFilter(filteredTransactions);

  const handleLoadMore = async () => {
    if (!hasMore || isLoadingMore || !userData?.id) return;

    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;

      const params = new URLSearchParams({
        userId: userData.id,
        page: nextPage.toString(),
        limit: TRANSACTIONS_PER_PAGE.toString(),
      });

      if (searchTerm) {
        params.set("search", searchTerm);
      }

      const response = await fetch(
        `/api/bill-transactions?${params.toString()}`,
      );
      const data = await response.json();

      if (data.transactions && data.transactions.length > 0) {
        setAllTransactions((prev) => [...prev, ...data.transactions]);
        setCurrentPage(nextPage);
        setHasMore(data.hasMore || false);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading more transactions:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleResetFilters = () => {
    setFilter("All transactions");
    setDurationFilter("all");
    setDateRange({ from: "", to: "" });
    setSearchTerm("");
    setCurrentPage(1);
    setShowFilters(false);

    if (userData?.id) {
      setLoading(true);
      fetch(
        `/api/bill-transactions?userId=${userData.id}&page=1&limit=${TRANSACTIONS_PER_PAGE}`,
      )
        .then((res) => res.json())
        .then((data) => {
          setAllTransactions(data.transactions || []);
          setHasMore(data.hasMore || false);
        })
        .catch((err) => console.error("Error resetting transactions:", err))
        .finally(() => setLoading(false));
    }
  };

  const handleDownloadStatement = async () => {
    if (!statementDateRange.from || !statementDateRange.to) {
      alert("Please select a date range for the statement");
      return;
    }

    if (!userData?.id) {
      alert("User data not found");
      return;
    }

    const fromDate = new Date(statementDateRange.from);
    const toDate = new Date(statementDateRange.to);

    if (fromDate > toDate) {
      alert("From date cannot be later than To date");
      return;
    }

    setDownloadingStatement(true);

    try {
      let allDateRangeTransactions: any[] = [];
      let page = 1;
      let hasMoreTransactions = true;

      while (hasMoreTransactions) {
        const params = new URLSearchParams({
          userId: userData.id,
          page: page.toString(),
          limit: "100",
          from: statementDateRange.from,
          to: statementDateRange.to,
        });

        const response = await fetch(
          `/api/bill-transactions?${params.toString()}`,
        );
        const data = await response.json();

        if (data.transactions && data.transactions.length > 0) {
          allDateRangeTransactions = [
            ...allDateRangeTransactions,
            ...data.transactions,
          ];
          hasMoreTransactions = data.hasMore || false;
          page++;
        } else {
          hasMoreTransactions = false;
        }
      }

      const statementData = {
        userId: userData.id,
        from: statementDateRange.from,
        to: statementDateRange.to,
        transactions: allDateRangeTransactions,
        user: {
          id: userData.id,
          name: `${userData.fullName} ${userData.lastName}` || "Account Holder",
          email: userData.email,
        },
      };

      const response = await fetch("/api/generate-statement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(statementData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", errorText);
        throw new Error(
          `Failed to generate statement: ${response.status} ${response.statusText}`,
        );
      }

      const pdfBlob = await response.blob();
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      const fromDateStr = statementDateRange.from.replace(/-/g, "");
      const toDateStr = statementDateRange.to.replace(/-/g, "");
      a.download = `bank-statement-${fromDateStr}-${toDateStr}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setShowStatementModal(false);

      const notification = document.createElement("div");
      notification.className =
        "fixed top-4 right-4 bg-(--color-accent-yellow) text-(--color-ink) px-4 py-2 rounded-lg shadow-lg z-50";
      notification.innerHTML = `
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span>Statement downloaded successfully! (${allDateRangeTransactions.length} transactions)</span>
        </div>
      `;
      document.body.appendChild(notification);

      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
    } catch (error: any) {
      console.error("Error downloading statement:", error);
      alert(
        `Error: ${error.message || "Failed to download statement. Please try again."}`,
      );
    } finally {
      setDownloadingStatement(false);
    }
  };

  const isOutflow = (transactionType: string) => {
    return outflowTypes.includes(transactionType?.toLowerCase());
  };

  const getDescription = (transaction: any) => {
    return (
      transaction.narration ||
      transaction.description ||
      transaction.external_response?.data?.transaction?.narration ||
      transaction.external_response?.withdrawal_details?.narration ||
      "Transaction"
    );
  };

  const handleViewTransaction = (transaction: any) => {
    router.push(`/dashboard/transactions/${transaction.id}`);
  };

  // Helper functions for sender/receiver data
  const getSenderName = (transaction: any) => {
    if (transaction.sender?.name) return transaction.sender.name;
    if (transaction.from_name) return transaction.from_name;
    if (transaction.external_response?.data?.sender?.name) return transaction.external_response.data.sender.name;
    if (transaction.external_response?.sender?.name) return transaction.external_response.sender.name;
    return null;
  };

  const getSenderEmail = (transaction: any) => {
    if (transaction.sender?.email) return transaction.sender.email;
    if (transaction.from_email) return transaction.from_email;
    if (transaction.external_response?.data?.customer?.senderEmail) return transaction.external_response.data.customer.senderEmail;
    if (transaction.external_response?.metadata?.sender_email) return transaction.external_response.metadata.sender_email;
    return null;
  };

  const getSenderAccount = (transaction: any) => {
    if (transaction.sender?.accountNumber) return transaction.sender.accountNumber;
    if (transaction.sender?.account_number) return transaction.sender.account_number;
    if (transaction.from_account) return transaction.from_account;
    if (transaction.external_response?.withdrawal_details?.account_number) return transaction.external_response.withdrawal_details.account_number;
    if (transaction.external_response?.data?.customer?.accountNumber) return transaction.external_response.data.customer.accountNumber;
    return null;
  };

  const getReceiverName = (transaction: any) => {
    if (transaction.receiver?.name) return transaction.receiver.name;
    if (transaction.to_name) return transaction.to_name;
    if (transaction.external_response?.data?.receiver?.name) return transaction.external_response.data.receiver.name;
    if (transaction.external_response?.receiver?.name) return transaction.external_response.receiver.name;
    return null;
  };

  const getReceiverEmail = (transaction: any) => {
    if (transaction.receiver?.email) return transaction.receiver.email;
    if (transaction.to_email) return transaction.to_email;
    if (transaction.external_response?.data?.customer?.recipientEmail) return transaction.external_response.data.customer.recipientEmail;
    if (transaction.external_response?.metadata?.recipient_email) return transaction.external_response.metadata.recipient_email;
    return null;
  };

  const getReceiverAccount = (transaction: any) => {
    if (transaction.receiver?.accountNumber) return transaction.receiver.accountNumber;
    if (transaction.receiver?.account_number) return transaction.receiver.account_number;
    if (transaction.to_account) return transaction.to_account;
    if (transaction.external_response?.receiver_details?.account_number) return transaction.external_response.receiver_details.account_number;
    if (transaction.external_response?.data?.transaction?.aliasAccountNumber) return transaction.external_response.data.transaction.aliasAccountNumber;
    return null;
  };

  const handleDownloadReceipt = async (transaction: any) => {
    const transactionId = transaction.id;
    setDownloadingReceipts((prev) => new Set(prev).add(transactionId));

    try {
      let logoBase64 = base64Logo;
      if (!logoBase64) {
        logoBase64 = await getBase64Logo();
      }

      const amountInfo = formatAmount(transaction);
      
      const getNarration = (tx: any) => {
        if (tx.narration) return tx.narration;
        if (tx.description) return tx.description;
        if (tx.external_response?.data?.transaction?.narration)
          return tx.external_response.data.transaction.narration;
        if (tx.external_response?.narration)
          return tx.external_response.narration;
        if (tx.external_response?.withdrawal_details?.narration)
          return tx.external_response.withdrawal_details.narration;
        return null;
      };

      const narration = getNarration(transaction);
      const statusMeta = getStatusMeta(transaction.status);
      const transactionIdDisplay = transaction.reference || transaction.merchant_tx_ref || transaction.id;
      
      const dateObj = new Date(transaction.created_at);
      const formattedDate = `${dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} • ${dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
      
      const senderName = getSenderName(transaction);
      const senderEmail = getSenderEmail(transaction);
      const senderAccount = getSenderAccount(transaction);
      
      const receiverName = getReceiverName(transaction);
      const receiverEmail = getReceiverEmail(transaction);
      const receiverAccount = getReceiverAccount(transaction);
      
      const feeAmount = transaction.fee || 0;

      const logoSrc = logoBase64 || "/logo.png";

      let statusIconSvg = '';
      if (statusMeta.statusClass === 'success') {
        statusIconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#E5B333" stroke="none"/>
          <path d="M8 12L11 15L16 9" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
      } else if (statusMeta.statusClass === 'pending') {
        statusIconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#f5a524" stroke="none"/>
          <circle cx="12" cy="12" r="3" fill="white"/>
          <path d="M12 8V12L14 14" stroke="white" stroke-width="2" stroke-linecap="round"/>
        </svg>`;
      } else {
        statusIconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#ff3b30" stroke="none"/>
          <path d="M15 9L9 15" stroke="white" stroke-width="2" stroke-linecap="round"/>
          <path d="M9 9L15 15" stroke="white" stroke-width="2" stroke-linecap="round"/>
        </svg>`;
      }

      function escapeHtml(str: string): string {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
          if (m === '&') return '&amp;';
          if (m === '<') return '&lt;';
          if (m === '>') return '&gt;';
          return m;
        }).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function(c) {
          return c;
        });
      }

      const receiptHTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Zidwell Receipt | ${transactionIdDisplay}</title>
<style>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Arial', 'Helvetica', sans-serif;
  }
  body {
    background: #101010;
    display: flex;
    justify-content: center;
    padding: 30px 20px;
  }
  .receipt {
    width: 550px;
    background: #fff;
    border: 2px solid ${statusMeta.color};
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
  }
  .header {
    height: 120px;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: flex-start;
  }
  .header::after {
    content: "";
    position: absolute;
    bottom: 0px;
    left: 50%;
    transform: translateX(-50%);
    width: 280px;
    height: 130px;
    background: #101010;
    border: 2px solid #E5B333;
    clip-path: polygon(0 0, 100% 0, 88% 100%, 12% 100%);
    border-radius: 0 0 240px 240px;
  }
  .logo {
    position: relative;
    z-index: 2;
  }
  .logo img {
    width: 130px;
  }
  .content {
    padding: 30px 40px 30px;
  }
  .status-icon {
    width: 48px;
    height: 48px;
    margin: 0 auto 20px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .status-icon svg {
    width: 48px;
    height: 48px;
  }
  .title {
    text-align: center;
  }
  .title h1 {
    font-size: 25px;
    margin-bottom: 10px;
  }
  .title p {
    color: #777;
  }
  .divider {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 20px 0;
  }
  .divider-line {
    flex: 1;
    height: 1px;
    background: #E5B333;
  }
  .dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #E5B333;
  }
  .amount {
    text-align: center;
  }
  .amount-label {
    color: #777;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .amount-value {
    font-size: 30px;
    font-weight: 700;
    margin-top: 10px;
  }
  .section-title {
    display: flex;
    align-items: center;
    gap: 15px;
    margin: 40px 0 25px;
  }
  .section-title .line {
    flex: 1;
    height: 1px;
    background: #E5B333;
  }
  .section-title span {
    color: #E5B333;
    font-weight: 600;
    text-transform: uppercase;
  }
  .detail-row {
    display: flex;
    justify-content: space-between;
    padding: 20px 0;
    border-bottom: 1px solid #f0e0a3;
  }
  .detail-row-last {
    border-bottom: none;
  }
  .left {
    display: flex;
    gap: 15px;
    align-items: center;
  }
  .icon {
    width: 42px;
    height: 42px;
    background: #101010;
    border-radius: 50%;
    color: #E5B333;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .detail-title {
    font-size: 15px;
    color: #444;
  }
  .detail-value {
    font-weight: 600;
    margin-top: 4px;
  }
  .sub {
    color: #777;
    font-size: 14px;
  }
  .right {
    font-weight: 600;
  }
  .footer {
    height: 50px;
    color: #fff;
    font-size:12px;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    background: #101010;
  }
  .footer::before {
    content: "";
    position: absolute;
    top: -40px;
    left: 0;
    width: 100%;
    height: 80px;
    background: #101010;
    border-top: 2px solid #E5B333;
    border-top-left-radius: 70%;
    border-top-right-radius: 70%;
  }
  .footer span {
    position: relative;
    z-index: 2;
  }
</style>
</head>
<body>

<div class="receipt">
  <div class="header">
    <div class="logo">
      <img src="${logoSrc}" alt="Zidwell Logo">
    </div>
  </div>

  <div class="content">
    <div class="status-icon">
      ${statusIconSvg}
    </div>

    <div class="title">
      <h1>${statusMeta.title}</h1>
      <p>${statusMeta.message}</p>
    </div>

    <div class="divider">
      <div class="divider-line"></div>
      <div class="dot"></div>
      <div class="dot"></div>
      <div class="dot"></div>
      <div class="divider-line"></div>
    </div>

    <div class="amount">
      <div class="amount-label">Amount</div>
      <div class="amount-value">${amountInfo.signedDisplay}</div>
    </div>

    <div class="section-title">
      <div class="line"></div>
      <span>Transaction Details</span>
      <div class="line"></div>
    </div>

    <div class="detail-row">
      <div class="left">
        <div class="icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <div>
          <div class="detail-title">Date & Time</div>
        </div>
      </div>
      <div class="right">${formattedDate}</div>
    </div>

    ${senderName ? `
    <div class="detail-row">
      <div class="left">
        <div class="icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="19" x2="12" y2="5"/>
            <polyline points="5 12 12 5 19 12"/>
          </svg>
        </div>
        <div>
          <div class="detail-title">From</div>
          <div class="detail-value">${escapeHtml(senderName)}</div>
          ${senderEmail ? `<div class="sub">${escapeHtml(senderEmail)}</div>` : ''}
        </div>
      </div>
      ${senderAccount ? `<div class="right">${escapeHtml(senderAccount)}</div>` : '<div class="right"></div>'}
    </div>
    ` : ''}

    ${receiverName ? `
    <div class="detail-row">
      <div class="left">
        <div class="icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <polyline points="19 12 12 19 5 12"/>
          </svg>
        </div>
        <div>
          <div class="detail-title">To</div>
          <div class="detail-value">${escapeHtml(receiverName)}</div>
          ${receiverEmail ? `<div class="sub">${escapeHtml(receiverEmail)}</div>` : ''}
        </div>
      </div>
      ${receiverAccount ? `<div class="right">${escapeHtml(receiverAccount)}</div>` : '<div class="right"></div>'}
    </div>
    ` : ''}

    ${narration ? `
    <div class="detail-row">
      <div class="left">
        <div class="icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <div>
          <div class="detail-title">Narration</div>
          <div class="detail-value" style="font-weight: 400; font-size: 14px;">${escapeHtml(narration)}</div>
        </div>
      </div>
    </div>
    ` : ''}

    ${feeAmount > 0 ? `
    <div class="detail-row">
      <div class="left">
        <div class="icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </div>
        <div>
          <div class="detail-title">Fee</div>
        </div>
      </div>
      <div class="right">₦${feeAmount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</div>
    </div>
    ` : ''}

    <div class="detail-row detail-row-last">
      <div class="left">
        <div class="icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </div>
        <div>
          <div class="detail-title">Transaction ID</div>
          <div class="detail-value">${escapeHtml(transactionIdDisplay)}</div>
        </div>
      </div>
    </div>
  </div>

  <div class="footer">
    <span>Thank you for using Zidwell.</span>
  </div>
</div>

</body>
</html>`;

      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: receiptHTML }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const pdfBlob = await response.blob();
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `zidwell-receipt-${transactionIdDisplay}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("PDF generation failed. Please try again.");
    } finally {
      setDownloadingReceipts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(transactionId);
        return newSet;
      });
    }
  };

  const formatAmount = (transaction: any) => {
    const isOutflowTransaction = isOutflow(transaction.type);
    const amount = Number(transaction.amount) || 0;

    return {
      display: formatCurrency(amount),
      signedDisplay: `${isOutflowTransaction ? "-" : "+"}${formatCurrency(amount)}`,
      isOutflow: isOutflowTransaction,
      rawAmount: amount,
    };
  };

  const isEligibleForReceipt = (transaction: any) => {
    return transaction.status?.toLowerCase() === "success";
  };

  const isDownloadingReceipt = (transactionId: string) => {
    return downloadingReceipts.has(transactionId);
  };

  const getToday = () => {
    return new Date().toISOString().split("T")[0];
  };

  const getLastMonth = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split("T")[0];
  };

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return "Select date";
    const date = new Date(dateString);
    return format(date, "MMM dd, yyyy");
  };

  if (pageLoading) {
    return <Loader />;
  }

  return (
    <Card className="w-full max-w-5xl mx-auto bg-(--bg-primary)">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-2xl font-bold text-(--text-primary)">
            Transaction History
            {allTransactions.length > 0 && (
              <span className="text-sm font-normal text-(--text-secondary) ml-2">
                ({allTransactions.length} loaded)
              </span>
            )}
          </CardTitle>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-(--text-secondary) w-4 h-4" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:ring-(--color-accent-yellow) focus:border-(--color-accent-yellow)"
                style={{ outline: "none", boxShadow: "none" }}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 border-(--border-color) text-(--text-primary) hover:bg-(--bg-secondary)"
              >
                <Filter className="w-4 h-4" />
                <span className="hidden xs:inline">Filters</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setShowStatementModal(true);
                  setStatementDateRange({
                    from: getLastMonth(),
                    to: getToday(),
                  });
                }}
                className="flex items-center gap-2 border-(--border-color) text-(--text-primary) hover:bg-(--bg-secondary)"
              >
                <Download className="w-4 h-4" />
                <span className="xs:hidden">Statement</span>
              </Button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 p-4 bg-(--bg-secondary) rounded-lg border border-(--border-color)">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-(--text-primary)">
                Filter Transactions
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-(--text-secondary) hover:text-(--text-primary)"
              >
                Reset All
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block text-(--text-primary)">
                  Status
                </label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full border border-(--border-color) rounded-md px-3 py-2 text-(--text-primary) bg-(--bg-primary) focus:ring-(--color-accent-yellow) focus:border-(--color-accent-yellow)"
                >
                  <option value="All transactions">All transactions</option>
                  <option value="success">Success</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block text-(--text-primary)">
                  Time Period
                </label>
                <select
                  value={durationFilter}
                  onChange={(e) => {
                    setDurationFilter(e.target.value);
                    if (e.target.value !== "custom") {
                      setDateRange({ from: "", to: "" });
                    }
                  }}
                  className="w-full border border-(--border-color) rounded-md px-3 py-2 text-(--text-primary) bg-(--bg-primary) focus:ring-(--color-accent-yellow) focus:border-(--color-accent-yellow)"
                >
                  {durationOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {durationFilter === "custom" && (
                <div>
                  <label className="text-sm font-medium mb-2 block text-(--text-primary)">
                    Custom Date Range
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-(--text-secondary) mb-1 block">
                        From
                      </label>
                      <input
                        type="date"
                        value={dateRange.from}
                        onChange={(e) =>
                          setDateRange({ ...dateRange, from: e.target.value })
                        }
                        className="w-full border border-(--border-color) rounded-md px-3 py-2 text-(--text-primary) bg-(--bg-primary) focus:ring-(--color-accent-yellow) focus:border-(--color-accent-yellow)"
                        max={dateRange.to || getToday()}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-(--text-secondary) mb-1 block">
                        To
                      </label>
                      <input
                        type="date"
                        value={dateRange.to}
                        onChange={(e) =>
                          setDateRange({ ...dateRange, to: e.target.value })
                        }
                        className="w-full border border-(--border-color) rounded-md px-3 py-2 text-(--text-primary) bg-(--bg-primary) focus:ring-(--color-accent-yellow) focus:border-(--color-accent-yellow)"
                        min={dateRange.from}
                        max={getToday()}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-(--border-color)">
              <p className="text-sm text-(--text-secondary)">
                Showing {durationFilteredTransactions.length} transactions
                {filter !== "All transactions" && ` with status: ${filter}`}
                {durationFilter !== "all" && (
                  <span>
                    {" "}
                    for{" "}
                    {durationOptions
                      .find((opt) => opt.value === durationFilter)
                      ?.label.toLowerCase()}
                  </span>
                )}
                {dateRange.from && dateRange.to && (
                  <span>
                    : {formatDateDisplay(dateRange.from)} to{" "}
                    {formatDateDisplay(dateRange.to)}
                  </span>
                )}
              </p>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-(--color-accent-yellow)" />
              <p className="text-(--text-secondary)">Loading transactions...</p>
            </div>
          </div>
        ) : durationFilteredTransactions.length === 0 ? (
          <div className="text-center py-12 text-(--text-secondary)">
            <p className="mb-2">No transactions found.</p>
            {allTransactions.length === 0 ? (
              <p className="text-sm">No transactions have been loaded yet.</p>
            ) : (
              <p className="text-sm">
                Try changing your filters or search term.
              </p>
            )}
          </div>
        ) : isMobile ? (
          <div>
            {durationFilteredTransactions.map((tx) => (
              <MobileCard
                key={tx.id}
                tx={tx}
                formatAmount={formatAmount}
                isEligibleForReceipt={isEligibleForReceipt}
                isDownloadingReceipt={isDownloadingReceipt}
                handleViewTransaction={handleViewTransaction}
                handleDownloadReceipt={handleDownloadReceipt}
              />
            ))}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="border-(--border-color)">
                  <TableHead className="text-(--text-secondary)">
                    Date
                  </TableHead>
                  <TableHead className="text-(--text-secondary)">
                    Description
                  </TableHead>
                  <TableHead className="text-right text-(--text-secondary)">
                    Amount
                  </TableHead>
                  <TableHead className="text-right text-(--text-secondary)">
                    Fee
                  </TableHead>
                  <TableHead className="text-center text-(--text-secondary)">
                    Status
                  </TableHead>
                  <TableHead className="text-right text-(--text-secondary)">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {durationFilteredTransactions.map((tx, i) => {
                  const amountInfo = formatAmount(tx);
                  const config =
                    statusConfig[tx.status?.toLowerCase()] ||
                    statusConfig.pending;
                  const isDownloading = isDownloadingReceipt(tx.id);
                  const description = getDescription(tx);

                  return (
                    <TableRow
                      key={tx.id}
                      className={`${i % 2 === 0 ? "bg-(--bg-secondary)/30" : ""} border-(--border-color)`}
                    >
                      <TableCell className="text-(--text-secondary)">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium text-(--text-primary)">
                        {description}
                        {tx.reference && (
                          <div className="text-xs text-(--text-secondary) mt-1">
                            Ref: {tx.reference}
                          </div>
                        )}
                      </TableCell>
                      <TableCell
                        className={`text-right font-semibold ${amountInfo.isOutflow ? "text-red-600 dark:text-red-400" : "text-(--color-accent-yellow)"}`}
                      >
                        {amountInfo.signedDisplay}
                      </TableCell>
                      <TableCell className="text-right text-(--text-secondary)">
                        {tx.fee > 0
                          ? `₦${Number(tx.fee).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge status={tx.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewTransaction(tx)}
                            className="h-8 px-2 text-(--text-secondary) hover:text-(--text-primary)"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {isEligibleForReceipt(tx) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadReceipt(tx)}
                              disabled={isDownloading}
                              className="h-8 px-2 text-(--text-secondary) hover:text-(--text-primary)"
                            >
                              {isDownloading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {hasMore && durationFilteredTransactions.length > 0 && (
              <div className="text-center py-6 border-t border-(--border-color)">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="px-8 border-(--border-color) text-(--text-primary) hover:bg-(--bg-secondary)"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading More...
                    </>
                  ) : (
                    <>
                      Load More Transactions
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            )}

            {!hasMore && durationFilteredTransactions.length > 0 && (
              <div className="text-center py-6 border-t border-(--border-color)">
                <p className="text-(--text-secondary) text-sm">
                  You've reached the end of your transaction history
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>

      {showStatementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-(--bg-primary) rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-(--border-color)">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-(--text-primary)">
                  Download Bank Statement
                </h3>
                <button
                  onClick={() => setShowStatementModal(false)}
                  className="text-(--text-secondary) hover:text-(--text-primary)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-(--text-secondary) text-sm">
                  Select a date range to download your transaction statement as
                  PDF.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block text-(--text-primary)">
                      From Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-(--text-secondary)" />
                      <input
                        type="date"
                        value={statementDateRange.from}
                        onChange={(e) =>
                          setStatementDateRange((prev) => ({
                            ...prev,
                            from: e.target.value,
                          }))
                        }
                        className="w-full border border-(--border-color) rounded-md px-3 py-2 pl-10 text-(--text-primary) bg-(--bg-primary) focus:ring-(--color-accent-yellow) focus:border-(--color-accent-yellow)"
                        max={statementDateRange.to || getToday()}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block text-(--text-primary)">
                      To Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-(--text-secondary)" />
                      <input
                        type="date"
                        value={statementDateRange.to}
                        onChange={(e) =>
                          setStatementDateRange((prev) => ({
                            ...prev,
                            to: e.target.value,
                          }))
                        }
                        className="w-full border border-(--border-color) rounded-md px-3 py-2 pl-10 text-(--text-primary) bg-(--bg-primary) focus:ring-(--color-accent-yellow) focus:border-(--color-accent-yellow)"
                        min={statementDateRange.from}
                        max={getToday()}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const to = getToday();
                      const fromDate = new Date();
                      fromDate.setDate(fromDate.getDate() - 7);
                      const from = fromDate.toISOString().split("T")[0];
                      setStatementDateRange({ from, to });
                    }}
                    className="border-(--border-color) text-(--text-primary) hover:bg-(--bg-secondary)"
                  >
                    Last 7 days
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const to = getToday();
                      const fromDate = new Date();
                      fromDate.setDate(fromDate.getDate() - 30);
                      const from = fromDate.toISOString().split("T")[0];
                      setStatementDateRange({ from, to });
                    }}
                    className="border-(--border-color) text-(--text-primary) hover:bg-(--bg-secondary)"
                  >
                    Last 30 days
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const to = getToday();
                      const fromDate = new Date();
                      fromDate.setMonth(fromDate.getMonth() - 3);
                      const from = fromDate.toISOString().split("T")[0];
                      setStatementDateRange({ from, to });
                    }}
                    className="border-(--border-color) text-(--text-primary) hover:bg-(--bg-secondary)"
                  >
                    Last 3 months
                  </Button>
                </div>

                <div className="pt-4 border-t border-(--border-color)">
                  <Button
                    onClick={handleDownloadStatement}
                    disabled={
                      !statementDateRange.from ||
                      !statementDateRange.to ||
                      downloadingStatement
                    }
                    className="w-full bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90"
                  >
                    {downloadingStatement ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating Statement...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Download Statement as PDF
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}