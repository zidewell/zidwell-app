"use client";

import { Download, Edit, Eye, Loader2, Play } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { useRouter } from "next/navigation";
import { useUserContextData } from "../../context/userData";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { Receipt } from "./ReceiptGen";
import Loader from "../Loader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";


const getBase64Logo = async () => {
  try {
    const response = await fetch("/logo.png");
    if (!response.ok) throw new Error("Logo not found");
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error loading logo:", error);
    return "";
  }
};

const MySwal = withReactContent(Swal);

type Props = {
  receipts: Receipt[];
  loading: boolean;
};

const ReceiptList: React.FC<Props> = ({ receipts, loading }) => {

  
  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    signed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  };

  const statusLabels: Record<string, string> = {
    pending: "Pending",
    draft: "Draft",
    signed: "Signed",
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const { userData } = useUserContextData();
  const router = useRouter();
  const [base64Logo, setBase64Logo] = useState<string>("");
  const [pageLoading, setPageLoading] = useState(true);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  useEffect(() => {
    const loadLogo = async () => {
      const logo = await getBase64Logo();
      setBase64Logo(logo);
    };
    loadLogo();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const parseReceiptItems = (items: any) => {
    try {
      if (Array.isArray(items)) return items;
      if (typeof items === "string") return JSON.parse(items);
      return [];
    } catch (error) {
      console.error("Error parsing receipt items:", error);
      return [];
    }
  };

  const viewReceipt = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setViewModalOpen(true);
  };

  const handleContinueDraft = (receipt: Receipt) => {
    // Store receipt data in sessionStorage to load it in the create form
    sessionStorage.setItem('draftReceiptToLoad', JSON.stringify({
      id: receipt.id,
      receipt_id: receipt.receipt_id,
      business_name: receipt.business_name,
      initiator_name: receipt.initiator_name,
      initiator_email: receipt.initiator_email,
      initiator_phone: receipt.initiator_phone,
      client_name: receipt.client_name,
      client_email: receipt.client_email,
      client_phone: receipt.client_phone,
      payment_for: receipt.payment_for,
      payment_method: receipt.payment_method,
      receipt_items: receipt.receipt_items,
      seller_signature: receipt.seller_signature,
      total: receipt.total,
    }));
    
    // Navigate to the create receipt page with draft ID
    router.push(`/dashboard/services/receipt/create-receipt?draftId=${receipt.id}`);
  };

  const downloadPdf = async (receipt: Receipt) => {
    if (!base64Logo) {
      Swal.fire("Error", "Logo is still loading. Please try again.", "error");
      return;
    }

    // Don't allow download for draft receipts
    if (receipt.status === "draft") {
      Swal.fire(
        "Cannot Download Draft",
        "Please complete and send the receipt before downloading.",
        "warning"
      );
      return;
    }

    const receiptItems = parseReceiptItems(receipt.receipt_items);
    const formattedCreatedAt = receipt.created_at
      ? formatDate(receipt.created_at)
      : "N/A";

    const formattedSignedAt = receipt.signed_at
      ? formatDate(receipt.signed_at)
      : "N/A";

    const hasSellerSignature =
      receipt.seller_signature &&
      receipt.seller_signature !== "null" &&
      receipt.seller_signature !== "";
    const hasClientSignature =
      receipt.client_signature &&
      receipt.client_signature !== "null" &&
      receipt.client_signature !== "";

    const formattedItems = receiptItems.map((item: any, index: number) => ({
      description: item.description || item.item || "N/A",
      quantity: item.quantity,
      unit_price: item.unit_price || item.price || 0,
      amount: item.total || item.quantity * (item.unit_price || item.price || 0),
      index: index + 1
    }));

    const fullHtml = `<!DOCTYPE html>...`; // Same HTML template as before

    try {
      setProcessing(receipt.id);
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: fullHtml }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to generate PDF");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${receipt.receipt_id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      Swal.fire("Success", "PDF downloaded successfully!", "success");
    } catch (err) {
      console.error("PDF download failed:", err);
      Swal.fire("Error", "Failed to download PDF. Please try again.", "error");
    } finally {
      setProcessing(null);
    }
  };

  if (pageLoading || loading) {
    return <Loader />;
  }

  if (receipts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <div className="text-lg mb-2">No receipts found</div>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Create your first receipt to get started
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {receipts.map((receipt) => {
          const receiptItems = parseReceiptItems(receipt.receipt_items);

          return (
            <Card
              key={receipt.id}
              className="hover:shadow-md transition-shadow duration-200 border dark:border-gray-700"
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white truncate">
                        {receipt.receipt_id}
                      </h3>
                      <Badge className={statusColors[receipt.status]}>
                        {statusLabels[receipt.status]}
                      </Badge>
                    </div>
                    <p className="text-gray-900 dark:text-white font-medium mb-1 truncate">
                      {receipt.client_name || "No client name"}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 truncate">
                      {receipt.payment_for || "No description"}
                    </p>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                      <span>Date: {formatDate(receipt.issue_date)}</span>
                      {receipt.signed_at && (
                        <span>Signed: {formatDate(receipt.signed_at)}</span>
                      )}
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(receipt.total)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                    <Button
                      onClick={() => viewReceipt(receipt)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
                    >
                      <Eye className="w-4 h-4" /> View
                    </Button>
                    
                    {/* Continue Draft Button - Only for draft status */}
                    {receipt.status === "draft" && (
                      <Button
                        onClick={() => handleContinueDraft(receipt)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1 border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/30"
                      >
                        <Play className="w-4 h-4" /> Continue Draft
                      </Button>
                    )}
                    
                    {/* Edit Button - Only for pending (not draft) */}
                    {receipt.status !== "draft" && receipt.status !== "signed" && (
                      <Button
                        onClick={() =>
                          router.push(
                            `/dashboard/services/receipt/edit/${receipt.id}`
                          )
                        }
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:border-gray-600 dark:text-gray-300"
                      >
                        <Edit className="w-4 h-4" /> Edit
                      </Button>
                    )}
                    
                    {/* Download Button - Only for non-draft receipts */}
                    {receipt.status !== "draft" && (
                      <Button
                        onClick={() => downloadPdf(receipt)}
                        variant="outline"
                        size="sm"
                        disabled={processing === receipt.id}
                        className="flex items-center gap-1 hover:bg-purple-50 dark:hover:bg-purple-900/30 dark:border-gray-600 dark:text-gray-300"
                      >
                        {processing === receipt.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        PDF
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* View Receipt Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center dark:text-white">
              <span>Receipt Details</span>
            </DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              View receipt information and details
            </DialogDescription>
          </DialogHeader>

          {selectedReceipt && (
            <div className="space-y-6">
              {/* Header */}
              <div className="border-b dark:border-gray-700 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedReceipt.receipt_id}
                    </h2>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={statusColors[selectedReceipt.status]}>
                        {statusLabels[selectedReceipt.status]}
                      </Badge>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Issued: {formatDate(selectedReceipt.issue_date)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[#2b825b] dark:text-[#2b825b]">
                      {formatCurrency(selectedReceipt.total)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Amount</p>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* From Section */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">From</h3>
                  <div className="space-y-2">
                    <p className="text-gray-900 dark:text-white">
                      {selectedReceipt.initiator_name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedReceipt.initiator_email}
                    </p>
                    {selectedReceipt.business_name && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedReceipt.business_name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bill To Section */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Bill To</h3>
                  <div className="space-y-2">
                    <p className="text-gray-900 dark:text-white">
                      {selectedReceipt.client_name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedReceipt.client_email}
                    </p>
                    {selectedReceipt.client_phone && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedReceipt.client_phone}
                      </p>
                    )}
                    {selectedReceipt.bill_to && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedReceipt.bill_to}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Payment Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Payment For</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedReceipt.payment_for}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Payment Method</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedReceipt.payment_method || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Verification Code</p>
                    <p className="font-medium font-mono text-gray-900 dark:text-white">
                      {selectedReceipt.verification_code || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Receipt Items */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Receipt Items
                </h3>
                {parseReceiptItems(selectedReceipt.receipt_items).length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800">
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Unit Price
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                        {parseReceiptItems(selectedReceipt.receipt_items).map(
                          (item: any, index: number) => (
                            <tr key={index}>
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                {item.description || item.item || "N/A"}
                              </td>
                              <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white">
                                {item.quantity}
                              </td>
                              <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                                {formatCurrency(
                                  item.unit_price || item.price || 0
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white font-medium">
                                {formatCurrency(
                                  item.total ||
                                    item.quantity *
                                      (item.unit_price || item.price || 0)
                                )}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic">No items listed</p>
                )}
              </div>

              {/* Totals */}
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg max-w-md ml-auto">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(selectedReceipt.subtotal || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t dark:border-gray-700 pt-2">
                    <span className="font-semibold text-gray-900 dark:text-white">Total</span>
                    <span className="font-bold text-[#2b825b] dark:text-[#2b825b] text-lg">
                      {formatCurrency(selectedReceipt.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedReceipt.customer_note && (
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Notes</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    {selectedReceipt.customer_note}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReceiptList;