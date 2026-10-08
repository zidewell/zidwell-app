// app/store/[storeSlug]/[productSlug]/components/FulfillmentFields.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { cn } from "@/lib/utils";
import type { FulfillmentSelection } from "@/lib/delivery-utils";

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo",
  "Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa",
  "Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba",
  "Yobe","Zamfara",
];

interface Props {
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  pickupAddress?: string | null;
  pickupNotes?: string | null;
  deliveryFee: number;
  deliveryFreeThreshold: number;
  deliveryNotes?: string | null;
  cartSubtotal: number;
  value: FulfillmentSelection;
  onChange: (selection: FulfillmentSelection) => void;
  disabled?: boolean;
  error?: string;
  defaultName?: string;
  defaultPhone?: string;
}

export function FulfillmentFields({
  pickupEnabled,
  deliveryEnabled,
  pickupAddress,
  pickupNotes,
  deliveryFee,
  deliveryFreeThreshold,
  deliveryNotes,
  cartSubtotal,
  value,
  onChange,
  disabled = false,
  error,
  defaultName = "",
  defaultPhone = "",
}: Props) {
  const [touched, setTouched] = useState(false);

  // ✅ FIX 1: Keep a ref to the latest onChange so effects don't
  // accidentally use a stale callback. Also track whether we've
  // already initialized, so the auto-select effect runs exactly once.
  const initializedRef = useRef(false);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Compute the effective delivery fee preview
  const effectiveFee =
    value.method === "delivery" &&
    !(deliveryFreeThreshold > 0 && cartSubtotal >= deliveryFreeThreshold)
      ? deliveryFee
      : 0;

  // ✅ FIX 2: Auto-select only runs once, using the ref to avoid
  // a stale closure. No dependency on `value` to prevent resets.
  useEffect(() => {
    if (initializedRef.current) return;
    if (!pickupEnabled && !deliveryEnabled) return;

    const preferred =
      pickupEnabled && !deliveryEnabled ? "pickup" : "delivery";

    onChangeRef.current({
      method: preferred,
      address:
        preferred === "delivery"
          ? {
              full_name: defaultName,
              phone: defaultPhone,
              street_address: "",
              city: "",
              state: "",
              notes: "",
            }
          : null,
      fee: preferred === "delivery" ? effectiveFee : 0,
    });

    initializedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickupEnabled, deliveryEnabled]);

  // ✅ FIX 3: Recompute fee only when the fee-relevant inputs actually
  // change. Guard against re-writing the same value (which triggers a
  // re-render loop that resets the <select>).
  useEffect(() => {
    const currentFee = Number(value.fee ?? 0);
    if (value.method === "delivery") {
      if (currentFee !== effectiveFee) {
        onChangeRef.current({ ...value, fee: effectiveFee });
      }
    } else if (currentFee !== 0) {
      onChangeRef.current({ ...value, fee: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.method, cartSubtotal, deliveryFee, deliveryFreeThreshold]);

  // ✅ FIX 4: setAddress never overwrites other fields. Uses a stable
  // updater that reads from the current `value` prop.
  const setAddress = (
    key: keyof NonNullable<FulfillmentSelection["address"]>,
    v: string,
  ) => {
    const current =
      value.address ?? {
        full_name: "",
        phone: "",
        street_address: "",
        city: "",
        state: "",
        notes: "",
      };
    onChange({
      ...value,
      address: { ...current, [key]: v },
    });
  };

  if (!pickupEnabled && !deliveryEnabled) {
    return (
      <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        This store hasn't enabled pickup or delivery. Please contact the
        seller.
      </div>
    );
  }

  // ─── Pickup only ───
  if (pickupEnabled && !deliveryEnabled) {
    return (
      <div className="mt-6 space-y-2">
        <Label className="text-sm font-medium">Pickup</Label>
        <div className="rounded-md border bg-muted/30 p-3 text-sm">
          <p className="font-medium">Pick up at</p>
          {pickupAddress ? (
            <p className="mt-1 text-foreground/80">{pickupAddress}</p>
          ) : (
            <p className="mt-1 text-foreground/60 italic">
              Address not provided — contact the seller.
            </p>
          )}
          {pickupNotes && (
            <p className="mt-2 text-xs text-foreground/60">{pickupNotes}</p>
          )}
        </div>
      </div>
    );
  }

  // ─── Delivery only ───
  if (!pickupEnabled && deliveryEnabled) {
    return (
      <div className="mt-6 space-y-3">
        <Label className="text-sm font-medium">Delivery address</Label>
        <DeliveryAddressForm
          address={value.address}
          onChange={setAddress}
          disabled={disabled}
          touched={touched}
          onBlur={() => setTouched(true)}
        />
        <FeeLine
          fee={effectiveFee}
          freeThreshold={deliveryFreeThreshold}
          cartSubtotal={cartSubtotal}
        />
        {deliveryNotes && (
          <p className="text-xs text-foreground/60">{deliveryNotes}</p>
        )}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  // ─── Both ───
  return (
    <div className="mt-6 space-y-4">
      <Label className="text-sm font-medium">
        How would you like to receive your order?
      </Label>

      <RadioGroup
        value={value.method}
        onValueChange={(v) => {
          const m = v as "delivery" | "pickup";
          if (m === "pickup") {
            onChange({ method: "pickup", address: null, fee: 0 });
          } else {
            onChange({
              method: "delivery",
              address: value.address ?? {
                full_name: defaultName,
                phone: defaultPhone,
                street_address: "",
                city: "",
                state: "",
                notes: "",
              },
              fee: effectiveFee,
            });
          }
        }}
        disabled={disabled}
      >
        <div className="flex items-center space-x-2 rounded-md border p-3">
          <RadioGroupItem value="pickup" id="fm-pickup" disabled={disabled} />
          <Label htmlFor="fm-pickup" className="cursor-pointer">
            Pickup — free
          </Label>
        </div>
        <div className="flex items-center space-x-2 rounded-md border p-3">
          <RadioGroupItem
            value="delivery"
            id="fm-delivery"
            disabled={disabled}
          />
          <Label htmlFor="fm-delivery" className="cursor-pointer">
            Delivery
            {effectiveFee > 0 && (
              <span className="ml-1 text-foreground/60">
                — ₦{effectiveFee.toLocaleString()}
              </span>
            )}
            {effectiveFee === 0 && deliveryFee > 0 && (
              <span className="ml-1 text-green-600">— free</span>
            )}
          </Label>
        </div>
      </RadioGroup>

      {value.method === "pickup" && (
        <div className="rounded-md border bg-muted/30 p-3 text-sm">
          <p className="font-medium">Pick up at</p>
          {pickupAddress ? (
            <p className="mt-1 text-foreground/80">{pickupAddress}</p>
          ) : (
            <p className="mt-1 text-foreground/60 italic">
              Address not provided — contact the seller.
            </p>
          )}
          {pickupNotes && (
            <p className="mt-2 text-xs text-foreground/60">{pickupNotes}</p>
          )}
        </div>
      )}

      {value.method === "delivery" && (
        <div className="pl-4 space-y-3">
          <DeliveryAddressForm
            address={value.address}
            onChange={setAddress}
            disabled={disabled}
            touched={touched}
            onBlur={() => setTouched(true)}
          />
          <FeeLine
            fee={effectiveFee}
            freeThreshold={deliveryFreeThreshold}
            cartSubtotal={cartSubtotal}
          />
          {deliveryNotes && (
            <p className="text-xs text-foreground/60">{deliveryNotes}</p>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function DeliveryAddressForm({
  address,
  onChange,
  disabled,
  touched,
  onBlur,
}: {
  address: FulfillmentSelection["address"];
  onChange: (
    key: keyof NonNullable<FulfillmentSelection["address"]>,
    v: string,
  ) => void;
  disabled?: boolean;
  touched: boolean;
  onBlur: () => void;
}) {
  const addr = address ?? {
    full_name: "",
    phone: "",
    street_address: "",
    city: "",
    state: "",
    notes: "",
  };

  const showErr = (key: string, value: string) => {
    if (!touched) return false;
    return !value.trim();
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-foreground/70 mb-1 block">
            Full name *
          </Label>
          <Input
            value={addr.full_name}
            onChange={(e) => onChange("full_name", e.target.value)}
            onBlur={onBlur}
            disabled={disabled}
            placeholder="John Doe"
            className={cn(
              "rounded-xl",
              showErr("full_name", addr.full_name) && "border-destructive",
            )}
          />
        </div>
        <div>
          <Label className="text-xs text-foreground/70 mb-1 block">
            Phone *
          </Label>
          <Input
            value={addr.phone}
            onChange={(e) => onChange("phone", e.target.value)}
            onBlur={onBlur}
            disabled={disabled}
            placeholder="08012345678"
            inputMode="tel"
            className={cn(
              "rounded-xl",
              showErr("phone", addr.phone) && "border-destructive",
            )}
          />
        </div>
      </div>

      <div>
        <Label className="text-xs text-foreground/70 mb-1 block">
          Street address *
        </Label>
        <Input
          value={addr.street_address}
          onChange={(e) => onChange("street_address", e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          placeholder="12 Broad Street, Flat 3"
          className={cn(
            "rounded-xl",
            showErr("street_address", addr.street_address) &&
              "border-destructive",
          )}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-foreground/70 mb-1 block">City *</Label>
          <Input
            value={addr.city}
            onChange={(e) => onChange("city", e.target.value)}
            onBlur={onBlur}
            disabled={disabled}
            placeholder="Lagos"
            className={cn(
              "rounded-xl",
              showErr("city", addr.city) && "border-destructive",
            )}
          />
        </div>
        <div>
          <Label className="text-xs text-foreground/70 mb-1 block">
            State *
          </Label>
          {/* ✅ FIX 5: Native <select> driven purely by value + onChange.
              No `onBlur` that could reset the value. */}
          <select
            value={addr.state || ""}
            onChange={(e) => onChange("state", e.target.value)}
            disabled={disabled}
            className={cn(
              "w-full h-10 px-3 rounded-xl border bg-background text-sm",
              showErr("state", addr.state)
                ? "border-destructive"
                : "border-border",
            )}
          >
            <option value="">Select state</option>
            {NIGERIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <Label className="text-xs text-foreground/70 mb-1 block">
          Delivery notes (optional)
        </Label>
        <Input
          value={addr.notes ?? ""}
          onChange={(e) => onChange("notes", e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          placeholder="e.g., Near the blue gate. Call on arrival."
          className="rounded-xl"
        />
      </div>
    </div>
  );
}

function FeeLine({
  fee,
  freeThreshold,
  cartSubtotal,
}: {
  fee: number;
  freeThreshold: number;
  cartSubtotal: number;
}) {
  if (fee > 0) {
    return (
      <div className="flex justify-between text-sm">
        <span className="text-foreground/60">Delivery fee</span>
        <span className="font-medium">₦{fee.toLocaleString()}</span>
      </div>
    );
  }
  if (freeThreshold > 0 && cartSubtotal >= freeThreshold) {
    return (
      <div className="flex justify-between text-sm">
        <span className="text-foreground/60">Delivery fee</span>
        <span className="font-medium text-green-600">Free</span>
      </div>
    );
  }
  return null;
}