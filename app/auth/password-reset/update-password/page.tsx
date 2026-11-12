// app/auth/password-reset/update-password/page.tsx
"use client";

import { useState, useEffect, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { supabase } from "@/app/supabase/supabase";

function UpdatePasswordContent() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // ═════════════════════════════════════════════════════════════════
  // CRITICAL: Wait for Supabase JS SDK to process the hash fragment
  // The SDK auto-detects #access_token=... in the URL and creates a
  // temporary recovery session. Without this, updateUser() fails.
  // ═════════════════════════════════════════════════════════════════
  useEffect(() => {
    const waitForSession = async () => {
      console.log("⏳ Checking for recovery session...");
      console.log("   URL hash:", window.location.hash ? "present" : "empty");
      console.log("   URL search:", window.location.search);

      // Supabase SDK uses `detectSessionInUrl` — it runs automatically on mount.
      // Give it up to 3 seconds to process the hash.
      let attempts = 0;
      const maxAttempts = 15; // 15 * 200ms = 3s

      const check = async (): Promise<void> => {
        attempts++;

        const { data, error } = await supabase.auth.getSession();

        if (data.session) {
          console.log("✅ Recovery session established:", data.session.user.email);
          setSessionReady(true);
          setSessionError(null);
          return;
        }

        if (attempts >= maxAttempts) {
          // No session after 3s — either no hash, or the hash was invalid/expired
          console.error("❌ No session found after 3s");
          console.error("   getSession error:", error);

          // Check if there's an error in the URL hash
          const hash = window.location.hash;
          if (hash.includes("error=")) {
            const hashParams = new URLSearchParams(hash.substring(1));
            const errorDesc =
              hashParams.get("error_description") ||
              hashParams.get("error") ||
              "The reset link is invalid or has expired";
            setSessionError(errorDesc);
          } else if (hash.includes("access_token=")) {
            setSessionError(
              "The reset link could not be processed. It may have already been used.",
            );
          } else {
            setSessionError(
              "This page must be accessed from a password reset email link. Please request a new one.",
            );
          }
          return;
        }

        // Retry in 200ms
        setTimeout(check, 200);
      };

      check();
    };

    waitForSession();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const newErrors: { [key: string]: string } = {};
    if (!password || password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!sessionReady) {
      Swal.fire({
        title: "Cannot Update Password",
        text: "Your reset link is invalid or has expired. Please request a new one.",
        icon: "error",
      });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        Swal.fire({
          title: "Failed to reset password",
          text: error.message,
          icon: "error",
        });
        setLoading(false);
        return;
      }

      // Sign out the recovery session so the user must log in fresh
      await supabase.auth.signOut();

      Swal.fire({
        title: "Password Updated!",
        text: "Your password has been successfully updated. Please log in with your new password.",
        icon: "success",
        confirmButtonText: "Go to Login",
        confirmButtonColor: "var(--color-accent-yellow)",
      }).then(() => {
        router.push("/auth/login");
      });
    } catch (err: any) {
      Swal.fire({
        title: "Error",
        text: err.message || "Something went wrong. Please try again.",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // ═════════════════════════════════════════════════════════════════
  // LOADING STATE — waiting for session
  // ═════════════════════════════════════════════════════════════════
  if (!sessionReady && !sessionError) {
    return (
      <main className="p-5 h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-(--color-accent-yellow) mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-(--text-primary)">
            Verifying Reset Link
          </h2>
          <p className="text-sm text-(--text-secondary) mt-2">
            Please wait while we verify your password reset link...
          </p>
        </div>
      </main>
    );
  }

  // ═════════════════════════════════════════════════════════════════
  // ERROR STATE — invalid/expired link
  // ═════════════════════════════════════════════════════════════════
  if (sessionError) {
    return (
      <main className="p-5 h-screen">
        <div className="flex justify-start mb-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
          >
            ← Back
          </button>
        </div>

        <div className="flex flex-col justify-center items-center h-[70%]">
          <div className="max-w-md w-full text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl mb-2 text-(--text-primary)">
              Reset Link Invalid
            </h2>
            <p className="text-(--text-secondary) mb-6">{sessionError}</p>

            <div className="flex flex-col gap-3">
              <Button
                onClick={() => router.push("/auth/password-reset")}
                className="bg-(--color-accent-yellow) text-(--color-ink)"
              >
                Request New Reset Link
              </Button>
              <Button
                onClick={() => router.push("/auth/login")}
                variant="outline"
              >
                Back to Login
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ═════════════════════════════════════════════════════════════════
  // FORM STATE — session ready, allow password update
  // ═════════════════════════════════════════════════════════════════
  return (
    <main className="p-5 h-screen">
      <div className="flex justify-start mb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
        >
          ← Back
        </button>
      </div>

      <div className="flex flex-col justify-center items-center h-[70%]">
        <h2 className="text-2xl mb-2 text-(--text-primary)">
          Set a New Password
        </h2>
        <p className="mb-4 text-(--text-secondary)">
          Enter your new password below
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-[300px]">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <input
                className="p-2 pr-10 outline-none border border-gray-300 rounded-md bg-transparent focus:border-black w-full"
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>
          {errors.password && (
            <p className="text-red-500 text-sm">{errors.password}</p>
          )}
          <Button
            className="bg-(--color-accent-yellow) mt-4"
            type="submit"
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </div>
    </main>
  );
}

// Wrap in Suspense because useSearchParams is used
export default function UpdatePassword() {
  return (
    <Suspense
      fallback={
        <main className="p-5 h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-(--color-accent-yellow)" />
        </main>
      }
    >
      <UpdatePasswordContent />
    </Suspense>
  );
}