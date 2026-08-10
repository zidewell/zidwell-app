// lib/security.ts
import { NextRequest } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";

export interface GeoLocation {
  country?: string;
  countryCode?: string;
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  language: string;
  screenResolution?: string;
  timezone: string;
  fingerprint?: string;
  vendor?: string;
  cores?: number;
}

export interface LoginSecurityContext {
  ip: string;
  location: GeoLocation;
  device: DeviceInfo;
  timestamp: Date;
  isKnownDevice: boolean;
  riskScore: number;
  reasons: string[];
}

// ─── IP EXTRACTION ───

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const vercelForwarded = req.headers.get("x-vercel-forwarded-for");

  if (vercelForwarded) return vercelForwarded.split(",")[0].trim();
  if (forwarded) return forwarded.split(",")[0].trim();
  if (realIp) return realIp;

  const reqWithIp = req as any;
  if (reqWithIp.ip) return reqWithIp.ip;

  return "unknown";
}

// ─── GEOLOCATION ───

export async function getGeoLocation(ip: string): Promise<GeoLocation> {
  if (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.")
  ) {
    return { country: "Local", city: "Development", countryCode: "LOCAL" };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      signal: controller.signal,
      next: { revalidate: 3600 },
    });

    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      if (!data.error) {
        return {
          country: data.country_name,
          countryCode: data.country_code,
          city: data.city,
          region: data.region,
          latitude: data.latitude,
          longitude: data.longitude,
          timezone: data.timezone,
        };
      }
    }
  } catch (error) {
    console.error("Geo lookup failed:", error);
  }

  return { country: "Unknown", city: "Unknown" };
}

// ─── RATE LIMITING ───

interface RateLimitRecord {
  count: number;
  resetTime: number;
  emails: Set<string>;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

export function checkRateLimit(
  identifier: string,
  maxAttempts = 5,
  windowMs = 15 * 60 * 1000
): { allowed: boolean; remaining: number; resetTime: number; totalAttempts: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
      emails: new Set(),
    });
    return {
      allowed: true,
      remaining: maxAttempts - 1,
      resetTime: now + windowMs,
      totalAttempts: 1,
    };
  }

  if (record.count >= maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
      totalAttempts: record.count,
    };
  }

  record.count++;
  return {
    allowed: true,
    remaining: maxAttempts - record.count,
    resetTime: record.resetTime,
    totalAttempts: record.count,
  };
}

export function trackFailedAttempt(identifier: string, email: string): void {
  const record = rateLimitStore.get(identifier);
  if (record) {
    record.emails.add(email.toLowerCase());
  }
}

// ─── SUSPICIOUS LOGIN DETECTION ───
// BEST PRACTICE: Never block a correct-password login based on these heuristics.
// GeoIP is unreliable, people travel, and work odd hours. We log and alert, but we allow.

