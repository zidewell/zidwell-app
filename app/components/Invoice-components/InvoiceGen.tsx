"use client";

import { useEffect, useState } from "react";
import { Plus, Search, MoreHorizontal } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useRouter } from "next/navigation";
import { useUserContextData } from "@/app/context/userData";
import InvoiceList from "./InvoiceList";
import Loader from "../Loader";
import { generateInvoiceId } from "./utils/invoiceUtils";
import Swal from "sweetalert2";

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoice_id: string;
  user_id: string;
  order_reference: string;
  business_name: string;
  business_logo?: string;
  from_email: string;
  from_name: string;
  client_name?: string;
  client_email: string;
  client_phone?: string;
  bill_to?: string;
  issue_date: string;
  target_quantity: number;
  status:
    | "draft"
    | "unpaid"
    | "paid"
    | "overdue"
    | "cancelled"
    | "partially_paid";
  payment_type: "single" | "multiple";
  fee_option: "absorbed" | "customer";
  unit: number;
  allow_multiple_payments: boolean;
  subtotal: number;
  fee_amount: number;
  total_amount: number;
  paid_amount: number;
  message?: string;
  customer_note?: string;
  redirect_url?: string;
  payment_link: string;
  signing_link: string;
  public_token: string;
  created_at: string;
  updated_at: string;
  paid_at?: string;
  invoice_items: InvoiceItem[];
  initiator_account_name?: string;
  initiator_account_number?: string;
  initiator_bank_name?: string;
}

