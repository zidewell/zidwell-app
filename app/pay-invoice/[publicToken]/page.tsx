import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { CreditCard } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import DownloadInvoiceButton from "../downloadButton";

import { ToastProvider } from "@/app/components/ui/toast";
import PaymentForm from "../../components/Invoice-components/PaymentForm";

// Types
interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface InvoiceData {
  id: string;
  business_name: string;
  business_logo: string;
  invoice_id: string;
  issue_date: string;
  due_date: string;
  from_name: string;
  from_email: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  bill_to: string;
  message: string;
  customer_note: string;
  invoice_items: InvoiceItem[];
  subtotal: number;
  fee_amount: number;
  total_amount: number;
  paid_amount: number;
  fee_option: string;
  status: string;
  allow_multiple_payments: boolean;
  unit: string;
  initiator_account_name: string;
  initiator_account_number: string;
  initiator_bank_name: string;
  created_at: string;
  paid_quantity?: number;
  target_quantity?: number;
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase environment variables");
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ publicToken: string }>;
}) {
  try {
    const { publicToken } = await params;

    if (!publicToken) {
      return notFound();
    }

    // Fetch invoice with error handling
    const { data: invoice, error } = await supabase
      .from("invoices")
      .select(
        `
        *,
        invoice_items (*)
      `,
      )
      .eq("public_token", publicToken)
      .single();

    if (error || !invoice) {
      console.error("Error fetching invoice:", error?.message);
      return notFound();
    }

    // Transform invoice items
    const items: InvoiceItem[] = (invoice.invoice_items || []).map(
      (dbItem: any) => ({
        id: dbItem.id,
        description: dbItem.item_description,
        quantity: dbItem.quantity,
        unitPrice: dbItem.unit_price,
        total: dbItem.total_amount,
      }),
    );

    // Prepare invoice data
    const invoiceData: InvoiceData = {
      id: invoice.id,
      business_name: invoice.business_name,
      business_logo: invoice.business_logo,
      invoice_id: invoice.invoice_id,
      issue_date: invoice.issue_date,
      due_date: invoice.due_date,
      from_name: invoice.from_name,
      from_email: invoice.from_email,
      client_name: invoice.client_name,
      client_email: invoice.client_email,
      client_phone: invoice.client_phone,
      bill_to: invoice.bill_to,
      message: invoice.message,
      customer_note: invoice.customer_note,
      invoice_items: items,
      subtotal: invoice.subtotal,
      fee_amount: invoice.fee_amount,
      total_amount: invoice.total_amount,
      paid_amount: invoice.paid_amount,
      fee_option: invoice.fee_option,
      status: invoice.status,
      allow_multiple_payments: invoice.allow_multiple_payments,
      unit: invoice.target_quantity,
      initiator_account_name: invoice.initiator_account_name,
      initiator_account_number: invoice.initiator_account_number,
      initiator_bank_name: invoice.initiator_bank_name,
      created_at: invoice.created_at,
      paid_quantity: invoice.paid_quantity,
      target_quantity: invoice.target_quantity,
    };

    return (
      <ToastProvider>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto py-12 px-4 max-w-3xl">
            {/* Header */}
            <HeaderSection invoice={invoice} />

            {/* Invoice Card */}
            <Card className="p-8 mb-6">
              {/* Business Header */}
              <BusinessHeaderSection invoice={invoice} />

              <Separator className="my-6" />

              {/* Payment Status */}
              {invoice.allow_multiple_payments && (
                <MultiplePaymentsSection invoice={invoice} />
              )}

              {/* Payment Form Component */}

              <PaymentForm
                invoiceId={invoice.invoice_id}
                status={invoiceData.status}
                allow_multiple_payments={invoiceData.allow_multiple_payments}
                amount={invoice.total_amount}
                initiatorAccountName={invoice.initiator_account_name}
                initiatorAccountNumber={invoice.initiator_account_number}
                initiatorBankName={invoice.initiator_bank_name}
              />

              {/* Client Information */}
              <ClientInformationSection invoice={invoice} />

              {/* Message */}
              {invoice.message && <MessageSection invoice={invoice} />}

              {/* Items */}
              <InvoiceItemsSection items={items} />

              <Separator className="my-6" />

              {/* Totals */}
              <TotalsSection invoice={invoice} />

              {/* Customer Note */}
              {invoice.customer_note && (
                <CustomerNoteSection invoice={invoice} />
              )}
            </Card>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DownloadInvoiceButton invoiceData={invoiceData} />
            </div>

            {/* Footer */}
            <FooterSection invoice={invoice} />
          </div>
        </div>
      </ToastProvider>
    );
  } catch (error) {
    console.error("Error in InvoicePage:", error);
    return notFound();
  }
}

