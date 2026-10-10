"use client";

import { useEffect, useRef, useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { cn } from "@/lib/utils";
import { Store, Truck, ChevronDown } from "lucide-react";
import type { FulfillmentSelection, PickupLocation } from "@/lib/delivery-utils";
import { sortPickupLocations } from "@/lib/delivery-utils";

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo",
  "Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa",
  "Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba",
  "Yobe","Zamfara",
];

interface Props {
  storeId: string;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
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
  storeId,
  pickupEnabled,
  deliveryEnabled,
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
  const [locations, setLocations] = useState<PickupLocation[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Fetch pickup locations once
  useEffect(() => {
    if (!pickupEnabled) return;
    if (!storeId || storeId === "undefined" || storeId.trim() === "") {
      setLocations([]);
      setLocationsLoading(false);
      return;
    }

    let cancelled = false;
    setLocationsLoading(true);
    (async () => {
      try {
        const res = await fetch(
          `/api/payment-page/public/pickup-locations?storeId=${encodeURIComponent(
            storeId,
          )}`,
          { cache: "no-store" },
        );
        if (!res.ok) throw new Error("Failed to load pickup locations");
        const data = await res.json();
        if (cancelled) return;
        setLocations(sortPickupLocations(data.locations ?? []));
      } catch (err) {
        console.error("Pickup locations load failed:", err);
      } finally {
        if (!cancelled) setLocationsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [storeId, pickupEnabled]);

  // ✅ Preview fee — always shown on the Delivery tab
  const previewFee =
    deliveryFreeThreshold > 0 && cartSubtotal >= deliveryFreeThreshold
      ? 0
      : Number(deliveryFee) || 0;

  // ✅ Effective fee for the current selection
  const effectiveFee = value.method === "delivery" ? previewFee : 0;

  // Sync fee
  useEffect(() => {
    const currentFee = Number(value.fee ?? 0);
    const targetFee = value.method === "delivery" ? previewFee : 0;
    if (currentFee !== targetFee) {
      onChangeRef.current({ ...value, fee: targetFee });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.method, cartSubtotal, deliveryFee, deliveryFreeThreshold]);

  const setAddress = (
    key: keyof NonNullable<FulfillmentSelection["address"]>,
    v: string,
  ) => {
    const current = value.address ?? {
      full_name: "",
      phone: "",
      street_address: "",
      city: "",
      state: "",
      notes: "",
    };
    onChange({ ...value, address: { ...current, [key]: v } });
  };

  const selectPickup = (loc: PickupLocation) => {
    onChange({
      ...value,
      pickup: {
        id: loc.id,
        label: loc.label,
        address: loc.address,
        notes: loc.notes,
        phone: loc.phone,
      },
    });
  };

  const choosePickup = () => {
    if (disabled) return;
    const def = locations.find((l) => l.is_default) ?? locations[0] ?? null;
    onChange({
      method: "pickup",
      address: null,
      pickup: def
        ? {
            id: def.id,
            label: def.label,
            address: def.address,
            notes: def.notes,
            phone: def.phone,
          }
        : null,
      fee: 0,
    });
    setExpanded(true);
  };

  const chooseDelivery = () => {
    if (disabled) return;
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
      pickup: null,
      fee: previewFee,
    });
    setExpanded(true);
  };

  if (!pickupEnabled && !deliveryEnabled) {
    return (
      <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        This store hasn't enabled pickup or delivery. Please contact the
        seller.
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-3">
      <Label className="text-sm font-medium text-gray-700">
        How would you like to receive your order?
      </Label>

      <div className="grid grid-cols-2 gap-2">
        <FulfillmentTab
          active={value.method === "pickup"}
          enabled={pickupEnabled}
          icon={Store}
          title="Pickup"
          subtitle="Free"
          onClick={choosePickup}
          disabled={disabled || !pickupEnabled}
        />

        <FulfillmentTab
          active={value.method === "delivery"}
          enabled={deliveryEnabled}
          icon={Truck}
          title="Delivery"
          subtitle={
            !deliveryEnabled
              ? "Not available"
              : previewFee > 0
                ? `₦${previewFee.toLocaleString()}`
                : deliveryFee > 0
                  ? "Free"
                  : "—"
          }
          subtitleTone={
            !deliveryEnabled
              ? "muted"
              : previewFee > 0
                ? "default"
                : deliveryFee > 0
                  ? "green"
                  : "muted"
          }
          onClick={chooseDelivery}
          disabled={disabled || !deliveryEnabled}
        />
      </div>

      {expanded && value.method === "pickup" && pickupEnabled && (
        <div className="space-y-2 pt-1">
          <PickupLocationPicker
            locations={locations}
            loading={locationsLoading}
            selectedId={value.pickup?.id ?? null}
            onChange={selectPickup}
            disabled={disabled}
          />
        </div>
      )}

      {expanded && value.method === "delivery" && deliveryEnabled && (
        <div className="space-y-3 pt-1">
          <DeliveryAddressForm
            address={value.address}
            onChange={setAddress}
            disabled={disabled}
            touched={touched}
            onBlur={() => setTouched(true)}
          />
          <FeeLine
            fee={previewFee}
            freeThreshold={deliveryFreeThreshold}
            cartSubtotal={cartSubtotal}
          />
          {deliveryNotes && (
            <p className="text-xs text-gray-500">{deliveryNotes}</p>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function FulfillmentTab({
  active,
  enabled,
  icon: Icon,
  title,
  subtitle,
  subtitleTone = "default",
  onClick,
  disabled,
}: {
  active: boolean;
  enabled: boolean;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  subtitleTone?: "default" | "green" | "muted";
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative flex flex-col items-start gap-1 rounded-lg border-2 px-3 py-3 text-left transition-all",
        active && enabled
          ? "border-[#FDC020] bg-[#FDC020]/5 shadow-sm"
          : enabled
            ? "border-gray-200 bg-white hover:border-gray-300"
            : "border-gray-100 bg-gray-50 opacity-60",
        disabled && "cursor-not-allowed",
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full transition-colors",
            active && enabled
              ? "bg-[#FDC020] text-[#191919]"
              : "bg-gray-100 text-gray-500",
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span
          className={cn(
            "text-sm font-semibold",
            enabled ? "text-gray-900" : "text-gray-400",
          )}
        >
          {title}
        </span>
      </div>
      <span
        className={cn(
          "ml-8 text-xs font-medium",
          subtitleTone === "green"
            ? "text-green-600"
            : subtitleTone === "muted"
              ? "text-gray-400"
              : "text-gray-500",
        )}
      >
        {subtitle}
      </span>

      {active && enabled && (
        <ChevronDown className="absolute right-2 top-2 h-3.5 w-3.5 text-[#FDC020]" />
      )}
    </button>
  );
}

function PickupLocationPicker({
  locations,
  loading,
  selectedId,
  onChange,
  disabled,
}: {
  locations: PickupLocation[];
  loading: boolean;
  selectedId: string | null;
  onChange: (loc: PickupLocation) => void;
  disabled?: boolean;
}) {
  if (loading) {
    return (
      <p className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">
        Loading pickup locations…
      </p>
    );
  }
  if (locations.length === 0) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        No pickup locations are available. Please contact the seller.
      </div>
    );
  }

  if (locations.length === 1) {
    const loc = locations[0];
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">
            {loc.label}
          </span>
          {loc.is_default && (
            <span className="rounded-full bg-[#FDC020]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#191919]">
              Default
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-600">{loc.address}</p>
        {loc.notes && (
          <p className="mt-1 text-xs text-gray-500">{loc.notes}</p>
        )}
        {loc.phone && (
          <p className="mt-1 text-xs font-medium text-gray-700">
            📞 {loc.phone}
          </p>
        )}
      </div>
    );
  }

  return (
    <RadioGroup
      value={selectedId ?? ""}
      onValueChange={(id) => {
        const loc = locations.find((l) => l.id === id);
        if (loc) onChange(loc);
      }}
      disabled={disabled}
      className="space-y-2"
    >
      {locations.map((loc) => (
        <label
          key={loc.id}
          htmlFor={`pickup-${loc.id}`}
          className={cn(
            "flex cursor-pointer items-start space-x-3 rounded-lg border-2 p-3 transition-all",
            selectedId === loc.id
              ? "border-[#FDC020] bg-[#FDC020]/5"
              : "border-gray-200 bg-white hover:border-gray-300",
          )}
        >
          <RadioGroupItem
            value={loc.id}
            id={`pickup-${loc.id}`}
            className="mt-1"
            disabled={disabled}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">
                {loc.label}
              </span>
              {loc.is_default && (
                <span className="rounded-full bg-[#FDC020]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#191919]">
                  Default
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-600">{loc.address}</p>
            {loc.notes && (
              <p className="mt-1 text-xs text-gray-500">{loc.notes}</p>
            )}
            {loc.phone && (
              <p className="mt-1 text-xs font-medium text-gray-700">
                📞 {loc.phone}
              </p>
            )}
          </div>
        </label>
      ))}
    </RadioGroup>
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

  const showErr = (value: string) => touched && !value.trim();

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-3">
      <div>
        <Label className="mb-1 block text-xs font-medium text-gray-600">
          Street address *
        </Label>
        <Input
          value={addr.street_address}
          onChange={(e) => onChange("street_address", e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          placeholder="12 Broad Street, Flat 3"
          className={cn(
            "rounded-lg",
            showErr(addr.street_address) && "border-red-400",
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label className="mb-1 block text-xs font-medium text-gray-600">
            City *
          </Label>
          <Input
            value={addr.city}
            onChange={(e) => onChange("city", e.target.value)}
            onBlur={onBlur}
            disabled={disabled}
            placeholder="Lagos"
            className={cn(
              "rounded-lg",
              showErr(addr.city) && "border-red-400",
            )}
          />
        </div>
        <div>
          <Label className="mb-1 block text-xs font-medium text-gray-600">
            State *
          </Label>
          <select
            value={addr.state || ""}
            onChange={(e) => onChange("state", e.target.value)}
            disabled={disabled}
            className={cn(
              "h-10 w-full rounded-lg border bg-white px-3 text-sm",
              showErr(addr.state) ? "border-red-400" : "border-gray-200",
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
        <Label className="mb-1 block text-xs font-medium text-gray-600">
          Delivery notes (optional)
        </Label>
        <Input
          value={addr.notes ?? ""}
          onChange={(e) => onChange("notes", e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          placeholder="e.g., Near the blue gate. Call on arrival."
          className="rounded-lg"
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
      <div className="flex justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
        <span className="text-gray-600">Delivery fee</span>
        <span className="font-medium text-gray-900">
          ₦{fee.toLocaleString()}
        </span>
      </div>
    );
  }
  if (freeThreshold > 0 && cartSubtotal >= freeThreshold) {
    return (
      <div className="flex justify-between rounded-lg bg-green-50 px-3 py-2 text-sm">
        <span className="text-gray-600">Delivery fee</span>
        <span className="font-medium text-green-600">Free</span>
      </div>
    );
  }
  return null;
}