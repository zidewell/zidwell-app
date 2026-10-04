// app/auth/login/page.tsx
"use client";

import Swal from "sweetalert2";
import {
  useState,
  FormEvent,
  useEffect,
  Suspense,
  useRef,
} from "react";
import Image from "next/image";
import Link from "next/link";
import logo from "@/public/logo.png";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import Cookies from "js-cookie";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { ArrowLeft, Eye, EyeOff, UserPlus, Wifi } from "lucide-react";
import { useUserContextData } from "@/app/context/userData";
import Carousel from "@/app/components/Carousel";
import { useRouter, useSearchParams } from "next/navigation";
import { sendLoginNotificationWithDeviceInfo } from "@/lib/login-notification";

// ─── Timing constants ───
// Slow networks (Nigeria → distant Supabase regions) can take 15–20s per
// round trip. Give the request plenty of headroom.
const LOGIN_TIMEOUT_MS = 60_000;
// Show a "still working" hint after this many ms.
const SLOW_HINT_AFTER_MS = 8_000;

interface DeviceInfo {
  userAgent: string;
  platform: string;
  language: string;
  timezone: string;
  screenResolution?: string;
  cores?: number;
  vendor?: string;
  fingerprint?: string;
}

function collectDeviceInfo(): DeviceInfo {
  const components = [
    navigator.userAgent,
    navigator.language,
    navigator.platform,
    screen.colorDepth,
    screen.width + "x" + screen.height,
    new Date().getTimezoneOffset(),
    !!window.sessionStorage,
    !!window.localStorage,
    navigator.hardwareConcurrency,
  ];

  let hash = 0;
  const str = components.join("::");
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    cores: navigator.hardwareConcurrency || undefined,
    vendor: navigator.vendor || undefined,
    fingerprint: hash.toString(16),
  };
}

const fixDoubleEncodedUrl = (url: string): string => {
  if (!url || url === "/dashboard") return "/dashboard";

  try {
    let decoded = url;
    let attempts = 0;
    const maxAttempts = 3;

    while (
      (decoded.includes("%") || decoded.includes("%25")) &&
      attempts < maxAttempts
    ) {
      const beforeDecode = decoded;
      decoded = decodeURIComponent(decoded);
      if (beforeDecode === decoded) break;
      attempts++;
    }

    decoded = decoded.replace(/^%2F/, "/").replace(/%2F/g, "/");

    if (decoded.startsWith("/") && !decoded.includes("//")) {
      return decoded;
    }
    return "/dashboard";
  } catch (error) {
    console.error("Failed to decode URL:", error);
    return "/dashboard";
  }
};

// ─────────────────────────────────────────────────────────────────────
// SAFE SWAL WRAPPER
// Under Turbopack + certain sweetalert2 builds, Swal.fire() can resolve
// to a non-promise value, which breaks `.then()` / `.catch()` chaining.
// This wrapper guarantees a real Promise is always returned.
// ─────────────────────────────────────────────────────────────────────
function safeSwalFire(options: any): Promise<any> {
  try {
    const result = (Swal as any).fire(options);
    if (result && typeof result.then === "function") {
      return result;
    }
    return Promise.resolve(result);
  } catch (err) {
    console.error("Swal.fire threw synchronously:", err);
    return Promise.resolve(undefined);
  }
}

