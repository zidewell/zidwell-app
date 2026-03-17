"use client";

import { Card } from "../ui/card";
import { Separator } from "../ui/separator";
import { Progress } from "../ui/progress";

interface InvoicePreviewProps {
  invoice: any;
}

export const InvoicePreview = ({ invoice }: InvoicePreviewProps) => {
  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const paymentProgress =
    invoice.allowMultiplePayments && invoice.targetQuantity
      ? (invoice.paidQuantity / invoice.targetQuantity) * 100
      : 0;

  return (
    <Card className="p-4 bg-white dark:bg-gray-900 border-border dark:border-gray-800 h-full overflow-auto">
      <div className="max-w-xl mx-auto">
        {/* Header - Payment Page Style */}
        <div className="text-center mb-8">
          {invoice.businessLogo && (
            <img
              src={invoice.businessLogo}
              alt="Business Logo"
              className="h-16 w-auto mx-auto mb-4"
            />
          )}
          <h2 className="text-3xl font-bold text-foreground dark:text-gray-100 mb-2">
            {invoice.businessName}
          </h2>
          <p className="text-muted-foreground dark:text-gray-400">Payment Request</p>
          <div className="inline-block mt-2 px-4 py-1 bg-[#2b825b]/10 border border-[#2b825b] dark:border-[#2b825b] rounded-full">
            <span className="text-sm text-[#2b825b] dark:text-[#2b825b] font-semibold">
              #{invoice.invoiceNumber}
            </span>
          </div>
        </div>

        {/* Client Details - Only if filled */}
        {(invoice.clientName || invoice.clientEmail || invoice.clientPhone) && (
          <>
            <div className="mb-6 p-4 bg-muted/50 dark:bg-gray-800 rounded-lg">
              <div className="text-xs font-semibold text-muted-foreground dark:text-gray-400 mb-2">
                BILL TO
              </div>
              <div className="text-foreground dark:text-gray-200">
                {invoice.clientName && (
                  <div className="font-semibold">{invoice.clientName}</div>
                )}
                {invoice.clientEmail && (
                  <div className="text-sm text-muted-foreground dark:text-gray-400">
                    {invoice.clientEmail}
                  </div>
                )}
                {invoice.clientPhone && (
                  <div className="text-sm text-muted-foreground dark:text-gray-400">
                    {invoice.clientPhone}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Items - Payment Page Style */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 text-foreground dark:text-gray-200">
            Payment Details
          </h3>
          <div className="space-y-3">
            {items.length > 0 ? (
              items.map((item: any) => (
                <div
                  key={item.id}
                  className="flex justify-between items-start p-3 bg-muted/30 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium text-foreground dark:text-gray-200">
                      {item.description || "Item description"}
                    </div>
                    <div className="text-sm text-muted-foreground dark:text-gray-400">
                      {item.quantity} × ₦
                      {(item.unitPrice || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="font-semibold text-foreground dark:text-gray-200">
                    ₦{(item.total || 0).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground dark:text-gray-400 py-8 bg-muted/30 dark:bg-gray-800 rounded-lg">
                No items added to this invoice
              </div>
            )}
          </div>
        </div>

        {/* Totals - Card Style */}
        <div className="p-6 bg-muted/50 dark:bg-gray-800 rounded-lg border border-border dark:border-gray-700">
          <div className="space-y-2">
            <div className="flex justify-between text-foreground dark:text-gray-200">
              <span>Subtotal</span>
              <span>₦{(invoice.subtotal || 0).toLocaleString()}</span>
            </div>
            {invoice.tax > 0 && (
              <div className="flex justify-between text-foreground dark:text-gray-200">
                <span>Tax</span>
                <span>₦{(invoice.tax || 0).toLocaleString()}</span>
              </div>
            )}
            <Separator className="my-3 bg-border dark:bg-gray-700" />
            <div className="flex justify-between text-2xl font-bold">
              <span className="text-foreground dark:text-gray-200">Amount Due</span>
              <span className="text-[#2b825b] dark:text-[#2b825b]">
                ₦{(invoice.total || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};