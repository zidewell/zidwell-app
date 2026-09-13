// app/components/payment-page-components/ServicesFields.tsx
"use client";

import { Info } from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";

interface Props {
  bookingEnabled: boolean;
  setBookingEnabled: (v: boolean) => void;
  customerNoteEnabled: boolean;
  setCustomerNoteEnabled: (v: boolean) => void;
  stock: number | null;
  setStock: (v: number | null) => void;
  allowMultiple: boolean;
  setAllowMultiple: (v: boolean) => void;
}

const ServicesFields = ({
  bookingEnabled,
  setBookingEnabled,
  customerNoteEnabled,
  setCustomerNoteEnabled,
  stock,
  setStock,
  allowMultiple,
  setAllowMultiple,
}: Props) => (
  <div className="space-y-6">
    {/* ─── Sessions / Slots ─── */}
    <div className="p-4 rounded-xl border border-(--border-color) bg-(--bg-primary)">
      <div className="flex items-start gap-2 mb-3">
        <Info className="h-4 w-4 text-(--color-accent-yellow) mt-0.5 shrink-0" />
        <div>
          <Label className="text-sm font-bold text-(--text-primary)">
            Sessions / Slots Available
          </Label>
          <p className="text-xs text-(--text-secondary) mt-0.5">
            How many sessions or slots can be booked? Leave empty for unlimited.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Input
          type="number"
          min={0}
          value={stock === null ? "" : stock}
          onChange={(e) => {
            const val = e.target.value;
            setStock(val === "" ? null : Math.max(0, parseInt(val) || 0));
          }}
          placeholder="e.g. 20 (leave empty for unlimited)"
          className="flex-1 h-11 text-sm border-(--border-color) bg-(--bg-primary) text-(--text-primary)"
        />
        {stock !== null && (
          <button
            type="button"
            onClick={() => setStock(null)}
            className="text-xs text-(--text-secondary) hover:text-(--text-primary) underline whitespace-nowrap"
          >
            Unlimited
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        {[1, 5, 10, 20, 50].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setStock(n)}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${
              stock === n
                ? "border-(--color-accent-yellow) bg-(--color-accent-yellow)/10 text-(--color-accent-yellow)"
                : "border-(--border-color) text-(--text-secondary) hover:border-(--color-accent-yellow)/50"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>

    {/* ─── Allow multiple ─── */}
    <div className="flex items-center justify-between p-4 rounded-xl border border-(--border-color) bg-(--bg-primary)">
      <div className="pr-4">
        <Label className="text-sm font-bold text-(--text-primary)">
          Allow booking multiple sessions
        </Label>
        <p className="text-xs text-(--text-secondary) mt-1">
          {allowMultiple
            ? "Buyers can book several sessions at once"
            : "Buyers book exactly one session at a time"}
        </p>
      </div>
      <Switch
        checked={allowMultiple}
        onCheckedChange={setAllowMultiple}
        className="data-[state=checked]:bg-(--color-accent-yellow)"
      />
    </div>

    {/* ─── Booking ─── */}
    <div className="flex items-center justify-between p-4 rounded-xl border border-(--border-color) bg-(--bg-primary)">
      <div className="pr-4">
        <Label className="text-sm font-bold text-(--text-primary)">
          Enable Booking
        </Label>
        <p className="text-xs text-(--text-secondary) mt-1">
          Let customers pick a date & time
        </p>
      </div>
      <Switch
        checked={bookingEnabled}
        onCheckedChange={setBookingEnabled}
        className="data-[state=checked]:bg-(--color-accent-yellow)"
      />
    </div>

    {/* ─── Customer Note ─── */}
    <div className="flex items-center justify-between p-4 rounded-xl border border-(--border-color) bg-(--bg-primary)">
      <div className="pr-4">
        <Label className="text-sm font-bold text-(--text-primary)">
          Customer Note
        </Label>
        <p className="text-xs text-(--text-secondary) mt-1">
          Allow customers to describe their request
        </p>
      </div>
      <Switch
        checked={customerNoteEnabled}
        onCheckedChange={setCustomerNoteEnabled}
        className="data-[state=checked]:bg-(--color-accent-yellow)"
      />
    </div>
  </div>
);

export default ServicesFields;