export default function InvoiceGen() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("invoices");
  const { userData } = useUserContextData();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchInvoice = async (email: string) => {
    setLoading(true);
    setError(null);

    try {
      if (!email) throw new Error("Email is required to fetch invoices");

      const res = await fetch("/api/get-invoices-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: email }),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.message || "Failed to fetch invoices");
      }

      const data = await res.json();
      if (!Array.isArray(data.invoices)) {
        throw new Error("Invalid data structure received from server");
      }

      setInvoices(data.invoices);
    } catch (err: any) {
      console.error("Error fetching invoices:", err);
      setError(err.message || "Something went wrong while fetching invoices");
    } finally {
      setLoading(false);
    }
  };

  const refreshInvoices = async () => {
    if (userData?.email) {
      await fetchInvoice(userData.email);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch("/api/delete-invoice", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ invoiceId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete invoice");
      }

      await refreshInvoices();
    } catch (error) {
      console.error("Delete error:", error);
      throw error;
    }
  };

  const handleMarkAsPaid = async (invoiceId: string) => {
    try {
      const response = await fetch("/api/invoice/mark-as-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to mark as paid");
      }

      await refreshInvoices();
    } catch (error) {
      console.error("Mark as paid error:", error);
      throw error;
    }
  };

  const handleDuplicateInvoice = async (invoice: Invoice) => {
    try {
      // Get the full invoice data including items
      const fullInvoice = invoices.find(inv => inv.id === invoice.id);
      
      if (!fullInvoice) {
        throw new Error("Invoice not found");
      }

      // Map invoice items to the correct format for the API
      const invoiceItems = (fullInvoice.invoice_items || []).map((item: any) => ({
        description: item.item_description || item.description || "",
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unit_price || item.unitPrice || 0),
        total: Number(item.total_amount || item.total || 0),
      }));

      // Calculate totals from items
      const subtotal = invoiceItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const feeAmount = fullInvoice.fee_option === "customer" ? fullInvoice.fee_amount || 0 : 0;
      const totalAmount = subtotal + feeAmount;

      const duplicatedData = {
        userId: userData?.id,
        initiator_email: userData?.email || '',
        initiator_name: userData?.fullName || userData?.email || '',
        invoice_id: generateInvoiceId(),
        signee_name: fullInvoice.client_name || '',
        signee_email: fullInvoice.client_email || '',
        message: fullInvoice.message || '',
        bill_to: fullInvoice.bill_to || '',
        issue_date: new Date().toISOString().slice(0, 10),
        customer_note: fullInvoice.customer_note || '',
        invoice_items: invoiceItems,
        total_amount: totalAmount,
        payment_type: fullInvoice.payment_type || 'single',
        fee_option: fullInvoice.fee_option || 'customer',
        status: 'draft',
        business_logo: fullInvoice.business_logo || '',
        redirect_url: fullInvoice.redirect_url || '',
        business_name: fullInvoice.business_name || '',
        target_quantity: fullInvoice.target_quantity || 1,
        is_draft: true,
        clientPhone: fullInvoice.client_phone || '',
        send_email_automatically: true,
        initiator_account_number: fullInvoice.initiator_account_number || '',
        initiator_account_name: fullInvoice.initiator_account_name || '',
        initiator_bank_name: fullInvoice.initiator_bank_name || '',
      };

      const response = await fetch('/api/save-invoice-draft', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicatedData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to duplicate invoice');
      }

      await refreshInvoices();
      
      // Show success message
      await Swal.fire({
        icon: 'success',
        title: 'Duplicate Created!',
        text: 'Invoice has been duplicated as a draft. You can find it in your drafts.',
        confirmButtonColor: 'var(--color-accent-yellow)',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        customClass: {
          popup: 'squircle-lg',
        },
      });
    } catch (error) {
      console.error('Duplicate error:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (userData?.email) {
      fetchInvoice(userData.email);
    }
  }, [userData?.email]);

  const totalAmount = invoices?.reduce((sum, invoice) => {
    return sum + (invoice.total_amount || 0);
  }, 0);

  const paidAmount = invoices
    .filter((inv) => inv.status?.toLowerCase() === "paid")
    .reduce((sum, invoice) => {
      return sum + (invoice.total_amount || 0);
    }, 0);

  const partiallyPaidAmount = invoices
    .filter((inv) => inv.status?.toLowerCase() === "partially_paid")
    .reduce((sum, invoice) => {
      return sum + (invoice.paid_amount || 0);
    }, 0);

  const totalReceivedAmount = paidAmount + partiallyPaidAmount;

  const paidInvoice = invoices.filter(
    (inv) => inv.status?.toLowerCase() === "paid",
  ).length;

  const unpaidInvoice = invoices.filter(
    (inv) => inv.status?.toLowerCase() === "unpaid",
  ).length;

  const partiallyPaidInvoice = invoices.filter(
    (inv) => inv.status?.toLowerCase() === "partially_paid",
  ).length;

  const statusOptions = ["All", "Paid", "Unpaid", "Draft", "Partially Paid"];

  const filteredInvoices = invoices.filter((item) => {
    const status = item.status?.toLowerCase().trim() || "";

    const statusMatch =
      selectedStatus === "all"
        ? true
        : selectedStatus === "partially paid"
          ? status === "partially_paid"
          : status === selectedStatus.toLowerCase();

    const searchMatch =
      searchTerm === "" ||
      item.invoice_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.client_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.business_name?.toLowerCase().includes(searchTerm.toLowerCase());

    return statusMatch && searchMatch;
  });

  if (!isMounted) {
    return null;
  }

  if (loading && invoices.length === 0) {
    return <Loader />;
  }

  if (invoices.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-(--text-primary) mb-2">
            No Invoices Yet
          </h3>
          <p className="text-(--text-secondary) mb-4">
            Get started by creating your first invoice
          </p>
          <Button
            className="bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90 transition-all duration-300 squircle-md"
            onClick={() =>
              router.push("/dashboard/services/create-invoice/create")
            }
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Invoice
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {activeTab === "invoices" && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <Card className="bg-(--bg-primary) border border-(--border-color) shadow-soft squircle-lg">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm text-(--text-secondary) mb-1">
                  Total Invoices
                </p>
                <p className="text-2xl font-bold text-(--text-primary)">
                  ₦{totalAmount.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-(--bg-primary) border border-(--border-color) shadow-soft squircle-lg">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm text-(--text-secondary) mb-1">
                  Total Received
                </p>
                <p className="text-2xl font-bold text-(--color-lemon-green)">
                  ₦{totalReceivedAmount.toLocaleString()}
                </p>
                <p className="text-xs text-(--text-secondary) mt-1">
                  (Paid: ₦{paidAmount.toLocaleString()} + Partial: ₦
                  {partiallyPaidAmount.toLocaleString()})
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-(--bg-primary) border border-(--border-color) shadow-soft squircle-lg">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm text-(--text-secondary) mb-1">
                  Paid Invoices
                </p>
                <p className="text-2xl font-bold text-(--color-lemon-green)">
                  {paidInvoice}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-(--bg-primary) border border-(--border-color) shadow-soft squircle-lg">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm text-(--text-secondary) mb-1">
                  Unpaid Invoices
                </p>
                <p className="text-2xl font-bold text-(--color-accent-yellow)">
                  {unpaidInvoice}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-(--bg-primary) border border-(--border-color) shadow-soft squircle-lg">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm text-(--text-secondary) mb-1">
                  Partially Paid
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {partiallyPaidInvoice}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap gap-2 mb-4 bg-(--bg-secondary) rounded-xl p-1">
          <TabsTrigger
            value="invoices"
            className="data-[state=active]:bg-(--bg-primary) data-[state=active]:text-(--color-accent-yellow) text-(--text-secondary) squircle-md"
          >
            All Invoices
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-6">
          {error && (
            <Card className="border-(--destructive)/30 bg-destructive/10 squircle-lg">
              <CardContent className="p-4">
                <p className="text-sm text-destructive">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 border-(--destructive)/30 text-destructive hover:bg-destructive/10"
                  onClick={() =>
                    userData?.email && fetchInvoice(userData.email)
                  }
                >
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="bg-(--bg-primary) border border-(--border-color) shadow-soft squircle-lg">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-(--text-secondary) w-4 h-4" />
                    <Input
                      placeholder="Search by invoice ID, client, or business..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:ring-(--color-accent-yellow) focus:border-(--color-accent-yellow)"
                      style={{ outline: "none", boxShadow: "none" }}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <div className="hidden sm:flex gap-2">
                      {statusOptions.map((status) => {
                        const lowercase = status.toLowerCase();
                        return (
                          <Button
                            key={status}
                            variant={
                              selectedStatus ===
                              (status === "Partially Paid"
                                ? "partially paid"
                                : lowercase)
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            className={
                              selectedStatus ===
                              (status === "Partially Paid"
                                ? "partially paid"
                                : lowercase)
                                ? "bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90"
                                : "border-(--border-color) text-(--text-secondary) hover:bg-(--bg-secondary)"
                            }
                            onClick={() =>
                              setSelectedStatus(
                                status === "Partially Paid"
                                  ? "partially paid"
                                  : lowercase,
                              )
                            }
                          >
                            {status}
                          </Button>
                        );
                      })}
                    </div>

                    <div className="sm:hidden relative">
                      <Button
                        onClick={() => setIsMenuOpen((prev) => !prev)}
                        variant="outline"
                        size="sm"
                        className="p-2 border-(--border-color) text-(--text-secondary)"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>

                      {isMenuOpen && (
                        <div className="absolute right-0 top-full z-10 bg-(--bg-primary) shadow-pop rounded-lg mt-2 p-2 border border-(--border-color) w-48 squircle-md">
                          {statusOptions.map((status) => {
                            const displayStatus =
                              status === "Partially Paid"
                                ? "partially paid"
                                : status.toLowerCase();
                            return (
                              <button
                                key={status}
                                className={`w-full text-left p-2 rounded mb-1 text-sm transition-colors ${
                                  selectedStatus === displayStatus
                                    ? "bg-(--color-accent-yellow) text-(--color-ink)"
                                    : "hover:bg-(--bg-secondary) text-(--text-secondary)"
                                }`}
                                onClick={() => {
                                  setSelectedStatus(displayStatus);
                                  setIsMenuOpen(false);
                                }}
                              >
                                {status}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="w-full sm:w-auto">
                  <Button
                    className="w-full sm:w-auto bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90 transition-all duration-300 squircle-md"
                    onClick={() =>
                      router.push("/dashboard/services/create-invoice/create")
                    }
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Invoice
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <InvoiceList
            invoices={filteredInvoices}
            loading={loading}
            onRefresh={refreshInvoices}
            onDelete={handleDeleteInvoice}
            onMarkAsPaid={handleMarkAsPaid}
            onDuplicate={handleDuplicateInvoice}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}