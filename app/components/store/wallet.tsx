// app/components/store/wallet.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Swal from "sweetalert2";
import { useStore } from "@/app/context/StoreContext";
import { useUserContextData } from "@/app/context/userData";
import { useVerificationModal } from "@/app/context/verificationModalContext";
import {
  Wallet,
  ArrowUpRight,
  CreditCard,
  Clock,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WithdrawalModal } from "./WithdrawalModal";

interface WalletResponse {
  available_balance: number;
  pending_balance: number;
  total_earned: number;
  total_withdrawn: number;
  lifetime_gross: number;
  page_totals: Record<string, number>;
  last_activity_at: string | null;
}

export function StoreWallet() {
  const { pages, loading: pagesLoading } = useStore();
  const { userData } = useUserContextData();
  const { openVerificationModal } = useVerificationModal();

  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);

  const isVerified = userData?.bvnVerification === "verified";

  // ─── FETCH WALLET ───
  const fetchWallet = useCallback(async () => {
    if (!userData?.id) {
      setWalletLoading(false);
      return;
    }

    try {
      setWalletLoading(true);
      const res = await fetch("/api/store/wallet/balance", {
        cache: "no-store",
      });

      if (!res.ok) {
        setWallet(null);
        return;
      }

      const data = await res.json();
      if (data.success && data.wallet) {
        setWallet(data.wallet);
      } else {
        setWallet(null);
      }
    } catch (err) {
      console.error("Wallet fetch failed:", err);
      setWallet(null);
    } finally {
      setWalletLoading(false);
    }
  }, [userData?.id]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  // ─── COMPUTED ───
  const walletData = useMemo(() => {
    return {
      totalBalance: wallet?.available_balance || 0,
      totalEarned: wallet?.total_earned || 0,
      totalWithdrawn: wallet?.total_withdrawn || 0,
      pageTotals: wallet?.page_totals || {},
    };
  }, [wallet]);

  const totalPayments = useMemo(
    () => pages.reduce((sum, p) => sum + (Number(p.totalPayments) || 0), 0),
    [pages]
  );

  const canWithdraw = walletData.totalBalance > 0;

  // ─── OPEN MODAL ───
  const handleOpenWithdraw = () => {
    if (!isVerified) {
      openVerificationModal();
      return;
    }
    if (!canWithdraw) {
      Swal.fire({
        icon: "info",
        title: "No Balance",
        text: "There is no available balance to withdraw yet.",
        confirmButtonColor: "#F5B81B",
      });
      return;
    }
    setIsWithdrawModalOpen(true);
  };

  // ─── CONFIRM WITHDRAWAL ───
  // Called by WithdrawalModal.onConfirm.
  // - Does ONE API call to the wallet withdraw endpoint.
  // - Shows SweetAlert on success or error.
  // - Only closes modal + refreshes on SUCCESS.
  // - On failure: shows SweetAlert error, then THROWS so the modal
  //   stays open and the user can retry.
const handleWithdrawConfirm = async (amount: number) => {
  try {
    const res = await fetch("/api/store/wallet/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Withdrawal failed");
    }

    const reference =
      data.withdrawal?.reference || `WDR-${Date.now().toString().slice(-8)}`;

    // ✅ CLOSE MODAL FIRST — before showing the alert
    setIsWithdrawModalOpen(false);

    // ✅ Refresh wallet in the background (don't await — let the alert show)
    fetchWallet();

    // ✅ THEN show success alert
    await Swal.fire({
      icon: "success",
      title: "Withdrawal Successful!",
      html: `
        <div class="text-left">
          <p class="mb-2 font-semibold text-green-600">
            ✅ ₦${amount.toLocaleString()} withdrawn!
          </p>
          <p class="text-sm text-gray-600">
            The funds are now in your main wallet.
          </p>
          <p class="text-xs text-gray-500 mt-2">
            Reference: ${reference}
          </p>
        </div>
      `,
      confirmButtonColor: "#F5B81B",
      confirmButtonText: "Done",
    });
  } catch (error: any) {
    // ✅ Keep modal open on failure — just show the error alert
    await Swal.fire({
      icon: "error",
      title: "Withdrawal Failed",
      html: `
        <div class="text-left">
          <p class="mb-2">${error.message || "Something went wrong"}</p>
          <p class="text-sm text-gray-600">
            The form is still open — please try again.
          </p>
        </div>
      `,
      confirmButtonColor: "#F5B81B",
    });

    // Re-throw so WithdrawalModal knows to stay on the input step
    throw error;
  }
};

  const handleVerify = () => {
    setIsWithdrawModalOpen(false);
    openVerificationModal();
  };

  const loading = pagesLoading || walletLoading;

  // ─── LOADING ───
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-40 bg-muted/50 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* ─── Balance Card ─── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-foreground to-foreground/80 p-8 text-background">
        <div className="absolute right-0 top-0 h-64 w-64 translate-x-12 -translate-y-12 rounded-full bg-gold/10" />
        <div className="absolute bottom-0 left-0 h-32 w-32 translate-x-8 translate-y-8 rounded-full bg-gold/5" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <Wallet className="size-5" />
            <p className="text-sm font-medium opacity-80">
              Store Wallet Balance
            </p>
          </div>
          <p className="mt-4 font-display text-5xl font-bold">
            ₦{walletData.totalBalance.toLocaleString()}
          </p>
          <p className="mt-1 text-xs opacity-60">
            {walletData.totalWithdrawn > 0
              ? `₦${walletData.totalEarned.toLocaleString()} earned • ₦${walletData.totalWithdrawn.toLocaleString()} withdrawn`
              : `From completed payments`}
          </p>

          <div className="mt-6 flex flex-wrap gap-4">
            {canWithdraw && (
              <button
                onClick={handleOpenWithdraw}
                className="rounded-2xl bg-gold px-6 py-3 text-sm font-bold text-gold-foreground hover:opacity-90 transition-opacity"
              >
                Withdraw Funds
              </button>
            )}
            <button className="rounded-2xl border border-background/20 px-6 py-3 text-sm font-bold hover:bg-background/10 transition-colors">
              Transaction History
            </button>
          </div>

          {!isVerified && (
            <div className="mt-4 p-4 rounded-xl bg-yellow-500/20 border border-yellow-500/30">
              <div className="flex items-start gap-3">
                <div className="shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500/30">
                    <span className="text-yellow-400">!</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-yellow-400">
                    BVN Verification Required
                  </p>
                  <p className="text-xs text-yellow-400/70 mt-1">
                    Verify your BVN to enable withdrawals
                  </p>
                  <button
                    onClick={() => openVerificationModal()}
                    className="mt-2 text-xs font-semibold text-yellow-400 hover:underline"
                  >
                    Verify Now →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Quick Stats ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ArrowUpRight className="size-4 text-lemon-green" />
            <p className="text-sm">Lifetime Earned</p>
          </div>
          <p className="text-xl font-bold">
            ₦{walletData.totalEarned.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CreditCard className="size-4 text-gold" />
            <p className="text-sm">Total Payments</p>
          </div>
          <p className="text-xl font-bold">{totalPayments}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="size-4 text-yellow-500" />
            <p className="text-sm">Total Withdrawn</p>
          </div>
          <p className="text-xl font-bold">
            ₦{walletData.totalWithdrawn.toLocaleString()}
          </p>
        </div>
      </div>

      {/* ─── Per-Page Breakdown ─── */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-lg font-bold">Balance by Page</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Only reflects completed payments
            </p>
          </div>
          <div className="group relative">
            <Info className="size-4 text-muted-foreground cursor-help" />
            <div className="absolute right-0 bottom-full mb-2 px-3 py-2 bg-foreground text-background text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Withdrawals are made from your total wallet balance
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {pages.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              No pages yet
            </p>
          )}
          {pages.map((page) => {
            const realBal = walletData.pageTotals[page.id] || 0;
            return (
              <div
                key={page.id}
                className="flex items-center justify-between border-b border-border pb-3 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-2xl",
                      realBal > 0 ? "bg-gold/10" : "bg-muted"
                    )}
                  >
                    <ArrowUpRight
                      className={cn(
                        "size-4",
                        realBal > 0
                          ? "text-lemon-green"
                          : "text-muted-foreground"
                      )}
                    />
                  </div>
                  <div>
                    <p className="font-semibold">{page.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {page.pageType}
                    </p>
                  </div>
                </div>
                <p
                  className={cn(
                    "font-bold",
                    realBal > 0 ? "text-lemon-green" : "text-muted-foreground"
                  )}
                >
                  ₦{realBal.toLocaleString()}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Withdrawal Modal ─── */}
      <WithdrawalModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        onConfirm={handleWithdrawConfirm}
        maxAmount={walletData.totalBalance}
        isVerified={isVerified}
        onVerify={handleVerify}
      />
    </div>
  );
}