"use client";

import { Download, Edit, Eye, Loader2, Users } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { InvoicePreview } from "../previews/InvoicePreview";
import { useRouter } from "next/navigation";
import { useUserContextData } from "../../context/userData";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import Loader from "../Loader";

const getBase64Logo = async () => {
  const response = await fetch("/logo.png");
  const blob = await response.blob();

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const MySwal = withReactContent(Swal);

type Props = {
  invoices: any[];
  loading: boolean;
  onRefresh?: () => void;
};

const InvoiceList: React.FC<Props> = ({ invoices, loading, onRefresh }) => {
  const statusColors: Record<string, string> = {
    unpaid: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400",
    draft: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400",
    paid: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400",
    overdue: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400",
    cancelled: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400",
    partially_paid: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400",
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [processingInvoiceId, setProcessingInvoiceId] = useState<string | null>(
    null,
  );
  const { userData } = useUserContextData();
  const router = useRouter();
  const [base64Logo, setBase64Logo] = useState<string | null>(null);

  useEffect(() => {
    const loadLogo = async () => {
      const logo = await getBase64Logo();
      setBase64Logo(logo);
    };

    loadLogo();
  }, []);

  const transformInvoiceForPreview = (invoice: any) => {
    let invoiceItems: any[] = [];
    try {
      if (Array.isArray(invoice.invoice_items)) {
        invoiceItems = invoice.invoice_items;
      } else if (typeof invoice.invoice_items === "string") {
        invoiceItems = JSON.parse(invoice.invoice_items);
      }
    } catch (err) {
      invoiceItems = [];
    }

    const items = (invoiceItems || []).map((item: any, index: number) => ({
      id: item.id || `item-${index}-${Math.random()}`,
      description:
        item.item_description || item.description || "Item description",
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.unit_price || item.unitPrice || 0),
      total: Number(
        item.total_amount ||
          item.total ||
          (Number(item.quantity) || 1) *
            (Number(item.unit_price || item.unitPrice) || 0),
      ),
    }));

    const subtotal =
      invoice.subtotal ||
      items.reduce((sum: number, item: any) => sum + (item.total || 0), 0);

    const total = invoice.total_amount || subtotal + (invoice.fee_amount || 0);

    const transformedData = {
      id: invoice.id || `invoice-${Math.random()}`,
      invoiceNumber: invoice.invoice_id || "N/A",
      businessName: invoice.business_name || "Business Name",
      businessLogo: invoice.business_logo || "",
      clientName: invoice.client_name || "",
      clientEmail: invoice.client_email || "",
      clientPhone: invoice.client_phone || "",
      items: items,
      subtotal: subtotal || 0,
      tax: 0,
      total: total || 0,
      allowMultiplePayments: invoice.allow_multiple_payments || false,
      targetQuantity: invoice.target_quantity || 0,
      targetAmount: invoice.total_amount || total || 0,
      paidQuantity: invoice.paid_quantity || 0,
      paidAmount: invoice.paid_amount || 0,
      createdAt: invoice.created_at || new Date().toISOString(),
      status: invoice.status || "unpaid",
      redirectUrl: invoice.redirect_url || "",
    };

    return transformedData;
  };

  const getPaymentProgress = (invoice: any) => {
    if (
      invoice.allow_multiple_payments &&
      invoice.target_quantity &&
      invoice.target_quantity > 0
    ) {
      const paidCount = invoice.paid_quantity || 0;
      const progress = (paidCount / invoice.target_quantity) * 100;
      return {
        paidCount,
        targetQuantity: invoice.target_quantity,
        progress,
        isComplete: paidCount >= invoice.target_quantity,
      };
    }
    return null;
  };

  const getPaymentCountText = (invoice: any) => {
    if (invoice.allow_multiple_payments) {
      if (invoice.target_quantity && invoice.target_quantity > 0) {
        const paidCount = invoice.paid_quantity || 0;
        return `${paidCount}/${invoice.target_quantity} payments`;
      } else {
        const paidAmount = invoice.paid_amount || 0;
        const totalAmount = invoice.total_amount || 0;
        if (paidAmount > 0) {
          if (paidAmount >= totalAmount) {
            return "Fully paid";
          } else {
            return "Partially paid";
          }
        }
      }
    }
    return null;
  };

  const downloadPdf = async (invoice: any) => {
    try {
      setProcessingInvoiceId(invoice.id);

      const invoiceItems = Array.isArray(invoice.invoice_items)
        ? invoice.invoice_items
        : [];

      const subtotal =
        invoice.subtotal ||
        invoiceItems.reduce(
          (sum: number, item: any) =>
            sum +
            (item.quantity || 0) * (item.unit_price || item.unitPrice || 0),
          0,
        );

      const feeAmount = invoice.fee_amount || 0;
      const totalAmount = invoice.total_amount || subtotal + feeAmount;
      const paidAmount = invoice.paid_amount || 0;

      const paymentProgress = getPaymentProgress(invoice);
      const paymentCountText = getPaymentCountText(invoice);

      const htmlContent = `...`; // Your existing PDF HTML content

      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          html: htmlContent,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `invoice-${invoice.invoice_id}.pdf`;

      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      const isDark = document.documentElement.classList.contains('dark');
      
      Swal.fire({
        icon: "success",
        title: "PDF Downloaded!",
        text: "Your invoice has been downloaded as PDF",
        confirmButtonColor: "#2b825b",
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f3f4f6' : '#333333',
      });
    } catch (error) {
      console.error("PDF download error:", error);
      const isDark = document.documentElement.classList.contains('dark');
      
      Swal.fire({
        icon: "error",
        title: "Download Failed",
        text: "Failed to download PDF. Please try again.",
        confirmButtonColor: "#2b825b",
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f3f4f6' : '#333333',
      });
    } finally {
      setProcessingInvoiceId(null);
    }
  };

  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (pageLoading) {
    return <Loader />;
  }

  if (invoices.length === 0) {
    return (
      <div className="flex items-center justify-center text-semibold text-gray-600 dark:text-gray-400">
        No invoices records
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {invoices?.map((invoice) => {
        const invoiceItems = Array.isArray(invoice.invoice_items)
          ? invoice.invoice_items
          : [];

        const totalAmount =
          invoice.total_amount ||
          invoiceItems.reduce(
            (sum: number, item: any) =>
              sum +
              (item.quantity || 0) * (item.unit_price || item.unitPrice || 0),
            0,
          );

        const paymentProgress = getPaymentProgress(invoice);
        const paymentCountText = getPaymentCountText(invoice);

        return (
          <Card key={invoice.id} className="hover:shadow-md transition-shadow bg-white dark:bg-gray-900 border-border dark:border-gray-800">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                      {invoice.invoice_id}
                    </h3>
                    <Badge
                      className={statusColors[invoice.status] || "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400"}
                    >
                      {invoice.status?.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-gray-900 dark:text-gray-200 font-medium mb-1">
                    {invoice.client_name || invoice.bill_to || "No client name"}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">{invoice.client_email}</p>

                  {invoice.allow_multiple_payments &&
                    !paymentProgress &&
                    invoice.paid_amount > 0 && (
                      <div className="mb-3 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                        <p className="text-sm text-green-700 dark:text-green-400">
                          <strong>Paid:</strong> ₦
                          {formatNumber(invoice.paid_amount)} of ₦
                          {formatNumber(totalAmount)}
                        </p>
                      </div>
                    )}

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                    <span>
                      Date: {new Date(invoice.issue_date).toLocaleDateString()}
                    </span>

                    <span className="font-semibold text-gray-900 dark:text-gray-200">
                      ₦{formatNumber(totalAmount)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                  {invoice.status === "draft" && (
                    <Button
                      onClick={() => {
                        router.push(
                          `/dashboard/services/create-invoice/create?draftId=${invoice.id}`,
                        );
                      }}
                      variant="outline"
                      size="sm"
                      className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-800"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Draft
                    </Button>
                  )}

                  <Button
                    onClick={() =>
                      setSelectedInvoice(transformInvoiceForPreview(invoice))
                    }
                    variant="outline"
                    size="sm"
                    className="border-border dark:border-gray-700 text-foreground dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>

                  <Button
                    onClick={() =>
                      router.push(
                        `/dashboard/services/create-invoice/invoice/edit/${invoice.id}`,
                      )
                    }
                    variant="outline"
                    size="sm"
                    disabled={
                      invoice.status === "paid" || invoice.status === "draft"
                    }
                    className="border-border dark:border-gray-700 text-foreground dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>

                  <Button
                    onClick={() => downloadPdf(invoice)}
                    variant="outline"
                    size="sm"
                    disabled={
                      processingInvoiceId === invoice.id ||
                      invoice.status === "draft"
                    }
                    className="border-border dark:border-gray-700 text-foreground dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    {processingInvoiceId === invoice.id ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-1" />
                    )}
                    PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-border dark:border-gray-800 p-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Invoice Preview</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedInvoice(null)}
                className="border-border dark:border-gray-700 text-foreground dark:text-gray-200"
              >
                Close
              </Button>
            </div>
            <InvoicePreview invoice={selectedInvoice} />
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceList;