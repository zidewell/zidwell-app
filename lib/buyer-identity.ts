// lib/buyer-identity.ts
"use client";

export interface BuyerIdentity {
  name?: string;
  email?: string;
  phone?: string;
}

const COOKIE_MAX_AGE_DAYS = 400;

function cookieName(pageSlug: string, field: string) {
  return `zidwell_${field}_${pageSlug}`;
}

function setCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  const expires = new Date(
    Date.now() + COOKIE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000
  ).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(
      "(?:^|; )" +
        name.replace(/([.*+?^${}()|[\]\\])/g, "\\$1") +
        "=([^;]*)"
    )
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

/**
 * Save buyer identity to BOTH cookie and localStorage.
 * Cookie survives normal cache clearing; localStorage is a
 * secondary fallback for browsers that block cookies.
 */
export function saveBuyerIdentity(pageSlug: string, id: BuyerIdentity) {
  if (typeof window === "undefined") return;
  try {
    if (id.name) {
      setCookie(cookieName(pageSlug, "name"), id.name);
      localStorage.setItem(`zidwell_buyer_name_${pageSlug}`, id.name);
    }
    if (id.email) {
      setCookie(cookieName(pageSlug, "email"), id.email);
      localStorage.setItem(`zidwell_buyer_email_${pageSlug}`, id.email);
    }
    if (id.phone) {
      setCookie(cookieName(pageSlug, "phone"), id.phone);
      localStorage.setItem(`zidwell_buyer_phone_${pageSlug}`, id.phone);
    }
  } catch {
    // non-fatal
  }
}

/**
 * Read buyer identity, preferring cookie, then localStorage.
 */
export function loadBuyerIdentity(pageSlug: string): BuyerIdentity {
  if (typeof window === "undefined") return {};
  try {
    const name =
      getCookie(cookieName(pageSlug, "name")) ||
      localStorage.getItem(`zidwell_buyer_name_${pageSlug}`) ||
      undefined;
    const email =
      getCookie(cookieName(pageSlug, "email")) ||
      localStorage.getItem(`zidwell_buyer_email_${pageSlug}`) ||
      undefined;
    const phone =
      getCookie(cookieName(pageSlug, "phone")) ||
      localStorage.getItem(`zidwell_buyer_phone_${pageSlug}`) ||
      undefined;
    return {
      name: name || undefined,
      email: email || undefined,
      phone: phone || undefined,
    };
  } catch {
    return {};
  }
}

export function clearBuyerIdentity(pageSlug: string) {
  if (typeof window === "undefined") return;
  try {
    deleteCookie(cookieName(pageSlug, "name"));
    deleteCookie(cookieName(pageSlug, "email"));
    deleteCookie(cookieName(pageSlug, "phone"));
    localStorage.removeItem(`zidwell_buyer_name_${pageSlug}`);
    localStorage.removeItem(`zidwell_buyer_email_${pageSlug}`);
    localStorage.removeItem(`zidwell_buyer_phone_${pageSlug}`);
  } catch {
    // non-fatal
  }
}