// Helper Components
function HeaderSection({ invoice }: { invoice: any }) {
  return (
    <div className="text-center mb-8">
      <h1 className="text-3xl font-bold text-foreground mb-2">
        Invoice Details
      </h1>
      <p className="text-muted-foreground">
        Review invoice and proceed with payment
      </p>
    </div>
  );
}

function BusinessHeaderSection({ invoice }: { invoice: any }) {
  return (
    <div className="flex justify-between items-start mb-6">
      <div>
        {invoice.business_logo && (
          <img
            src={invoice.business_logo}
            alt="Business Logo"
            className="h-12 w-auto mb-2 rounded-lg"
          />
        )}
        <h2 className="text-xl font-bold text-foreground">
          {invoice.business_name}
        </h2>
      </div>
      <div className="text-right">
        <div className="text-sm">Invoice</div>
        <div className="text-lg font-bold text-[#2b825b]">
          #{invoice.invoice_id}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Due: {new Date(invoice.created_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}

function MultiplePaymentsSection({ invoice }: { invoice: any }) {
  return (
    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center">
        <div className="bg-blue-100 p-2 rounded-full mr-3">
          <CreditCard className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-blue-800">
            Multiple Payments Enabled
          </h3>
          <p className="text-sm text-blue-600 mt-1">
            This invoice allows multiple people to pay. Each person pays the
            full amount.
            {/* {invoice.target_quantity &&
              ` Target: ${invoice.paid_quantity || 0}/${
                invoice.target_quantity
              } paid`} */}
          </p>
        </div>
      </div>
    </div>
  );
}

function ClientInformationSection({ invoice }: { invoice: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div className="space-y-2">
        <h3 className="font-semibold text-foreground">Bill To</h3>
        <div className="text-sm text-muted-foreground">
          {invoice.client_name ? (
            <>
              <p className="font-medium text-foreground">
                {invoice.client_name}
              </p>
              {invoice.client_email && <p>{invoice.client_email}</p>}
              {invoice.client_phone && <p>{invoice.client_phone}</p>}
            </>
          ) : (
            <p>Your information will be used for billing</p>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold text-foreground">From</h3>
        <div className="text-sm text-muted-foreground">
          <p className="font-medium text-foreground">{invoice.from_name}</p>
          <p>{invoice.from_email}</p>
          {invoice.bill_to && <p className="mt-1">{invoice.bill_to}</p>}
        </div>
      </div>
    </div>
  );
}

function MessageSection({ invoice }: { invoice: any }) {
  return (
    <div className="mb-6 p-4 bg-muted/50 rounded-lg border">
      <h3 className="font-semibold text-foreground mb-2">
        Message from {invoice.from_name}
      </h3>
      <p className="text-sm text-muted-foreground">{invoice.message}</p>
    </div>
  );
}

function InvoiceItemsSection({ items }: { items: InvoiceItem[] }) {
  return (
    <div className="mb-6">
      <h3 className="font-semibold mb-4 text-foreground">Invoice Items</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <div className="flex-1">
              <div className="font-medium text-foreground">
                {item.description}
              </div>
              <div className="text-muted-foreground">
                {item.quantity} × ₦{item.unitPrice.toLocaleString()}
              </div>
            </div>
            <div className="font-semibold text-foreground">
              ₦{item.total.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TotalsSection({ invoice }: { invoice: any }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-foreground">
        <span>Subtotal</span>
        <span>₦{invoice.subtotal.toLocaleString()}</span>
      </div>
      {invoice.fee_amount > 0 && (
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            Processing Fee (
            {invoice.fee_option === "customer" ? "2%" : "Absorbed"})
          </span>
          <span>₦{invoice.fee_amount.toLocaleString()}</span>
        </div>
      )}
      <Separator className="my-3" />
      <div className="flex justify-between text-xl font-bold">
        <span className="text-foreground">Total Amount</span>
        <span className="text-[#2b825b]">
          ₦{invoice.total_amount.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

function CustomerNoteSection({ invoice }: { invoice: any }) {
  return (
    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <p className="text-sm text-blue-700">{invoice.customer_note}</p>
    </div>
  );
}

function FooterSection({ invoice }: { invoice: any }) {
  return (
    <div className="text-center mt-8">
      <p className="text-sm text-muted-foreground">
        Secured by{" "}
        <span className="text-[#2b825b] font-semibold">Zidwell Finance</span>
      </p>
      <p className="text-xs text-muted-foreground mt-2">
        Need help? Contact {invoice.from_email}
      </p>
    </div>
  );
}
