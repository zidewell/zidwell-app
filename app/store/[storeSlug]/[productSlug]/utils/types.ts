// app/store/[storeSlug]/[productSlug]/utils/types.ts

export interface PaymentPage {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImage: string | null;
  logo: string | null;
  productImages: string[];
  priceType: "fixed" | "installment" | "open";
  price: number;
  installmentCount?: number;
  feeMode: "bearer" | "customer";
  pageType: string;
  metadata: any;
  pageViews: number;
}

export interface StoreData {
  id: string;
  name: string;
  slug: string;
  description: string;
  city?: string;
  state?: string;
}

export interface StoreProductClientProps {
  page: PaymentPage;
  store: StoreData;
  initialPaidStudents?: Record<string, number>;
}

export type PaymentOption = "full" | "installment";