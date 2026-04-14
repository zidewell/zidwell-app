// app/components/payment-page/PaymentPageCheckout.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Loader2, Shield, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";

interface PaymentPageCheckoutProps {
  page: any;
  onClose: () => void;
}

export const PaymentPageCheckout = ({ page, onClose }: PaymentPageCheckoutProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    amount: page.priceType === "open" ? "" : page.price.toString(),
  });

  const displayPrice = page.priceType === "open"
    ? Number(formData.amount) || 0
    : page.priceType === "installment"
    ? Math.ceil(page.price / (page.installmentCount || 3))
    : page.price;

  const fee = Math.min(displayPrice * 0.02, 2000);
  const totalForCustomer = page.feeMode === "customer" ? displayPrice + fee : displayPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/payment-page/public/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageSlug: page.slug,
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          amount: page.priceType === "open" ? Number(formData.amount) : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout");
      }

      // Redirect to payment page
      window.location.href = data.checkoutLink;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full bg-white rounded-2xl relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Complete Payment</h2>
          <p className="text-gray-600 text-sm mt-1">Enter your details to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label>Full Name *</Label>
            <Input
              required
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Email Address *</Label>
            <Input
              required
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Phone Number</Label>
            <Input
              placeholder="08012345678"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="mt-1"
            />
          </div>

          {page.priceType === "open" && (
            <div>
              <Label>Amount (₦) *</Label>
              <Input
                required
                type="number"
                min={page.metadata?.minimumAmount || 100}
                placeholder="Enter amount"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="mt-1"
              />
              {page.metadata?.minimumAmount && (
                <p className="text-xs text-gray-500 mt-1">Minimum: ₦{page.metadata.minimumAmount.toLocaleString()}</p>
              )}
            </div>
          )}

          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span>₦{displayPrice.toLocaleString()}</span>
            </div>
            {page.feeMode === "customer" && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Transaction fee (2%)</span>
                <span>₦{fee.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-2 border-t">
              <span>Total</span>
              <span>₦{totalForCustomer.toLocaleString()}</span>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="default"
            size="lg"
            className="w-full bg-[#e1bf46] text-[#023528] hover:bg-[#e1bf46]/90"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay ₦${totalForCustomer.toLocaleString()}`
            )}
          </Button>

          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <Shield className="h-3.5 w-3.5" />
            Secured by Zidwell
          </div>
        </form>
      </motion.div>
    </div>
  );
};