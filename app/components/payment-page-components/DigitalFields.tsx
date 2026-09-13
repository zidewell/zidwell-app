// app/components/payment-page-components/DigitalFields.tsx
"use client";

import { Info } from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";

interface Props {
  downloadUrl: string;
  setDownloadUrl: (v: string) => void;
  accessLink: string;
  setAccessLink: (v: string) => void;
  emailDelivery: boolean;
  setEmailDelivery: (v: boolean) => void;
  stock: number | null;
  setStock: (v: number | null) => void;
  allowMultiple: boolean;
  setAllowMultiple: (v: boolean) => void;
}

const DigitalFields = ({
  downloadUrl,
  setDownloadUrl,
  accessLink,
  setAccessLink,
  emailDelivery,
  setEmailDelivery,
  stock,
  setStock,
  allowMultiple,
  setAllowMultiple,
}: Props) => (
  <div className="space-y-6">
    {/* ─── Stock ─── */}
    <div className="p-4 rounded-xl border border-(--border-color) bg-(--bg-primary)">
      <div className="flex items-start gap-2 mb-3">
        <Info className="h-4 w-4 text-(--color-accent-yellow) mt-0.5 shrink-0" />
        <div>
          <Label className="text-sm font-bold text-(--text-primary)">
            Available Quantity
          </Label>
          <p className="text-xs text-(--text-secondary) mt-0.5">
            Number of copies/licenses to sell. Leave empty for unlimited.
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
          placeholder="e.g. 100 (leave empty for unlimited)"
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
        {[10, 50, 100, 500, 1000].map((n) => (
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
          Allow buying multiple copies
        </Label>
        <p className="text-xs text-(--text-secondary) mt-1">
          {allowMultiple
            ? "Buyers can buy more than one copy at once"
            : "Buyers purchase exactly one copy per checkout"}
        </p>
      </div>
      <Switch
        checked={allowMultiple}
        onCheckedChange={setAllowMultiple}
        className="data-[state=checked]:bg-(--color-accent-yellow)"
      />
    </div>

    {/* ─── Download URL ─── */}
    <div>
      <Label className="text-sm font-semibold mb-2 block text-(--text-primary)">
        Download URL
      </Label>
      <Input
        placeholder="https://drive.google.com/file/..."
        value={downloadUrl}
        onChange={(e) => setDownloadUrl(e.target.value)}
        className="h-12 text-base border-(--border-color) bg-(--bg-primary) text-(--text-primary)"
      />
      <p className="text-xs text-(--text-secondary) mt-1">
        Link to file that buyers get after payment
      </p>
    </div>

    {/* ─── Access Link ─── */}
    <div>
      <Label className="text-sm font-semibold mb-2 block text-(--text-primary)">
        Access Link (alternative)
      </Label>
      <Input
        placeholder="https://your-course.com/access"
        value={accessLink}
        onChange={(e) => setAccessLink(e.target.value)}
        className="h-12 text-base border-(--border-color) bg-(--bg-primary) text-(--text-primary)"
      />
      <p className="text-xs text-(--text-secondary) mt-1">
        Or provide a link to access content instead of download
      </p>
    </div>

    {/* ─── Email Delivery ─── */}
    <div className="flex items-center justify-between p-4 rounded-xl border border-(--border-color) bg-(--bg-primary)">
      <div className="pr-4">
        <Label className="text-sm font-bold text-(--text-primary)">
          Email Delivery
        </Label>
        <p className="text-xs text-(--text-secondary) mt-1">
          Send the product link via email after payment
        </p>
      </div>
      <Switch
        checked={emailDelivery}
        onCheckedChange={setEmailDelivery}
        className="data-[state=checked]:bg-(--color-accent-yellow)"
      />
    </div>
  </div>
);

export default DigitalFields;