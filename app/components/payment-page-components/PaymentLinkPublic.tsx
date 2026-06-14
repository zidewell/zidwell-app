"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, CreditCard, Banknote, Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { useRouter } from "next/navigation";
import type { LinkConfig, CustomField } from "@/app/hooks/useStore";

// Simplified Payment Page interface for the public component
interface PaymentPagePublic {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImage: string | null;
  logo: string | null;
  price: number;
  pageType: string;
  linkConfig?: LinkConfig;
}

interface PaymentLinkPublicProps {
  page: PaymentPagePublic;
  config: LinkConfig;
}

export default function PaymentLinkPublic({ page, config }: PaymentLinkPublicProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (field: { label: string; required: boolean; type: string }, value: any): string => {
    if (field.required && (!value || (typeof value === "string" && !value.trim()))) {
      return `${field.label} is required`;
    }
    if (field.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return "Please enter a valid email address";
    }
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    if (config.collectName && config.nameRequired && !formData.name) {
      newErrors.name = "Name is required";
    }
    if (config.collectEmail && config.emailRequired && !formData.email) {
      newErrors.email = "Email is required";
    }
    if (config.collectPhone && config.phoneRequired && !formData.phone) {
      newErrors.phone = "Phone number is required";
    }
    
    config.customFields.forEach((field) => {
      const error = validateField(field, formData[field.id]);
      if (error) newErrors[field.id] = error;
    });
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch("/api/payment-page/public/card-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageSlug: page.slug,
          customerName: formData.name || "Anonymous",
          customerEmail: formData.email || "customer@example.com",
          customerPhone: formData.phone || "",
          amount: config.amountMode === "fixed" ? page.price : formData.customAmount,
          metadata: {
            pageType: "link",
            pageTitle: page.title,
            paymentType: "link",
            customFields: formData,
            referenceCode: config.referenceCode,
          },
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      
      window.open(data.checkoutLink, "_blank", "width=500,height=700");
      
    } catch (err: any) {
      console.error("Payment error:", err);
      alert(err.message || "Failed to initiate payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const renderCustomField = (field: CustomField) => {
    const value = formData[field.id] || "";
    const error = errors[field.id];
    
    switch (field.type) {
      case "text":
        return (
          <div key={field.id}>
            <Label className="text-sm font-semibold mb-1.5 block text-gray-300">
              {field.label} {field.required && "*"}
            </Label>
            <Input
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className="bg-[#1a1a1a] border-gray-700 text-white"
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
        );
      case "number":
        return (
          <div key={field.id}>
            <Label className="text-sm font-semibold mb-1.5 block text-gray-300">
              {field.label} {field.required && "*"}
            </Label>
            <Input
              type="number"
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className="bg-[#1a1a1a] border-gray-700 text-white"
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
        );
      case "date":
        return (
          <div key={field.id}>
            <Label className="text-sm font-semibold mb-1.5 block text-gray-300">
              {field.label} {field.required && "*"}
            </Label>
            <Input
              type="date"
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className="bg-[#1a1a1a] border-gray-700 text-white"
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
        );
      case "dropdown":
        return (
          <div key={field.id}>
            <Label className="text-sm font-semibold mb-1.5 block text-gray-300">
              {field.label} {field.required && "*"}
            </Label>
            <select
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className="w-full h-12 rounded-lg border border-gray-700 bg-[#1a1a1a] px-3 text-white"
            >
              <option value="">Select...</option>
              {field.options?.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
        );
      case "checkbox":
        return (
          <div key={field.id} className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => handleInputChange(field.id, e.target.checked)}
              className="h-4 w-4 rounded border-gray-700 bg-[#1a1a1a]"
            />
            <Label className="text-sm text-gray-300">
              {field.label} {field.required && "*"}
            </Label>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );
      case "paragraph":
        return (
          <div key={field.id}>
            <Label className="text-sm font-semibold mb-1.5 block text-gray-300">
              {field.label} {field.required && "*"}
            </Label>
            <Textarea
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              rows={3}
              className="bg-[#1a1a1a] border-gray-700 text-white resize-none"
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
        );
      default:
        return null;
    }
  };

  const amount = config.amountMode === "fixed" 
    ? page.price 
    : formData.customAmount;

  const isValidAmount = config.amountMode === "variable" 
    ? amount && amount > 0 
    : page.price > 0;

  return (
    <div className="min-h-screen bg-[#0e0e0e]">
      {/* Header */}
      <div className="bg-[#023528] text-white sticky top-0 z-10">
        <div className="container py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="hover:opacity-80">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            {page.logo && <img src={page.logo} className="h-10 w-10 rounded-xl object-cover" alt="Logo" />}
            <div>
              <h1 className="font-bold text-lg leading-tight">{page.title}</h1>
              <p className="text-white/60 text-xs">Secure Payment Link</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto py-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1a1a] rounded-2xl border border-gray-800 overflow-hidden"
          style={{ borderTop: `4px solid ${config.brandColor}` }}
        >
          {page.coverImage && (
            <img src={page.coverImage} alt={page.title} className="w-full h-40 object-cover" />
          )}
          
          <div className="p-6 space-y-6">
            {/* Title & Description */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white">{page.title}</h2>
              {page.description && (
                <p className="text-gray-400 text-sm mt-2">{page.description}</p>
              )}
            </div>

            {/* Amount Display */}
            <div className="bg-[#0e0e0e] rounded-xl p-4 text-center">
              {config.amountMode === "fixed" ? (
                <>
                  <p className="text-xs text-gray-500">Amount</p>
                  <p className="text-3xl font-bold" style={{ color: config.brandColor }}>
                    {config.currency === "NGN" ? "₦" : config.currency + " "}
                    {page.price.toLocaleString()}
                  </p>
                </>
              ) : (
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block text-gray-300">
                    Enter Amount *
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {config.currency === "NGN" ? "₦" : config.currency}
                    </span>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={formData.customAmount || ""}
                      onChange={(e) => handleInputChange("customAmount", parseFloat(e.target.value))}
                      className="pl-8 h-14 text-lg bg-[#1a1a1a] border-gray-700 text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Customer Info Fields */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {config.collectName && (
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block text-gray-300">
                    Full Name {config.nameRequired && "*"}
                  </Label>
                  <Input
                    value={formData.name || ""}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="bg-[#1a1a1a] border-gray-700 text-white"
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>
              )}

              {config.collectEmail && (
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block text-gray-300">
                    Email Address {config.emailRequired && "*"}
                  </Label>
                  <Input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="bg-[#1a1a1a] border-gray-700 text-white"
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>
              )}

              {config.collectPhone && (
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block text-gray-300">
                    Phone Number {config.phoneRequired && "*"}
                  </Label>
                  <Input
                    type="tel"
                    value={formData.phone || ""}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="bg-[#1a1a1a] border-gray-700 text-white"
                  />
                  {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                </div>
              )}

              {config.customFields.map(renderCustomField)}

              {/* Reference Code Display */}
              {config.referenceCode && (
                <div className="bg-gray-800/30 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Reference Code</p>
                  <p className="text-sm font-mono text-[#e1bf46]">{config.referenceCode}</p>
                </div>
              )}

              {/* Pay Button */}
              <Button
                type="submit"
                disabled={loading || !isValidAmount}
                className="w-full h-14 text-lg font-semibold transition-transform hover:scale-[1.02]"
                style={{ background: config.buttonColor, color: config.brandColor }}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <CreditCard className="h-5 w-5 mr-2" />
                    {config.buttonText}
                  </>
                )}
              </Button>
            </form>

            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <Shield className="h-3.5 w-3.5" /> Secured by Zidwell
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}