"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import Swal from "sweetalert2";
import Loader from "@/app/components/Loader";
import DashboardSidebar from "@/app/components/dashboard-component/DashboardSidebar";
import DashboardHeader from "@/app/components/dashboard-component/DashboardHeader";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface InvoiceForm {
  client_name: string;
  client_email: string;
  invoice_id: string;
  from_name: string;
  from_email: string;
  bill_to: string;
  issue_date: string;
  due_date: string;
  invoice_items: InvoiceItem[];
  message: string;
  business_name: string;
  business_logo?: string;
  client_phone?: string;
  status: string;
  total_amount: number;
  subtotal: number;
  fee_amount: number;
  fee_option: "absorbed" | "customer";
  payment_type: "single" | "multiple";
  allow_multiple_payments: boolean;
  redirect_url?: string;
  target_quantity: number;
}

export default function Page() {
  const { id } = useParams();
  const router = useRouter();
  const [form, setForm] = useState<InvoiceForm | null>(null);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const firstErrorRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await fetch(`/api/invoice/${id}`);
        if (!res.ok) {
          Swal.fire("Error", "Failed to fetch invoice", "error");
          return;
        }
        const data = await res.json();

        console.log(data);

        // Transform the data to match our form structure
        const transformedData: InvoiceForm = {
          client_name: data.client_name || "",
          client_email: data.client_email || "",
          invoice_id: data.invoice_id || "",
          from_name: data.from_name || "",
          from_email: data.from_email || "",
          bill_to: data.bill_to || "",
          issue_date: data.issue_date || "",
          due_date: data.due_date || "",
          message: data.message || "",
          business_name: data.business_name || "",
          business_logo: data.business_logo || "",
          client_phone: data.client_phone || "",
          status: data.status || "unpaid",
          total_amount: data.total_amount || 0,
          subtotal: data.subtotal || 0,
          fee_amount: data.fee_amount || 0,
          fee_option: data.fee_option || "customer",
          payment_type: data.payment_type || "single",
          allow_multiple_payments: data.allow_multiple_payments || false,
          redirect_url: data.redirect_url || "",
          target_quantity: data.target_quantity || 1, // ADDED: Default to 1
          invoice_items: (data.invoice_items || []).map((item: any) => ({
            id: item.id,
            description: item.item_description || "",
            quantity: Number(item.quantity) || 0,
            unitPrice: Number(item.unit_price) || 0,
            total: Number(item.total_amount) || 0,
          })),
        };

        setForm(transformedData);
      } catch (error) {
        console.error("Fetch error:", error);
        Swal.fire("Error", "Failed to fetch invoice", "error");
      }
    };

    if (id) fetchInvoice();
  }, [id]);

  console.log(form);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    if (!form) return;
    const { name, value, type } = e.target;

    // Handle checkbox separately
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => (prev ? { ...prev, [name]: checked } : null));
    } else {
      setForm((prev) => (prev ? { ...prev, [name]: value } : null));
    }
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    if (!form) return;

    const updatedItems = [...form.invoice_items];
    const updatedItem: any = { ...updatedItems[index] };

    updatedItem[field] = value;

    // Recalculate total if quantity or unitPrice changes
    if (field === "quantity" || field === "unitPrice") {
      updatedItem.total =
        Number(updatedItem.quantity) * Number(updatedItem.unitPrice);
    }

    updatedItems[index] = updatedItem;

    // Recalculate totals
    const subtotal = updatedItems.reduce(
      (sum, item) => sum + Number(item.total),
      0,
    );
    const feeAmount = form.fee_option === "customer" ? subtotal * 0.035 : 0;
    const totalAmount =
      form.fee_option === "customer" ? subtotal + feeAmount : subtotal;

    setForm({
      ...form,
      invoice_items: updatedItems,
      subtotal,
      fee_amount: feeAmount,
      total_amount: totalAmount,
    });
  };

  const addItem = () => {
    if (!form) return;

    const newItem: InvoiceItem = {
      id: `temp-${Date.now()}`,
      description: "",
      quantity: 1,
      unitPrice: 0,
      total: 0,
    };

    setForm({
      ...form,
      invoice_items: [...form.invoice_items, newItem],
    });
  };

  const removeItem = (index: number) => {
    if (!form) return;

    const updatedItems = form.invoice_items.filter((_, i) => i !== index);

    // Recalculate totals
    const subtotal = updatedItems.reduce(
      (sum, item) => sum + Number(item.total),
      0,
    );
    const feeAmount = form.fee_option === "customer" ? subtotal * 0.035 : 0;
    const totalAmount =
      form.fee_option === "customer" ? subtotal + feeAmount : subtotal;

    setForm({
      ...form,
      invoice_items: updatedItems,
      subtotal,
      fee_amount: feeAmount,
      total_amount: totalAmount,
    });
  };

  const handleUpdate = async () => {
    if (!form) return;

    setLoading(true);
    try {
      // Transform data back to match database schema
      const updateData = {
        client_name: form.client_name,
        client_email: form.client_email,
        bill_to: form.bill_to,
        issue_date: form.issue_date,
        due_date: form.due_date,
        message: form.message,
        business_name: form.business_name,
        client_phone: form.client_phone,
        redirect_url: form.redirect_url,
        subtotal: form.subtotal,
        fee_amount: form.fee_amount,
        total_amount: form.total_amount,
        fee_option: form.fee_option,
        payment_type: form.payment_type,
        allow_multiple_payments: form.allow_multiple_payments,
        target_quantity: form.target_quantity, // ADDED: Include target quantity
        // Transform invoice items to match database schema
        invoice_items: form.invoice_items.map((item) => ({
          id: item.id,
          item_description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_amount: item.total,
        })),
      };

      const res = await fetch(`/api/invoice/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const result = await res.json();
      setLoading(false);

      if (!res.ok) {
        return Swal.fire(
          "Error",
          result.message || "Failed to update invoice",
          "error",
        );
      }

      Swal.fire(
        "Success",
        result.message || "Invoice updated successfully",
        "success",
      );
    } catch (error) {
      setLoading(false);
      console.error("Update error:", error);
      Swal.fire("Error", "Failed to update invoice", "error");
    }
  };

  if (!form) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 fade-in relative">
        <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="lg:pl-72 min-h-screen flex flex-col">
          <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="flex justify-center items-center h-full">
              <Loader />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 fade-in relative">
      <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="lg:pl-72 min-h-screen flex flex-col">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            {/* Header with Back Button */}
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="text-[#2b825b] hover:bg-[#f0efe7] dark:hover:bg-gray-800 text-sm md:text-base"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="hidden md:block">Back</span>
              </Button>
              <h1 className="text-2xl md:text-3xl font-bold text-center flex-1 text-gray-900 dark:text-gray-100">
                Edit Invoice
              </h1>
              <div className="w-20"></div> {/* Spacer for balance */}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4 md:p-6 space-y-6">
              {/* Business Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="business_name"
                    className="block font-medium mb-2 dark:text-gray-300"
                  >
                    Business Name
                  </label>
                  <Input
                    id="business_name"
                    name="business_name"
                    value={form.business_name}
                    onChange={handleChange}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="invoice_id"
                    className="block font-medium mb-2 dark:text-gray-300"
                  >
                    Invoice ID
                  </label>
                  <Input
                    id="invoice_id"
                    name="invoice_id"
                    value={form.invoice_id}
                    disabled
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400"
                  />
                </div>
              </div>

              {/* Client Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="client_name"
                    className="block font-medium mb-2 dark:text-gray-300"
                  >
                    Client Name
                  </label>
                  <Input
                    id="client_name"
                    name="client_name"
                    value={form.client_name}
                    onChange={handleChange}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="client_email"
                    className="block font-medium mb-2 dark:text-gray-300"
                  >
                    Client Email
                  </label>
                  <Input
                    id="client_email"
                    name="client_email"
                    type="email"
                    value={form.client_email}
                    onChange={handleChange}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="client_phone"
                    className="block font-medium mb-2 dark:text-gray-300"
                  >
                    Client Phone
                  </label>
                  <Input
                    id="client_phone"
                    name="client_phone"
                    value={form.client_phone || ""}
                    onChange={handleChange}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label htmlFor="bill_to" className="block font-medium mb-2 dark:text-gray-300">
                    Bill To
                  </label>
                  <Input
                    id="bill_to"
                    name="bill_to"
                    value={form.bill_to}
                    onChange={handleChange}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="issue_date"
                    className="block font-medium mb-2 dark:text-gray-300"
                  >
                    Issue Date
                  </label>
                  <Input
                    id="issue_date"
                    name="issue_date"
                    type="date"
                    value={form.issue_date}
                    onChange={handleChange}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label htmlFor="due_date" className="block font-medium mb-2 dark:text-gray-300">
                    Due Date
                  </label>
                  <Input
                    id="due_date"
                    name="due_date"
                    type="date"
                    value={form.due_date}
                    onChange={handleChange}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  />
                </div>
              </div>

              {/* Payment Settings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div>
                  <label
                    htmlFor="payment_type"
                    className="block font-medium mb-2 dark:text-gray-300"
                  >
                    Payment Type
                  </label>
                  <select
                    id="payment_type"
                    name="payment_type"
                    value={form.payment_type}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                  >
                    <option value="single">Single Payment</option>
                    <option value="multiple">Multiple Payments</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="fee_option"
                    className="block font-medium mb-2 dark:text-gray-300"
                  >
                    Fee Option
                  </label>
                  <select
                    id="fee_option"
                    name="fee_option"
                    value={form.fee_option}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                  >
                    <option value="customer">Customer Pays Fee</option>
                    <option value="absorbed">Absorb Fee</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="target_quantity"
                    className="block font-medium mb-2 dark:text-gray-300"
                  >
                    Target Quantity
                  </label>
                  <Input
                    id="target_quantity"
                    name="target_quantity"
                    type="number"
                    min="1"
                    value={form.target_quantity}
                    onChange={handleChange}
                    placeholder="1"
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Number of times this invoice should be paid
                  </p>
                </div>
              </div>

              {/* Multiple Payments Toggle */}
              <div className="flex items-center space-x-2 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <input
                  type="checkbox"
                  id="allow_multiple_payments"
                  name="allow_multiple_payments"
                  checked={form.allow_multiple_payments}
                  onChange={handleChange}
                  className="w-4 h-4 text-[#2b825b] border-gray-300 rounded focus:ring-[#2b825b] dark:bg-gray-700 dark:border-gray-600"
                />
                <label
                  htmlFor="allow_multiple_payments"
                  className="font-medium dark:text-gray-300"
                >
                  Allow Multiple Payments
                </label>
              </div>

              {/* Invoice Items */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block font-medium dark:text-gray-300">Invoice Items</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addItem}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    + Add Item
                  </Button>
                </div>

                {form.invoice_items.map((item, index) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 gap-3 mb-3 items-center"
                  >
                    <div className="col-span-5">
                      <Input
                        value={item.description}
                        onChange={(e) =>
                          updateItem(index, "description", e.target.value)
                        }
                        placeholder="Item description"
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(index, "quantity", Number(e.target.value))
                        }
                        placeholder="Qty"
                        min="1"
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateItem(index, "unitPrice", Number(e.target.value))
                        }
                        placeholder="Price"
                        min="0"
                        step="0.01"
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        value={`₦${item.total.toLocaleString()}`}
                        disabled
                        placeholder="Total"
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400"
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-800 dark:bg-gray-700 dark:border-gray-600 dark:text-red-400 dark:hover:text-red-300"
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Totals Summary */}
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="dark:text-gray-300">Subtotal:</span>
                    <span className="dark:text-gray-100">₦{form.subtotal.toLocaleString()}</span>
                  </div>
                  {form.fee_amount > 0 && (
                    <div className="flex justify-between text-sm mt-1">
                      <span className="dark:text-gray-300">
                        Processing Fee (
                        {form.fee_option === "customer" ? "2%" : "Absorbed"}):
                      </span>
                      <span className="dark:text-gray-100">₦{form.fee_amount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold mt-2 pt-2 border-t dark:border-gray-600">
                    <span className="dark:text-gray-300">Total Amount:</span>
                    <span className="text-[#2b825b] dark:text-[#3aa873]">
                      ₦{form.total_amount.toLocaleString()}
                    </span>
                  </div>
                  {form.allow_multiple_payments && (
                    <div className="flex justify-between text-sm mt-2 pt-2 border-t dark:border-gray-600">
                      <span className="dark:text-gray-300">Target Quantity:</span>
                      <span className="font-medium dark:text-gray-100">
                        {form.target_quantity}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block font-medium mb-2 dark:text-gray-300">
                  Message
                </label>
                <Textarea
                  id="message"
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Message to client"
                  rows={3}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                />
              </div>

              {/* Redirect URL */}
              <div>
                <label
                  htmlFor="redirect_url"
                  className="block font-medium mb-2 dark:text-gray-300"
                >
                  Redirect URL (Optional)
                </label>
                <Input
                  id="redirect_url"
                  name="redirect_url"
                  type="url"
                  value={form.redirect_url || ""}
                  onChange={handleChange}
                  placeholder="https://example.com/thankyou"
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Redirect clients to this URL after successful payment
                </p>
              </div>

              <Button
                className="w-full bg-[#2b825b] hover:bg-[#1e5d42] text-white dark:bg-[#2b825b] dark:hover:bg-[#1e5f43]"
                onClick={handleUpdate}
                disabled={loading}
                size="lg"
              >
                {loading ? "Updating Invoice..." : "Update Invoice"}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}