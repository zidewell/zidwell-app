"use client";
import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useUserContextData } from "@/app/context/userData";
import { sendLoginNotificationWithDeviceInfo } from "@/lib/login-notification";
import Cookies from "js-cookie";
import Swal from "sweetalert2";
import logo from "@/public/logo.png";

const fixDoubleEncodedUrl = (url: string): string => {
  if (!url || url === "/dashboard") return "/dashboard";
  try {
    let decoded = url;
    let attempts = 0;
    const maxAttempts = 3;
    while ((decoded.includes("%") || decoded.includes("%25")) && attempts < maxAttempts) {
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
    return "/dashboard";
  }
};

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const { setUserData } = useUserContextData();
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawCallbackUrl = searchParams.get("callbackUrl");
  const callbackUrl = rawCallbackUrl ? fixDoubleEncodedUrl(rawCallbackUrl) : "/dashboard";
  const fromLogin = searchParams.get("fromLogin");
  const scrollToPricing = searchParams.get("scrollToPricing");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    if (!email || !password) {
      setErrors({
        email: !email ? "Email is required" : "",
        password: !password ? "Password is required" : "",
      });
      return;
    }

    setLoading(true);
    setErrors({});

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      Swal.fire({
        title: "Signing in...",
        text: "Please wait while we verify your credentials",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Invalid email or password");
      }

      const { profile, safeProfile, isVerified, sessionEstablished } = result;
      if (!profile) throw new Error("User profile not found.");

      setUserData(profile);
      localStorage.setItem("userData", JSON.stringify(safeProfile));

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
      await new Promise((resolve) => setTimeout(resolve, 300));

      let targetUrl = callbackUrl;
      if (fromLogin === "true" && scrollToPricing === "true") {
        targetUrl = `${callbackUrl}?fromLogin=true&scrollToPricing=true`;
      }

      if (process.env.NODE_ENV === "production") {
        window.location.replace(targetUrl);
      } else {
        router.replace(targetUrl);
      }

      if (process.env.NODE_ENV === "production") {
        sendLoginNotificationWithDeviceInfo(profile).catch((err) =>
          console.error("Failed to send login notification:", err)
        );
      }

      setTimeout(() => {
        Swal.fire({
          icon: "success",
          title: "Welcome Back!",
          text: `Hello, ${profile.fullName || profile.email?.split("@")[0] || "User"}`,
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
        }).catch(console.error);
      }, 100);
    } catch (err: any) {
      clearTimeout(timeoutId);
      Swal.close();

      let errorMessage = "Invalid email or password. Please check your credentials and try again.";
      if (err.name === "AbortError") {
        errorMessage = "Please check your internet connection and try again.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: errorMessage,
        confirmButtonColor: "#FDC020",
        confirmButtonText: "Try Again",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-5 py-10">
      <button
        onClick={() => router.push("/")}
        className="absolute top-6 left-6 h-12 w-12 rounded-full flex items-center justify-center hover:bg-[var(--bg-secondary)] transition-colors text-[var(--text-primary)]"
        aria-label="Go back"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      <div className="w-full max-w-md space-y-8">
        <div className="space-y-3 text-center">
          <div className="flex items-center justify-center mb-4">
            <Image
              src={logo}
              alt="Zidwell Logo"
              width={48}
              height={48}
              className="w-12 object-contain"
              priority
            />
          </div>
          <h1 className="font-display text-4xl font-bold text-[var(--text-primary)]">Welcome back</h1>
          <p className="text-[var(--text-secondary)]">Sign in to your Zidwell account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="email" className="text-base font-medium text-[var(--text-primary)]">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: "" });
              }}
              placeholder="you@example.com"
              disabled={loading}
              className={`w-full h-14 px-5 rounded-2xl text-base bg-[var(--bg-secondary)] text-[var(--text-primary)] border ${errors.email ? 'border-red-500' : 'border-[var(--border-color)]'} focus:border-[var(--color-accent-yellow)] focus:ring-2 focus:ring-[var(--color-accent-yellow)] outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed`}
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-base font-medium text-[var(--text-primary)]">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: "" });
                }}
                placeholder="Enter your password"
                disabled={loading}
                className={`w-full h-14 px-5 pr-12 rounded-2xl text-base bg-[var(--bg-secondary)] text-[var(--text-primary)] border ${errors.password ? 'border-red-500' : 'border-[var(--border-color)]'} focus:border-[var(--color-accent-yellow)] focus:ring-2 focus:ring-[var(--color-accent-yellow)] outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                disabled={loading}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="remember"
                className="h-4 w-4 rounded border-[var(--border-color)] accent-[var(--color-accent-yellow)]"
                disabled={loading}
              />
              <label htmlFor="remember" className="text-sm cursor-pointer text-[var(--text-secondary)]">
                Remember me
              </label>
            </div>
            <Link
              href="/auth/password-reset"
              className="text-sm text-[var(--color-accent-yellow)] font-semibold hover:underline transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-16 rounded-2xl text-base font-semibold font-display bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:opacity-90 hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Signing In...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--text-secondary)]">
          Don't have an account?{" "}
          <Link href="/auth/signup" className="text-[var(--color-accent-yellow)] font-semibold hover:underline">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-accent-yellow)]" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}