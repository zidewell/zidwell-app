"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Sun, Moon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export function Nav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [dark, setDark] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Theme handling
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored === "dark" || (stored === null && prefersDark);
    setDark(isDark);
  }, []);

  const toggleTheme = () => {
    const newDark = !dark;
    setDark(newDark);
    const root = document.documentElement;
    if (newDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        hasScrolled
          ? "bg-[oklch(1_0_0)]/80 dark:bg-[oklch(0.14_0_0)]/80 backdrop-blur-md border-b border-[oklch(0.85_0_0)] dark:border-[oklch(1_0_0)_/_12%] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.08)]"
          : "bg-[oklch(1_0_0)] dark:bg-[oklch(0.14_0_0)] border-b border-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/logo.png"
              alt="Zidwell Logo"
              width={49}
              height={40}
              className="w-10 object-contain transition-transform group-hover:scale-105"
            />
            <span className="text-xl font-bold tracking-tight text-[oklch(0.17_0_0)] dark:text-[oklch(0.98_0_0)] font-['Space_Grotesk','Cy_Grotesk_Key',system-ui,sans-serif] uppercase">
              Zidwell
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleNavigation(link.href)}
                className="font-medium text-[oklch(0.5_0_0)] dark:text-[oklch(0.7_0_0)] hover:text-[oklch(0.17_0_0)] dark:hover:text-[oklch(0.98_0_0)] transition-colors relative group font-['Be_Vietnam_Pro',system-ui,sans-serif]"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[oklch(0.84_0.16_88)] transition-all duration-300 group-hover:w-full" />
              </button>
            ))}
          </nav>

          {/* Right Section - Theme Toggle & Auth Buttons */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <div className="hidden md:flex items-center gap-1 p-1 bg-[oklch(0.97_0_0)] dark:bg-[oklch(0.18_0_0)] rounded-xl">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-all ${
                  !dark
                    ? "bg-[oklch(0.84_0.16_88)] text-[oklch(0.17_0_0)]"
                    : "text-[oklch(0.5_0_0)] dark:text-[oklch(0.7_0_0)] hover:bg-[oklch(0.97_0_0)] dark:hover:bg-[oklch(0.18_0_0)]"
                }`}
                aria-label="Light mode"
              >
                <Sun size={18} />
              </button>
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-all ${
                  dark
                    ? "bg-[oklch(0.84_0.16_88)] text-[oklch(0.17_0_0)]"
                    : "text-[oklch(0.5_0_0)] dark:text-[oklch(0.7_0_0)] hover:bg-[oklch(0.97_0_0)] dark:hover:bg-[oklch(0.18_0_0)]"
                }`}
                aria-label="Dark mode"
              >
                <Moon size={18} />
              </button>
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => router.push("/auth/login")}
                className="px-4 py-2 text-sm font-semibold text-[oklch(0.17_0_0)] dark:text-[oklch(0.98_0_0)] hover:bg-[oklch(0.97_0_0)] dark:hover:bg-[oklch(0.18_0_0)] rounded-xl transition font-['Be_Vietnam_Pro',system-ui,sans-serif]"
              >
                Log In
              </button>
              <button
                onClick={() => router.push("/auth/signup")}
                className="px-4 py-2 text-sm font-semibold bg-[oklch(0.84_0.16_88)] text-[oklch(0.17_0_0)] hover:bg-[oklch(0.84_0.16_88)]/90 rounded-xl transition font-['Be_Vietnam_Pro',system-ui,sans-serif]"
              >
                Get Started Free
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-xl border border-[oklch(0.85_0_0)] dark:border-[oklch(1_0_0)_/_12%] bg-[oklch(0.97_0_0)] dark:bg-[oklch(0.18_0_0)] text-[oklch(0.17_0_0)] dark:text-[oklch(0.98_0_0)]"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-[oklch(0.85_0_0)] dark:border-[oklch(1_0_0)_/_12%] animate-slide-in">
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => handleNavigation(link.href)}
                  className="w-full text-left font-medium text-[oklch(0.5_0_0)] dark:text-[oklch(0.7_0_0)] hover:text-[oklch(0.17_0_0)] dark:hover:text-[oklch(0.98_0_0)] transition-colors py-2 font-['Be_Vietnam_Pro',system-ui,sans-serif]"
                >
                  {link.name}
                </button>
              ))}

              {/* Mobile Theme Toggle */}
              <div className="flex items-center gap-2 pt-4 border-t border-[oklch(0.85_0_0)] dark:border-[oklch(1_0_0)_/_12%]">
                <span className="text-sm text-[oklch(0.5_0_0)] dark:text-[oklch(0.7_0_0)] font-['Be_Vietnam_Pro',system-ui,sans-serif]">Theme:</span>
                <div className="flex items-center gap-1 p-1 bg-[oklch(0.97_0_0)] dark:bg-[oklch(0.18_0_0)] rounded-xl">
                  <button
                    onClick={toggleTheme}
                    className={`p-2 rounded-lg transition-all ${
                      !dark
                        ? "bg-[oklch(0.84_0.16_88)] text-[oklch(0.17_0_0)]"
                        : "text-[oklch(0.5_0_0)] dark:text-[oklch(0.7_0_0)] hover:bg-[oklch(0.97_0_0)] dark:hover:bg-[oklch(0.18_0_0)]"
                    }`}
                  >
                    <Sun size={16} />
                  </button>
                  <button
                    onClick={toggleTheme}
                    className={`p-2 rounded-lg transition-all ${
                      dark
                        ? "bg-[oklch(0.84_0.16_88)] text-[oklch(0.17_0_0)]"
                        : "text-[oklch(0.5_0_0)] dark:text-[oklch(0.7_0_0)] hover:bg-[oklch(0.97_0_0)] dark:hover:bg-[oklch(0.18_0_0)]"
                    }`}
                  >
                    <Moon size={16} />
                  </button>
                </div>
              </div>

              {/* Auth Section Mobile */}
              <div className="flex flex-col gap-3 pt-4">
                <button
                  className="w-full justify-center text-[oklch(0.17_0_0)] dark:text-[oklch(0.98_0_0)] hover:bg-[oklch(0.97_0_0)] dark:hover:bg-[oklch(0.18_0_0)] rounded-xl py-2 font-['Be_Vietnam_Pro',system-ui,sans-serif]"
                  onClick={() => {
                    router.push("/auth/login");
                    setIsMenuOpen(false);
                  }}
                >
                  Log In
                </button>
                <button
                  className="w-full justify-center bg-[oklch(0.84_0.16_88)] text-[oklch(0.17_0_0)] hover:bg-[oklch(0.84_0.16_88)]/90 rounded-xl py-2 font-['Be_Vietnam_Pro',system-ui,sans-serif]"
                  onClick={() => {
                    router.push("/auth/signup");
                    setIsMenuOpen(false);
                  }}
                >
                  Get Started Free
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}