"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, X, Sun, Moon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "../ThemeProvider";
import { useUserContextData } from "../../context/userData";

const navLinks = [
  { name: "Features", href: "tools" },
  { name: "Banking", href: "banking" },
  { name: "Console", href: "console" },
  { name: "Pricing", href: "pricing" },
  { name: "FAQ", href: "faq" },
];

export function Nav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { userData } = useUserContextData();
  const isLoggedIn = !!userData?.id;
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    const onScroll = () => setHasScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("overflow-hidden", isMenuOpen);
    return () => document.body.classList.remove("overflow-hidden");
  }, [isMenuOpen]);

  const go = (href: string) => {
    const el = document.getElementById(href);
    if (el) {
      const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top: y, behavior: "smooth" });
    } else {
      router.push(`/#${href}`);
    }
    setIsMenuOpen(false);
  };

  return (
    <header
      className={`sticky top-0 z-50 h-14 border-b transition-colors duration-300 ${
        hasScrolled
          ? "bg-background/80 backdrop-blur-xl border-border/40"
          : "bg-background border-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 h-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <Image
              src="/logo.png"
              alt="Zidwell"
              width={32}
              height={26}
              className="w-8 object-contain"
            />
            <span className="text-lg font-bold tracking-tight uppercase font-display">
              Zidwell
            </span>
          </Link>
          <span className="hidden sm:inline text-[10px] text-muted-foreground font-mono">
            v2.4 · Lagos
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-7 text-sm">
          {navLinks.map((l) => (
            <button
              key={l.name}
              onClick={() => go(l.href)}
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {l.name}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label="Toggle theme"
            className="hidden md:flex h-9 w-9 items-center justify-center rounded-full hover:bg-surface transition cursor-pointer"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {isLoggedIn ? (
            <button
              onClick={() => router.push("/dashboard")}
              className="hidden sm:inline-flex items-center text-sm font-medium px-4 py-2 rounded-full bg-gold text-ink hover:opacity-90 transition cursor-pointer"
            >
              Dashboard
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => router.push("/auth/login")}
                className="text-sm font-medium px-3 py-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Log in
              </button>
              <button
                onClick={() => router.push("/auth/signup")}
                className="text-sm font-medium px-4 py-2 rounded-full bg-gold text-ink hover:opacity-90 transition cursor-pointer"
              >
                Start free
              </button>
            </div>
          )}

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden h-9 w-9 flex items-center justify-center rounded-full border border-border cursor-pointer"
            aria-label="Menu"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t border-border bg-background px-5 py-4">
          {navLinks.map((l) => (
            <button
              key={l.name}
              onClick={() => go(l.href)}
              className="block w-full text-left py-3 text-sm font-medium text-foreground cursor-pointer"
            >
              {l.name}
            </button>
          ))}
          <div className="mt-4 pt-4 border-t border-border">
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="w-full py-3 text-sm rounded-full border border-border flex items-center justify-center gap-2 cursor-pointer"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
              {isDark ? "Light mode" : "Dark mode"}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}