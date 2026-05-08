// app/components/new-profile/WalletCard.tsx
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useVerificationModal } from "@/app/context/verificationModalContext";
import { Eye, EyeOff, Landmark, CopyIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useUserContextData } from "@/app/context/userData";

interface WalletCardProps {
  allTimeBalance: number;
  currentBalance: number;
  totalTransactions: number;
  activated: boolean;
  onActivate: () => void;
}

const formatNaira = (amount: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(
    amount,
  );

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const WalletCard: React.FC<WalletCardProps> = ({
  allTimeBalance,
  currentBalance,
  totalTransactions,
  activated,
  onActivate,
}) => {
  const router = useRouter();
  const { openVerificationModal } = useVerificationModal();
  const { userData } = useUserContextData();
  const [showAlltime, setShowAlltime] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [showTotalTransactions, setShowTotalTransactions] = useState(false);
  const [copyText, setCopyText] = useState(false);
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleActivate = () => {
    openVerificationModal();
    onActivate();
  };

  useEffect(() => {
    const fetchAccountDetails = async () => {
      if (!userData?.id) return;
      setLoading(true);
      try {
        const res = await fetch("/api/get-wallet-account-details", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: userData.id }),
        });
        const data = await res.json();
        setDetails(data);
      } catch (error) {
        console.error("Error fetching account details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAccountDetails();
  }, [userData?.id]);

  const handleCopyAccountNumber = async () => {
    if (details?.bank_details?.bank_account_number) {
      setCopyText(true);
      await navigator.clipboard.writeText(
        details.bank_details.bank_account_number,
      );
      setTimeout(() => setCopyText(false), 3000);
    }
  };

  if (!activated) {
    return (
      <div className="neo-card bg-[var(--bg-primary)] p-6 md:p-8 border border-[var(--border-color)] rounded-xl shadow-soft">
        <h3 className="font-heading text-[var(--text-primary)] text-base mb-2">
          ACTIVATE YOUR WALLET
        </h3>
        <p className="text-sm font-body text-[var(--text-secondary)] mb-5">
          Complete your KYC verification to activate your wallet and start
          transacting.
        </p>
        <button
          onClick={handleActivate}
          className="bg-[var(--color-accent-yellow)] hover:bg-[var(--color-accent-yellow)]/90 text-[var(--color-ink)] py-3 px-6 rounded-md transition-all font-medium"
        >
          Start Verification
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: All-time Balance */}
      <Card className="bg-linear-to-r from-[var(--color-accent-yellow)] to-[#E3A521] text-white flex items-center justify-between shadow-lg rounded-xl p-4 dark:from-[#1e5f43] dark:to-[#b37f1a]">
        <CardHeader className="p-0">
          <CardTitle className="text-base font-medium">
            All-time Balance
            <span className="block font-semibold text-xl mt-1">
              {showAlltime ? formatNaira(allTimeBalance) : "*****"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <button
            onClick={() => setShowAlltime((prev) => !prev)}
            className="bg-white/20 p-3 rounded-full hover:bg-white/30 transition"
          >
            {showAlltime ? (
              <EyeOff className="text-white" />
            ) : (
              <Eye className="text-white" />
            )}
          </button>
        </CardContent>
      </Card>

      {/* Card 2: Current Balance */}
      <Card className="bg-linear-to-r from-gray-600 to-gray-800 text-white flex items-center justify-between shadow-lg rounded-xl p-4 dark:from-gray-700 dark:to-gray-900">
        <CardHeader className="p-0">
          <CardTitle className="text-base font-medium">
            Current Balance
            <span className="block font-semibold text-xl mt-1">
              {showCurrent ? formatNaira(currentBalance) : "*****"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <button
            onClick={() => setShowCurrent((prev) => !prev)}
            className="bg-white/20 p-3 rounded-full hover:bg-white/30 transition"
          >
            {showCurrent ? (
              <EyeOff className="text-white" />
            ) : (
              <Eye className="text-white" />
            )}
          </button>
        </CardContent>
      </Card>

      {/* Card 3: Account Number */}
      <Card className="flex items-center justify-between bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-md rounded-xl p-4 dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="p-0">
          <CardTitle className="text-base font-medium text-[var(--text-primary)]">
            Your Account Number
            <div className="font-semibold flex items-center gap-4 mt-1 text-[var(--text-primary)]">
              {showAccountNumber
                ? details?.bank_details?.bank_account_number || "Not available"
                : "*****"}
              {showAccountNumber &&
                details?.bank_details?.bank_account_number && (
                  <button
                    className="text-sm border px-3 py-2 rounded-md cursor-pointer hover:bg-[var(--bg-secondary)] transition dark:border-gray-600 dark:hover:bg-gray-700"
                    onClick={handleCopyAccountNumber}
                  >
                    {copyText ? "Copied" : <CopyIcon className="w-4 h-4" />}
                  </button>
                )}
            </div>
            {showAccountNumber && (
              <p className="text-sm text-[var(--text-secondary)]">
                {details?.bank_details?.bank_name || "Providus Bank"}
              </p>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <button
            onClick={() => setShowAccountNumber((prev) => !prev)}
            className="bg-[var(--bg-secondary)] p-3 rounded-full hover:bg-[var(--bg-secondary)]/80 transition"
          >
            {showAccountNumber ? (
              <EyeOff className="text-[var(--text-secondary)]" />
            ) : (
              <Eye className="text-[var(--text-secondary)]" />
            )}
          </button>
        </CardContent>
      </Card>

      {/* Card 4: Total Transactions */}
      <Card className="bg-linear-to-r from-blue-600 to-cyan-600 text-white flex items-center justify-between shadow-lg rounded-xl p-4 dark:from-blue-700 dark:to-cyan-700">
        <CardHeader className="p-0">
          <CardTitle className="text-base font-medium">
            Total Transactions
            <span className="block font-semibold text-xl mt-1">
              {showTotalTransactions
                ? totalTransactions.toLocaleString()
                : "*****"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <button
            onClick={() => setShowTotalTransactions((prev) => !prev)}
            className="bg-white/20 p-3 rounded-full hover:bg-white/30 transition"
          >
            {showTotalTransactions ? (
              <EyeOff className="text-white" />
            ) : (
              <Eye className="text-white" />
            )}
          </button>
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletCard;