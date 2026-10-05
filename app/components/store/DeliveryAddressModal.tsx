"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Switch } from "@/app/components/ui/switch";
import { DeliveryAddress } from "@/lib/delivery-utils";

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo",
  "Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa",
  "Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba",
  "Yobe","Zamfara",
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  storeId: string;
  address?: DeliveryAddress | null;
}

export function DeliveryAddressModal({
  open,
  onClose,
  onSaved,
  storeId,
  address,
}: Props) {
  const [form, setForm] = useState({
    label: "",
    contact_name: "",
    contact_phone: "",
    street_address: "",
    city: "",
    state: "Lagos",
    country: "Nigeria",
    delivery_fee: "0",
    estimated_days: "3",
    is_default: false,
    is_active: true,
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (address) {
      setForm({
        label: address.label,
        contact_name: address.contact_name,
        contact_phone: address.contact_phone,
        street_address: address.street_address,
        city: address.city,
        state: address.state,
        country: address.country,
        delivery_fee: String(address.delivery_fee),
        estimated_days: String(address.estimated_days),
        is_default: address.is_default,
        is_active: address.is_active,
        notes: address.notes ?? "",
      });
    } else {
      setForm({
        label: "",
        contact_name: "",
        contact_phone: "",
        street_address: "",
        city: "",
        state: "Lagos",
        country: "Nigeria",
        delivery_fee: "0",
        estimated_days: "3",
        is_default: false,
        is_active: true,
        notes: "",
      });
    }
    setError("");
  }, [address, open]);

  const set = (k: keyof typeof form, v: any) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async () => {
    setError("");
    if (
      !form.label ||
      !form.contact_name ||
      !form.contact_phone ||
      !form.street_address ||
      !form.city ||
      !form.state
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        store_id: storeId,
        label: form.label.trim(),
        contact_name: form.contact_name.trim(),
        contact_phone: form.contact_phone.trim(),
        street_address: form.street_address.trim(),
        city: form.city.trim(),
        state: form.state,
        country: form.country,
        delivery_fee: Number(form.delivery_fee) || 0,
        estimated_days: Number(form.estimated_days) || 1,
        is_default: form.is_default,
        is_active: form.is_active,
        notes: form.notes.trim() || null,
      };

      const url = address
        ? `/api/store/delivery-addresses/${address.id}`
        : "/api/store/delivery-addresses";
      const method = address ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save address");

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
            {address ? "Edit Delivery Address" : "Add Delivery Address"}
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
              placeholder="e.g. Lagos Mainland, Abuja Office"
              value={form.label}
              onChange={(e) => set("label", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Contact Name *</Label>
              <Input
                value={form.contact_name}
                onChange={(e) => set("contact_name", e.target.value)}
              />
            </div>
            <div>
              <Label>Contact Phone *</Label>
              <Input
                value={form.contact_phone}
                onChange={(e) => set("contact_phone", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Street Address *</Label>
            <Textarea
              rows={2}
              value={form.street_address}
              onChange={(e) => set("street_address", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>City *</Label>
              <Input
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
              />
            </div>
            <div>
              <Label>State *</Label>
              <Select value={form.state} onValueChange={(v) => set("state", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NIGERIAN_STATES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Delivery Fee (₦)</Label>
              <Input
                type="number"
                min="0"
                value={form.delivery_fee}
                onChange={(e) => set("delivery_fee", e.target.value)}
              />
            </div>
            <div>
              <Label>Estimated Days</Label>
              <Input
                type="number"
                min="1"
                value={form.estimated_days}
                onChange={(e) => set("estimated_days", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Internal Notes</Label>
            <Textarea
              rows={2}
              placeholder="Optional notes for your team"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between border rounded-md p-3">
            <div>
              <p className="text-sm font-medium">Active</p>
              <p className="text-xs text-gray-500">
                Inactive addresses are hidden at checkout
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
            {loading ? "Saving..." : address ? "Save Changes" : "Add Address"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}