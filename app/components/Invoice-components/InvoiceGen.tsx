"use client";

import { useEffect, useState } from "react";
import { Plus, Search, MoreHorizontal } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import InvoiceLIst from "./InvoiceLIst";
import { useUserContextData } from "../../context/userData";
import Loader from "../Loader";
import { useRouter } from "next/navigation";

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

  useEffect(() => {
    if (userData?.email) {
      fetchInvoice(userData.email);
    }
  }, [userData?.email]);

  // totals
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

  const draftInvoice = invoices.filter(
    (inv) => inv.status?.toLowerCase() === "draft",
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

  if (loading && invoices.length === 0) {
    return <Loader />;
  }

  if (invoices.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">No Invoices Yet</h3>
          <p className="text-[var(--text-secondary)] mb-4">Get started by creating your first invoice</p>
          <Button
            className="bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90 transition-all duration-300 squircle-md"
            onClick={() => router.push("/dashboard/services/create-invoice/create")}
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
          <Card className="bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-soft squircle-lg">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm text-[var(--text-secondary)] mb-1">Total Invoiced</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  ₦{totalAmount.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-soft squircle-lg">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm text-[var(--text-secondary)] mb-1">Total Received</p>
                <p className="text-2xl font-bold text-[var(--color-lemon-green)]">
                  ₦{totalReceivedAmount.toLocaleString()}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  (Paid: ₦{paidAmount.toLocaleString()} + Partial: ₦
                  {partiallyPaidAmount.toLocaleString()})
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-soft squircle-lg">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm text-[var(--text-secondary)] mb-1">Paid Invoices</p>
                <p className="text-2xl font-bold text-[var(--color-lemon-green)]">
                  {paidInvoice}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-soft squircle-lg">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm text-[var(--text-secondary)] mb-1">Unpaid Invoices</p>
                <p className="text-2xl font-bold text-[var(--color-accent-yellow)]">
                  {unpaidInvoice}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-soft squircle-lg">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm text-[var(--text-secondary)] mb-1">Partially Paid</p>
                <p className="text-2xl font-bold text-blue-600">
                  {partiallyPaidInvoice}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap gap-2 mb-4 bg-[var(--bg-secondary)] rounded-xl p-1">
          <TabsTrigger 
            value="invoices" 
            className="data-[state=active]:bg-[var(--bg-primary)] data-[state=active]:text-[var(--color-accent-yellow)] text-[var(--text-secondary)] squircle-md"
          >
            All Invoices
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-6">
          {/* Error Message */}
          {error && (
            <Card className="border-[var(--destructive)]/30 bg-[var(--destructive)]/10 squircle-lg">
              <CardContent className="p-4">
                <p className="text-[var(--destructive)] text-sm">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 border-[var(--destructive)]/30 text-[var(--destructive)] hover:bg-[var(--destructive)]/10"
                  onClick={() =>
                    userData?.email && fetchInvoice(userData.email)
                  }
                >
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Search + Filter */}
          <Card className="bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-soft squircle-lg">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  {/* Search Input */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] w-4 h-4" />
                    <Input
                      placeholder="Search by invoice ID, client, or business..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)]"
                      style={{ outline: "none", boxShadow: "none" }}
                    />
                  </div>

                  {/* Status filter */}
                  <div className="flex flex-wrap gap-2">
                    {/* Desktop buttons */}
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
                                ? "bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90"
                                : "border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
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

                    {/* Mobile dropdown */}
                    <div className="sm:hidden relative">
                      <Button
                        onClick={() => setIsMenuOpen((prev) => !prev)}
                        variant="outline"
                        size="sm"
                        className="p-2 border-[var(--border-color)] text-[var(--text-secondary)]"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>

                      {isMenuOpen && (
                        <div className="absolute right-0 top-full z-10 bg-[var(--bg-primary)] shadow-pop rounded-lg mt-2 p-2 border border-[var(--border-color)] w-48 squircle-md">
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
                                    ? "bg-[var(--color-accent-yellow)] text-[var(--color-ink)]"
                                    : "hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
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

                {/* New Invoice button */}
                <div className="w-full sm:w-auto">
                  <Button
                    className="w-full sm:w-auto bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90 transition-all duration-300 squircle-md"
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

          {/* Invoice list */}
          <InvoiceLIst
            invoices={filteredInvoices}
            loading={loading}
            onRefresh={() => userData?.email && fetchInvoice(userData.email)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}