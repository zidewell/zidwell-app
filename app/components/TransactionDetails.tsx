"use client";
import { useParams, useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import {
  ArrowLeft,
  Download,
  Calendar,
  User,
  FileText,
  Building,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { useUserContextData } from "../context/userData";
import { useEffect, useState } from "react";
import Loader from "./Loader";
import DashboardSidebar from "./dashboard-sidebar";
import DashboardHeader from "./dashboard-hearder";

// Define transaction types that should show as positive amounts (incoming money)
const inflowTypes = [
  "deposit",
  "virtual_account_deposit",
  "card_deposit",
  "p2p_received",
  "referral",
  "referral_reward",
];

// Define transaction types that should show as negative amounts (outgoing money)
const outflowTypes = [
  "withdrawal",
  "debit",
  "airtime",
  "data",
  "electricity",
  "cable",
  "transfer",
  "p2p_transfer",
];

export default function TransactionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { userData } = useUserContextData();
  const [transaction, setTransaction] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactionDetails = async () => {
      if (!params.id || !userData?.id) return;

      setLoading(true);
      try {
        const transactionId = params.id;
        
        // Method 1: Search through pagination to find the transaction
        let foundTransaction: any = null;
        let page = 1;
        const limit = 50;
        let hasMore = true;

        while (hasMore && !foundTransaction) {
          const response = await fetch(
            `/api/bill-transactions?userId=${userData.id}&page=${page}&limit=${limit}`
          );
          
          if (!response.ok) {
            throw new Error(`Failed to fetch transactions: ${response.status}`);
          }

          const data = await response.json();
          
          if (data.transactions && Array.isArray(data.transactions)) {
            foundTransaction = data.transactions.find(
              (tx: any) => tx.id === transactionId
            );
          }

          hasMore = data.hasMore || false;
          page++;
          
          if (page > 10) {
            console.warn("Exceeded maximum page limit while searching for transaction");
            break;
          }
        }

        if (foundTransaction) {
          setTransaction(foundTransaction);
        } else {
          // Method 2: Try searching by reference
          const searchResponse = await fetch(
            `/api/bill-transactions?userId=${userData.id}&search=${transactionId}&page=1&limit=10`
          );
          
          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            if (searchData.transactions && searchData.transactions.length > 0) {
              const foundByReference = searchData.transactions.find(
                (tx: any) => tx.reference === transactionId || tx.merchant_tx_ref === transactionId
              );
              
              if (foundByReference) {
                setTransaction(foundByReference);
              } else {
                setTransaction(null);
              }
            } else {
              setTransaction(null);
            }
          } else {
            setTransaction(null);
          }
        }
        
      } catch (error) {
        console.error("Error fetching transaction details:", error);
        setTransaction(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactionDetails();
  }, [params.id, userData?.id]);

  // Function to determine if transaction amount should be negative
  const isOutflow = (transactionType: string) => {
    return outflowTypes.includes(transactionType?.toLowerCase());
  };

  // Function to format amount with proper sign - NOW USING EXACT AMOUNT (NOT INCLUDING FEE)
  const formatAmount = (transaction: any) => {
    if (!transaction) return { display: "₦0.00", isOutflow: false, rawAmount: 0, signedDisplay: "₦0.00" };
    
    const isOutflowTransaction = isOutflow(transaction.type);
    // Use the exact amount from the transaction, not total_deduction
    const amount = Number(transaction.amount) || 0;

    return {
      display: `₦${amount.toLocaleString("en-NG", {
        minimumFractionDigits: 2,
      })}`,
      isOutflow: isOutflowTransaction,
      rawAmount: amount,
      signedDisplay: `${
        isOutflowTransaction ? "-" : "+"
      }₦${amount.toLocaleString("en-NG", {
        minimumFractionDigits: 2,
      })}`,
    };
  };

  // Function to get narration from transaction data
  const getNarration = (transaction: any) => {
    if (!transaction) return null;
    
    if (transaction.narration) {
      return transaction.narration;
    }

    
    if (transaction.external_response?.data?.transaction?.narration) {
      return transaction.external_response.data.transaction.narration;
    }
    if (transaction.external_response?.narration) {
      return transaction.external_response.narration;
    }
 
    return null;
  };

  const handleDownloadReceipt = async () => {
    if (!transaction) return;

    setDownloading(true);

    const amountInfo = formatAmount(transaction);
    const narration = getNarration(transaction);

    // Extract sender and receiver with fallback to external_response
    const senderData = transaction.sender || {};
    const receiverData = transaction.receiver || {};
    const externalData = transaction.external_response || {};

    // Get sender info with fallback
    const displaySender = {
      name: senderData.name || 
            externalData?.withdrawal_details?.account_name || 
            externalData?.data?.customer?.senderName || 
            externalData?.metadata?.sender_name ||
            "N/A",
      accountNumber: senderData.accountNumber || 
                    externalData?.withdrawal_details?.account_number || 
                    externalData?.data?.customer?.accountNumber || 
                    "N/A",
      bankName: senderData.bankName || 
               externalData?.withdrawal_details?.bank_name || 
               externalData?.data?.customer?.bankName || 
               "N/A",
      bankCode: senderData.bankCode || 
               externalData?.withdrawal_details?.bank_code || 
               externalData?.data?.customer?.bankCode || 
               "N/A"
    };

    // Get receiver info with fallback
    const displayReceiver = {
      name: receiverData.name || 
            externalData?.receiver_details?.account_name || 
            externalData?.data?.customer?.recipientName || 
            externalData?.data?.transaction?.aliasAccountName ||
            externalData?.data?.meta?.recipientName ||
            "N/A",
      accountNumber: receiverData.accountNumber || 
                    externalData?.receiver_details?.account_number || 
                    externalData?.data?.customer?.accountNumber || 
                    externalData?.data?.transaction?.aliasAccountNumber ||
                    "N/A",
      bankName: receiverData.bankName || 
               externalData?.receiver_details?.bank_name || 
               externalData?.data?.customer?.bankName || 
               "N/A",
      bankCode: receiverData.bankCode || 
               externalData?.receiver_details?.bank_code || 
               externalData?.data?.customer?.bankCode || 
               "N/A"
    };

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
            ${new Date(
              transaction.created_at
            ).toLocaleDateString()} • ${new Date(
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
          <div class="section-title">Sender Information</div>
          <div class="details-card">
            <div class="detail-row">
              <span class="detail-label">Name</span>
              <span class="detail-value">${displaySender.name}</span>
            </div>
            ${
              displaySender.accountNumber && displaySender.accountNumber !== "N/A"
                ? `<div class="detail-row">
                    <span class="detail-label">Account Number</span>
                    <span class="detail-value">${displaySender.accountNumber}</span>
                  </div>`
                : ""
            }
            ${
              displaySender.bankName && displaySender.bankName !== "N/A"
                ? `<div class="detail-row">
                    <span class="detail-label">Bank Name</span>
                    <span class="detail-value">${displaySender.bankName}</span>
                  </div>`
                : ""
            }
          </div>
        </div>

        <!-- Receiver Information -->
        <div class="section">
          <div class="section-title">Receiver Information</div>
          <div class="details-card">
            <div class="detail-row">
              <span class="detail-label">Name</span>
              <span class="detail-value">${displayReceiver.name}</span>
            </div>
            ${
              displayReceiver.accountNumber && displayReceiver.accountNumber !== "N/A"
                ? `<div class="detail-row">
                    <span class="detail-label">Account Number</span>
                    <span class="detail-value">${displayReceiver.accountNumber}</span>
                  </div>`
                : ""
            }
            ${
              displayReceiver.bankName && displayReceiver.bankName !== "N/A"
                ? `<div class="detail-row">
                    <span class="detail-label">Bank Name</span>
                    <span class="detail-value">${displayReceiver.bankName}</span>
                  </div>`
                : ""
            }
            ${
              displayReceiver.bankCode && displayReceiver.bankCode !== "N/A"
                ? `<div class="detail-row">
                    <span class="detail-label">Bank Code</span>
                    <span class="detail-value">${displayReceiver.bankCode}</span>
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

      const pdfBlob = await response.blob();
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
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <DashboardSidebar />
        <div className="lg:ml-64">
          <DashboardHeader />
          <main className="p-4 sm:p-5">
            <div className="max-w-4xl mx-auto">
              <div className="text-center py-8 sm:py-12">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Transaction Not Found
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  The transaction with ID "{params.id}" could not be found.
                </p>
                <Button 
                  onClick={() => router.back()}
                  className="bg-[#2b825b] hover:bg-[#236b49] dark:bg-[#2b825b] dark:hover:bg-[#1e5f43]"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Transactions
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const amountInfo = formatAmount(transaction);
  const narration = getNarration(transaction);

  // Extract sender and receiver with fallback to external_response
  const senderData = transaction.sender || {};
  const receiverData = transaction.receiver || {};
  const externalData = transaction.external_response || {};

  // Get sender info with fallback
  const displaySender = {
    name: senderData.name || 
          externalData?.withdrawal_details?.account_name || 
          externalData?.data?.customer?.senderName || 
          externalData?.metadata?.sender_name ||
          "N/A",
    accountNumber: senderData.accountNumber || 
                  externalData?.withdrawal_details?.account_number || 
                  externalData?.data?.customer?.accountNumber || 
                  "N/A",
    bankName: senderData.bankName || 
             externalData?.withdrawal_details?.bank_name || 
             externalData?.data?.customer?.bankName || 
             "N/A",
    bankCode: senderData.bankCode || 
             externalData?.withdrawal_details?.bank_code || 
             externalData?.data?.customer?.bankCode || 
             "N/A"
  };

  // Get receiver info with fallback
  const displayReceiver = {
    name: receiverData.name || 
          externalData?.receiver_details?.account_name || 
          externalData?.data?.customer?.recipientName || 
          externalData?.data?.transaction?.aliasAccountName ||
          externalData?.data?.meta?.recipientName ||
          "N/A",
    accountNumber: receiverData.accountNumber || 
                  externalData?.receiver_details?.account_number || 
                  externalData?.data?.customer?.accountNumber || 
                  externalData?.data?.transaction?.aliasAccountNumber ||
                  "N/A",
    bankName: receiverData.bankName || 
             externalData?.receiver_details?.bank_name || 
             externalData?.data?.customer?.bankName || 
             "N/A",
    bankCode: receiverData.bankCode || 
             externalData?.receiver_details?.bank_code || 
             externalData?.data?.customer?.bankCode || 
             "N/A"
  };

  const isWithdrawal = transaction.type?.toLowerCase() === "withdrawal";


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardSidebar />

      <div className="lg:ml-64">
        <DashboardHeader />

        <main className="p-4 sm:p-5">
          <div className="max-w-6xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="text-[#2b825b] hover:bg-white/10 dark:text-[#3aa873] dark:hover:bg-gray-800 text-sm md:text-base"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  <span className="hidden md:block">Back</span>
                </Button>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 truncate">
                    Transaction Details
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                    View complete transaction information
                  </p>
                </div>
              </div>

              {transaction.status?.toLowerCase() === "success" && (
                <Button
                  onClick={handleDownloadReceipt}
                  disabled={downloading}
                  className="flex items-center gap-2 bg-[#2b825b] text-white hover:bg-[#236b49] dark:bg-[#2b825b] dark:hover:bg-[#1e5f43] w-full sm:w-auto justify-center"
                >
                  {downloading ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>
                    {downloading ? "Downloading..." : "Download Receipt"}
                  </span>
                </Button>
              )}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Left Column */}
              <div className="space-y-4 sm:space-y-6">
                {/* Amount Card */}
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader className="pb-3">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                      Amount
                    </h2>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div
                        className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${
                          amountInfo.isOutflow
                            ? "text-red-500 dark:text-red-400"
                            : "text-green-600 dark:text-green-400"
                        }`}
                      >
                        {amountInfo.signedDisplay}
                      </div>

                      <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm sm:text-base capitalize">
                        {transaction.status?.toLowerCase() === "success"
                          ? "Transaction Successful"
                          : transaction.status?.toLowerCase() === "pending"
                          ? "Transaction Pending"
                          : "Transaction Failed"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Narration Card */}
                {narration && (
                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader className="flex flex-row items-center gap-2 pb-3">
                      <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                        Transaction Narration
                      </h2>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-900/20 dark:border-blue-800">
                        <p className="text-blue-800 dark:text-blue-400 italic text-sm sm:text-base">
                          "{narration}"
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Sender Information */}
                {(displaySender.name !== "N/A" || displaySender.accountNumber !== "N/A") && (
                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader className="flex flex-row items-center gap-2 pb-3">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                        {isWithdrawal ? "From (Zidwell)" : "Sender Information"}
                      </h2>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-row justify-between gap-1 xs:gap-2">
                        <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                          Name
                        </span>
                        <span className="font-medium text-sm sm:text-base text-right xs:text-left break-all text-gray-900 dark:text-gray-100">
                          {displaySender.name}
                        </span>
                      </div>
                      {displaySender.accountNumber && displaySender.accountNumber !== "N/A" && (
                        <div className="flex flex-row justify-between gap-1 xs:gap-2">
                          <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                            Account Number
                          </span>
                          <span className="font-medium text-sm sm:text-base text-right xs:text-left break-all text-gray-900 dark:text-gray-100">
                            {displaySender.accountNumber}
                          </span>
                        </div>
                      )}
                      {displaySender.bankName && displaySender.bankName !== "N/A" && (
                        <div className="flex flex-row justify-between gap-1 xs:gap-2">
                          <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                            Bank Name
                          </span>
                          <span className="font-medium text-sm sm:text-base text-right xs:text-left break-all text-gray-900 dark:text-gray-100">
                            {displaySender.bankName}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Receiver Information */}
                {(displayReceiver.name !== "N/A" || displayReceiver.accountNumber !== "N/A") && (
                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader className="flex flex-row items-center gap-2 pb-3">
                      <Building className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                        {isWithdrawal ? "To (Recipient)" : "Receiver Information"}
                      </h2>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-row justify-between gap-1 xs:gap-2">
                        <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                          {isWithdrawal ? "Recipient Name" : "Account Name"}
                        </span>
                        <span className="font-medium text-sm sm:text-base text-right xs:text-left break-all text-gray-900 dark:text-gray-100">
                          {displayReceiver.name}
                        </span>
                      </div>
                      {displayReceiver.accountNumber && displayReceiver.accountNumber !== "N/A" && (
                        <div className="flex flex-row justify-between gap-1 xs:gap-2">
                          <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                            Account Number
                          </span>
                          <span className="font-medium text-sm sm:text-base text-right xs:text-left break-all text-gray-900 dark:text-gray-100">
                            {displayReceiver.accountNumber}
                          </span>
                        </div>
                      )}
                      {displayReceiver.bankName && displayReceiver.bankName !== "N/A" && (
                        <div className="flex flex-row justify-between gap-1 xs:gap-2">
                          <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                            Bank Name
                          </span>
                          <span className="font-medium text-sm sm:text-base text-right xs:text-left break-all text-gray-900 dark:text-gray-100">
                            {displayReceiver.bankName}
                          </span>
                        </div>
                      )}
                      {displayReceiver.bankCode && displayReceiver.bankCode !== "N/A" && (
                        <div className="flex flex-row justify-between gap-1 xs:gap-2">
                          <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                            Bank Code
                          </span>
                          <span className="font-medium text-sm sm:text-base text-right xs:text-left break-all text-gray-900 dark:text-gray-100">
                            {displayReceiver.bankCode}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-4 sm:space-y-6">
                {/* Transaction Details */}
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader className="flex flex-row items-center gap-2 pb-3">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                      Transaction Details
                    </h2>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-col xs:flex-row xs:justify-between gap-1 xs:gap-2">
                      <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                        Type
                      </span>
                      <span className="font-medium text-sm sm:text-base text-right xs:text-left capitalize text-gray-900 dark:text-gray-100">
                        {transaction.type || "N/A"}
                      </span>
                    </div>
                    <div className="flex flex-col xs:flex-row xs:justify-between gap-1 xs:gap-2">
                      <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                        Description
                      </span>
                      <span className="font-medium text-sm sm:text-base text-right xs:text-left break-all text-gray-900 dark:text-gray-100">
                        {transaction.description || "N/A"}
                      </span>
                    </div>
                    <div className="flex flex-col xs:flex-row xs:justify-between gap-1 xs:gap-2">
                      <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                        Reference
                      </span>
                      <span className="font-medium text-sm sm:text-base text-right xs:text-left break-all text-gray-900 dark:text-gray-100">
                        {transaction.reference || transaction.merchant_tx_ref || transaction.id}
                      </span>
                    </div>
                    <div className="flex flex-col xs:flex-row xs:justify-between gap-1 xs:gap-2">
                      <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                        Status
                      </span>
                      <span
                        className={`font-medium text-sm sm:text-base text-right xs:text-left capitalize ${
                          transaction.status?.toLowerCase() === "success"
                            ? "text-green-600 dark:text-green-400"
                            : transaction.status?.toLowerCase() === "pending"
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {transaction.status}
                      </span>
                    </div>

                    {transaction.fee > 0 && (
                      <div className="flex items-center justify-between gap-1 xs:gap-2">
                        <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                          Transaction Fee
                        </span>
                        <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                          ₦
                          {Number(transaction.fee).toLocaleString("en-NG", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    )}

                    {transaction.total_deduction > 0 &&
                    transaction.total_deduction !== transaction.amount ? (
                      <div className="flex items-center justify-between gap-1 xs:gap-2">
                        <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                          Total Deduction
                        </span>
                        <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                          ₦
                          {Number(transaction.total_deduction).toLocaleString(
                            "en-NG",
                            {
                              minimumFractionDigits: 2,
                            }
                          )}
                        </span>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>

                {/* Date & Time */}
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader className="flex flex-row items-center gap-2 pb-3">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                      Date & Time
                    </h2>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-col xs:flex-row xs:justify-between gap-1 xs:gap-2">
                      <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                        Date
                      </span>
                      <span className="font-medium text-sm sm:text-base text-right xs:text-left text-gray-900 dark:text-gray-100">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex flex-col xs:flex-row xs:justify-between gap-1 xs:gap-2">
                      <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                        Time
                      </span>
                      <span className="font-medium text-sm sm:text-base text-right xs:text-left text-gray-900 dark:text-gray-100">
                        {new Date(transaction.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex flex-col xs:flex-row xs:justify-between gap-1 xs:gap-2">
                      <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                        Full Date
                      </span>
                      <span className="font-medium text-sm sm:text-base text-right xs:text-left text-gray-900 dark:text-gray-100">
                        {new Date(transaction.created_at).toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}