// app/components/previews/InvoicePreview.tsx
"use client";

import { Card } from "../ui/card";
import { Separator } from "../ui/separator";

interface InvoicePreviewProps {
  invoice: any;
}

export const InvoicePreview = ({ invoice }: InvoicePreviewProps) => {
  const items = Array.isArray(invoice.items) ? invoice.items : [];

  const hasSenderDetails =
    invoice.businessName || invoice.fromName || invoice.fromEmail || invoice.fromPhone;

  const hasClientDetails =
    invoice.billTo ||
    invoice.clientName ||
    invoice.clientEmail ||
    invoice.clientPhone;

  return (
    <Card className="p-4 bg-white dark:bg-gray-900 border-border dark:border-gray-800 h-full overflow-auto">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          {invoice.businessLogo && (
            <img
              src={invoice.businessLogo}
              alt="Business Logo"
              className="h-16 w-auto mx-auto mb-4"
            />
          )}
          <h2 className="text-3xl font-bold text-foreground dark:text-gray-100 mb-2">
            {invoice.businessName || "Your Business"}
          </h2>
          <p className="text-muted-foreground dark:text-gray-400">
            Payment Request
          </p>
          <div className="inline-block mt-2 px-4 py-1 bg-(--color-accent-yellow)/10 border border-(--color-accent-yellow) dark:border-(--color-accent-yellow) rounded-full">
            <span className="text-sm text-(--color-accent-yellow) dark:text-(--color-accent-yellow) font-semibold">
              #{invoice.invoiceNumber}
            </span>
          </div>
        </div>

        {/* Bill From */}
        {hasSenderDetails && (
          <div className="mb-4 p-4 bg-muted/50 dark:bg-gray-800 rounded-lg">
            <div className="text-xs font-semibold text-muted-foreground dark:text-gray-400 mb-2">
              BILL FROM
            </div>
            <div className="text-foreground dark:text-gray-200">
              <div className="font-bold text-lg">
                {invoice.businessName || "Your Business"}
              </div>
              {invoice.fromName &&
                invoice.fromName !== invoice.businessName && (
                  <div className="text-sm text-muted-foreground dark:text-gray-400">
                    Attn: {invoice.fromName}
                  </div>
                )}
              {invoice.fromEmail && (
                <div className="text-sm text-muted-foreground dark:text-gray-400">
                  {invoice.fromEmail}
                </div>
              )}
              {invoice.fromPhone && (
                <div className="text-sm text-muted-foreground dark:text-gray-400">
                  {invoice.fromPhone}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bill To */}
        {hasClientDetails && (
          <div className="mb-6 p-4 bg-muted/50 dark:bg-gray-800 rounded-lg">
            <div className="text-xs font-semibold text-muted-foreground dark:text-gray-400 mb-2">
              BILL TO
            </div>
            <div className="text-foreground dark:text-gray-200">
              {invoice.billTo && (
                <div className="font-bold text-lg mb-0.5">{invoice.billTo}</div>
              )}
              {invoice.clientName && (
                <div
                  className={
                    invoice.billTo
                      ? "text-sm text-muted-foreground dark:text-gray-400"
                      : "font-semibold"
                  }
                >
                  {invoice.billTo
                    ? `Attn: ${invoice.clientName}`
                    : invoice.clientName}
                </div>
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
        )}

        {/* Items */}
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

        {/* Totals */}
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
              <span className="text-foreground dark:text-gray-200">
                Amount Due
              </span>
              <span className="text-(--color-accent-yellow) dark:text-(--color-accent-yellow)">
                ₦{(invoice.total || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};