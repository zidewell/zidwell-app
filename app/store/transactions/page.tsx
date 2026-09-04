import { ZidwellShell } from "@/app/components/zidwell-shell";
import { StorePage } from "@/app/components/store-page";
import { TransactionsList } from "@/app/components/store/transactions";

export const metadata = {
  title: "Transactions — Zidwell Online Store",
  description: "View all store transactions.",
};

export default function TransactionsPage() {
  return (
    <ZidwellShell>
      <StorePage
        eyebrow="Online Store"
        title="Transactions"
        description="View all transactions from your store."
      >
        <TransactionsList />
      </StorePage>
    </ZidwellShell>
  );
}
