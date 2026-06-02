// app/components/payment-page-components/DonationFields.tsx
"use client";

import { X, Plus } from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { Switch } from "@/app/components/ui/switch";

interface Props {
  suggestedAmounts: number[];
  setSuggestedAmounts: (a: number[]) => void;
  showDonorList: boolean;
  setShowDonorList: (v: boolean) => void;
  allowDonorMessage: boolean;
  setAllowDonorMessage: (v: boolean) => void;
  requireDonorName: boolean;
  setRequireDonorName: (v: boolean) => void;
  minimumDonation: number;
  setMinimumDonation: (v: number) => void;
  price?: number;
  onPriceChange?: (price: number) => void;
}

const DonationFields = ({ 
  suggestedAmounts, 
  setSuggestedAmounts, 
  showDonorList, 
  setShowDonorList, 
  allowDonorMessage, 
  setAllowDonorMessage,
  requireDonorName,
  setRequireDonorName,
  minimumDonation,
  setMinimumDonation,
  price,
  onPriceChange 
}: Props) => {
  const addAmount = () => setSuggestedAmounts([...suggestedAmounts, 0]);
  const updateAmount = (i: number, val: string) => {
    const updated = [...suggestedAmounts];
    updated[i] = Number(val) || 0;
    setSuggestedAmounts(updated);
    // Update price to the first suggested amount if available
    if (onPriceChange && updated[0]) {
      onPriceChange(updated[0]);
    }
  };
  const removeAmount = (i: number) => {
    const updated = suggestedAmounts.filter((_, idx) => idx !== i);
    setSuggestedAmounts(updated);
    // Update price to the first suggested amount if available
    if (onPriceChange && updated[0]) {
      onPriceChange(updated[0]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Suggested Donation Amounts */}
      <div>
        <Label className="text-sm font-semibold mb-2 block text-[var(--text-primary)]">
          Suggested Donation Amounts (₦)
        </Label>
        <p className="text-xs text-[var(--text-secondary)] mb-3">
          Add suggested donation amounts that donors can quickly select
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {suggestedAmounts.map((a, i) => (
            <div 
              key={i} 
              className="flex items-center gap-1 bg-[var(--bg-secondary)] rounded-lg px-1 border border-[var(--border-color)] squircle-sm"
            >
              <Input 
                type="number" 
                value={a || ""} 
                onChange={(e) => updateAmount(i, e.target.value)} 
                className="w-24 h-8 text-sm border-0 bg-transparent text-[var(--text-primary)] focus:ring-0 focus:outline-none" 
                placeholder="₦" 
              />
              <button 
                onClick={() => removeAmount(i)} 
                className="h-6 w-6 rounded flex items-center justify-center text-[var(--destructive)] hover:bg-[var(--destructive)]/10 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={addAmount}
          className="border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] squircle-md"
        >
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Amount
        </Button>
      </div>

      {/* Minimum Donation Amount */}
      <div>
        <Label className="text-sm font-semibold mb-2 block text-[var(--text-primary)]">
          Minimum Donation Amount (₦)
        </Label>
        <Input
          type="number"
          value={minimumDonation || ""}
          onChange={(e) => setMinimumDonation(Number(e.target.value) || 100)}
          placeholder="Minimum 100"
          className="h-10 text-sm border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)]"
        />
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Minimum amount donors can contribute (default: ₦100)
        </p>
      </div>

      {/* Donor Settings */}
      <div className="space-y-4 pt-2">
        {/* Require Donor Name Toggle */}
        <div className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] squircle-md">
          <div>
            <Label className="text-sm font-semibold text-[var(--text-primary)]">
              Require Donor Name
            </Label>
            <p className="text-xs text-[var(--text-secondary)]">
              Donors must enter their name for bank transfer narration
            </p>
          </div>
          <Switch 
            checked={requireDonorName} 
            onCheckedChange={setRequireDonorName}
            className="data-[state=checked]:bg-[var(--color-accent-yellow)]"
          />
        </div>
        
        {/* Show Donor List Toggle */}
        <div className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] squircle-md">
          <div>
            <Label className="text-sm font-semibold text-[var(--text-primary)]">
              Show Donor List
            </Label>
            <p className="text-xs text-[var(--text-secondary)]">
              Display donors publicly on the page
            </p>
          </div>
          <Switch 
            checked={showDonorList} 
            onCheckedChange={setShowDonorList}
            className="data-[state=checked]:bg-[var(--color-accent-yellow)]"
          />
        </div>
        
        {/* Allow Donor Message Toggle */}
        <div className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] squircle-md">
          <div>
            <Label className="text-sm font-semibold text-[var(--text-primary)]">
              Allow Donor Message
            </Label>
            <p className="text-xs text-[var(--text-secondary)]">
              Let donors leave a message with their donation
            </p>
          </div>
          <Switch 
            checked={allowDonorMessage} 
            onCheckedChange={setAllowDonorMessage}
            className="data-[state=checked]:bg-[var(--color-accent-yellow)]"
          />
        </div>
      </div>

      {/* Optional: Show total if price is set */}
      {price && price > 0 && (
        <div className="p-4 bg-[var(--color-accent-yellow)]/10 rounded-xl border border-[var(--color-accent-yellow)]/20 squircle-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              Default Donation Amount:
            </span>
            <span className="text-xl font-bold text-[var(--color-accent-yellow)]">
              ₦{price.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            This amount will be pre-selected for donors
          </p>
        </div>
      )}
    </div>
  );
};

export default DonationFields;