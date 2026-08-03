// lib/bank78/auth.js
import bank78Client from "./client";

export async function getBank78Token() {
  return bank78Client.getAccessToken();
}

export function clearBank78Token() {
  bank78Client.accessToken = null;
  bank78Client.tokenExpiry = null;
}

export function getBank78TokenStatus() {
  return {
    hasToken: !!bank78Client.accessToken,
    isExpired: bank78Client.tokenExpiry
      ? Date.now() >= bank78Client.tokenExpiry
      : true,
    expiresAt: bank78Client.tokenExpiry
      ? new Date(bank78Client.tokenExpiry).toISOString()
      : null,
    timeToExpiry: bank78Client.tokenExpiry
      ? Math.max(0, (bank78Client.tokenExpiry - Date.now()) / 1000)
      : 0,
  };
}

export async function refreshBank78Token() {
  clearBank78Token();
  return bank78Client.getAccessToken();
}
