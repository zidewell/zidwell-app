import { ZidwellShell } from "@/app/components/zidwell-shell";
import { StorePage } from "@/app/components/store-page";
import { ProductGrid } from "@/app/components/store/products";

export const metadata = {
  title: "Products — Zidwell Online Store",
  description: "Manage your store catalogue, stock levels and product links.",
};

export default function ProductsPage() {
  return (
    <ZidwellShell>
      <StorePage
        eyebrow="Online Store"
        title="Products"
        description="Manage your store catalogue, stock levels and product links."
      >
        <ProductGrid />
      </StorePage>
    </ZidwellShell>
  );
}
