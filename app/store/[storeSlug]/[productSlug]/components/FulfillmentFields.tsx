"use client";

import { useEffect, useRef, useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { cn } from "@/lib/utils";
import { Store, Truck, ChevronDown } from "lucide-react";
import type {
  DeliveryZone,
  FulfillmentSelection,
  PickupLocation,
} from "@/lib/delivery-utils";
import {
  sortDeliveryZones,
  sortPickupLocations,
} from "@/lib/delivery-utils";

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
  const [expanded, setExpanded] = useState(false);

  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
  const [pickupLoading, setPickupLoading] = useState(false);

  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [zonesLoading, setZonesLoading] = useState(false);

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!pickupEnabled) return;
    if (!storeId || storeId === "undefined" || storeId.trim() === "") {
      setPickupLocations([]);
      setPickupLoading(false);
      return;
    }
    let cancelled = false;
    setPickupLoading(true);
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
        setPickupLocations(sortPickupLocations(data.locations ?? []));
      } catch (err) {
        console.error("Pickup locations load failed:", err);
      } finally {
        if (!cancelled) setPickupLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [storeId, pickupEnabled]);

  useEffect(() => {
    if (!deliveryEnabled) return;
    if (!storeId || storeId === "undefined" || storeId.trim() === "") {
      setDeliveryZones([]);
      setZonesLoading(false);
      return;
    }
    let cancelled = false;
    setZonesLoading(true);
    (async () => {
      try {
        const res = await fetch(
          `/api/payment-page/public/delivery-addresses?storeId=${encodeURIComponent(
            storeId,
          )}`,
          { cache: "no-store" },
        );
        if (!res.ok) throw new Error("Failed to load delivery zones");
        const data = await res.json();
        if (cancelled) return;
        setDeliveryZones(sortDeliveryZones(data.zones ?? []));
      } catch (err) {
        console.error("Delivery zones load failed:", err);
      } finally {
        if (!cancelled) setZonesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [storeId, deliveryEnabled]);

  const selectedZoneId = value.delivery?.selected_zone?.id ?? null;
  const selectedZone =
    deliveryZones.find((z) => z.id === selectedZoneId) ?? null;

  const previewFee = (() => {
    if (selectedZone) {
      return selectedZone.free_threshold > 0 &&
        cartSubtotal >= selectedZone.free_threshold
        ? 0
        : Number(selectedZone.fee) || 0;
    }
    if (deliveryZones.length > 0) {
      let lowest = Infinity;
      for (const z of deliveryZones) {
        const f = Number(z.fee) || 0;
        if (f < lowest) lowest = f;
      }
      return Number.isFinite(lowest) ? lowest : 0;
    }
    return 0;
  })();

  const effectiveFee = value.method === "delivery" ? previewFee : 0;

  useEffect(() => {
    const currentFee = Number(value.fee ?? 0);
    const targetFee = value.method === "delivery" ? effectiveFee : 0;
    if (currentFee !== targetFee) {
      onChangeRef.current({ ...value, fee: targetFee });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.method, cartSubtotal, selectedZoneId, deliveryZones.length]);

  const setCustomerAddress = (
    key: keyof NonNullable<
      NonNullable<FulfillmentSelection["delivery"]>["customer_address"]
    >,
    v: string,
  ) => {
    const current = value.delivery?.customer_address ?? {
      full_name: "",
      phone: "",
      street_address: "",
      city: "",
      state: "",
      notes: "",
    };
    const zone = value.delivery?.selected_zone ?? null;
    onChange({
      ...value,
      delivery: {
        selected_zone: zone,
        customer_address: { ...current, [key]: v },
      },
    });
  };

  const pickZone = (zone: DeliveryZone) => {
    onChange({
      ...value,
      delivery: {
        selected_zone: {
          id: zone.id,
          label: zone.label,
          address: zone.address,
          city: zone.city,
          state: zone.state,
          fee: Number(zone.fee) || 0,
          notes: zone.notes,
        },
        customer_address: value.delivery?.customer_address ?? null,
      },
    });
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
    const def =
      pickupLocations.find((l) => l.is_default) ?? pickupLocations[0] ?? null;
    onChange({
      method: "pickup",
      delivery: null,
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
    const defZone =
      deliveryZones.find((z) => z.is_default) ?? deliveryZones[0] ?? null;
    const defFee = defZone
      ? defZone.free_threshold > 0 && cartSubtotal >= defZone.free_threshold
        ? 0
        : Number(defZone.fee) || 0
      : 0;

    onChange({
      method: "delivery",
      delivery: {
        selected_zone: defZone
          ? {
              id: defZone.id,
              label: defZone.label,
              address: defZone.address,
              city: defZone.city,
              state: defZone.state,
              fee: Number(defZone.fee) || 0,
              notes: defZone.notes,
            }
          : null,
        customer_address: value.delivery?.customer_address ?? {
          full_name: defaultName,
          phone: defaultPhone,
          street_address: "",
          city: "",
          state: "",
          notes: "",
        },
      },
      pickup: null,
      fee: defFee,
    });
    setExpanded(true);
  };

  if (!pickupEnabled && !deliveryEnabled) {
    return (
      <div className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
        This store hasn't enabled pickup or delivery. Please contact the
        seller.
      </div>
    );
  }

  const deliveryAvailable = deliveryEnabled && deliveryZones.length > 0;

  return (
    <div className="mt-5 space-y-3">
      <Label className="text-sm font-medium text-foreground">
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
          enabled={deliveryAvailable}
          icon={Truck}
          title="Delivery"
          subtitle={
            !deliveryEnabled
              ? "Not available"
              : deliveryZones.length === 0 && !zonesLoading
                ? "No zones configured"
                : previewFee > 0
                  ? `₦${previewFee.toLocaleString()}`
                  : selectedZone
                    ? "Free"
                    : "—"
          }
          subtitleTone={
            !deliveryEnabled
              ? "muted"
              : deliveryZones.length === 0 && !zonesLoading
                ? "muted"
                : previewFee > 0
                  ? "default"
                  : selectedZone
                    ? "green"
                    : "muted"
          }
          onClick={chooseDelivery}
          disabled={disabled || !deliveryAvailable}
        />
      </div>

      {expanded && value.method === "pickup" && pickupEnabled && (
        <div className="space-y-2 pt-1">
          <PickupLocationPicker
            locations={pickupLocations}
            loading={pickupLoading}
            selectedId={value.pickup?.id ?? null}
            onChange={selectPickup}
            disabled={disabled}
          />
        </div>
      )}

      {expanded && value.method === "delivery" && deliveryAvailable && (
        <div className="space-y-3 pt-1">
          <DeliveryZonePicker
            zones={deliveryZones}
            loading={zonesLoading}
            selectedId={selectedZoneId}
            onChange={pickZone}
            disabled={disabled}
          />

          <div className="space-y-3 rounded-lg border border-border bg-background p-3">
            <p className="text-xs font-medium text-muted-foreground">
              Where should we deliver it?
            </p>
            <DeliveryAddressForm
              address={value.delivery?.customer_address}
              onChange={setCustomerAddress}
              disabled={disabled}
              touched={touched}
              onBlur={() => setTouched(true)}
            />
          </div>

          <FeeLine fee={previewFee} zoneLabel={selectedZone?.label ?? null} />

          {deliveryNotes && (
            <p className="text-xs text-muted-foreground">{deliveryNotes}</p>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
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
          ? "border-[#F5B800] bg-[#F5B800]/5 shadow-sm"
          : enabled
            ? "border-border bg-background hover:border-border/80"
            : "border-border/60 bg-muted/40 opacity-60",
        disabled && "cursor-not-allowed",
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full transition-colors",
            active && enabled
              ? "bg-[#F5B800] text-[#191919]"
              : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span
          className={cn(
            "text-sm font-semibold",
            enabled ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {title}
        </span>
      </div>
      <span
        className={cn(
          "ml-8 text-xs font-medium",
          subtitleTone === "green"
            ? "text-green-600 dark:text-green-400"
            : subtitleTone === "muted"
              ? "text-muted-foreground"
              : "text-muted-foreground",
        )}
      >
        {subtitle}
      </span>

      {active && enabled && (
        <ChevronDown className="absolute right-2 top-2 h-3.5 w-3.5 text-[#F5B800]" />
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
      <p className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
        Loading pickup locations…
      </p>
    );
  }
  if (locations.length === 0) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
        No pickup locations are available. Please contact the seller.
      </div>
    );
  }

  if (locations.length === 1) {
    const loc = locations[0];
    return (
      <div className="rounded-lg border border-border bg-muted/40 p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            {loc.label}
          </span>
          {loc.is_default && (
            <span className="rounded-full bg-[#F5B800]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#191919] dark:text-[#F5B800]">
              Default
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{loc.address}</p>
        {loc.notes && (
          <p className="mt-1 text-xs text-muted-foreground">{loc.notes}</p>
        )}
        {loc.phone && (
          <p className="mt-1 text-xs font-medium text-foreground">
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
              ? "border-[#F5B800] bg-[#F5B800]/5"
              : "border-border bg-background hover:border-border/80",
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
              <span className="text-sm font-medium text-foreground">
                {loc.label}
              </span>
              {loc.is_default && (
                <span className="rounded-full bg-[#F5B800]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#191919] dark:text-[#F5B800]">
                  Default
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{loc.address}</p>
            {loc.notes && (
              <p className="mt-1 text-xs text-muted-foreground">{loc.notes}</p>
            )}
            {loc.phone && (
              <p className="mt-1 text-xs font-medium text-foreground">
                📞 {loc.phone}
              </p>
            )}
          </div>
        </label>
      ))}
    </RadioGroup>
  );
}

function DeliveryZonePicker({
  zones,
  loading,
  selectedId,
  onChange,
  disabled,
}: {
  zones: DeliveryZone[];
  loading: boolean;
  selectedId: string | null;
  onChange: (zone: DeliveryZone) => void;
  disabled?: boolean;
}) {
  if (loading) {
    return (
      <p className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
        Loading delivery zones…
      </p>
    );
  }
  if (zones.length === 0) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
        No delivery zones are available. Please contact the seller.
      </div>
    );
  }

  if (zones.length === 1) {
    const z = zones[0];
    return (
      <div className="rounded-lg border border-border bg-muted/40 p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">{z.label}</span>
          {z.is_default && (
            <span className="rounded-full bg-[#F5B800]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#191919] dark:text-[#F5B800]">
              Default
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{z.address}</p>
        {z.notes && (
          <p className="mt-1 text-xs text-muted-foreground">{z.notes}</p>
        )}
        <p className="mt-1 text-xs font-medium text-foreground">
          ₦{Number(z.fee).toLocaleString()}
          {z.free_threshold > 0 && (
            <>
              {" · "}Free above ₦{Number(z.free_threshold).toLocaleString()}
            </>
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">
        Choose your delivery zone:
      </p>
      <RadioGroup
        value={selectedId ?? ""}
        onValueChange={(id) => {
          const z = zones.find((x) => x.id === id);
          if (z) onChange(z);
        }}
        disabled={disabled}
        className="space-y-2"
      >
        {zones.map((z) => (
          <label
            key={z.id}
            htmlFor={`zone-${z.id}`}
            className={cn(
              "flex cursor-pointer items-start space-x-3 rounded-lg border-2 p-3 transition-all",
              selectedId === z.id
                ? "border-[#F5B800] bg-[#F5B800]/5"
                : "border-border bg-background hover:border-border/80",
            )}
          >
            <RadioGroupItem
              value={z.id}
              id={`zone-${z.id}`}
              className="mt-1"
              disabled={disabled}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {z.label}
                </span>
                {z.is_default && (
                  <span className="rounded-full bg-[#F5B800]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#191919] dark:text-[#F5B800]">
                    Default
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{z.address}</p>
              {z.notes && (
                <p className="mt-1 text-xs text-muted-foreground">{z.notes}</p>
              )}
              <p className="mt-1 text-xs font-medium text-foreground">
                ₦{Number(z.fee).toLocaleString()}
                {z.free_threshold > 0 && (
                  <>
                    {" · "}Free above ₦
                    {Number(z.free_threshold).toLocaleString()}
                  </>
                )}
              </p>
            </div>
          </label>
        ))}
      </RadioGroup>
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
  address:
    | NonNullable<FulfillmentSelection["delivery"]>["customer_address"]
    | null
    | undefined;
  onChange: (
    key: keyof NonNullable<
      NonNullable<FulfillmentSelection["delivery"]>["customer_address"]
    >,
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
    <div className="space-y-3">
      <div>
        <Label className="mb-1 block text-xs font-medium text-muted-foreground">
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
          <Label className="mb-1 block text-xs font-medium text-muted-foreground">
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
          <Label className="mb-1 block text-xs font-medium text-muted-foreground">
            State *
          </Label>
          <select
            value={addr.state || ""}
            onChange={(e) => onChange("state", e.target.value)}
            disabled={disabled}
            className={cn(
              "h-10 w-full rounded-lg border bg-background px-3 text-sm text-foreground",
              showErr(addr.state) ? "border-red-400" : "border-border",
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
        <Label className="mb-1 block text-xs font-medium text-muted-foreground">
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
  zoneLabel,
}: {
  fee: number;
  zoneLabel: string | null;
}) {
  if (fee > 0) {
    return (
      <div className="flex justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
        <span className="text-muted-foreground">
          Delivery fee
          {zoneLabel && (
            <span className="ml-1 text-xs text-muted-foreground/70">
              ({zoneLabel})
            </span>
          )}
        </span>
        <span className="font-medium text-foreground">
          ₦{fee.toLocaleString()}
        </span>
      </div>
    );
  }
  return (
    <div className="flex justify-between rounded-lg bg-green-500/10 px-3 py-2 text-sm">
      <span className="text-muted-foreground">
        Delivery fee
        {zoneLabel && (
          <span className="ml-1 text-xs text-muted-foreground/70">
            ({zoneLabel})
          </span>
        )}
      </span>
      <span className="font-medium text-green-600 dark:text-green-400">Free</span>
    </div>
  );
}