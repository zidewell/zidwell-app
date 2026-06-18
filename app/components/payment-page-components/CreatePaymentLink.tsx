"use client";

import { useRef, useState, useEffect, useId } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Upload,
  X,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  Link2,
  RefreshCw,
  CheckCircle,
  Copy,
  Loader2,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";
import { useStore, CustomField, LinkConfig } from "@/app/hooks/useStore";
import { useUserContextData } from "@/app/context/userData";
import confetti from "canvas-confetti";

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const defaultConfig: LinkConfig = {
  currency: "NGN",
  amountMode: "fixed",
  active: true,
  brandColor: "#034835",
  buttonColor: "#e1bf46",
  buttonText: "Pay Now",
  successMessage: "Payment successful! Thank you.",
  thankYouMessage:
    "We've received your payment and a receipt has been sent to your email.",
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
  const { createPage } = useStore();
  const { userData } = useUserContextData();
  const generatedId = useId();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [config, setConfig] = useState<LinkConfig>(defaultConfig);
  const [isMounted, setIsMounted] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdSlug, setCreatedSlug] = useState("");
  const [copied, setCopied] = useState(false);

  const logoRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof LinkConfig>(k: K, v: LinkConfig[K]) =>
    setConfig((c) => ({ ...c, [k]: v }));

  // Generate a unique 4-digit identifier
  const generateIdentifier = (): string => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  // Generate full slug with 4-digit identifier at the front
  const generateFullSlug = (titleText: string): string => {
    const baseSlug = slugify(titleText);
    const identifier = generateIdentifier();
    return `${identifier}-${baseSlug}`;
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Set default logo from profile picture (like other page types)
  useEffect(() => {
    if (userData?.profilePicture && !logoPreview) {
      setLogoPreview(userData.profilePicture);
    }
  }, [userData?.profilePicture]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setLogo(result);
      setLogoPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const onTitleChange = (t: string) => {
    setTitle(t);
    // Auto-generate slug with 4-digit identifier at the front
    if (t) {
      const baseSlug = slugify(t);
      const identifier = generateIdentifier();
      setSlug(`${identifier}-${baseSlug}`);
    } else {
      setSlug("");
    }
  };

  const addCustomField = () => {
    const f: CustomField = {
      id: crypto.randomUUID(),
      label: "New field",
      type: "text",
      required: false,
    };
    set("customFields", [...config.customFields, f]);
  };
  const updateField = (id: string, patch: Partial<CustomField>) => {
    set(
      "customFields",
      config.customFields.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    );
  };
  const removeField = (id: string) =>
    set(
      "customFields",
      config.customFields.filter((f) => f.id !== id),
    );

  const canCreate =
    title.trim() && (config.amountMode === "variable" || Number(price) > 0);

  // Generate final slug - always with 4-digit identifier at the front
  const generateFinalSlug = () => {
    const baseSlug = slugify(title);
    // Extract identifier from current slug if it exists and is 4 digits
    const slugParts = slug?.split("-") || [];
    let identifier = slugParts[0] || generateIdentifier();
    // Ensure identifier is exactly 4 digits
    if (!/^\d{4}$/.test(identifier)) {
      identifier = generateIdentifier();
    }
    return `${baseSlug}-${identifier}`;
  };

  const pageUrl = `${window.location.origin}/pay/${createdSlug}`;
  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const regenerateSlug = () => {
    const baseSlug = slugify(title);
    const newIdentifier = generateIdentifier();
    setSlug(`${baseSlug}-${newIdentifier}`);
  };

  const handleCreate = async () => {
    if (!canCreate) return;
    setIsCreating(true);

    try {
      const finalSlug = generateFinalSlug();

      // Prepare metadata with link configuration
      const metadata = {
        pageType: "link",
        linkConfig: {
          currency: config.currency,
          amountMode: config.amountMode,
          active: config.active,
          brandColor: config.brandColor,
          buttonColor: config.buttonColor,
          buttonText: config.buttonText,
          successMessage: config.successMessage,
          thankYouMessage: config.thankYouMessage,
          redirectUrl: config.redirectUrl,
          altRedirectUrl: config.altRedirectUrl,
          referenceCode: config.referenceCode,
          collectName: config.collectName,
          collectEmail: config.collectEmail,
          collectPhone: config.collectPhone,
          nameRequired: config.nameRequired,
          emailRequired: config.emailRequired,
          phoneRequired: config.phoneRequired,
          customFields: config.customFields,
          qrColor: config.qrColor,
          qrBackground: config.qrBackground,
          qrFrame: config.qrFrame,
          createdAt: new Date().toISOString(),
        },
      };

      // Use the same create API as other page types
      const pageData = {
        title: title,
        slug: finalSlug,
        description: description,
        coverImage: null,
        logo: logo || userData?.profilePicture || null,
        productImages: [],
        priceType: config.amountMode === "variable" ? "open" : "fixed",
        price: Number(price) || 0,
        installmentCount: null,
        feeMode: "bearer",
        pageType: "link",
        metadata: metadata,
      };

      console.log("Creating payment link via API:", pageData);

      const result = await createPage(pageData);

      if (!result || !result.slug) {
        throw new Error("Failed to create payment link - no slug returned");
      }

      // Check if virtual account was created
      if (result.virtualAccount) {
        console.log("✅ Virtual Account created:", result.virtualAccount);
      } else {
        console.warn(
          "⚠️ Virtual Account might not have been created. Check server logs.",
        );
      }

      setCreatedSlug(result.slug);

      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.5 },
        colors: ["#034835", "#e1bf46", "#f7f0e2"],
      });
      setShowSuccess(true);
    } catch (err: any) {
      console.error("Error creating payment link:", err);
      alert(err.message || "Failed to create payment link. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const previewPrice =
    config.amountMode === "variable"
      ? "Buyer chooses"
      : `${config.currency === "NGN" ? "₦" : config.currency + " "}${(Number(price) || 0).toLocaleString()}`;

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#e1bf46]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e0e]">
      <nav className="sticky top-0 z-50 bg-[#0e0e0e]/80 backdrop-blur-lg border-b border-gray-800">
        <div className="container max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#e1bf46] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <span className="font-['Space_Grotesk',sans-serif] text-lg font-bold flex items-center gap-2 text-white">
            <Link2 className="h-4 w-4 text-[#e1bf46]" /> Payment Link
          </span>
          <Button
            variant="default"
            size="sm"
            disabled={!canCreate || isCreating}
            onClick={handleCreate}
            className="bg-[#e1bf46] text-[#023528] hover:bg-[#e1bf46]/90"
          >
            {isCreating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Create Link"
            )}
          </Button>
        </div>
      </nav>

      <div className="container max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-[1fr_400px] gap-8">
        {/* Form */}
        <div className="space-y-8 pb-32">
          {/* Logo - Like other page types */}
          <div>
            <Label className="text-sm font-semibold mb-2 block text-gray-300">
              Logo / Profile Picture
            </Label>
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <div className="relative group">
                  <img
                    src={logoPreview}
                    alt="Logo"
                    className={`h-20 w-20 object-cover ${!logo && userData?.profilePicture ? "rounded-full" : "rounded-2xl"}`}
                  />
                  {logo && (
                    <button
                      onClick={() => {
                        setLogo(null);
                        setLogoPreview(null);
                      }}
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="h-20 w-20 rounded-2xl bg-[#1a1a1a] border-2 border-dashed border-gray-700 flex items-center justify-center">
                  <Upload className="h-6 w-6 text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  ref={logoRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleLogoUpload}
                />
                <button
                  onClick={() => logoRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-700 rounded-xl bg-[#1a1a1a]/50 hover:border-[#e1bf46] transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  <span className="text-sm">Upload Logo</span>
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  Square image recommended (e.g., 200x200px)
                </p>
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <Label className="text-sm font-semibold mb-2 block text-gray-300">
              Link Title *
            </Label>
            <Input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="e.g. Premium Coaching Session"
              className="h-12 bg-[#1a1a1a] border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>

          {/* URL Preview with 4-digit identifier */}
          {title && (
            <div className="bg-[#1a1a1a]/50 rounded-lg p-4 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-semibold text-[#e1bf46]">
                  Your Payment Link URL:
                </Label>
                <button
                  onClick={regenerateSlug}
                  className="flex items-center gap-1 text-xs text-[#e1bf46] hover:text-[#e1bf46]/80 transition-colors"
                >
                  <RefreshCw className="h-3 w-3" /> New ID
                </button>
              </div>
              <div className="flex items-center gap-2 bg-[#0e0e0e] p-3 rounded-lg border border-gray-800">
                <Link2 className="h-4 w-4 text-[#e1bf46] shrink-0" />
                <code className="text-sm font-mono text-gray-300 break-all">
                  {window.location.origin}/pay/{generateFinalSlug()}
                </code>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 Your URL includes a unique 4-digit identifier (e.g., 2135-web-dev)
              </p>
            </div>
          )}

          {/* Description */}
          <div>
            <Label className="text-sm font-semibold mb-2 block text-gray-300">
              Short Description
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What is this payment for?"
              className="resize-none bg-[#1a1a1a] border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>

          {/* Currency and Amount Mode */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-semibold mb-2 block text-gray-300">
                Currency
              </Label>
              <select
                value={config.currency}
                onChange={(e) =>
                  set(
                    "currency",
                    e.target.value as "NGN" | "USD" | "GBP" | "EUR",
                  )
                }
                className="h-12 w-full rounded-md border border-gray-700 bg-[#1a1a1a] px-3 text-sm text-white"
              >
                <option value="NGN">₦ NGN</option>
                <option value="USD">$ USD</option>
                <option value="GBP">£ GBP</option>
                <option value="EUR">€ EUR</option>
              </select>
            </div>
            <div>
              <Label className="text-sm font-semibold mb-2 block text-gray-300">
                Amount Mode
              </Label>
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

          {/* Amount for fixed mode */}
          {config.amountMode === "fixed" && (
            <div>
              <Label className="text-sm font-semibold mb-2 block text-gray-300">
                Amount *
              </Label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="5000"
                className="h-12 bg-[#1a1a1a] border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
          )}

          {/* Reference Code */}
          <div>
            <Label className="text-sm font-semibold mb-2 block text-gray-300">
              Reference Code (optional)
            </Label>
            <Input
              value={config.referenceCode || ""}
              onChange={(e) => set("referenceCode", e.target.value)}
              placeholder="INV-2026-001"
              className="h-12 bg-[#1a1a1a] border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>

          {/* Link Active */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-[#1a1a1a] border border-gray-800">
            <div>
              <Label className="text-sm font-semibold text-white">
                Link Active
              </Label>
              <p className="text-xs text-gray-400">
                Toggle to enable/disable this link
              </p>
            </div>
            <Switch
              checked={config.active}
              onCheckedChange={(v) => set("active", v)}
            />
          </div>

          {/* Branding Colors */}
          <div className="grid grid-cols-2 gap-3">
            <ColorField
              label="Brand Color"
              value={config.brandColor}
              onChange={(v) => set("brandColor", v)}
            />
            <ColorField
              label="Button Color"
              value={config.buttonColor}
              onChange={(v) => set("buttonColor", v)}
            />
          </div>

          {/* Button Text */}
          <div>
            <Label className="text-sm font-semibold mb-2 block text-gray-300">
              Button Text
            </Label>
            <div className="flex gap-2 flex-wrap mb-2">
              {[
                "Pay Now",
                "Donate",
                "Book Now",
                "Register",
                "Subscribe",
                "Buy Ticket",
              ].map((t) => (
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

          {/* Success Message */}
          <div>
            <Label className="text-sm font-semibold mb-2 block text-gray-300">
              Success Message
            </Label>
            <Input
              value={config.successMessage}
              onChange={(e) => set("successMessage", e.target.value)}
              className="h-11 bg-[#1a1a1a] border-gray-700 text-white"
            />
          </div>

          {/* Thank You Message */}
          <div>
            <Label className="text-sm font-semibold mb-2 block text-gray-300">
              Thank-You Page Message
            </Label>
            <Textarea
              value={config.thankYouMessage}
              onChange={(e) => set("thankYouMessage", e.target.value)}
              rows={2}
              className="resize-none bg-[#1a1a1a] border-gray-700 text-white"
            />
          </div>

          {/* Redirect URLs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-semibold mb-2 block text-gray-300">
                Redirect URL
              </Label>
              <Input
                value={config.redirectUrl || ""}
                onChange={(e) => set("redirectUrl", e.target.value)}
                placeholder="https://yoursite.com/thank-you"
                className="h-11 bg-[#1a1a1a] border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold mb-2 block text-gray-300">
                Alternative Redirect
              </Label>
              <Input
                value={config.altRedirectUrl || ""}
                onChange={(e) => set("altRedirectUrl", e.target.value)}
                placeholder="https://yoursite.com/cancel"
                className="h-11 bg-[#1a1a1a] border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
          </div>

          {/* Customer Information Collection */}
          <div className="space-y-3">
            <h3 className="font-bold text-lg text-white">
              Customer Information
            </h3>
            <p className="text-sm text-gray-400 -mt-2">
              Choose what to collect from buyers
            </p>

            {[
              { key: "Name", on: "collectName", req: "nameRequired" },
              { key: "Email", on: "collectEmail", req: "emailRequired" },
              { key: "Phone", on: "collectPhone", req: "phoneRequired" },
            ].map((f) => (
              <div
                key={f.key}
                className="flex items-center justify-between p-3 rounded-xl bg-[#1a1a1a] border border-gray-800"
              >
                <div className="flex items-center gap-3">
                  <Switch
                    checked={config[f.on as keyof LinkConfig] as boolean}
                    onCheckedChange={(v) =>
                      set(f.on as keyof LinkConfig, v as never)
                    }
                  />
                  <span className="text-sm font-medium text-white">
                    {f.key}
                  </span>
                </div>
                {(config[f.on as keyof LinkConfig] as boolean) && (
                  <label className="flex items-center gap-2 text-xs text-gray-400">
                    <input
                      type="checkbox"
                      checked={config[f.req as keyof LinkConfig] as boolean}
                      onChange={(e) =>
                        set(
                          f.req as keyof LinkConfig,
                          e.target.checked as never,
                        )
                      }
                      className="rounded border-gray-600"
                    />
                    Required
                  </label>
                )}
              </div>
            ))}
          </div>

          {/* Custom Fields */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-semibold text-white">
                Custom Fields
              </Label>
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
                <div
                  key={f.id}
                  className="p-3 rounded-xl bg-[#1a1a1a] border border-gray-800 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-gray-400" />
                    <Input
                      value={f.label}
                      onChange={(e) =>
                        updateField(f.id, { label: e.target.value })
                      }
                      placeholder="Field label"
                      className="h-10 bg-[#0e0e0e] border-gray-700 text-white"
                    />
                    <select
                      value={f.type}
                      onChange={(e) =>
                        updateField(f.id, {
                          type: e.target.value as
                            | "text"
                            | "number"
                            | "date"
                            | "dropdown"
                            | "checkbox"
                            | "paragraph",
                        })
                      }
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
                      onChange={(e) =>
                        updateField(f.id, {
                          options: e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder="Option 1, Option 2, Option 3"
                      className="h-10 bg-[#0e0e0e] border-gray-700 text-white placeholder:text-gray-500"
                    />
                  )}
                  <label className="flex items-center gap-2 text-xs text-gray-400">
                    <input
                      type="checkbox"
                      checked={f.required}
                      onChange={(e) =>
                        updateField(f.id, { required: e.target.checked })
                      }
                      className="rounded border-gray-600"
                    />
                    Required
                  </label>
                </div>
              ))}
              {config.customFields.length === 0 && (
                <p className="text-xs text-gray-500 text-center py-4">
                  No custom fields. Add fields like Passport Number, Booking
                  Date, etc.
                </p>
              )}
            </div>
          </div>

          {/* QR Code Customization */}
          <div className="space-y-3">
            <h3 className="font-bold text-lg text-white">QR Code Style</h3>
            <div className="grid grid-cols-2 gap-3">
              <ColorField
                label="QR Color"
                value={config.qrColor}
                onChange={(v) => set("qrColor", v)}
              />
              <ColorField
                label="Background"
                value={config.qrBackground}
                onChange={(v) => set("qrBackground", v)}
              />
            </div>
            <div>
              <Label className="text-sm font-semibold mb-2 block text-gray-300">
                Frame Style
              </Label>
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
          </div>
        </div>

        {/* Live Preview */}
        <div className="lg:sticky lg:top-24 self-start">
          <div className="flex items-center gap-2 mb-3 text-sm text-gray-400">
            <Eye className="h-4 w-4" /> Live Preview
          </div>
          <PreviewCard
            title={title || "Your link title"}
            description={description}
            logo={logoPreview}
            previewPrice={previewPrice}
            config={config}
          />
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl p-6 max-w-sm w-full text-center border border-gray-700">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-white mb-2">
              Payment Link Created!
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Your payment link is now live and ready to collect payments.
            </p>
            <div className="bg-[#0e0e0e] rounded-lg p-3 mb-4">
              <code className="text-xs text-[#e1bf46] break-all">
                {pageUrl}
              </code>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => copyToClipboard(pageUrl)}
                className="flex-1 bg-[#e1bf46] text-[#023528] hover:bg-[#e1bf46]/90"
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                {copied ? "Copied!" : "Copy Link"}
              </Button>
              <Button
                onClick={() =>
                  router.push("/dashboard/services/payment/dashboard")
                }
                variant="outline"
                className="flex-1 border-gray-700 text-white hover:bg-gray-800"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ColorField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <div>
    <Label className="text-sm font-semibold mb-2 block text-gray-300">
      {label}
    </Label>
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

const PreviewCard = ({
  title,
  description,
  logo,
  previewPrice,
  config,
}: {
  title: string;
  description: string;
  logo: string | null;
  previewPrice: string;
  config: LinkConfig;
}) => {
  // Use logo as cover image if no cover exists
  const coverImage = logo || null;

  return (
    <motion.div
      layout
      className="rounded-3xl overflow-hidden shadow-2xl border border-gray-800 bg-[#1a1a1a]"
      style={{ borderTop: `4px solid ${config.brandColor}` }}
    >
      {/* Cover Image - uses logo as fallback */}
      {coverImage && (
        <div className="w-full h-32 overflow-hidden bg-gray-800">
          <img
            src={coverImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          {logo ? (
            <img
              src={logo}
              alt="logo"
              className="h-12 w-12 rounded-xl object-cover"
            />
          ) : (
            <div
              className="h-12 w-12 rounded-xl flex items-center justify-center"
              style={{ background: `${config.brandColor}15` }}
            >
              <Link2 className="h-5 w-5" style={{ color: config.brandColor }} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base truncate text-white">{title}</h3>
            {description && (
              <p className="text-xs text-gray-400 line-clamp-2">{description}</p>
            )}
          </div>
        </div>
        <div className="py-3 border-y border-gray-800">
          <div className="text-xs text-gray-400">Amount</div>
          <div
            className="text-2xl font-bold"
            style={{ color: config.brandColor }}
          >
            {previewPrice}
          </div>
        </div>
        <div className="space-y-2">
          {config.collectName && (
            <FieldPreview label={`Full Name${config.nameRequired ? " *" : ""}`} />
          )}
          {config.collectEmail && (
            <FieldPreview label={`Email${config.emailRequired ? " *" : ""}`} />
          )}
          {config.collectPhone && (
            <FieldPreview label={`Phone${config.phoneRequired ? " *" : ""}`} />
          )}
          {config.customFields.slice(0, 3).map((f) => (
            <FieldPreview
              key={f.id}
              label={`${f.label}${f.required ? " *" : ""}`}
            />
          ))}
          {config.customFields.length > 3 && (
            <p className="text-xs text-gray-500">
              + {config.customFields.length - 3} more fields
            </p>
          )}
        </div>
        <button
          className="w-full h-12 rounded-xl font-bold text-sm transition-transform hover:scale-[1.02]"
          style={{ background: config.buttonColor, color: config.brandColor }}
        >
          {config.buttonText}
        </button>
        <p className="text-[10px] text-center text-gray-500">
          Secured by Zidwell
        </p>
      </div>
    </motion.div>
  );
};

const FieldPreview = ({ label }: { label: string }) => (
  <div>
    <div className="text-[10px] text-gray-500 mb-0.5">{label}</div>
    <div className="h-9 rounded-md border border-gray-800 bg-[#0e0e0e]" />
  </div>
);

export default CreatePaymentLink;