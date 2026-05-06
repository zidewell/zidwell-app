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
    unpaid: "bg-yellow-100 text-yellow-800",
    draft: "bg-gray-100 text-gray-800",
    paid: "bg-green-100 text-green-800",
    overdue: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-800",
    partially_paid: "bg-blue-100 text-blue-800",
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
      description: item.item_description || item.description || "Item description",
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

      const formatDate = (dateString: string): string => {
        try {
          const date = new Date(dateString);
          return isNaN(date.getTime()) ? dateString : date.toLocaleDateString();
        } catch {
          return dateString;
        }
      };

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice ${invoice.invoice_id}</title>
          <meta charset="UTF-8">
          <style>
            body { 
              font-family: 'Arial', sans-serif; 
              margin: 0;
              padding: 40px;
              color: #333;
              line-height: 1.6;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 40px;
              padding-bottom: 20px;
              border-bottom: 2px solid var(--color-accent-yellow);
            }
            h1 {
              color: var(--color-accent-yellow);
              margin: 0 0 10px 0;
              font-size: 32px;
              font-weight: bold;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              background-color: var(--color-accent-yellow);
              color: var(--color-ink);
              border-radius: 20px;
              font-size: 12px;
              font-weight: bold;
              margin-left: 10px;
            }
            .progress-bar {
              background-color: #e0e0e0;
              border-radius: 10px;
              height: 10px;
              margin: 10px 0;
              overflow: hidden;
            }
            .progress-fill {
              background-color: var(--color-accent-yellow);
              height: 100%;
              transition: width 0.3s ease;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="business-info">
                <h2>${invoice.business_name || "Business Name"}</h2>
              </div>
              <div class="invoice-info">
                <h1>INVOICE</h1>
                <p><strong>Invoice #:</strong> ${invoice.invoice_id}</p>
                <p><strong>Status:</strong> ${invoice.status} <span class="status-badge">${(invoice.status || "").toUpperCase()}</span></p>
              </div>
            </div>
            <!-- Rest of invoice content -->
          </div>
        </body>
        </html>
      `;

      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html: htmlContent,
          filename: `invoice-${invoice.invoice_id}.pdf`,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate PDF: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoice.invoice_id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      Swal.fire({
        icon: "success",
        title: "PDF Downloaded!",
        text: "Your invoice has been downloaded as PDF",
        confirmButtonColor: "var(--color-accent-yellow)",
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
      });
    } catch (error) {
      console.error("PDF download error:", error);
      Swal.fire({
        icon: "error",
        title: "Download Failed",
        text: error instanceof Error ? error.message : "Failed to download PDF. Please try again.",
        confirmButtonColor: "var(--color-accent-yellow)",
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
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
      <div className="flex items-center justify-center text-semibold text-[var(--text-secondary)]">
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
          <Card key={invoice.id} className="hover:shadow-md transition-shadow bg-[var(--bg-primary)] border border-[var(--border-color)] squircle-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg text-[var(--text-primary)]">
                      {invoice.invoice_id}
                    </h3>
                    <Badge className={statusColors[invoice.status] || "bg-gray-100 text-gray-800"}>
                      {invoice.status?.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-[var(--text-primary)] font-medium mb-1">
                    {invoice.client_name || invoice.bill_to || "No client name"}
                  </p>
                  <p className="text-[var(--text-secondary)] mb-2">{invoice.client_email}</p>

                  {invoice.allow_multiple_payments &&
                    !paymentProgress &&
                    invoice.paid_amount > 0 && (
                      <div className="mb-3 p-2 bg-green-50 rounded border border-green-200">
                        <p className="text-sm text-green-700">
                          <strong>Paid:</strong> ₦
                          {formatNumber(invoice.paid_amount)} of ₦
                          {formatNumber(totalAmount)}
                        </p>
                      </div>
                    )}

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--text-secondary)]">
                    <span>
                      Date: {new Date(invoice.issue_date).toLocaleDateString()}
                    </span>

                    <span className="font-semibold text-[var(--text-primary)]">
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
                      className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
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
                    className="border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
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
                    className="border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
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
                    className="border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-primary)] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto squircle-lg shadow-pop">
            <div className="sticky top-0 bg-[var(--bg-primary)] border-b border-[var(--border-color)] p-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Invoice Preview</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedInvoice(null)}
                className="border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
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