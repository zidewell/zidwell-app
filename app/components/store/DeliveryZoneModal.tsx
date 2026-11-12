// app/components/store/DeliveryZoneModal.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Switch } from "@/app/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import type { DeliveryZone } from "@/lib/delivery-utils";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  storeId: string;
  zone?: DeliveryZone | null;
}

export function DeliveryZoneModal({
  open,
  onClose,
  onSaved,
  storeId,
  zone,
}: Props) {
  const [form, setForm] = useState({
    label: "",
    address: "",
    city: "",
    state: "",
    fee: "0",
    free_threshold: "0",
    notes: "",
    is_default: false,
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (zone) {
      setForm({
        label: zone.label,
        address: zone.address,
        city: zone.city ?? "",
        state: zone.state ?? "",
        fee: String(zone.fee ?? 0),
        free_threshold: String(zone.free_threshold ?? 0),
        notes: zone.notes ?? "",
        is_default: zone.is_default,
        is_active: zone.is_active,
      });
    } else {
      setForm({
        label: "",
        address: "",
        city: "",
        state: "",
        fee: "0",
        free_threshold: "0",
        notes: "",
        is_default: false,
        is_active: true,
      });
    }
    setError("");
  }, [zone, open]);

  const set = (k: keyof typeof form, v: any) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async () => {
    setError("");
    if (!form.label.trim() || !form.address.trim()) {
      setError("Label and address are required.");
      return;
    }
    const fee = Number(form.fee);
    const threshold = Number(form.free_threshold);
    if (!Number.isFinite(fee) || fee < 0) {
      setError("Delivery fee must be a valid number.");
      return;
    }
    if (!Number.isFinite(threshold) || threshold < 0) {
      setError("Free threshold must be a valid number.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        store_id: storeId,
        label: form.label.trim(),
        address: form.address.trim(),
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        fee,
        free_threshold: threshold,
        notes: form.notes.trim() || null,
        is_default: form.is_default,
        is_active: form.is_active,
      };

      const url = zone
        ? `/api/store/delivery-addresses/${zone.id}`
        : "/api/store/delivery-addresses";
      const method = zone ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save zone");

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {zone ? "Edit Delivery Zone" : "Add Delivery Zone"}
          </DialogTitle>
          <DialogDescription>
            Customers will select from these at checkout.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
              {error}
            </div>
          )}

          <div>
            <Label>Label *</Label>
            <Input
              placeholder="e.g. Lagos Island, Kano Central"
              value={form.label}
              onChange={(e) => set("label", e.target.value)}
            />
          </div>

          <div>
            <Label>Delivery Address *</Label>
            <Textarea
              rows={2}
              placeholder="e.g. 12 Broad Street, Lagos Island, Lagos"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>City (optional)</Label>
              <Input
                placeholder="Lagos"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
              />
            </div>
            <div>
              <Label>State (optional)</Label>
              <Input
                placeholder="Lagos"
                value={form.state}
                onChange={(e) => set("state", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Delivery Fee (₦) *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={form.fee}
                onChange={(e) => set("fee", e.target.value)}
              />
            </div>
            <div>
              <Label>Free Above (₦)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={form.free_threshold}
                onChange={(e) => set("free_threshold", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Notes (optional)</Label>
            <Textarea
              rows={2}
              placeholder="e.g. Delivers Mon–Sat, 2–3 days"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between border rounded-md p-3">
            <div>
              <p className="text-sm font-medium">Active</p>
              <p className="text-xs text-gray-500">
                Inactive zones are hidden at checkout
              </p>
            </div>
            <Switch
              checked={form.is_active}
              onCheckedChange={(v) => set("is_active", v)}
            />
          </div>

          <div className="flex items-center justify-between border rounded-md p-3">
            <div>
              <p className="text-sm font-medium">Set as Default</p>
              <p className="text-xs text-gray-500">Pre-selected at checkout</p>
            </div>
            <Switch
              checked={form.is_default}
              onCheckedChange={(v) => set("is_default", v)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : zone ? "Save Changes" : "Add Zone"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}