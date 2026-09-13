import { ZidwellShell } from "@/app/components/zidwell-shell";
import { StorePage } from "@/app/components/store-page";
import { CustomersList } from "@/app/components/store/customers";

export const metadata = {
  title: "Customers — Zidwell Online Store",
  description: "Manage your store customers.",
};

export default function CustomersPage() {
  return (
    <ZidwellShell>
      <StorePage
        eyebrow="Online Store"
        title="Customers"
        description="Manage your store customers and their orders."
      >
        <CustomersList />
      </StorePage>
    </ZidwellShell>
  );
}
