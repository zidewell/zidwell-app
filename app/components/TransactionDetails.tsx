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
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { useUserContextData } from "../context/userData";
import { useEffect, useState } from "react";
import Loader from "./Loader";
import DashboardSidebar from "@/app/components/dashboard-component/DashboardSidebar";
import DashboardHeader from "@/app/components/dashboard-component/DashboardHeader";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [base64Logo, setBase64Logo] = useState<string>("");

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
    const fetchTransactionDetails = async () => {
      if (!params.id || !userData?.id) return;

      setLoading(true);
      try {
        const transactionId = params.id;

        let foundTransaction: any = null;
        let page = 1;
        const limit = 50;
        let hasMore = true;

        while (hasMore && !foundTransaction) {
          const response = await fetch(
            `/api/bill-transactions?userId=${userData.id}&page=${page}&limit=${limit}`,
          );

          if (!response.ok) {
            throw new Error(`Failed to fetch transactions: ${response.status}`);
          }

          const data = await response.json();

          if (data.transactions && Array.isArray(data.transactions)) {
            foundTransaction = data.transactions.find(
              (tx: any) => tx.id === transactionId,
            );
          }

          hasMore = data.hasMore || false;
          page++;

          if (page > 10) {
            console.warn(
              "Exceeded maximum page limit while searching for transaction",
            );
            break;
          }
        }

        if (foundTransaction) {
          setTransaction(foundTransaction);
        } else {
          const searchResponse = await fetch(
            `/api/bill-transactions?userId=${userData.id}&search=${transactionId}&page=1&limit=10`,
          );

          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            if (searchData.transactions && searchData.transactions.length > 0) {
              const foundByReference = searchData.transactions.find(
                (tx: any) =>
                  tx.reference === transactionId ||
                  tx.merchant_tx_ref === transactionId,
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

  const isOutflow = (transactionType: string) => {
    return outflowTypes.includes(transactionType?.toLowerCase());
  };

  const formatAmount = (transaction: any) => {
    if (!transaction)
      return {
        display: "₦0.00",
        isOutflow: false,
        rawAmount: 0,
      };

    const isOutflowTransaction = isOutflow(transaction.type);
    const amount = Number(transaction.amount) || 0;

    return {
      display: `₦${amount.toLocaleString("en-NG", {
        minimumFractionDigits: 2,
      })}`,
      isOutflow: isOutflowTransaction,
      rawAmount: amount,
    };
  };

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

  const getStatusMeta = (status: string) => {
    const s = (status || "pending").toLowerCase();
    if (s === "success") return { title: "Transfer Successful", message: "Your transaction has been completed successfully.", statusClass: "success", color: "#E5B333" };
    if (s === "pending") return { title: "Transfer Pending", message: "Your transaction is being processed.", statusClass: "pending", color: "#f5a524" };
    return { title: "Transfer Failed", message: "Transaction could not be completed.", statusClass: "failed", color: "#ff3b30" };
  };

  // Helper function to get real sender email and account number
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

  const handleDownloadReceipt = async () => {
    if (!transaction) return;

    setDownloading(true);

    try {
      // Get logo as base64
      let logoBase64 = base64Logo;
      if (!logoBase64) {
        logoBase64 = await getBase64Logo();
      }

      const amountInfo = formatAmount(transaction);
      const narration = getNarration(transaction);
      const statusMeta = getStatusMeta(transaction.status);
      const transactionIdDisplay = transaction.reference || transaction.merchant_tx_ref || transaction.id;
      
      // Format date
      const dateObj = new Date(transaction.created_at);
      const formattedDate = `${dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} • ${dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
      
      // Get REAL sender and receiver data (only if available)
      const senderName = transaction.sender?.name || transaction.from_name || null;
      const senderEmail = getSenderEmail(transaction);
      const senderAccount = getSenderAccount(transaction);
      
      const receiverName = transaction.receiver?.name || transaction.to_name || null;
      const receiverEmail = getReceiverEmail(transaction);
      const receiverAccount = getReceiverAccount(transaction);
      
      const feeAmount = transaction.fee || 0;

      // Logo HTML - use base64 if available, otherwise fallback to path
      const logoSrc = logoBase64 || "/logo.png";

      // Get status icon HTML based on status class - using inline SVG for reliability in PDF
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

      // RECEIPT HTML with SVG icons
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
      <div class="amount-value">${amountInfo.display}</div>
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
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-(--bg-primary) fade-in relative">
        <DashboardSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="lg:pl-72 min-h-screen flex flex-col">
          <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="flex justify-center items-center h-full">
              <Loader />
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-(--bg-primary) fade-in relative">
        <DashboardSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="lg:pl-72 min-h-screen flex flex-col">
          <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center py-8 sm:py-12">
                <h2 className="text-xl sm:text-2xl font-bold text-(--text-primary) mb-4">
                  Transaction Not Found
                </h2>
                <p className="text-(--text-secondary) mb-4">
                  The transaction with ID "{params.id}" could not be found.
                </p>
                <Button
                  onClick={() => router.back()}
                  className="bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90"
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

  // Get REAL data for display in the UI (only if available)
  const realSenderEmail = getSenderEmail(transaction);
  const realSenderAccount = getSenderAccount(transaction);
  const realReceiverEmail = getReceiverEmail(transaction);
  const realReceiverAccount = getReceiverAccount(transaction);

  const senderData = transaction.sender || {};
  const receiverData = transaction.receiver || {};
  const externalData = transaction.external_response || {};

  const displaySender = {
    name: senderData.name || externalData?.withdrawal_details?.account_name || externalData?.data?.customer?.senderName || externalData?.metadata?.sender_name || null,
    accountNumber: realSenderAccount || null,
    bankName: senderData.bankName || externalData?.withdrawal_details?.bank_name || externalData?.data?.customer?.bankName || null,
    email: realSenderEmail || null,
  };

  const displayReceiver = {
    name: receiverData.name || externalData?.receiver_details?.account_name || externalData?.data?.customer?.recipientName || externalData?.data?.transaction?.aliasAccountName || externalData?.data?.meta?.recipientName || null,
    accountNumber: realReceiverAccount || null,
    bankName: receiverData.bankName || externalData?.receiver_details?.bank_name || externalData?.data?.customer?.bankName || null,
    email: realReceiverEmail || null,
  };

  const isWithdrawal = transaction.type?.toLowerCase() === "withdrawal";

  return (
    <div className="min-h-screen bg-(--bg-primary) fade-in relative">
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:pl-72 min-h-screen flex flex-col">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="text-(--color-accent-yellow) hover:bg-(--bg-secondary) text-sm md:text-base"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  <span className="hidden md:block">Back</span>
                </Button>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-(--text-primary) truncate">
                    Transaction Details
                  </h1>
                  <p className="text-(--text-secondary) text-sm sm:text-base">
                    View complete transaction information
                  </p>
                </div>
              </div>

              {transaction.status?.toLowerCase() === "success" && (
                <Button
                  onClick={handleDownloadReceipt}
                  disabled={downloading}
                  className="flex items-center gap-2 bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90 w-full sm:w-auto justify-center"
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
                <Card className="bg-(--bg-primary) border border-(--border-color)">
                  <CardHeader className="pb-3">
                    <h2 className="text-lg sm:text-xl font-bold text-(--text-primary)">
                      Amount
                    </h2>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div
                        className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${
                          amountInfo.isOutflow
                            ? "text-red-500 dark:text-red-400"
                            : "text-(--color-accent-yellow)"
                        }`}
                      >
                        {amountInfo.display}
                      </div>

                      <p className="text-(--text-secondary) mt-2 text-sm sm:text-base capitalize">
                        {transaction.status?.toLowerCase() === "success"
                          ? "Transaction Successful"
                          : transaction.status?.toLowerCase() === "pending"
                            ? "Transaction Pending"
                            : "Transaction Failed"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Narration Card - Only show if narration exists */}
                {narration && (
                  <Card className="bg-(--bg-primary) border border-(--border-color)">
                    <CardHeader className="flex flex-row items-center gap-2 pb-3">
                      <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-(--text-secondary)" />
                      <h2 className="text-lg sm:text-xl font-bold text-(--text-primary)">
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

                {/* Sender Information - Only show if any data exists */}
                {(displaySender.name || displaySender.accountNumber || displaySender.email || displaySender.bankName) && (
                  <Card className="bg-(--bg-primary) border border-(--border-color)">
                    <CardHeader className="flex flex-row items-center gap-2 pb-3">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-(--text-secondary)" />
                      <h2 className="text-lg sm:text-xl font-bold text-(--text-primary)">
                        {isWithdrawal ? "From (Zidwell)" : "Sender Information"}
                      </h2>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {displaySender.name && (
                        <div className="flex flex-row justify-between gap-1 xs:gap-2">
                          <span className="text-(--text-secondary) text-sm sm:text-base">
                            Name
                          </span>
                          <span className="font-medium text-sm sm:text-base text-right xs:text-left break-all text-(--text-primary)">
                            {displaySender.name}
                          </span>
                        </div>
                      )}
                      {displaySender.email && (
                        <div className="flex flex-row justify-between gap-1 xs:gap-2">
                          <span className="text-(--text-secondary) text-sm sm:text-base">
                            Email
                          </span>
                          <span className="font-medium text-sm sm:text-base text-right xs:text-left break-all text-(--text-primary)">
                            {displaySender.email}
                          </span>
                        </div>
                      )}
                      {displaySender.accountNumber && (
                        <div className="flex flex-row justify-between gap-1 xs:gap-2">
                          <span className="text-(--text-secondary) text-sm sm:text-base">
                            Account Number
                          </span>
                          <span className="font-medium text-sm sm:text-base text-right xs:text-left break-all text-(--text-primary)">
                            {displaySender.accountNumber}
                          </span>
                        </div>
                      )}
                      {displaySender.bankName && (
                        <div className="flex flex-row justify-between gap-1 xs:gap-2">
                          <span className="text-(--text-secondary) text-sm sm:text-base">
                            Bank Name
                          </span>
                          <span className="font-medium text-sm sm:text-base text-right xs:text-left break-all text-(--text-primary)">
                            {displaySender.bankName}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Receiver Information - Only show if any data exists */}
                {(displayReceiver.name || displayReceiver.accountNumber || displayReceiver.email || displayReceiver.bankName) && (
                  <Card className="bg-(--bg-primary) border border-(--border-color)">
                    <CardHeader className="flex flex-row items-center gap-2 pb-3">
                      <Building className="w-4 h-4 sm:w-5 sm:h-5 text-(--text-secondary)" />
                      <h2 className="text-lg sm:text-xl font-bold text-(--text-primary)">
                        {isWithdrawal ? "To (Recipient)" : "Receiver Information"}
                      </h2>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {displayReceiver.name && (
                        <div className="flex flex-row justify-between gap-1 xs:gap-2">
                          <span className="text-(--text-secondary) text-sm sm:text-base">
                            {isWithdrawal ? "Recipient Name" : "Account Name"}
                          </span>
                          <span className="font-medium text-sm sm:text-base text-right xs:text-left break-all text-(--text-primary)">
                            {displayReceiver.name}
                          </span>
                        </div>
                      )}
                      {displayReceiver.email && (
                        <div className="flex flex-row justify-between gap-1 xs:gap-2">
                          <span className="text-(--text-secondary) text-sm sm:text-base">
                            Email
                          </span>
                          <span className="font-medium text-sm sm:text-base text-right xs:text-left break-all text-(--text-primary)">
                            {displayReceiver.email}
                          </span>
                        </div>
                      )}
                      {displayReceiver.accountNumber && (
                        <div className="flex flex-row justify-between gap-1 xs:gap-2">
                          <span className="text-(--text-secondary) text-sm sm:text-base">
                            Account Number
                          </span>
                          <span className="font-medium text-sm sm:text-base text-right xs:text-left break-all text-(--text-primary)">
                            {displayReceiver.accountNumber}
                          </span>
                        </div>
                      )}
                      {displayReceiver.bankName && (
                        <div className="flex flex-row justify-between gap-1 xs:gap-2">
                          <span className="text-(--text-secondary) text-sm sm:text-base">
                            Bank Name
                          </span>
                          <span className="font-medium text-sm sm:text-base text-right xs:text-left break-all text-(--text-primary)">
                            {displayReceiver.bankName}
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
                <Card className="bg-(--bg-primary) border border-(--border-color)">
                  <CardHeader className="flex flex-row items-center gap-2 pb-3">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-(--text-secondary)" />
                    <h2 className="text-lg sm:text-xl font-bold text-(--text-primary)">
                      Transaction Details
                    </h2>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-col xs:flex-row xs:justify-between gap-1 xs:gap-2">
                      <span className="text-(--text-secondary) text-sm sm:text-base">
                        Type
                      </span>
                      <span className="font-medium text-sm sm:text-base text-right xs:text-left capitalize text-(--text-primary)">
                        {transaction.type || "N/A"}
                      </span>
                    </div>
                    {transaction.description && (
                      <div className="flex flex-col xs:flex-row xs:justify-between gap-1 xs:gap-2">
                        <span className="text-(--text-secondary) text-sm sm:text-base">
                          Description
                        </span>
                        <span className="font-medium text-sm sm:text-base text-right xs:text-left break-all text-(--text-primary)">
                          {transaction.description}
                        </span>
                      </div>
                    )}
                    <div className="flex flex-col xs:flex-row xs:justify-between gap-1 xs:gap-2">
                      <span className="text-(--text-secondary) text-sm sm:text-base">
                        Reference
                      </span>
                      <span className="font-medium text-sm sm:text-base text-right xs:text-left break-all text-(--text-primary)">
                        {transaction.reference || transaction.merchant_tx_ref || transaction.id}
                      </span>
                    </div>
                    <div className="flex flex-col xs:flex-row xs:justify-between gap-1 xs:gap-2">
                      <span className="text-(--text-secondary) text-sm sm:text-base">
                        Status
                      </span>
                      <span
                        className={`font-medium text-sm sm:text-base text-right xs:text-left capitalize ${
                          transaction.status?.toLowerCase() === "success"
                            ? "text-(--color-accent-yellow)"
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
                        <span className="text-(--text-secondary) text-sm sm:text-base">
                          Transaction Fee
                        </span>
                        <span className="font-medium text-sm text-(--text-primary)">
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
                        <span className="text-(--text-secondary) text-sm sm:text-base">
                          Total Deduction
                        </span>
                        <span className="font-medium text-sm text-(--text-primary)">
                          ₦
                          {Number(transaction.total_deduction).toLocaleString(
                            "en-NG",
                            {
                              minimumFractionDigits: 2,
                            },
                          )}
                        </span>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>

                {/* Date & Time */}
                <Card className="bg-(--bg-primary) border border-(--border-color)">
                  <CardHeader className="flex flex-row items-center gap-2 pb-3">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-(--text-secondary)" />
                    <h2 className="text-lg sm:text-xl font-bold text-(--text-primary)">
                      Date & Time
                    </h2>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-col xs:flex-row xs:justify-between gap-1 xs:gap-2">
                      <span className="text-(--text-secondary) text-sm sm:text-base">
                        Date
                      </span>
                      <span className="font-medium text-sm sm:text-base text-right xs:text-left text-(--text-primary)">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex flex-col xs:flex-row xs:justify-between gap-1 xs:gap-2">
                      <span className="text-(--text-secondary) text-sm sm:text-base">
                        Time
                      </span>
                      <span className="font-medium text-sm sm:text-base text-right xs:text-left text-(--text-primary)">
                        {new Date(transaction.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex flex-col xs:flex-row xs:justify-between gap-1 xs:gap-2">
                      <span className="text-(--text-secondary) text-sm sm:text-base">
                        Full Date
                      </span>
                      <span className="font-medium text-sm sm:text-base text-right xs:text-left text-(--text-primary)">
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