export async function analyzeLoginRisk(
  supabase: SupabaseClient<any, any, any>,
  userId: string,
  context: {
    location: GeoLocation;
    device: DeviceInfo;
    timestamp: Date;
    ip: string;
  }
): Promise<LoginSecurityContext> {
  const reasons: string[] = [];
  let riskScore = 0;

  const { data: history } = await supabase
    .from("login_history")
    .select("*")
    .eq("user_id", userId)
    .eq("is_successful", true)
    .order("login_time", { ascending: false })
    .limit(10);

  // First login ever — completely trusted
  if (!history || history.length === 0) {
    return {
      ip: context.ip,
      location: context.location,
      device: context.device,
      timestamp: context.timestamp,
      isKnownDevice: true,
      riskScore: 0,
      reasons: ["First login"],
    };
  }

  const { data: trustedDevices } = await supabase
    .from("trusted_devices")
    .select("*")
    .eq("user_id", userId);

  const isKnownDevice =
    trustedDevices?.some(
      (d: any) => d.device_fingerprint === context.device.fingerprint
    ) ?? false;

  if (history.length > 0) {
    const lastLogin = history[0];
    const lastTime = new Date(lastLogin.login_time);
    const timeDiff = context.timestamp.getTime() - lastTime.getTime();

    // Impossible travel: same account in two distant countries within 2 hours
    if (
      context.location.country &&
      lastLogin.country &&
      context.location.country !== lastLogin.country &&
      timeDiff < 2 * 60 * 60 * 1000
    ) {
      riskScore += 30; // was 40
      reasons.push(
        `Impossible travel: ${lastLogin.country} → ${context.location.country} in ${Math.round(timeDiff / 60000)}min`
      );
    }

    const knownCountries = new Set(
      history.map((h: any) => h.country).filter(Boolean)
    );
    if (
      context.location.country &&
      !knownCountries.has(context.location.country)
    ) {
      riskScore += 15; // was 25
      reasons.push(`New country detected: ${context.location.country}`);
    }

    const recentCities = new Set(
      history.slice(0, 5).map((h: any) => h.city).filter(Boolean)
    );
    if (context.location.city && !recentCities.has(context.location.city)) {
      riskScore += 5; // was 15
      reasons.push(`New city: ${context.location.city}`);
    }

    // REMOVED: "Unusual time" and "Late night" penalties.
    // These block shift workers, night owls, and international users.
    // GeoIP timezone data is also frequently wrong.
  }

  if (!isKnownDevice && context.device.fingerprint) {
    riskScore += 10; // was 20
    reasons.push("New device");
  }

  // Known Tor/VPN exit nodes
  if (context.ip.startsWith("185.220.") || context.ip.startsWith("45.9.")) {
    riskScore += 20; // was 30
    reasons.push("Suspicious IP range detected");
  }

  // HARD CAP: We never auto-block based on heuristics. Max 50 means even with
  // BLOCK_THRESHOLD = 75, a correct-password login will never be rejected.
  return {
    ip: context.ip,
    location: context.location,
    device: context.device,
    timestamp: context.timestamp,
    isKnownDevice,
    riskScore: Math.min(riskScore, 50),
    reasons,
  };
}

// ─── NOTIFICATION HELPERS ───

export function formatSecurityAlertEmail(
  userName: string,
  context: LoginSecurityContext,
  isBlocked: boolean
): { subject: string; html: string } {
  const time = context.timestamp.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const subject = isBlocked
    ? "🔒 Suspicious Login Blocked on Zidwell"
    : "⚠️ New Login Detected on Zidwell";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: ${isBlocked ? "#dc2626" : "#ca8a04"};">
        ${isBlocked ? "Login Attempt Blocked" : "New Login Detected"}
      </h2>
      <p>Hi ${userName},</p>
      <p>We detected a login to your Zidwell account with the following details:</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="background: #f3f4f6;">
          <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Time</strong></td>
          <td style="padding: 12px; border: 1px solid #e5e7eb;">${time}</td>
        </tr>
        <tr>
          <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Location</strong></td>
          <td style="padding: 12px; border: 1px solid #e5e7eb;">
            ${context.location.city || "Unknown"}, ${context.location.country || "Unknown"}
          </td>
        </tr>
        <tr style="background: #f3f4f6;">
          <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>IP Address</strong></td>
          <td style="padding: 12px; border: 1px solid #e5e7eb;">${context.ip}</td>
        </tr>
        <tr>
          <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Device</strong></td>
          <td style="padding: 12px; border: 1px solid #e5e7eb;">
            ${context.device.platform || "Unknown"} - ${context.device.userAgent?.slice(0, 50) || "Unknown"}...
          </td>
        </tr>
        <tr style="background: #f3f4f6;">
          <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Risk Score</strong></td>
          <td style="padding: 12px; border: 1px solid #e5e7eb;">
            <span style="color: ${context.riskScore > 30 ? "#dc2626" : "#ca8a04"};">
              ${context.riskScore}/100
            </span>
          </td>
        </tr>
      </table>

      ${context.reasons.length > 0 ? `
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0;">
          <strong>Flags:</strong>
          <ul style="margin: 8px 0;">
            ${context.reasons.map((r) => `<li>${r}</li>`).join("")}
          </ul>
        </div>
      ` : ""}

      ${isBlocked ? `
        <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0;">
          <strong>This login was blocked.</strong> If this was you, please contact support or try again from a trusted device/location.
        </div>
      ` : `
        <p>If this was you, no action is needed. If you don't recognize this activity, 
        <a href="#" style="color: #dc2626; font-weight: bold;">secure your account immediately</a>.</p>
      `}
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #6b7280; font-size: 12px;">
        Zidwell Security Team<br>
        This is an automated security alert. Please do not reply to this email.
      </p>
    </div>
  `;

  return { subject, html };
}

// ─── SESSION ID GENERATOR ───

export function generateSessionId(): string {
  return randomBytes(32).toString("hex");
}