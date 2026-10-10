"use client";

import { useState, useMemo, useEffect } from "react";
import { useStore } from "@/app/context/StoreContext";
import { Search, Mail, Phone, Calendar, User, Wallet } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function CustomersList() {
  const { pages, loading } = useStore();
  const [search, setSearch] = useState("");
  const [customersData, setCustomersData] = useState<any[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);

  // ✅ Fetch real customer data from payments
  useEffect(() => {
    const fetchCustomers = async () => {
      if (pages.length === 0) {
        setCustomersData([]);
        setIsLoadingCustomers(false);
        return;
      }

      setIsLoadingCustomers(true);
      
      try {
        const pageIds = pages.map(p => p.id);
        
        // Fetch all payments for these pages
        const { data: payments, error } = await supabase
          .from("payment_page_payments")
          .select("*")
          .in("payment_page_id", pageIds)
          .eq("status", "completed")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching payments:", error);
          setCustomersData([]);
          setIsLoadingCustomers(false);
          return;
        }

        if (!payments || payments.length === 0) {
          setCustomersData([]);
          setIsLoadingCustomers(false);
          return;
        }

        // Build customer map from payments
        const customerMap = new Map();

        payments.forEach((payment: any) => {
          const customerEmail = payment.customer_email || payment.email;
          const customerName = payment.customer_name || payment.name || "Anonymous";
          const key = customerEmail || customerName;
          
          if (!customerMap.has(key)) {
            customerMap.set(key, {
              id: payment.id || `cust-${Date.now()}-${Math.random()}`,
              name: customerName,
              email: customerEmail || null,
              phone: payment.customer_phone || payment.phone || null,
              totalSpent: 0,
              orders: 0,
              lastOrder: payment.paid_at || payment.created_at || new Date().toISOString(),
              pageTitle: "",
              payments: [],
            });
          }

          const customer = customerMap.get(key);
          const amount = payment.amount || payment.total_amount || 0;
          customer.totalSpent += amount;
          customer.orders += 1;
          customer.payments.push(payment);
          
          // Find the page title for this payment
          const page = pages.find(p => p.id === payment.payment_page_id);
          if (page && !customer.pageTitle) {
            customer.pageTitle = page.title;
          }
          
          // Update last order date if this payment is newer
          const paymentDate = payment.paid_at || payment.created_at;
          if (paymentDate && paymentDate > customer.lastOrder) {
            customer.lastOrder = paymentDate;
          }
        });

        // Convert to array and sort by total spent (highest first)
        let result = Array.from(customerMap.values());
        
        // Filter by search
        if (search) {
          const searchLower = search.toLowerCase();
          result = result.filter(c =>
            c.name.toLowerCase().includes(searchLower) ||
            (c.email && c.email.toLowerCase().includes(searchLower)) ||
            (c.phone && c.phone.includes(search))
          );
        }

        setCustomersData(result.sort((a, b) => b.totalSpent - a.totalSpent));
      } catch (error) {
        console.error("Error fetching customers:", error);
        setCustomersData([]);
      } finally {
        setIsLoadingCustomers(false);
      }
    };

    fetchCustomers();
  }, [pages, search]);

  const isLoading = loading || isLoadingCustomers;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-muted/50 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-12 bg-muted/50 rounded-2xl animate-pulse" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-muted/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const totalCustomers = customersData.length;
  const totalRevenue = customersData.reduce((sum, c) => sum + c.totalSpent, 0);
  const avgOrders = customersData.length > 0
    ? Math.round(customersData.reduce((sum, c) => sum + c.orders, 0) / customersData.length)
    : 0;

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl bg-card border border-border p-4">
          <p className="text-sm text-muted-foreground">Total Customers</p>
          <p className="text-2xl font-bold">{totalCustomers}</p>
        </div>
        <div className="rounded-2xl bg-card border border-border p-4">
          <p className="text-sm text-muted-foreground">Average Orders</p>
          <p className="text-2xl font-bold">{avgOrders}</p>
        </div>
        <div className="rounded-2xl bg-card border border-border p-4">
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <p className="text-2xl font-bold">₦{totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
        />
      </div>

      {customersData.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-4xl mb-2">👤</p>
          <p>No customers found</p>
          <p className="text-sm mt-1">Customers will appear here when they make payments</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {customersData.map((customer) => (
            <div
              key={customer.id}
              className="rounded-2xl border border-border bg-card p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                    <User className="size-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{customer.name}</h3>
                    <p className="text-sm text-muted-foreground">{customer.pageTitle || "N/A"}</p>
                  </div>
                </div>
                <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-bold text-gold">
                  ₦{customer.totalSpent.toLocaleString()}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
                {customer.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="size-3.5" />
                    {customer.email}
                  </span>
                )}
                {customer.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="size-3.5" />
                    {customer.phone}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="size-3.5" />
                  Last: {new Date(customer.lastOrder).toLocaleDateString()}
                </span>
              </div>
              <div className="mt-3 flex gap-3 text-sm">
                <span className="bg-muted rounded-full px-3 py-1">
                  {customer.orders} order{customer.orders > 1 ? 's' : ''}
                </span>
                {customer.payments && customer.payments.length > 0 && (
                  <span className="bg-muted rounded-full px-3 py-1 flex items-center gap-1">
                    <Wallet className="size-3.5" />
                    {customer.payments.length} payment{customer.payments.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}