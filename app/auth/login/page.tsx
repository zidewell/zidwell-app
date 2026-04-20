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
import { Button2 } from "@/app/components/ui/button2";

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

  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const fromLogin = searchParams.get("fromLogin");
  const scrollToPricing = searchParams.get("scrollToPricing");

  useEffect(() => {
    const checkScreenSize = () => setIsMobile(window.innerWidth < 768);
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Preload dashboard routes when user starts typing
  useEffect(() => {
    if (email.length > 3 && password.length > 0) {
      router.prefetch("/dashboard");
      router.prefetch("/onboarding");
    }
  }, [email, password, router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Basic validation
    if (!email || !password) {
      setErrors({ 
        email: !email ? "Email is required" : "",
        password: !password ? "Password is required" : ""
      });
      return;
    }
    
    if (loading) return;
    setLoading(true);
    setErrors({});

    // Store start time for performance monitoring
    const startTime = performance.now();

    try {
      // Show loading indicator (non-blocking)
      let loadingToast: any = null;
      
      // Only show Swal loading if it's taking longer than 300ms
      const loadingTimeout = setTimeout(() => {
        loadingToast = Swal.fire({
          title: "Signing in...",
          text: "Please wait while we verify your credentials",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
          backdrop: true,
        });
      }, 300);

      // Add timeout to fetch request (5 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      // Single API call for authentication
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      // Clear loading timeout if it hasn't fired yet
      clearTimeout(loadingTimeout);
      
      // Close loading toast if it was shown
      if (loadingToast) {
        Swal.close();
      }

      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || "Invalid email or password");
      }

      const { profile, isVerified } = result;
      if (!profile) throw new Error("User profile not found.");

      // CRITICAL OPTIMIZATION: Navigate IMMEDIATELY
      // This is the most important change - don't wait for anything else
      const decodedCallbackUrl = decodeURIComponent(callbackUrl);
      const targetUrl = (fromLogin === "true" && scrollToPricing === "true")
        ? `${decodedCallbackUrl}?fromLogin=true&scrollToPricing=true`
        : decodedCallbackUrl;
      
      // Start navigation immediately
      router.push(targetUrl);

      // Log performance in production (optional, remove if not needed)
      if (process.env.NODE_ENV === "production") {
        const endTime = performance.now();
        console.log(`[Performance] Login to navigation: ${(endTime - startTime).toFixed(2)}ms`);
      }

      // Schedule all non-critical operations AFTER navigation has started
      // Using queueMicrotask for immediate but non-blocking execution
      queueMicrotask(() => {
        // Save user data to context and localStorage
        setUserData(profile);
        
        // Use requestIdleCallback for localStorage if available (non-critical)
        if (typeof requestIdleCallback !== 'undefined') {
          requestIdleCallback(() => {
            try {
              localStorage.setItem("userData", JSON.stringify(profile));
            } catch (err) {
              console.error("Failed to save to localStorage:", err);
            }
          }, { timeout: 2000 });
        } else {
          // Fallback for browsers without requestIdleCallback
          setTimeout(() => {
            try {
              localStorage.setItem("userData", JSON.stringify(profile));
            } catch (err) {
              console.error("Failed to save to localStorage:", err);
            }
          }, 100);
        }
        
        // Set verification cookie
        Cookies.set("verified", isVerified ? "true" : "false", {
          expires: 7,
          path: "/",
          sameSite: "lax",
        });
        
        // Update last login activity (fire and forget)
        fetch("/api/activity/last-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: profile.id,
            email: profile.email,
          }),
        }).catch(err => console.error("Failed to update last login:", err));
        
        // Send notification asynchronously (only in production)
        if (process.env.NODE_ENV === "production") {
          sendLoginNotificationWithDeviceInfo(profile).catch(err =>
            console.error("Failed to send login notification:", err)
          );
        }
      });

      // Show success toast (non-blocking, doesn't interfere with navigation)
      setTimeout(() => {
        Swal.fire({
          icon: "success",
          title: "Welcome Back!",
          text: `Hello, ${profile.name || profile.email.split('@')[0]}`,
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
          didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
          }
        }).catch(console.error);
      }, 100);

    } catch (err: any) {
      // Close any open Swal dialogs
      Swal.close();
      
      // Handle timeout specifically
      if (err.name === 'AbortError') {
        Swal.fire({
          icon: "error",
          title: "Connection Timeout",
          text: "The server is taking too long to respond. Please check your internet connection and try again.",
          confirmButtonColor: "#2b825b",
          confirmButtonText: "Try Again",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Login Failed",
          text: err.message || "Invalid email or password. Please check your credentials and try again.",
          confirmButtonColor: "#2b825b",
          confirmButtonText: "Try Again",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lg:flex lg:justify-between bg-gray-50 min-h-screen fade-in">
      <div
        className="lg:w-[50%] min-h-screen md:h-full flex justify-center md:items-start items-center px-6 md:py-8 fade-in bg-cover bg-center relative"
        style={isMobile ? {
          backgroundImage: `url("/zidwell-bg-mobile.jpg")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        } : {}}
      >
        <Button
          onClick={() => router.push("/")}
          variant="outline"
          className="absolute top-4 left-4 md:top-8 md:left-8 hover:bg-white/20 transition-colors z-10 cursor-pointer"
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <Card className="w-full max-w-md h-full shadow-lg">
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
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription>Sign in to your Zidwell Wallet</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2b825b] focus:border-transparent"
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="text-sm text-red-500 animate-pulse">{errors.email}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
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
                      if (errors.password) setErrors({ ...errors, password: "" });
                    }}
                    required
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2b825b] focus:border-transparent pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    disabled={loading}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500 animate-pulse">{errors.password}</p>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="remember"
                    className="h-4 w-4 text-[#2b825b] border-gray-300 rounded focus:ring-[#2b825b]"
                    disabled={loading}
                  />
                  <Label htmlFor="remember" className="text-sm cursor-pointer">
                    Remember me
                  </Label>
                </div>
                <Link
                  href="/auth/password-reset"
                  className="text-sm text-[#2b825b] hover:text-[#1f6044] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              
              <Button2
                type="submit"
                className="w-full bg-[#2b825b] hover:bg-[#1f6044] transition-colors"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5 text-white"
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
              </Button2>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don&apos;t have an account?{" "}
                <Link
                  href="/auth/signup"
                  className="text-[#2b825b] hover:text-[#1f6044] font-medium transition-colors"
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
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2b825b]"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}