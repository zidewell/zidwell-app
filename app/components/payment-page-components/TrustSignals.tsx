// app/components/payment-page-components/TrustSignals.tsx
import { useRef } from "react";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { Upload, X, Plus, Shield, Globe, Phone, Video } from "lucide-react";

interface SocialLink {
  platform: string;
  url: string;
}

interface Props {
  cacCertificate: string;
  setCacCertificate: (v: string) => void;
  taxClearance: string;
  setTaxClearance: (v: string) => void;
  explainerVideo: string;
  setExplainerVideo: (v: string) => void;
  socialLinks: SocialLink[];
  setSocialLinks: (v: SocialLink[]) => void;
  website: string;
  setWebsite: (v: string) => void;
  contactInfo: string;
  setContactInfo: (v: string) => void;
}

const TrustSignals = ({
  cacCertificate,
  setCacCertificate,
  taxClearance,
  setTaxClearance,
  explainerVideo,
  setExplainerVideo,
  socialLinks,
  setSocialLinks,
  website,
  setWebsite,
  contactInfo,
  setContactInfo,
}: Props) => {
  const cacRef = useRef<HTMLInputElement>(null);
  const taxRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (v: string) => void,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setter(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const addSocialLink = () =>
    setSocialLinks([...socialLinks, { platform: "", url: "" }]);
  const removeSocialLink = (i: number) =>
    setSocialLinks(socialLinks.filter((_, idx) => idx !== i));
  const updateSocialLink = (
    i: number,
    field: "platform" | "url",
    value: string,
  ) => {
    const updated = [...socialLinks];
    updated[i] = { ...updated[i], [field]: value };
    setSocialLinks(updated);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <Shield className="h-4 w-4 text-[#e1bf46]" />
        <h4 className="text-sm font-bold">Trust Signals (Optional)</h4>
      </div>
      <p className="text-xs text-[#3e7465] -mt-3">
        These improve buyer confidence but are NOT verified by Zidwell.
      </p>

      {/* CAC Certificate */}
      <div>
        <Label className="text-sm font-semibold mb-1.5 block">
          CAC Certificate
        </Label>
        <input
          type="file"
          ref={cacRef}
          className="hidden"
          accept="image/*,.pdf"
          onChange={(e) => handleFileUpload(e, setCacCertificate)}
        />
        {cacCertificate ? (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#e9e2d7]/50 border border-[#ded4c3]">
            <span className="text-sm text-[#28a36a] font-medium">
              ✓ Uploaded
            </span>
            <button onClick={() => setCacCertificate("")} className="ml-auto">
              <X className="h-4 w-4 text-[#3e7465]" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => cacRef.current?.click()}
            className="w-full p-3 rounded-xl border-2 border-dashed border-[#ded4c3] text-sm text-[#3e7465] hover:border-[#e1bf46]/50 transition-colors flex items-center justify-center gap-2"
          >
            <Upload className="h-4 w-4" /> Upload CAC Certificate
          </button>
        )}
      </div>

      {/* Tax Clearance */}
      <div>
        <Label className="text-sm font-semibold mb-1.5 block">
          Tax Clearance Certificate
        </Label>
        <input
          type="file"
          ref={taxRef}
          className="hidden"
          accept="image/*,.pdf"
          onChange={(e) => handleFileUpload(e, setTaxClearance)}
        />
        {taxClearance ? (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#e9e2d7]/50 border border-[#ded4c3]">
            <span className="text-sm text-[#28a36a] font-medium">
              ✓ Uploaded
            </span>
            <button onClick={() => setTaxClearance("")} className="ml-auto">
              <X className="h-4 w-4 text-[#3e7465]" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => taxRef.current?.click()}
            className="w-full p-3 rounded-xl border-2 border-dashed border-[#ded4c3] text-sm text-[#3e7465] hover:border-[#e1bf46]/50 transition-colors flex items-center justify-center gap-2"
          >
            <Upload className="h-4 w-4" /> Upload Tax Clearance
          </button>
        )}
      </div>

      {/* Explainer Video */}
      <div>
        <Label className="text-sm font-semibold mb-1.5  flex items-center gap-2">
          <Video className="h-4 w-4" /> Explainer Video
          <span className="px-2 py-0.5 rounded-full bg-[#e1bf46]/10 text-[#e1bf46] text-[10px] font-bold">
            PREMIUM
          </span>
        </Label>
        <input
          type="file"
          ref={videoRef}
          className="hidden"
          accept="video/*"
          onChange={(e) => handleFileUpload(e, setExplainerVideo)}
        />
        {explainerVideo ? (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#e9e2d7]/50 border border-[#ded4c3]">
            <span className="text-sm text-[#28a36a] font-medium">
              ✓ Video uploaded
            </span>
            <button onClick={() => setExplainerVideo("")} className="ml-auto">
              <X className="h-4 w-4 text-[#3e7465]" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => videoRef.current?.click()}
            className="w-full p-3 rounded-xl border-2 border-dashed border-[#ded4c3] text-sm text-[#3e7465] hover:border-[#e1bf46]/50 transition-colors flex items-center justify-center gap-2"
          >
            <Upload className="h-4 w-4" /> Upload 1-min Video
          </button>
        )}
      </div>

      {/* Social Links */}
      <div>
        <Label className="text-sm font-semibold mb-2 block">
          Social Media Links
        </Label>
        <div className="space-y-2">
          {socialLinks.map((link, i) => (
            <div key={i} className="flex gap-2">
              <Input
                placeholder="Platform (e.g. Twitter)"
                value={link.platform}
                onChange={(e) =>
                  updateSocialLink(i, "platform", e.target.value)
                }
                className="h-10 flex-1"
              />
              <Input
                placeholder="https://..."
                value={link.url}
                onChange={(e) => updateSocialLink(i, "url", e.target.value)}
                className="h-10 flex-2"
              />
              <button onClick={() => removeSocialLink(i)}>
                <X className="h-4 w-4 text-[#3e7465]" />
              </button>
            </div>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={addSocialLink}
          className="mt-2 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" /> Add Social Link
        </Button>
      </div>

      {/* Website */}
      <div>
        <Label className="text-sm font-semibold mb-1.5  flex items-center gap-2">
          <Globe className="h-4 w-4" /> Website
        </Label>
        <Input
          placeholder="https://yourwebsite.com"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="h-12"
        />
      </div>

      {/* Contact Info */}
      <div>
        <Label className="text-sm font-semibold mb-1.5  flex items-center gap-2">
          <Phone className="h-4 w-4" /> Contact Info
        </Label>
        <Input
          placeholder="Phone number or email"
          value={contactInfo}
          onChange={(e) => setContactInfo(e.target.value)}
          className="h-12"
        />
      </div>
    </div>
  );
};

export default TrustSignals;