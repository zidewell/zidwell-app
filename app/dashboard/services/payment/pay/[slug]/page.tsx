// app/pay/[slug]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, Shield, Clock, TrendingUp, AlertTriangle, CreditCard } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { PaymentPageCheckout } from "@/app/components/payment-page-components/PaymentPageCheckout";

interface PaymentPage {
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
}

const PaymentPageView = () => {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const [page, setPage] = useState<PaymentPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const loadPage = async () => {
      try {
        const response = await fetch(`/api/payment-page/public/${slug}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("Page not found");
          } else {
            setError("Failed to load page");
          }
          return;
        }
        
        const data = await response.json();
        setPage(data.page);
      } catch (err) {
        console.error("Error loading page:", err);
        setError("Failed to load page");
      } finally {
        setLoading(false);
      }
    };
    
    loadPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f0e2] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e1bf46]"></div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-[#f7f0e2] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Page not found</h1>
          <p className="text-gray-600 mb-4">This payment page doesn't exist or has been removed.</p>
          <Button variant="default" onClick={() => router.push("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  const allImages = [...(page.coverImage ? [page.coverImage] : []), ...page.productImages];

  const displayPrice = page.priceType === "open"
    ? "Custom Amount"
    : page.priceType === "installment"
    ? `₦${Math.ceil(page.price / (page.installmentCount || 3)).toLocaleString()} (${page.installmentCount} installments)`
    : `₦${page.price.toLocaleString()}`;

  return (
    <div className="min-h-screen bg-[#f7f0e2]">
      {/* Header */}
      <div className="bg-[#034936] text-white sticky top-0 z-10">
        <div className="container py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="hover:opacity-80">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            {page.logo && (
              <img src={page.logo} className="h-10 w-10 rounded-xl object-cover" alt="Logo" />
            )}
            <div>
              <h1 className="font-bold text-lg leading-tight">{page.title}</h1>
              <p className="text-white/60 text-xs">by zidwell.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* Images */}
      {allImages.length > 0 && (
        <div className="relative bg-black/5">
          <img
            src={allImages[currentImage]}
            alt="Product"
            className="w-full h-64 md:h-80 object-cover"
          />
          {allImages.length > 1 && (
            <>
              <button
                onClick={() => setCurrentImage((c) => (c === 0 ? allImages.length - 1 : c - 1))}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/60 transition"
              >
                <ChevronLeft className="h-4 w-4 text-white" />
              </button>
              <button
                onClick={() => setCurrentImage((c) => (c === allImages.length - 1 ? 0 : c + 1))}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/60 transition"
              >
                <ChevronRight className="h-4 w-4 text-white" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {allImages.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === currentImage ? "w-4 bg-white" : "w-1.5 bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Content */}
      <div className="container max-w-lg mx-auto py-6 space-y-6 px-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">{page.title}</h2>
          {page.description && (
            <p className="text-gray-600 text-sm leading-relaxed">{page.description}</p>
          )}
          {page.priceType !== "open" && (
            <div className="mt-3">
              <span className="text-3xl font-bold text-[#023528]">{displayPrice}</span>
            </div>
          )}
        </div>

        {/* Investment Details */}
        {page.pageType === "real_estate" || page.pageType === "stock" || page.pageType === "savings" || page.pageType === "crypto" && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border">
            <h3 className="font-bold text-sm mb-3 text-[#023528]">Investment Details</h3>
            <div className="space-y-2">
              {page.metadata?.minimumAmount && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Minimum Amount</span>
                  <span className="font-medium">₦{page.metadata.minimumAmount.toLocaleString()}</span>
                </div>
              )}
              {page.metadata?.expectedReturn && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> Expected Return
                  </span>
                  <span className="font-medium">{page.metadata.expectedReturn}</span>
                </div>
              )}
              {page.metadata?.tenure && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Tenure
                  </span>
                  <span className="font-medium">{page.metadata.tenure}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Risk Disclosure */}
        {page.metadata?.riskExplanation && (
          <div className="p-4 rounded-2xl border-2 border-yellow-500/30 bg-yellow-500/5">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-bold text-yellow-700">Risk Disclosure</span>
            </div>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{page.metadata.riskExplanation}</p>
          </div>
        )}

        {/* Pay Button */}
        <Button
          variant="default"
          size="lg"
          className="w-full py-6 text-base bg-[#e1bf46] text-[#023528] hover:bg-[#e1bf46]/90"
          onClick={() => setShowCheckout(true)}
        >
          <CreditCard className="h-5 w-5 mr-2" />
          Pay {displayPrice}
        </Button>

        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 pb-6">
          <Shield className="h-3.5 w-3.5" /> Secured by Zidwell
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <PaymentPageCheckout
          page={page}
          onClose={() => setShowCheckout(false)}
        />
      )}
    </div>
  );
};

export default PaymentPageView;