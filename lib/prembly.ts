// lib/prembly.ts
const PREMBLY_BASE = "https://api.prembly.com";
const PREMBLY_BACKEND = "https://backend.prembly.com";

// ─────────────────────────────────────────────────────────────
// CAC Basic
// ─────────────────────────────────────────────────────────────

export interface CACBasicParams {
  rcNumber: string;
  companyName?: string;
  companyType?: "RC" | "BN" | "IT" | "LP" | "LLP";
}

export interface CACBasicResult {
  ok: boolean;
  data?: any;
  verification?: { status: string; reference: string };
  error?: string;
  raw?: any;
}

export async function verifyCACBasic(
  params: CACBasicParams
): Promise<CACBasicResult> {
  const secretKey = process.env.PREMBLY_SECRET_KEY;

  if (!secretKey) {
    return { ok: false, error: "Prembly secret key not configured" };
  }

  const body = {
    rc_number: params.rcNumber,
    company_name: params.companyName || undefined,
    company_type: params.companyType || "RC",
  };

  try {
    const res = await fetch(`${PREMBLY_BASE}/verification/cac/basic`, {
      method: "POST",
      headers: {
        "x-api-key": secretKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const raw = await res.json();

    if (!res.ok) {
      return {
        ok: false,
        error: raw?.detail || raw?.message || "CAC verification failed",
        raw,
      };
    }

    const statusOk =
      raw?.status === true ||
      raw?.verification?.status === "VERIFIED" ||
      raw?.response_code === "00";

    if (!statusOk) {
      return {
        ok: false,
        error: raw?.detail || "CAC verification unsuccessful",
        raw,
      };
    }

    return {
      ok: true,
      data: raw?.data,
      verification: raw?.verification,
      raw,
    };
  } catch (err: any) {
    console.error("[PREMBLY] CAC Basic exception:", err.message);
    return { ok: false, error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────
// Session fetch
// ─────────────────────────────────────────────────────────────

export interface PremblySession {
  session_id: string;
  status: string;
  channel?: string;
  verification_data?: any;
  overall_result?: string;
  verification_steps?: any[];
  metadata?: Record<string, any>;
  [k: string]: any;
}

export interface PremblySessionResult {
  ok: boolean;
  session?: PremblySession;
  error?: string;
  raw?: any;
}

export async function getPremblySession(
  sessionId: string
): Promise<PremblySessionResult> {
  const secretKey = process.env.PREMBLY_SECRET_KEY;

  if (!secretKey) {
    return { ok: false, error: "Prembly secret key not configured" };
  }

  const candidates = [
    `${PREMBLY_BACKEND}/api/v1/checker-widget/sdk/sessions/${sessionId}/`,
    `${PREMBLY_BACKEND}/api/v1/checker-widget/sdk/sessions/${sessionId}`,
    `${PREMBLY_BACKEND}/api/v1/checker-widget/sdk/sessions/details/${sessionId}/`,
    `${PREMBLY_BACKEND}/api/v1/checker-widget/sdk/sessions/get/${sessionId}/`,
    `${PREMBLY_BACKEND}/api/v1/checker-widget/sdk/sessions/${sessionId}/details/`,
    `${PREMBLY_BACKEND}/api/v1/checker-widget/sdk/session/${sessionId}/`,
  ];

  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "x-api-key": secretKey,
        },
      });

      if (res.status === 404) continue;

      const data = await res.json();

      if (!res.ok || !data?.status) continue;

      const session = data?.data?.session || data?.data;
      if (session?.session_id || session?.id) {
        return { ok: true, session, raw: data };
      }
    } catch {
      // try next candidate
    }
  }

  return { ok: false, error: "Could not fetch session details" };
}

// ─────────────────────────────────────────────────────────────
// BVN / NIN extraction from any Prembly payload shape
// ─────────────────────────────────────────────────────────────

const PLACEHOLDER_BVN = "00000000000";

const VERIFIED_BVN_PATHS = [
  "verification_data.verification_response_data.data.bvn",
  "verification_data.data.bvn",
  "addon_results.data_verification_response.data.bvn",
  "data.bvn",
  "bvn",
];

const VERIFIED_NIN_PATHS = [
  "verification_data.verification_response_data.data.nin",
  "verification_data.data.nin",
  "addon_results.data_verification_response.data.nin",
  "data.nin",
  "nin",
];

const REQUEST_BVN_PATHS = [
  "metadata.sdk_verification_details.data.payload.number",
  "metadata.failure_reasons.bvn.request_data.number",
  "verification_steps.0.request_data.number",
];

const REQUEST_NIN_PATHS = [
  "metadata.sdk_verification_details.data.payload.number_nin",
  "metadata.failure_reasons.nin.request_data.number_nin",
  "verification_steps.0.request_data.number_nin",
];

const BVN_KEYS = [
  "bvn",
  "bvnNumber",
  "bvn_number",
  "verified_bvn",
  "Bvn",
  "BVN",
  "bvnValue",
  "bvn_value",
];

const NIN_KEYS = [
  "nin",
  "ninNumber",
  "nin_number",
  "verified_nin",
  "Nin",
  "NIN",
  "ninValue",
  "nin_value",
];

function getPath(obj: any, path: string): string | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  const parts = path.split(".");
  let cur: any = obj;
  for (const part of parts) {
    if (cur == null) return undefined;
    const idx = Number(part);
    if (!isNaN(idx) && Array.isArray(cur)) {
      cur = cur[idx];
    } else {
      cur = cur[part];
    }
  }
  return typeof cur === "string" && cur.length > 0 ? cur : undefined;
}

