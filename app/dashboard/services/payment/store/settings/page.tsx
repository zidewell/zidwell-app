import { ZidwellShell } from "@/app/components/zidwell-shell";
import { StorePage } from "@/app/components/store-page";
import { StoreSettings } from "@/app/components/store/settings";

export const metadata = {
  title: "Settings — Zidwell Online Store",
  description: "Store settings and preferences.",
};

export default function SettingsPage() {
  return (
    <ZidwellShell>
      <StorePage
        eyebrow="Online Store"
        title="Settings"
        description="Manage your store settings and preferences."
      >
        <StoreSettings />
      </StorePage>
    </ZidwellShell>
  );
}
