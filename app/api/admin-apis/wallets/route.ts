// app/api/admin-apis/wallets/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createClient } from "@supabase/supabase-js";
import { createAuditLog, getClientInfo } from "@/lib/audit-log";
import { getNombaToken } from "@/lib/nomba";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─────────────────────────────────────────────
// Cache
// ─────────────────────────────────────────────
const CACHE_TTL = 60 * 1000; // 1 minute
const cache = new Map<string, { data: any; timestamp: number }>();

// Nomba cache — separate, longer TTL
let _cachedNomba = { ts: 0, value: 0 };
const NOMBA_CACHE_TTL = 60 * 1000; // 1 minute

function generateCacheKey(searchParams: URLSearchParams): string {
  return `wallets:${searchParams.toString()}`;
}

function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_TTL;
}

// ─────────────────────────────────────────────
// Robust full-name resolver
// Always returns a non-empty string if ANY name field exists.
// ─────────────────────────────────────────────
function resolveFullName(user: {
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  name?: string | null;
  email?: string | null;
}): string {
  const direct = (user.full_name ?? "").trim();
  if (direct && direct !== "—") return direct;

  const first = (user.first_name ?? "").trim();
  const last = (user.last_name ?? "").trim();
  const combined = [first, last].filter(Boolean).join(" ").trim();
  if (combined) return combined;

  const fallback = (user.name ?? "").trim();
  if (fallback) return fallback;

  const email = (user.email ?? "").trim();
  if (email && email.includes("@")) {
    const local = email.split("@")[0];
    const cleaned = local.replace(/[._-]+/g, " ").trim();
    if (cleaned) return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return "—";
}

// ─── Tri-state boolean (preserves null/undefined) ───
function toBoolOrNull(v: any): boolean | null {
  if (v === true) return true;
  if (v === false) return false;
  return null;
}

function computeStatus(
  user: any
): "active" | "frozen" | "blocked" | "unknown" {
  const frozen = toBoolOrNull(user.wallet_frozen);
  const blocked = toBoolOrNull(user.is_blocked);

  if (frozen === null && blocked === null) return "unknown";
  if (blocked === true) return "blocked";
  if (frozen === true) return "frozen";
  return "active";
}

// ─────────────────────────────────────────────
// Nomba balance — cached
// ─────────────────────────────────────────────
async function fetchNombaBalance(): Promise<number> {
  try {
    const now = Date.now();
    if (now - _cachedNomba.ts < NOMBA_CACHE_TTL) {
      return _cachedNomba.value;
    }

    const token = await getNombaToken();
    if (!token) {
      console.error("[Nomba] No token available");
      return _cachedNomba.value || 0;
    }

    const accountId = process.env.NOMBA_ACCOUNT_ID;
    if (!accountId) {
      console.error("[Nomba] No account ID configured");
      return _cachedNomba.value || 0;
    }

    const url = `${process.env.NOMBA_URL ?? "https://api.nomba.com"}/v1/accounts/balance`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        accountId,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      console.error(`[Nomba] Error ${res.status}: ${await res.text()}`);
      return _cachedNomba.value || 0;
    }

    const data = await res.json();
    let amount = 0;
    if (data?.data?.amount !== undefined) amount = Number(data.data.amount);
    else if (data?.amount !== undefined) amount = Number(data.amount);
    else if (data?.balance !== undefined) amount = Number(data.balance);
    else if (data?.available_balance !== undefined)
      amount = Number(data.available_balance);
    else if (data?.data?.balance !== undefined)
      amount = Number(data.data.balance);

    _cachedNomba = { ts: now, value: amount };
    return amount;
  } catch (err) {
    console.error("[Nomba] Error fetching balance:", err);
    return _cachedNomba.value || 0;
  }
}

// ─────────────────────────────────────────────
// Build a balance lookup from wallets table (if it exists)
// Falls back to users.wallet_balance per row.
// ─────────────────────────────────────────────
async function getWalletBalanceMap(): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  try {
    const { data, error } = await supabase
      .from("wallets")
      .select("user_id, balance");

    if (!error && Array.isArray(data)) {
      data.forEach((w: any) => {
        if (w?.user_id) {
          map.set(w.user_id, Number(w.balance) || 0);
        }
      });
    }
  } catch {
    // wallets table doesn't exist — map stays empty
  }
  return map;
}

