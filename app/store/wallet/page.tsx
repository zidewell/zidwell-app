import { ZidwellShell } from "@/app/components/zidwell-shell";
import { StorePage } from "@/app/components/store-page";
import { StoreWallet } from "@/app/components/store/wallet";

export const metadata = {
  title: "Store Wallet — Zidwell Online Store",
  description: "Manage your store wallet and withdrawals.",
};

export default function WalletPage() {
  return (
    <ZidwellShell>
      <StorePage
        eyebrow="Online Store"
        title="Store Wallet"
        description="Manage your store wallet balance and withdrawals."
      >
        <StoreWallet />
      </StorePage>
    </ZidwellShell>
  );
}
