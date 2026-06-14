"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Upload, X, ImagePlus, Plus, Trash2, GripVertical, Eye, Link2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";
import { useStore, PaymentPage, LinkConfig, CustomField } from "@/app/hooks/useStore";
import confetti from "canvas-confetti";

const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const defaultConfig: LinkConfig = {
  currency: "NGN",
  amountMode: "fixed",
  active: true,
  brandColor: "#034835",
  buttonColor: "#e1bf46",
  buttonText: "Pay Now",
  successMessage: "Payment successful! Thank you.",
  thankYouMessage: "We've received your payment and a receipt has been sent to your email.",
  collectName: true,
  collectEmail: true,
  collectPhone: true,
  nameRequired: true,
  emailRequired: true,
  phoneRequired: false,
  customFields: [],
  qrColor: "#023528",
  qrBackground: "#f7f0e2",
  qrFrame: "rounded",
};

const CreatePaymentLink = () => {
  const router = useRouter();
  const { addPage } = useStore();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [cover, setCover] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [config, setConfig] = useState<LinkConfig>(defaultConfig);

  const logoRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof LinkConfig>(k: K, v: LinkConfig[K]) => setConfig((c) => ({ ...c, [k]: v }));

  const handleImg = (e: React.ChangeEvent<HTMLInputElement>, fn: (s: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => fn(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const onTitleChange = (t: string) => {
    setTitle(t);
    if (!slug || slug === slugify(title)) setSlug(slugify(t));
  };

  const addCustomField = () => {
    const f: CustomField = { id: crypto.randomUUID(), label: "New field", type: "text", required: false };
    set("customFields", [...config.customFields, f]);
  };
  const updateField = (id: string, patch: Partial<CustomField>) => {
    set("customFields", config.customFields.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };
  const removeField = (id: string) => set("customFields", config.customFields.filter((f) => f.id !== id));

  const canCreate = title.trim() && (config.amountMode === "variable" || Number(price) > 0);

 const handleCreate = () => {
  if (!canCreate) return;
  const id = crypto.randomUUID();
  const finalSlug = slug || slugify(title);
  const page: PaymentPage = {
    id,
    title,
    slug: finalSlug,
    description,
    coverImage: cover,
    logo,
    productImages: [],
    priceType: config.amountMode === "variable" ? "open" : "fixed",
    price: Number(price) || 0,
    feeMode: "bearer",
    virtualAccount: "",
    bankName: "",
    pageBalance: 0,
    totalRevenue: 0,
    totalPayments: 0,
    pageViews: 0,
    createdAt: new Date().toISOString(),
    pageType: "link",
    isPublished: true,
    metadata: {},
    linkConfig: config,
    submissions: [],
  };
  addPage(page);
  confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 }, colors: ["#034835", "#e1bf46", "#f7f0e2"] });
  router.push(`/dashboard/services/payment/page/${id}`);
};
  const previewPrice = config.amountMode === "variable" ? "Buyer chooses" : `${config.currency === "NGN" ? "₦" : config.currency + " "}${(Number(price) || 0).toLocaleString()}`;

  return (
    <div className="min-h-screen bg-[#0e0e0e]">
      <nav className="sticky top-0 z-50 bg-[#0e0e0e]/80 backdrop-blur-lg border-b border-gray-800">
        <div className="container max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#e1bf46] transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <span className="font-['Space_Grotesk',sans-serif] text-lg font-bold flex items-center gap-2 text-white">
            <Link2 className="h-4 w-4 text-[#e1bf46]" /> New Payment Link
          </span>
          <Button 
            variant="default" 
            size="sm" 
            disabled={!canCreate} 
            onClick={handleCreate}
            className="bg-[#e1bf46] text-[#023528] hover:bg-[#e1bf46]/90"
          >
            Create Link
          </Button>
        </div>
      </nav>

      <div className="container max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-[1fr_400px] gap-8">
        {/* Form */}
        <div className="space-y-8 pb-32">
          {/* Basic Information */}
          <section className="space-y-4">
            <h2 className="font-bold text-lg text-white">Basic Information</h2>
            <div>
              <Label className="text-sm font-semibold mb-1.5 block text-gray-300">Link Title *</Label>
              <Input 
                value={title} 
                onChange={(e) => onTitleChange(e.target.value)} 
                placeholder="e.g. Premium Coaching Session" 
                className="h-12 bg-[#1a1a1a] border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold mb-1.5 block text-gray-300">URL</Label>
              <div className="flex items-center rounded-lg border border-gray-700 overflow-hidden bg-[#1a1a1a]">
                <span className="px-3 text-sm text-gray-400 bg-[#1a1a1a] border-r border-gray-700 whitespace-nowrap">zidwell.com/pay/</span>
                <Input 
                  value={slug} 
                  onChange={(e) => setSlug(slugify(e.target.value))} 
                  placeholder="my-link" 
                  className="border-0 h-11 rounded-none focus-visible:ring-0 bg-[#1a1a1a] text-white" 
                />
              </div>
            </div>
            <div>
              <Label className="text-sm font-semibold mb-1.5 block text-gray-300">Short Description</Label>
              <Textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                rows={3} 
                placeholder="What is this payment for?" 
                className="resize-none bg-[#1a1a1a] border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-semibold mb-1.5 block text-gray-300">Currency</Label>
                <select 
                  value={config.currency} 
                  onChange={(e) => set("currency", e.target.value as "NGN" | "USD" | "GBP" | "EUR")} 
                  className="h-12 w-full rounded-md border border-gray-700 bg-[#1a1a1a] px-3 text-sm text-white"
                >
                  <option value="NGN">₦ NGN</option>
                  <option value="USD">$ USD</option>
                  <option value="GBP">£ GBP</option>
                  <option value="EUR">€ EUR</option>
                </select>
              </div>
              <div>
                <Label className="text-sm font-semibold mb-1.5 block text-gray-300">Amount Mode</Label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => set("amountMode", "fixed")} 
                    className={`flex-1 h-12 rounded-md text-sm font-medium border-2 transition-colors ${
                      config.amountMode === "fixed" 
                        ? "border-[#e1bf46] bg-[#e1bf46]/10 text-[#e1bf46]" 
                        : "border-gray-700 bg-[#1a1a1a] text-gray-400 hover:border-[#e1bf46]/50"
                    }`}
                  >
                    Fixed
                  </button>
                  <button 
                    onClick={() => set("amountMode", "variable")} 
                    className={`flex-1 h-12 rounded-md text-sm font-medium border-2 transition-colors ${
                      config.amountMode === "variable" 
                        ? "border-[#e1bf46] bg-[#e1bf46]/10 text-[#e1bf46]" 
                        : "border-gray-700 bg-[#1a1a1a] text-gray-400 hover:border-[#e1bf46]/50"
                    }`}
                  >
                    Variable
                  </button>
                </div>
              </div>
            </div>
            {config.amountMode === "fixed" && (
              <div>
                <Label className="text-sm font-semibold mb-1.5 block text-gray-300">Amount *</Label>
                <Input 
                  type="number" 
                  value={price} 
                  onChange={(e) => setPrice(e.target.value)} 
                  placeholder="5000" 
                  className="h-12 bg-[#1a1a1a] border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>
            )}
            <div>
              <Label className="text-sm font-semibold mb-1.5 block text-gray-300">Reference Code (optional)</Label>
              <Input 
                value={config.referenceCode || ""} 
                onChange={(e) => set("referenceCode", e.target.value)} 
                placeholder="INV-2026-001" 
                className="h-12 bg-[#1a1a1a] border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-[#1a1a1a] border border-gray-800">
              <div>
                <Label className="text-sm font-semibold text-white">Link Active</Label>
                <p className="text-xs text-gray-400">Toggle to enable/disable this link</p>
              </div>
              <Switch checked={config.active} onCheckedChange={(v) => set("active", v)} />
            </div>
          </section>

          {/* Branding */}
          <section className="space-y-4">
            <h2 className="font-bold text-lg text-white">Branding</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-semibold mb-1.5 block text-gray-300">Logo</Label>
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImg(e, setLogo)} />
                {logo ? (
                  <div className="relative h-24 w-24 rounded-xl overflow-hidden group">
                    <img src={logo} className="w-full h-full object-cover" alt="logo" />
                    <button 
                      onClick={() => setLogo(null)} 
                      className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => logoRef.current?.click()} 
                    className="h-24 w-24 rounded-xl border-2 border-dashed border-gray-700 bg-[#1a1a1a] flex items-center justify-center hover:border-[#e1bf46] transition-colors"
                  >
                    <ImagePlus className="h-5 w-5 text-gray-400" />
                  </button>
                )}
              </div>
              <div>
                <Label className="text-sm font-semibold mb-1.5 block text-gray-300">Cover Image</Label>
                <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImg(e, setCover)} />
                {cover ? (
                  <div className="relative h-24 rounded-xl overflow-hidden group">
                    <img src={cover} className="w-full h-full object-cover" alt="cover" />
                    <button 
                      onClick={() => setCover(null)} 
                      className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => coverRef.current?.click()} 
                    className="h-24 w-full rounded-xl border-2 border-dashed border-gray-700 bg-[#1a1a1a] flex items-center justify-center hover:border-[#e1bf46] transition-colors"
                  >
                    <Upload className="h-5 w-5 text-gray-400" />
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ColorField label="Brand Color" value={config.brandColor} onChange={(v) => set("brandColor", v)} />
              <ColorField label="Button Color" value={config.buttonColor} onChange={(v) => set("buttonColor", v)} />
            </div>
            <div>
              <Label className="text-sm font-semibold mb-1.5 block text-gray-300">Button Text</Label>
              <div className="flex gap-2 flex-wrap mb-2">
                {["Pay Now", "Donate", "Book Now", "Register", "Subscribe", "Buy Ticket"].map((t) => (
                  <button 
                    key={t} 
                    onClick={() => set("buttonText", t)} 
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      config.buttonText === t 
                        ? "border-[#e1bf46] bg-[#e1bf46]/10 text-[#e1bf46]" 
                        : "border-gray-700 bg-[#1a1a1a] text-gray-400 hover:border-[#e1bf46]/50"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <Input 
                value={config.buttonText} 
                onChange={(e) => set("buttonText", e.target.value)} 
                className="h-11 bg-[#1a1a1a] border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold mb-1.5 block text-gray-300">Success Message</Label>
              <Input 
                value={config.successMessage} 
                onChange={(e) => set("successMessage", e.target.value)} 
                className="h-11 bg-[#1a1a1a] border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold mb-1.5 block text-gray-300">Thank-You Page Message</Label>
              <Textarea 
                value={config.thankYouMessage} 
                onChange={(e) => set("thankYouMessage", e.target.value)} 
                rows={2} 
                className="resize-none bg-[#1a1a1a] border-gray-700 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-semibold mb-1.5 block text-gray-300">Redirect URL</Label>
                <Input 
                  value={config.redirectUrl || ""} 
                  onChange={(e) => set("redirectUrl", e.target.value)} 
                  placeholder="https://yoursite.com/thank-you" 
                  className="h-11 bg-[#1a1a1a] border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold mb-1.5 block text-gray-300">Alternative Redirect</Label>
                <Input 
                  value={config.altRedirectUrl || ""} 
                  onChange={(e) => set("altRedirectUrl", e.target.value)} 
                  placeholder="https://yoursite.com/cancel" 
                  className="h-11 bg-[#1a1a1a] border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>
            </div>
          </section>

          {/* Customer Information */}
          <section className="space-y-4">
            <h2 className="font-bold text-lg text-white">Customer Information</h2>
            <p className="text-sm text-gray-400 -mt-2">Choose what to collect from buyers</p>
            <div className="space-y-2">
              {[
                { key: "Name", on: "collectName", req: "nameRequired" },
                { key: "Email", on: "collectEmail", req: "emailRequired" },
                { key: "Phone", on: "collectPhone", req: "phoneRequired" },
              ].map((f) => (
                <div key={f.key} className="flex items-center justify-between p-3 rounded-xl bg-[#1a1a1a] border border-gray-800">
                  <div className="flex items-center gap-3">
                    <Switch checked={config[f.on as keyof LinkConfig] as boolean} onCheckedChange={(v) => set(f.on as keyof LinkConfig, v as never)} />
                    <span className="text-sm font-medium text-white">{f.key}</span>
                  </div>
                  {(config[f.on as keyof LinkConfig] as boolean) && (
                    <label className="flex items-center gap-2 text-xs text-gray-400">
                      <input 
                        type="checkbox" 
                        checked={config[f.req as keyof LinkConfig] as boolean} 
                        onChange={(e) => set(f.req as keyof LinkConfig, e.target.checked as never)} 
                        className="rounded border-gray-600"
                      />
                      Required
                    </label>
                  )}
                </div>
              ))}
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-semibold text-white">Custom Fields</Label>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={addCustomField}
                  className="border-[#e1bf46] text-[#e1bf46] hover:bg-[#e1bf46]/10"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Field
                </Button>
              </div>
              <div className="space-y-3">
                {config.customFields.map((f) => (
                  <div key={f.id} className="p-3 rounded-xl bg-[#1a1a1a] border border-gray-800 space-y-2">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-gray-400" />
                      <Input 
                        value={f.label} 
                        onChange={(e) => updateField(f.id, { label: e.target.value })} 
                        placeholder="Field label" 
                        className="h-10 bg-[#0e0e0e] border-gray-700 text-white"
                      />
                      <select 
                        value={f.type} 
                        onChange={(e) => updateField(f.id, { type: e.target.value as "text" | "number" | "date" | "dropdown" | "checkbox" | "paragraph" })} 
                        className="h-10 rounded-md border border-gray-700 bg-[#1a1a1a] px-2 text-sm text-white"
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                        <option value="dropdown">Dropdown</option>
                        <option value="checkbox">Checkbox</option>
                        <option value="paragraph">Paragraph</option>
                      </select>
                      <button 
                        onClick={() => removeField(f.id)} 
                        className="h-10 w-10 rounded-md flex items-center justify-center text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {f.type === "dropdown" && (
                      <Input 
                        value={(f.options || []).join(", ")} 
                        onChange={(e) => updateField(f.id, { options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} 
                        placeholder="Option 1, Option 2, Option 3" 
                        className="h-10 bg-[#0e0e0e] border-gray-700 text-white placeholder:text-gray-500"
                      />
                    )}
                    <label className="flex items-center gap-2 text-xs text-gray-400">
                      <input 
                        type="checkbox" 
                        checked={f.required} 
                        onChange={(e) => updateField(f.id, { required: e.target.checked })} 
                        className="rounded border-gray-600"
                      />
                      Required
                    </label>
                  </div>
                ))}
                {config.customFields.length === 0 && (
                  <p className="text-xs text-gray-500 text-center py-4">No custom fields. Add fields like Passport Number, Booking Date, etc.</p>
                )}
              </div>
            </div>
          </section>

          {/* QR Code Customization */}
          <section className="space-y-4">
            <h2 className="font-bold text-lg text-white">QR Code Style</h2>
            <div className="grid grid-cols-2 gap-3">
              <ColorField label="QR Color" value={config.qrColor} onChange={(v) => set("qrColor", v)} />
              <ColorField label="Background" value={config.qrBackground} onChange={(v) => set("qrBackground", v)} />
            </div>
            <div>
              <Label className="text-sm font-semibold mb-1.5 block text-gray-300">Frame Style</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["round", "rounded", "square"] as const).map((s) => (
                  <button 
                    key={s} 
                    onClick={() => set("qrFrame", s)} 
                    className={`h-12 rounded-md border-2 text-sm font-medium capitalize transition-colors ${
                      config.qrFrame === s 
                        ? "border-[#e1bf46] bg-[#e1bf46]/10 text-[#e1bf46]" 
                        : "border-gray-700 bg-[#1a1a1a] text-gray-400 hover:border-[#e1bf46]/50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Live Preview */}
        <div className="lg:sticky lg:top-24 self-start">
          <div className="flex items-center gap-2 mb-3 text-sm text-gray-400">
            <Eye className="h-4 w-4" /> Live Preview
          </div>
          <PreviewCard
            title={title || "Your link title"}
            description={description}
            logo={logo}
            cover={cover}
            previewPrice={previewPrice}
            config={config}
          />
        </div>
      </div>
    </div>
  );
};

const ColorField = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div>
    <Label className="text-sm font-semibold mb-1.5 block text-gray-300">{label}</Label>
    <div className="flex items-center gap-2 rounded-md border border-gray-700 bg-[#1a1a1a] px-2 h-12">
      <input 
        type="color" 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        className="h-8 w-10 rounded cursor-pointer bg-transparent border-0" 
      />
      <input 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        className="bg-transparent text-sm font-mono flex-1 outline-none text-white" 
      />
    </div>
  </div>
);

const PreviewCard = ({ title, description, logo, cover, previewPrice, config }: {
  title: string; description: string; logo: string | null; cover: string | null; previewPrice: string; config: LinkConfig;
}) => (
  <motion.div
    layout
    className="rounded-3xl overflow-hidden shadow-2xl border border-gray-800 bg-[#1a1a1a]"
    style={{ borderTop: `4px solid ${config.brandColor}` }}
  >
    {cover && <img src={cover} alt="cover" className="w-full h-32 object-cover" />}
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        {logo ? (
          <img src={logo} alt="logo" className="h-12 w-12 rounded-xl object-cover" />
        ) : (
          <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ background: `${config.brandColor}15` }}>
            <Link2 className="h-5 w-5" style={{ color: config.brandColor }} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base truncate text-white">{title}</h3>
          {description && <p className="text-xs text-gray-400 line-clamp-2">{description}</p>}
        </div>
      </div>
      <div className="py-3 border-y border-gray-800">
        <div className="text-xs text-gray-400">Amount</div>
        <div className="text-2xl font-bold" style={{ color: config.brandColor }}>{previewPrice}</div>
      </div>
      <div className="space-y-2">
        {config.collectName && <FieldPreview label={`Full Name${config.nameRequired ? " *" : ""}`} />}
        {config.collectEmail && <FieldPreview label={`Email${config.emailRequired ? " *" : ""}`} />}
        {config.collectPhone && <FieldPreview label={`Phone${config.phoneRequired ? " *" : ""}`} />}
        {config.customFields.slice(0, 3).map((f) => <FieldPreview key={f.id} label={`${f.label}${f.required ? " *" : ""}`} />)}
        {config.customFields.length > 3 && <p className="text-xs text-gray-500">+ {config.customFields.length - 3} more fields</p>}
      </div>
      <button
        className="w-full h-12 rounded-xl font-bold text-sm transition-transform hover:scale-[1.02]"
        style={{ background: config.buttonColor, color: config.brandColor }}
      >
        {config.buttonText}
      </button>
      <p className="text-[10px] text-center text-gray-500">Secured by Zidwell</p>
    </div>
  </motion.div>
);

const FieldPreview = ({ label }: { label: string }) => (
  <div>
    <div className="text-[10px] text-gray-500 mb-0.5">{label}</div>
    <div className="h-9 rounded-md border border-gray-800 bg-[#0e0e0e]" />
  </div>
);

export default CreatePaymentLink;