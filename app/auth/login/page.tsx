"use client";
import Swal from "sweetalert2";
import { useState, FormEvent, useEffect, Suspense } from "react";
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
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useUserContextData } from "@/app/context/userData";
import Carousel from "@/app/components/Carousel";
import { useRouter, useSearchParams } from "next/navigation";
import { sendLoginNotificationWithDeviceInfo } from "@/lib/login-notification";

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

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const { setUserData } = useUserContextData();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const searchParams = useSearchParams();

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
      didOpen: () => {
        Swal.showLoading();
      },
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

    const { profile, isVerified, sessionEstablished } = result;
    if (!profile) throw new Error("User profile not found.");

    setUserData(profile);
    localStorage.setItem("userData", JSON.stringify(profile));

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

    const sessionCookie = Cookies.get("sb-client-session");
    if (!sessionCookie) {
      console.warn("Session cookie not set, retrying...");
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    let targetUrl = callbackUrl;
    if (fromLogin === "true" && scrollToPricing === "true") {
      targetUrl = `${callbackUrl}?fromLogin=true&scrollToPricing=true`;
    }

    // ✅ Updated: Use replace instead of push to prevent going back
    if (process.env.NODE_ENV === "production") {
      window.location.replace(targetUrl); // Replaces history in production
    } else {
      router.replace(targetUrl); // Replaces history in development
    }

    Promise.allSettled([
      (async () => {
        await fetch("/api/activity/last-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: profile.id,
            email: profile.email,
          }),
        }).catch(console.error);
      })(),
    ]).catch((err) => console.error("Background operations failed:", err));

    if (process.env.NODE_ENV === "production") {
      sendLoginNotificationWithDeviceInfo(profile).catch((err) =>
        console.error("Failed to send login notification:", err),
      );
    }

    setTimeout(() => {
      Swal.fire({
        icon: "success",
        title: "Welcome Back!",
        text: `Hello, ${profile.name || profile.email?.split("@")[0] || "User"}`,
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

    let errorMessage =
      "Invalid email or password. Please check your credentials and try again.";

    if (err.name === "AbortError") {
      errorMessage = "Please check your internet connection and try again.";
    } else if (err.message) {
      errorMessage = err.message;
    }

    Swal.fire({
      icon: "error",
      title: "Login Failed",
      text: errorMessage,
      confirmButtonColor: "var(--color-accent-yellow)",
      confirmButtonText: "Try Again",
    });
  } finally {
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
                    Signing In...
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
                  className="text-(--color-accent-yellow) hover:text-(--color-accent-yellow)/80 font-medium transition-colors"
                >
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
