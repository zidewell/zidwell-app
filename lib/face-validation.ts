// lib/face-validation.ts
// ─────────────────────────────────────────────────────────────
// Client image validation before calling Prembly (cost protection).
// ─────────────────────────────────────────────────────────────

const MAX_IMAGE_SIZE_BYTES = 500 * 1024; // 500KB
const MIN_IMAGE_SIZE_BYTES = 5 * 1024;   // 5KB (blank guard)
const VALID_PREFIX = /^data:image\/(jpeg|jpg|png);base64,/i;

export interface ImageValidationResult {
  ok: boolean;
  error?: string;
}

export function validateBase64Image(dataUrl: string): ImageValidationResult {
  if (!dataUrl || typeof dataUrl !== "string") {
    return { ok: false, error: "Image is required" };
  }

  if (!VALID_PREFIX.test(dataUrl)) {
    return {
      ok: false,
      error: "Image must be a JPEG or PNG in base64 format",
    };
  }

  // Strip prefix and decode
  const base64 = dataUrl.replace(VALID_PREFIX, "");
  let byteLength = 0;
  try {
    byteLength = Buffer.from(base64, "base64").length;
  } catch {
    return { ok: false, error: "Image data is malformed" };
  }

  if (byteLength < MIN_IMAGE_SIZE_BYTES) {
    return {
      ok: false,
      error: "Image looks blank or corrupted. Please retake the selfie.",
    };
  }

  if (byteLength > MAX_IMAGE_SIZE_BYTES) {
    return {
      ok: false,
      error: "Image is too large. Please retake the selfie.",
    };
  }

  return { ok: true };
}