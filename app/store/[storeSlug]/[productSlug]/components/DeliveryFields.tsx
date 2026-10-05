// app/store/[storeSlug]/[productSlug]/components/DeliveryFields.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { Label } from "@/app/components/ui/label";
import { Badge } from "@/app/components/ui/badge";
import { DeliveryAddress, sortAddresses } from "@/lib/delivery-utils";
import type { FulfillmentSelection } from "../hooks/useProductCheckout";

interface Props {
  storeId: string;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  pickupAddress?: string | null;
  pickupNotes?: string | null;
  deliveryNotes?: string | null;
  value: FulfillmentSelection;
  onChange: (selection: FulfillmentSelection) => void;
  disabled?: boolean;
  error?: string;
}

export function DeliveryFields({
  storeId,
  deliveryEnabled,
  pickupEnabled,
  pickupAddress,
  pickupNotes,
  deliveryNotes,
  value,
  onChange,
  disabled = false,
  error,
}: Props) {
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!deliveryEnabled) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/payment-page/public/delivery-addresses?storeId=${storeId}`,
          { cache: "no-store" },
        );
        if (!res.ok) throw new Error("Failed to load delivery addresses");
        const data = await res.json();
        if (cancelled) return;
        const list = sortAddresses(data.addresses ?? []);
        setAddresses(list);
      } catch (err) {
        console.error("Delivery addresses load failed:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [storeId, deliveryEnabled]);

  useEffect(() => {
    if (!deliveryEnabled) return;
    if (value.address) return;
    if (addresses.length === 0) return;
    const preferred = addresses.find((a) => a.is_default) ?? addresses[0];
    onChange({
      method: "delivery",
      address: preferred,
      fee: Number(preferred.delivery_fee ?? 0),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addresses.length, deliveryEnabled]);

  const selectedAddress = useMemo(
    () => addresses.find((a) => a.id === value.address?.id) ?? null,
    [addresses, value.address?.id],
  );

  if (!deliveryEnabled && !pickupEnabled) {
    return (
      <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        This store has not enabled delivery or pickup. Please contact the
        seller.
      </div>
    );
  }

  if (!deliveryEnabled && pickupEnabled) {
    return (
      <div className="mt-6 space-y-2">
        <Label className="text-sm font-medium">Fulfillment</Label>
        <div className="rounded-md border bg-muted/30 p-3 text-sm">
          <p className="font-medium">Local Pickup</p>
          {pickupAddress && (
            <p className="mt-1 text-foreground/70">{pickupAddress}</p>
          )}
          {pickupNotes && (
            <p className="mt-1 text-xs text-foreground/50">{pickupNotes}</p>
          )}
        </div>
      </div>
    );
  }

  if (deliveryEnabled && !pickupEnabled) {
    return (
      <div className="mt-6 space-y-3">
        <Label className="text-sm font-medium">Delivery location</Label>
        {loading ? (
          <p className="text-sm text-foreground/50">Loading…</p>
        ) : addresses.length === 0 ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            No delivery addresses configured. Please contact the seller.
          </div>
        ) : addresses.length === 1 ? (
          <SingleAddressCard address={addresses[0]} />
        ) : (
          <AddressRadioList
            addresses={addresses}
            value={value.address?.id ?? null}
            onChange={(id) => {
              const a = addresses.find((x) => x.id === id) ?? null;
              onChange({
                method: "delivery",
                address: a,
                fee: Number(a?.delivery_fee ?? 0),
              });
            }}
            disabled={disabled}
          />
        )}
        {deliveryNotes && (
          <p className="text-xs text-foreground/50">{deliveryNotes}</p>
        )}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <Label className="text-sm font-medium">
        How would you like to receive your order?
      </Label>

      <RadioGroup
        value={value.method}
        onValueChange={(v) => {
          const nextMethod = v as "delivery" | "pickup";
          if (nextMethod === "pickup") {
            onChange({ method: "pickup", address: null, fee: 0 });
          } else {
            const preferred =
              selectedAddress ??
              addresses.find((a) => a.is_default) ??
              addresses[0] ??
              null;
            onChange({
              method: "delivery",
              address: preferred,
              fee: Number(preferred?.delivery_fee ?? 0),
            });
          }
        }}
        disabled={disabled}
      >
        <div className="flex items-center space-x-2 rounded-md border p-3">
          <RadioGroupItem value="delivery" id="m-delivery" disabled={disabled} />
          <Label htmlFor="m-delivery" className="cursor-pointer">
            Delivery
          </Label>
        </div>
        <div className="flex items-center space-x-2 rounded-md border p-3">
          <RadioGroupItem value="pickup" id="m-pickup" disabled={disabled} />
          <Label htmlFor="m-pickup" className="cursor-pointer">
            Local Pickup
          </Label>
        </div>
      </RadioGroup>

      {value.method === "delivery" && (
        <div className="pl-4">
          {loading ? (
            <p className="text-sm text-foreground/50">Loading…</p>
          ) : addresses.length === 0 ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              No delivery addresses configured.
            </div>
          ) : addresses.length === 1 ? (
            <SingleAddressCard address={addresses[0]} />
          ) : (
            <AddressRadioList
              addresses={addresses}
              value={value.address?.id ?? null}
              onChange={(id) => {
                const a = addresses.find((x) => x.id === id) ?? null;
                onChange({
                  method: "delivery",
                  address: a,
                  fee: Number(a?.delivery_fee ?? 0),
                });
              }}
              disabled={disabled}
            />
          )}
        </div>
      )}

      {value.method === "pickup" && (
        <div className="rounded-md border bg-muted/30 p-3 pl-4 text-sm">
          <p className="font-medium">Pickup location</p>
          {pickupAddress && (
            <p className="mt-1 text-foreground/70">{pickupAddress}</p>
          )}
          {pickupNotes && (
            <p className="mt-1 text-xs text-foreground/50">{pickupNotes}</p>
          )}
        </div>
      )}

      {deliveryNotes && (
        <p className="text-xs text-foreground/50">{deliveryNotes}</p>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function SingleAddressCard({ address }: { address: DeliveryAddress }) {
  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center justify-between">
        <span className="font-medium">{address.label}</span>
        {address.is_default && <Badge>Default</Badge>}
      </div>
      <p className="mt-1 text-sm text-foreground/70">
        {address.street_address}, {address.city}, {address.state}
      </p>
      <p className="mt-1 text-xs text-foreground/50">
        Delivery fee: ₦{Number(address.delivery_fee).toLocaleString()} • ~
        {address.estimated_days} day(s)
      </p>
    </div>
  );
}

function AddressRadioList({
  addresses,
  value,
  onChange,
  disabled,
}: {
  addresses: DeliveryAddress[];
  value: string | null;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <RadioGroup value={value ?? ""} onValueChange={onChange} disabled={disabled}>
      {addresses.map((addr) => (
        <div
          key={addr.id}
          className="flex cursor-pointer items-start space-x-3 rounded-md border p-3 hover:bg-muted/30"
        >
          <RadioGroupItem
            value={addr.id}
            id={`addr-${addr.id}`}
            className="mt-1"
            disabled={disabled}
          />
          <Label htmlFor={`addr-${addr.id}`} className="flex-1 cursor-pointer">
            <div className="flex items-center gap-2">
              <span className="font-medium">{addr.label}</span>
              {addr.is_default && <Badge>Default</Badge>}
            </div>
            <p className="mt-1 text-sm text-foreground/70">
              {addr.street_address}, {addr.city}, {addr.state}
            </p>
            <p className="mt-1 text-xs text-foreground/50">
              ₦{Number(addr.delivery_fee).toLocaleString()} • ~
              {addr.estimated_days} day(s)
            </p>
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}