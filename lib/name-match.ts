// lib/name-match.ts
// ─────────────────────────────────────────────────────────────
// Token-set name comparison for ID vs signup name reconciliation.
// ─────────────────────────────────────────────────────────────

const TITLES = new Set([
  "MR", "MRS", "MISS", "MS", "DR", "PROF", "CHIEF",
  "ALHAJI", "ALHAJA", "ENGR", "PASTOR", "REV", "SIR",
]);

const SUFFIXES = new Set(["JR", "SR", "II", "III", "IV"]);

const CORPORATE_SUFFIXES = new Set([
  "LTD", "LIMITED", "PLC", "ENTERPRISES", "ENTERPRISE",
  "NIG", "NIGERIA", "INTEGRATED", "AND", "&", "SONS",
]);

function normalizeTokens(name: string, stripCorporate = false): string[] {
  if (!name) return [];

  const cleaned = name
    .toUpperCase()
    .replace(/[.,'"\-()&]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const raw = cleaned.split(" ").filter(Boolean);
  const stripSet = stripCorporate
    ? new Set([...TITLES, ...SUFFIXES, ...CORPORATE_SUFFIXES])
    : new Set([...TITLES, ...SUFFIXES]);

  return raw.filter((t) => !stripSet.has(t) && t.length > 0);
}

export interface NameMatchResult {
  matched: boolean;
  score: number;
  signupTokens: string[];
  idTokens: string[];
  overlap: string[];
}

/**
 * Compare two names using token-set matching.
 *
 * score = |intersection| / max(|signupTokens|, |idTokens|)
 *
 * A score of 0.6 or higher is considered a match. This tolerates
 * name reordering ("Ibrahim Lawal" vs "Lawal Ibrahim") and missing
 * middle names, which are extremely common in Nigerian IDs.
 */
export function compareNames(
  signupName: string,
  idName: string,
  options: { stripCorporate?: boolean; threshold?: number } = {}
): NameMatchResult {
  const { stripCorporate = false, threshold = 0.6 } = options;

  const signupTokens = normalizeTokens(signupName, stripCorporate);
  const idTokens = normalizeTokens(idName, stripCorporate);

  if (signupTokens.length === 0 || idTokens.length === 0) {
    return {
      matched: false,
      score: 0,
      signupTokens,
      idTokens,
      overlap: [],
    };
  }

  const idSet = new Set(idTokens);
  const overlap = signupTokens.filter((t) => idSet.has(t));
  const denom = Math.max(signupTokens.length, idTokens.length);
  const score = overlap.length / denom;

  return {
    matched: score >= threshold,
    score,
    signupTokens,
    idTokens,
    overlap,
  };
}

/** Build the display name from Prembly's firstName / middleName / lastName */
export function buildIdVerifiedName(
  firstName?: string | null,
  middleName?: string | null,
  lastName?: string | null
): string {
  return [firstName, middleName, lastName]
    .filter((p) => typeof p === "string" && p.trim().length > 0)
    .map((p) => p!.trim().toUpperCase())
    .join(" ")
    .trim();
}