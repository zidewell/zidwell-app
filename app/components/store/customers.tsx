"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/app/context/StoreContext";
import { Search, Mail, Phone, Calendar, User } from "lucide-react";

export function CustomersList() {
  const { pages, loading } = useStore();
  const [search, setSearch] = useState("");

  const customers = useMemo(() => {
    const customerMap = new Map();

    pages.forEach(page => {
      const count = Math.min(page.totalPayments || 0, 5);
      for (let i = 0; i < count; i++) {
        const id = `cust-${i}`;
        if (!customerMap.has(id)) {
          const date = new Date(page.createdAt);
          date.setDate(date.getDate() - i * 5);
          customerMap.set(id, {
            id,
            name: `Customer ${i + 1}`,
            email: `customer${i + 1}@example.com`,
            phone: `+234 80${String(70000000 + i * 100000).slice(0, 8)}`,
            totalSpent: Math.floor((page.price || 1000) * (0.5 + Math.random()) * (i + 1)),
            orders: i + 1,
            lastOrder: date.toISOString(),
            pageTitle: page.title,
          });
        }
      }
    });

    let filtered = Array.from(customerMap.values());
    if (search) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase())
      );
    }
    return filtered;
  }, [pages, search]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-12 bg-muted/50 rounded-2xl animate-pulse" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-20 bg-muted/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl bg-card border border-border p-4">
          <p className="text-sm text-muted-foreground">Total Customers</p>
          <p className="text-2xl font-bold">{customers.length}</p>
        </div>
        <div className="rounded-2xl bg-card border border-border p-4">
          <p className="text-sm text-muted-foreground">Average Orders</p>
          <p className="text-2xl font-bold">
            {customers.length > 0
              ? Math.round(customers.reduce((sum, c) => sum + c.orders, 0) / customers.length)
              : 0}
          </p>
        </div>
        <div className="rounded-2xl bg-card border border-border p-4">
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <p className="text-2xl font-bold">
            ₦{customers.reduce((sum, c) => sum + c.totalSpent, 0).toLocaleString()}
          </p>
        </div>
      </div>

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

      {customers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-4xl mb-2">👤</p>
          <p>No customers found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {customers.map((customer) => (
            <div
              key={customer.id}
              className="rounded-2xl border border-border bg-card p-4 hover:shadow-pop transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                    <User className="size-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{customer.name}</h3>
                    <p className="text-sm text-muted-foreground">{customer.pageTitle}</p>
                  </div>
                </div>
                <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-bold text-gold">
                  ₦{customer.totalSpent.toLocaleString()}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Mail className="size-3.5" />
                  {customer.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="size-3.5" />
                  {customer.phone}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="size-3.5" />
                  Last: {new Date(customer.lastOrder).toLocaleDateString()}
                </span>
              </div>
              <div className="mt-3 flex gap-3 text-sm">
                <span className="bg-muted rounded-full px-3 py-1">
                  {customer.orders} orders
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
