// app/components/payment-page-components/InvestmentFields.tsx
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import { AlertTriangle } from "lucide-react";

interface Props {
  minimumAmount: string;
  setMinimumAmount: (v: string) => void;
  expectedReturn: string;
  setExpectedReturn: (v: string) => void;
  tenure: string;
  setTenure: (v: string) => void;
  charges: string;
  setCharges: (v: string) => void;
  paymentFrequency: "one-time" | "recurring";
  setPaymentFrequency: (v: "one-time" | "recurring") => void;
  termsAndConditions: string;
  setTermsAndConditions: (v: string) => void;
  riskExplanation: string;
  setRiskExplanation: (v: string) => void;
  price?: number;
  onPriceChange?: (price: number) => void;
}

const InvestmentFields = ({
  minimumAmount, 
  setMinimumAmount,
  expectedReturn, 
  setExpectedReturn,
  tenure, 
  setTenure,
  charges, 
  setCharges,
  paymentFrequency, 
  setPaymentFrequency,
  termsAndConditions, 
  setTermsAndConditions,
  riskExplanation, 
  setRiskExplanation,
  price,
  onPriceChange
}: Props) => {
  
  const handleMinimumAmountChange = (value: string) => {
    setMinimumAmount(value);
    // Update price to minimum amount
    if (onPriceChange && Number(value)) {
      onPriceChange(Number(value));
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <Label className="text-sm font-semibold mb-1.5 block">Minimum Investment Amount (₦) *</Label>
        <Input 
          type="number" 
          placeholder="e.g. 50000" 
          value={minimumAmount} 
          onChange={(e) => handleMinimumAmountChange(e.target.value)} 
          className="h-12" 
        />
        <p className="text-xs text-[#3e7465] mt-1">This will be the minimum amount investors can contribute</p>
      </div>

      <div>
        <Label className="text-sm font-semibold mb-1.5 block">Expected Return (optional)</Label>
        <Input 
          placeholder='e.g. "10-15% per annum" — clearly state this is an estimate' 
          value={expectedReturn} 
          onChange={(e) => setExpectedReturn(e.target.value)} 
          className="h-12" 
        />
        <p className="text-xs text-[#3e7465] mt-1">This is displayed as an estimate only — not a guarantee.</p>
      </div>

      <div>
        <Label className="text-sm font-semibold mb-1.5 block">Tenure / Maturity Period *</Label>
        <Input 
          placeholder='e.g. "6 months", "1 year", "Flexible"' 
          value={tenure} 
          onChange={(e) => setTenure(e.target.value)} 
          className="h-12" 
        />
      </div>

      <div>
        <Label className="text-sm font-semibold mb-1.5 block">Fees / Charges</Label>
        <Input 
          placeholder='e.g. "2% management fee", "₦500 processing fee"' 
          value={charges} 
          onChange={(e) => setCharges(e.target.value)} 
          className="h-12" 
        />
      </div>

      <div>
        <Label className="text-sm font-semibold mb-3 block">Payment Frequency</Label>
        <div className="grid grid-cols-2 gap-3">
          {(["one-time", "recurring"] as const).map((val) => (
            <button 
              key={val} 
              onClick={() => setPaymentFrequency(val)} 
              className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${paymentFrequency === val ? "border-[#e1bf46] bg-[#e1bf46]/10 text-[#023528]" : "border-[#ded4c3] bg-[#f9f6ef] text-[#3e7465] hover:border-[#e1bf46]/50"}`}
            >
              {val === "one-time" ? "One-time" : "Recurring"}
            </button>
          ))}
        </div>
      </div>

      {/* Terms & Conditions - REQUIRED */}
      <div className="p-4 rounded-2xl border-2 border-yellow-500/30 bg-yellow-500/5">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <Label className="text-sm font-bold">Terms & Conditions (Required)</Label>
        </div>
        <Textarea
          placeholder="Enter the full terms and conditions for this investment. Must be at least 100 characters..."
          value={termsAndConditions}
          onChange={(e) => setTermsAndConditions(e.target.value)}
          rows={5}
          className="resize-none mb-2"
        />
        <p className={`text-xs ${termsAndConditions.length >= 100 ? "text-[#28a36a]" : "text-[#3e7465]"}`}>
          {termsAndConditions.length}/100 characters minimum
        </p>
      </div>

      {/* Risk Explanation - REQUIRED */}
      <div className="p-4 rounded-2xl border-2 border-yellow-500/30 bg-yellow-500/5">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <Label className="text-sm font-bold">Risk Explanation (Required)</Label>
        </div>
        <Textarea
          placeholder="Clearly explain the risks involved with this investment..."
          value={riskExplanation}
          onChange={(e) => setRiskExplanation(e.target.value)}
          rows={4}
          className="resize-none"
        />
        {!riskExplanation.trim() && (
          <p className="text-xs text-[#ee4343] mt-1">This field is required before publishing</p>
        )}
      </div>
    </div>
  );
};

export default InvestmentFields;