// app/payment-page-success/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle,
  ArrowLeft,
  Download,
  Copy,
  Check,
  Mail,
  Clock,
  Banknote,
  User,
  Calendar,
  ExternalLink,
  Home,
  FileText,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import Link from "next/link";

interface PaymentDetails {
  id: string;
  amount: number;
  status: string;
  customer_name: string;
  customer_email: string;
  created_at: string;
  confirmed_at: string;
  custom_fields: Record<string, any>;
  students: string[];
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get("reference");
  const status = searchParams.get("status");
  const message = searchParams.get("message");

  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (reference) {
      fetchPaymentDetails();
    } else {
      setLoading(false);
    }
  }, [reference]);

  const fetchPaymentDetails = async () => {
    try {
      const response = await fetch(`/api/payment-page/public/confirm-payment?reference=${reference}`);
      const data = await response.json();

      if (data.found && data.payment) {
        setPayment({
          id: data.payment.id,
          amount: data.payment.amount,
          status: data.payment.status,
          customer_name: data.payment.customer_name || "Customer",
          customer_email: data.payment.customer_email || "",
          created_at: data.payment.created_at,
          confirmed_at: data.payment.confirmed_at,
          custom_fields: data.payment.custom_fields || {},
          students: data.payment.students || [],
        });
      } else {
        setError("Payment not found");
      }
    } catch (err) {
      console.error("Error fetching payment:", err);
      setError("Failed to load payment details");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount?.toLocaleString() || "0"}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e1bf46] mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error || !payment || status === "failed") {
    return (
      <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1a1a] rounded-2xl p-8 max-w-md w-full text-center border border-gray-800"
        >
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {status === "failed" ? "Payment Failed" : "Payment Not Found"}
          </h1>
          <p className="text-gray-400 mb-6">
            {status === "failed"
              ? "Your payment could not be processed. Please try again."
              : "We couldn't find your payment. Please check your reference number."}
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/">
              <Button className="w-full bg-[#e1bf46] text-[#023528] hover:bg-[#e1bf46]/90 font-semibold">
                <Home className="h-4 w-4 mr-2" />
                Return Home
              </Button>
            </Link>
            {reference && (
              <button
                onClick={() => copyToClipboard(reference)}
                className="text-sm text-gray-500 hover:text-[#e1bf46] transition-colors"
              >
                Reference: {reference}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  const isSuccess = status === "success" || payment.status === "completed";

  return (
    <div className="min-h-screen bg-[#0e0e0e]">
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#e1bf46]/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#e1bf46]/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-lg mx-auto py-12 px-4">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#e1bf46] transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-[#1a1a1a] rounded-2xl border border-gray-800 overflow-hidden shadow-xl"
        >
          {/* Success Header */}
          <div className="bg-gradient-to-r from-[#023528] to-[#034835] p-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500/30 mb-4"
            >
              <CheckCircle className="h-10 w-10 text-green-400" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white">
              Payment Successful! 🎉
            </h1>
            <p className="text-white/70 text-sm mt-1">
              {message || "Your payment has been confirmed successfully."}
            </p>
          </div>

          {/* Payment Details */}
          <div className="p-6 space-y-6">
            {/* Amount Card */}
            <div className="bg-[#0e0e0e] rounded-xl p-4 text-center border border-gray-800">
              <p className="text-xs text-gray-500">Amount Paid</p>
              <p className="text-3xl font-bold text-[#e1bf46]">
                {formatCurrency(payment.amount)}
              </p>
            </div>

            {/* Reference */}
            <div className="bg-[#0e0e0e] rounded-xl p-4 border border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span className="text-xs text-gray-500">Reference</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono text-[#e1bf46]">
                    {reference || payment.id}
                  </code>
                  <button
                    onClick={() => copyToClipboard(reference || payment.id)}
                    className="p-1 rounded hover:bg-[#e1bf46]/10 transition-colors"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-gray-400 hover:text-[#e1bf46]" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <User className="h-4 w-4 text-[#e1bf46]" />
                Customer Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-[#0e0e0e] rounded-xl p-3 border border-gray-800">
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="text-sm text-white font-medium truncate">
                    {payment.customer_name}
                  </p>
                </div>
                <div className="bg-[#0e0e0e] rounded-xl p-3 border border-gray-800">
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm text-white font-medium truncate">
                    {payment.customer_email || "Not provided"}
                  </p>
                </div>
              </div>
            </div>

            {/* Custom Fields */}
            {payment.custom_fields && Object.keys(payment.custom_fields).length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#e1bf46]" />
                  Additional Information
                </h3>
                <div className="bg-[#0e0e0e] rounded-xl p-3 border border-gray-800">
                  {Object.entries(payment.custom_fields)
                    .filter(([key]) => !['customAmount', 'name', 'email', 'phone'].includes(key))
                    .map(([key, value]) => (
                      <div key={key} className="flex justify-between py-1 border-b border-gray-800/50 last:border-0">
                        <span className="text-xs text-gray-500">{key}:</span>
                        <span className="text-xs text-white">{String(value) || "N/A"}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Students (for school payments) */}
            {payment.students && payment.students.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                  <User className="h-4 w-4 text-[#e1bf46]" />
                  Students
                </h3>
                <div className="bg-[#0e0e0e] rounded-xl p-3 border border-gray-800">
                  <div className="flex flex-wrap gap-2">
                    {payment.students.map((student, index) => (
                      <span
                        key={index}
                        className="text-xs bg-[#e1bf46]/10 text-[#e1bf46] px-3 py-1 rounded-full"
                      >
                        {student}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0e0e0e] rounded-xl p-3 border border-gray-800">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-gray-500" />
                  <p className="text-xs text-gray-500">Created</p>
                </div>
                <p className="text-xs text-white mt-1">
                  {formatDate(payment.created_at)}
                </p>
              </div>
              <div className="bg-[#0e0e0e] rounded-xl p-3 border border-gray-800">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                  <p className="text-xs text-gray-500">Confirmed</p>
                </div>
                <p className="text-xs text-white mt-1">
                  {formatDate(payment.confirmed_at || payment.created_at)}
                </p>
              </div>
            </div>

            {/* Email Notification */}
            <div className="bg-green-900/20 rounded-xl p-4 border border-green-800/30 flex items-start gap-3">
              <Mail className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-green-400 font-medium">Receipt Sent</p>
                <p className="text-xs text-green-400/70">
                  A receipt has been sent to {payment.customer_email || "your email"}.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-2">
              <Link href="/">
                <Button className="w-full bg-[#e1bf46] text-[#023528] hover:bg-[#e1bf46]/90 font-semibold">
                  <Home className="h-4 w-4 mr-2" />
                  Return Home
                </Button>
              </Link>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-[#e1bf46] transition-colors text-sm"
                >
                  <Download className="h-4 w-4" />
                  Download Receipt
                </button>
                <button
                  onClick={() => copyToClipboard(window.location.href)}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-[#e1bf46] transition-colors text-sm"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy Link
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center">
              <p className="text-[10px] text-gray-600">
                Secured by Zidwell • Payment confirmed at {formatDate(payment.confirmed_at || payment.created_at)}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Reference for debugging */}
        <p className="text-center text-[10px] text-gray-700 mt-4">
          Ref: {reference || payment.id}
        </p>
      </div>
    </div>
  );
}