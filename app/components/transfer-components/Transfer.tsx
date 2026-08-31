"use client";

import { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import PinPopOver from "../PinPopOver"; 
import TransactionSummary from "./TransactionSummary";
import TransferSuccessModal from "./TransferSuccessModal";
import TransferBalanceCards from "./TransferBalanceCards"; 
import TransferForm from "./TransferForm"; 
import { useUserContextData } from "@/app/context/userData";

// Types
interface Bank {
  name: string;
  code: string;
}

interface P2PDetails {
  name: string;
  id: string;
}

interface SavedAccount {
  id: string;
  account_number: string;
  account_name: string;
  bank_name: string;
  bank_code: string;
  is_default: boolean;
  last_used?: string;
}

interface SavedP2PBeneficiary {
  id: string;
  wallet_id: string;
  account_number: string;
  account_name: string;
  is_default: boolean;
  created_at: string;
  last_used?: string;
}

interface RecentBeneficiary {
  id: string;
  account_number: string;
  account_name: string;
  bank_name?: string;
  type: "bank" | "p2p";
  last_used: string;
}

interface ExpenseCategory {
  id: string;
  name: string;
  icon: string;
  type: string;
  isCustom: boolean;
  is_favorite?: boolean;
  favorite_order?: number;
}

type PaymentMethod = "checkout" | "virtual_account" | "bank_transfer" | "p2p";

export default function Transfer() {
  const inputCount = 4;
  const { userData, balance, lifetimeBalance } = useUserContextData();

  // State declarations
  const [isOpen, setIsOpen] = useState(false);
  const [transferType, setTransferType] = useState<"my-account" | "other-bank" | "p2p">("my-account");
  const [amount, setAmount] = useState<string>("");
  const [bankCode, setBankCode] = useState<string>("");
  const [bankName, setBankName] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [accountName, setAccountName] = useState<string>("");
  const [narration, setNarration] = useState<string>("");
  const [recepientAcc, setRecepientAcc] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [loading2, setLoading2] = useState<boolean>(false);
  const [lookupLoading, setLookupLoading] = useState<boolean>(false);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [p2pDetails, setP2pDetails] = useState<P2PDetails | null>(null);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [pin, setPin] = useState(Array(inputCount).fill(""));
  const [open, setOpen] = useState(false);
  const [confirmTransaction, setConfirmTransaction] = useState(false);
  const [search, setSearch] = useState("");
  const [calculatedFee, setCalculatedFee] = useState(0);
  const [totalDebit, setTotalDebit] = useState(0);
  const [pinError, setPinError] = useState<string | null>(null);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [saveAccount, setSaveAccount] = useState(false);
  const [selectedSavedAccount, setSelectedSavedAccount] = useState<SavedAccount | null>(null);
  const [showSavedAccounts, setShowSavedAccounts] = useState(false);
  const [savedP2PBeneficiaries, setSavedP2PBeneficiaries] = useState<SavedP2PBeneficiary[]>([]);
  const [saveP2PBeneficiary, setSaveP2PBeneficiary] = useState(false);
  const [selectedSavedP2PBeneficiary, setSelectedSavedP2PBeneficiary] = useState<SavedP2PBeneficiary | null>(null);
  const [showSavedP2PBeneficiaries, setShowSavedP2PBeneficiaries] = useState(false);
  const [showAlltime, setShowAlltime] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [expenseCategory, setExpenseCategory] = useState<string>("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [recentBeneficiaries, setRecentBeneficiaries] = useState<RecentBeneficiary[]>([]);
  const [showBeneficiarySuggestions, setShowBeneficiarySuggestions] = useState(false);
  const [beneficiarySearch, setBeneficiarySearch] = useState("");
  const [matchingBeneficiaries, setMatchingBeneficiaries] = useState<RecentBeneficiary[]>([]);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [isDownloadingReceipt, setIsDownloadingReceipt] = useState(false);

  // Refs
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const alertShownRef = useRef<boolean>(false);
  const currentTransactionIdRef = useRef<string | null>(null);
  const beneficiaryContainerRef = useRef<HTMLDivElement>(null);
  const accountInputRef = useRef<HTMLInputElement>(null);
  const p2pInputRef = useRef<HTMLInputElement>(null);
  const pendingFavoritesRef = useRef<Set<string>>(new Set());

  // Helper: Format number
  const formatNumber = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  // Helper: Reset form
  const resetForm = () => {
    setAmount("");
    setAccountNumber("");
    setAccountName("");
    setNarration("");
    setRecepientAcc("");
    setBankCode("");
    setBankName("");
    setPin(Array(inputCount).fill(""));
    setErrors({});
    setSaveAccount(false);
    setSaveP2PBeneficiary(false);
    setSelectedSavedAccount(null);
    setSelectedSavedP2PBeneficiary(null);
    setExpenseCategory("");
    setBeneficiarySearch("");
    setShowBeneficiarySuggestions(false);
    setP2pDetails(null);
    setMatchingBeneficiaries([]);
    setIsInputFocused(false);
  };

  // Helper: Stop polling
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    currentTransactionIdRef.current = null;
  };

  // Helper: Get all beneficiaries
  const getAllBeneficiaries = () => {
    const allBeneficiaries: RecentBeneficiary[] = [
      ...recentBeneficiaries,
      ...savedAccounts.map((acc) => ({
        id: `bank_${acc.account_number}`,
        account_number: acc.account_number,
        account_name: acc.account_name,
        bank_name: acc.bank_name,
        type: "bank" as const,
        last_used: acc.last_used || new Date().toISOString(),
      })),
      ...savedP2PBeneficiaries.map((b) => ({
        id: `p2p_${b.account_number}`,
        account_number: b.account_number,
        account_name: b.account_name,
        bank_name: "Zidwell",
        type: "p2p" as const,
        last_used: b.last_used || b.created_at,
      })),
    ];

    const unique = Array.from(
      new Map(allBeneficiaries.map((b) => [b.account_number, b])).values()
    );

    unique.sort(
      (a, b) =>
        new Date(b.last_used).getTime() - new Date(a.last_used).getTime()
    );

    return unique;
  };

  // Helper: Select beneficiary
  const handleSelectBeneficiary = (beneficiary: RecentBeneficiary) => {
    if (beneficiary.type === "bank") {
      setAccountNumber(beneficiary.account_number);
      setAccountName(beneficiary.account_name);
      setBankName(beneficiary.bank_name || "");
      const foundBank = banks.find((b) => b.name === beneficiary.bank_name);
      if (foundBank) {
        setBankCode(foundBank.code);
      }
      setShowBeneficiarySuggestions(false);
      setBeneficiarySearch("");
      setMatchingBeneficiaries([]);
      setIsInputFocused(false);
      accountInputRef.current?.blur();
    } else {
      setRecepientAcc(beneficiary.account_number);
      setP2pDetails({
        name: beneficiary.account_name,
        id: beneficiary.id,
      });
      setShowBeneficiarySuggestions(false);
      setBeneficiarySearch("");
      setMatchingBeneficiaries([]);
      setIsInputFocused(false);
      p2pInputRef.current?.blur();
    }
  };

  // Helper: Save recent beneficiary
  const saveRecentBeneficiary = (
    accountNumber: string,
    accountName: string,
    bankName: string | undefined,
    type: "bank" | "p2p"
  ) => {
    const newRecent: RecentBeneficiary = {
      id: `${type}_${accountNumber}`,
      account_number: accountNumber,
      account_name: accountName,
      bank_name: bankName,
      type,
      last_used: new Date().toISOString(),
    };

    setRecentBeneficiaries((prev) => {
      const filtered = prev.filter((b) => b.account_number !== accountNumber);
      const updated = [newRecent, ...filtered].slice(0, 10);
      localStorage.setItem(
        `recent_beneficiaries_${userData?.id}`,
        JSON.stringify(updated)
      );
      return updated;
    });
  };

// Helper: Download receipt
const handleDownloadReceiptFromData = async (receiptData: any) => {
  try {
    let logoBase64 = "";
    try {
      const response = await fetch("/logo.png");
      if (response.ok) {
        const blob = await response.blob();
        logoBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }
    } catch (e) {
      console.error("Error loading logo:", e);
    }

    const logoSrc = logoBase64 || "/logo.png";
    
    // Properly format amount with ₦ symbol
    const amountValue = Number(receiptData?.amount || 0);
    const amountDisplay = `${amountValue.toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
    
    const formattedDate = new Date(receiptData?.date || Date.now()).toLocaleString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Properly format fee with ₦ symbol
    const feeValue = Number(receiptData?.fee || 0);
    const feeDisplay = feeValue > 0 
      ? `₦${feeValue.toLocaleString("en-NG", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      : "";

    // Escape HTML special characters
    const escapeHtml = (str: string) => {
      if (!str) return '';
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    const statusColor = "#E5B333";
    const statusIconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#E5B333" stroke="none"/>
      <path d="M8 12L11 15L16 9" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

    const receiptHTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Zidwell Receipt | ${receiptData?.transactionId || "N/A"}</title>
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
    border: 2px solid ${statusColor};
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
    margin: 15px 0;
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
    margin: 25px 0 15px;
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
    font-size: 13px;
  }
  .detail-row {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid #f0e0a3;
  }
  .detail-row-last {
    border-bottom: none;
  }
  .left {
    display: flex;
    gap: 15px;
    align-items: center;
    flex: 1;
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
    flex-shrink: 0;
  }
  .detail-title {
    font-size: 13px;
    color: #444;
  }
  .detail-value {
    font-weight: 600;
    margin-top: 3px;
    font-size: 14px;
  }
  .sub {
    color: #777;
    font-size: 12px;
  }
  .right {
    font-weight: 600;
    text-align: right;
    font-size: 14px;
  }
  .narration-wrapper {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex: 1;
  }
  .narration-text {
    font-weight: 400;
    font-size: 13px;
    text-align: right;
    max-width: 60%;
    word-break: break-word;
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
      <h1>Transfer Successful</h1>
      <p>Your transaction has been completed successfully.</p>
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
      <div class="amount-value">${amountDisplay}</div>
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
        <div class="narration-wrapper">
          <div>
            <div class="detail-title">Date & Time</div>
          </div>
          <div class="right">${formattedDate}</div>
        </div>
      </div>
    </div>

    <div class="detail-row">
      <div class="left">
        <div class="icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="19" x2="12" y2="5"/>
            <polyline points="5 12 12 5 19 12"/>
          </svg>
        </div>
        <div class="narration-wrapper">
          <div>
            <div class="detail-title">From</div>
            <div class="detail-value">${escapeHtml(receiptData?.senderName || "Zidwell User")}</div>
            ${receiptData?.senderAccount ? `<div class="sub">${escapeHtml(receiptData.senderAccount)}</div>` : ""}
          </div>
        </div>
      </div>
    </div>

    <div class="detail-row">
      <div class="left">
        <div class="icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <polyline points="19 12 12 19 5 12"/>
          </svg>
        </div>
        <div class="narration-wrapper">
          <div>
            <div class="detail-title">To</div>
            <div class="detail-value">${escapeHtml(receiptData?.recipientName || "N/A")}</div>
            ${receiptData?.recipientAccount ? `<div class="sub">${escapeHtml(receiptData.recipientAccount)}</div>` : ""}
            ${receiptData?.recipientBank ? `<div class="sub">${escapeHtml(receiptData.recipientBank)}</div>` : ""}
          </div>
        </div>
      </div>
    </div>

    ${receiptData?.narration ? `
    <div class="detail-row">
      <div class="left">
        <div class="icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <div class="narration-wrapper">
          <div>
            <div class="detail-title">Narration</div>
          </div>
          <div class="narration-text">${escapeHtml(receiptData.narration)}</div>
        </div>
      </div>
    </div>
    ` : ""}

    ${feeValue > 0 ? `
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
        <div class="narration-wrapper">
          <div>
            <div class="detail-title">Fee</div>
          </div>
          <div class="right">${feeDisplay}</div>
        </div>
      </div>
    </div>
    ` : ""}

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
        <div class="narration-wrapper">
          <div>
            <div class="detail-title">Transaction ID</div>
            <div class="detail-value">${escapeHtml(receiptData?.transactionId || "N/A")}</div>
          </div>
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
    a.download = `zidwell-receipt-${receiptData?.transactionId || "receipt"}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error generating receipt:", error);
    Swal.fire({
      icon: "error",
      title: "Failed to Download",
      text: "Could not generate receipt. Please try again.",
    });
  }
};
  // Polling
  const startPolling = (transactionId: string) => {
    stopPolling();
    alertShownRef.current = false;
    currentTransactionIdRef.current = transactionId;

    let attempts = 0;
    const maxAttempts = 45;
    const pollIntervalMs = 2000;

    const pollStatus = async () => {
      if (currentTransactionIdRef.current !== transactionId) {
        console.log("Transaction ID mismatch, stopping polling");
        return;
      }

      if (alertShownRef.current) {
        console.log("Alert already shown, stopping polling");
        stopPolling();
        return;
      }

      if (attempts >= maxAttempts) {
        console.log("Max polling attempts reached");
        stopPolling();
        if (Swal.isVisible() && !alertShownRef.current) {
          alertShownRef.current = true;
          Swal.close();
          Swal.fire({
            icon: "warning",
            title: "Still Processing",
            text: "Your transfer is taking longer than expected. You will receive an email confirmation once completed.",
            confirmButtonColor: "var(--color-accent-yellow)",
          });
        }
        return;
      }

      attempts++;

      try {
        console.log(`Polling attempt ${attempts} for transaction ${transactionId}`);

        const res = await fetch(
          `/api/transaction/status?transactionId=${transactionId}`
        );

        if (!res.ok) {
          console.error(`Polling failed with status: ${res.status}`);
          return;
        }

        const data = await res.json();
        console.log("Polling response:", {
          status: data.status,
          transactionId,
        });

        if (alertShownRef.current) return;

        if (data.status === "success") {
          console.log("Transaction successful!");
          alertShownRef.current = true;
          stopPolling();

          if (Swal.isVisible()) Swal.close();

          // Prepare receipt data and show modal
          const receiptData = {
            transactionId: transactionId,
            amount: Number(amount),
            date: new Date().toISOString(),
            recipientName:
              transferType === "p2p"
                ? p2pDetails?.name
                : transferType === "other-bank"
                ? accountName
                : userDetails?.payment_details?.p_account_name,
            recipientAccount:
              transferType === "p2p"
                ? recepientAcc
                : transferType === "other-bank"
                ? accountNumber
                : userDetails?.payment_details?.p_account_number,
            recipientBank:
              transferType === "p2p"
                ? "Zidwell"
                : transferType === "other-bank"
                ? bankName
                : userDetails?.payment_details?.p_bank_name,
            senderName:
              userData?.fullName ||
              userDetails?.bank_details?.bank_account_name ||
              "Zidwell User",
            senderAccount:
              userDetails?.bank_details?.bank_account_number || "N/A",
            narration: narration,
            fee: calculatedFee,
            type: transferType,
          };

          setSuccessData(receiptData);
          setShowSuccessModal(true);

          resetForm();
          setConfirmTransaction(false);
          setIsOpen(false);
        } else if (data.status === "failed") {
          console.log("Transaction failed!");
          alertShownRef.current = true;
          stopPolling();

          if (Swal.isVisible()) Swal.close();

          await Swal.fire({
            icon: "error",
            title: "Transfer Failed",
            text:
              data.message ||
              "Your transfer could not be completed. Your wallet was not charged.",
            confirmButtonColor: "var(--color-accent-yellow)",
          });

          setConfirmTransaction(false);
          setIsOpen(false);
        } else {
          console.log("Still processing...");
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    };

    pollStatus();
    pollingIntervalRef.current = setInterval(pollStatus, pollIntervalMs);
  };

  // Save account to profile
  const saveAccountToProfile = async () => {
    if (!userData?.id || !accountNumber || !accountName || !bankCode || !bankName) return;
    try {
      const response = await fetch("/api/saved-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userData.id,
          accountNumber,
          accountName,
          bankCode,
          bankName,
          isDefault: false,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setSavedAccounts((prev) => [...prev, data.account]);
        Swal.fire({
          icon: "success",
          title: "Account Saved!",
          text: "This account has been saved to your profile for future transfers.",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed to Save",
          text: data.message || "Could not save account",
        });
      }
    } catch (error) {
      console.error("Failed to save account:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to save account. Please try again.",
      });
    }
  };

  // Save P2P beneficiary to profile
  const saveP2PBeneficiaryToProfile = async () => {
    if (!userData?.id || !recepientAcc || !p2pDetails?.name || !p2pDetails?.id) return;
    try {
      const response = await fetch("/api/save-p2p-beneficiary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userData.id,
          walletId: p2pDetails.id,
          accountNumber: recepientAcc,
          accountName: p2pDetails.name,
          isDefault: false,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setSavedP2PBeneficiaries((prev) => [...prev, data.beneficiary]);
        Swal.fire({
          icon: "success",
          title: "Beneficiary Saved!",
          text: "This user has been saved to your beneficiaries for future transfers.",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed to Save",
          text: data.message || "Could not save beneficiary",
        });
      }
    } catch (error) {
      console.error("Failed to save beneficiary:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to save beneficiary. Please try again.",
      });
    }
  };

  // Toggle favorite category
  const toggleFavoriteCategory = async (category: ExpenseCategory, e: React.MouseEvent) => {
    e.stopPropagation();

    if (pendingFavoritesRef.current.has(category.id)) {
      return;
    }

    const newFavoriteStatus = !category.is_favorite;

    setExpenseCategories((prev) =>
      prev.map((cat) =>
        cat.id === category.id
          ? {
              ...cat,
              is_favorite: newFavoriteStatus,
              favorite_order: newFavoriteStatus ? Date.now() : 0,
            }
          : cat
      )
    );

    pendingFavoritesRef.current.add(category.id);

    try {
      const response = await fetch(`/api/journal/categories/${category.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userData?.id,
          name: category.name,
          icon: category.icon,
          type: category.type,
          is_favorite: newFavoriteStatus,
          favorite_order: newFavoriteStatus ? Date.now() : 0,
        }),
      });

      if (!response.ok) {
        setExpenseCategories((prev) =>
          prev.map((cat) =>
            cat.id === category.id
              ? {
                  ...cat,
                  is_favorite: !newFavoriteStatus,
                  favorite_order: !newFavoriteStatus ? 0 : category.favorite_order,
                }
              : cat
          )
        );
        console.error("Failed to update favorite status");
      }
    } catch (error) {
      setExpenseCategories((prev) =>
        prev.map((cat) =>
          cat.id === category.id
            ? {
                ...cat,
                is_favorite: !newFavoriteStatus,
                favorite_order: !newFavoriteStatus ? 0 : category.favorite_order,
              }
            : cat
        )
      );
      console.error("Failed to update favorite:", error);
    } finally {
      pendingFavoritesRef.current.delete(category.id);
    }
  };

  // Handle select saved account
  const handleSelectSavedAccount = (account: SavedAccount) => {
    setSelectedSavedAccount(account);
    setAccountNumber(account.account_number);
    setAccountName(account.account_name);
    setBankCode(account.bank_code);
    setBankName(account.bank_name);
    setShowSavedAccounts(false);
    setSaveAccount(false);
    setShowBeneficiarySuggestions(false);
    setMatchingBeneficiaries([]);
    setIsInputFocused(false);
  };

  // Handle select saved P2P beneficiary
  const handleSelectSavedP2PBeneficiary = (beneficiary: SavedP2PBeneficiary) => {
    setSelectedSavedP2PBeneficiary(beneficiary);
    setRecepientAcc(beneficiary.account_number);
    setP2pDetails({
      name: beneficiary.account_name,
      id: beneficiary.wallet_id,
    });
    setShowSavedP2PBeneficiaries(false);
    setSaveP2PBeneficiary(false);
    setShowBeneficiarySuggestions(false);
    setMatchingBeneficiaries([]);
    setIsInputFocused(false);
  };

  // Handle select bank
  const handleSelectBank = (bank: Bank) => {
    setBankName(bank.name);
    setBankCode(bank.code);
    setOpen(false);
    setSearch("");
  };

  // Perform transfer
  const performTransfer = async (submittedPin: string) => {
    setLoading(true);

    try {
      const selectedCategory = expenseCategories.find((c) => c.id === expenseCategory);

      const payload: any = {
        userId: userData?.id,
        senderName: userDetails.bank_details.bank_account_name,
        senderAccountNumber: userDetails.bank_details.bank_account_number,
        senderBankName: userDetails.bank_details.bank_name,
        amount: Number(amount),
        narration,
        pin: submittedPin,
        type: transferType,
        fee: calculatedFee,
        totalDebit,
        category: selectedCategory?.name || narration,
        categoryId: expenseCategory,
      };

      if (transferType === "my-account") {
        payload.bankCode = userDetails.payment_details.p_bank_code;
        payload.bankName = userDetails.payment_details.p_bank_name;
        payload.accountNumber = userDetails.payment_details.p_account_number;
        payload.accountName = userDetails.payment_details.p_account_name;
      }

      if (transferType === "other-bank") {
        payload.bankCode = bankCode;
        payload.bankName = bankName;
        payload.accountNumber = accountNumber;
        payload.accountName = accountName;

        if (accountNumber && accountName && bankName) {
          saveRecentBeneficiary(accountNumber, accountName, bankName, "bank");
        }
      }

      if (transferType === "p2p") {
        payload.receiverAccountId = p2pDetails?.id;

        if (recepientAcc && p2pDetails?.name) {
          saveRecentBeneficiary(recepientAcc, p2pDetails.name, "Zidwell", "p2p");
        }
      }

      const endpoint =
        transferType === "p2p" ? "/api/p2p-transfer" : "/api/transfer-balance";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.status === "processing") {
        alertShownRef.current = false;

        Swal.fire({
          icon: "info",
          title: "Processing Transfer",
          text: "Your transfer is being processed. Please wait...",
          allowOutsideClick: false,
          showConfirmButton: false,
          willOpen: () => {
            Swal.showLoading();
          },
        });

        if (data.transactionId) startPolling(data.transactionId);

        setLoading(false);
        return { success: true };
      } else if (res.ok) {
        if (saveAccount && !selectedSavedAccount && transferType === "other-bank") {
          await saveAccountToProfile();
        }
        if (saveP2PBeneficiary && !selectedSavedP2PBeneficiary && transferType === "p2p") {
          await saveP2PBeneficiaryToProfile();
        }

        // Prepare receipt data for download
        const receiptData = {
          transactionId:
            data.transactionId ||
            data.reference ||
            data.transactionRef ||
            "TXN-" + Date.now(),
          amount: Number(amount),
          date: new Date().toISOString(),
          recipientName:
            transferType === "p2p"
              ? p2pDetails?.name
              : transferType === "other-bank"
              ? accountName
              : userDetails?.payment_details?.p_account_name,
          recipientAccount:
            transferType === "p2p"
              ? recepientAcc
              : transferType === "other-bank"
              ? accountNumber
              : userDetails?.payment_details?.p_account_number,
          recipientBank:
            transferType === "p2p"
              ? "Zidwell"
              : transferType === "other-bank"
              ? bankName
              : userDetails?.payment_details?.p_bank_name,
          senderName:
            userData?.fullName ||
            userDetails?.bank_details?.bank_account_name ||
            "Zidwell User",
          senderAccount: userDetails?.bank_details?.bank_account_number || "N/A",
          narration: narration,
          status: "success",
          fee: calculatedFee,
          type: transferType,
        };

        setSuccessData(receiptData);
        setShowSuccessModal(true);

        resetForm();
        setConfirmTransaction(false);
        setIsOpen(false);
        setLoading(false);
        return { success: true };
      } else {
        const errorMessage = data?.reason || data?.message || "Transfer failed.";

        if (
          errorMessage.toLowerCase().includes("pin") ||
          errorMessage.toLowerCase().includes("transaction pin")
        ) {
          throw new Error(errorMessage);
        }

        await Swal.fire({
          icon: "error",
          title: "Transfer Failed",
          text: errorMessage,
        });

        setErrors({ form: errorMessage });
        return { success: false, error: errorMessage };
      }
    } catch (err: any) {
      setLoading(false);
      setPin(Array(inputCount).fill(""));

      if (
        err?.message?.toLowerCase().includes("pin") ||
        err?.message?.toLowerCase().includes("transaction pin")
      )
        throw err;

      await Swal.fire({
        icon: "error",
        title: "Something went wrong",
        text: err?.message || "Please try again later.",
      });

      setErrors({ form: err?.message || "Something went wrong." });
      return { success: false, error: err?.message };
    } finally {
      setLoading(false);
    }
  };

  // Handle transfer submission
  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { [key: string]: string } = {};

    if (!amount || Number(amount) < 100) newErrors.amount = "Amount must be at least ₦100.";
    if (!narration) newErrors.narration = "Narration is required.";
    if (narration.length > 100) newErrors.narration = "Narration too long.";
    if (!expenseCategory) newErrors.expenseCategory = "Please select an expense category.";

    if (
      transferType === "my-account" &&
      (!userDetails?.payment_details?.p_account_number ||
        !userDetails?.payment_details?.p_account_name)
    ) {
      newErrors.myAccount = "Your bank details are incomplete.";
    }

    if (transferType === "other-bank") {
      if (!bankCode || !accountNumber || !accountName) {
        newErrors.otherBank = "Please complete all bank fields.";
      }
      if (accountNumber && (accountNumber.length !== 10 || !/^\d+$/.test(accountNumber))) {
        newErrors.accountNumber = "Account number must be 10 digits.";
      }
    }

    if (transferType === "p2p" && (!recepientAcc || !p2pDetails?.id)) {
      newErrors.recepientAcc = "Recipient not found or invalid.";
    }

    if (Object.keys(newErrors).length > 0) {
      const errorMessages = Object.values(newErrors).join("<br>");
      Swal.fire({
        icon: "error",
        title: "Validation Failed",
        html: errorMessages,
      });
      setErrors(newErrors);
      return;
    }
    setConfirmTransaction(true);
  };

  // Modal handlers
  const handleModalDownload = async () => {
    if (!successData) return;
    setIsDownloadingReceipt(true);
    await handleDownloadReceiptFromData(successData);
    setIsDownloadingReceipt(false);
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    setTimeout(() => {
      setSuccessData(null);
    }, 300);
  };

  // Computed values
  const filteredBanks = banks.filter((bank) =>
    bank.name.toLowerCase().includes(search.toLowerCase())
  );

  const isDisabled =
    loading ||
    !amount ||
    !narration ||
    !expenseCategory ||
    Number(amount) <= 0 ||
    (transferType === "my-account" && !userDetails?.payment_details?.p_account_number) ||
    (transferType === "other-bank" && (!bankCode || !accountNumber || !accountName)) ||
    (transferType === "p2p" && (!recepientAcc || !p2pDetails?.id));

  const getPaymentMethod = (): PaymentMethod => {
    if (transferType === "p2p") return "p2p";
    return "bank_transfer";
  };

  const showSuggestions =
    showBeneficiarySuggestions && matchingBeneficiaries.length > 0 && isInputFocused;

  // Effects
  useEffect(() => {
    const loadRecentBeneficiaries = () => {
      const cached = localStorage.getItem(`recent_beneficiaries_${userData?.id}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setRecentBeneficiaries(parsed);
        } catch (e) {
          console.error("Failed to parse recent beneficiaries:", e);
        }
      }
    };

    if (userData?.id) {
      loadRecentBeneficiaries();
    }
  }, [userData?.id]);

  // Fetch expense categories
  const fetchExpenseCategories = async () => {
    if (!userData?.id) return;

    setLoadingCategories(true);
    try {
      const response = await fetch(`/api/journal/categories?userId=${userData.id}`);
      const data = await response.json();

      const expenseCats = data.filter((cat: ExpenseCategory) => cat.type === "expense");

      const uniqueCategories = expenseCats.reduce(
        (acc: ExpenseCategory[], current: ExpenseCategory) => {
          const exists = acc.find((cat) => cat.name === current.name);
          if (!exists) {
            acc.push(current);
          }
          return acc;
        },
        []
      );

      setExpenseCategories(uniqueCategories);
    } catch (error) {
      console.error("Failed to fetch expense categories:", error);
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    if (!userData?.id) return;

    const fetchDetails = async () => {
      setLoading2(true);
      try {
        const [accountRes, banksRes, savedAccountsRes, savedP2PRes] = await Promise.all([
          fetch("/api/get-wallet-account-details", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: userData.id }),
          }),
          fetch("/api/banks"),
          fetch(`/api/saved-accounts?userId=${userData.id}`),
          fetch(`/api/save-p2p-beneficiary?userId=${userData.id}`),
        ]);

        const accountData = accountRes.ok ? await accountRes.json() : {};
        const banksData = banksRes.ok ? await banksRes.json() : {};
        const savedAccountsData = savedAccountsRes.ok ? await savedAccountsRes.json() : {};
        const savedP2PData = savedP2PRes.ok ? await savedP2PRes.json() : {};

        setUserDetails(accountData || {});
        setBanks(banksData?.data || []);
        setSavedAccounts(savedAccountsData.accounts || []);
        setSavedP2PBeneficiaries(savedP2PData.beneficiaries || []);
      } catch (err) {
        console.error("Error fetching details:", err);
        setUserDetails(null);
        setBanks([]);
        setSavedAccounts([]);
        setSavedP2PBeneficiaries([]);
      } finally {
        setLoading2(false);
      }
    };

    fetchDetails();
    fetchExpenseCategories();
  }, [userData?.id]);

  // Bank lookup effect
  useEffect(() => {
    if (transferType !== "other-bank") return;
    if (accountNumber.length !== 10 || !bankCode) return;

    if (accountNumber === userDetails?.bank_details?.bank_account_number) {
      setP2pDetails(null);
      setErrors((prev) => ({
        ...prev,
        recepientAcc: "You cannot transfer to your own account.",
      }));
      return;
    }

    const timeout = setTimeout(async () => {
      setLookupLoading(true);
      try {
        const res = await fetch("/api/bank-lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bankCode, accountNumber }),
        });
        const data = res.ok ? await res.json() : null;
        const acctName = data?.data?.accountName;
        if (acctName) {
          setAccountName(acctName);
          setErrors((prev) => ({ ...prev, accountNumber: "" }));
        } else {
          setAccountName("");
          setErrors((prev) => ({
            ...prev,
            accountNumber: data?.message || "Account lookup failed.",
          }));
        }
      } catch (err: any) {
        setAccountName("");
        setErrors((prev) => ({
          ...prev,
          accountNumber: err?.message || "Could not verify account.",
        }));
      } finally {
        setLookupLoading(false);
      }
    }, 700);

    return () => clearTimeout(timeout);
  }, [accountNumber, bankCode, transferType, userDetails]);

  // P2P lookup effect
  useEffect(() => {
    if (transferType !== "p2p") return;
    if (!recepientAcc || recepientAcc.length < 6) return;

    if (recepientAcc === userDetails?.bank_details?.bank_account_number) {
      setP2pDetails(null);
      setErrors((prev) => ({
        ...prev,
        recepientAcc: "You cannot transfer to your own account.",
      }));
      return;
    }

    const timeout = setTimeout(async () => {
      setLookupLoading(true);
      try {
        const res = await fetch("/api/find-user-wallet-id", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accNumber: recepientAcc }),
        });
        const data = res.ok ? await res.json() : null;

        if (data?.receiverName || data?.full_name) {
          const displayName = data.receiverName || data.full_name || "Zidwell User";
          setP2pDetails({
            name: displayName,
            id: data.walletId,
          });
          setErrors((prev) => ({ ...prev, recepientAcc: "" }));
        } else {
          setP2pDetails(null);
          setErrors((prev) => ({
            ...prev,
            recepientAcc: data?.error || "User not found.",
          }));
        }
      } catch (err: any) {
        setP2pDetails(null);
        setErrors((prev) => ({
          ...prev,
          recepientAcc: err?.message || "Could not verify account.",
        }));
      } finally {
        setLookupLoading(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [recepientAcc, transferType, userDetails]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Click outside handler for beneficiary suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        beneficiaryContainerRef.current &&
        !beneficiaryContainerRef.current.contains(target)
      ) {
        const isInputTrigger = target.closest(".beneficiary-input-trigger");
        if (!isInputTrigger) {
          setShowBeneficiarySuggestions(false);
          setMatchingBeneficiaries([]);
          setIsInputFocused(false);
        }
      }
    };

    if (showBeneficiarySuggestions) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showBeneficiarySuggestions]);

  return (
    <>
      <PinPopOver
        setIsOpen={setIsOpen}
        isOpen={isOpen}
        pin={pin}
        setPin={setPin}
        inputCount={inputCount}
        error={pinError}
        onClearError={() => setPinError(null)}
        onConfirm={async (code) => {
          try {
            setPinError(null);
            const result = await performTransfer(code);
            if (result?.success) {
              setIsOpen(false);
              setPin(Array(inputCount).fill(""));
            } else if (result?.error) {
              if (!result.error.toLowerCase().includes("pin")) {
                setIsOpen(false);
                setPin(Array(inputCount).fill(""));
              } else {
                setPinError(result.error);
              }
            }
          } catch (error: any) {
            setPinError(error?.message || "Invalid PIN. Please try again.");
            setPin(Array(inputCount).fill(""));
          }
        }}
      />

      <TransferSuccessModal
        isOpen={showSuccessModal}
        onClose={handleModalClose}
        onDownload={handleModalDownload}
        amount={successData?.amount || 0}
        transactionId={successData?.transactionId || ""}
        recipientName={successData?.recipientName || ""}
        recipientAccount={successData?.recipientAccount}
        recipientBank={successData?.recipientBank}
        senderName={successData?.senderName}
        isDownloading={isDownloadingReceipt}
      />

      <TransferBalanceCards
        lifetimeBalance={lifetimeBalance}
        balance={balance}
        showAlltime={showAlltime}
        showCurrent={showCurrent}
        setShowAlltime={setShowAlltime}
        setShowCurrent={setShowCurrent}
        userDetails={userDetails}
        formatNumber={formatNumber}
      />

      <TransferForm
        transferType={transferType}
        setTransferType={setTransferType}
        amount={amount}
        setAmount={setAmount}
        narration={narration}
        setNarration={setNarration}
        expenseCategory={expenseCategory}
        setExpenseCategory={setExpenseCategory}
        expenseCategories={expenseCategories}
        loadingCategories={loadingCategories}
        onToggleFavorite={toggleFavoriteCategory}
        calculatedFee={calculatedFee}
        totalDebit={totalDebit}
        setCalculatedFee={setCalculatedFee}
        setTotalDebit={setTotalDebit}
        errors={errors}
        isDisabled={isDisabled}
        loading={loading}
        onSubmit={handleTransfer}
        loading2={loading2}
        userDetails={userDetails}
        savedAccounts={savedAccounts}
        savedP2PBeneficiaries={savedP2PBeneficiaries}
        showSavedAccounts={showSavedAccounts}
        setShowSavedAccounts={setShowSavedAccounts}
        showSavedP2PBeneficiaries={showSavedP2PBeneficiaries}
        setShowSavedP2PBeneficiaries={setShowSavedP2PBeneficiaries}
        selectedSavedAccount={selectedSavedAccount}
        setSelectedSavedAccount={handleSelectSavedAccount}
        selectedSavedP2PBeneficiary={selectedSavedP2PBeneficiary}
        setSelectedSavedP2PBeneficiary={handleSelectSavedP2PBeneficiary}
        bankCode={bankCode}
        setBankCode={setBankCode}
        bankName={bankName}
        setBankName={setBankName}
        accountNumber={accountNumber}
        setAccountNumber={setAccountNumber}
        accountName={accountName}
        setAccountName={setAccountName}
        recepientAcc={recepientAcc}
        setRecepientAcc={setRecepientAcc}
        p2pDetails={p2pDetails}
        setP2pDetails={setP2pDetails}
        saveAccount={saveAccount}
        setSaveAccount={setSaveAccount}
        saveP2PBeneficiary={saveP2PBeneficiary}
        setSaveP2PBeneficiary={setSaveP2PBeneficiary}
        lookupLoading={lookupLoading}
        showBeneficiarySuggestions={showBeneficiarySuggestions}
        matchingBeneficiaries={matchingBeneficiaries}
        onSelectBeneficiary={handleSelectBeneficiary}
        onCloseSuggestions={() => {
          setShowBeneficiarySuggestions(false);
          setMatchingBeneficiaries([]);
          setIsInputFocused(false);
        }}
        beneficiaryContainerRef={beneficiaryContainerRef}
        accountInputRef={accountInputRef}
        p2pInputRef={p2pInputRef}
        setIsInputFocused={setIsInputFocused}
        isInputFocused={isInputFocused}
        banks={banks}
        open={open}
        setOpen={setOpen}
        search={search}
        setSearch={setSearch}
        filteredBanks={filteredBanks}
        handleSelectBank={handleSelectBank}
        getAllBeneficiaries={getAllBeneficiaries}
      />

      <TransactionSummary
        senderName={`${userData?.fullName}`}
        senderAccount={userDetails?.bank_details?.bank_account_number || "N/A"}
        recipientName={
          transferType === "p2p"
            ? p2pDetails?.name
            : transferType === "other-bank"
            ? accountName
            : userDetails?.payment_details?.p_account_name
        }
        recipientAccount={
          transferType === "p2p"
            ? recepientAcc
            : transferType === "other-bank"
            ? accountNumber
            : userDetails?.payment_details?.p_account_number
        }
        recipientBank={
          transferType === "p2p"
            ? "Zidwell"
            : transferType === "other-bank"
            ? bankName
            : userDetails?.payment_details?.p_bank_name
        }
        purpose={narration}
        amount={amount}
        confirmTransaction={confirmTransaction}
        onBack={() => setConfirmTransaction(false)}
        onConfirm={() => {
          setConfirmTransaction(false);
          setIsOpen(true);
        }}
        paymentMethod={getPaymentMethod()}
        isP2P={transferType === "p2p"}
      />
    </>
  );
}