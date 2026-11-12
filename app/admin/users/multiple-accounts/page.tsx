// app/admin/users/multiple-accounts/page.tsx
"use client";
import Swal from "sweetalert2";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Phone,
  Mail,
  User as UserIcon,
  ShieldCheck,
  ShieldAlert,
  Search,
  RefreshCw,
  MailPlus,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

interface Account {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  email_verified: boolean | null;
  bvn_verification: string | null;
  wallet_balance: number | null;
  last_login: string | null;
  is_blocked: boolean | null;
}

interface Group {
  group_key: string;
  matched_by: ("phone" | "email" | "name")[];
  phone_normalized: string | null;
  emails: string[];
  names: string[];
  accounts: Account[];
}

interface Stats {
  totalGroups: number;
  totalAccounts: number;
  unverifiedAccounts: number;
}

// ═════════════════════════════════════════════════════════════
// StatCard — uses design-system tokens only, works in dark mode
// ═════════════════════════════════════════════════════════════
function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "warning";
}) {
  const isWarning = tone === "warning";

  return (
    <div
      className={`rounded-xl p-4 border-2 transition-colors ${
        isWarning
          ? "border-(--color-accent-yellow) bg-(--color-accent-yellow)/10"
          : "border-(--border-color) bg-(--bg-primary)"
      }`}
    >
      <div className="text-xs uppercase tracking-wide text-(--text-secondary)">
        {label}
      </div>
      <div
        className={`text-2xl font-bold mt-1 ${
          isWarning ? "text-(--color-accent-yellow)" : "text-(--text-primary)"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// MatchBadge — pill showing "matched by phone/email/name"
// ═════════════════════════════════════════════════════════════
function MatchBadge({ kind }: { kind: "phone" | "email" | "name" }) {
  const Icon =
    kind === "phone" ? Phone : kind === "email" ? Mail : UserIcon;

  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs inline-flex items-center gap-1
        bg-(--color-accent-yellow)/15 text-(--text-primary)
        border border-(--color-accent-yellow)/40"
    >
      <Icon className="w-3 h-3 text-(--color-accent-yellow)" />
      matched by {kind}
    </span>
  );
}

// ═════════════════════════════════════════════════════════════
// Main page
// ═════════════════════════════════════════════════════════════
export default function MultipleAccountsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [onlyUnverified, setOnlyUnverified] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (onlyUnverified) params.set("onlyUnverified", "true");

      const res = await fetch(
        `/api/admin-apis/users/multiple-accounts?${params.toString()}`,
        { credentials: "include", cache: "no-store" },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed: ${res.status}`);
      }

      const data = await res.json();
      setGroups(data.groups || []);
      setStats(data.stats || null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [search, onlyUnverified]);

  useEffect(() => {
    load();
  }, [load]);


  const sendVerification = async (userId: string, email: string | null) => {
    const confirmResult = await Swal.fire({
      title: "Send verification email?",
      text: `A fresh 24-hour verification link will be sent to ${
        email || "this user"
      }.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "var(--color-accent-yellow)",
      confirmButtonText: "Send",
      cancelButtonText: "Cancel",
    });
  
    if (!confirmResult.isConfirmed) return;
  
    setSendingId(userId);
    try {
      const res = await fetch(
        `/api/admin-apis/users/${userId}/verify-email/send`,
        { method: "POST", credentials: "include" },
      );
      const data = await res.json();
  
      if (!res.ok) {
        if (data.alreadyVerified) {
          await Swal.fire({
            icon: "info",
            title: "Already Verified",
            text: data.error,
            confirmButtonColor: "var(--color-accent-yellow)",
          });
          if (data.dbFlagHealed) await load();
        } else if (data.reason === "cooldown") {
          await Swal.fire({
            icon: "warning",
            title: "Please Wait",
            text: data.error,
            confirmButtonColor: "var(--color-accent-yellow)",
          });
        } else {
          await Swal.fire({
            icon: "error",
            title: "Send Failed",
            text: data.error || "Failed to send verification email",
            confirmButtonColor: "var(--color-accent-yellow)",
          });
        }
        return;
      }
  
      await Swal.fire({
        icon: "success",
        title: "Email Sent",
        text: data.message,
        timer: 1800,
        showConfirmButton: false,
      });
      await load();
    } catch (e: any) {
      await Swal.fire({
        icon: "error",
        title: "Network Error",
        text: e.message,
        confirmButtonColor: "var(--color-accent-yellow)",
      });
    } finally {
      setSendingId(null);
    }
  };
  return (
    <div className="p-6 max-w-6xl mx-auto text-(--text-primary)">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/users"
          className="p-2 rounded-md hover:bg-(--bg-secondary) transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-(--text-primary)" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-(--text-primary)">
            <Users className="w-6 h-6 text-(--color-accent-yellow)" />
            Users with Multiple Accounts
          </h1>
          <p className="text-sm text-(--text-secondary) mt-1">
            Grouped by phone, email, or name — including typo variants like{" "}
            <em>gmail</em> vs <em>gamil</em>.
          </p>
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard label="Groups" value={stats.totalGroups} />
          <StatCard label="Accounts" value={stats.totalAccounts} />
          <StatCard
            label="Unverified"
            value={stats.unverifiedAccounts}
            tone="warning"
          />
        </div>
      )}

      {/* ── Filters ───────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-(--text-secondary)" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="Search email, phone, or name..."
            className="w-full pl-10 pr-3 py-2 rounded-md
              bg-(--bg-primary) text-(--text-primary)
              border-2 border-(--border-color)
              placeholder:text-(--text-secondary)
              focus:outline-none focus:border-(--color-accent-yellow)
              transition-colors"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-(--text-secondary)">
          <input
            type="checkbox"
            checked={onlyUnverified}
            onChange={(e) => setOnlyUnverified(e.target.checked)}
            className="accent-(--color-accent-yellow)"
          />
          Only show groups with unverified accounts
        </label>
        <button
          onClick={load}
          disabled={loading}
          className="px-4 py-2 rounded-md flex items-center gap-2 font-medium
            bg-(--color-accent-yellow) text-(--ink)
            hover:opacity-90 transition-opacity
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* ── Error ─────────────────────────────────────────── */}
      {error && (
        <div className="p-4 mb-4 rounded-md flex items-start gap-2
          bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* ── Loading ───────────────────────────────────────── */}
      {loading && (
        <div className="p-8 text-center text-(--text-secondary)">
          Loading…
        </div>
      )}

      {/* ── Empty ─────────────────────────────────────────── */}
      {!loading && groups.length === 0 && !error && (
        <div className="p-8 text-center rounded-xl
          border-2 border-(--border-color) bg-(--bg-primary)
          text-(--text-secondary)">
          ✅ No duplicate accounts found
        </div>
      )}

      {/* ── Groups ────────────────────────────────────────── */}
      <div className="space-y-4">
        {groups.map((group) => (
          <div
            key={group.group_key}
            className="rounded-xl p-4
              border-2 border-(--border-color)
              bg-(--bg-primary) shadow-(--shadow-soft)"
          >
            {/* Group header */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {group.matched_by.map((m) => (
                <MatchBadge key={m} kind={m} />
              ))}
              <span className="ml-auto text-xs text-(--text-secondary)">
                {group.accounts.length} accounts
              </span>
            </div>

            {/* Group summary */}
            <div className="text-sm text-(--text-secondary) mb-4 space-y-1">
              {group.phone_normalized && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-(--color-accent-yellow)" />
                  <code className="bg-(--bg-secondary) px-1.5 py-0.5 rounded text-(--text-primary) font-mono text-xs">
                    {group.phone_normalized}
                  </code>
                </div>
              )}
              {group.emails.length > 0 && (
                <div className="flex items-start gap-2">
                  <Mail className="w-3.5 h-3.5 text-(--color-accent-yellow) mt-0.5 shrink-0" />
                  <span className="break-all">{group.emails.join(", ")}</span>
                </div>
              )}
              {group.names.length > 0 && (
                <div className="flex items-start gap-2">
                  <UserIcon className="w-3.5 h-3.5 text-(--color-accent-yellow) mt-0.5 shrink-0" />
                  <span>{group.names.join(", ")}</span>
                </div>
              )}
            </div>

            {/* Accounts table — horizontal scroll on small screens */}
            <div className="overflow-x-auto -mx-4 px-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-(--border-color) text-left text-xs uppercase tracking-wide text-(--text-secondary)">
                    <th className="py-2 pr-4 font-medium">Email</th>
                    <th className="py-2 pr-4 font-medium">Name</th>
                    <th className="py-2 pr-4 font-medium">Phone</th>
                    <th className="py-2 pr-4 font-medium">Created</th>
                    <th className="py-2 pr-4 font-medium">Email Verified</th>
                    <th className="py-2 pr-4 font-medium">KYC</th>
                    <th className="py-2 pr-4 font-medium text-right">
                      Balance
                    </th>
                    <th className="py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {group.accounts.map((a) => (
                    <tr
                      key={a.id}
                      className="border-b border-(--border-color) last:border-0 hover:bg-(--bg-secondary)/50 transition-colors"
                    >
                      <td className="py-3 pr-4">
                        <span className="font-mono text-xs text-(--text-primary)">
                          {a.email || "—"}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-(--text-primary)">
                        {a.full_name || "—"}
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs text-(--text-secondary)">
                        {a.phone || "—"}
                      </td>
                      <td className="py-3 pr-4 text-xs text-(--text-secondary)">
                        {new Date(a.created_at).toLocaleDateString("en-NG", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 pr-4">
                        {a.email_verified ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-(--color-lemon-green)">
                            <ShieldCheck className="w-3.5 h-3.5" /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-(--color-accent-yellow)">
                            <ShieldAlert className="w-3.5 h-3.5" /> Unverified
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-xs">
                        {a.bvn_verification === "verified" ||
                        a.bvn_verification === "approved" ? (
                          <span className="inline-flex items-center gap-1 text-(--color-lemon-green)">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            {a.bvn_verification}
                          </span>
                        ) : a.bvn_verification === "pending" ? (
                          <span className="text-(--color-accent-yellow)">
                            pending
                          </span>
                        ) : a.bvn_verification === "rejected" ? (
                          <span className="text-red-500">rejected</span>
                        ) : (
                          <span className="text-(--text-secondary)">
                            {a.bvn_verification || "not submitted"}
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs text-right text-(--text-primary)">
                        ₦{Number(a.wallet_balance || 0).toLocaleString()}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/admin/users?search=${encodeURIComponent(
                              a.email || a.id,
                            )}`}
                            className="p-1.5 rounded-md hover:bg-(--bg-secondary) transition-colors"
                            title="Open in Users"
                          >
                            <ExternalLink className="w-4 h-4 text-(--text-secondary)" />
                          </Link>
                          {!a.email_verified && (
                            <button
                              onClick={() => sendVerification(a.id, a.email)}
                              disabled={sendingId === a.id}
                              className="p-1.5 rounded-md
                                hover:bg-(--color-accent-yellow)/15
                                transition-colors
                                disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Send verification email"
                            >
                              <MailPlus className="w-4 h-4 text-(--color-accent-yellow)" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}