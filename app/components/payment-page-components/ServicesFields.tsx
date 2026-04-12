import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";

interface Props {
  bookingEnabled: boolean;
  setBookingEnabled: (v: boolean) => void;
  customerNoteEnabled: boolean;
  setCustomerNoteEnabled: (v: boolean) => void;
}

const ServicesFields = ({ bookingEnabled, setBookingEnabled, customerNoteEnabled, setCustomerNoteEnabled }: Props) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <Label className="text-sm font-semibold">Enable Booking</Label>
        <p className="text-xs text-[#3e7465]">Let customers pick a date & time</p>
      </div>
      <Switch checked={bookingEnabled} onCheckedChange={setBookingEnabled} />
    </div>
    <div className="flex items-center justify-between">
      <div>
        <Label className="text-sm font-semibold">Customer Note</Label>
        <p className="text-xs text-[#3e7465]">Allow customers to describe their request</p>
      </div>
      <Switch checked={customerNoteEnabled} onCheckedChange={setCustomerNoteEnabled} />
    </div>
  </div>
);

export default ServicesFields;
