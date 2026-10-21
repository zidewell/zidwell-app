// app/components/home-component/Nav.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Sun, Moon, ChevronDown } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const featureLinks = [
  { name: "Invoice", href: "/features/invoice" },
  { name: "Receipt", href: "/features/receipt" },
  { name: "Schools", href: "/schools" },
  { name: "ZidStore", href: "/online-store", isNew: true },
  { name: "Blog", href: "/blog" },
  { name: "Contact", href: "contact" },
];

// Landing page section anchors
const sectionLinks = [
  { name: "How it works", href: "how" },
  { name: "Toolkit", href: "tools" },
  { name: "Banking", href: "banking" },
  { name: "Console", href: "console" },
  { name: "Pricing", href: "pricing" },
  { name: "FAQ", href: "faq" },
];

export function Nav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [dark, setDark] = useState(false);
  const [isFeaturesOpen, setIsFeaturesOpen] = useState(false);
  const [isMobileFeaturesOpen, setIsMobileFeaturesOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
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

  // Close the desktop dropdown when clicking outside
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsFeaturesOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleNavigation = (href: string) => {
    if (href.startsWith("/")) {
      router.push(href);
    } else {
      // Section anchor
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
    setIsFeaturesOpen(false);
  };

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
          <nav className="hidden lg:flex items-center gap-7">
            {/* Features dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsFeaturesOpen((v) => !v)}
                onMouseEnter={() => setIsFeaturesOpen(true)}
                className="flex items-center gap-1 font-medium text-[oklch(0.5_0_0)] dark:text-[oklch(0.7_0_0)] hover:text-[oklch(0.17_0_0)] dark:hover:text-[oklch(0.98_0_0)] transition-colors relative group font-['Be_Vietnam_Pro',system-ui,sans-serif] py-2"
                aria-expanded={isFeaturesOpen}
                aria-haspopup="menu"
              >
                Features
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${
                    isFeaturesOpen ? "rotate-180" : ""
                  }`}
                />
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[oklch(0.84_0.16_88)] transition-all duration-300 group-hover:w-full" />
              </button>

              {isFeaturesOpen && (
                <div
                  onMouseLeave={() => setIsFeaturesOpen(false)}
                  className="absolute left-0 top-full mt-3 w-64 rounded-2xl border border-[oklch(0.85_0_0)] dark:border-[oklch(1_0_0)_/_12%] bg-[oklch(1_0_0)] dark:bg-[oklch(0.14_0_0)] shadow-[0_8px_24px_-8px_rgba(0,0,0,0.15)] p-2"
                  role="menu"
                >
                  {featureLinks.map((link) => (
                    <button
                      key={link.name}
                      onClick={() => handleNavigation(link.href)}
                      className="w-full flex items-center justify-between gap-2 text-left px-3 py-2.5 rounded-xl text-sm font-medium text-[oklch(0.5_0_0)] dark:text-[oklch(0.7_0_0)] hover:bg-[oklch(0.97_0_0)] dark:hover:bg-[oklch(0.18_0_0)] hover:text-[oklch(0.17_0_0)] dark:hover:text-[oklch(0.98_0_0)] transition-colors font-['Be_Vietnam_Pro',system-ui,sans-serif]"
                      role="menuitem"
                    >
                      <span>{link.name}</span>
                      {link.isNew && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide bg-[oklch(0.84_0.16_88)] text-[oklch(0.17_0_0)] px-1.5 py-0.5 rounded-md">
                          New
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Landing page section links */}
            {sectionLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleNavigation(link.href)}
                className="font-medium text-[oklch(0.5_0_0)] dark:text-[oklch(0.7_0_0)] hover:text-[oklch(0.17_0_0)] dark:hover:text-[oklch(0.98_0_0)] transition-colors relative group font-['Be_Vietnam_Pro',system-ui,sans-serif] py-2 whitespace-nowrap"
              >
                {link.name}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[oklch(0.84_0.16_88)] transition-all duration-300 group-hover:w-full" />
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
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-[oklch(0.85_0_0)] dark:border-[oklch(1_0_0)_/_12%] animate-slide-in max-h-[calc(100vh-5rem)] overflow-y-auto">
            <nav className="flex flex-col gap-1">
              {/* Features accordion */}
              <button
                onClick={() => setIsMobileFeaturesOpen((v) => !v)}
                className="w-full flex items-center justify-between text-left font-medium text-[oklch(0.5_0_0)] dark:text-[oklch(0.7_0_0)] hover:text-[oklch(0.17_0_0)] dark:hover:text-[oklch(0.98_0_0)] transition-colors py-2 font-['Be_Vietnam_Pro',system-ui,sans-serif]"
                aria-expanded={isMobileFeaturesOpen}
              >
                Features
                <ChevronDown
                  size={18}
                  className={`transition-transform duration-200 ${
                    isMobileFeaturesOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isMobileFeaturesOpen && (
                <div className="ml-4 pl-3 border-l border-[oklch(0.85_0_0)] dark:border-[oklch(1_0_0)_/_12%] flex flex-col gap-1 mb-2">
                  {featureLinks.map((link) => (
                    <button
                      key={link.name}
                      onClick={() => handleNavigation(link.href)}
                      className="w-full flex items-center justify-between gap-2 text-left text-sm font-medium text-[oklch(0.5_0_0)] dark:text-[oklch(0.7_0_0)] hover:text-[oklch(0.17_0_0)] dark:hover:text-[oklch(0.98_0_0)] transition-colors py-2 font-['Be_Vietnam_Pro',system-ui,sans-serif]"
                    >
                      <span>{link.name}</span>
                      {link.isNew && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide bg-[oklch(0.84_0.16_88)] text-[oklch(0.17_0_0)] px-1.5 py-0.5 rounded-md">
                          New
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Landing page section links */}
              <div className="pt-2 border-t border-[oklch(0.85_0_0)] dark:border-[oklch(1_0_0)_/_12%] flex flex-col gap-1">
                {sectionLinks.map((link) => (
                  <button
                    key={link.name}
                    onClick={() => handleNavigation(link.href)}
                    className="w-full text-left text-sm font-medium text-[oklch(0.5_0_0)] dark:text-[oklch(0.7_0_0)] hover:text-[oklch(0.17_0_0)] dark:hover:text-[oklch(0.98_0_0)] transition-colors py-2 font-['Be_Vietnam_Pro',system-ui,sans-serif]"
                  >
                    {link.name}
                  </button>
                ))}
              </div>

              {/* Mobile Theme Toggle */}
              <div className="flex items-center gap-2 pt-4 border-t border-[oklch(0.85_0_0)] dark:border-[oklch(1_0_0)_/_12%]">
                <span className="text-sm text-[oklch(0.5_0_0)] dark:text-[oklch(0.7_0_0)] font-['Be_Vietnam_Pro',system-ui,sans-serif]">
                  Theme:
                </span>
                <div className="flex items-center gap-1 p-1 bg-[oklch(0.97_0_0)] dark:bg-[oklch(0.18_0_0)] rounded-xl">
                  <button
                    onClick={toggleTheme}
                    className={`p-2 rounded-lg transition-all ${
                      !dark
                        ? "bg-[oklch(0.84_0.16_88)] text-[oklch(0.17_0_0)]"
                        : "text-[oklch(0.5_0_0)] dark:text-[oklch(0.7_0_0)] hover:bg-[oklch(0.97_0_0)] dark:hover:bg-[oklch(0.18_0_0)]"
                    }`}
                    aria-label="Light mode"
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
                    aria-label="Dark mode"
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