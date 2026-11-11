"use client";

import { useState, useEffect } from "react";
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
import type { PickupLocation } from "@/lib/delivery-utils";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  storeId: string;
  location?: PickupLocation | null;
}

export function PickupLocationModal({
  open,
  onClose,
  onSaved,
  storeId,
  location,
}: Props) {
  const [form, setForm] = useState({
    label: "",
    address: "",
    notes: "",
    phone: "",
    is_default: false,
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (location) {
      setForm({
        label: location.label,
        address: location.address,
        notes: location.notes ?? "",
        phone: location.phone ?? "",
        is_default: location.is_default,
        is_active: location.is_active,
      });
    } else {
      setForm({
        label: "",
        address: "",
        notes: "",
        phone: "",
        is_default: false,
        is_active: true,
      });
    }
    setError("");
  }, [location, open]);

  const set = (k: keyof typeof form, v: any) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async () => {
    setError("");
    if (!form.label.trim() || !form.address.trim()) {
      setError("Label and address are required.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        store_id: storeId,
        label: form.label.trim(),
        address: form.address.trim(),
        notes: form.notes.trim() || null,
        phone: form.phone.trim() || null,
        is_default: form.is_default,
        is_active: form.is_active,
      };

      const url = location
        ? `/api/store/pickup-locations/${location.id}`
        : "/api/store/pickup-locations";
      const method = location ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save location");

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
            {location ? "Edit Pickup Location" : "Add Pickup Location"}
          </DialogTitle>
          <DialogDescription>
            Customers will choose from these at checkout.
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
              placeholder="e.g. Lagos Mainline Shop, Kano Warehouse"
              value={form.label}
              onChange={(e) => set("label", e.target.value)}
            />
          </div>

          <div>
            <Label>Address *</Label>
            <Textarea
              rows={2}
              placeholder="e.g. 12 Broad Street, Lagos, Lagos"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
            />
          </div>

          <div>
            <Label>Notes (optional)</Label>
            <Textarea
              rows={2}
              placeholder="Hours, entry instructions, who to ask for."
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>

          <div>
            <Label>Phone (optional)</Label>
            <Input
              placeholder="08012345678"
              inputMode="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between border rounded-md p-3">
            <div>
              <p className="text-sm font-medium">Active</p>
              <p className="text-xs text-gray-500">
                Inactive locations are hidden at checkout
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
            {loading ? "Saving..." : location ? "Save Changes" : "Add Location"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}