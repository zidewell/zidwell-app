// app/components/admin-components/AddUserModal.tsx
"use client";

import React, { useState } from "react";
import Swal from "sweetalert2";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";

interface AddUserModalProps {
  onClose: () => void;
  onSaved: () => void;
}

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  role: string;
  businessName: string;
  accountTier: "tier_3" | "tier_2" | "tier_1";
  customOutflowPercent: string;
  customOutflowMin: string;
  customFeeNote: string;
  sendWelcomeEmail: boolean;
}

interface CreatedUser {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  admin_role: string;
  business_name: string | null;
  account_tier?: string;
}

const ROLE_OPTIONS = [
  { value: "user", label: "User (no admin access)" },
  { value: "operations_admin", label: "Operations Admin" },
  { value: "finance_admin", label: "Finance Admin" },
  { value: "support_admin", label: "Support Admin" },
  { value: "legal_admin", label: "Legal Admin" },
  { value: "blog_admin", label: "Blog Admin" },
  { value: "super_admin", label: "Super Admin" },
];

const TIER_OPTIONS = [
  {
    value: "tier_3",
    label: "Tier 3 — Standard",
    description: "₦100K per transfer · ₦500K daily · ₦50 outflow flat",
  },
  {
    value: "tier_2",
    label: "Tier 2 — Business",
    description: "₦5M per transfer · ₦50M daily · 0.2% outflow (min ₦50)",
  },
  {
    value: "tier_1",
    label: "Tier 1 — Enterprise",
    description: "₦10M per transfer · ₦100M daily · 0.1% outflow (min ₦100)",
  },
];

