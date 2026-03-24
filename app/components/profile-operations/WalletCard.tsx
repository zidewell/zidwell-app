// app/components/new-profile/WalletCard.tsx
import React from "react";
import { useRouter } from "next/navigation";
import { useVerificationModal } from "@/app/context/verificationModalContext";

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

const WalletCard: React.FC<WalletCardProps> = ({
  allTimeBalance,
  currentBalance,
  totalTransactions,
  activated,
  onActivate,
}) => {
  const router = useRouter();
  const { openVerificationModal } = useVerificationModal();

  const handleActivate = () => {
    // Open the global verification modal
    openVerificationModal();

    // Call the original onActivate if needed
    onActivate();
  };



  if (!activated) {
    return (
      <div className="neo-card bg-card p-6 md:p-8">
        <h3 className="font-heading text-foreground text-base mb-2">
          ACTIVATE YOUR WALLET
        </h3>
        <p className="text-sm font-body text-muted-foreground mb-5">
          Complete your KYC verification to activate your wallet and start
          transacting.
        </p>
        <button
          onClick={handleActivate}
          className="bg-[#2b825b] hover:bg-[#2b825b]/90 text-white dark:bg-[#236b49] dark:hover:bg-[#174c36] py-3 px-6 rounded-md transition-all font-medium"
        >
          Start Verification
        </button>
      </div>
    );
  }

  return (
    <div className="neo-card bg-card p-6 md:p-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div>
          <span className="text-xs  text-muted-foreground block mb-1">
            All-time Balance
          </span>
          <span className="text-xl md:text-2xl font-heading text-foreground">
            {formatNaira(allTimeBalance)}
          </span>
        </div>
        <div>
          <span className="text-xs  text-muted-foreground block mb-1">
            Current Balance
          </span>
          <span className="text-xl md:text-2xl font-heading text-foreground">
            {formatNaira(currentBalance)}
          </span>
        </div>
        <div>
          <span className="text-xs  text-muted-foreground block mb-1">
            Total Transactions
          </span>
          <span className="text-xl md:text-2xl font-heading text-foreground">
            {totalTransactions.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default WalletCard;
