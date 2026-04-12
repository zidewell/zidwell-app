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
}

const DonationFields = ({ suggestedAmounts, setSuggestedAmounts, showDonorList, setShowDonorList, allowDonorMessage, setAllowDonorMessage }: Props) => {
  const addAmount = () => setSuggestedAmounts([...suggestedAmounts, 0]);
  const updateAmount = (i: number, val: string) => {
    const updated = [...suggestedAmounts];
    updated[i] = Number(val) || 0;
    setSuggestedAmounts(updated);
  };
  const removeAmount = (i: number) => setSuggestedAmounts(suggestedAmounts.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-semibold mb-2 block">Suggested Donation Amounts (₦)</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {suggestedAmounts.map((a, i) => (
            <div key={i} className="flex items-center gap-1 bg-[#e9e2d7] rounded-lg px-1">
              <Input type="number" value={a || ""} onChange={(e) => updateAmount(i, e.target.value)} className="w-24 h-8 text-sm border-0 bg-transparent" placeholder="₦" />
              <button onClick={() => removeAmount(i)} className="h-6 w-6 rounded flex items-center justify-center text-[#ee4343] hover:bg-[#ee4343]/10">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addAmount}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Amount
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-semibold">Show Donor List</Label>
            <p className="text-xs text-[#3e7465]">Display donors publicly on the page</p>
          </div>
          <Switch checked={showDonorList} onCheckedChange={setShowDonorList} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-semibold">Allow Donor Message</Label>
            <p className="text-xs text-[#3e7465]">Let donors leave a message with their donation</p>
          </div>
          <Switch checked={allowDonorMessage} onCheckedChange={setAllowDonorMessage} />
        </div>
      </div>
    </div>
  );
};

export default DonationFields;
