// app/components/store/settings.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/app/context/StoreContext";
import {
  Save,
  Loader2,
  Store as StoreIcon,
  MapPin,
  Upload,
  Copy,
  Check,
  AlertCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import RichTextArea from "@/app/components/payment-page-components/RichTextArea";

// ─── Types ───
interface StoreSettingsShape {
  name: string;
  slug: string;
  description: string;
  keywords: string[];
  logoUrl: string | null;
  country: string;
  state: string;
  city: string;
  streetAddress: string;
  locationEnabled: boolean;
  latitude: number | null;
  longitude: number | null;
}

const DEFAULT_STORE: StoreSettingsShape = {
  name: "",
  slug: "",
  description: "",
  keywords: [],
  logoUrl: null,
  country: "Nigeria",
  state: "",
  city: "",
  streetAddress: "",
  locationEnabled: false,
  latitude: null,
  longitude: null,
};

// ─── Helper subcomponents ───
function SectionCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[2rem] border border-border bg-card p-6 sm:p-8",
        className
      )}
    >
      {children}
    </div>
  );
}

function SectionHead({
  icon: Icon,
  title,
  copy,
}: {
  icon: React.ElementType;
  title: string;
  copy: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-muted">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <h2 className="text-xl font-bold text-foreground sm:text-2xl">
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{copy}</p>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  error,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label
        htmlFor={htmlFor}
        className="block text-sm font-bold text-foreground"
      >
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {hint && !error && (
        <p className="mt-1 mb-2 text-xs text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p className="mt-1 mb-2 flex items-center gap-1 text-sm text-destructive">
          <AlertCircle className="size-3" /> {error}
        </p>
      )}
      {children}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ────────────────────────────────────────────────────────────
export function StoreSettings() {
  const { store: ctxStore, updateStore } = useStore();

  // Loaded-from-server snapshot (used for dirty comparison)
  const [original, setOriginal] = useState<StoreSettingsShape | null>(null);
  const [form, setForm] = useState<StoreSettingsShape>(DEFAULT_STORE);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState(false);

  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);

  // ─── Fetch current settings ───
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/store/settings", {
          cache: "no-store",
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load store settings");
        }

        const s = data.store;
        const shape: StoreSettingsShape = {
          name: s.name || "",
          slug: s.slug || "",
          description: s.description || "",
          keywords: Array.isArray(s.keywords) ? s.keywords : [],
          logoUrl: s.logo_url || null,
          country: s.country || "Nigeria",
          state: s.state || "",
          city: s.city || "",
          streetAddress: s.street_address || "",
          locationEnabled: s.location_enabled === true,
          latitude: s.latitude ?? null,
          longitude: s.longitude ?? null,
        };

        if (!cancelled) {
          setForm(shape);
          setOriginal(shape);
        }
      } catch (err: any) {
        if (!cancelled) {
          toast.error(err.message || "Failed to load store settings");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Dirty check ───
  const isDirty = useMemo(() => {
    if (!original) return false;
    return (
      original.name !== form.name ||
      original.description !== form.description ||
      original.logoUrl !== form.logoUrl ||
      original.country !== form.country ||
      original.state !== form.state ||
      original.city !== form.city ||
      original.streetAddress !== form.streetAddress ||
      original.locationEnabled !== form.locationEnabled ||
      original.latitude !== form.latitude ||
      original.longitude !== form.longitude ||
      original.keywords.join("|").toLowerCase() !==
        form.keywords.join("|").toLowerCase()
    );
  }, [original, form]);

  // ─── Field setters ───
  const setField = useCallback(
    <K extends keyof StoreSettingsShape>(
      key: K,
      value: StoreSettingsShape[K]
    ) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => {
        if (!(key in prev)) return prev;
        const next = { ...prev };
        delete next[key as string];
        return next;
      });
    },
    []
  );

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setField(name as keyof StoreSettingsShape, value as any);
    },
    [setField]
  );

  const handleDescription = useCallback(
    (html: string) => setField("description", html),
    [setField]
  );

  const handleKeywordsBlur = useCallback(
    (raw: string) => {
      const parts = raw
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);
      const seen = new Set<string>();
      const clean: string[] = [];
      for (const k of parts) {
        const lower = k.toLowerCase();
        if (seen.has(lower)) continue;
        seen.add(lower);
        clean.push(k);
        if (clean.length >= 20) break;
      }
      setField("keywords", clean);
    },
    [setField]
  );

  // ─── Copy slug ───
  const copySlug = useCallback(async () => {
    if (!form.slug) return;
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/store/${form.slug}`
        : `https://zidwell.com/store/${form.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedSlug(true);
      toast.success("Store URL copied");
      setTimeout(() => setCopiedSlug(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  }, [form.slug]);

  // ─── Logo upload ───
  const handleLogoSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast.error("Please choose an image file");
        return;
      }
      if (file.size > 3 * 1024 * 1024) {
        toast.error("Image must be under 3 MB");
        return;
      }

      setUploadingLogo(true);
      try {
        const fd = new FormData();
        fd.append("file", file);

        const res = await fetch("/api/store/upload-logo", {
          method: "POST",
          body: fd,
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Upload failed");
        }

        setField("logoUrl", data.url);
        toast.success("Logo uploaded");
      } catch (err: any) {
        toast.error(err.message || "Failed to upload logo");
      } finally {
        setUploadingLogo(false);
        if (logoInputRef.current) logoInputRef.current.value = "";
      }
    },
    [setField]
  );

  const removeLogo = useCallback(() => {
    setField("logoUrl", null);
  }, [setField]);

  // ─── Location capture ───
  const requestLocation = useCallback(async (): Promise<{
    latitude: number;
    longitude: number;
  } | null> => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationError("Geolocation is not supported on this device.");
      toast.error("Geolocation not supported");
      return null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocationError(null);
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        (err) => {
          let msg = "Could not get your location.";
          if (err.code === err.PERMISSION_DENIED)
            msg =
              "Location permission denied. Enable it in your browser settings.";
          else if (err.code === err.POSITION_UNAVAILABLE)
            msg = "Location information is unavailable.";
          else if (err.code === err.TIMEOUT)
            msg = "Location request timed out.";
          setLocationError(msg);
          toast.error("Location unavailable", { description: msg });
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }, []);

  const handleLocationToggle = useCallback(
    async (checked: boolean) => {
      if (!checked) {
        setForm((prev) => ({
          ...prev,
          locationEnabled: false,
          latitude: null,
          longitude: null,
        }));
        setLocationError(null);
        return;
      }

      setLocationLoading(true);
      try {
        const coords = await requestLocation();
        if (coords) {
          setForm((prev) => ({
            ...prev,
            locationEnabled: true,
            latitude: coords.latitude,
            longitude: coords.longitude,
          }));
          toast.success("Location captured");
        } else {
          setForm((prev) => ({ ...prev, locationEnabled: false }));
        }
      } finally {
        setLocationLoading(false);
      }
    },
    [requestLocation]
  );

  // ─── Validation ───
  const validate = useCallback((): boolean => {
    const errs: Record<string, string> = {};

    if (!form.name.trim() || form.name.trim().length < 2)
      errs.name = "Store name must be at least 2 characters";

    if (!form.state.trim()) errs.state = "State is required";
    if (!form.city.trim()) errs.city = "City is required";
    if (!form.streetAddress.trim())
      errs.streetAddress = "Street address is required";

    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      const first = Object.values(errs)[0];
      toast.error("Please fix the errors", { description: first });
      return false;
    }
    return true;
  }, [form]);

  // ─── Save ───
  const handleSave = useCallback(async () => {
    if (saving) return;
    if (!isDirty) {
      toast.info("No changes to save");
      return;
    }
    if (!validate()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/store/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description,
          keywords: form.keywords,
          logoUrl: form.logoUrl,
          country: form.country,
          state: form.state.trim(),
          city: form.city.trim(),
          streetAddress: form.streetAddress.trim(),
          locationEnabled: form.locationEnabled,
          latitude: form.locationEnabled ? form.latitude : null,
          longitude: form.locationEnabled ? form.longitude : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save settings");
      }

      // Sync context store so header / dashboard reflect changes
      await updateStore({
        name: data.store.name,
        description: data.store.description,
        keywords: data.store.keywords,
        state: data.store.state,
        city: data.store.city,
        streetAddress: data.store.street_address,
        country: data.store.country,
        locationEnabled: data.store.location_enabled,
        latitude: data.store.latitude,
        longitude: data.store.longitude,
      } as any);

      const updated: StoreSettingsShape = {
        name: data.store.name,
        slug: data.store.slug,
        description: data.store.description,
        keywords: Array.isArray(data.store.keywords)
          ? data.store.keywords
          : [],
        logoUrl: data.store.logo_url || null,
        country: data.store.country,
        state: data.store.state,
        city: data.store.city,
        streetAddress: data.store.street_address,
        locationEnabled: data.store.location_enabled === true,
        latitude: data.store.latitude ?? null,
        longitude: data.store.longitude ?? null,
      };

      setOriginal(updated);
      setForm(updated);
      toast.success("Store settings saved");
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }, [form, isDirty, saving, validate, updateStore]);

  // ─── Loading state ───
  if (loading) {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="h-64 rounded-[2rem] border border-border bg-card animate-pulse" />
        <div className="h-64 rounded-[2rem] border border-border bg-card animate-pulse" />
      </div>
    );
  }

  const keywordsInput = form.keywords.join(", ");

  return (
    <div className="max-w-4xl space-y-6">
      {/* ─────────── Branding (Logo) ─────────── */}
      <SectionCard>
        <SectionHead
          icon={StoreIcon}
          title="Store Logo"
          copy="Your logo appears on your storefront, receipts, and shared links."
        />

        <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-border bg-muted/30">
            {form.logoUrl ? (
              <img
                src={form.logoUrl}
                alt="Store logo"
                className="h-full w-full object-cover"
              />
            ) : (
              <StoreIcon className="size-9 text-muted-foreground/50" />
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-2.5 text-sm font-bold hover:bg-muted transition-colors disabled:opacity-50"
              >
                {uploadingLogo ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                {uploadingLogo
                  ? "Uploading…"
                  : form.logoUrl
                  ? "Replace logo"
                  : "Upload logo"}
              </button>

              {form.logoUrl && !uploadingLogo && (
                <button
                  type="button"
                  onClick={removeLogo}
                  className="inline-flex items-center gap-2 rounded-2xl border border-border px-4 py-2.5 text-sm font-bold text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <X className="size-4" /> Remove
                </button>
              )}
            </div>

            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleLogoSelect}
              className="hidden"
            />

            <p className="text-xs text-muted-foreground">
              PNG, JPG, WebP, or GIF · up to 3 MB. Square images work best.
            </p>
          </div>
        </div>
      </SectionCard>

      {/* ─────────── Store Information ─────────── */}
      <SectionCard>
        <SectionHead
          icon={StoreIcon}
          title="Store Information"
          copy="The public name, URL, description, and keywords used to describe your store."
        />

        <div className="mt-8 space-y-7">
          <Field
            label="Store Name"
            hint="The public name of your store. Shown on your storefront, receipts and payment links."
            required
            error={errors.name}
            htmlFor="name"
          >
            <Input
              id="name"
              name="name"
              value={form.name}
              onChange={handleInput}
              placeholder="e.g., Juice Hub"
              disabled={saving}
              className={cn(
                "w-full px-4 py-3.5 text-[15px] font-semibold rounded-2xl border bg-background text-foreground focus:outline-none focus:border-foreground transition-colors",
                errors.name ? "border-destructive" : "border-border"
              )}
            />
          </Field>

          <Field
            label="Store URL"
            // hint="Your store's public web address. This can't be changed after activation — changing it would break existing product links."
            hint="Your store's public web address. This can't be changed after activation."
          >
            <div className="flex items-center rounded-2xl border border-border bg-background pr-3 overflow-hidden">
              <span className="px-4 py-3.5 text-sm font-bold text-muted-foreground bg-muted whitespace-nowrap">
                zidwell.com/store/
              </span>
              <input
                type="text"
                value={form.slug}
                readOnly
                disabled
                className="flex-1 min-w-0 bg-transparent px-3 py-3.5 text-[15px] font-semibold text-foreground cursor-not-allowed"
              />
              <button
                type="button"
                onClick={copySlug}
                aria-label="Copy store URL"
                className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border hover:bg-muted transition-colors"
              >
                {copiedSlug ? (
                  <Check className="size-4 text-green-600" />
                ) : (
                  <Copy className="size-4" />
                )}
              </button>
            </div>
          </Field>

          <Field
            label="Store Description"
            hint="Describe your business and what you sell. Appears on your public storefront and in search results."
            htmlFor="description"
          >
            <RichTextArea
              value={form.description}
              onChange={handleDescription}
              placeholder="Describe what your business is all about to potential customers..."
              minHeight="160px"
              maxHeight="320px"
            />
          </Field>

          <Field
            label="Keywords / Phrases"
            hint="Comma-separated words or phrases people would search to find a business like yours. These power your store's SEO — every product page inherits them."
            htmlFor="keywords"
          >
            <Input
              id="keywords"
              name="keywords"
              defaultValue={keywordsInput}
              onBlur={(e) => handleKeywordsBlur(e.target.value)}
              placeholder="phones, iphones, samsung, phone repairs"
              disabled={saving}
              className="w-full px-4 py-3.5 text-[15px] font-semibold rounded-2xl border border-border bg-background text-foreground focus:outline-none focus:border-foreground transition-colors"
            />
            {form.keywords.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {form.keywords.map((k, i) => (
                  <span
                    key={`${k}-${i}`}
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium"
                  >
                    {k}
                    <button
                      type="button"
                      onClick={() =>
                        setField(
                          "keywords",
                          form.keywords.filter((_, idx) => idx !== i)
                        )
                      }
                      className="text-muted-foreground hover:text-foreground"
                      aria-label={`Remove ${k}`}
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </Field>
        </div>
      </SectionCard>

      {/* ─────────── Location ─────────── */}
      <SectionCard>
        <SectionHead
          icon={MapPin}
          title="Location"
          copy="Where is your store based? This helps with local search, delivery estimates and customer trust."
        />

        <div className="mt-8 space-y-7">
          <Field
            label="Country"
            hint="The country where your business is registered and operates."
            htmlFor="country"
          >
            <select
              id="country"
              name="country"
              value={form.country}
              onChange={handleInput}
              disabled={saving}
              className="w-full px-4 py-3.5 text-[15px] font-semibold rounded-2xl border border-border bg-background text-foreground focus:outline-none focus:border-foreground transition-colors"
            >
              <option value="Nigeria">Nigeria</option>
              <option value="Ghana">Ghana</option>
              <option value="Kenya">Kenya</option>
              <option value="South Africa">South Africa</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="United States">United States</option>
            </select>
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-7">
            <Field
              label="State"
              hint="The state or region your business operates from."
              required
              error={errors.state}
              htmlFor="state"
            >
              <Input
                id="state"
                name="state"
                value={form.state}
                onChange={handleInput}
                placeholder="e.g., Lagos"
                disabled={saving}
                className={cn(
                  "w-full px-4 py-3.5 text-[15px] font-semibold rounded-2xl border bg-background text-foreground focus:outline-none focus:border-foreground transition-colors",
                  errors.state ? "border-destructive" : "border-border"
                )}
              />
            </Field>

            <Field
              label="City"
              hint="The city or town your store is based in."
              required
              error={errors.city}
              htmlFor="city"
            >
              <Input
                id="city"
                name="city"
                value={form.city}
                onChange={handleInput}
                placeholder="e.g., Ikeja"
                disabled={saving}
                className={cn(
                  "w-full px-4 py-3.5 text-[15px] font-semibold rounded-2xl border bg-background text-foreground focus:outline-none focus:border-foreground transition-colors",
                  errors.city ? "border-destructive" : "border-border"
                )}
              />
            </Field>
          </div>

          <Field
            label="Street Address"
            hint="Where you operate from. Helps with local search, delivery estimates and customer trust."
            required
            error={errors.streetAddress}
            htmlFor="streetAddress"
          >
            <Input
              id="streetAddress"
              name="streetAddress"
              value={form.streetAddress}
              onChange={handleInput}
              placeholder="e.g., 123 Main Street"
              disabled={saving}
              className={cn(
                "w-full px-4 py-3.5 text-[15px] font-semibold rounded-2xl border bg-background text-foreground focus:outline-none focus:border-foreground transition-colors",
                errors.streetAddress
                  ? "border-destructive"
                  : "border-border"
              )}
            />
          </Field>

          {/* Precise location toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-5 rounded-[1.5rem] bg-muted/30 border border-border">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-muted-foreground shrink-0" />
                <p className="font-bold text-sm text-foreground">
                  Allow precise location
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Used for local search and delivery matching on your public
                storefront.
              </p>

              {form.latitude != null && form.longitude != null && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-2 break-all font-medium">
                  Captured: {form.latitude.toFixed(5)},{" "}
                  {form.longitude.toFixed(5)}
                </p>
              )}

              {locationError && (
                <p className="text-xs text-destructive mt-2 font-medium">
                  {locationError}
                </p>
              )}
            </div>

            <label
              className={cn(
                "relative inline-flex items-center shrink-0 self-start sm:self-center",
                locationLoading ? "cursor-wait" : "cursor-pointer"
              )}
            >
              <input
                type="checkbox"
                checked={form.locationEnabled}
                onChange={(e) => handleLocationToggle(e.target.checked)}
                disabled={locationLoading || saving}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer-checked:bg-[#FDC020] transition-colors duration-200 relative">
                <div
                  className={cn(
                    "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 flex items-center justify-center",
                    form.locationEnabled && "translate-x-5"
                  )}
                >
                  {locationLoading && (
                    <Loader2 className="size-2.5 animate-spin text-gray-700" />
                  )}
                </div>
              </div>
            </label>
          </div>
        </div>
      </SectionCard>

      {/* ─────────── Save ─────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-[2rem] border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          {isDirty
            ? "You have unsaved changes."
            : "All changes are saved."}
        </p>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !isDirty}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold transition-colors",
            saving || !isDirty
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-[#FDC020] text-black hover:bg-[#eab308]"
          )}
        >
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Saving…
            </>
          ) : (
            <>
              <Save className="size-4" /> Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}