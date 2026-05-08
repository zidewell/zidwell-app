// InlineSubscribe.tsx
"use client"
import { useState } from "react";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Mail } from "lucide-react";

const InlineSubscribe = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Thank you for subscribing!");
    setEmail("");
  };

  return (
    <div className="my-10 py-8 px-6 bg-[var(--bg-secondary)]/30 rounded-lg border border-[var(--border-color)]">
      <div className="flex items-center gap-2 mb-3">
        <Mail className="w-5 h-5 text-[var(--color-accent-yellow)]" />
        <h4 className="font-semibold text-[var(--text-primary)]">Enjoying this article?</h4>
      </div>
      <p className="text-[var(--text-secondary)] mb-4">
        Subscribe to our newsletter and get the latest financial insights delivered to your inbox weekly.
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)]"
          style={{ outline: "none", boxShadow: "none" }}
          required
        />
        <Button type="submit" className="bg-[var(--color-accent-yellow)] hover:bg-[var(--color-accent-yellow)]/90 text-[var(--color-ink)]">
          Subscribe
        </Button>
      </form>
    </div>
  );
};

export default InlineSubscribe;