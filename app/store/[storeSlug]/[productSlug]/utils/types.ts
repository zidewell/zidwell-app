// app/store/[storeSlug]/[productSlug]/utils/types.ts

export type PaymentOption = "full" | "installment";

export interface PaymentPage {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImage: string | null;
  logo: string | null;
  productImages: string[];
  priceType: "fixed" | "installment" | "open" | string;
  price: number;
  installmentCount?: number;
  feeMode: "bearer" | "customer" | string;
  pageType: string;
  metadata: any;
  pageBalance: number;
  totalRevenue: number;
  totalPayments: number;
  pageViews: number;
  isActive: boolean;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface StoreData {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  owner_id?: string;
  logo_url?: string | null;
  cover_url?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  street_address?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  location_enabled?: boolean;
  is_active?: boolean;
  activation_paid?: boolean;
  total_views?: number;
  [key: string]: any;
}

export interface MoreProduct {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  price: number;
  price_type?: string | null;
  product_images?: string[] | string | null;
  cover_image?: string | null;
  page_type?: string | null;
  metadata?: any;
}

export interface StoreProductClientProps {
  page: PaymentPage;
  store: StoreData;
  initialPaidStudents?: Record<string, number>;
  moreProducts?: MoreProduct[];
}