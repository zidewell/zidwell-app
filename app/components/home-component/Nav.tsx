// app/components/home-component/Nav.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  Sun,
  Moon,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  BookOpen,
  FileText,
  Receipt,
  FileSignature,
  FileSpreadsheet,
  Wallet,
  ArrowLeftRight,
  Store,
  GraduationCap,
  Tag,
  Settings,
  User,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useUserContextData } from "@/app/context/userData";

/* ------------------------------------------------------------------ */
/*  ZidStore host                                                     */
/* ------------------------------------------------------------------ */
const ZIDSTORE_HOST = process.env.NEXT_PUBLIC_ZIDSTORE_HOST;
const zidStore =
  process.env.NODE_ENV === "development" || !ZIDSTORE_HOST
    ? { href: "/online-store", external: false }
    : { href: `https://${ZIDSTORE_HOST}`, external: true };

/* ------------------------------------------------------------------ */
/*  Nav model                                                         */
/* ------------------------------------------------------------------ */

type SimpleLink = { name: string; href: string; external?: boolean };

type ProductItem = {
  name: string;
  href: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
};

const productItems: ProductItem[] = [
  {
    name: "Bookkeeping",
    href: "/features/bookkeeping",
    desc: "Daily income & expenses, categorised.",
    icon: BookOpen,
  },
  {
    name: "Invoices",
    href: "/features/invoice",
    desc: "Branded invoices with live payment status.",
    icon: FileText,
  },
  {
    name: "Receipts",
    href: "/features/receipt",
    desc: "Instant digital receipts on every sale.",
    icon: Receipt,
  },
  {
    name: "Contracts",
    href: "/features/contracts",
    desc: "Draft, sign and store agreements.",
    icon: FileSignature,
  },
  {
    name: "Tax Manager",
    href: "/features/tax",
    desc: "Tax-ready summaries, filed on time.",
    icon: FileSpreadsheet,
  },
  {
    name: "Business Account",
    href: "/features/wallet",
    desc: "A real account, powered by our partners.",
    icon: Wallet,
  },
];

