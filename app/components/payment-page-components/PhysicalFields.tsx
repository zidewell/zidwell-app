// app/components/payment-page-components/PhysicalFields.tsx
import { X, Plus } from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { Switch } from "@/app/components/ui/switch";
import type { Variant } from "@/app/hooks/useStore"; 

interface Props {
  variants: Variant[];
  setVariants: (v: Variant[]) => void;
  requiresShipping: boolean;
  setRequiresShipping: (v: boolean) => void;
  price?: number;
  onPriceChange?: (price: number) => void;
}

const PhysicalFields = ({ 
  variants, 
  setVariants, 
  requiresShipping, 
  setRequiresShipping,
  price,
  onPriceChange 
}: Props) => {
  const addVariant = () => setVariants([...variants, { name: "", options: [""] }]);
  const updateVariantName = (i: number, val: string) => {
    const updated = [...variants];
    updated[i] = { ...updated[i], name: val };
    setVariants(updated);
  };
  const updateOption = (vi: number, oi: number, val: string) => {
    const updated = [...variants];
    const opts = [...updated[vi].options];
    opts[oi] = val;
    updated[vi] = { ...updated[vi], options: opts };
    setVariants(updated);
  };
  const addOption = (vi: number) => {
    const updated = [...variants];
    updated[vi] = { ...updated[vi], options: [...updated[vi].options, ""] };
    setVariants(updated);
  };
  const removeVariant = (i: number) => setVariants(variants.filter((_, idx) => idx !== i));
  const removeOption = (vi: number, oi: number) => {
    const updated = [...variants];
    updated[vi] = { ...updated[vi], options: updated[vi].options.filter((_, idx) => idx !== oi) };
    setVariants(updated);
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-semibold mb-2 block">Product Variants</Label>
        <div className="space-y-4">
          {variants.map((v, vi) => (
            <div key={vi} className="p-4 rounded-xl border border-[#ded4c3] bg-[#e9e2d7]/30 space-y-3">
              <div className="flex gap-2 items-center">
                <Input 
                  placeholder="Variant name (e.g. Size, Color)" 
                  value={v.name} 
                  onChange={(e) => updateVariantName(vi, e.target.value)} 
                  className="flex-1 h-9 text-sm" 
                />
                <button onClick={() => removeVariant(vi)} className="h-7 w-7 rounded-md bg-[#ee4343]/10 flex items-center justify-center text-[#ee4343]">
                  <X className="h-3 w-3" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {v.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-1 bg-[#f7f0e2] rounded-lg px-1 border border-[#ded4c3]">
                    <Input 
                      placeholder="Option" 
                      value={opt} 
                      onChange={(e) => updateOption(vi, oi, e.target.value)} 
                      className="w-20 h-7 text-xs border-0 bg-transparent" 
                    />
                    {v.options.length > 1 && (
                      <button onClick={() => removeOption(vi, oi)} className="h-5 w-5 rounded flex items-center justify-center text-[#ee4343]">
                        <X className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={() => addOption(vi)} className="h-7 px-2 rounded-lg border border-dashed border-[#ded4c3] text-xs text-[#3e7465] hover:border-[#e1bf46] transition-colors">
                  + Option
                </button>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addVariant}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Variant
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-semibold">Requires Shipping</Label>
          <p className="text-xs text-[#3e7465]">Collect delivery address from buyers</p>
        </div>
        <Switch checked={requiresShipping} onCheckedChange={setRequiresShipping} />
      </div>
    </div>
  );
};

export default PhysicalFields;