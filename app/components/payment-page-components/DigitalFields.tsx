// app/components/payment-page-components/DigitalFields.tsx
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
  price?: number;
  onPriceChange?: (price: number) => void;
}

const DigitalFields = ({ 
  downloadUrl, 
  setDownloadUrl, 
  accessLink, 
  setAccessLink, 
  emailDelivery, 
  setEmailDelivery,
  price,
  onPriceChange 
}: Props) => (
  <div className="space-y-6">
    <div>
      <Label className="text-sm font-semibold mb-2 block">Download URL</Label>
      <Input 
        placeholder="https://drive.google.com/file/..." 
        value={downloadUrl} 
        onChange={(e) => setDownloadUrl(e.target.value)} 
        className="h-12 text-base" 
      />
      <p className="text-xs text-[#3e7465] mt-1">Link to file that buyers get after payment</p>
    </div>
    
    <div>
      <Label className="text-sm font-semibold mb-2 block">Access Link (alternative)</Label>
      <Input 
        placeholder="https://your-course.com/access" 
        value={accessLink} 
        onChange={(e) => setAccessLink(e.target.value)} 
        className="h-12 text-base" 
      />
      <p className="text-xs text-[#3e7465] mt-1">Or provide a link to access content instead of download</p>
    </div>
    
    <div className="flex items-center justify-between">
      <div>
        <Label className="text-sm font-semibold">Email Delivery</Label>
        <p className="text-xs text-[#3e7465]">Send product link via email after payment</p>
      </div>
      <Switch checked={emailDelivery} onCheckedChange={setEmailDelivery} />
    </div>
  </div>
);

export default DigitalFields;