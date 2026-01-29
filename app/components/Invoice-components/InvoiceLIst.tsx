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
        // For invoices with target quantity
        const paidCount = invoice.paid_quantity || 0;
        return `${paidCount}/${invoice.target_quantity} payments`;
      } else {
        // For invoices without target quantity but with multiple payments
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
              border-bottom: 2px solid #C29307;
            }
            .business-info {
              flex: 1;
            }
            .invoice-info {
              text-align: right;
            }
            .logo {
              max-height: 80px;
              max-width: 200px;
              margin-bottom: 15px;
            }
              .accound-details {
             display: flex;
             flex-direction: column;
             gap: 10px;
            }
            .accound-details h2 {
            color: #C29307;;
            }
            h1 {
              color: #C29307;
              margin: 0 0 10px 0;
              font-size: 32px;
              font-weight: bold;
            }
            h2 {
              margin: 0 0 10px 0;
              font-size: 24px;
              color: #333;
            }
            h3 {
              margin: 0 0 15px 0;
              font-size: 18px;
              color: #333;
            }
            .section {
              margin: 30px 0;
            }
            .billing-info {
              display: flex;
              justify-content: space-between;
              gap: 40px;
            }
            .billing-section {
              flex: 1;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 30px 0;
              font-size: 14px;
            }
            .items-table th {
              background-color: #f8f9fa;
              border: 1px solid #ddd;
              padding: 12px 15px;
              text-align: left;
              font-weight: bold;
              color: #333;
            }
            .items-table td {
              border: 1px solid #ddd;
              padding: 12px 15px;
              text-align: left;
            }
            .items-table tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .totals {
              margin-top: 30px;
              text-align: right;
              font-size: 16px;
            }
            .total-row {
              margin: 8px 0;
            }
            .grand-total {
              font-size: 20px;
              font-weight: bold;
              color: #C29307;
              margin-top: 15px;
              padding-top: 15px;
              border-top: 2px solid #ddd;
            }
            .message-box {
              background-color: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              border-left: 4px solid #C29307;
              margin: 20px 0;
            }
            .payment-info {
              background-color: #e8f4fd;
              padding: 20px;
              border-radius: 8px;
              border-left: 4px solid #2196F3;
              margin: 20px 0;
            }
             .invoice-narration{
               margin-left: 30px;
              }
            .footer {
              margin-top: 50px;
              text-align: center;
              color: #666;
              font-size: 14px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              background-color: #C29307;
              color: white;
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
              background-color: #4CAF50;
              height: 100%;
              transition: width 0.3s ease;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="business-info">
                ${
                  invoice.business_logo
                    ? `<img src="${invoice.business_logo}" alt="${invoice.business_name}" class="logo">`
                    : ""
                }
                <h2>${invoice.business_name}</h2>
                <p>${invoice.from_email}</p>
                ${invoice.bill_to ? `<p>${invoice.bill_to}</p>` : ""}

                  <div class="account-details">

                  <h2>Account Details</h2>

          
                  <h3>${invoice.initiator_account_name}</h3>
                  <h3>${invoice.initiator_account_number}</h3>
                </div>
              </div>
              <div class="invoice-info">
                <h1>INVOICE</h1>
                <p><strong>Invoice #:</strong> ${invoice.invoice_id}</p>
                <p><strong>Issue Date:</strong> ${new Date(
                  invoice.issue_date,
                ).toLocaleDateString()}</p>
            
              </div>
                     <small class="invoice-narration">
                  Ensure this invoice number <strong>${
                    invoice.invoice_id
                  }</strong> is used as the narration when you transfer to make payment valid.
                </small>
            </div>

            <div class="section">
              <div class="billing-info">
                <div class="billing-section">
                  <h3>Bill To:</h3>
                  <p><strong>${
                    invoice.client_name || "Client Information"
                  }</strong></p>
                  ${
                    invoice.client_email
                      ? `<p>📧 ${invoice.client_email}</p>`
                      : ""
                  }
                  ${
                    invoice.client_phone
                      ? `<p>📞 ${invoice.client_phone}</p>`
                      : ""
                  }
                </div>
                <div class="billing-section">
                  <h3>From:</h3>
                  <p><strong>${invoice.from_name}</strong></p>
                  <p>📧 ${invoice.from_email}</p>
                </div>
              </div>
            </div>

            ${
              invoice.message
                ? `
            <div class="section">
              <div class="message-box">
                <h3>Message from ${invoice.from_name}:</h3>
                <p>${invoice.message}</p>
              </div>
            </div>
            `
                : ""
            }

           

            <div class="section">
              <h3>Invoice Items</h3>
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th width="100">Qty</th>
                    <th width="120">Unit Price</th>
                    <th width="120">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoiceItems
                    ?.map(
                      (item: any) => `
                    <tr>
                      <td>${item.item_description || item.description}</td>
                      <td>${item.quantity}</td>
                      <td>₦${Number(
                        item.unit_price || item.unitPrice,
                      ).toLocaleString()}</td>
                      <td>₦${Number(
                        item.total_amount || item.total,
                      ).toLocaleString()}</td>
                    </tr>
                  `,
                    )
                    .join("")}
                </tbody>
              </table>
            </div>

            <div class="totals">
              <div class="total-row">
                <strong>Subtotal:</strong> ₦${Number(subtotal).toLocaleString()}
              </div>
              ${
                feeAmount > 0
                  ? `
              <div class="total-row">
                <strong>Processing Fee:</strong> ₦${Number(
                  feeAmount,
                ).toLocaleString()}
              </div>
              `
                  : ""
              }
              ${
                paidAmount > 0
                  ? `
              <div class="total-row">
                <strong>Amount Paid:</strong> ₦${Number(
                  paidAmount,
                ).toLocaleString()}
              </div>
              <div class="total-row">
                <strong>Balance Due:</strong> ₦${Number(
                  totalAmount - paidAmount,
                ).toLocaleString()}
              </div>
              `
                  : ""
              }
              <div class="total-row grand-total">
                <strong>TOTAL AMOUNT:</strong> ₦${Number(
                  totalAmount,
                ).toLocaleString()}
              </div>
              ${
                invoice.fee_option === "absorbed"
                  ? `
              <div class="total-row" style="font-size: 12px; color: #666;">
                *Processing fees absorbed by merchant
              </div>
              `
                  : ""
              }
            </div>

            <div class="footer">
              <p><strong>Thank you for your business!</strong></p>
              <p>If you have any questions about this invoice, please contact ${
                invoice.from_email
              }</p>
              <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </body>
        </html>
      `;

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

      Swal.fire({
        icon: "success",
        title: "PDF Downloaded!",
        text: "Your invoice has been downloaded as PDF",
        confirmButtonColor: "#C29307",
      });
    } catch (error) {
      console.error("PDF download error:", error);
      Swal.fire({
        icon: "error",
        title: "Download Failed",
        text: "Failed to download PDF. Please try again.",
        confirmButtonColor: "#C29307",
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
      <div className="flex items-center justify-center text-semibold">
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
          <Card key={invoice.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">
                      {invoice.invoice_id}
                    </h3>
                    <Badge
                      className={
                        statusColors[invoice.status] ||
                        "bg-gray-100 text-gray-800"
                      }
                    >
                      {invoice.status?.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-gray-900 font-medium mb-1">
                    {invoice.client_name || invoice.bill_to || "No client name"}
                  </p>
                  <p className="text-gray-600 mb-2">{invoice.client_email}</p>

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

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                    <span>
                      Date: {new Date(invoice.issue_date).toLocaleDateString()}
                    </span>

                    <span className="font-semibold text-gray-900">
                      ₦{formatNumber(totalAmount)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                  {invoice.status === "draft" && (
                    <Button
                      onClick={() => {
                        // Navigate to create invoice page with draft ID parameter
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
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Invoice Preview</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedInvoice(null)}
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
