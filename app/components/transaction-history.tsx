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
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
    dotColor: "bg-emerald-500"
  },
  pending: { 
    label: "Pending", 
    className: "bg-amber-100 text-amber-800 border-amber-200",
    dotColor: "bg-amber-500"
  },
  failed: { 
    label: "Failed", 
    className: "bg-red-100 text-red-800 border-red-200",
    dotColor: "bg-red-500"
  },
};

// Define transaction types that should show as positive amounts (incoming money)
const inflowTypes = [
  "deposit",
  "virtual_account_deposit",
  "card_deposit",
  "p2p_received",
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
  return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
};

// Mobile Card Component
const MobileCard = ({ tx, formatAmount, isEligibleForReceipt, isDownloadingReceipt, handleViewTransaction, handleDownloadReceipt }: any) => {
  const amountInfo = formatAmount(tx);
  const isDownloading = isDownloadingReceipt(tx.id);
  const config = statusConfig[tx.status?.toLowerCase()] || statusConfig.pending;

  return (
    <div className="border-b border-border p-4 last:border-0">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-medium text-foreground">{tx.description}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(tx.created_at).toLocaleDateString()}
          </p>
        </div>
        <span className={`font-semibold ${amountInfo.isOutflow ? "text-red-600" : "text-emerald-600"}`}>
          {amountInfo.isOutflow ? "-" : "+"}{amountInfo.display}
        </span>
      </div>
      
      {tx.fee > 0 && (
        <p className="text-xs text-muted-foreground mb-2">
          Fee: ₦{Number(tx.fee).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
        </p>
      )}
      
      <div className="flex items-center justify-between">
        <StatusBadge status={tx.status} />
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewTransaction(tx)}
            className="h-8 px-2"
          >
            <Eye className="w-4 h-4" />
          </Button>
          {isEligibleForReceipt(tx) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDownloadReceipt(tx)}
              disabled={isDownloading}
              className="h-8 px-2"
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

export default function TransactionHistory() {
  const isMobile = useIsMobile();
  const [filter, setFilter] = useState("All transactions");
  const [downloadingReceipts, setDownloadingReceipts] = useState<Set<string>>(
    new Set()
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
  }>({
    from: "",
    to: "",
  });
  const [showStatementModal, setShowStatementModal] = useState(false);
  
  // Load More state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  
  // Local state for search and loading
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  const router = useRouter();

  // Get user data from localStorage on component mount
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

  // Fetch initial transactions when userData is available
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

        const response = await fetch(`/api/bill-transactions?${params.toString()}`);
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

  // Search effect - fetch transactions when search term changes
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

        const response = await fetch(`/api/bill-transactions?${params.toString()}`);
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
    }, 500); // Debounce search

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
    [durationFilter, dateRange]
  );

  // Apply status filter and search term (client-side filtering after fetch)
  const filteredTransactions = allTransactions.filter((tx) => {
    const matchesFilter =
      filter === "All transactions" ||
      tx.status?.toLowerCase() === filter.toLowerCase();

    const matchesSearch =
      searchTerm === "" ||
      tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.amount?.toString().includes(searchTerm);

    return matchesFilter && matchesSearch;
  });

  // Apply duration filter
  const durationFilteredTransactions = applyDurationFilter(filteredTransactions);

  // Function to handle Load More
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

      const response = await fetch(`/api/bill-transactions?${params.toString()}`);
      const data = await response.json();
      
      if (data.transactions && data.transactions.length > 0) {
        setAllTransactions(prev => [...prev, ...data.transactions]);
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

  // Function to reset filters
  const handleResetFilters = () => {
    setFilter("All transactions");
    setDurationFilter("all");
    setDateRange({ from: "", to: "" });
    setSearchTerm("");
    setCurrentPage(1);
    setShowFilters(false);
    
    if (userData?.id) {
      setLoading(true);
      fetch(`/api/bill-transactions?userId=${userData.id}&page=1&limit=${TRANSACTIONS_PER_PAGE}`)
        .then(res => res.json())
        .then(data => {
          setAllTransactions(data.transactions || []);
          setHasMore(data.hasMore || false);
        })
        .catch(err => console.error("Error resetting transactions:", err))
        .finally(() => setLoading(false));
    }
  };

  // Function to handle statement download
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

        const response = await fetch(`/api/bill-transactions?${params.toString()}`);
        const data = await response.json();
        
        if (data.transactions && data.transactions.length > 0) {
          allDateRangeTransactions = [...allDateRangeTransactions, ...data.transactions];
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
          name: `${userData.firstName} ${userData.lastName}` || "Account Holder",
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
          `Failed to generate statement: ${response.status} ${response.statusText}`
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
        "fixed top-4 right-4 bg-[#C29307] text-white px-4 py-2 rounded-lg shadow-lg z-50";
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
        `Error: ${
          error.message || "Failed to download statement. Please try again."
        }`
      );
    } finally {
      setDownloadingStatement(false);
    }
  };

  const isOutflow = (transactionType: string) => {
    return outflowTypes.includes(transactionType?.toLowerCase());
  };

  const getNarration = (transaction: any) => {
    if (transaction.external_response?.data?.transaction?.narration) {
      return transaction.external_response.data.transaction.narration;
    }
    if (transaction.narration) {
      return transaction.narration;
    }
    if (transaction.description) {
      return transaction.description;
    }
    return null;
  };

  const handleViewTransaction = (transaction: any) => {
    router.push(`/dashboard/transactions/${transaction.id}`);
  };

  const handleDownloadReceipt = async (transaction: any) => {
    const transactionId = transaction.id;
    setDownloadingReceipts((prev) => new Set(prev).add(transactionId));

    const amountInfo = formatAmount(transaction);
    const narration = getNarration(transaction);

    const senderInfo = transaction.external_response?.data?.customer;
    const receiverInfo = transaction.external_response?.data?.transaction;

    const isWithdrawal = transaction.type?.toLowerCase() === "withdrawal";
    const isVirtualAccountDeposit =
      transaction.type?.toLowerCase() === "virtual_account_deposit";

    let senderData, receiverData;

    if (isWithdrawal) {
      senderData = {
        name: senderInfo?.senderName || "DIGITAL/Lohloh Abbalolo",
        accountNumber: senderInfo?.accountNumber || "N/A",
        bankName: senderInfo?.bankName || "N/A",
      };
      receiverData = {
        name: senderInfo?.recipientName || "N/A",
        accountNumber: senderInfo?.accountNumber || "N/A",
        bankName: senderInfo?.bankName || "N/A",
      };
    } else if (isVirtualAccountDeposit) {
      senderData = {
        name: senderInfo?.senderName || "N/A",
        accountNumber: senderInfo?.accountNumber || "N/A",
        bankName: senderInfo?.bankName || "N/A",
      };
      receiverData = {
        name: receiverInfo?.aliasAccountName || "DIGITAL/Lohloh Abbalolo",
        accountNumber: receiverInfo?.aliasAccountNumber || "N/A",
        reference: receiverInfo?.aliasAccountReference || "N/A",
      };
    } else {
      senderData = {
        name: transaction?.sender?.name || senderInfo?.senderName || "N/A",
        accountNumber: transaction?.sender?.accountNumber || senderInfo?.accountNumber || "N/A",
        bankName: transaction?.sender?.bankName || senderInfo?.bankName || "N/A",
      };
      receiverData = {
        name: transaction?.receiver?.name || receiverInfo?.aliasAccountName || "N/A",
        accountNumber: transaction?.receiver?.accountNumber || receiverInfo?.aliasAccountNumber || "N/A",
        reference: receiverInfo?.aliasAccountReference || "N/A",
      };
    }

    const receiptHTML = `
<!DOCTYPE html>
<html>
  <head>
    <title>Transaction Receipt - ${transaction.reference || transaction.id}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: white; color: #333; }
      .receipt-container { max-width: 500px; margin: 0 auto; border: 2px solid #e5e7eb; border-radius: 12px; padding: 20px; background: white; }
      .header { text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 16px; margin-bottom: 20px; }
      .header h1 { color: #111827; margin: 8px 0 4px 0; font-size: 24px; }
      .amount-section { text-align: center; margin: 20px 0; }
      .amount { font-size: 28px; font-weight: bold; }
      .section { margin: 20px 0; }
      .section-title { color: #374151; font-weight: 600; margin-bottom: 8px; font-size: 14px; }
      .details-card { background: #f9fafb; border-radius: 8px; padding: 16px; }
      .detail-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
      .detail-label { color: #6b7280; }
      .detail-value { color: #111827; font-weight: 500; }
      .footer { text-align: center; border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 20px; color: #6b7280; font-size: 12px; }
    </style>
  </head>
  <body>
    <div class="receipt-container">
      <div class="header">
        <h1>Transaction Receipt</h1>
        <p style="color:#6b7280;margin:4px 0;font-size:14px;">Reference: ${transaction.reference || transaction.id}</p>
        <p style="color:#9ca3af;margin:0;font-size:12px;">${new Date(transaction.created_at).toLocaleDateString()} • ${new Date(transaction.created_at).toLocaleTimeString()}</p>
      </div>

      <div class="amount-section">
        <div style="color:#6b7280;font-size:14px;margin-bottom:8px;">Transaction Amount</div>
        <div class="amount" style="color:${transaction.status?.toLowerCase() === "success" ? "#059669" : transaction.status?.toLowerCase() === "pending" ? "#2563eb" : "#dc2626"};">
          ${amountInfo.signedDisplay}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Transaction Details</div>
        <div class="details-card">
          <div class="detail-row">
            <span class="detail-label">Description</span>
            <span class="detail-value">${transaction.description || "N/A"}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Status</span>
            <span class="detail-value" style="color:${transaction.status?.toLowerCase() === "success" ? "#059669" : transaction.status?.toLowerCase() === "pending" ? "#2563eb" : "#dc2626"}">${transaction.status}</span>
          </div>
          ${transaction.fee > 0 ? `<div class="detail-row"><span class="detail-label">Transaction Fee</span><span class="detail-value">₦${Number(transaction.fee).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span></div>` : ""}
        </div>
      </div>

      <div class="footer">
        <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  </body>
</html>
`;

    try {
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: receiptHTML }),
      });

      if (!response.ok) throw new Error("Failed to generate PDF");

      const pdfBlob = await response.blob();
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transaction-receipt-${transaction.reference || transaction.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      const blob = new Blob([receiptHTML], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transaction-receipt-${transaction.reference || transaction.id}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert("PDF generation failed. Downloading as HTML instead.");
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
    const amount = Number(transaction.amount);

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
    <Card className="w-full max-w-4xl mx-auto bg-white shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Transaction History
            {allTransactions.length > 0 && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({allTransactions.length} loaded)
              </span>
            )}
          </CardTitle>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                <span className="hidden xs:inline">Filters</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setShowStatementModal(true);
                  setStatementDateRange({ from: getLastMonth(), to: getToday() });
                }}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span className="xs:hidden">Statement</span>
              </Button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Filter Transactions</h3>
              <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                Reset All
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block text-gray-700">
                  Status
                </label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-gray-700 bg-white"
                >
                  <option value="All transactions">All transactions</option>
                  <option value="success">Success</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block text-gray-700">
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
                  className="w-full border rounded-md px-3 py-2 text-gray-700 bg-white"
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
                  <label className="text-sm font-medium mb-2 block text-gray-700">
                    Custom Date Range
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">From</label>
                      <input
                        type="date"
                        value={dateRange.from}
                        onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                        className="w-full border rounded-md px-3 py-2 text-gray-700 bg-white"
                        max={dateRange.to || getToday()}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">To</label>
                      <input
                        type="date"
                        value={dateRange.to}
                        onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                        className="w-full border rounded-md px-3 py-2 text-gray-700 bg-white"
                        min={dateRange.from}
                        max={getToday()}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing {durationFilteredTransactions.length} transactions
                {filter !== "All transactions" && ` with status: ${filter}`}
                {durationFilter !== "all" && (
                  <span> for {durationOptions.find((opt) => opt.value === durationFilter)?.label.toLowerCase()}</span>
                )}
                {dateRange.from && dateRange.to && (
                  <span>: {formatDateDisplay(dateRange.from)} to {formatDateDisplay(dateRange.to)}</span>
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
              <Loader2 className="w-8 h-8 animate-spin text-[#C29307]" />
              <p className="text-gray-500">Loading transactions...</p>
            </div>
          </div>
        ) : durationFilteredTransactions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="mb-2">No transactions found.</p>
            {allTransactions.length === 0 ? (
              <p className="text-sm">No transactions have been loaded yet.</p>
            ) : (
              <p className="text-sm">Try changing your filters or search term.</p>
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
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Fee</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {durationFilteredTransactions.map((tx, i) => {
                  const amountInfo = formatAmount(tx);
                  const config = statusConfig[tx.status?.toLowerCase()] || statusConfig.pending;
                  const isDownloading = isDownloadingReceipt(tx.id);

                  return (
                    <TableRow key={tx.id} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                      <TableCell className="text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        {tx.description}
                        {tx.reference && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Ref: {tx.reference}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${amountInfo.isOutflow ? "text-red-600" : "text-emerald-600"}`}>
                        {amountInfo.isOutflow ? "-" : "+"}{amountInfo.display}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {tx.fee > 0 ? `₦${Number(tx.fee).toLocaleString("en-NG", { minimumFractionDigits: 2 })}` : "—"}
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
                            className="h-8 px-2"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {isEligibleForReceipt(tx) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadReceipt(tx)}
                              disabled={isDownloading}
                              className="h-8 px-2"
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
              <div className="text-center py-6 border-t">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="px-8"
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
              <div className="text-center py-6 border-t">
                <p className="text-gray-500 text-sm">
                  You've reached the end of your transaction history
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>

      {showStatementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Download Bank Statement</h3>
                <button onClick={() => setShowStatementModal(false)} className="text-gray-400 hover:text-gray-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-gray-600 text-sm">
                  Select a date range to download your transaction statement as PDF.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block text-gray-700">From Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="date"
                        value={statementDateRange.from}
                        onChange={(e) => setStatementDateRange((prev) => ({ ...prev, from: e.target.value }))}
                        className="w-full border rounded-md px-3 py-2 pl-10 text-gray-700 bg-white"
                        max={statementDateRange.to || getToday()}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block text-gray-700">To Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="date"
                        value={statementDateRange.to}
                        onChange={(e) => setStatementDateRange((prev) => ({ ...prev, to: e.target.value }))}
                        className="w-full border rounded-md px-3 py-2 pl-10 text-gray-700 bg-white"
                        min={statementDateRange.from}
                        max={getToday()}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    const to = getToday();
                    const fromDate = new Date();
                    fromDate.setDate(fromDate.getDate() - 7);
                    const from = fromDate.toISOString().split("T")[0];
                    setStatementDateRange({ from, to });
                  }}>
                    Last 7 days
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    const to = getToday();
                    const fromDate = new Date();
                    fromDate.setDate(fromDate.getDate() - 30);
                    const from = fromDate.toISOString().split("T")[0];
                    setStatementDateRange({ from, to });
                  }}>
                    Last 30 days
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    const to = getToday();
                    const fromDate = new Date();
                    fromDate.setMonth(fromDate.getMonth() - 3);
                    const from = fromDate.toISOString().split("T")[0];
                    setStatementDateRange({ from, to });
                  }}>
                    Last 3 months
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <Button
                    onClick={handleDownloadStatement}
                    disabled={!statementDateRange.from || !statementDateRange.to || downloadingStatement}
                    className="w-full bg-[#C29307] hover:bg-[#b28a06]"
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