// ─────────────────────────────────────────────────────────────────────
// Non-blocking toast helper
// ─────────────────────────────────────────────────────────────────────
function toast(
  icon: "success" | "warning" | "info" | "error",
  title: string,
  text?: string,
) {
  safeSwalFire({
    toast: true,
    position: "top-end",
    icon,
    title,
    text,
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });
}

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [slowHint, setSlowHint] = useState(false);
  const { setUserData } = useUserContextData();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const searchParams = useSearchParams();

  // ✅ Synchronous double-submit guard. `loading` state is async and can be
  //    defeated by a fast double-click; this ref cannot.
  const submittingRef = useRef(false);
  const slowHintTimerRef = useRef<NodeJS.Timeout | null>(null);

  const rawCallbackUrl = searchParams.get("callbackUrl");
  const callbackUrl = rawCallbackUrl
    ? fixDoubleEncodedUrl(rawCallbackUrl)
    : "/dashboard";
  const fromLogin = searchParams.get("fromLogin");
  const scrollToPricing = searchParams.get("scrollToPricing");

  useEffect(() => {
    const checkScreenSize = () => setIsMobile(window.innerWidth < 768);
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Clean up the slow-hint timer if the component unmounts mid-login.
  useEffect(() => {
    return () => {
      if (slowHintTimerRef.current) clearTimeout(slowHintTimerRef.current);
    };
  }, []);

  // ✅ Save user data (with store fields) to localStorage for optimistic UI
  const saveUserDataToLocalStorage = (profile: any) => {
    try {
      const userDataToSave = {
        ...profile,
        store: profile.store || null,
        hasStore: profile.hasStore || false,
        storeIsActive: profile.storeIsActive || false,
        storePendingActivation: profile.storePendingActivation || false,
      };
      localStorage.setItem("userData", JSON.stringify(userDataToSave));

      if (profile.store) {
        localStorage.setItem(
          "zidwell_store_data",
          JSON.stringify(profile.store),
        );
        localStorage.setItem("zidwell_store_timestamp", Date.now().toString());
        console.log("💾 Store data cached on login:", profile.store.slug);
      }
    } catch (error) {
      console.error("Failed to save user data to localStorage:", error);
    }
  };

  const handleResendVerification = async (emailToResend: string) => {
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToResend }),
      });

      const data = await response.json();

      if (response.ok) {
        await safeSwalFire({
          icon: "success",
          title: "Verification Email Sent!",
          text: "Please check your inbox and spam folder.",
          confirmButtonColor: "var(--color-accent-yellow)",
          confirmButtonText: "OK",
        });
      } else {
        throw new Error(data.error || "Failed to resend verification");
      }
    } catch (error: any) {
      await safeSwalFire({
        icon: "error",
        title: "Failed to Resend",
        text: error.message || "Please try again later.",
        confirmButtonColor: "var(--color-accent-yellow)",
        confirmButtonText: "OK",
      });
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // ✅ Synchronous double-submit guard
    if (submittingRef.current) return;
    if (loading) return;

    if (!email || !password) {
      setErrors({
        email: !email ? "Email is required" : "",
        password: !password ? "Password is required" : "",
      });
      return;
    }

    submittingRef.current = true;
    setLoading(true);
    setSlowHint(false);
    setErrors({});

    // ✅ Show the "still working…" hint if the request takes >8s.
    //    Essential on slow networks — a silent spinner feels broken.
    slowHintTimerRef.current = setTimeout(() => {
      setSlowHint(true);
    }, SLOW_HINT_AFTER_MS);

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      LOGIN_TIMEOUT_MS,
    );

    try {
      // ✅ Non-blocking modal. No `didOpen`/`showLoading` — those can get
      //    stuck if a later Swal.close() races the open.
      safeSwalFire({
        title: "Signing in…",
        text: "Verifying your credentials",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const deviceInfo = collectDeviceInfo();

      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, deviceInfo }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (slowHintTimerRef.current) {
        clearTimeout(slowHintTimerRef.current);
        slowHintTimerRef.current = null;
      }
      setSlowHint(false);

      // ─── Parse JSON safely (server might return HTML on a crash) ───
      let result: any = null;
      try {
        result = await res.json();
      } catch {
        result = {
          error:
            "The server returned an unexpected response. Please try again.",
        };
      }

      // ═══════════════════════════════════════════════════════════════════
      // ERROR BRANCHES
      // ═══════════════════════════════════════════════════════════════════

      // ─── 503 / 502 / 504 → Supabase or server unreachable ───
      if (res.status === 503 || res.status === 502 || res.status === 504) {
        Swal.close();
        await safeSwalFire({
          icon: "error",
          title: "Service Temporarily Unavailable",
          html: `
            <div class="text-left">
              <p>We couldn't reach the authentication service.</p>
              <p class="text-sm text-gray-600 mt-2">
                This is usually a temporary network issue.
                <strong>Your credentials have not been marked as failed.</strong>
              </p>
              <p class="text-sm text-gray-600 mt-2">
                Please wait a moment and try again.
              </p>
            </div>
          `,
          confirmButtonColor: "var(--color-accent-yellow)",
          confirmButtonText: "Try Again",
        });
        return;
      }

      if (!res.ok) {
        // ─── 429 → rate-limited ───
        if (res.status === 429) {
          Swal.close();
          const retryAfter = result?.retryAfter
            ? Math.ceil(result.retryAfter / 60)
            : 15;
          await safeSwalFire({
            icon: "warning",
            title: "Too Many Attempts",
            html: `
              <div class="text-left">
                <p>Too many failed login attempts.</p>
                <p class="text-sm text-gray-600 mt-2">
                  Please wait about <strong>${retryAfter} minute${
                    retryAfter === 1 ? "" : "s"
                  }</strong> before trying again.
                </p>
                <p class="text-sm text-gray-600 mt-2">
                  If you've forgotten your password, you can
                  <a href="/auth/password-reset" class="text-blue-600 underline">reset it here</a>.
                </p>
              </div>
            `,
            confirmButtonColor: "var(--color-accent-yellow)",
            confirmButtonText: "OK",
          });
          return;
        }

        // ─── 404 / user not found ───
        if (
          res.status === 404 ||
          result?.userNotFound ||
          result?.error?.toLowerCase().includes("not found")
        ) {
          Swal.close();
          const { value: action } = await safeSwalFire({
            icon: "info",
            title: "Account Not Found",
            html: `
              <div class="text-left">
                <p class="mb-2">We couldn't find an account with this email:</p>
                <p class="font-bold text-(--color-accent-yellow) text-lg break-all">${email}</p>
                <p class="mt-4 text-sm text-(--text-secondary)">
                  Would you like to create a new account?
                </p>
              </div>
            `,
            confirmButtonColor: "var(--color-accent-yellow)",
            confirmButtonText: "Create Account",
            showCancelButton: true,
            cancelButtonText: "Try Again",
            cancelButtonColor: "#6b7280",
            reverseButtons: true,
          });

          if (action) {
            router.push("/auth/signup");
          }
          return;
        }

        // ─── 403 / blocked account ───
        if (res.status === 403 && result?.blocked) {
          Swal.close();
          await safeSwalFire({
            icon: "error",
            title: "Account Blocked",
            html: `
              <div class="text-left">
                <p>${result.error || "Your account has been blocked."}</p>
                ${
                  result.blockedReason
                    ? `<p class="text-sm text-gray-600 mt-2"><strong>Reason:</strong> ${result.blockedReason}</p>`
                    : ""
                }
                <p class="text-sm text-gray-600 mt-3">
                  Please contact support if you believe this is a mistake.
                </p>
              </div>
            `,
            confirmButtonColor: "var(--color-accent-yellow)",
            confirmButtonText: "I Understand",
          });
          return;
        }

        // ─── 403 / email not verified ───
        if (res.status === 403 && result?.requiresVerification) {
          Swal.close();
          const { value: action } = await safeSwalFire({
            icon: "warning",
            title: "Email Not Verified",
            html: `
              <div class="text-left">
                <p class="mb-2">Please verify your email address before logging in.</p>
                <p class="text-sm text-(--text-secondary) mb-2">
                  We sent a verification link to:
                  <strong class="text-(--color-accent-yellow) break-all">${email}</strong>
                </p>
                <div class="mt-3 p-3 bg-blue-50 rounded-lg text-sm">
                  <p class="text-blue-700">💡 Didn't receive the email?</p>
                  <p class="text-blue-600 text-xs mt-1">
                    Check your spam folder or click "Resend Email" below.
                  </p>
                </div>
              </div>
            `,
            confirmButtonColor: "var(--color-accent-yellow)",
            confirmButtonText: "I'll Check My Email",
            showCancelButton: true,
            cancelButtonText: "Resend Email",
            cancelButtonColor: "#6b7280",
            reverseButtons: true,
          });

          if (action === false) {
            await handleResendVerification(email);
          }
          return;
        }

        // ─── 401 / wrong password ───
        if (res.status === 401) {
          Swal.close();
          await safeSwalFire({
            icon: "error",
            title: "Incorrect Password",
            html: `
              <div class="text-left">
                <p>${result?.error || "The password you entered is incorrect."}</p>
                <p class="text-sm text-gray-600 mt-2">
                  <a href="/auth/password-reset" class="text-blue-600 underline">
                    Forgot your password?
                  </a>
                </p>
              </div>
            `,
            confirmButtonColor: "var(--color-accent-yellow)",
            confirmButtonText: "Try Again",
          });
          return;
        }

        // ─── Anything else: show the server's message ───
        throw new Error(result?.error || "Login failed. Please try again.");
      }

      // ═══════════════════════════════════════════════════════════════════
      // SUCCESS PATH
      // ═══════════════════════════════════════════════════════════════════
      const { profile, isVerified } = result;
      if (!profile) {
        throw new Error("Login succeeded but no profile was returned.");
      }

      // Persist to localStorage with augmented store fields
      saveUserDataToLocalStorage(profile);
      setUserData(profile);

      Cookies.set("verified", isVerified ? "true" : "false", {
        expires: 7,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });

      Cookies.set("sb-client-session", "true", {
        expires: 7,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });

      Swal.close();

      // ─── Suspicious login toast (non-blocking) ───
      if (result.security?.isSuspicious) {
        toast(
          "warning",
          "Unusual Login Detected",
          `Login from ${result.security.location?.city || "unknown"}, ${
            result.security.location?.country || ""
          }. A security alert has been sent to your email.`,
        );
      } else {
        toast(
          "success",
          "Welcome Back!",
          `Hello, ${
            profile.fullName || profile.email?.split("@")[0] || "User"
          }`,
        );
      }

      // ─── Fire-and-forget side effects ───
      void (async () => {
        try {
          await fetch("/api/activity/last-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: profile.id,
              email: profile.email,
            }),
          });
        } catch (err) {
          console.error("last-login ping failed:", err);
        }
      })();

      void (async () => {
        if (process.env.NODE_ENV !== "production") return;
        try {
          await sendLoginNotificationWithDeviceInfo(profile);
        } catch (err) {
          console.error("Failed to send login notification:", err);
        }
      })();

      // ─── Navigate ───
      let targetUrl = callbackUrl;
      if (fromLogin === "true" && scrollToPricing === "true") {
        targetUrl = `${callbackUrl}?fromLogin=true&scrollToPricing=true`;
      }

      // In production use window.location.replace to force a fresh request
      // so the proxy re-validates with the new cookies. In dev, use the
      // client router for faster iteration.
      if (process.env.NODE_ENV === "production") {
        window.location.replace(targetUrl);
      } else {
        router.replace(targetUrl);
      }
      // Do NOT setLoading(false) here — component unmounts on navigation.
    } catch (err: any) {
      // ─── Clear timers ───
      clearTimeout(timeoutId);
      if (slowHintTimerRef.current) {
        clearTimeout(slowHintTimerRef.current);
        slowHintTimerRef.current = null;
      }
      setSlowHint(false);
      Swal.close();

      // ─── Classify the error ───
      const isAbort = err?.name === "AbortError";
      const isNetwork =
        err?.message === "Failed to fetch" ||
        err?.message === "NetworkError when attempting to fetch resource." ||
        err?.name === "TypeError";
      const isServerHiccup =
        typeof err?.message === "string" && /50[234]/.test(err.message);

      let title = "Login Failed";
      let errorMessage =
        "Invalid email or password. Please check your credentials and try again.";

      if (isAbort) {
        title = "Request Timed Out";
        errorMessage = `The request took longer than ${Math.round(
          LOGIN_TIMEOUT_MS / 1000,
        )} seconds. Please check your internet connection and try again.`;
      } else if (isNetwork) {
        title = "Connection Problem";
        errorMessage =
          "We couldn't reach the server. Please check your internet connection and try again.";
      } else if (isServerHiccup) {
        title = "Server Error";
        errorMessage =
          "Something went wrong on our end. Please try again in a moment.";
      } else if (err?.message) {
        errorMessage = err.message;
      }

      await safeSwalFire({
        icon: "error",
        title,
        html: `
          <div class="text-left">
            <p>${errorMessage}</p>
            ${
              isNetwork || isAbort
                ? `<p class="text-sm text-gray-600 mt-2">
                     Your credentials were not marked as failed.
                     You can safely try again.
                   </p>`
                : ""
            }
          </div>
        `,
        confirmButtonColor: "var(--color-accent-yellow)",
        confirmButtonText: "Try Again",
      });
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="lg:flex lg:justify-between bg-(--bg-primary) min-h-screen fade-in">
      <div
        className="lg:w-[50%] min-h-screen md:h-full flex justify-center md:items-start items-center px-6 md:py-8 fade-in bg-cover bg-center relative"
        style={
          isMobile
            ? {
                backgroundImage: `url("/zidwell-bg-mobile.jpg")`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : {}
        }
      >
        <Button
          onClick={() => router.push("/")}
          variant="outline"
          className="absolute top-4 left-4 md:top-8 md:left-8 hover:bg-(--bg-secondary) transition-colors z-10 cursor-pointer squircle-md border-(--border-color) text-(--text-primary)"
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <Card className="w-full max-w-md h-full shadow-soft squircle-lg border border-(--border-color) bg-(--bg-primary)">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Image
                src={logo}
                alt="Zidwell Logo"
                width={40}
                height={40}
                className="w-20 object-contain"
                priority
              />
            </div>
            <CardTitle className="text-2xl font-bold text-(--text-primary)">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-(--text-secondary)">
              Sign in to your Zidwell Wallet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* ─── Slow network hint ─── */}
              {slowHint && loading && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  <Wifi className="h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Still signing you in…</p>
                    <p className="text-xs mt-0.5 text-amber-700">
                      The network is a bit slow. Please don&apos;t close this
                      page.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-(--text-primary)"
                >
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: "" });
                  }}
                  required
                  disabled={loading}
                  className="w-full px-3 py-2 border border-(--border-color) bg-(--bg-primary) text-(--text-primary) rounded-md focus:outline-none focus:ring-2 focus:ring-(--color-accent-yellow) focus:border-(--color-accent-yellow) squircle-md"
                  style={{ outline: "none", boxShadow: "none" }}
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="text-sm text-destructive animate-pulse">
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-(--text-primary)"
                >
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password)
                        setErrors({ ...errors, password: "" });
                    }}
                    required
                    disabled={loading}
                    className="w-full px-3 py-2 border border-(--border-color) bg-(--bg-primary) text-(--text-primary) rounded-md focus:outline-none focus:ring-2 focus:ring-(--color-accent-yellow) focus:border-(--color-accent-yellow) pr-10 squircle-md"
                    style={{ outline: "none", boxShadow: "none" }}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-(--text-secondary) hover:text-(--text-primary) transition-colors"
                    disabled={loading}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive animate-pulse">
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="remember"
                    className="h-4 w-4 accent-(--color-accent-yellow) border-(--border-color) rounded focus:ring-(--color-accent-yellow) focus:ring-offset-0"
                    disabled={loading}
                  />
                  <Label
                    htmlFor="remember"
                    className="text-sm cursor-pointer text-(--text-primary)"
                  >
                    Remember me
                  </Label>
                </div>
                <Link
                  href="/auth/password-reset"
                  className="text-sm text-(--color-accent-yellow) hover:text-(--color-accent-yellow)/80 transition-colors underline"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90 transition-colors squircle-md py-2"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5 text-(--color-ink)"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    {slowHint ? "Still Signing In…" : "Signing In…"}
                  </span>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-(--text-secondary)">
                Don&apos;t have an account?{" "}
                <Link
                  href="/auth/signup"
                  className="text-(--color-accent-yellow) hover:text-(--color-accent-yellow)/80 font-medium transition-colors inline-flex items-center gap-1"
                >
                  <UserPlus className="h-3 w-3" />
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      <Carousel />
    </div>
  );
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-(--bg-primary)">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-(--color-accent-yellow)"></div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}