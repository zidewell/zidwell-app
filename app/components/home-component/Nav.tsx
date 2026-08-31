"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Sun, Moon, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "../ThemeProvider";
import { useUserContextData } from "../../context/userData";

export function Nav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [dark, setDark] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { userData } = useUserContextData();
  const isLoggedIn = !!userData?.id;

  useEffect(() => {
    setDark(resolvedTheme === "dark");
  }, [resolvedTheme]);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  useEffect(() => {
    const handleScroll = () => setHasScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("overflow-hidden", isMenuOpen);
    return () => document.body.classList.remove("overflow-hidden");
  }, [isMenuOpen]);

  const handleNavigation = (href: string) => {
    if (href.startsWith("/")) {
      router.push(href);
    } else {
      if (window.location.pathname === "/") {
        const el = document.getElementById(href);
        if (el) {
          const yOffset = -96;
          const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: "smooth" });
        }
      } else {
        router.push(`/#${href}`);
      }
    }
    setIsMenuOpen(false);
  };

  const navLinks = [
    { name: "Invoice", href: "/features/invoice" },
    { name: "Receipt", href: "/features/receipt" },
    { name: "Schools", href: "/schools" },
    { name: "Blog", href: "/blog" },
    { name: "Contact", href: "contact" },
  ];

  return (
    <header
      className={`sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/60 transition-all duration-300 ${
        hasScrolled ? "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.08)]" : ""
      }`}
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="h-7 w-7 rounded-xl bg-ink flex items-center justify-center">
            <span className="h-2.5 w-2.5 rounded-sm bg-gold" />
          </span>
          <span className="font-display font-semibold tracking-tight text-foreground">Zidwell</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          {navLinks.map((link) => (
            <button
              key={link.name}
              onClick={() => handleNavigation(link.href)}
              className="hover:text-foreground transition font-['Be_Vietnam_Pro',system-ui,sans-serif]"
            >
              {link.name}
            </button>
          ))}
        </nav>

        {/* Right Section - Theme Toggle & Auth Buttons */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <div className="hidden md:flex items-center gap-1 p-1 bg-surface rounded-xl">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-all ${
                !dark
                  ? "bg-gold text-ink"
                  : "text-muted-foreground hover:bg-surface transition"
              }`}
              aria-label="Light mode"
            >
              <Sun size={18} />
            </button>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-all ${
                dark
                  ? "bg-gold text-ink"
                  : "text-muted-foreground hover:bg-surface transition"
              }`}
              aria-label="Dark mode"
            >
              <Moon size={18} />
            </button>
          </div>

          {/* Auth Buttons - conditional based on login state */}
          {isLoggedIn ? (
            <a
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full bg-ink text-background hover:opacity-90 transition font-['Be_Vietnam_Pro',system-ui,sans-serif]"
            >
              Dashboard <ArrowRight className="h-4 w-4" />
            </a>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push("/auth/login")}
                className="hidden sm:inline-flex items-center text-sm font-medium px-4 py-2 rounded-full hover:bg-surface transition font-['Be_Vietnam_Pro',system-ui,sans-serif] text-foreground"
              >
                Log In
              </button>
              <a
                href="/auth/signup"
                className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full bg-ink text-background hover:opacity-90 transition font-['Be_Vietnam_Pro',system-ui,sans-serif]"
              >
                Sign Up <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-xl border border-border bg-surface text-foreground"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden px-4 py-4 border-t border-border/60 animate-slide-in">
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleNavigation(link.href)}
                className="w-full text-left font-medium text-muted-foreground hover:text-foreground transition-colors py-3 px-4 rounded-lg hover:bg-surface font-['Be_Vietnam_Pro',system-ui,sans-serif]"
              >
                {link.name}
              </button>
            ))}

            {/* Mobile Dashboard button when logged in */}
            {isLoggedIn && (
              <a
                href="/dashboard"
                className="w-full text-left font-medium text-foreground transition-colors py-3 px-4 rounded-lg bg-ink text-background hover:opacity-90 font-['Be_Vietnam_Pro',system-ui,sans-serif] flex items-center justify-between"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard <ArrowRight className="h-4 w-4" />
              </a>
            )}

            {/* Mobile Log In button when NOT logged in */}
            {!isLoggedIn && (
              <button
                onClick={() => {
                  router.push("/auth/login");
                  setIsMenuOpen(false);
                }}
                className="w-full text-left font-medium text-foreground transition-colors py-3 px-4 rounded-lg hover:bg-surface font-['Be_Vietnam_Pro',system-ui,sans-serif]"
              >
                Log In
              </button>
            )}

            {/* Mobile Theme Toggle */}
            <div className="flex items-center gap-2 pt-4 border-t border-border/60">
              <span className="text-sm text-muted-foreground font-['Be_Vietnam_Pro',system-ui,sans-serif]">Theme:</span>
              <div className="flex items-center gap-1 p-1 bg-surface rounded-xl">
                <button
                  onClick={toggleTheme}
                  className={`p-2 rounded-lg transition-all ${
                    !dark ? "bg-gold text-ink" : "text-muted-foreground hover:bg-surface transition"
                  }`}
                >
                  <Sun size={16} />
                </button>
                <button
                  onClick={toggleTheme}
                  className={`p-2 rounded-lg transition-all ${
                    dark ? "bg-gold text-ink" : "text-muted-foreground hover:bg-surface transition"
                  }`}
                >
                  <Moon size={16} />
                </button>
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}