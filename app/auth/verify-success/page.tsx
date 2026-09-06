// app/auth/verify-success/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import confetti from "canvas-confetti";

export default function VerifySuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Trigger confetti
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
  }, []);

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
          Email Verified! 🎉
        </h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
          Your email has been successfully verified! You can now log in to your account.
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
      </div>
    </div>
  );
}