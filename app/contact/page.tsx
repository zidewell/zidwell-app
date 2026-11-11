// app/contact/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Mail,
  MessageSquare,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Clock,
} from "lucide-react";
import { Nav } from "@/app/components/home-component/Nav";

/* ---------------------------------------------------------------- */
/*  Static content                                                   */
/* ---------------------------------------------------------------- */

const categories = [
  { value: "general", label: "General inquiry" },
  { value: "sales", label: "Sales & pricing" },
  { value: "billing", label: "Billing & payments" },
  { value: "technical", label: "Technical support" },
  { value: "partnership", label: "Partnership" },
  { value: "press", label: "Press & media" },
];

const responseChannels = [
  {
    icon: Mail,
    label: "Email support",
    value: "support@zidwell.com",
    href: "mailto:support@zidwell.com",
    note: "Replies within 1 business day",
  },
  {
    icon: MessageSquare,
    label: "Call or WhatsApp",
    value: "+234 706 917 5399",
    href: "https://wa.me/2347069175399",
    note: "Mon–Fri, 9am–6pm WAT",
  },
  {
    icon: Building2,
    label: "Office",
    value: "Lagos, Nigeria",
    href: undefined,
    note: "By appointment only",
  },
];

/* ---------------------------------------------------------------- */
/*  Page                                                             */
/* ---------------------------------------------------------------- */

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    category: "general",
    honeypot: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  const update = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) {
      setErrors((prev) => {
        const { [k]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "sending") return;

    setStatus("sending");
    setGlobalError(null);
    setErrors({});

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.errors) {
          setErrors(data.errors);
          setStatus("idle");
          return;
        }
        setGlobalError(
          data.error ||
            "We couldn't send your message. Please try again in a moment.",
        );
        setStatus("error");
        return;
      }

      setReference(data.reference || null);
      setStatus("sent");
      setForm({
        name: "",
        email: "",
        subject: "",
        message: "",
        category: "general",
        honeypot: "",
      });
    } catch (err) {
      console.error(err);
      setGlobalError(
        "We couldn't reach the server. Check your internet connection and try again.",
      );
      setStatus("error");
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Success view                                                    */
  /* ---------------------------------------------------------------- */

  if (status === "sent") {
    return (
      <>
        <Nav />
        <main className="min-h-screen bg-surface flex items-center justify-center px-5 pt-32 pb-24">
          <div className="max-w-md w-full text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-leaf/10">
              <CheckCircle2 className="h-7 w-7 text-leaf" />
            </span>
            <h1 className="mt-6 font-display text-2xl font-semibold text-ink">
              Message sent
            </h1>
            <p className="mt-3 text-[15px] text-muted-foreground leading-relaxed">
              Thanks for reaching out. A member of our team will reply to{" "}
              <span className="font-medium text-ink">
                {form.email || "your email"}
              </span>{" "}
              within one business day.
            </p>

            {reference && (
              <div className="mt-6 inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-[12.5px]">
                <span className="text-muted-foreground">Reference</span>
                <code className="font-mono font-semibold text-ink">
                  {reference}
                </code>
              </div>
            )}

            <div className="mt-10 flex flex-col sm:flex-row gap-2 justify-center">
              <button
                onClick={() => {
                  setStatus("idle");
                  setReference(null);
                }}
                className="rounded-xl border border-border bg-background px-4 py-2.5 text-[14px] font-medium text-ink hover:bg-surface-2 transition"
              >
                Send another message
              </button>
              <Link
                href="/"
                className="rounded-xl bg-gold px-4 py-2.5 text-[14px] font-semibold text-[color:var(--primary-foreground)] hover:opacity-90 transition"
              >
                Back to home
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Form view                                                       */
  /* ---------------------------------------------------------------- */

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-surface">
        <div className="container mx-auto max-w-6xl px-5 sm:px-8 pt-32 pb-20">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-ink transition mb-10"
          >
            <ArrowLeft size={14} />
            Back to home
          </Link>

          <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">
            {/* Left column */}
            <div className="lg:col-span-2">
              <p className="text-[12px] font-semibold uppercase tracking-wider text-primary-custom mb-3">
                Contact
              </p>
              <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink leading-tight tracking-tight">
                Let&apos;s talk.
              </h1>
              <p className="mt-4 text-[15px] text-muted-foreground leading-relaxed max-w-md">
                Questions about a plan, an invoice, or something else entirely?
                Send us a note and a real person on our team will get back to
                you.
              </p>

              <div className="mt-10 space-y-1">
                {responseChannels.map((c) => {
                  const Icon = c.icon;
                  const inner = (
                    <>
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--color-accent-yellow)/12 text-primary-custom">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[12px] font-medium text-muted-foreground">
                          {c.label}
                        </span>
                        <span className="block mt-0.5 text-[14px] font-semibold text-ink group-hover:text-primary-custom transition-colors truncate">
                          {c.value}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1 text-[12px] text-muted-foreground">
                          <Clock size={11} />
                          {c.note}
                        </span>
                      </span>
                    </>
                  );

                  return c.href ? (
                    <a
                      key={c.label}
                      href={c.href}
                      target={c.href.startsWith("http") ? "_blank" : undefined}
                      rel={
                        c.href.startsWith("http")
                          ? "noopener noreferrer"
                          : undefined
                      }
                      className="group flex items-start gap-3 rounded-xl px-3 py-3 -mx-3 hover:bg-background transition-colors"
                    >
                      {inner}
                    </a>
                  ) : (
                    <div
                      key={c.label}
                      className="group flex items-start gap-3 rounded-xl px-3 py-3 -mx-3"
                    >
                      {inner}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right column — form */}
            <div className="lg:col-span-3">
              <form
                onSubmit={handleSubmit}
                className="rounded-2xl border border-border bg-background p-6 sm:p-8 shadow-sm"
                noValidate
              >
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.honeypot}
                  onChange={(e) => update("honeypot", e.target.value)}
                  className="absolute left-[-9999px] h-0 w-0 opacity-0"
                  aria-hidden="true"
                />

                {globalError && (
                  <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <p className="text-[13.5px] text-destructive leading-relaxed">
                      {globalError}
                    </p>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <Field
                    label="Your name"
                    error={errors.name}
                    id="contact-name"
                  >
                    <input
                      id="contact-name"
                      type="text"
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                      placeholder="Adaeze Okafor"
                      autoComplete="name"
                      required
                      className={inputClass(!!errors.name)}
                    />
                  </Field>

                  <Field
                    label="Email address"
                    error={errors.email}
                    id="contact-email"
                  >
                    <input
                      id="contact-email"
                      type="email"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      placeholder="you@business.com"
                      autoComplete="email"
                      required
                      className={inputClass(!!errors.email)}
                    />
                  </Field>
                </div>

                <div className="mt-4">
                  <Field
                    label="What's this about?"
                    error={errors.category}
                    id="contact-category"
                  >
                    <select
                      id="contact-category"
                      value={form.category}
                      onChange={(e) => update("category", e.target.value)}
                      className={inputClass(!!errors.category)}
                    >
                      {categories.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div className="mt-4">
                  <Field
                    label="Subject"
                    error={errors.subject}
                    id="contact-subject"
                  >
                    <input
                      id="contact-subject"
                      type="text"
                      value={form.subject}
                      onChange={(e) => update("subject", e.target.value)}
                      placeholder="Brief summary of your question"
                      required
                      className={inputClass(!!errors.subject)}
                    />
                  </Field>
                </div>

                <div className="mt-4">
                  <Field
                    label="Message"
                    error={errors.message}
                    id="contact-message"
                    hint={`${form.message.length}/5000`}
                  >
                    <textarea
                      id="contact-message"
                      value={form.message}
                      onChange={(e) => update("message", e.target.value)}
                      placeholder="Tell us what's going on, or what you need. The more detail, the faster we can help."
                      rows={6}
                      required
                      maxLength={5000}
                      className={
                        inputClass(!!errors.message) +
                        " resize-y min-h-[140px]"
                      }
                    />
                  </Field>
                </div>

                <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-[12px] text-muted-foreground">
                    We&apos;ll never share your details with anyone.
                  </p>
                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-[14px] font-semibold text-[color:var(--primary-foreground)] hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {status === "sending" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      "Send message"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

/* ---------------------------------------------------------------- */
/*  Small helpers                                                    */
/* ---------------------------------------------------------------- */

function Field({
  label,
  error,
  hint,
  id,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label htmlFor={id} className="text-[12.5px] font-semibold text-ink">
          {label}
        </label>
        {hint && (
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {hint}
          </span>
        )}
      </div>
      {children}
      {error && <p className="mt-1.5 text-[12px] text-destructive">{error}</p>}
    </div>
  );
}

function inputClass(hasError: boolean) {
  return [
    "w-full rounded-lg border bg-background px-3.5 py-2.5 text-[14px] text-ink",
    "placeholder:text-muted-foreground/60",
    "focus:outline-none focus:ring-2 focus:ring-primary-custom/30 focus:border-primary-custom",
    "transition-colors",
    hasError
      ? "border-destructive/60 bg-destructive/[0.02]"
      : "border-border hover:border-border/80",
  ].join(" ");
}