// app/api/store/validate-name/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedWithRefresh } from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Reserved names ───
// Names that impersonate the platform or other high-trust entities.
// Case-insensitive match against the normalized name.
const RESERVED_NAMES = new Set([
  "zidwell",
  "zidwell inc",
  "zidwell ltd",
  "zidwell limited",
  "zidwell team",
  "zidwell support",
  "zidwell official",
  "zidwell admin",
  "admin",
  "administrator",
  "root",
  "system",
  "support",
  "official",
  "help",
  "helpdesk",
  "moderator",
  "staff",
  "team",
  "security",
  "billing",
  "payments",
  "zidwell pay",
  "zidwell payments",
  "zidwell store",
  "zidwell stores",
]);

// Substrings that indicate impersonation even inside a longer name
const RESERVED_SUBSTRINGS = [
  "zidwell",
  "official zidwell",
  "zidwell support",
  "zidwell team",
  "zidwell admin",
];

// Very short list of terms that shouldn't appear at all.
// Keep this small and only cover the clearest cases to avoid false positives.
const BLOCKED_TERMS = [
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "cunt",
  "porn",
  "scam",
  "fraud",
];

const MIN_LENGTH = 2;
const MAX_LENGTH = 60;

// ─── Normalize: lowercase, trim, collapse whitespace ───
function normalizeName(raw: string): string {
  return raw.toLowerCase().trim().replace(/\s+/g, " ");
}

// ─── Build a comparison key: strip everything except alphanumerics ───
// "Juice Hub" and "juicehub" become the same key → prevents
// trivially-similar duplicate names.
function comparisonKey(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export async function POST(req: NextRequest) {
  try {
    // ─── AUTH ───
    const { user, newTokens } = await isAuthenticatedWithRefresh(req);

    if (!user) {
      return NextResponse.json(
        { error: "Please login to validate store name", logout: true },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, storeId } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Store name is required" },
        { status: 400 }
      );
    }

    const trimmed = name.trim().replace(/\s+/g, " ");
    const normalized = normalizeName(trimmed);
    const key = comparisonKey(trimmed);

    // ─── LENGTH ───
    if (trimmed.length < MIN_LENGTH) {
      return NextResponse.json({
        valid: false,
        name: trimmed,
        isTaken: false,
        isReserved: false,
        isOwnStore: false,
        message: `Store name must be at least ${MIN_LENGTH} characters`,
      });
    }

    if (trimmed.length > MAX_LENGTH) {
      return NextResponse.json({
        valid: false,
        name: trimmed,
        isTaken: false,
        isReserved: false,
        isOwnStore: false,
        message: `Store name is too long. Maximum ${MAX_LENGTH} characters.`,
      });
    }

    // ─── FORMAT: no leading/trailing punctuation ───
    if (/^[^a-zA-Z0-9]/.test(trimmed) || /[^a-zA-Z0-9]$/.test(trimmed)) {
      return NextResponse.json({
        valid: false,
        name: trimmed,
        isTaken: false,
        isReserved: false,
        isOwnStore: false,
        message: "Store name must start and end with a letter or number.",
      });
    }

    // ─── RESERVED (exact) ───
    if (RESERVED_NAMES.has(normalized)) {
      return NextResponse.json({
        valid: false,
        name: trimmed,
        isTaken: true,
        isReserved: true,
        isOwnStore: false,
        message: `"${trimmed}" is reserved by Zidwell. Please choose a different name.`,
      });
    }

    // ─── RESERVED (substring / impersonation) ───
    for (const sub of RESERVED_SUBSTRINGS) {
      if (normalized.includes(sub)) {
        return NextResponse.json({
          valid: false,
          name: trimmed,
          isTaken: true,
          isReserved: true,
          isOwnStore: false,
          message:
            "Store name cannot reference Zidwell. Please choose a different name.",
        });
      }
    }

    // ─── BLOCKED TERMS ───
    for (const term of BLOCKED_TERMS) {
      if (normalized.includes(term)) {
        return NextResponse.json({
          valid: false,
          name: trimmed,
          isTaken: false,
          isReserved: false,
          isOwnStore: false,
          message: "Store name contains language that isn't allowed.",
        });
      }
    }

    // ─── UNIQUENESS ───
    // Two checks:
    //   1. Case-insensitive exact match on `name`
    //   2. Case/punctuation-stripped match — catches "Juice Hub" vs "juicehub"
    //
    // Supabase doesn't expose a direct "strip and compare" filter, so
    // we fetch a narrow window of candidate rows and compare in JS.
    // The window is bounded by ILIKE on the first meaningful chunk
    // of the input to keep the query cheap.
    const likeProbe = `%${trimmed.slice(0, 20).replace(/[%_]/g, "")}%`;

    let query = supabase
      .from("online_stores")
      .select("id, owner_id, name")
      .ilike("name", likeProbe)
      .limit(50);

    // Exclude the store being edited (if any)
    if (storeId) {
      query = query.neq("id", storeId);
    }

    const { data: candidates, error: fetchError } = await query;

    if (fetchError) {
      console.error("Error checking store name:", fetchError);
      return NextResponse.json(
        { error: "Failed to validate store name" },
        { status: 500 }
      );
    }

    const rows = candidates || [];

    // Exact normalized match
    const exactMatch = rows.find(
      (s) => normalizeName(s.name || "") === normalized
    );

    // Fuzzy match: same comparison key
    const fuzzyMatch = rows.find(
      (s) => comparisonKey(s.name || "") === key
    );

    const match = exactMatch || fuzzyMatch;

    if (match) {
      const isOwnStore = match.owner_id === user.id;

      if (isOwnStore) {
        return NextResponse.json({
          valid: true,
          name: trimmed,
          isTaken: false,
          isReserved: false,
          isOwnStore: true,
          message: "This is your current store name.",
        });
      }

      return NextResponse.json({
        valid: false,
        name: trimmed,
        isTaken: true,
        isReserved: false,
        isOwnStore: false,
        message:
          "This store name is already taken. Please choose a different one.",
      });
    }

    // ─── ALL GOOD ───
    return NextResponse.json({
      valid: true,
      name: trimmed,
      isTaken: false,
      isReserved: false,
      isOwnStore: false,
      message: "Store name is available",
    });
  } catch (error: any) {
    console.error("Store name validation error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}