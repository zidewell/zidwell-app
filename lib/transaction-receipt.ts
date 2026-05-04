
interface Transaction {
  id: string;
  reference?: string;
  merchant_tx_ref?: string;
  amount: number;
  type: string;
  status: string;
  fee?: number;
  total_deduction?: number;
  created_at: string;
  description?: string;
  narration?: string;
  sender?: {
    name?: string;
    accountNumber?: string;
    bankName?: string;
    bankCode?: string;
    email?: string;
  };
  receiver?: {
    name?: string;
    accountNumber?: string;
    bankName?: string;
    bankCode?: string;
    email?: string;
  };
  external_response?: {
    withdrawal_details?: {
      account_name?: string;
      account_number?: string;
      bank_name?: string;
      bank_code?: string;
      narration?: string;
    };
    receiver_details?: {
      account_name?: string;
      account_number?: string;
      bank_name?: string;
      bank_code?: string;
    };
    data?: {
      customer?: {
        senderName?: string;
        recipientName?: string;
        accountNumber?: string;
        bankName?: string;
        bankCode?: string;
        email?: string;
      };
      transaction?: {
        narration?: string;
        aliasAccountName?: string;
        aliasAccountNumber?: string;
      };
      narration?: string;
      meta?: {
        recipientName?: string;
        recipientEmail?: string;
      };
    };
    metadata?: {
      sender_name?: string;
      sender_email?: string;
    };
    narration?: string;
  };
}

interface AmountInfo {
  display: string;
  signedDisplay: string;
  isOutflow: boolean;
  rawAmount: number;
}

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

/**
 * Format currency amount
 */
export const formatCurrency = (amount: number): string => {
  return `₦${amount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
  })}`;
};

/**
 * Determine if transaction is outflow (money leaving account)
 */
export const isOutflow = (transactionType: string): boolean => {
  return outflowTypes.includes(transactionType?.toLowerCase());
};

/**
 * Determine if transaction is inflow (money coming in)
 */
export const isInflow = (transactionType: string): boolean => {
  return inflowTypes.includes(transactionType?.toLowerCase());
};

/**
 * Format amount with proper sign
 */
export const formatAmount = (transaction: Transaction): AmountInfo => {
  const isOutflowTransaction = isOutflow(transaction.type);
  const amount = Number(transaction.amount) || 0;

  return {
    display: formatCurrency(amount),
    signedDisplay: `${isOutflowTransaction ? "-" : "+"}${formatCurrency(amount)}`,
    isOutflow: isOutflowTransaction,
    rawAmount: amount,
  };
};

/**
 * Extract narration from transaction data
 */
export const getNarration = (transaction: Transaction): string => {
  if (transaction.narration) {
    return transaction.narration;
  }

  if (transaction.description) {
    return transaction.description;
  }

  if (transaction.external_response?.data?.transaction?.narration) {
    return transaction.external_response.data.transaction.narration;
  }

  if (transaction.external_response?.narration) {
    return transaction.external_response.narration;
  }

  if (transaction.external_response?.withdrawal_details?.narration) {
    return transaction.external_response.withdrawal_details.narration;
  }

  if (transaction.external_response?.data?.narration) {
    return transaction.external_response.data.narration;
  }

  return "";
};

/**
 * Extract sender information from transaction
 */
