"use client";

import { Loader2, Send, Shield, CheckCircle } from "lucide-react";
import { useState } from "react";
import Swal from "sweetalert2";
import { Button } from "./ui/button";

export default function SignContractForm({
  token,
  signeeEmail,
}: {
  token: string;
  signeeEmail: string;
}) {
  const [name, setName] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [signed, setSigned] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Missing Name",
        text: "Please type your full name to sign the contract.",
        confirmButtonColor: "var(--color-accent-yellow)",
        background: "var(--bg-primary)",
        customClass: { popup: "squircle-lg" },
      });
      return;
    }

    if (!verificationCode.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Missing Verification Code",
        text: "Please enter the verification code you received by email.",
        confirmButtonColor: "var(--color-accent-yellow)",
        background: "var(--bg-primary)",
        customClass: { popup: "squircle-lg" },
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/contract/sign-contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          signeeEmail,
          signeeName: name.trim(),
          verificationCode,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSigned(true);
        Swal.fire({
          icon: "success",
          title: "Contract Signed",
          text: "You have successfully signed the contract.",
          confirmButtonColor: "var(--color-accent-yellow)",
          background: "var(--bg-primary)",
          customClass: { popup: "squircle-lg" },
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Signing Failed",
          text: data.message || "Failed to sign the contract. Please try again.",
          confirmButtonColor: "var(--color-accent-yellow)",
          background: "var(--bg-primary)",
          customClass: { popup: "squircle-lg" },
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An unexpected error occurred.",
        confirmButtonColor: "var(--color-accent-yellow)",
        background: "var(--bg-primary)",
        customClass: { popup: "squircle-lg" },
      });
    } finally {
      setLoading(false);
    }
  };

  if (signed) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 bg-[var(--color-lemon-green)]/10 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-[var(--color-lemon-green)]" />
        </div>
        <p className="text-lg font-semibold text-[var(--text-primary)]">
          Thank you for signing.
        </p>
        <p className="text-sm text-[var(--text-secondary)] mt-2">
          Your contract has been successfully signed.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] shadow-soft squircle-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-[var(--color-accent-yellow)]/10 rounded-xl flex items-center justify-center">
          <Shield className="h-5 w-5 text-[var(--color-accent-yellow)]" />
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)]">
            Sign Contract
          </h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Enter your details to sign
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block mb-2 text-sm font-medium text-[var(--text-primary)]">
            Your Full Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)] transition-all"
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-[var(--text-primary)]">
            Verification Code *
          </label>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)] transition-all"
            placeholder="Enter 6-digit code"
          />
        </div>

        <Button
          disabled={loading}
          onClick={handleSubmit}
          className="w-full bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90 rounded-xl py-3 font-medium transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Signing...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Sign Contract
            </>
          )}
        </Button>
      </div>
    </div>
  );
}