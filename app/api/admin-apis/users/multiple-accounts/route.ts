// app/api/admin-apis/users/multiple-accounts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin-auth";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ── Normalizers ───────────────────────────────────────────────
function normPhone(raw: string | null | undefined): string {
  if (!raw) return "";
  const digits = String(raw).replace(/\D/g, "");
  let d = digits;
  if (d.startsWith("234")) d = d.slice(3);
  if (d.startsWith("0")) d = d.slice(1);
  return d;
}

function normEmail(raw: string | null | undefined): string {
  return (raw || "").trim().toLowerCase();
}

function normName(raw: string | null | undefined): string {
  return (raw || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array(b.length + 1).fill(0),
  );
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return dp[a.length][b.length];
}

interface UserRow {
  id: string;
  email: string | null;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
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
  matched_by: Array<"phone" | "email" | "name">;
  phone_normalized: string | null;
  emails: string[];
  names: string[];
  accounts: UserRow[];
}

export async function GET(req: NextRequest) {
  try {
    const adminUser = await requireAdmin(req);
    if (adminUser instanceof NextResponse) return adminUser;

    const allowedRoles = ["super_admin", "operations_admin", "support_admin"];
    if (!allowedRoles.includes(adminUser?.admin_role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const url = new URL(req.url);
    const search = (url.searchParams.get("search") || "").trim().toLowerCase();
    const onlyUnverified = url.searchParams.get("onlyUnverified") === "true";

    const { data: rows, error } = await supabaseAdmin
      .from("users")
      .select(
        "id, email, full_name, first_name, last_name, phone, created_at, email_verified, bvn_verification, wallet_balance, last_login, is_blocked",
      )
      .order("created_at", { ascending: true });

    if (error) throw error;

    const users: UserRow[] = (rows || []).map((u: any) => ({
      ...u,
      full_name:
        u.full_name ||
        [u.first_name, u.last_name].filter(Boolean).join(" ") ||
        null,
    }));

    // ── Union-Find ────────────────────────────────────────────
    const parent = new Map<string, string>();
    const find = (x: string): string => {
      if (!parent.has(x)) parent.set(x, x);
      let root = x;
      while (parent.get(root) !== root) root = parent.get(root)!;
      let cur = x;
      while (parent.get(cur) !== root) {
        const next = parent.get(cur)!;
        parent.set(cur, root);
        cur = next;
      }
      return root;
    };
    const union = (a: string, b: string) => {
      const ra = find(a);
      const rb = find(b);
      if (ra !== rb) parent.set(ra, rb);
    };

    const byPhone = new Map<string, string[]>();
    const byEmail = new Map<string, string[]>();
    const byName = new Map<string, string[]>();

    users.forEach((u) => {
      find(`user:${u.id}`);
      const p = normPhone(u.phone);
      if (p) byPhone.set(p, [...(byPhone.get(p) || []), u.id]);
      const e = normEmail(u.email);
      if (e) byEmail.set(e, [...(byEmail.get(e) || []), u.id]);
      const n = normName(u.full_name);
      if (n) byName.set(n, [...(byName.get(n) || []), u.id]);
    });

    for (const ids of byPhone.values())
      for (let i = 1; i < ids.length; i++)
        union(`user:${ids[0]}`, `user:${ids[i]}`);

    for (const ids of byEmail.values())
      for (let i = 1; i < ids.length; i++)
        union(`user:${ids[0]}`, `user:${ids[i]}`);

    for (const ids of byName.values())
      for (let i = 1; i < ids.length; i++)
        union(`user:${ids[0]}`, `user:${ids[i]}`);

    // Near-duplicate emails (local-part Levenshtein ≤ 2 on same domain)
    const emailList = Array.from(byEmail.keys());
    for (let i = 0; i < emailList.length; i++) {
      for (let j = i + 1; j < emailList.length; j++) {
        const a = emailList[i];
        const b = emailList[j];
        const [la, da] = a.split("@");
        const [lb, db] = b.split("@");
        if (!la || !lb || !da || da !== db) continue;
        if (Math.abs(la.length - lb.length) > 2) continue;
        if (levenshtein(la, lb) <= 2) {
          const idA = byEmail.get(a)![0];
          const idB = byEmail.get(b)![0];
          union(`user:${idA}`, `user:${idB}`);
        }
      }
    }

    // ── Build groups ──────────────────────────────────────────
    const groupsByRoot = new Map<string, UserRow[]>();
    for (const u of users) {
      const root = find(`user:${u.id}`);
      groupsByRoot.set(root, [...(groupsByRoot.get(root) || []), u]);
    }

    const groups: Group[] = [];
    for (const [root, members] of groupsByRoot.entries()) {
      if (members.length < 2) continue;
      if (onlyUnverified && members.every((m) => m.email_verified))
        continue;

      const matchedBy = new Set<"phone" | "email" | "name">();
      const phones = new Set<string>();
      const emails = new Set<string>();
      const names = new Set<string>();

      members.forEach((m) => {
        const p = normPhone(m.phone);
        if (p) phones.add(p);
        const e = normEmail(m.email);
        if (e) emails.add(e);
        const n = normName(m.full_name);
        if (n) names.add(n);
      });

      if (phones.size > 0 && phones.size < members.length)
        matchedBy.add("phone");
      if (emails.size > 0 && emails.size < members.length)
        matchedBy.add("email");
      if (names.size > 0 && names.size < members.length)
        matchedBy.add("name");
      // Even if all differ, they were merged by near-duplicate email
      if (matchedBy.size === 0) matchedBy.add("email");

      const group: Group = {
        group_key: root,
        matched_by: Array.from(matchedBy),
        phone_normalized: phones.size === 1 ? Array.from(phones)[0] : null,
        emails: Array.from(emails),
        names: Array.from(names),
        accounts: members.sort(
          (a, b) =>
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime(),
        ),
      };

      if (search) {
        const haystack = [
          ...group.emails,
          ...group.names,
          group.phone_normalized || "",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(search)) continue;
      }

      groups.push(group);
    }

    groups.sort((a, b) => b.accounts.length - a.accounts.length);

    const totalDuplicateAccounts = groups.reduce(
      (s, g) => s + g.accounts.length,
      0,
    );
    const unverifiedDupAccounts = groups.reduce(
      (s, g) =>
        s + g.accounts.filter((a) => a.email_verified === false).length,
      0,
    );

    return NextResponse.json({
      groups,
      stats: {
        totalGroups: groups.length,
        totalAccounts: totalDuplicateAccounts,
        unverifiedAccounts: unverifiedDupAccounts,
      },
    });
  } catch (err: any) {
    console.error("Multiple accounts error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to load duplicates" },
      { status: 500 },
    );
  }
}