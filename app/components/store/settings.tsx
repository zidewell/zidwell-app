"use client";

import { useState } from "react";
import { useStore } from "@/app/context/StoreContext";
import { Save, Globe, Bell, Shield, CreditCard } from "lucide-react";
import { toast } from "sonner";

export function StoreSettings() {
  const { pages } = useStore();
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Settings saved successfully!");
    }, 1000);
  };

  return (
    <div className="max-w-4xl">
      <div className="space-y-6">
        <section className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
            <Globe className="size-5 text-gold" />
            Store Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1">
                Store Name
              </label>
              <input
                type="text"
                defaultValue="My Store"
                className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1">
                Store URL
              </label>
              <input
                type="text"
                defaultValue="mystore.zidwell.com"
                className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-4 rounded-2xl bg-gold px-6 py-2.5 text-sm font-bold text-gold-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Save className="size-4 inline mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
            <CreditCard className="size-5 text-gold" />
            Payment Settings
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div>
                <p className="font-semibold">Bank Transfer</p>
                <p className="text-sm text-muted-foreground">Accept bank transfers</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-gold transition-colors">
                  <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 peer-checked:translate-x-5 transition-transform" />
                </div>
              </label>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div>
                <p className="font-semibold">Card Payments</p>
                <p className="text-sm text-muted-foreground">Accept card payments</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-gold transition-colors">
                  <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 peer-checked:translate-x-5 transition-transform" />
                </div>
              </label>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div>
                <p className="font-semibold">USSD Payments</p>
                <p className="text-sm text-muted-foreground">Accept USSD payments</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-gold transition-colors">
                  <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 peer-checked:translate-x-5 transition-transform" />
                </div>
              </label>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
            <Bell className="size-5 text-gold" />
            Notifications
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div>
                <p className="font-semibold">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive payment updates via email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-gold transition-colors">
                  <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 peer-checked:translate-x-5 transition-transform" />
                </div>
              </label>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div>
                <p className="font-semibold">Push Notifications</p>
                <p className="text-sm text-muted-foreground">Receive push notifications on new payments</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-gold transition-colors">
                  <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 peer-checked:translate-x-5 transition-transform" />
                </div>
              </label>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
            <Shield className="size-5 text-gold" />
            Security
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1">
                Two-Factor Authentication
              </label>
              <button className="rounded-2xl border border-border px-4 py-2.5 text-sm hover:bg-muted transition-colors">
                Enable 2FA
              </button>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1">
                API Keys
              </label>
              <button className="rounded-2xl border border-border px-4 py-2.5 text-sm hover:bg-muted transition-colors">
                Generate API Key
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