const simpleLinks: SimpleLink[] = [
  { name: "Schools", href: "/schools" },
  { name: "Pricing", href: "/pricing" },
  { name: "ZidStore", href: zidStore.href, external: zidStore.external },
  { name: "Blog", href: "/blog" },
  { name: "Contact", href: "/contact" },
];

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function Nav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [dark, setDark] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [productMenuOpen, setProductMenuOpen] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const { userData, loading, handleSessionExpired } = useUserContextData();

  const isAuthenticated = !!userData?.id;

  const productMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  /* --- theme --- */
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)")
      .matches;
    const isDark = stored === "dark" || (stored === null && prefersDark);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const setTheme = (isDark: boolean) => {
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  };

  /* --- scroll state --- */
  useEffect(() => {
    const onScroll = () => setHasScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* --- close everything on route change --- */
  useEffect(() => {
    setIsMenuOpen(false);
    setProfileMenuOpen(false);
    setProductMenuOpen(false);
  }, [pathname]);

  /* --- lock body scroll when mobile sheet is open --- */
  useEffect(() => {
    document.body.classList.toggle("overflow-hidden", isMenuOpen);
    return () => document.body.classList.remove("overflow-hidden");
  }, [isMenuOpen]);

  /* --- outside-click for dropdowns --- */
  useEffect(() => {
    if (!profileMenuOpen && !productMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (productMenuRef.current && !productMenuRef.current.contains(t)) {
        setProductMenuOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(t)) {
        setProfileMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setProfileMenuOpen(false);
        setProductMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [profileMenuOpen, productMenuOpen]);

  /* --- navigation helpers --- */
  const go = (href: string, external?: boolean) => {
    if (external) {
      window.open(href, "_blank", "noopener,noreferrer");
    } else {
      router.push(href);
    }
    setIsMenuOpen(false);
    setProductMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await handleSessionExpired("/auth/login");
    } catch (err) {
      console.error("Logout failed:", err);
      router.replace("/auth/login");
    }
    setIsMenuOpen(false);
    setProfileMenuOpen(false);
  };

  const firstName = userData?.full_name?.split(" ")[0] || "Account";
  const initials =
    userData?.full_name
      ?.split(" ")
      .map((n: string) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  /* ------------------------------------------------------------------ */

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-50 transition-[background,box-shadow,border-color] duration-200",
        hasScrolled
          ? "bg-background/85 backdrop-blur-md border-b border-border"
          : "bg-background border-b border-transparent",
      ].join(" ")}
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex h-16 md:h-[72px] items-center justify-between gap-6">
          {/* ---------- Logo ---------- */}
          <Link
            href="/"
            className="flex items-center gap-2 group shrink-0"
            aria-label="Zidwell home"
          >
            <Image
              src="/logo.png"
              alt=""
              width={40}
              height={32}
              className="w-9 object-contain transition-transform group-hover:scale-[1.03]"
            />
            <span className="text-[17px] font-bold tracking-tight text-ink uppercase font-['Space_Grotesk',system-ui,sans-serif]">
              Zidwell
            </span>
          </Link>

          {/* ---------- Desktop nav ---------- */}
          <nav className="hidden lg:flex items-center gap-1">
            {/* Product dropdown */}
            <div ref={productMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setProductMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={productMenuOpen}
                className={[
                  "flex items-center gap-1 px-3 py-2 text-[14px] font-medium rounded-lg transition-colors",
                  productMenuOpen
                    ? "text-ink bg-surface"
                    : "text-muted-foreground hover:text-ink hover:bg-surface",
                ].join(" ")}
              >
                Product
                <ChevronDown
                  size={14}
                  className={[
                    "transition-transform duration-200",
                    productMenuOpen ? "rotate-180" : "",
                  ].join(" ")}
                />
              </button>

              {productMenuOpen && (
                <div
                  role="menu"
                  className="absolute left-0 top-full mt-2 w-[540px] rounded-2xl border border-border bg-background shadow-xl p-3 grid grid-cols-2 gap-1"
                >
                  {productItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.name}
                        role="menuitem"
                        onClick={() => go(item.href)}
                        className="group flex items-start gap-3 rounded-xl px-3 py-3 text-left hover:bg-surface transition-colors"
                      >
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-(--color-accent-yellow)/12 text-primary-custom">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[13.5px] font-semibold text-ink leading-tight">
                            {item.name}
                          </span>
                          <span className="mt-0.5 block text-[12px] text-muted-foreground leading-snug">
                            {item.desc}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {simpleLinks.map((link) => (
              <button
                key={link.name}
                type="button"
                onClick={() => go(link.href, link.external)}
                className="px-3 py-2 text-[14px] font-medium rounded-lg text-muted-foreground hover:text-ink hover:bg-surface transition-colors"
              >
                {link.name}
              </button>
            ))}
          </nav>

          {/* ---------- Right cluster ---------- */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              type="button"
              onClick={() => setTheme(!dark)}
              aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
              className="hidden lg:inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-ink hover:bg-surface transition-colors"
            >
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Desktop auth zone */}
            <div className="hidden lg:flex items-center gap-2">
              {loading ? (
                <div className="h-9 w-40 rounded-lg bg-surface animate-pulse" />
              ) : isAuthenticated ? (
                <div ref={profileMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setProfileMenuOpen((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={profileMenuOpen}
                    className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 border border-border bg-surface hover:bg-surface-2 transition-colors"
                  >
                    {userData?.profile_picture ? (
                      <img
                        src={userData.profile_picture}
                        alt=""
                        className="h-7 w-7 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold text-[color:var(--primary-foreground)] text-[11px] font-bold">
                        {initials}
                      </span>
                    )}
                    <span className="text-[13.5px] font-semibold text-ink max-w-[100px] truncate">
                      {firstName}
                    </span>
                    <ChevronDown
                      size={13}
                      className={[
                        "text-muted-foreground transition-transform duration-200",
                        profileMenuOpen ? "rotate-180" : "",
                      ].join(" ")}
                    />
                  </button>

                  {profileMenuOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 top-full mt-2 w-60 rounded-2xl border border-border bg-background shadow-xl overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-border">
                        <p className="text-[13.5px] font-semibold text-ink truncate">
                          {userData?.full_name || "Account"}
                        </p>
                        <p className="text-[12px] text-muted-foreground truncate">
                          {userData?.email || ""}
                        </p>
                      </div>

                      <button
                        role="menuitem"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          router.push("/dashboard");
                        }}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13.5px] font-medium text-ink hover:bg-surface transition-colors"
                      >
                        <LayoutDashboard size={15} className="text-muted-foreground" />
                        Dashboard
                      </button>

                      <button
                        role="menuitem"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          router.push("/dashboard/settings");
                        }}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13.5px] font-medium text-ink hover:bg-surface transition-colors"
                      >
                        <Settings size={15} className="text-muted-foreground" />
                        Settings
                      </button>

                      <button
                        role="menuitem"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13.5px] font-medium text-destructive hover:bg-destructive/5 transition-colors border-t border-border"
                      >
                        <LogOut size={15} />
                        Log out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => router.push("/auth/login")}
                    className="px-3 py-2 text-[14px] font-medium text-ink hover:bg-surface rounded-lg transition-colors"
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/auth/signup")}
                    className="px-4 py-2 text-[14px] font-semibold bg-gold text-[color:var(--primary-foreground)] hover:opacity-90 rounded-lg transition"
                  >
                    Get started
                  </button>
                </>
              )}
            </div>

            {/* Mobile menu trigger */}
            <button
              type="button"
              onClick={() => setIsMenuOpen((v) => !v)}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
              className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-ink hover:bg-surface-2 transition-colors"
            >
              {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/*  Mobile sheet — full height, guaranteed on top, solid bg          */}
      {/* ------------------------------------------------------------------ */}
      {isMenuOpen && (
        <div
          className="lg:hidden fixed inset-x-0 top-16 bottom-0 z-40 bg-background overflow-y-auto overscroll-contain animate-slide-in"
        >
          <div className="container mx-auto px-4 py-5 space-y-6">
            {/* Theme row */}
            <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2">
              <span className="text-[13px] font-medium text-muted-foreground">
                Appearance
              </span>
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-background border border-border">
                <button
                  type="button"
                  onClick={() => setTheme(false)}
                  aria-pressed={!dark}
                  className={[
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-semibold transition-colors",
                    !dark
                      ? "bg-gold text-[color:var(--primary-foreground)]"
                      : "text-muted-foreground",
                  ].join(" ")}
                >
                  <Sun size={13} /> Light
                </button>
                <button
                  type="button"
                  onClick={() => setTheme(true)}
                  aria-pressed={dark}
                  className={[
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-semibold transition-colors",
                    dark
                      ? "bg-gold text-[color:var(--primary-foreground)]"
                      : "text-muted-foreground",
                  ].join(" ")}
                >
                  <Moon size={13} /> Dark
                </button>
              </div>
            </div>

            {/* Product */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-1 mb-2">
                Product
              </p>
              <div className="grid grid-cols-2 gap-1">
                {productItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => go(item.href)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left hover:bg-surface transition-colors"
                    >
                      <Icon className="h-4 w-4 text-primary-custom shrink-0" />
                      <span className="text-[13.5px] font-medium text-ink truncate">
                        {item.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Company */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-1 mb-2">
                Company
              </p>
              <div className="flex flex-col">
                {simpleLinks.map((link) => (
                  <button
                    key={link.name}
                    type="button"
                    onClick={() => go(link.href, link.external)}
                    className="flex items-center justify-between rounded-xl px-3 py-3 text-[14px] font-medium text-ink hover:bg-surface transition-colors"
                  >
                    <span>{link.name}</span>
                    {link.external && (
                      <Store className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Auth zone */}
            <div className="pt-4 border-t border-border">
              {loading ? (
                <div className="h-11 w-full rounded-xl bg-surface animate-pulse" />
              ) : isAuthenticated ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 rounded-xl bg-surface px-3 py-3">
                    {userData?.profile_picture ? (
                      <img
                        src={userData.profile_picture}
                        alt=""
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold text-[color:var(--primary-foreground)] text-[12px] font-bold">
                        {initials}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-semibold text-ink truncate">
                        {userData?.full_name || "Account"}
                      </p>
                      <p className="text-[12px] text-muted-foreground truncate">
                        {userData?.email || ""}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      router.push("/dashboard");
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[14px] font-semibold bg-gold text-[color:var(--primary-foreground)] hover:opacity-90 transition"
                  >
                    <LayoutDashboard size={15} />
                    Open dashboard
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[14px] font-semibold text-destructive hover:bg-destructive/5 transition"
                  >
                    <LogOut size={15} />
                    Log out
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      router.push("/auth/signup");
                    }}
                    className="w-full rounded-xl py-3 text-[14px] font-semibold bg-gold text-[color:var(--primary-foreground)] hover:opacity-90 transition"
                  >
                    Get started
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      router.push("/auth/login");
                    }}
                    className="w-full rounded-xl py-3 text-[14px] font-medium text-ink border border-border hover:bg-surface transition"
                  >
                    Sign in
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}