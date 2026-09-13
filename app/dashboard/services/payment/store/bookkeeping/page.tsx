import { ZidwellShell } from "@/app/components/zidwell-shell";
import { StorePage } from "@/app/components/store-page";
import { BookkeepingDashboard } from "@/app/components/store/bookkeeping";

export const metadata = {
  title: "Bookkeeping — Zidwell Online Store",
  description: "Store bookkeeping and financial overview.",
};

export default function BookkeepingPage() {
  return (
    <ZidwellShell>
      <StorePage
        eyebrow="Online Store"
        title="Bookkeeping"
        description="Track your store's financial performance."
      >
        <BookkeepingDashboard />
      </StorePage>
    </ZidwellShell>
  );
}
