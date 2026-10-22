// lib/prembly.ts
const PREMBLY_BASE = "https://api.prembly.com";

const debug = (label: string, data?: any) => {
  if (process.env.NODE_ENV !== "production") {
    console.log(`[PREMBLY] ${label}`, data ?? "");
  }
};

// ─────────────────────────────────────────────────────────────
// CAC Basic verification (unchanged)
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

  debug("CAC Basic request", body);

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
    debug("CAC Basic response", raw);

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

    return { ok: true, data: raw?.data, verification: raw?.verification, raw };
  } catch (err: any) {
    console.error("[PREMBLY] CAC Basic exception:", err.message);
    return { ok: false, error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────
// BVN with Face Verification
// ─────────────────────────────────────────────────────────────

export interface FaceVerificationParams {
  number: string;      // 11-digit BVN or NIN
  imageBase64: string; // data:image/jpeg;base64,...
}

export interface FaceVerificationResult {
  ok: boolean;
  faceMatched?: boolean;
  faceConfidence?: number;
  faceMessage?: string;
  verifiedName?: string;
  reference?: string;
  data?: any;
  error?: string;
  raw?: any;
}

function normalizeFaceResponse(
  raw: any
): { ok: boolean; faceMatched: boolean; confidence: number; name?: string; reference?: string; error?: string } {
  if (!raw) {
    return { ok: false, faceMatched: false, confidence: 0, error: "Empty response" };
  }

  if (raw.status !== true) {
    return {
      ok: false,
      faceMatched: false,
      confidence: 0,
      error: raw.detail || raw.message || "Verification failed",
    };
  }

  const data = raw.data || {};
  const face = data.face_data || {};
  const verification = raw.verification || {};

  const faceMatched =
    face.status === true && typeof face.confidence === "number";
  const confidence =
    typeof face.confidence === "number" ? face.confidence : 0;

  const name = [data.firstName, data.middleName, data.lastName]
    .filter((p: any) => typeof p === "string" && p.trim().length > 0)
    .map((p: string) => p.trim().toUpperCase())
    .join(" ");

  return {
    ok: verification.status === "VERIFIED",
    faceMatched,
    confidence,
    name: name || undefined,
    reference: verification.reference,
    error: face.message || undefined,
  };
}

async function callFaceEndpoint(
  path: string,
  params: FaceVerificationParams
): Promise<FaceVerificationResult> {
  const secretKey = process.env.PREMBLY_SECRET_KEY;
  if (!secretKey) {
    return { ok: false, error: "Prembly secret key not configured" };
  }

  debug(`${path} request`, {
    numberPrefix: params.number.slice(0, 3) + "****",
    imageLength: params.imageBase64.length,
  });

  try {
    const res = await fetch(`${PREMBLY_BASE}${path}`, {
      method: "POST",
      headers: {
        "x-api-key": secretKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        number: params.number,
        image: params.imageBase64,
      }),
    });

    const raw = await res.json();
    debug(`${path} response`, raw);

    if (!res.ok) {
      return {
        ok: false,
        error: raw?.detail || raw?.message || "Verification failed",
        raw,
      };
    }

    const normalized = normalizeFaceResponse(raw);

    return {
      ok: normalized.ok,
      faceMatched: normalized.faceMatched,
      faceConfidence: normalized.confidence,
      faceMessage: normalized.error,
      verifiedName: normalized.name,
      reference: normalized.reference,
      data: raw?.data,
      raw,
      error: normalized.ok ? undefined : normalized.error,
    };
  } catch (err: any) {
    console.error(`[PREMBLY] ${path} exception:`, err.message);
    return { ok: false, error: err.message };
  }
}

export async function verifyBVNWithFace(
  params: FaceVerificationParams
): Promise<FaceVerificationResult> {
  return callFaceEndpoint("/verification/bvn_w_face", params);
}

export async function verifyNINWithFace(
  params: FaceVerificationParams
): Promise<FaceVerificationResult> {
  return callFaceEndpoint("/verification/nin_w_face", params);
}