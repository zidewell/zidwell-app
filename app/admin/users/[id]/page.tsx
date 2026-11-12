// app/admin/users/[id]/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import useSWR from "swr";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AdminLayout from "@/app/components/admin-components/layout";
import KPICard from "@/app/components/admin-components/KPICard";
import Loader from "@/app/components/Loader";
import { Button } from "@/app/components/ui/button";
import fetcher from "@/app/lib/fetcher";
import { formatCurrency } from "@/app/lib/dashboard-utils";
import Swal from "sweetalert2";
import {
  ArrowLeft,
  Mail,
  Phone,
  ShieldCheck,
  ShieldAlert,
  Snowflake,
  Flag,
  Ban,
  KeyRound,
  Clock,
  ExternalLink,
  RefreshCw,
  Wallet,
  UserCog,
  MapPin,
  AlertCircle,
} from "lucide-react";

const TIER_LABELS: Record<string, string> = {
  tier_1: "Tier 1 — Enterprise",
  tier_2: "Tier 2 — Business",
  tier_3: "Tier 3 — Standard",
};

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  operations_admin: "Operations Admin",
  finance_admin: "Finance Admin",
  support_admin: "Support Admin",
  legal_admin: "Legal Admin",
  blog_admin: "Blog Admin",
};

function resolveFullName(row: any): string {
  const fullName = row?.full_name;
  if (fullName && String(fullName).trim()) return String(fullName).trim();
  const first = row?.first_name ? String(row.first_name).trim() : "";
  const last = row?.last_name ? String(row.last_name).trim() : "";
  const combined = `${first} ${last}`.trim();
  return combined || "—";
}

function fmtDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function fmtDateOnly(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

function StatusBadge({
  label,
  tone,
  icon,
}: {
  label: string;
  tone: "success" | "warning" | "danger" | "info" | "neutral";
  icon: React.ReactNode;
}) {
  const tones = {
    success:
      "bg-(--color-lemon-green)/15 text-(--color-lemon-green) border-(--color-lemon-green)/30",
    warning:
      "bg-(--color-accent-yellow)/15 text-(--color-accent-yellow) border-(--color-accent-yellow)/30",
    danger: "bg-red-500/15 text-red-500 border-red-500/30",
    info: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    neutral:
      "bg-(--bg-secondary) text-(--text-secondary) border-(--border-color)",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${tones[tone]}`}
    >
      {icon}
      {label}
    </span>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-(--border-color) last:border-0">
      <div className="flex items-center gap-2 text-(--text-secondary) text-sm shrink-0">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-sm text-(--text-primary) text-right break-words min-w-0">
        {value ?? "—"}
      </div>
    </div>
  );
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [busy, setBusy] = useState<string | null>(null);

  const apiUrl = useMemo(
    () => (id ? `/api/admin-apis/users/${id}` : null),
    [id],
  );

  const { data, error, isLoading, mutate } = useSWR(apiUrl, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 2000,
  });

  const user = data?.user ?? data ?? null;

  const runAction = async (action: string, payload: any = {}) => {
    if (!id) return;
    setBusy(action);
    try {
      const res = await fetch(`/api/admin-apis/users/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `Failed: ${res.status}`);
      await Swal.fire({
        icon: "success",
        title: "Done",
        text: body.message || `${action} successful`,
        timer: 1600,
        showConfirmButton: false,
      });
      await mutate();
    } catch (e: any) {
      await Swal.fire({
        icon: "error",
        title: "Action Failed",
        text: e.message,
        confirmButtonColor: "var(--color-accent-yellow)",
      });
    } finally {
      setBusy(null);
    }
  };

  const handleFreeze = async () => {
    if (user.wallet_frozen) {
      const ok = await Swal.fire({
        title: "Unfreeze wallet?",
        text: "The user will be able to spend funds again.",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#00B64F",
        confirmButtonText: "Unfreeze",
      });
      if (!ok.isConfirmed) return;
      await runAction("unfreeze");
      return;
    }
    const { value: reason } = await Swal.fire({
      title: "Freeze wallet",
      input: "textarea",
      inputLabel: "Reason",
      inputPlaceholder: "Reason for freezing...",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Freeze",
      inputValidator: (v) => (!v?.trim() ? "A reason is required" : undefined),
    });
    if (!reason) return;
    await runAction("freeze", { reason });
  };

  const handleBlock = async () => {
    if (user.is_blocked) {
      const ok = await Swal.fire({
        title: "Unblock user?",
        text: "The user will be able to log in again.",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#00B64F",
        confirmButtonText: "Unblock",
      });
      if (!ok.isConfirmed) return;
      await runAction("unblock");
      return;
    }
    const { value: reason } = await Swal.fire({
      title: "Block user",
      input: "textarea",
      inputLabel: "Reason",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Block",
      inputValidator: (v) => (!v?.trim() ? "A reason is required" : undefined),
    });
    if (!reason) return;
    await runAction("block", { reason });
  };

  const handleFlag = async () => {
    if (user.is_flagged) {
      const ok = await Swal.fire({
        title: "Unflag user?",
        text: "Remove the flag from this account?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#00B64F",
        confirmButtonText: "Unflag",
      });
      if (!ok.isConfirmed) return;
      await runAction("unflag");
      return;
    }
    const { value: reason } = await Swal.fire({
      title: "Flag user",
      input: "textarea",
      inputLabel: "Reason for flag",
      showCancelButton: true,
      confirmButtonColor: "var(--color-accent-yellow)",
      confirmButtonText: "Flag",
      inputValidator: (v) => (!v?.trim() ? "A reason is required" : undefined),
    });
    if (!reason) return;
    await runAction("flag", { reason });
  };

  const handleResetPin = async () => {
    const ok = await Swal.fire({
      title: "Reset transaction PIN?",
      text: "The user will need to set a new PIN before their next transaction.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "var(--color-accent-yellow)",
      confirmButtonText: "Reset PIN",
    });
    if (!ok.isConfirmed) return;
    await runAction("reset_pin");
  };

  const handleVerifyEmail = async () => {
    const ok = await Swal.fire({
      title: "Manually verify email?",
      text: `Mark ${user.email} as verified without the user clicking a link?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#00B64F",
      confirmButtonText: "Verify Email",
    });
    if (!ok.isConfirmed) return;
    await runAction("verify_email");
  };

  const handleSendVerification = async () => {
    if (!id) return;
    const ok = await Swal.fire({
      title: "Send verification email?",
      text: `Send a fresh 24-hour verification link to ${user.email}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "var(--color-accent-yellow)",
      confirmButtonText: "Send",
    });
    if (!ok.isConfirmed) return;
    setBusy("send_verification");
    try {
      const res = await fetch(
        `/api/admin-apis/users/${id}/verify-email/send`,
        { method: "POST" },
      );
      const body = await res.json();
      if (!res.ok) {
        if (body.alreadyVerified) {
          await Swal.fire({
            icon: "info",
            title: "Already Verified",
            text: body.error,
            confirmButtonColor: "var(--color-accent-yellow)",
          });
          if (body.dbFlagHealed) await mutate();
        } else {
          throw new Error(body.error || "Failed");
        }
        return;
      }
      await Swal.fire({
        icon: "success",
        title: "Sent",
        text: body.message,
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (e: any) {
      await Swal.fire({
        icon: "error",
        title: "Send Failed",
        text: e.message,
        confirmButtonColor: "var(--color-accent-yellow)",
      });
    } finally {
      setBusy(null);
    }
  };

  const handleSendPasswordReset = async () => {
    if (!id) return;
    const ok = await Swal.fire({
      title: "Send password reset?",
      text: `Send a password reset email to ${user.email}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "var(--color-accent-yellow)",
      confirmButtonText: "Send Email",
    });
    if (!ok.isConfirmed) return;
    setBusy("password_reset");
    try {
      const res = await fetch(`/api/admin-apis/users/${id}/password-reset`, {
        method: "POST",
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed");
      await Swal.fire({
        icon: "success",
        title: "Sent",
        text: body.message || "Password reset email sent",
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (e: any) {
      await Swal.fire({
        icon: "error",
        title: "Failed",
        text: e.message,
        confirmButtonColor: "var(--color-accent-yellow)",
      });
    } finally {
      setBusy(null);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <Loader />
        </div>
      </AdminLayout>
    );
  }

  if (error || !user) {
    return (
      <AdminLayout>
        <div className="p-6">
          <Link href="/admin/users">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Users
            </Button>
          </Link>
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span className="text-sm">
              {(error as any)?.message || "User not found"}
            </span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const tier = String(user.account_tier || "tier_3");
  const emailVerified = user.email_verified === true;
  const kycStatus = String(user.bvn_verification || "not_submitted");
  const isBlocked = user.is_blocked === true;
  const isFlagged = user.is_flagged === true;
  const isFrozen = user.wallet_frozen === true;
  const pinLocked =
    user.pin_locked_until &&
    new Date(user.pin_locked_until).getTime() > Date.now();

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 max-w-6xl mx-auto">
        {/* ─── Header ─── */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <button
              onClick={() => router.push("/admin/users")}
              className="p-2 rounded-md hover:bg-(--bg-secondary) transition-colors shrink-0"
              aria-label="Back to users"
            >
              <ArrowLeft className="w-5 h-5 text-(--text-primary)" />
            </button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-semibold font-(--font-space-grotesk) text-(--text-primary) truncate">
                {resolveFullName(user)}
              </h1>
              <p className="text-sm text-(--text-secondary) truncate flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                {user.email}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              variant="outline"
              onClick={() => mutate()}
              disabled={!!busy}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${busy ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Link
              href={`/admin/users?search=${encodeURIComponent(
                user.email || user.id,
              )}`}
            >
              <Button variant="outline">
                <UserCog className="w-4 h-4 mr-2" />
                Edit in Users List
              </Button>
            </Link>
          </div>
        </div>

        {/* ─── Status badges ─── */}
        <div className="flex flex-wrap gap-2">
          <StatusBadge
            label={isBlocked ? "Blocked" : "Active"}
            tone={isBlocked ? "danger" : "success"}
            icon={<Ban className="w-3 h-3" />}
          />
          <StatusBadge
            label={emailVerified ? "Email verified" : "Email unverified"}
            tone={emailVerified ? "success" : "danger"}
            icon={
              emailVerified ? (
                <ShieldCheck className="w-3 h-3" />
              ) : (
                <ShieldAlert className="w-3 h-3" />
              )
            }
          />
          <StatusBadge
            label={`KYC: ${kycStatus.replace(/_/g, " ")}`}
            tone={
              kycStatus === "verified" || kycStatus === "approved"
                ? "success"
                : kycStatus === "pending"
                  ? "warning"
                  : kycStatus === "rejected"
                    ? "danger"
                    : "neutral"
            }
            icon={<ShieldCheck className="w-3 h-3" />}
          />
          {isFlagged && (
            <StatusBadge
              label="Flagged"
              tone="warning"
              icon={<Flag className="w-3 h-3" />}
            />
          )}
          {isFrozen && (
            <StatusBadge
              label="Wallet frozen"
              tone="info"
              icon={<Snowflake className="w-3 h-3" />}
            />
          )}
          {pinLocked && (
            <StatusBadge
              label="PIN locked"
              tone="danger"
              icon={<KeyRound className="w-3 h-3" />}
            />
          )}
        </div>

        {/* ─── KPIs ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Wallet Balance"
            value={formatCurrency(Number(user.wallet_balance) || 0)}
            icon="₦"
            className="border-l-4 border-l-[--color-lemon-green]"
          />
          <KPICard
            title="Account Tier"
            value={TIER_LABELS[tier] || tier}
            icon="◆"
            className="border-l-4 border-l-[--color-accent-yellow]"
          />
          <KPICard
            title="Admin Role"
            value={
              user.admin_role
                ? ROLE_LABELS[user.admin_role] || user.admin_role
                : "User"
            }
            icon="★"
          />
          <KPICard
            title="Joined"
            value={fmtDateOnly(user.created_at)}
            icon="📅"
          />
        </div>

        {/* ─── Profile + Security (2-col) ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Profile */}
          <div className="rounded-xl border-2 border-(--border-color) bg-(--bg-primary) shadow-(--shadow-soft) p-5">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-(--text-secondary) mb-3">
              Profile
            </h2>
            <DetailRow
              icon={<Mail className="w-3.5 h-3.5" />}
              label="Email"
              value={user.email}
            />
            <DetailRow
              icon={<Phone className="w-3.5 h-3.5" />}
              label="Phone"
              value={user.phone || "—"}
            />
            <DetailRow
              icon={<UserCog className="w-3.5 h-3.5" />}
              label="Full name"
              value={resolveFullName(user)}
            />
            <DetailRow label="Account tier" value={TIER_LABELS[tier] || tier} />
            <DetailRow
              label="Admin role"
              value={
                user.admin_role
                  ? ROLE_LABELS[user.admin_role] || user.admin_role
                  : "User (no admin role)"
              }
            />
            {(user.custom_outflow_percent != null ||
              user.custom_outflow_min != null) && (
              <DetailRow
                label="Custom outflow fee"
                value={
                  <span className="text-(--color-accent-yellow)">
                    {user.custom_outflow_percent != null
                      ? `${(
                          Number(user.custom_outflow_percent) * 100
                        ).toFixed(2)}%`
                      : "—"}{" "}
                    (min ₦
                    {Number(user.custom_outflow_min || 0).toLocaleString()})
                  </span>
                }
              />
            )}
            {user.custom_fee_note && (
              <DetailRow
                label="Custom fee note"
                value={
                  <span className="italic text-(--text-secondary)">
                    {user.custom_fee_note}
                  </span>
                }
              />
            )}
            {(user.city || user.state) && (
              <DetailRow
                icon={<MapPin className="w-3.5 h-3.5" />}
                label="Location"
                value={[user.city, user.state].filter(Boolean).join(", ")}
              />
            )}
          </div>

          {/* Security & session */}
          <div className="rounded-xl border-2 border-(--border-color) bg-(--bg-primary) shadow-(--shadow-soft) p-5">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-(--text-secondary) mb-3">
              Security &amp; session
            </h2>
            <DetailRow
              icon={<Clock className="w-3.5 h-3.5" />}
              label="Last login"
              value={fmtDate(user.last_login)}
            />
            <DetailRow
              icon={<Clock className="w-3.5 h-3.5" />}
              label="Last logout"
              value={fmtDate(user.last_logout)}
            />
            <DetailRow
              icon={<KeyRound className="w-3.5 h-3.5" />}
              label="PIN status"
              value={
                pinLocked ? (
                  <span className="text-red-500">
                    Locked until {fmtDate(user.pin_locked_until)}
                  </span>
                ) : user.pin_set ? (
                  <span className="text-(--color-lemon-green)">Set</span>
                ) : (
                  <span className="text-(--text-secondary)">Not set</span>
                )
              }
            />
            {user.is_blocked && user.block_reason && (
              <DetailRow
                label="Block reason"
                value={
                  <span className="text-red-500">{user.block_reason}</span>
                }
              />
            )}
            {user.is_flagged && user.flag_reason && (
              <DetailRow
                label="Flag reason"
                value={
                  <span className="text-(--color-accent-yellow)">
                    {user.flag_reason}
                  </span>
                }
              />
            )}
            {user.wallet_frozen && user.wallet_freeze_reason && (
              <DetailRow
                label="Freeze reason"
                value={
                  <span className="text-blue-400">
                    {user.wallet_freeze_reason}
                  </span>
                }
              />
            )}
          </div>
        </div>

        {/* ─── Actions ─── */}
        <div className="rounded-xl border-2 border-(--border-color) bg-(--bg-primary) shadow-(--shadow-soft) p-5">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-(--text-secondary) mb-3">
            Actions
          </h2>
          <div className="flex flex-wrap gap-2">
            {!emailVerified && (
              <>
                <Button
                  variant="outline"
                  onClick={handleSendVerification}
                  disabled={busy === "send_verification"}
                  className="text-(--color-accent-yellow)"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send verification email
                </Button>
                <Button
                  variant="outline"
                  onClick={handleVerifyEmail}
                  disabled={busy === "verify_email"}
                  className="text-(--color-lemon-green)"
                >
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Verify email manually
                </Button>
              </>
            )}
            <Button
              variant="outline"
              onClick={handleFreeze}
              disabled={!!busy}
              className={isFrozen ? "text-blue-400" : "text-blue-500"}
            >
              <Snowflake className="w-4 h-4 mr-2" />
              {isFrozen ? "Unfreeze wallet" : "Freeze wallet"}
            </Button>
            <Button
              variant="outline"
              onClick={handleBlock}
              disabled={!!busy}
              className={
                isBlocked ? "text-(--color-lemon-green)" : "text-red-500"
              }
            >
              <Ban className="w-4 h-4 mr-2" />
              {isBlocked ? "Unblock" : "Block"}
            </Button>
            <Button
              variant="outline"
              onClick={handleFlag}
              disabled={!!busy}
              className={
                isFlagged
                  ? "text-(--color-lemon-green)"
                  : "text-(--color-accent-yellow)"
              }
            >
              <Flag className="w-4 h-4 mr-2" />
              {isFlagged ? "Unflag" : "Flag"}
            </Button>
            <Button
              variant="outline"
              onClick={handleResetPin}
              disabled={!!busy}
              className="text-orange-500"
            >
              <KeyRound className="w-4 h-4 mr-2" />
              Reset transaction PIN
            </Button>
            <Button
              variant="outline"
              onClick={handleSendPasswordReset}
              disabled={busy === "password_reset"}
              className="text-(--color-accent-yellow)"
            >
              <KeyRound className="w-4 h-4 mr-2" />
              Send password reset
            </Button>
            <Link
              href={`/admin/transactions/user/${id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline">
                <Wallet className="w-4 h-4 mr-2" />
                View transactions
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* ─── Quick links ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href={`/admin/transactions/user/${id}`}
            className="rounded-xl border-2 border-(--border-color) bg-(--bg-primary) hover:border-(--color-accent-yellow) transition-colors p-4 flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-(--text-secondary)">
                Transactions
              </div>
              <div className="text-sm text-(--text-primary) mt-1">
                View full transaction history for this user
              </div>
            </div>
            <ExternalLink className="w-5 h-5 text-(--color-accent-yellow) shrink-0" />
          </Link>
          <Link
            href={`/admin/users?search=${encodeURIComponent(
              user.email || user.id,
            )}`}
            className="rounded-xl border-2 border-(--border-color) bg-(--bg-primary) hover:border-(--color-accent-yellow) transition-colors p-4 flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-(--text-secondary)">
                Edit User
              </div>
              <div className="text-sm text-(--text-primary) mt-1">
                Open in Users list to edit profile, role, tier &amp; fees
              </div>
            </div>
            <UserCog className="w-5 h-5 text-(--color-accent-yellow) shrink-0" />
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}