function cleanId(val?: string): string | undefined {
  if (!val) return undefined;
  const cleaned = String(val).replace(/\s+/g, "");
  if (/^\d{11}$/.test(cleaned) && cleaned !== PLACEHOLDER_BVN) {
    return cleaned;
  }
  return undefined;
}

function recursiveFind(
  obj: any,
  keys: string[],
  depth = 0
): string | undefined {
  if (!obj || typeof obj !== "object" || depth > 8) return undefined;

  for (const key of keys) {
    const val = obj[key];
    if (
      typeof val === "string" &&
      /^\d{11}$/.test(val) &&
      val !== PLACEHOLDER_BVN
    ) {
      return val;
    }
    if (typeof val === "number") {
      const s = String(val);
      if (/^\d{11}$/.test(s) && s !== PLACEHOLDER_BVN) return s;
    }
  }

  for (const val of Object.values(obj)) {
    if (val && typeof val === "object") {
      const found = recursiveFind(val, keys, depth + 1);
      if (found) return found;
    }
  }

  return undefined;
}

export function extractIdentityNumbers(payload: any): {
  bvn?: string;
  nin?: string;
} {
  if (!payload) return {};

  // ─── BVN ───
  let bvn: string | undefined;

  for (const path of VERIFIED_BVN_PATHS) {
    bvn = cleanId(getPath(payload, path));
    if (bvn) break;
  }

  if (!bvn) {
    for (const path of REQUEST_BVN_PATHS) {
      bvn = cleanId(getPath(payload, path));
      if (bvn) break;
    }
  }

  if (!bvn) {
    bvn = cleanId(recursiveFind(payload, BVN_KEYS));
  }

  // ─── NIN ───
  let nin: string | undefined;

  for (const path of VERIFIED_NIN_PATHS) {
    nin = cleanId(getPath(payload, path));
    if (nin) break;
  }

  if (!nin) {
    for (const path of REQUEST_NIN_PATHS) {
      nin = cleanId(getPath(payload, path));
      if (nin) break;
    }
  }

  if (!nin) {
    nin = cleanId(recursiveFind(payload, NIN_KEYS));
  }

  console.log("[extractIdentityNumbers] Result:", {
    bvn: bvn || "(not found)",
    nin: nin || "(not found)",
  });

  return { bvn, nin };
}