export const extractSenderInfo = (transaction: Transaction) => {
  const senderData = transaction.sender || {};
  const externalData = transaction.external_response || {};

  return {
    name: senderData.name ||
          externalData?.withdrawal_details?.account_name ||
          externalData?.data?.customer?.senderName ||
          externalData?.metadata?.sender_name ||
          "N/A",
    email: senderData.email ||
           externalData?.metadata?.sender_email ||
           externalData?.data?.customer?.email ||
           "",
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
};

/**
 * Extract receiver information from transaction
 */
export const extractReceiverInfo = (transaction: Transaction) => {
  const receiverData = transaction.receiver || {};
  const externalData = transaction.external_response || {};

  return {
    name: receiverData.name ||
          externalData?.receiver_details?.account_name ||
          externalData?.data?.customer?.recipientName ||
          externalData?.data?.transaction?.aliasAccountName ||
          externalData?.data?.meta?.recipientName ||
          "N/A",
    email: receiverData.email ||
           externalData?.data?.meta?.recipientEmail ||
           externalData?.data?.customer?.email ||
           "",
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
};

/**
 * Get description from transaction
 */
export const getDescription = (transaction: Transaction): string => {
  return transaction.description ||
         transaction.narration ||
         transaction.external_response?.withdrawal_details?.narration ||
         transaction.external_response?.data?.transaction?.narration ||
         "Transaction";
};

/**
 * Get transaction reference
 */
export const getTransactionReference = (transaction: Transaction): string => {
  return transaction.reference || transaction.merchant_tx_ref || transaction.id;
};

/**
 * Check if transaction is eligible for receipt download
 */
export const isEligibleForReceipt = (transaction: Transaction): boolean => {
  return transaction.status?.toLowerCase() === "success";
};

/**
 * Format date for receipt - matches Zidwell design
 */
export const formatReceiptDate = (dateString: string): string => {
  const date = new Date(dateString);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;
  const timeStr = `${hours}:${minutesStr} ${ampm}`;
  
  return `${day} ${month} ${year} • ${timeStr}`;
};

/**
 * Mask account number for display
 */
export const maskAccountNumber = (accountNumber: string): string => {
  if (!accountNumber || accountNumber === "N/A") return "";
  if (accountNumber.length <= 4) return accountNumber;
  const last4 = accountNumber.slice(-4);
  return `**** ${last4}`;
};

/**
 * Generate receipt HTML for PDF download - Modern Zidwell Design
 */
export const generateReceiptHTML = (transaction: Transaction): string => {
  const amountInfo = formatAmount(transaction);
  const narration = getNarration(transaction);
  const senderInfo = extractSenderInfo(transaction);
  const receiverInfo = extractReceiverInfo(transaction);
  const reference = getTransactionReference(transaction);
  const formattedDate = formatReceiptDate(transaction.created_at);
  
  // Clean amount - remove the +/- sign for display
  const cleanAmount = amountInfo.display;
  
  // Mask account numbers
  const senderMaskedAccount = maskAccountNumber(senderInfo.accountNumber);
  const receiverMaskedAccount = maskAccountNumber(receiverInfo.accountNumber);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Zidwell — Transfer Receipt</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', system-ui, sans-serif;
      background: #0a0a0a;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      color: #111;
    }

    .receipt {
      width: 100%;
      max-width: 420px;
      background: #fff;
      border-radius: 28px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,.5);
      position: relative;
    }

    /* Top black header with curved cutout */
    .header {
      background: #0a0a0a;
      height: 170px;
      position: relative;
      border-bottom: 2px solid #f5b800;
    }
    .header::after {
      content: "";
      position: absolute;
      bottom: -1px;
      left: 50%;
      transform: translateX(-50%);
      width: 70%;
      height: 90px;
      background: #fff;
      border-radius: 0 0 50% 50% / 0 0 100% 100%;
      border-top: 2px solid #f5b800;
    }
    .logo {
      position: absolute;
      top: 22px;
      left: 50%;
      transform: translateX(-50%);
      text-align: center;
      z-index: 2;
    }
    .logo .mark {
      font-size: 64px;
      font-weight: 800;
      color: #f5b800;
      line-height: 1;
      letter-spacing: -2px;
      font-family: Georgia, serif;
    }
    .logo .name {
      color: #f5b800;
      font-weight: 700;
      font-size: 18px;
      margin-top: 4px;
      letter-spacing: .5px;
    }

    /* Status */
    .status {
      text-align: center;
      padding: 28px 24px 16px;
    }
    .check {
      width: 56px; height: 56px;
      border-radius: 50%;
      background: #f5b800;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 14px;
    }
    .status h1 {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .status p {
      color: #888;
      font-size: 14px;
    }

    /* Divider with dots */
    .divider {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 22px 28px;
    }
    .divider .line { flex: 1; height: 1px; background: #f5b800; }
    .divider .dots { color: #f5b800; letter-spacing: 3px; font-size: 14px; }

    /* Amount */
    .amount {
      text-align: center;
      padding: 0 24px 8px;
    }
    .amount .label {
      color: #888;
      font-size: 12px;
      letter-spacing: 2px;
      font-weight: 500;
      margin-bottom: 8px;
    }
    .amount .value {
      font-size: 38px;
      font-weight: 700;
      letter-spacing: -1px;
    }

    /* Section title */
    .section-title {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 26px 28px 8px;
    }
    .section-title .line { flex: 1; height: 1px; background: #f5b800; }
    .section-title span {
      color: #f5b800;
      font-weight: 700;
      font-size: 13px;
      letter-spacing: 2px;
    }

    /* Detail rows */
    .details { padding: 8px 24px 0; }
    .row {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px 4px;
      border-bottom: 1px solid #f0f0f0;
    }
    .row:last-child { border-bottom: none; }
    .icon {
      width: 40px; height: 40px;
      border-radius: 50%;
      background: #0a0a0a;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .row-body { flex: 1; min-width: 0; }
    .row-body .k { font-size: 13px; color: #555; }
    .row-body .v { font-weight: 700; font-size: 15px; margin-top: 2px; }
    .row-body .sub { font-size: 13px; color: #999; margin-top: 2px; word-break: break-all; }
    .row-aside { font-size: 13px; color: #333; letter-spacing: 1px; }
    .copy-btn {
      background: none; border: none; cursor: pointer; color: #f5b800; padding: 4px;
      display: inline-flex; align-items: center; justify-content: center;
    }
    .copy-btn:hover { opacity: 0.7; }

    /* Narration section */
    .narration-section {
      margin: 16px 28px;
      padding: 12px 16px;
      background: #f8f8f8;
      border-radius: 12px;
      border-left: 3px solid #f5b800;
    }
    .narration-text {
      font-size: 13px;
      color: #555;
      font-style: italic;
      line-height: 1.4;
    }

    /* Footer */
    .footer {
      margin-top: 18px;
      background: #0a0a0a;
      color: #fff;
      text-align: center;
      padding: 22px 20px;
      position: relative;
      border-top: 2px solid #f5b800;
    }
    .footer::before {
      content: "";
      position: absolute;
      top: -1px;
      left: 50%;
      transform: translateX(-50%);
      width: 80%;
      height: 40px;
      background: #fff;
      border-radius: 0 0 50% 50% / 0 0 100% 100%;
    }
    .footer p { position: relative; font-size: 14px; }

    /* Print styles */
    @media print {
      body { background: white; padding: 0; }
      .receipt { box-shadow: none; max-width: 100%; }
      .copy-btn { display: none; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <div class="logo">
        <div class="mark">Z</div>
        <div class="name">Zidwell</div>
      </div>
    </div>

    <div class="status">
      <div class="check">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <h1>Transfer Successful</h1>
      <p>Your money has been sent securely.</p>
    </div>

    <div class="divider">
      <div class="line"></div>
      <div class="dots">• • •</div>
      <div class="line"></div>
    </div>

    <div class="amount">
      <div class="label">AMOUNT SENT</div>
      <div class="value">${cleanAmount}</div>
    </div>

    <div class="section-title">
      <div class="line"></div>
      <span>TRANSACTION DETAILS</span>
      <div class="line"></div>
    </div>

    <div class="details">
      <!-- Date & Time -->
      <div class="row">
        <div class="icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f5b800" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <div class="row-body">
          <div class="k">Date &amp; Time</div>
        </div>
        <div class="row-aside">${formattedDate}</div>
      </div>

      <!-- From (Sender) -->
      <div class="row">
        <div class="icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f5b800" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="7" y1="17" x2="17" y2="7"/>
            <polyline points="7 7 17 7 17 17"/>
          </svg>
        </div>
        <div class="row-body">
          <div class="k">From</div>
          <div class="v">${senderInfo.name !== "N/A" ? senderInfo.name : "N/A"}</div>
          ${senderInfo.email ? `<div class="sub">${senderInfo.email}</div>` : ''}
        </div>
        ${senderMaskedAccount ? `<div class="row-aside">${senderMaskedAccount}</div>` : ''}
      </div>

      <!-- To (Receiver) -->
      <div class="row">
        <div class="icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f5b800" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="17" y1="7" x2="7" y2="17"/>
            <polyline points="17 17 7 17 7 7"/>
          </svg>
        </div>
        <div class="row-body">
          <div class="k">To</div>
          <div class="v">${receiverInfo.name !== "N/A" ? receiverInfo.name : "N/A"}</div>
          ${receiverInfo.email ? `<div class="sub">${receiverInfo.email}</div>` : ''}
        </div>
        ${receiverMaskedAccount ? `<div class="row-aside">${receiverMaskedAccount}</div>` : ''}
      </div>

      <!-- Transaction ID -->
      <div class="row">
        <div class="icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f5b800" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="6" y="4" width="12" height="16" rx="1"/>
            <line x1="9" y1="9" x2="15" y2="9"/>
            <line x1="9" y1="13" x2="15" y2="13"/>
          </svg>
        </div>
        <div class="row-body">
          <div class="k">Transaction ID</div>
          <div class="v" style="font-size:14px;">${reference}</div>
        </div>
        <button class="copy-btn" onclick="navigator.clipboard.writeText('${reference}')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Narration Section (if exists) -->
    ${narration ? `
    <div class="narration-section">
      <div class="narration-text">"${narration}"</div>
    </div>
    ` : ''}

    <div class="footer">
      <p>Thank you for using Zidwell.</p>
    </div>
  </div>
</body>
</html>`;
};

/**
 * Download receipt as PDF
 */
export const downloadReceiptAsPDF = async (
  transaction: Transaction,
  onStart?: () => void,
  onComplete?: () => void,
  onError?: (error: Error) => void
): Promise<boolean> => {
  try {
    if (onStart) onStart();

    const receiptHTML = generateReceiptHTML(transaction);
    const reference = getTransactionReference(transaction);

    const response = await fetch("/api/generate-pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ html: receiptHTML }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate PDF: ${response.status}`);
    }

    const pdfBlob = await response.blob();
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zidwell-receipt-${reference}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (onComplete) onComplete();
    return true;
  } catch (error) {
    console.error("Error generating PDF:", error);
    
    // Fallback: download as HTML
    const receiptHTML = generateReceiptHTML(transaction);
    const reference = getTransactionReference(transaction);
    const blob = new Blob([receiptHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zidwell-receipt-${reference}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    if (onError) onError(error as Error);
    return false;
  }
};

// Export types
export type { Transaction, AmountInfo };