export default function AddUserModal({ onClose, onSaved }: AddUserModalProps) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createdUser, setCreatedUser] = useState<CreatedUser | null>(null);
  const [welcomeEmailSent, setWelcomeEmailSent] = useState(false);
  const [createdAction, setCreatedAction] = useState<"created" | "upgraded">(
    "created",
  );
  const [showCustomFees, setShowCustomFees] = useState(false);

  const [form, setForm] = useState<FormData>({
    fullName: "",
    email: "",
    phone: "",
    role: "user",
    businessName: "",
    accountTier: "tier_3",
    customOutflowPercent: "",
    customOutflowMin: "",
    customFeeNote: "",
    sendWelcomeEmail: true,
  });

  const validate = (): boolean => {
    const e: Record<string, string> = {};

    if (!form.fullName.trim()) {
      e.fullName = "Full name is required";
    } else if (form.fullName.trim().length < 2) {
      e.fullName = "Name is too short";
    }

    if (!form.email.trim()) {
      e.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      e.email = "Invalid email format";
    }

    if (!form.phone.trim()) {
      e.phone = "Phone is required";
    } else {
      const digits = form.phone.replace(/\D/g, "");
      if (digits.length < 10 || digits.length > 11) {
        e.phone = "Phone must be 10-11 digits";
      }
    }

    // Validate custom fee override if provided
    if (showCustomFees) {
      if (form.customOutflowPercent) {
        const pct = Number(form.customOutflowPercent);
        if (isNaN(pct) || pct < 0 || pct > 100) {
          e.customOutflowPercent = "Percent must be 0–100";
        }
      }
      if (form.customOutflowMin) {
        const min = Number(form.customOutflowMin);
        if (isNaN(min) || min < 0) {
          e.customOutflowMin = "Minimum fee must be ≥ 0";
        }
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isAdminCreation: true,
          fullName: form.fullName.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          role: form.role,
          businessName: form.businessName.trim() || undefined,
          accountTier: form.accountTier,
          customOutflowPercent: form.customOutflowPercent
            ? Number(form.customOutflowPercent) / 100 // convert % to decimal
            : undefined,
          customOutflowMin: form.customOutflowMin
            ? Number(form.customOutflowMin)
            : undefined,
          customFeeNote: form.customFeeNote.trim() || undefined,
          sendWelcomeEmail: form.sendWelcomeEmail,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create user");
      }

      setCreatedUser(data.user);
      setWelcomeEmailSent(data.welcomeEmailSent);
      setCreatedAction(data.action || "created");
      setStep("success");
      onSaved();
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Creation Failed",
        text: err.message || "Failed to create user. Please try again.",
        confirmButtonColor: "#FDC020",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAnother = () => {
    setForm({
      fullName: "",
      email: "",
      phone: "",
      role: "user",
      businessName: "",
      accountTier: "tier_3",
      customOutflowPercent: "",
      customOutflowMin: "",
      customFeeNote: "",
      sendWelcomeEmail: true,
    });
    setCreatedUser(null);
    setWelcomeEmailSent(false);
    setShowCustomFees(false);
    setStep("form");
    setErrors({});
  };

  const handleViewUser = () => {
    if (createdUser?.id) {
      window.location.href = `/admin/transactions/user/${createdUser.id}`;
    }
  };

  // ═══════════════════════════════════════════════════════
  // FORM VIEW
  // ═══════════════════════════════════════════════════════
  if (step === "form") {
    const selectedTier = TIER_OPTIONS.find(
      (t) => t.value === form.accountTier,
    );

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
        <div className="squircle-lg border border-(--border-color) bg-(--bg-primary) w-full max-w-lg my-8 p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold font-(--font-space-grotesk) text-(--text-primary) flex items-center gap-2">
                ➕ Add New User
              </h3>
              <p className="text-xs text-(--text-secondary) mt-1">
                Create an account and send them a setup email
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-(--text-secondary) hover:text-(--text-primary) text-lg"
              aria-label="Close"
              disabled={submitting}
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-(--text-secondary) mb-1.5">
                Full Name <span className="text-destructive">*</span>
              </label>
              <Input
                value={form.fullName}
                onChange={(e) =>
                  setForm({ ...form, fullName: e.target.value })
                }
                placeholder="John Doe"
                disabled={submitting}
                className={errors.fullName ? "border-destructive" : ""}
              />
              {errors.fullName && (
                <p className="text-xs text-destructive mt-1">
                  {errors.fullName}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-(--text-secondary) mb-1.5">
                Email <span className="text-destructive">*</span>
              </label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="john@example.com"
                disabled={submitting}
                className={errors.email ? "border-destructive" : ""}
                autoComplete="off"
              />
              {errors.email && (
                <p className="text-xs text-destructive mt-1">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-(--text-secondary) mb-1.5">
                Phone <span className="text-destructive">*</span>
              </label>
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) =>
                  setForm({
                    ...form,
                    phone: e.target.value.replace(/\D/g, "").slice(0, 11),
                  })
                }
                placeholder="08012345678"
                disabled={submitting}
                className={errors.phone ? "border-destructive" : ""}
                inputMode="numeric"
                maxLength={11}
              />
              {errors.phone && (
                <p className="text-xs text-destructive mt-1">{errors.phone}</p>
              )}
            </div>

            {/* ═══════════════════════════════════════════════════════
                ACCOUNT TIER — the key new field
            ═══════════════════════════════════════════════════════ */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-(--text-secondary) mb-1.5">
                Account Tier
              </label>
              <select
                value={form.accountTier}
                onChange={(e) =>
                  setForm({
                    ...form,
                    accountTier: e.target.value as
                      | "tier_3"
                      | "tier_2"
                      | "tier_1",
                  })
                }
                className="w-full h-11 squircle-md border border-(--border-color) bg-(--bg-secondary) text-(--text-primary) text-sm px-3"
                disabled={submitting}
              >
                {TIER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {selectedTier && (
                <p className="text-xs text-(--text-secondary) mt-1">
                  {selectedTier.description}
                </p>
              )}
            </div>

            {/* Role + Business Name row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-(--text-secondary) mb-1.5">
                  Role
                </label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full h-11 squircle-md border border-(--border-color) bg-(--bg-secondary) text-(--text-primary) text-sm px-3"
                  disabled={submitting}
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-(--text-secondary) mb-1.5">
                  Business Name{" "}
                  <span className="text-(--text-secondary) text-[10px]">
                    (optional)
                  </span>
                </label>
                <Input
                  value={form.businessName}
                  onChange={(e) =>
                    setForm({ ...form, businessName: e.target.value })
                  }
                  placeholder="Acme Ltd"
                  disabled={submitting}
                />
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════
                CUSTOM FEE OVERRIDES (collapsible)
            ═══════════════════════════════════════════════════════ */}
            <div className="squircle-md border border-(--border-color) bg-(--bg-secondary)/40 p-3">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCustomFees}
                  onChange={(e) => setShowCustomFees(e.target.checked)}
                  disabled={submitting}
                  className="mt-0.5 w-4 h-4 accent-[--color-accent-yellow]"
                />
                <div>
                  <span className="text-sm font-medium text-(--text-primary)">
                    Override outflow fee (optional)
                  </span>
                  <p className="text-xs text-(--text-secondary) mt-0.5">
                    Custom rate for this user — overrides their tier default
                  </p>
                </div>
              </label>

              {showCustomFees && (
                <div className="mt-3 pl-6 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-widest text-(--text-secondary) mb-1.5">
                        Percent (%)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={form.customOutflowPercent}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            customOutflowPercent: e.target.value,
                          })
                        }
                        placeholder="e.g. 0.1"
                        disabled={submitting}
                        className={
                          errors.customOutflowPercent
                            ? "border-destructive"
                            : ""
                        }
                      />
                      {errors.customOutflowPercent && (
                        <p className="text-xs text-destructive mt-1">
                          {errors.customOutflowPercent}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-widest text-(--text-secondary) mb-1.5">
                        Min Fee (₦)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={form.customOutflowMin}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            customOutflowMin: e.target.value,
                          })
                        }
                        placeholder="e.g. 50"
                        disabled={submitting}
                        className={
                          errors.customOutflowMin ? "border-destructive" : ""
                        }
                      />
                      {errors.customOutflowMin && (
                        <p className="text-xs text-destructive mt-1">
                          {errors.customOutflowMin}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-(--text-secondary) mb-1.5">
                      Note (visible to admin only)
                    </label>
                    <Input
                      value={form.customFeeNote}
                      onChange={(e) =>
                        setForm({ ...form, customFeeNote: e.target.value })
                      }
                      placeholder="e.g. Negotiated rate with customer"
                      disabled={submitting}
                    />
                  </div>
                  <p className="text-xs text-(--text-secondary)">
                    Leave blank to use the tier default ({selectedTier?.description})
                  </p>
                </div>
              )}
            </div>

            {/* Welcome email checkbox */}
            <div className="squircle-md border border-(--border-color) bg-(--bg-secondary)/40 p-3">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.sendWelcomeEmail}
                  onChange={(e) =>
                    setForm({ ...form, sendWelcomeEmail: e.target.checked })
                  }
                  disabled={submitting}
                  className="mt-0.5 w-4 h-4 accent-[--color-accent-yellow]"
                />
                <div>
                  <span className="text-sm font-medium text-(--text-primary)">
                    Send welcome email
                  </span>
                  <p className="text-xs text-(--text-secondary) mt-0.5">
                    User will receive a link to verify their email and set their
                    own password
                  </p>
                </div>
              </label>
            </div>

            {/* Info notice */}
            <div className="squircle-md bg-[--color-accent-yellow]/10 border border-[--color-accent-yellow]/30 p-3">
              <p className="text-xs text-(--text-primary) leading-relaxed">
                <strong>🔒 Security:</strong> You're creating this account
                without setting a password. The user will set their own password
                via the welcome email link.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2 border-t border-(--border-color)">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1"
            >
              {submitting ? (
                <>
                  <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "➕ Create User"
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // SUCCESS VIEW
  // ═══════════════════════════════════════════════════════
  const createdTier = TIER_OPTIONS.find(
    (t) => t.value === (createdUser?.account_tier || "tier_3"),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="squircle-lg border border-(--border-color) bg-(--bg-primary) w-full max-w-lg my-8 p-6 space-y-5">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[--color-lemon-green]/15 mb-3">
            <span className="text-3xl">✅</span>
          </div>
          <h3 className="text-lg font-semibold font-(--font-space-grotesk) text-(--text-primary)">
            {createdAction === "upgraded" ? "User Upgraded" : "User Created"}
          </h3>
        </div>

        {createdUser && (
          <div className="squircle-md border border-(--border-color) bg-(--bg-secondary)/40 p-4 space-y-1.5">
            <div className="flex justify-between items-baseline gap-2">
              <span className="text-xs text-(--text-secondary)">Name:</span>
              <span className="text-sm font-medium text-(--text-primary) text-right truncate">
                {createdUser.full_name}
              </span>
            </div>
            <div className="flex justify-between items-baseline gap-2">
              <span className="text-xs text-(--text-secondary)">Email:</span>
              <span className="text-sm font-medium text-(--text-primary) text-right truncate">
                {createdUser.email}
              </span>
            </div>
            <div className="flex justify-between items-baseline gap-2">
              <span className="text-xs text-(--text-secondary)">Role:</span>
              <span className="text-sm font-medium text-(--text-primary) text-right capitalize">
                {createdUser.admin_role?.replace(/_/g, " ")}
              </span>
            </div>
            <div className="flex justify-between items-baseline gap-2">
              <span className="text-xs text-(--text-secondary)">
                Account Tier:
              </span>
              <span className="text-sm font-medium text-(--color-accent-yellow) text-right">
                {createdTier?.label || createdUser.account_tier}
              </span>
            </div>
            {createdUser.business_name && (
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-xs text-(--text-secondary)">
                  Business:
                </span>
                <span className="text-sm font-medium text-(--text-primary) text-right truncate">
                  {createdUser.business_name}
                </span>
              </div>
            )}
          </div>
        )}

        {createdAction === "created" && (
          <div
            className={`squircle-md border p-3 ${
              welcomeEmailSent
                ? "bg-[--color-lemon-green]/10 border-[--color-lemon-green]/30"
                : "bg-orange-500/10 border-orange-500/30"
            }`}
          >
            <p
              className={`text-xs leading-relaxed ${
                welcomeEmailSent
                  ? "text-[--color-lemon-green]"
                  : "text-orange-600"
              }`}
            >
              {welcomeEmailSent
                ? `📧 Welcome email sent to ${createdUser?.email}. They will receive a link to verify their email and set their password.`
                : `⚠️ Welcome email could not be sent. Please contact ${createdUser?.email} manually.`}
            </p>
          </div>
        )}

        <div className="space-y-2">
          {createdAction === "created" && createdUser && (
            <Button
              variant="outline"
              onClick={handleViewUser}
              className="w-full"
            >
              👁 View User Details
            </Button>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleAddAnother}
              className="flex-1"
            >
              ➕ Add Another
            </Button>
            <Button onClick={onClose} className="flex-1">
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}