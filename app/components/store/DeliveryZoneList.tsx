// app/components/store/DeliveryZoneList.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Star, Trash2, Truck, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DeliveryZoneModal } from "./DeliveryZoneModal";
import type { DeliveryZone } from "@/lib/delivery-utils";
import { sortDeliveryZones } from "@/lib/delivery-utils";

interface Props {
  storeId: string;
  disabled?: boolean;
}

export function DeliveryZoneList({ storeId, disabled = false }: Props) {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DeliveryZone | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/store/delivery-addresses?storeId=${storeId}`,
        { cache: "no-store" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load zones");
      setZones(sortDeliveryZones(data.zones ?? []));
    } catch (err: any) {
      toast.error(err.message || "Failed to load delivery zones");
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (zone: DeliveryZone) => {
    setDeletingId(zone.id);
    try {
      const res = await fetch(
        `/api/store/delivery-addresses/${zone.id}`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      toast.success(`Deleted "${zone.label}"`);
      await load();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete zone");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (zone: DeliveryZone) => {
    try {
      const res = await fetch(
        `/api/store/delivery-addresses/${zone.id}/set-default`,
        { method: "POST" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to set default");
      toast.success(`"${zone.label}" is now the default`);
      await load();
    } catch (err: any) {
      toast.error(err.message || "Failed to set default");
    }
  };

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (zone: DeliveryZone) => {
    setEditing(zone);
    setModalOpen(true);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-bold text-sm text-foreground">Delivery Zones</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Customers will choose their zone at checkout.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          disabled={disabled || !storeId}
          className="inline-flex items-center gap-1.5 shrink-0 rounded-2xl bg-[#F5B800] text-black px-4 py-2.5 text-sm font-bold hover:bg-[#eab308] transition-colors disabled:opacity-50"
        >
          <Plus className="size-4" />
          Add Zone
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="h-24 rounded-2xl bg-muted animate-pulse" />
        </div>
      ) : zones.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border py-10 text-center">
          <Truck className="mx-auto size-8 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium text-foreground">
            No delivery zones yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Add one so customers can choose a delivery zone.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className={cn(
                "rounded-2xl border p-4 flex items-start justify-between gap-4",
                zone.is_active
                  ? "border-border bg-background"
                  : "border-border bg-muted/20 opacity-70",
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-bold text-sm text-foreground">
                    {zone.label}
                  </span>
                  {zone.is_default && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#F5B800]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#191919] dark:text-[#F5B800]">
                      <Star className="size-3" /> Default
                    </span>
                  )}
                  {!zone.is_active && (
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 break-words">
                  {zone.address}
                </p>
                {zone.notes && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {zone.notes}
                  </p>
                )}
                <p className="text-xs font-medium text-foreground/70 mt-1.5">
                  ₦{Number(zone.fee).toLocaleString()}
                  {zone.free_threshold > 0 && (
                    <>
                      {" · "}
                      Free above ₦
                      {Number(zone.free_threshold).toLocaleString()}
                    </>
                  )}
                </p>
              </div>

              <div className="flex flex-col gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => openEdit(zone)}
                  disabled={disabled}
                  className="text-xs font-bold text-foreground underline underline-offset-2 hover:no-underline disabled:opacity-50"
                >
                  Edit
                </button>
                {!zone.is_default && zone.is_active && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(zone)}
                    disabled={disabled}
                    className="text-xs font-bold text-foreground/70 hover:text-foreground disabled:opacity-50"
                  >
                    Set Default
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(zone)}
                  disabled={disabled || deletingId === zone.id}
                  className="inline-flex items-center gap-1 text-xs font-bold text-destructive hover:opacity-80 disabled:opacity-50"
                >
                  {deletingId === zone.id ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Trash2 className="size-3" />
                  )}
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && storeId && (
        <DeliveryZoneModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSaved={load}
          storeId={storeId}
          zone={editing}
        />
      )}
    </div>
  );
}