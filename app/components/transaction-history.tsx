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
import { Card, CardContent, CardHeader } from "./ui/card";
import { Input } from "./ui/input";
import Loader from "./Loader";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

const statusConfig: any = {
  success: { color: "text-green-600", dotColor: "bg-green-500" },
  pending: { color: "text-blue-600", dotColor: "bg-blue-500" },
  failed: { color: "text-red-600", dotColor: "bg-red-500" },
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
  "transfer",
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

export default function TransactionHistory() {
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

    // Note: Search is already done server-side, but we keep this for extra safety
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
        // Append new transactions to the existing list
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
    
    // Refetch initial transactions
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

    // Validate date range
    const fromDate = new Date(statementDateRange.from);
    const toDate = new Date(statementDateRange.to);

    if (fromDate > toDate) {
      alert("From date cannot be later than To date");
      return;
    }

    setDownloadingStatement(true);

    try {
      // Step 1: Fetch ALL transactions from the database for the date range
      let allDateRangeTransactions: any[] = [];
      let page = 1;
      let hasMoreTransactions = true;

      while (hasMoreTransactions) {
        const params = new URLSearchParams({
          userId: userData.id,
          page: page.toString(),
          limit: "100", // Fetch in larger chunks for statements
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

      console.log(`Fetched ${allDateRangeTransactions.length} transactions for statement from ${statementDateRange.from} to ${statementDateRange.to}`);

      // Step 2: Prepare statement data with ALL fetched transactions
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

      // Step 3: Call API to generate statement PDF
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

      // Step 4: Download PDF
      const pdfBlob = await response.blob();
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;

      // Generate filename from dates
      const fromDateStr = statementDateRange.from.replace(/-/g, "");
      const toDateStr = statementDateRange.to.replace(/-/g, "");
      a.download = `bank-statement-${fromDateStr}-${toDateStr}.pdf`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setShowStatementModal(false);

      // Success notification
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

  // Function to determine if transaction amount should be negative
  const isOutflow = (transactionType: string) => {
    return outflowTypes.includes(transactionType?.toLowerCase());
  };

  // Function to get narration from transaction data
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

  // Function to handle viewing transaction details
  const handleViewTransaction = (transaction: any) => {
    router.push(`/dashboard/transactions/${transaction.id}`);
  };

  // Function to handle downloading receipt
  const handleDownloadReceipt = async (transaction: any) => {
    const transactionId = transaction.id;

    // Add to downloading set
    setDownloadingReceipts((prev) => new Set(prev).add(transactionId));

    const amountInfo = formatAmount(transaction);
    const narration = getNarration(transaction);

    // Extract transaction data based on transaction type
    const senderInfo = transaction.external_response?.data?.customer;
    const receiverInfo = transaction.external_response?.data?.transaction;
    const merchantInfo = transaction.external_response?.data?.merchant;

    // Determine if it's a withdrawal or deposit
    const isWithdrawal = transaction.type?.toLowerCase() === "withdrawal";
    const isVirtualAccountDeposit =
      transaction.type?.toLowerCase() === "virtual_account_deposit";

    // For withdrawals: sender is the platform, receiver is the customer
    // For deposits: sender is the customer, receiver is the platform
    let senderData, receiverData;

    if (isWithdrawal) {
      // Withdrawal: Platform sends money to customer
      senderData = {
        name: senderInfo?.senderName || "DIGITAL/Lohloh Abbalolo",
        accountNumber: senderInfo?.accountNumber || "N/A",
        bankName: senderInfo?.bankName || "N/A",
        bankCode: senderInfo?.bankCode || "N/A",
      };

      receiverData = {
        name: senderInfo?.recipientName || "N/A",
        accountNumber: senderInfo?.accountNumber || "N/A",
        bankName: senderInfo?.bankName || "N/A",
        accountType: "External Account",
      };
    } else if (isVirtualAccountDeposit) {
      // Virtual Account Deposit: Customer sends money to platform
      senderData = {
        name: senderInfo?.senderName || "N/A",
        accountNumber: senderInfo?.accountNumber || "N/A",
        bankName: senderInfo?.bankName || "N/A",
        bankCode: senderInfo?.bankCode || "N/A",
      };

      receiverData = {
        name: receiverInfo?.aliasAccountName || "DIGITAL/Lohloh Abbalolo",
        accountNumber: receiverInfo?.aliasAccountNumber || "N/A",
        accountType: receiverInfo?.aliasAccountType || "VIRTUAL",
        reference: receiverInfo?.aliasAccountReference || "N/A",
      };
    } else {
      // Other transaction types (fallback)
      senderData = {
        name: transaction?.sender?.name || senderInfo?.senderName || "N/A",
        accountNumber:
          transaction?.sender?.accountNumber ||
          senderInfo?.accountNumber ||
          "N/A",
        bankName:
          transaction?.sender?.bankName || senderInfo?.bankName || "N/A",
        bankCode: senderInfo?.bankCode || "N/A",
      };

      receiverData = {
        name:
          transaction?.receiver?.name ||
          receiverInfo?.aliasAccountName ||
          "N/A",
        accountNumber:
          transaction?.receiver?.accountNumber ||
          receiverInfo?.aliasAccountNumber ||
          "N/A",
        accountType: receiverInfo?.aliasAccountType || "N/A",
        reference: receiverInfo?.aliasAccountReference || "N/A",
      };
    }

    // Create receipt HTML content
    const receiptHTML = `
<!DOCTYPE html>
<html>
  <head>
    <title>Transaction Receipt - ${
      transaction.reference || transaction.id
    }</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 20px;
        background: white;
        color: #333;
      }
      .receipt-container {
        max-width: 500px;
        margin: 0 auto;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        padding: 20px;
        background: white;
      }
      .header {
        text-align: center;
        border-bottom: 2px solid #e5e7eb;
        padding-bottom: 16px;
        margin-bottom: 20px;
      }
      .header h1 {
        color: #111827;
        margin: 8px 0 4px 0;
        font-size: 24px;
      }
      .amount-section {
        text-align: center;
        margin: 20px 0;
      }
      .amount {
        font-size: 28px;
        font-weight: bold;
      }
      .section {
        margin: 20px 0;
      }
      .section-title {
        color: #374151;
        font-weight: 600;
        margin-bottom: 8px;
        font-size: 14px;
      }
      .details-card {
        background: #f9fafb;
        border-radius: 8px;
        padding: 16px;
      }
      .detail-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 14px;
      }
      .detail-label {
        color: #6b7280;
      }
      .detail-value {
        color: #111827;
        font-weight: 500;
      }
      .narration-section {
        background: #f0f9ff;
        border-left: 4px solid #0ea5e9;
        padding: 12px 16px;
        margin: 16px 0;
        border-radius: 4px;
      }
      .narration-text {
        font-style: italic;
        color: #0369a1;
        font-weight: 500;
      }
      .footer {
        text-align: center;
        border-top: 1px solid #e5e7eb;
        padding-top: 16px;
        margin-top: 20px;
        color: #6b7280;
        font-size: 12px;
      }
      @media (max-width: 640px) {
        body { padding: 10px; }
        .receipt-container { padding: 16px; }
        .amount { font-size: 24px; }
        .header h1 { font-size: 20px; }
        .detail-row { flex-direction: column; gap: 4px; }
        .detail-label, .detail-value { width: 100%; }
      }
    </style>
  </head>
  <body>
    <div class="receipt-container">
      <!-- Header -->
      <div class="header">
        <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:8px;">
          <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14,2 14,8 20,8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
          <h1>Transaction Receipt</h1>
        </div>
        <p style="color:#6b7280;margin:4px 0;font-size:14px;">
          Reference: ${transaction.reference || transaction.id}
        </p>
        <p style="color:#9ca3af;margin:0;font-size:12px;">
          ${new Date(transaction.created_at).toLocaleDateString()} • ${new Date(
      transaction.created_at
    ).toLocaleTimeString()}
        </p>
      </div>

      <!-- Amount -->
      <div class="amount-section">
        <div style="color:#6b7280;font-size:14px;margin-bottom:8px;">Transaction Amount</div>
        <div class="amount" style="color:${
          transaction.status?.toLowerCase() === "success"
            ? "#059669"
            : transaction.status?.toLowerCase() === "pending"
            ? "#2563eb"
            : "#dc2626"
        };">
          ${amountInfo.signedDisplay}
        </div>
        <div style="color:#6b7280;font-size:12px;margin-top:4px;">
          ${
            transaction.status?.toLowerCase() === "success"
              ? "Transaction Successful"
              : transaction.status?.toLowerCase() === "pending"
              ? "Transaction Pending"
              : "Transaction Failed"
          }
        </div>
      </div>

      <!-- Narration Section -->
      ${
        narration
          ? `<div class="narration-section">
              <div class="section-title">Transaction Narration</div>
              <div class="narration-text">"${narration}"</div>
            </div>`
          : ""
      }

      <!-- Transaction Details -->
      <div class="section">
        <div class="section-title">Transaction Details</div>
        <div class="details-card">
          <div class="detail-row">
            <span class="detail-label">Type</span>
            <span class="detail-value">${transaction.type || "N/A"}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Description</span>
            <span class="detail-value">${
              transaction.description || "N/A"
            }</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Status</span>
            <span class="detail-value" style="color:${
              transaction.status?.toLowerCase() === "success"
                ? "#059669"
                : transaction.status?.toLowerCase() === "pending"
                ? "#2563eb"
                : "#dc2626"
            }">${transaction.status}</span>
          </div>
          ${
            transaction.fee > 0
              ? `<div class="detail-row">
                  <span class="detail-label">Transaction Fee</span>
                  <span class="detail-value">₦${Number(
                    transaction.fee
                  ).toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                  })}</span>
                </div>`
              : ""
          }
          ${
            transaction.total_deduction > 0 &&
            transaction.total_deduction !== transaction.amount
              ? `<div class="detail-row">
                  <span class="detail-label">Total Deduction</span>
                  <span class="detail-value">₦${Number(
                    transaction.total_deduction
                  ).toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                  })}</span>
                </div>`
              : ""
          }
        </div>
      </div>

      <!-- Sender Information -->
      <div class="section">
        <div class="section-title">${
          isWithdrawal ? "From (Platform)" : "Sender Information"
        }</div>
        <div class="details-card">
          <div class="detail-row">
            <span class="detail-label">Name</span>
            <span class="detail-value">${senderData.name}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Account Number</span>
            <span class="detail-value">${senderData.accountNumber}</span>
          </div>
          ${
            senderData.bankName
              ? `<div class="detail-row">
                  <span class="detail-label">Bank Name</span>
                  <span class="detail-value">${senderData.bankName}</span>
                </div>`
              : ""
          }
          ${
            senderData.bankCode
              ? `<div class="detail-row">
                  <span class="detail-label">Bank Code</span>
                  <span class="detail-value">${senderData.bankCode}</span>
                </div>`
              : ""
          }
        </div>
      </div>

      <!-- Receiver Information -->
      <div class="section">
        <div class="section-title">${
          isWithdrawal ? "To (Recipient)" : "Receiver Information"
        }</div>
        <div class="details-card">
          <div class="detail-row">
            <span class="detail-label">${
              isWithdrawal ? "Recipient Name" : "Account Name"
            }</span>
            <span class="detail-value">${receiverData.name}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Account Number</span>
            <span class="detail-value">${receiverData.accountNumber}</span>
          </div>
         
          ${
            receiverData.bankName
              ? `<div class="detail-row">
                  <span class="detail-label">Bank Name</span>
                  <span class="detail-value">${receiverData.bankName}</span>
                </div>`
              : ""
          }
          ${
            receiverData.reference
              ? `<div class="detail-row">
                  <span class="detail-label">Reference</span>
                  <span class="detail-value">${receiverData.reference}</span>
                </div>`
              : ""
          }
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p>This is an automated receipt. Please keep it for your records.</p>
        <p style="margin-top:8px;">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  </body>
</html>
`;

    try {
      // Call your PDF generation API
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ html: receiptHTML }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      // Convert the response to a blob
      const pdfBlob = await response.blob();

      // Create download link for PDF
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transaction-receipt-${
        transaction.reference || transaction.id
      }.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      // Fallback to HTML download if PDF generation fails
      const blob = new Blob([receiptHTML], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transaction-receipt-${
        transaction.reference || transaction.id
      }.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert("PDF generation failed. Downloading as HTML instead.");
    } finally {
      // Remove from downloading set
      setDownloadingReceipts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(transactionId);
        return newSet;
      });
    }
  };

  // Function to format amount with proper sign
  const formatAmount = (transaction: any) => {
    const isOutflowTransaction = isOutflow(transaction.type);
    const amount = Number(transaction.amount);

    return {
      display: `₦${amount.toLocaleString("en-NG", {
        minimumFractionDigits: 2,
      })}`,
      signedDisplay: `${
        isOutflowTransaction ? "-" : "+"
      }₦${amount.toLocaleString("en-NG", {
        minimumFractionDigits: 2,
      })}`,
      isOutflow: isOutflowTransaction,
      rawAmount: amount,
    };
  };

  // Check if transaction is eligible for receipt (successful transactions)
  const isEligibleForReceipt = (transaction: any) => {
    return transaction.status?.toLowerCase() === "success";
  };

  // Check if receipt is currently being downloaded for a transaction
  const isDownloadingReceipt = (transactionId: string) => {
    return downloadingReceipts.has(transactionId);
  };

  // Get today's date in YYYY-MM-DD format
  const getToday = () => {
    return new Date().toISOString().split("T")[0];
  };

  // Get date 30 days ago in YYYY-MM-DD format
  const getLastMonth = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split("T")[0];
  };

  // Format date for display
  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return "Select date";
    const date = new Date(dateString);
    return format(date, "MMM dd, yyyy");
  };

  // Show page loader while loading
  if (pageLoading) {
    return <Loader />;
  }

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Transaction History
            {allTransactions.length > 0 && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({allTransactions.length} loaded)
              </span>
            )}
          </h2>

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
                  // Set default statement range to last 30 days
                  setStatementDateRange({
                    from: getLastMonth(),
                    to: getToday(),
                  });
                }}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span className=" xs:hidden">Statement</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">
                Filter Transactions
              </h3>
              <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                Reset All
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Status Filter */}
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

              {/* Duration Filter */}
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

              {/* Custom Date Range */}
              {durationFilter === "custom" && (
                <div>
                  <label className="text-sm font-medium mb-2 block text-gray-700">
                    Custom Date Range
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">
                        From
                      </label>
                      <input
                        type="date"
                        value={dateRange.from}
                        onChange={(e) =>
                          setDateRange({ ...dateRange, from: e.target.value })
                        }
                        className="w-full border rounded-md px-3 py-2 text-gray-700 bg-white"
                        max={dateRange.to || getToday()}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">
                        To
                      </label>
                      <input
                        type="date"
                        value={dateRange.to}
                        onChange={(e) =>
                          setDateRange({ ...dateRange, to: e.target.value })
                        }
                        className="w-full border rounded-md px-3 py-2 text-gray-700 bg-white"
                        min={dateRange.from}
                        max={getToday()}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Current Filter Summary */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
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

      <CardContent className="p-2 sm:p-4">
        {/* ✅ Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-[#C29307]" />
              <p className="text-gray-500">Loading transactions...</p>
            </div>
          </div>
        ) : durationFilteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-2">No transactions found.</p>
            {allTransactions.length === 0 ? (
              <p className="text-sm">No transactions have been loaded yet.</p>
            ) : (
              <p className="text-sm">
                Try changing your filters or search term.
                <br />
                Loaded transactions: {allTransactions.length}
              </p>
            )}
          </div>
        ) : (
          <>
            {/* Transaction List */}
            {durationFilteredTransactions.map((tx) => {
              const amountInfo = formatAmount(tx);
              const isDownloading = isDownloadingReceipt(tx.id);

              return (
                <div
                  key={tx.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors duration-150 mb-3 gap-3"
                >
                  {/* Transaction Info - Left Side */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-base sm:text-lg truncate">
                          {tx.description}

                          {tx?.fee > 0 && (
                            <span
                              className={`ml-2 text-sm font-medium ${
                                statusConfig[tx.status?.toLowerCase()]?.color ||
                                "text-gray-500"
                              }`}
                            >
                              • Fee: ₦
                              {Number(tx.fee).toLocaleString("en-NG", {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          )}
                        </h3>
                        <p className="text-gray-500 text-sm mt-1">
                          {new Date(tx.created_at).toLocaleDateString()} •{" "}
                          {new Date(tx.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        {tx.reference && (
                          <p className="text-gray-400 text-xs mt-1 truncate">
                            Ref: {tx.reference}
                          </p>
                        )}
                      </div>

                      {/* Amount and Status - Mobile Layout */}
                      <div className="sm:hidden flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              statusConfig[tx.status?.toLowerCase()]
                                ?.dotColor || "bg-gray-400"
                            }`}
                          />
                          <span
                            className={`text-sm font-medium ${
                              statusConfig[tx.status?.toLowerCase()]?.color ||
                              "text-gray-500"
                            }`}
                          >
                            {tx.status}
                          </span>
                        </div>
                        <p
                          className={`font-bold text-base ${
                            amountInfo.isOutflow
                              ? "text-red-500"
                              : "text-green-600"
                          }`}
                        >
                          {amountInfo.isOutflow ? "-" : "+"}
                          {amountInfo.display}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Side - Desktop Layout */}
                  <div className="flex sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    {/* Status and Amount - Desktop */}
                    <div className="hidden sm:flex sm:items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            statusConfig[tx.status?.toLowerCase()]?.dotColor ||
                            "bg-gray-400"
                          }`}
                        />
                        <span
                          className={`text-sm font-medium ${
                            statusConfig[tx.status?.toLowerCase()]?.color ||
                            "text-gray-500"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </div>

                      <div className="text-right">
                        <p
                          className={`font-bold text-lg ${
                            amountInfo.isOutflow
                              ? "text-red-500"
                              : "text-green-600"
                          }`}
                        >
                          {amountInfo.isOutflow ? "-" : "+"}
                          {amountInfo.display}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewTransaction(tx)}
                        className="flex items-center gap-2 flex-1 sm:flex-none justify-center"
                      >
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">View</span>
                      </Button>
                      {isEligibleForReceipt(tx) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadReceipt(tx)}
                          disabled={isDownloading}
                          className="flex items-center gap-2 flex-1 sm:flex-none justify-center"
                        >
                          {isDownloading ? (
                            <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                          ) : (
                            <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                          )}
                          <span className="hidden xs:inline">
                            {isDownloading ? "Downloading..." : "Download"}
                          </span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Load More Button */}
            {hasMore && durationFilteredTransactions.length > 0 && (
              <div className="text-center mt-6">
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
                <p className="text-gray-500 text-sm mt-2">
                  Showing {durationFilteredTransactions.length} transactions
                  {hasMore && " (More available)"}
                </p>
              </div>
            )}

            {/* No More Transactions Message */}
            {!hasMore && durationFilteredTransactions.length > 0 && (
              <div className="text-center mt-6 pt-6 border-t">
                <p className="text-gray-500">
                  You've reached the end of your transaction history
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  Total loaded: {allTransactions.length} transactions
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* Statement Download Modal */}
      {showStatementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Download Bank Statement
                </h3>
                <button
                  onClick={() => setShowStatementModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-gray-600 text-sm">
                  Select a date range to download your transaction statement as
                  PDF. The statement will include ALL transactions from the
                  database for the selected period.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block text-gray-700">
                      From Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="date"
                        value={statementDateRange.from}
                        onChange={(e) =>
                          setStatementDateRange((prev) => ({
                            ...prev,
                            from: e.target.value,
                          }))
                        }
                        className="w-full border rounded-md px-3 py-2 pl-10 text-gray-700 bg-white"
                        max={statementDateRange.to || getToday()}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block text-gray-700">
                      To Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="date"
                        value={statementDateRange.to}
                        onChange={(e) =>
                          setStatementDateRange((prev) => ({
                            ...prev,
                            to: e.target.value,
                          }))
                        }
                        className="w-full border rounded-md px-3 py-2 pl-10 text-gray-700 bg-white"
                        min={statementDateRange.from}
                        max={getToday()}
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Range Buttons */}
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
                  >
                    Last 3 months
                  </Button>
                </div>

                {statementDateRange.from && statementDateRange.to && (
                  <div className="p-3 bg-blue-50 rounded-md border border-blue-100">
                    <p className="text-sm text-blue-800">
                      Selected range:{" "}
                      {formatDateDisplay(statementDateRange.from)} to{" "}
                      {formatDateDisplay(statementDateRange.to)}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Statement will include ALL transactions from the database
                      within this period.
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <Button
                    onClick={handleDownloadStatement}
                    disabled={
                      !statementDateRange.from ||
                      !statementDateRange.to ||
                      downloadingStatement
                    }
                    className="w-full bg-[#C29307] hover:bg-[#b28a06]"
                  >
                    {downloadingStatement ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating Statement...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2 " />
                        Download Statement as PDF
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    This may take a moment for large date ranges
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}