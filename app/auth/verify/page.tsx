// app/auth/verify/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import confetti from "canvas-confetti";

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [errorDetail, setErrorDetail] = useState("");
  const [isAlreadyVerified, setIsAlreadyVerified] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token");
      const email = searchParams.get("email");

      console.log("🔐 Verification page loaded with:", { token, email });

      if (!token || !email) {
        setStatus("error");
        setMessage("Invalid verification link");
        setErrorDetail("Missing token or email parameter");
        return;
      }

      try {
        const response = await fetch(
          `/api/auth/verify?token=${token}&email=${encodeURIComponent(email)}`
        );
        
        const data = await response.json();
        console.log("📡 Verification API response:", { status: response.status, data });

        // ✅ Check if email is already verified
        if (response.status === 400 && data.error === "Email already verified") {
          // Email was already verified - treat as success
          setStatus("success");
          setMessage("Your email is already verified!");
          setIsAlreadyVerified(true);
          
          // 🎉 Trigger confetti anyway
          triggerConfetti();
          return;
        }

        if (response.ok && data.success) {
          setStatus("success");
          setMessage("Your email has been verified successfully!");
          
          // 🎉 Trigger confetti
          triggerConfetti();
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed");
          setErrorDetail(data.detail || "Please try again or request a new link");
        }
      } catch (error) {
        console.error("❌ Verification error:", error);
        setStatus("error");
        setMessage("An error occurred during verification");
        setErrorDetail("Please check your connection and try again");
      }
    };

    verifyEmail();
  }, [searchParams]);

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    return () => clearInterval(interval);
  };

  if (status === "loading") {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-primary)",
      }}>
        <div style={{ textAlign: "center" }}>
          <Loader2 size={48} style={{ 
            animation: "spin 1s linear infinite",
            color: "var(--color-accent-yellow)",
            margin: "0 auto",
          }} />
          <p style={{ marginTop: "1rem", color: "var(--text-secondary)" }}>
            Verifying your email...
          </p>
          <style jsx>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg-primary)",
      padding: "1rem",
    }}>
      <div style={{
        maxWidth: "28rem",
        width: "100%",
        background: "var(--bg-primary)",
        borderRadius: "1rem",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        border: "1px solid var(--border-color)",
        padding: "2rem",
        textAlign: "center",
      }}>
        {status === "success" ? (
          <>
            <div style={{
              width: "4rem",
              height: "4rem",
              background: "#dcfce7",
              borderRadius: "9999px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
            }}>
              <CheckCircle size={40} style={{ color: "#16a34a" }} />
            </div>
            <h1 style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              color: "var(--text-primary)",
              marginBottom: "0.5rem",
            }}>
              {isAlreadyVerified ? "Already Verified! 🎉" : "Email Verified! 🎉"}
            </h1>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
              {isAlreadyVerified 
                ? "Your email was already verified. You can now log in to your account."
                : message
              }
            </p>
            
            <div style={{
              background: "var(--bg-secondary)",
              borderRadius: "0.5rem",
              padding: "1rem",
              marginBottom: "1.5rem",
              textAlign: "left",
            }}>
              <p style={{
                fontSize: "0.875rem",
                fontWeight: "500",
                color: "var(--text-primary)",
                marginBottom: "0.5rem",
              }}>
                ✨ What's waiting for you:
              </p>
              <ul style={{
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
                listStyle: "none",
                padding: 0,
                margin: 0,
              }}>
                <li style={{ padding: "0.25rem 0" }}>📄 10 free invoices</li>
                <li style={{ padding: "0.25rem 0" }}>🧾 10 free receipts</li>
                <li style={{ padding: "0.25rem 0" }}>📝 1 free contract</li>
                <li style={{ padding: "0.25rem 0" }}>🧮 30-day Tax Calculator trial</li>
                <li style={{ padding: "0.25rem 0" }}>🎁 ₦20 Zidcoin bonus</li>
              </ul>
            </div>

            <Button
              onClick={() => router.push("/auth/login")}
              className="w-full bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90"
            >
              Sign In to Your Dashboard
            </Button>
          </>
        ) : (
          <>
            <div style={{
              width: "4rem",
              height: "4rem",
              background: "#fecaca",
              borderRadius: "9999px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
            }}>
              <XCircle size={40} style={{ color: "#dc2626" }} />
            </div>
            <h1 style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              color: "var(--text-primary)",
              marginBottom: "0.5rem",
            }}>
              Verification Failed
            </h1>
            <p style={{ color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
              {message}
            </p>
            {errorDetail && (
              <p style={{ 
                color: "var(--text-secondary)", 
                fontSize: "0.75rem",
                marginBottom: "1.5rem",
              }}>
                {errorDetail}
              </p>
            )}
            
            <div style={{
              background: "rgba(251, 191, 36, 0.1)",
              borderRadius: "0.5rem",
              padding: "1rem",
              marginBottom: "1.5rem",
              border: "1px solid rgba(251, 191, 36, 0.2)",
              textAlign: "left",
            }}>
              <p style={{
                fontSize: "0.875rem",
                color: "#d97706",
              }}>
                💡 The verification link may have expired or been used already.
                You can request a new verification email from the login page.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <Button
                onClick={() => router.push("/auth/login")}
                className="w-full bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90"
              >
                Go to Login
              </Button>
              <Button
                onClick={() => router.push("/")}
                variant="outline"
                className="w-full border-(--border-color) text-(--text-primary)"
              >
                Return Home
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}