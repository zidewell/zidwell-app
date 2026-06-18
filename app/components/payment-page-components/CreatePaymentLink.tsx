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
import { useTheme } from "@/app/components/ThemeProvider";

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const defaultConfig: LinkConfig = {
  currency: "NGN",
  amountMode: "fixed",
  active: true,
  brandColor: "#FDC020",
  buttonColor: "#FDC020",
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
  qrColor: "#191919",
  qrBackground: "#F5F5F5",
  qrFrame: "rounded",
};

const CreatePaymentLink = () => {
  const router = useRouter();
  const { createPage } = useStore();
  const { userData } = useUserContextData();
  const { theme } = useTheme();
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

  const generateIdentifier = (): string => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const generateFullSlug = (titleText: string): string => {
    const baseSlug = slugify(titleText);
    const identifier = generateIdentifier();
    return `${identifier}-${baseSlug}`;
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  const generateFinalSlug = () => {
    const baseSlug = slugify(title);
    const slugParts = slug?.split("-") || [];
    let identifier = slugParts[0] || generateIdentifier();
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

      const result = await createPage(pageData);

      if (!result || !result.slug) {
        throw new Error("Failed to create payment link - no slug returned");
      }

      setCreatedSlug(result.slug);

      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.5 },
        colors: ["#FDC020", "#191919", "#00B64F"],
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
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent-yellow)]" />
      </div>
    );
  }

  const isDark = theme === "dark";

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <nav className=" bg-[var(--bg-primary)]/80 backdrop-blur-lg border-b border-[var(--border-color)]">
        <div className="container max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--color-accent-yellow)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <span className="font-['Space_Grotesk',sans-serif] text-lg font-bold flex items-center gap-2 text-[var(--text-primary)]">
            <Link2 className="h-4 w-4 text-[var(--color-accent-yellow)]" /> Payment Link
          </span>
          <Button
            variant="default"
            size="sm"
            disabled={!canCreate || isCreating}
            onClick={handleCreate}
            className="bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90 squircle-md"
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
          {/* Logo */}
          <div>
            <Label className="text-sm font-semibold mb-2 block text-[var(--text-primary)]">
              Logo / Profile Picture
            </Label>
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <div className="relative group">
                  <img
                    src={logoPreview}
                    alt="Logo"
                    className={`h-20 w-20 object-cover border border-[var(--border-color)] ${
                      !logo && userData?.profilePicture ? "rounded-full" : "rounded-2xl"
                    }`}
                  />
                  {logo && (
                    <button
                      onClick={() => {
                        setLogo(null);
                        setLogoPreview(null);
                      }}
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-[var(--destructive)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="h-20 w-20 rounded-2xl bg-[var(--bg-secondary)] border-2 border-dashed border-[var(--border-color)] flex items-center justify-center">
                  <Upload className="h-6 w-6 text-[var(--text-secondary)]" />
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
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-[var(--border-color)] rounded-xl bg-[var(--bg-secondary)] hover:border-[var(--color-accent-yellow)] transition-colors squircle-md"
                >
                  <Upload className="h-4 w-4" />
                  <span className="text-sm text-[var(--text-secondary)]">Upload Logo</span>
                </button>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Square image recommended (e.g., 200x200px)
                </p>
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <Label className="text-sm font-semibold mb-2 block text-[var(--text-primary)]">
              Link Title *
            </Label>
            <Input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="e.g. Premium Coaching Session"
              className="h-12 border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)] squircle-md"
              style={{ outline: "none", boxShadow: "none" }}
            />
          </div>

          {/* URL Preview */}
          {title && (
            <div className="bg-[var(--bg-secondary)] rounded-lg p-4 border border-[var(--border-color)] squircle-lg">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-semibold text-[var(--color-accent-yellow)]">
                  Your Payment Link URL:
                </Label>
                <button
                  onClick={regenerateSlug}
                  className="flex items-center gap-1 text-xs text-[var(--color-accent-yellow)] hover:text-[var(--color-accent-yellow)]/80 transition-colors"
                >
                  <RefreshCw className="h-3 w-3" /> New ID
                </button>
              </div>
              <div className="flex items-center gap-2 bg-[var(--bg-primary)] p-3 rounded-lg border border-[var(--border-color)]">
                <Link2 className="h-4 w-4 text-[var(--color-accent-yellow)] shrink-0" />
                <code className="text-sm font-mono text-[var(--text-primary)] break-all">
                  {window.location.origin}/pay/{generateFinalSlug()}
                </code>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-2">
                💡 Your URL includes a unique 4-digit identifier
              </p>
            </div>
          )}

          {/* Description */}
          <div>
            <Label className="text-sm font-semibold mb-2 block text-[var(--text-primary)]">
              Short Description
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What is this payment for?"
              className="resize-none border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)] squircle-md"
              style={{ outline: "none", boxShadow: "none" }}
            />
          </div>

          {/* Currency and Amount Mode */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-semibold mb-2 block text-[var(--text-primary)]">
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
                className="h-12 w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 text-sm text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)] squircle-md"
                style={{ outline: "none", boxShadow: "none" }}
              >
                <option value="NGN">₦ NGN</option>
                <option value="USD">$ USD</option>
                <option value="GBP">£ GBP</option>
                <option value="EUR">€ EUR</option>
              </select>
            </div>
            <div>
              <Label className="text-sm font-semibold mb-2 block text-[var(--text-primary)]">
                Amount Mode
              </Label>
              <div className="flex gap-2">
                <button
                  onClick={() => set("amountMode", "fixed")}
                  className={`flex-1 h-12 rounded-md text-sm font-medium border-2 transition-colors squircle-md ${
                    config.amountMode === "fixed"
                      ? "border-[var(--color-accent-yellow)] bg-[var(--color-accent-yellow)]/10 text-[var(--color-accent-yellow)]"
                      : "border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:border-[var(--color-accent-yellow)]/50"
                  }`}
                >
                  Fixed
                </button>
                <button
                  onClick={() => set("amountMode", "variable")}
                  className={`flex-1 h-12 rounded-md text-sm font-medium border-2 transition-colors squircle-md ${
                    config.amountMode === "variable"
                      ? "border-[var(--color-accent-yellow)] bg-[var(--color-accent-yellow)]/10 text-[var(--color-accent-yellow)]"
                      : "border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:border-[var(--color-accent-yellow)]/50"
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
              <Label className="text-sm font-semibold mb-2 block text-[var(--text-primary)]">
                Amount *
              </Label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="5000"
                className="h-12 border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)] squircle-md"
                style={{ outline: "none", boxShadow: "none" }}
              />
            </div>
          )}

          {/* Reference Code */}
          <div>
            <Label className="text-sm font-semibold mb-2 block text-[var(--text-primary)]">
              Reference Code (optional)
            </Label>
            <Input
              value={config.referenceCode || ""}
              onChange={(e) => set("referenceCode", e.target.value)}
              placeholder="INV-2026-001"
              className="h-12 border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)] squircle-md"
              style={{ outline: "none", boxShadow: "none" }}
            />
          </div>

          {/* Link Active */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] squircle-lg">
            <div>
              <Label className="text-sm font-semibold text-[var(--text-primary)]">
                Link Active
              </Label>
              <p className="text-xs text-[var(--text-secondary)]">
                Toggle to enable/disable this link
              </p>
            </div>
            <Switch
              checked={config.active}
              onCheckedChange={(v) => set("active", v)}
              className="data-[state=checked]:bg-[var(--color-accent-yellow)]"
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
            <Label className="text-sm font-semibold mb-2 block text-[var(--text-primary)]">
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
                      ? "border-[var(--color-accent-yellow)] bg-[var(--color-accent-yellow)]/10 text-[var(--color-accent-yellow)]"
                      : "border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:border-[var(--color-accent-yellow)]/50"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <Input
              value={config.buttonText}
              onChange={(e) => set("buttonText", e.target.value)}
              className="h-11 border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)] squircle-md"
              style={{ outline: "none", boxShadow: "none" }}
            />
          </div>

          {/* Success Message */}
          <div>
            <Label className="text-sm font-semibold mb-2 block text-[var(--text-primary)]">
              Success Message
            </Label>
            <Input
              value={config.successMessage}
              onChange={(e) => set("successMessage", e.target.value)}
              className="h-11 border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)] squircle-md"
              style={{ outline: "none", boxShadow: "none" }}
            />
          </div>

          {/* Thank You Message */}
          <div>
            <Label className="text-sm font-semibold mb-2 block text-[var(--text-primary)]">
              Thank-You Page Message
            </Label>
            <Textarea
              value={config.thankYouMessage}
              onChange={(e) => set("thankYouMessage", e.target.value)}
              rows={2}
              className="resize-none border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)] squircle-md"
              style={{ outline: "none", boxShadow: "none" }}
            />
          </div>

          {/* Redirect URLs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-semibold mb-2 block text-[var(--text-primary)]">
                Redirect URL
              </Label>
              <Input
                value={config.redirectUrl || ""}
                onChange={(e) => set("redirectUrl", e.target.value)}
                placeholder="https://yoursite.com/thank-you"
                className="h-11 border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)] squircle-md"
                style={{ outline: "none", boxShadow: "none" }}
              />
            </div>
            <div>
              <Label className="text-sm font-semibold mb-2 block text-[var(--text-primary)]">
                Alternative Redirect
              </Label>
              <Input
                value={config.altRedirectUrl || ""}
                onChange={(e) => set("altRedirectUrl", e.target.value)}
                placeholder="https://yoursite.com/cancel"
                className="h-11 border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)] squircle-md"
                style={{ outline: "none", boxShadow: "none" }}
              />
            </div>
          </div>

          {/* Customer Information Collection */}
          <div className="space-y-3">
            <h3 className="font-bold text-lg text-[var(--text-primary)]">
              Customer Information
            </h3>
            <p className="text-sm text-[var(--text-secondary)] -mt-2">
              Choose what to collect from buyers
            </p>

            {[
              { key: "Name", on: "collectName", req: "nameRequired" },
              { key: "Email", on: "collectEmail", req: "emailRequired" },
              { key: "Phone", on: "collectPhone", req: "phoneRequired" },
            ].map((f) => (
              <div
                key={f.key}
                className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] squircle-md"
              >
                <div className="flex items-center gap-3">
                  <Switch
                    checked={config[f.on as keyof LinkConfig] as boolean}
                    onCheckedChange={(v) =>
                      set(f.on as keyof LinkConfig, v as never)
                    }
                    className="data-[state=checked]:bg-[var(--color-accent-yellow)]"
                  />
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {f.key}
                  </span>
                </div>
                {(config[f.on as keyof LinkConfig] as boolean) && (
                  <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                    <input
                      type="checkbox"
                      checked={config[f.req as keyof LinkConfig] as boolean}
                      onChange={(e) =>
                        set(
                          f.req as keyof LinkConfig,
                          e.target.checked as never,
                        )
                      }
                      className="rounded border-[var(--border-color)] accent-[var(--color-accent-yellow)]"
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
              <Label className="text-sm font-semibold text-[var(--text-primary)]">
                Custom Fields
              </Label>
              <Button
                size="sm"
                variant="outline"
                onClick={addCustomField}
                className="border-[var(--color-accent-yellow)] text-[var(--color-accent-yellow)] hover:bg-[var(--color-accent-yellow)]/10 squircle-md"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Field
              </Button>
            </div>
            <div className="space-y-3">
              {config.customFields.map((f) => (
                <div
                  key={f.id}
                  className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] space-y-2 squircle-md"
                >
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-[var(--text-secondary)]" />
                    <Input
                      value={f.label}
                      onChange={(e) =>
                        updateField(f.id, { label: e.target.value })
                      }
                      placeholder="Field label"
                      className="h-10 border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)] squircle-sm"
                      style={{ outline: "none", boxShadow: "none" }}
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
                      className="h-10 rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-2 text-sm text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)] squircle-sm"
                      style={{ outline: "none", boxShadow: "none" }}
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
                      className="h-10 w-10 rounded-md flex items-center justify-center text-[var(--destructive)] hover:bg-[var(--destructive)]/10 transition-colors"
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
                      className="h-10 border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)] squircle-sm"
                      style={{ outline: "none", boxShadow: "none" }}
                    />
                  )}
                  <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                    <input
                      type="checkbox"
                      checked={f.required}
                      onChange={(e) =>
                        updateField(f.id, { required: e.target.checked })
                      }
                      className="rounded border-[var(--border-color)] accent-[var(--color-accent-yellow)]"
                    />
                    Required
                  </label>
                </div>
              ))}
              {config.customFields.length === 0 && (
                <p className="text-xs text-[var(--text-secondary)] text-center py-4">
                  No custom fields. Add fields like Passport Number, Booking
                  Date, etc.
                </p>
              )}
            </div>
          </div>

          {/* QR Code Customization */}
          <div className="space-y-3">
            <h3 className="font-bold text-lg text-[var(--text-primary)]">QR Code Style</h3>
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
              <Label className="text-sm font-semibold mb-2 block text-[var(--text-primary)]">
                Frame Style
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {(["round", "rounded", "square"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => set("qrFrame", s)}
                    className={`h-12 rounded-md border-2 text-sm font-medium capitalize transition-colors squircle-sm ${
                      config.qrFrame === s
                        ? "border-[var(--color-accent-yellow)] bg-[var(--color-accent-yellow)]/10 text-[var(--color-accent-yellow)]"
                        : "border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:border-[var(--color-accent-yellow)]/50"
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
          <div className="flex items-center gap-2 mb-3 text-sm text-[var(--text-secondary)]">
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
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
              onClick={() => setShowSuccess(false)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-[var(--bg-primary)] rounded-3xl p-4 sm:p-6 md:p-8 max-w-[90%] sm:max-w-md md:max-w-lg w-full text-center shadow-2xl border border-[var(--border-color)] squircle-lg mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4">🎉</div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-2">
                  Payment Link Created!
                </h2>
                <p className="text-sm sm:text-base text-[var(--text-secondary)] mb-4 sm:mb-6">
                  Your payment link is now live and ready to collect payments.
                </p>

                <div className="bg-[var(--bg-secondary)] rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 border border-[var(--border-color)] squircle-lg">
                  <Label className="text-xs sm:text-sm font-semibold text-[var(--color-accent-yellow)] mb-2 block text-left">
                    Your Payment Link:
                  </Label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="flex items-center gap-2 flex-1 bg-[var(--bg-primary)] rounded-lg p-2 sm:p-3 border border-[var(--border-color)]">
                      <Link2 className="h-4 w-4 text-[var(--color-accent-yellow)] shrink-0" />
                      <code className="text-xs sm:text-sm font-mono text-[var(--text-primary)] break-all flex-1 text-left">
                        {pageUrl}
                      </code>
                    </div>
                    <button
                      onClick={() => copyToClipboard(pageUrl)}
                      className="relative p-2 sm:p-3 rounded-lg bg-[var(--color-accent-yellow)]/10 hover:bg-[var(--color-accent-yellow)]/20 transition-colors group shrink-0"
                    >
                      {copied ? (
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--color-lemon-green)]" />
                      ) : (
                        <Copy className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--color-accent-yellow)]" />
                      )}
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[var(--color-ink)] text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap squircle-sm">
                        {copied ? "Copied!" : "Copy link"}
                      </span>
                    </button>
                  </div>
                  {copied && (
                    <p className="text-xs text-[var(--color-lemon-green)] mt-2 text-center animate-pulse">
                      ✓ Link copied to clipboard!
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] squircle-md"
                    onClick={() => {
                      setShowSuccess(false);
                      window.open(pageUrl, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    Preview Page
                  </Button>
                  <Button
                    variant="default"
                    className="flex-1 bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90 squircle-md"
                    onClick={() => {
                      setShowSuccess(false);
                      router.push("/dashboard/services/payment/dashboard");
                    }}
                  >
                    Go to Dashboard
                  </Button>
                </div>

                <button
                  onClick={() => setShowSuccess(false)}
                  className="mt-4 text-xs sm:text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
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
    <Label className="text-sm font-semibold mb-2 block text-[var(--text-primary)]">
      {label}
    </Label>
    <div className="flex items-center gap-2 rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-2 h-12 squircle-md">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-10 rounded cursor-pointer bg-transparent border-0"
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-sm font-mono flex-1 outline-none text-[var(--text-primary)]"
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
  const coverImage = logo || null;

  return (
    <motion.div
      layout
      className="rounded-3xl overflow-hidden shadow-soft border border-[var(--border-color)] bg-[var(--bg-primary)] squircle-lg"
      style={{ borderTop: `4px solid ${config.brandColor}` }}
    >
      {coverImage && (
        <div className="w-full h-32 overflow-hidden bg-[var(--bg-secondary)]">
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
              className="h-12 w-12 rounded-xl object-cover border border-[var(--border-color)]"
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
            <h3 className="font-bold text-base truncate text-[var(--text-primary)]">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                {description}
              </p>
            )}
          </div>
        </div>
        <div className="py-3 border-y border-[var(--border-color)]">
          <div className="text-xs text-[var(--text-secondary)]">Amount</div>
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
            <p className="text-xs text-[var(--text-secondary)]">
              + {config.customFields.length - 3} more fields
            </p>
          )}
        </div>
        <button
          className="w-full h-12 rounded-xl font-bold text-sm transition-transform hover:scale-[1.02] squircle-md"
          style={{ background: config.buttonColor, color: "#191919" }}
        >
          {config.buttonText}
        </button>
        <p className="text-[10px] text-center text-[var(--text-secondary)]">
          Secured by Zidwell
        </p>
      </div>
    </motion.div>
  );
};

const FieldPreview = ({ label }: { label: string }) => (
  <div>
    <div className="text-[10px] text-[var(--text-secondary)] mb-0.5">{label}</div>
    <div className="h-9 rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)]" />
  </div>
);

export default CreatePaymentLink;