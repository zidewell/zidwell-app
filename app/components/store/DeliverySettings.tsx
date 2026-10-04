"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";
import { Textarea } from "@/app/components/ui/textarea";
import { Badge } from "@/app/components/ui/badge";
import Swal from "sweetalert2";
import { DeliveryAddressModal } from "./DeliveryAddressModal";
import { DeliveryAddress, sortAddresses } from "@/lib/delivery-utils";

interface StoreDeliverySettings {
  delivery_enabled: boolean;
  local_pickup_enabled: boolean;
  local_pickup_address: string | null;
  local_pickup_notes: string | null;
  delivery_notes: string | null;
}

interface Props {
  storeId: string;
  initialSettings: StoreDeliverySettings;
  onSettingsChange: (patch: Partial<StoreDeliverySettings>) => void;
}

export function DeliverySettings({
  storeId,
  initialSettings,
  onSettingsChange,
}: Props) {
  const [settings, setSettings] = useState<StoreDeliverySettings>(initialSettings);
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DeliveryAddress | null>(null);

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  const loadAddresses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/store/delivery-addresses?storeId=${storeId}`,
      );
      const data = await res.json();
      setAddresses(sortAddresses(data.addresses ?? []));
    } catch (err) {
      console.error("Load addresses failed:", err);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const persistSettings = async (patch: Partial<StoreDeliverySettings>) => {
    const previous = settings;
    const next = { ...settings, ...patch };
    setSettings(next);
    onSettingsChange(patch);

    setSavingSettings(true);
    try {
      const res = await fetch("/api/store/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryEnabled: next.delivery_enabled,
          localPickupEnabled: next.local_pickup_enabled,
          localPickupAddress: next.local_pickup_address,
          localPickupNotes: next.local_pickup_notes,
          deliveryNotes: next.delivery_notes,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
    } catch (err) {
      Swal.fire("Error", "Could not save delivery settings", "error");
      setSettings(previous);
      onSettingsChange(previous);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDelete = async (addr: DeliveryAddress) => {
    const confirm = await Swal.fire({
      title: "Delete this address?",
      text: `${addr.label} will be removed. This cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#d33",
    });
    if (!confirm.isConfirmed) return;

    const res = await fetch(`/api/store/delivery-addresses/${addr.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      Swal.fire({
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
        title: "Deleted",
      });
      loadAddresses();
    } else {
      Swal.fire("Error", "Failed to delete", "error");
    }
  };

  const handleSetDefault = async (addr: DeliveryAddress) => {
    const res = await fetch("/api/store/delivery-addresses/set-default", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: addr.id }),
    });
    if (res.ok) loadAddresses();
  };

  const activeCount = addresses.filter((a) => a.is_active).length;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between border rounded-lg p-4">
          <div>
            <p className="font-medium">Enable Delivery</p>
            <p className="text-sm text-gray-500">
              Allow customers to choose a delivery address at checkout
            </p>
          </div>
          <Switch
            checked={settings.delivery_enabled}
            onCheckedChange={(v) => persistSettings({ delivery_enabled: v })}
            disabled={savingSettings}
          />
        </div>

        <div className="flex items-center justify-between border rounded-lg p-4">
          <div>
            <p className="font-medium">Enable Local Pickup</p>
            <p className="text-sm text-gray-500">
              Let customers pick up their order from you
            </p>
          </div>
          <Switch
            checked={settings.local_pickup_enabled}
            onCheckedChange={(v) =>
              persistSettings({ local_pickup_enabled: v })
            }
            disabled={savingSettings}
          />
        </div>
      </div>

      {settings.delivery_enabled && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Delivery Addresses</h4>
              <p className="text-sm text-gray-500">
                Customers will select one of these at checkout
              </p>
            </div>
            <Button
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              + Add Address
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Loading addresses...
            </div>
          ) : addresses.length === 0 ? (
            <div className="border-2 border-dashed rounded-lg p-8 text-center text-gray-500">
              No delivery addresses yet. Add your first one so customers can
              order.
            </div>
          ) : (
            <div className="space-y-2">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="border rounded-lg p-4 flex items-start justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{addr.label}</span>
                      {addr.is_default && <Badge>Default</Badge>}
                      {!addr.is_active && (
                        <Badge className="bg-gray-200 text-gray-700">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {addr.contact_name} • {addr.contact_phone}
                    </p>
                    <p className="text-sm text-gray-500">
                      {addr.street_address}, {addr.city}, {addr.state}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      ₦{Number(addr.delivery_fee).toLocaleString()} • ~
                      {addr.estimated_days} day(s)
                    </p>
                  </div>

                  <div className="flex flex-col gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditing(addr);
                        setModalOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    {!addr.is_default && addr.is_active && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetDefault(addr)}
                      >
                        Set Default
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600"
                      onClick={() => handleDelete(addr)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {settings.delivery_enabled &&
            activeCount === 0 &&
            !loading &&
            addresses.length > 0 && (
              <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
                ⚠️ You have no active addresses. Customers won't be able to
                complete delivery orders.
              </div>
            )}
        </div>
      )}

      {settings.local_pickup_enabled && (
        <div className="space-y-3 border rounded-lg p-4">
          <h4 className="font-semibold">Local Pickup Details</h4>
          <div>
            <Label>Pickup Address</Label>
            <Textarea
              rows={2}
              value={settings.local_pickup_address ?? ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  local_pickup_address: e.target.value,
                })
              }
              onBlur={() =>
                persistSettings({
                  local_pickup_address: settings.local_pickup_address,
                })
              }
            />
          </div>
          <div>
            <Label>Pickup Notes (hours, instructions)</Label>
            <Textarea
              rows={2}
              value={settings.local_pickup_notes ?? ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  local_pickup_notes: e.target.value,
                })
              }
              onBlur={() =>
                persistSettings({
                  local_pickup_notes: settings.local_pickup_notes,
                })
              }
            />
          </div>
        </div>
      )}

      <div className="border rounded-lg p-4">
        <Label>Delivery Notes (shown to customers)</Label>
        <Textarea
          rows={2}
          placeholder="e.g. We deliver within 3-5 business days"
          value={settings.delivery_notes ?? ""}
          onChange={(e) =>
            setSettings({ ...settings, delivery_notes: e.target.value })
          }
          onBlur={() =>
            persistSettings({ delivery_notes: settings.delivery_notes })
          }
        />
      </div>

      <DeliveryAddressModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={loadAddresses}
        storeId={storeId}
        address={editing}
      />
    </div>
  );
}