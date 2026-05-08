"use client";

import { useState } from "react";
import {
  Check,
  FileText,
  User,
  Calendar,
  CreditCard,
  Package,
  Mail,
  Phone,
  Download,
  AlertCircle,
  Shield,
  Receipt,
  Building,
  MapPin,
  PenTool,
  CheckCircle,
} from "lucide-react";
import Swal from "sweetalert2";
import { ReceiptSignaturePanel } from "./Receipt-component/ReceiptSignaturePanel";

interface ReceiptItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface Receipt {
  id: string;
  token: string;
  receipt_id: string;
  initiator_name: string;
  initiator_email: string;
  business_name: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  bill_to: string;
  from_name: string;
  issue_date: string;
  customer_note: string;
  payment_for: string;
  payment_method: string;
  subtotal: number;
  total: number;
  status: "pending" | "signed" | "expired" | "draft";
  verification_code: string;
  receipt_items: ReceiptItem[];
  seller_signature: string;
  client_signature: string;
  signed_at: string | null;
  created_at: string;
  sent_at: string;
  signee_name: string;
  signee_email: string;
  metadata: any;
}

interface SignReceiptFormProps {
  receipt: Receipt;
}

export default function SignReceiptForm({ receipt }: SignReceiptFormProps) {
  const [name, setName] = useState(receipt.signee_name || "");
  const [acknowledged, setAcknowledged] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [nameError, setNameError] = useState("");
  const [showSignaturePanel, setShowSignaturePanel] = useState(false);

  const isAlreadySigned = receipt.status === "signed";

  const handleStartSigning = () => {
    if (!name.trim()) {
      setNameError("Please enter your full name.");
      return;
    }

    if (!acknowledged) {
      Swal.fire({
        icon: "warning",
        title: "Please acknowledge",
        text: "Toggle the acknowledgement switch to confirm.",
        confirmButtonColor: "#2b825b",
      });
      return;
    }

    setShowSignaturePanel(true);
  };

  const handleSignatureComplete = (signatureData: string) => {
    setShowSignaturePanel(false);
    setIsConfirmed(true);
  };

  const handleDownload = () => {
    Swal.fire({
      icon: "info",
      title: "PDF Download",
      text: "PDF generation would be implemented with a library like jsPDF or html2pdf.",
      confirmButtonColor: "#2b825b",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const totalAmount =
    receipt.total ||
    receipt.receipt_items.reduce((sum, item) => sum + item.amount, 0);

  if (isConfirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Receipt Confirmed!
          </h1>
          <p className="text-gray-600 mb-8">
            Thank you for acknowledging the receipt. A copy has been sent to
            your email.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {/* <button
              onClick={handleDownload}
              className="px-6 py-3 border-2 border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button> */}
            <button
              onClick={() => (window.location.href = "/")}
              className="px-6 py-3 bg-(--color-accent-yellow) text-white rounded-lg font-medium hover:bg-[#1e5d42] transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Check className="h-4 w-4" />
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Already Signed Warning */}
      {isAlreadySigned && (
        <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5" />
            <span className="font-semibold">Already Signed</span>
          </div>
          <p>This receipt has already been signed and cannot be modified.</p>
          {receipt.signed_at && (
            <p className="text-sm mt-2">
              Signed by: {receipt.signee_name} on{" "}
              {formatDate(receipt.signed_at)}
            </p>
          )}
        </div>
      )}

      {/* Receipt Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-8">
        {/* Header */}
        <div className="bg-linear-to-r from-(--color-accent-yellow) to-[#b38606] p-8 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <Receipt className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm opacity-90 uppercase tracking-wide">
                  Receipt #{receipt.receipt_id}
                </p>
                <h1 className="text-2xl font-bold mt-1">
                  {receipt.business_name || receipt.initiator_name}
                </h1>
                <p className="text-sm opacity-90 mt-1">
                  Issued on {formatDate(receipt.issue_date)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">Total Amount</p>
              <p className="text-3xl font-bold">
                {formatCurrency(totalAmount)}
              </p>
              <div className="mt-2 inline-block bg-white/20 px-3 py-1 rounded-full text-sm">
                Status:{" "}
                <span className="font-semibold">
                  {receipt.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-8 space-y-8">
          {/* Business Details */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-(--color-accent-yellow)/10 rounded-lg flex items-center justify-center">
                  <Building className="h-5 w-5 text-(--color-accent-yellow)" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">From</h3>
                  <p className="text-gray-600">
                    {receipt.business_name || receipt.initiator_name}
                  </p>
                  {receipt.initiator_email && (
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      {receipt.initiator_email}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-(--color-accent-yellow)/10 rounded-lg flex items-center justify-center">
                  <User className="h-5 w-5 text-(--color-accent-yellow)" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">To</h3>
                  <p className="text-gray-600">{receipt.client_name}</p>
                  <div className="space-y-1 mt-1">
                    {receipt.client_email && (
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        {receipt.client_email}
                      </p>
                    )}
                    {receipt.client_phone && (
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        {receipt.client_phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Billing Address */}
          {receipt.bill_to && (
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="h-5 w-5 text-gray-500" />
                <h3 className="font-semibold text-gray-900">Billing Address</h3>
              </div>
              <p className="text-gray-700 whitespace-pre-line">
                {receipt.bill_to}
              </p>
            </div>
          )}

          {/* Items Table */}
          <div className="border rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900">Items Details</h3>
            </div>
            <div className="divide-y">
              {/* Header */}
              <div className="grid grid-cols-12 px-6 py-4 bg-gray-50/50 text-sm font-medium text-gray-600 border-b">
                <div className="col-span-6">Description</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-right">Unit Price</div>
                <div className="col-span-2 text-right">Amount</div>
              </div>

              {/* Items */}
              {receipt.receipt_items.map((item, index) => (
                <div
                  key={item.id || index}
                  className="grid grid-cols-12 px-6 py-4 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="col-span-6">
                    <p className="font-medium text-gray-900">
                      {item.description}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Item #{index + 1}
                    </p>
                  </div>
                  <div className="col-span-2 text-center">
                    <p className="text-gray-700">{item.quantity}</p>
                  </div>
                  <div className="col-span-2 text-right">
                    <p className="text-gray-700">
                      {formatCurrency(item.unit_price)}
                    </p>
                  </div>
                  <div className="col-span-2 text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(item.amount)}
                    </p>
                  </div>
                </div>
              ))}

              {/* Totals */}
              <div className="bg-gray-50 px-6 py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">Subtotal</p>
                    <p className="text-2xl font-bold text-(--color-accent-yellow)">
                      {formatCurrency(totalAmount)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="text-2xl font-bold text-(--color-accent-yellow)">
                      {formatCurrency(totalAmount)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment & Notes */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="h-5 w-5 text-gray-500" />
                <h3 className="font-semibold text-gray-900">Payment Details</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-medium capitalize">
                    {receipt.payment_method === "transfer"
                      ? "Bank Transfer"
                      : receipt.payment_method}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment For:</span>
                  <span className="font-medium capitalize">
                    {receipt.payment_for}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Issue Date:</span>
                  <span className="font-medium">
                    {formatDate(receipt.issue_date)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="h-5 w-5 text-gray-500" />
                <h3 className="font-semibold text-gray-900">Notes</h3>
              </div>
              <p className="text-gray-700">
                {receipt.customer_note || "No additional notes provided."}
              </p>
            </div>
          </div>

          {/* Signatures */}
          <div className="border-t pt-8">
            <h3 className="font-semibold text-gray-900 mb-6 text-center">
              Signatures
            </h3>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Seller Signature */}
              <div className="space-y-4">
                <div className="text-center">
                  <p className="font-medium text-gray-900 mb-2">
                    Seller's Signature
                  </p>
                  <p className="text-sm text-gray-600">
                    {receipt.business_name}
                  </p>
                </div>
                <div className="h-32 border-2 border-dashed border-gray-300 rounded-lg bg-white flex items-center justify-center">
                  {receipt.seller_signature ? (
                    <img
                      src={receipt.seller_signature}
                      alt="Seller signature"
                      className="max-h-20"
                    />
                  ) : (
                    <span className="text-gray-400">No signature provided</span>
                  )}
                </div>
              </div>

              {/* Client Signature */}
              <div className="space-y-4">
                <div className="text-center">
                  <p className="font-medium text-gray-900 mb-2">
                    Client's Signature
                  </p>
                  <p className="text-sm text-gray-600">{receipt.client_name}</p>
                </div>
                <div className="h-32 border-2 border-dashed border-gray-300 rounded-lg bg-white flex items-center justify-center">
                  {isAlreadySigned && receipt.client_signature ? (
                    <img
                      src={receipt.client_signature}
                      alt="Client signature"
                      className="max-h-20"
                    />
                  ) : (
                    <span className="text-gray-400">
                      {isAlreadySigned ? "Signed" : "Awaiting signature"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Signing Form - Only show if not already signed */}
      {!isAlreadySigned && (
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-(--color-accent-yellow)/10 rounded-xl flex items-center justify-center">
              <Shield className="h-6 w-6 text-(--color-accent-yellow)" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Acknowledge Receipt
              </h2>
              <p className="text-gray-600">
                Verify your identity and acknowledge receipt of items/services
              </p>
            </div>
          </div>

          {/* Name Verification */}
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-900">
                Your Full Name *
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError("");
                }}
                className={`mt-2 w-full px-4 py-3 rounded-lg border bg-gray-50 text-gray-900 ${
                  nameError
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-(--color-accent-yellow)"
                } focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all`}
                placeholder="Enter your full name as provided"
              />
              {nameError && (
                <p className="text-sm text-red-600 flex items-center gap-2 mt-2">
                  <AlertCircle className="h-4 w-4" />
                  {nameError}
                </p>
              )}
              {receipt.signee_name && (
                <p className="text-sm text-gray-600 mt-2">
                  Expected signee:{" "}
                  <span className="font-medium">{receipt.signee_name}</span>
                </p>
              )}
            </label>
          </div>

          {/* Acknowledgement */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="flex items-start gap-4">
              <div className="relative shrink-0 mt-1">
                <input
                  type="checkbox"
                  id="acknowledge"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="sr-only peer"
                />
                <label
                  htmlFor="acknowledge"
                  className={`w-12 h-6 rounded-full cursor-pointer transition-colors duration-200 flex items-center p-1 ${
                    acknowledged ? "bg-(--color-accent-yellow)" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                      acknowledged ? "transform translate-x-6" : ""
                    }`}
                  />
                </label>
              </div>
              <div className="flex-1">
                <label
                  htmlFor="acknowledge"
                  className="text-lg font-medium text-gray-900 cursor-pointer select-none block"
                >
                  I acknowledge receipt of items/services
                </label>
                <p className="text-gray-600 mt-2">
                  By toggling this switch, I confirm that I have received the
                  items/services described in this receipt and acknowledge that
                  the information is accurate and complete.
                </p>
              </div>
              {acknowledged && (
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                  <Check className="h-5 w-5 text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Sign Button */}
          <button
            onClick={handleStartSigning}
            disabled={!name.trim() || !acknowledged}
            className="w-full py-4 bg-(--color-accent-yellow) text-white rounded-lg font-medium hover:bg-[#1e5d42] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3"
          >
            <PenTool className="h-5 w-5" />
            <span className="text-lg">Sign Receipt</span>
          </button>
        </div>
      )}

      {/* Download Button */}
      {/* <div className="flex justify-center mt-6">
        <button
          onClick={handleDownload}
          className="px-6 py-3 border-2 border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </button>
      </div> */}

      {/* Signature Panel */}
      {showSignaturePanel && (
        <ReceiptSignaturePanel
          receiptId={receipt.id}
          receiptToken={receipt.token}
          signeeName={name}
          signeeEmail={receipt.signee_email || receipt.client_email}
          receiptTitle={`Receipt #${receipt.receipt_id}`}
          businessName={receipt.business_name || receipt.initiator_name}
          clientName={receipt.client_name}
          totalAmount={totalAmount}
          issueDate={receipt.issue_date}
          onSignatureComplete={handleSignatureComplete}
          onCancel={() => setShowSignaturePanel(false)}
        />
      )}
    </div>
  );
}
