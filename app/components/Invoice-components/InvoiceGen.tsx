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

  // ✅ totals - UPDATED to include partially_paid
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

  // UPDATED: Added partially_paid to status options
  const statusOptions = ["All", "Paid", "Unpaid", "Draft", "Partially Paid"];

  const filteredInvoices = invoices.filter((item) => {
    // normalize db value
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

  const handleInvoiceCreated = () => {
    if (userData?.email) {
      fetchInvoice(userData.email);
      setActiveTab("invoices");
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

  if (loading && invoices.length === 0) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards - UPDATED with partially paid */}
      {activeTab === "invoices" && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Total Invoiced</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₦{totalAmount.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Total Received</p>
                <p className="text-2xl font-bold text-green-600">
                  ₦{totalReceivedAmount.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  (Paid: ₦{paidAmount.toLocaleString()} + Partial: ₦
                  {partiallyPaidAmount.toLocaleString()})
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Paid Invoices</p>
                <p className="text-2xl font-bold text-green-600">
                  {paidInvoice}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Unpaid Invoices</p>
                <p className="text-2xl font-bold text-[#C29307]">
                  {unpaidInvoice}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Partially Paid</p>
                <p className="text-2xl font-bold text-blue-600">
                  {partiallyPaidInvoice}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap gap-2 mb-4">
          <TabsTrigger value="invoices">All Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-6">
          {/* Error Message */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <p className="text-red-700 text-sm">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
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
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  {/* Search Input */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search by invoice ID, client, or business..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full"
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
                            className="hover:bg-[#C29307] hover:text-white border hover:shadow-xl transition-all duration-300"
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
                        className="p-2"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>

                      {isMenuOpen && (
                        <div className="absolute right-0 top-full z-10 bg-white shadow-md rounded-lg mt-2 p-2 border border-gray-200 w-48">
                          {statusOptions.map((status) => {
                            const displayStatus =
                              status === "Partially Paid"
                                ? "partially paid"
                                : status.toLowerCase();
                            return (
                              <button
                                key={status}
                                className={`w-full text-left p-2 rounded mb-1 text-sm ${
                                  selectedStatus === displayStatus
                                    ? "bg-[#C29307] text-white"
                                    : "hover:bg-gray-100"
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
                    className="w-full sm:w-auto hover:bg-black bg-[#C29307] hover:shadow-xl transition-all duration-300"
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
