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
  // Add a new variant with default values
  const addVariant = () => setVariants([
    ...variants, 
    { 
      name: "", 
      price: 0, 
      sku: "", 
      stock: 0 
    }
  ]);
  
  const updateVariantName = (i: number, val: string) => {
    const updated = [...variants];
    updated[i] = { ...updated[i], name: val };
    setVariants(updated);
  };
  
  const updateVariantPrice = (i: number, val: string) => {
    const updated = [...variants];
    updated[i] = { ...updated[i], price: parseFloat(val) || 0 };
    setVariants(updated);
  };
  
  const updateVariantSku = (i: number, val: string) => {
    const updated = [...variants];
    updated[i] = { ...updated[i], sku: val };
    setVariants(updated);
  };
  
  const updateVariantStock = (i: number, val: string) => {
    const updated = [...variants];
    updated[i] = { ...updated[i], stock: parseInt(val) || 0 };
    setVariants(updated);
  };
  
  const removeVariant = (i: number) => setVariants(variants.filter((_, idx) => idx !== i));

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
                <button 
                  onClick={() => removeVariant(vi)} 
                  className="h-7 w-7 rounded-md bg-[#ee4343]/10 flex items-center justify-center text-[#ee4343]"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Input 
                  placeholder="Price" 
                  type="number"
                  value={v.price || 0} 
                  onChange={(e) => updateVariantPrice(vi, e.target.value)} 
                  className="h-9 text-sm" 
                />
                <Input 
                  placeholder="SKU" 
                  value={v.sku || ""} 
                  onChange={(e) => updateVariantSku(vi, e.target.value)} 
                  className="h-9 text-sm" 
                />
                <Input 
                  placeholder="Stock" 
                  type="number"
                  value={v.stock || 0} 
                  onChange={(e) => updateVariantStock(vi, e.target.value)} 
                  className="h-9 text-sm" 
                />
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