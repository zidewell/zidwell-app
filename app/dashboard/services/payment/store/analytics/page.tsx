import { ZidwellShell } from "@/app/components/zidwell-shell";
import { StorePage } from "@/app/components/store-page";
import { AnalyticsDashboard } from "@/app/components/store/analytics";

export const metadata = {
  title: "Analytics — Zidwell Online Store",
  description: "Analytics for your Zidwell Online Store.",
};

export default function AnalyticsPage() {
  return (
    <ZidwellShell>
      <StorePage
        eyebrow="Online Store"
        title="Analytics"
        description="Track your store's performance and growth."
      >
        <AnalyticsDashboard />
      </StorePage>
    </ZidwellShell>
  );
}
