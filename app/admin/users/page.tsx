// app/admin/users/page.tsx
"use client";

import React, { useMemo, useState, useEffect } from "react";
import useSWR from "swr";
import AdminLayout from "@/app/components/admin-components/layout";
import AdminTable from "@/app/components/admin-components/AdminTable";
import KPICard from "@/app/components/admin-components/KPICard";
import Loader from "@/app/components/Loader";
import FilterBar from "@/app/components/admin-components/FilterBar";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import fetcher from "@/app/lib/fetcher";
import { formatCurrency, formatNumber } from "@/app/lib/dashboard-utils";
import Swal from "sweetalert2";

type UserCategory = "all" | "verified" | "unverified" | "pending_kyc";

const CATEGORY_LABELS: Record<UserCategory, string> = {
  all: "All Users",
  verified: "Verified",
  unverified: "Unverified",
  pending_kyc: "Pending KYC",
};

function resolveFullName(row: any): string {
  if (row?.full_name && String(row.full_name).trim())
    return String(row.full_name).trim();
  const first = row?.first_name ? String(row.first_name).trim() : "";
  const last = row?.last_name ? String(row.last_name).trim() : "";
  const combined = `${first} ${last}`.trim();
  return combined || "—";
}

// ═══════════════════════════════════════════════════════════════════
// OTP EDIT MODAL
// ═══════════════════════════════════════════════════════════════════
function EditUserModal({
  user,
  onClose,
  onSaved,
}: {
  user: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [step, setStep] = useState<"verify" | "form">("verify");
  const [otpCode, setOtpCode] = useState("");
  const [editToken, setEditToken] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const [form, setForm] = useState({
    full_name: user.full_name ?? "",
    phone: user.phone ?? "",
    email: user.email ?? "",
    admin_role: user.admin_role ?? "",
  });

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const sendOtp = async () => {
    setSending(true);
    try {
      const res = await fetch("/api/admin-apis/users/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", targetUserId: user.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send code");
      setOtpSent(true);
      setCountdown(60);
      Swal.fire({
        icon: "success",
        title: "Code Sent",
        text: data.message || "Check your email.",
        timer: 3000,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setSending(false);
    }
  };

  const verifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      Swal.fire("Invalid", "Enter a 6-digit code.", "warning");
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch("/api/admin-apis/users/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify",
          targetUserId: user.id,
          code: otpCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid code");
      setEditToken(data.token);
      setStep("form");
      Swal.fire({
        icon: "success",
        title: "Verified",
        text: "You can now edit this user.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire("Error", err.message, "error");
      setOtpCode("");
    } finally {
      setVerifying(false);
    }
  };

  const saveChanges = async () => {
    if (!editToken) {
      Swal.fire("Error", "Verification expired. Verify again.", "error");
      setStep("verify");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin-apis/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-edit-token": editToken,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      Swal.fire({
        icon: "success",
        title: "Saved",
        text: "User updated.",
        timer: 2000,
        showConfirmButton: false,
      });
      onSaved();
      onClose();
    } catch (err: any) {
      if (
        err.message.toLowerCase().includes("token") ||
        err.message.toLowerCase().includes("otp")
      ) {
        setStep("verify");
      }
      Swal.fire("Error", err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="squircle-lg border border-(--border-color) bg-(--bg-primary) w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold font-(--font-space-grotesk) text-(--text-primary)">
              {step === "verify" ? "Verify Admin" : "Edit User"}
            </h3>
            <p className="text-xs text-(--text-secondary) mt-1">
              {step === "verify"
                ? "Security verification required"
                : `Editing ${user.email}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-(--text-secondary) hover:text-(--text-primary)"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {step === "verify" && (
          <>
            <div className="squircle-md bg-[--color-accent-yellow]/10 border border-[--color-accent-yellow]/30 p-4">
              <p className="text-sm text-(--text-primary)">
                🔐 A 6-digit code will be sent to your admin email.
              </p>
            </div>

            {!otpSent ? (
              <Button
                onClick={sendOtp}
                disabled={sending}
                className="w-full h-11"
              >
                {sending ? "Sending..." : "📧 Send Verification Code"}
              </Button>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-(--text-secondary) mb-1.5">
                    Enter 6-digit code
                  </label>
                  <Input
                    value={otpCode}
                    onChange={(e) =>
                      setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="000000"
                    inputMode="numeric"
                    maxLength={6}
                    className="text-center text-2xl tracking-[0.5em] font-mono"
                  />
                </div>
                <Button
                  onClick={verifyOtp}
                  disabled={verifying || otpCode.length !== 6}
                  className="w-full h-11"
                >
                  {verifying ? "Verifying..." : "✓ Verify"}
                </Button>
                <div className="flex items-center justify-between text-xs text-(--text-secondary)">
                  <button
                    onClick={sendOtp}
                    disabled={sending || countdown > 0}
                    className="text-[--color-accent-yellow] hover:underline disabled:opacity-50"
                  >
                    {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
                  </button>
                  <span>Expires in 5 minutes</span>
                </div>
              </>
            )}
          </>
        )}

        {step === "form" && (
          <>
            <div className="squircle-md bg-[--color-lemon-green]/10 border border-[--color-lemon-green]/30 p-3">
              <p className="text-xs text-[--color-lemon-green]">
                ✓ Verified — 3 minutes to save
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-(--text-secondary) mb-1.5">
                  Full Name
                </label>
                <Input
                  value={form.full_name}
                  onChange={(e) =>
                    setForm({ ...form, full_name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-(--text-secondary) mb-1.5">
                  Email
                </label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-(--text-secondary) mb-1.5">
                  Phone
                </label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-(--text-secondary) mb-1.5">
                  Admin Role
                </label>
                <select
                  value={form.admin_role}
                  onChange={(e) =>
                    setForm({ ...form, admin_role: e.target.value })
                  }
                  className="w-full h-11 squircle-md border border-(--border-color) bg-(--bg-secondary) text-(--text-primary) text-sm px-3"
                >
                  <option value="">User (no admin role)</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="operations_admin">Operations Admin</option>
                  <option value="finance_admin">Finance Admin</option>
                  <option value="support_admin">Support Admin</option>
                  <option value="legal_admin">Legal Admin</option>
                  <option value="blog_admin">Blog Admin</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={saveChanges}
                disabled={saving}
                className="flex-1"
              >
                {saving ? "Saving..." : "💾 Save"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════
export default function UsersPage() {
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<UserCategory>("all");
  const [roleFilter, setRoleFilter] = useState("");
  const [editUser, setEditUser] = useState<any>(null);

  // Reset page to 1 when search or category changes
  const filterKey = `${appliedSearch}|${category}|${roleFilter}`;

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  // Build API URL — sends BOTH "search" and "q" to match backend
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "20",
      includeStats: "true",
      category,
    });
    if (appliedSearch) {
      params.append("search", appliedSearch);
      params.append("q", appliedSearch);
    }
    if (roleFilter) params.append("role", roleFilter);
    return `/api/admin-apis/users?${params.toString()}`;
  }, [page, appliedSearch, category, roleFilter]);

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    apiUrl,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 2000,
      keepPreviousData: false,
      shouldRetryOnError: false,
    },
  );

  const users = data?.users ?? data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20) || 1;
  const stats = data?.stats ?? {};

  const runSearch = () => {
    const trimmed = searchInput.trim();
    if (trimmed === appliedSearch) {
      // Same search — force refetch
      mutate();
      return;
    }
    setAppliedSearch(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      runSearch();
    }
  };

  const clearSearch = () => {
    setSearchInput("");
    setAppliedSearch("");
  };

  // ═══════════════════════════════════════════════════════════════
  // ACTION HANDLERS
  // ═══════════════════════════════════════════════════════════════

  const handleBlockToggle = async (row: any) => {
    const isBlocked = row.is_blocked;
    const result = await Swal.fire({
      title: isBlocked ? "Unblock user?" : "Block user?",
      text: isBlocked
        ? `Unblock ${row.email}?`
        : `Block ${row.email}? They will not be able to transact.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: isBlocked ? "Unblock" : "Block",
      confirmButtonColor: isBlocked ? "#00B64F" : "#dc2626",
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`/api/admin-apis/users/${row.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isBlocked ? "unblock" : "block",
          reason: isBlocked ? null : "Blocked from admin panel",
        }),
      });
      if (!res.ok) throw new Error("Failed");
      Swal.fire(
        "Done",
        `User ${isBlocked ? "unblocked" : "blocked"}.`,
        "success",
      );
      mutate();
    } catch {
      Swal.fire("Error", "Failed to update user", "error");
    }
  };

  const handleSuspend = async (row: any) => {
    const { value: formValues } = await Swal.fire({
      title: "Suspend User",
      html: `
        <div style="text-align: left; display: flex; flex-direction: column; gap: 12px;">
          <div>
            <label style="display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #666; margin-bottom: 6px;">Duration</label>
            <select id="suspend-duration" class="swal2-select" style="width: 100%; margin: 0;">
              <option value="1">1 day</option>
              <option value="3">3 days</option>
              <option value="7" selected>7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
              <option value="permanent">Permanent</option>
            </select>
          </div>
          <div>
            <label style="display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #666; margin-bottom: 6px;">Reason</label>
            <textarea id="suspend-reason" class="swal2-textarea" placeholder="Reason for suspension..." style="width: 100%; margin: 0; min-height: 80px;"></textarea>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Suspend",
      confirmButtonColor: "#dc2626",
      preConfirm: () => {
        const duration = (
          document.getElementById("suspend-duration") as HTMLSelectElement
        )?.value;
        const reason = (
          document.getElementById("suspend-reason") as HTMLTextAreaElement
        )?.value?.trim();
        if (!reason) {
          Swal.showValidationMessage("Please provide a reason");
          return null;
        }
        return { duration, reason };
      },
    });

    if (!formValues) return;

    try {
      const res = await fetch(`/api/admin-apis/users/${row.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "suspend",
          duration: formValues.duration,
          reason: formValues.reason,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      Swal.fire("Suspended", `${row.email} has been suspended.`, "success");
      mutate();
    } catch {
      Swal.fire("Error", "Failed to suspend user", "error");
    }
  };

  const handleFlag = async (row: any) => {
    if (row.is_flagged) {
      const result = await Swal.fire({
        title: "Unflag user?",
        text: `Remove flag from ${row.email}?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Unflag",
        confirmButtonColor: "#00B64F",
      });
      if (!result.isConfirmed) return;
      try {
        const res = await fetch(`/api/admin-apis/users/${row.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "unflag" }),
        });
        if (!res.ok) throw new Error("Failed");
        Swal.fire("Unflagged", "User is no longer flagged.", "success");
        mutate();
      } catch {
        Swal.fire("Error", "Failed to unflag user", "error");
      }
      return;
    }

    const { value: formValues } = await Swal.fire({
      title: "Flag User",
      html: `
        <div style="text-align: left; display: flex; flex-direction: column; gap: 12px;">
          <div>
            <label style="display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #666; margin-bottom: 6px;">Reason</label>
            <select id="flag-reason" class="swal2-select" style="width: 100%; margin: 0;">
              <option value="suspicious_activity">Suspicious Activity</option>
              <option value="multiple_failures">Multiple Failed Logins</option>
              <option value="unusual_transactions">Unusual Transactions</option>
              <option value="kyc_mismatch">KYC Mismatch</option>
              <option value="policy_violation">Policy Violation</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label style="display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #666; margin-bottom: 6px;">Notes (optional)</label>
            <textarea id="flag-notes" class="swal2-textarea" placeholder="Additional context..." style="width: 100%; margin: 0; min-height: 60px;"></textarea>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Flag User",
      confirmButtonColor: "#FDC020",
      preConfirm: () => {
        const reason = (
          document.getElementById("flag-reason") as HTMLSelectElement
        )?.value;
        const notes = (
          document.getElementById("flag-notes") as HTMLTextAreaElement
        )?.value?.trim();
        return { reason, notes };
      },
    });

    if (!formValues) return;

    try {
      const res = await fetch(`/api/admin-apis/users/${row.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "flag",
          reason: formValues.reason,
          notes: formValues.notes,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      Swal.fire("Flagged", "User has been flagged.", "success");
      mutate();
    } catch {
      Swal.fire("Error", "Failed to flag user", "error");
    }
  };

  const handleFreezeWallet = async (row: any) => {
    if (row.wallet_frozen) {
      const result = await Swal.fire({
        title: "Unfreeze wallet?",
        text: `Unfreeze ${row.email}'s wallet?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Unfreeze",
        confirmButtonColor: "#00B64F",
      });
      if (!result.isConfirmed) return;
      try {
        const res = await fetch(`/api/admin-apis/users/${row.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "unfreeze" }),
        });
        if (!res.ok) throw new Error("Failed");
        Swal.fire("Unfrozen", "Wallet has been unfrozen.", "success");
        mutate();
      } catch {
        Swal.fire("Error", "Failed to unfreeze wallet", "error");
      }
      return;
    }

    const { value: reason } = await Swal.fire({
      title: "Freeze Wallet",
      input: "textarea",
      inputLabel: "Reason for freezing",
      inputPlaceholder: "Reason...",
      showCancelButton: true,
      confirmButtonText: "Freeze Wallet",
      confirmButtonColor: "#dc2626",
      inputValidator: (value) => {
        if (!value?.trim()) return "Please provide a reason";
      },
    });

    if (!reason) return;

    try {
      const res = await fetch(`/api/admin-apis/users/${row.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "freeze", reason }),
      });
      if (!res.ok) throw new Error("Failed");
      Swal.fire("Frozen", "Wallet has been frozen.", "success");
      mutate();
    } catch {
      Swal.fire("Error", "Failed to freeze wallet", "error");
    }
  };

  const handleAdjustBalance = async (row: any) => {
    const { value: type } = await Swal.fire({
      title: "Adjust Wallet",
      text: `Adjust balance for ${row.email}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Continue",
      input: "select",
      inputOptions: {
        credit: "Credit (add money)",
        debit: "Debit (deduct money)",
      },
      inputPlaceholder: "Select type",
      inputValidator: (value) => {
        if (!value) return "Please select credit or debit";
      },
    });

    if (!type) return;

    const { value: formValues } = await Swal.fire({
      title: type === "credit" ? "Credit Wallet" : "Debit Wallet",
      html: `
        <div style="text-align: left; display: flex; flex-direction: column; gap: 12px;">
          <div>
            <label style="display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #666; margin-bottom: 6px;">Amount (₦)</label>
            <input id="adj-amount" class="swal2-input" type="number" min="1" placeholder="1000" style="width: 100%; margin: 0;">
          </div>
          <div>
            <label style="display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #666; margin-bottom: 6px;">Reason</label>
            <textarea id="adj-reason" class="swal2-textarea" placeholder="Reason for adjustment..." style="width: 100%; margin: 0; min-height: 60px;"></textarea>
          </div>
          <p style="font-size: 12px; color: #dc2626; margin: 0;">⚠️ Requires OTP verification next.</p>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Continue to OTP",
      preConfirm: () => {
        const amount = (
          document.getElementById("adj-amount") as HTMLInputElement
        )?.value;
        const reason = (
          document.getElementById("adj-reason") as HTMLTextAreaElement
        )?.value?.trim();
        if (!amount || Number(amount) <= 0) {
          Swal.showValidationMessage("Enter a valid amount");
          return null;
        }
        if (!reason) {
          Swal.showValidationMessage("Please provide a reason");
          return null;
        }
        return { amount: Number(amount), reason };
      },
    });

    if (!formValues) return;

    try {
      await fetch("/api/admin-apis/users/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", targetUserId: row.id }),
      });
    } catch {
      Swal.fire("Error", "Failed to send OTP email", "error");
      return;
    }

    const { value: otpCode } = await Swal.fire({
      title: "Enter OTP",
      text: "A 6-digit code was sent to your admin email.",
      input: "text",
      inputPlaceholder: "000000",
      inputAttributes: { maxlength: "6", inputmode: "numeric" },
      showCancelButton: true,
      confirmButtonText: "Verify & Execute",
      inputValidator: (value) => {
        if (!value || value.length !== 6) return "Enter 6-digit code";
      },
    });

    if (!otpCode) return;

    try {
      const verifyRes = await fetch("/api/admin-apis/users/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify",
          targetUserId: row.id,
          code: otpCode,
        }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok)
        throw new Error(verifyData.error || "Verification failed");

      const res = await fetch(`/api/admin-apis/users/${row.id}/wallet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-edit-token": verifyData.token,
        },
        body: JSON.stringify({
          type,
          amount: formValues.amount,
          reason: formValues.reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      Swal.fire(
        "Success",
        `Wallet ${type === "credit" ? "credited" : "debited"} successfully.\n\nNew balance: ₦${data.balanceAfter?.toLocaleString() || "—"}`,
        "success",
      );
      mutate();
    } catch (err: any) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const handleKycAction = async (row: any, action: "approve" | "reject") => {
    if (action === "reject") {
      const { value: reason } = await Swal.fire({
        title: "Reject KYC?",
        input: "textarea",
        inputLabel: "Reason for rejection",
        inputPlaceholder: "Reason...",
        showCancelButton: true,
        confirmButtonText: "Reject",
        confirmButtonColor: "#dc2626",
        inputValidator: (value) => {
          if (!value?.trim()) return "Please provide a reason";
        },
      });
      if (!reason) return;

      try {
        const res = await fetch(`/api/admin-apis/users/${row.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "reject_kyc", reason }),
        });
        if (!res.ok) throw new Error("Failed");
        Swal.fire("Rejected", "KYC has been rejected.", "success");
        mutate();
      } catch {
        Swal.fire("Error", "Failed to reject KYC", "error");
      }
      return;
    }

    const result = await Swal.fire({
      title: "Approve KYC?",
      text: `Approve KYC for ${row.email}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Approve",
      confirmButtonColor: "#00B64F",
    });
    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/admin-apis/users/${row.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve_kyc" }),
      });
      if (!res.ok) throw new Error("Failed");
      Swal.fire("Approved", "KYC has been approved.", "success");
      mutate();
    } catch {
      Swal.fire("Error", "Failed to approve KYC", "error");
    }
  };

  const handlePasswordReset = async (row: any) => {
    const result = await Swal.fire({
      title: "Send password reset?",
      text: `Send a password reset email to ${row.email}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Send Email",
      confirmButtonColor: "#FDC020",
    });
    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/admin-apis/users/${row.id}/password-reset`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      Swal.fire(
        "Sent",
        `Password reset email sent to ${row.email}.`,
        "success",
      );
    } catch (err: any) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const handleViewLoginHistory = async (row: any) => {
    try {
      const res = await fetch(`/api/admin-apis/users/${row.id}/login-history`);
      if (!res.ok) throw new Error("Failed");
      const history = await res.json();

      let html =
        '<div style="text-align:left;max-height:400px;overflow-y:auto;">';
      if (!history || history.length === 0) {
        html +=
          '<p style="color:#666;text-align:center;padding:20px;">No login history found.</p>';
      } else {
        html +=
          '<table style="width:100%;font-size:13px;border-collapse:collapse;">';
        html +=
          '<thead><tr style="background:#f9fafb;border-bottom:1px solid #e5e7eb;">';
        html +=
          '<th style="padding:8px;text-align:left;font-weight:600;">Time</th>';
        html +=
          '<th style="padding:8px;text-align:left;font-weight:600;">IP</th>';
        html +=
          '<th style="padding:8px;text-align:left;font-weight:600;">Status</th>';
        html += "</tr></thead><tbody>";
        history.forEach((entry: any) => {
          const time = new Date(entry.login_time).toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
          const status = entry.is_suspicious
            ? '<span style="color:#dc2626;font-weight:600;">Suspicious</span>'
            : entry.is_successful
              ? '<span style="color:#00B64F;font-weight:600;">Success</span>'
              : '<span style="color:#999;">Failed</span>';
          html += `<tr style="border-bottom:1px solid #f3f4f6;">
            <td style="padding:8px;">${time}</td>
            <td style="padding:8px;font-family:monospace;font-size:11px;">${entry.ip_address || "—"}</td>
            <td style="padding:8px;">${status}</td>
          </tr>`;
        });
        html += "</tbody></table>";
      }
      html += "</div>";

      await Swal.fire({
        title: `Login History — ${row.email}`,
        html,
        width: 700,
        confirmButtonColor: "#3b82f6",
      });
    } catch {
      Swal.fire("Error", "Failed to load login history", "error");
    }
  };

  const handleVerifyEmail = async (row: any) => {
    const result = await Swal.fire({
      title: "Manually verify email?",
      text: `Mark ${row.email} as verified without the user clicking the link?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Verify Email",
      confirmButtonColor: "#00B64F",
    });
    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/admin-apis/users/${row.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify_email" }),
      });
      if (!res.ok) throw new Error("Failed");
      Swal.fire("Verified", "Email has been verified manually.", "success");
      mutate();
    } catch {
      Swal.fire("Error", "Failed to verify email", "error");
    }
  };

  const handleResetPin = async (row: any) => {
    const result = await Swal.fire({
      title: "Reset transaction PIN?",
      text: `${row.email} will need to set a new PIN on next login.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Reset PIN",
      confirmButtonColor: "#FDC020",
    });
    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/admin-apis/users/${row.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_pin" }),
      });
      if (!res.ok) throw new Error("Failed");
      Swal.fire("Reset", "Transaction PIN has been reset.", "success");
      mutate();
    } catch {
      Swal.fire("Error", "Failed to reset PIN", "error");
    }
  };

  const handleDelete = async (row: any) => {
    const result = await Swal.fire({
      title: "Delete user?",
      text: `Permanently delete ${row.email}? This cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc2626",
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`/api/admin-apis/users/${row.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
      mutate();
    } catch {
      Swal.fire("Error", "Failed to delete user", "error");
    }
  };

  const handleForceLogout = async (row: any) => {
    const result = await Swal.fire({
      title: "Force logout?",
      text: `Force ${row.email} to log out from all sessions?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Force Logout",
      confirmButtonColor: "#FDC020",
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`/api/admin-apis/users/${row.id}/force-logout`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed");
      Swal.fire("Done", "User has been logged out.", "success");
    } catch {
      Swal.fire("Error", "Failed to force logout", "error");
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // COLUMNS
  // ═══════════════════════════════════════════════════════════════
  const columns = [
    {
      key: "full_name",
      label: "Name",
      render: (_v: any, row: any) => {
        const name = resolveFullName(row);
        const hasName = name !== "—";
        return (
          <div className="flex flex-col min-w-0">
            <span className="font-medium truncate">{name}</span>
            <span className="text-xs text-(--text-secondary) truncate">
              {row.email ?? "—"}
            </span>
            {!hasName && (
              <span className="mt-1 inline-flex w-fit squircle-sm px-2 py-0.5 text-[10px] font-medium bg-[--color-accent-yellow]/15 text-[--color-accent-yellow]">
                ⚠ Profile incomplete
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "phone",
      label: "Phone",
      render: (v: any) => (
        <span className="whitespace-nowrap">{v ?? "—"}</span>
      ),
    },
    {
      key: "wallet_balance",
      label: "Wallet",
      render: (v: any) => (
        <span className="font-medium whitespace-nowrap">
          {formatCurrency(Number(v) || 0)}
        </span>
      ),
    },
    {
      key: "email_verified",
      label: "Email",
      render: (v: any) =>
        v ? (
          <span className="squircle-sm px-2 py-1 text-xs bg-[--color-lemon-green]/15 text-[--color-lemon-green] whitespace-nowrap">
            ✓ Verified
          </span>
        ) : (
          <span className="squircle-sm px-2 py-1 text-xs bg-destructive/15 text-destructive whitespace-nowrap">
            ✗ Unverified
          </span>
        ),
    },
    {
      key: "kyc_status",
      label: "KYC",
      render: (v: any) => {
        const status = String(v ?? "pending");
        const cls =
          status === "verified"
            ? "bg-[--color-lemon-green]/15 text-[--color-lemon-green]"
            : status === "pending"
              ? "bg-[--color-accent-yellow]/15 text-[--color-accent-yellow]"
              : "bg-(--bg-secondary) text-(--text-secondary)";
        return (
          <span
            className={`squircle-sm px-2 py-1 text-xs ${cls} whitespace-nowrap`}
          >
            ● {status}
          </span>
        );
      },
    },
    {
      key: "admin_role",
      label: "Role",
      render: (v: any) =>
        v ? (
          <span className="squircle-sm px-2 py-1 text-xs bg-purple-500/15 text-purple-400 whitespace-nowrap capitalize">
            {String(v).replace(/_/g, " ")}
          </span>
        ) : (
          <span className="text-xs text-(--text-secondary)">User</span>
        ),
    },
    {
      key: "is_blocked",
      label: "Status",
      render: (_v: any, row: any) => {
        if (row.is_blocked) {
          return (
            <span className="squircle-sm px-2 py-1 text-xs bg-destructive/15 text-destructive whitespace-nowrap">
              ✗ Blocked
            </span>
          );
        }
        if (row.is_flagged) {
          return (
            <span className="squircle-sm px-2 py-1 text-xs bg-[--color-accent-yellow]/15 text-[--color-accent-yellow] whitespace-nowrap">
              🚩 Flagged
            </span>
          );
        }
        if (row.wallet_frozen) {
          return (
            <span className="squircle-sm px-2 py-1 text-xs bg-blue-500/15 text-blue-400 whitespace-nowrap">
              ❄️ Frozen
            </span>
          );
        }
        return (
          <span className="squircle-sm px-2 py-1 text-xs bg-[--color-lemon-green]/15 text-[--color-lemon-green] whitespace-nowrap">
            ✓ Active
          </span>
        );
      },
    },
    { key: "created_at", label: "Joined" },
  ];

  if (isLoading && !data) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <Loader />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="p-6 text-destructive">
          Failed to load users ❌
          <p className="text-xs mt-2 text-(--text-secondary)">
            {error?.message ?? "Unknown error"}
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-xl sm:text-2xl font-semibold font-(--font-space-grotesk) text-(--text-primary)">
            Users
          </h2>
          <Button variant="outline" onClick={() => mutate()}>
            🔄 Refresh
          </Button>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <button
            onClick={() => setCategory("all")}
            className="text-left"
            aria-pressed={category === "all"}
          >
            <KPICard
              title="All Users"
              value={formatNumber(stats.total ?? total)}
              icon="◉"
              className={
                category === "all"
                  ? "border-l-4 border-l-[--color-accent-yellow] ring-2 ring-[--color-accent-yellow]/40"
                  : "border-l-4 border-l-[--color-accent-yellow]"
              }
            />
          </button>
          <button
            onClick={() => setCategory("verified")}
            className="text-left"
            aria-pressed={category === "verified"}
          >
            <KPICard
              title="Verified"
              value={formatNumber(stats.verified ?? 0)}
              icon="✓"
              className={
                category === "verified"
                  ? "border-l-4 border-l-[--color-lemon-green] ring-2 ring-[--color-lemon-green]/40"
                  : "border-l-4 border-l-[--color-lemon-green]"
              }
            />
          </button>
          <button
            onClick={() => setCategory("unverified")}
            className="text-left"
            aria-pressed={category === "unverified"}
          >
            <KPICard
              title="Unverified"
              value={formatNumber(stats.unverified ?? 0)}
              icon="✗"
              className={
                category === "unverified"
                  ? "border-l-4 border-l-destructive ring-2 ring-destructive/40"
                  : "border-l-4 border-l-destructive"
              }
            />
          </button>
          <button
            onClick={() => setCategory("pending_kyc")}
            className="text-left"
            aria-pressed={category === "pending_kyc"}
          >
            <KPICard
              title="Pending KYC"
              value={formatNumber(stats.pendingKyc ?? 0)}
              icon="⏳"
              className={
                category === "pending_kyc"
                  ? "border-l-4 border-l-[--color-accent-yellow] ring-2 ring-[--color-accent-yellow]/40"
                  : "border-l-4 border-l-[--color-accent-yellow]"
              }
            />
          </button>
        </div>

        <div className="text-xs text-(--text-secondary) leading-relaxed break-words">
          Showing:{" "}
          <span className="font-medium text-(--text-primary)">
            {CATEGORY_LABELS[category]}
          </span>
        </div>

        {/* Search */}
        <div className="squircle-lg border border-(--border-color) bg-(--bg-primary) shadow-soft p-4">
          <label
            htmlFor="user-search"
            className="block text-xs font-semibold uppercase tracking-widest text-(--text-secondary) mb-1.5"
          >
            Search
            {isValidating && appliedSearch && (
              <span className="ml-2 inline-block w-2 h-2 bg-[--color-accent-yellow] rounded-full animate-pulse" />
            )}
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              id="user-search"
              placeholder="Search by email, name, or phone..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
              autoComplete="off"
            />
            <Button
              type="button"
              onClick={runSearch}
              className="sm:w-auto relative z-10"
            >
              🔍 Search
            </Button>
            {appliedSearch && (
              <Button
                type="button"
                variant="outline"
                onClick={clearSearch}
                className="text-destructive hover:bg-destructive/10 sm:w-auto"
              >
                ✕ Clear
              </Button>
            )}
          </div>
          {appliedSearch && (
            <p className="text-xs text-(--text-secondary) mt-1.5">
              Searching for{" "}
              <span className="font-medium text-(--text-primary)">
                "{appliedSearch}"
              </span>
            </p>
          )}
        </div>

        {/* Filters */}
        <FilterBar
          filters={[
            {
              id: "role",
              label: "Role",
              value: roleFilter,
              onChange: setRoleFilter,
              placeholder: "All Roles",
              options: [
                { value: "super_admin", label: "Super Admin" },
                { value: "operations_admin", label: "Operations" },
                { value: "finance_admin", label: "Finance" },
                { value: "support_admin", label: "Support" },
                { value: "legal_admin", label: "Legal" },
                { value: "blog_admin", label: "Blog" },
              ],
            },
          ]}
          onClear={() => {
            setSearchInput("");
            setAppliedSearch("");
            setRoleFilter("");
          }}
          hasActiveFilters={!!appliedSearch || !!roleFilter}
        />

        <div className="text-sm text-(--text-secondary)">
          Showing {users.length} of {total} users
        </div>

        <AdminTable
          columns={columns}
          rows={users}
          onEdit={(row: any) => setEditUser(row)}
          onBlockToggle={handleBlockToggle}
          onDelete={handleDelete}
          onForceLogout={handleForceLogout}
          onViewDetails={(row: any) => {
            window.location.href = `/admin/transactions/user/${row.id}`;
          }}
          customActions={[
            {
              label: "Suspend (with duration)",
              onClick: handleSuspend,
              className: "text-orange-500",
              icon: "⏸",
            },
            {
              label: "Flag / Unflag",
              onClick: handleFlag,
              className: "text-[--color-accent-yellow]",
              icon: "🚩",
            },
            {
              label: "Freeze / Unfreeze Wallet",
              onClick: handleFreezeWallet,
              className: "text-blue-500",
              icon: "❄️",
            },
            {
              label: "Adjust Wallet Balance",
              onClick: handleAdjustBalance,
              className: "text-purple-500",
              icon: "₦",
            },
            {
              label: "Approve KYC",
              onClick: (row: any) => handleKycAction(row, "approve"),
              className: "text-[--color-lemon-green]",
              icon: "✓",
            },
            {
              label: "Reject KYC",
              onClick: (row: any) => handleKycAction(row, "reject"),
              className: "text-destructive",
              icon: "✗",
            },
            {
              label: "Send Password Reset",
              onClick: handlePasswordReset,
              className: "text-[--color-accent-yellow]",
              icon: "🔑",
            },
            {
              label: "Verify Email",
              onClick: handleVerifyEmail,
              className: "text-[--color-lemon-green]",
              icon: "📧",
            },
            {
              label: "Reset Transaction PIN",
              onClick: handleResetPin,
              className: "text-orange-500",
              icon: "🔒",
            },
            {
              label: "View Login History",
              onClick: handleViewLoginHistory,
              className: "text-blue-500",
              icon: "🕒",
            },
          ]}
          emptyMessage={
            appliedSearch
              ? `No users match "${appliedSearch}"`
              : "No users found"
          }
        />

        {totalPages > 1 && (
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ← Prev
            </Button>
            <span className="px-4 py-2 text-sm text-(--text-secondary)">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next →
            </Button>
          </div>
        )}

        {editUser && (
          <EditUserModal
            user={editUser}
            onClose={() => setEditUser(null)}
            onSaved={() => mutate()}
          />
        )}
      </div>
    </AdminLayout>
  );
}