// ─────────────────────────────────────────────
// GET — list wallets
// ─────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const adminUser = await requireAdmin(request);
    if (adminUser instanceof NextResponse) return adminUser;

    const allowedRoles = ["super_admin", "operations_admin", "finance_admin"];
    if (!allowedRoles.includes(adminUser?.admin_role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const cacheKey = generateCacheKey(searchParams);

    const cached = cache.get(cacheKey);
    if (cached && isCacheValid(cached.timestamp)) {
      return NextResponse.json(cached.data);
    }

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const balanceFilter = searchParams.get("balance") || "all";
    const range = searchParams.get("range") || "total";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const includeStats = searchParams.get("includeStats") === "true";

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // ─── Fetch balances map once ────────────────
    const balanceMap = await getWalletBalanceMap();

    // ─── Base query ─────────────────────────────
    let query = supabase
      .from("users")
      .select(
        `
        id,
        email,
        first_name,
        last_name,
        wallet_balance,
        zidcoin_balance,
        wallet_frozen,
        wallet_freeze_reason,
        wallet_frozen_at,
        is_blocked,
        block_reason,
        blocked_at,
        bank_account_name,
        bank_account_number,
        created_at,
        updated_at
      `,
        { count: "exact" }
      );

    // ─── Search ─────────────────────────────────
    if (search) {
      query = query.or(
        `email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`
      );
    }

    // ─── Range filter ───────────────────────────
    if (range !== "total" && !startDate) {
      const now = new Date();
      const startDateFilter = new Date();

      switch (range) {
        case "today":
          startDateFilter.setHours(0, 0, 0, 0);
          break;
        case "week":
          startDateFilter.setDate(now.getDate() - 7);
          break;
        case "month":
          startDateFilter.setMonth(now.getMonth() - 1);
          break;
        case "year":
          startDateFilter.setFullYear(now.getFullYear() - 1);
          break;
      }

      query = query.gte("created_at", startDateFilter.toISOString());
    }

    if (startDate) {
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : new Date();
      end.setHours(23, 59, 59, 999);

      query = query
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());
    }

    // ─── Execute ────────────────────────────────
    const {
      data: users,
      error,
      count,
    } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    // ─── Format rows ────────────────────────────
    let formattedWallets =
      users?.map((user: any) => {
        const fullName = resolveFullName(user);
        const status = computeStatus(user);

        // Prefer wallets.balance, fall back to users.wallet_balance
        const rawBalance =
          balanceMap.get(user.id) ?? Number(user.wallet_balance ?? 0);

        return {
          id: user.id,
          user_id: user.id,
          full_name: fullName,
          first_name: user.first_name ?? null,
          last_name: user.last_name ?? null,
          email: user.email,
          user_email: user.email,
          wallet_balance: rawBalance,
          balance: rawBalance,
          zidcoin_balance: Number(user.zidcoin_balance) || 0,
          status,
          wallet_frozen: toBoolOrNull(user.wallet_frozen),
          wallet_freeze_reason: user.wallet_freeze_reason ?? null,
          wallet_frozen_at: user.wallet_frozen_at ?? null,
          is_blocked: toBoolOrNull(user.is_blocked),
          block_reason: user.block_reason ?? null,
          blocked_at: user.blocked_at ?? null,
          bank_account_name: user.bank_account_name ?? null,
          bank_account_number: user.bank_account_number ?? null,
          last_updated: user.updated_at ?? user.created_at,
          updated_at: user.updated_at ?? user.created_at,
          created_at: user.created_at,
        };
      }) || [];

    // ─── Apply balance filter client-side ───────
    if (balanceFilter !== "all") {
      formattedWallets = formattedWallets.filter((w: any) => {
        const b = w.wallet_balance;
        switch (balanceFilter) {
          case "high":
            return b >= 10000;
          case "medium":
            return b >= 1000 && b < 10000;
          case "low":
            return b > 0 && b < 1000;
          case "zero":
            return b === 0;
          default:
            return true;
        }
      });
    }

    // ─── Stats ──────────────────────────────────
    let stats: any = undefined;
    if (includeStats) {
      // Users sum — used for "totalBalance" and as fallback if wallets table empty
      const { data: allBalances } = await supabase
        .from("users")
        .select("wallet_balance");
      const usersSum = (allBalances || []).reduce(
        (s: number, u: any) => s + (Number(u.wallet_balance) || 0),
        0
      );

      // Prefer wallets table sum if non-zero
      let totalBalance = usersSum;
      try {
        const { data: walletRows } = await supabase
          .from("wallets")
          .select("balance");
        if (Array.isArray(walletRows) && walletRows.length > 0) {
          const walletsSum = walletRows.reduce(
            (s: number, w: any) => s + (Number(w.balance) || 0),
            0
          );
          if (walletsSum > 0) totalBalance = walletsSum;
        }
      } catch {
        // ignore
      }

      // Status counts — computed across the entire user base, not just the page
      const [
        { count: totalCount },
        { count: activeCount },
        { count: frozenCount },
        { count: blockedCount },
      ] = await Promise.all([
        supabase
          .from("users")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("users")
          .select("id", { count: "exact", head: true })
          .eq("wallet_frozen", false)
          .eq("is_blocked", false),
        supabase
          .from("users")
          .select("id", { count: "exact", head: true })
          .eq("wallet_frozen", true),
        supabase
          .from("users")
          .select("id", { count: "exact", head: true })
          .eq("is_blocked", true),
      ]);

      // Nomba balance (cached)
      const nombaBalance = await fetchNombaBalance();

      stats = {
        total: totalCount ?? count ?? 0,
        active: activeCount ?? 0,
        frozen: frozenCount ?? 0,
        blocked: blockedCount ?? 0,
        totalBalance,
        frozenBalance: 0,
        nombaBalance,
      };
    }

    const responseData = {
      wallets: formattedWallets,
      data: formattedWallets,
      total: count ?? 0,
      page,
      limit,
      perPage: limit,
      totalPages: Math.ceil((count ?? 0) / limit),
      ...(stats ? { stats } : {}),
    };

    cache.set(cacheKey, { data: responseData, timestamp: Date.now() });
    if (cache.size > 100) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey) cache.delete(oldestKey);
    }

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Wallet API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────
// POST — clear cache
// ─────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireAdmin(request);
    if (adminUser instanceof NextResponse) return adminUser;

    const allowedRoles = ["super_admin", "operations_admin", "finance_admin"];
    if (!allowedRoles.includes(adminUser?.admin_role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    cache.clear();
    _cachedNomba = { ts: 0, value: 0 };
    return NextResponse.json({ message: "Cache cleared successfully" });
  } catch (error: any) {
    console.error("Wallet cache clearance error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────
// PATCH — update wallet / bank details
// ─────────────────────────────────────────────
export async function PATCH(request: NextRequest) {
  try {
    const adminUser = await requireAdmin(request);
    if (adminUser instanceof NextResponse) return adminUser;

    const allowedRoles = ["super_admin", "finance_admin", "operations_admin"];
    if (!allowedRoles.includes(adminUser?.admin_role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const clientInfo = getClientInfo(request.headers);

    const {
      userId,
      wallet_balance,
      bank_account_name,
      bank_account_number,
      notes,
    } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // ─── Fetch current state ────────────────────
    const { data: currentUser, error: fetchError } = await supabase
      .from("users")
      .select(
        "id, email, first_name, last_name, wallet_balance, bank_account_name, bank_account_number"
      )
      .eq("id", userId)
      .single();

    if (fetchError || !currentUser) {
      await createAuditLog({
        userId: adminUser?.id,
        userEmail: adminUser?.email,
        action: "wallet_update_failed",
        resourceType: "Wallet",
        resourceId: userId,
        description: `Failed to update wallet for user ${userId}: User not found`,
        metadata: {
          userId,
          attemptedUpdates: {
            wallet_balance,
            bank_account_name,
            bank_account_number,
          },
          error: fetchError?.message ?? "User not found",
          attemptedBy: adminUser?.email,
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
      });

      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ─── Prepare update data ────────────────────
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (wallet_balance !== undefined)
      updateData.wallet_balance = wallet_balance;
    if (bank_account_name !== undefined)
      updateData.bank_account_name = bank_account_name;
    if (bank_account_number !== undefined)
      updateData.bank_account_number = bank_account_number;

    const { data: updatedUser, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      await createAuditLog({
        userId: adminUser?.id,
        userEmail: adminUser?.email,
        action: "wallet_update_failed",
        resourceType: "Wallet",
        resourceId: userId,
        description: `Failed to update wallet for user ${currentUser.email}: ${error.message}`,
        metadata: {
          userId,
          userEmail: currentUser.email,
          attemptedUpdates: updateData,
          previousValues: {
            wallet_balance: currentUser.wallet_balance,
            bank_account_name: currentUser.bank_account_name,
            bank_account_number: currentUser.bank_account_number,
          },
          error: error.message,
          attemptedBy: adminUser?.email,
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
      });

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // ─── Audit: successful update ───────────────
    const changedFields = Object.keys(updateData).filter(
      (key) => key !== "updated_at"
    );

    await createAuditLog({
      userId: adminUser?.id,
      userEmail: adminUser?.email,
      action: "update_wallet",
      resourceType: "Wallet",
      resourceId: userId,
      description: `Updated wallet for user ${currentUser.email}: ${changedFields.join(
        ", "
      )}`,
      metadata: {
        userId,
        userEmail: currentUser.email,
        userName: resolveFullName(currentUser),
        changedFields,
        previousValues: {
          wallet_balance: currentUser.wallet_balance,
          bank_account_name: currentUser.bank_account_name,
          bank_account_number: currentUser.bank_account_number,
        },
        newValues: {
          wallet_balance: updatedUser.wallet_balance,
          bank_account_name: updatedUser.bank_account_name,
          bank_account_number: updatedUser.bank_account_number,
        },
        adminNotes: notes,
        updatedBy: adminUser?.email,
      },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
    });

    // ─── Audit: balance adjustment ──────────────
    if (
      wallet_balance !== undefined &&
      wallet_balance !== currentUser.wallet_balance
    ) {
      const balanceChange =
        wallet_balance - (currentUser.wallet_balance || 0);

      await createAuditLog({
        userId: adminUser?.id,
        userEmail: adminUser?.email,
        action:
          balanceChange > 0
            ? "wallet_balance_increase"
            : "wallet_balance_decrease",
        resourceType: "Wallet",
        resourceId: userId,
        description: `Adjusted wallet balance for ${currentUser.email}: ${
          currentUser.wallet_balance || 0
        } → ${wallet_balance} (${balanceChange > 0 ? "+" : ""}${balanceChange})`,
        metadata: {
          userId,
          userEmail: currentUser.email,
          previousBalance: currentUser.wallet_balance || 0,
          newBalance: wallet_balance,
          balanceChange,
          adjustmentType: balanceChange > 0 ? "credit" : "debit",
          adminNotes: notes,
          adjustedBy: adminUser?.email,
          adjustmentTime: new Date().toISOString(),
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
      });
    }

    // ─── Audit: bank details update ─────────────
    if (
      (bank_account_name !== undefined &&
        bank_account_name !== currentUser.bank_account_name) ||
      (bank_account_number !== undefined &&
        bank_account_number !== currentUser.bank_account_number)
    ) {
      await createAuditLog({
        userId: adminUser?.id,
        userEmail: adminUser?.email,
        action: "update_bank_details",
        resourceType: "Wallet",
        resourceId: userId,
        description: `Updated bank details for ${currentUser.email}`,
        metadata: {
          userId,
          userEmail: currentUser.email,
          previousBankDetails: {
            account_name: currentUser.bank_account_name,
            account_number: currentUser.bank_account_number,
          },
          newBankDetails: {
            account_name: updatedUser.bank_account_name,
            account_number: updatedUser.bank_account_number,
          },
          updatedBy: adminUser?.email,
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
      });
    }

    cache.clear();
    _cachedNomba = { ts: 0, value: 0 };

    return NextResponse.json({
      user: updatedUser,
      message: "Wallet updated successfully",
    });
  } catch (error: any) {
    console.error("Wallet PATCH error:", error);

    try {
      const adminUser = await requireAdmin(request);
      if (!(adminUser instanceof NextResponse)) {
        const clientInfo = getClientInfo(request.headers);
        await createAuditLog({
          userId: adminUser?.id,
          userEmail: adminUser?.email,
          action: "wallet_update_error",
          resourceType: "Wallet",
          description: `Unexpected error during wallet update: ${error.message}`,
          metadata: { error: error.message, stack: error.stack },
          ipAddress: clientInfo.ipAddress,
          userAgent: clientInfo.userAgent,
        });
      }
    } catch {
      // swallow — don't mask the original error
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}