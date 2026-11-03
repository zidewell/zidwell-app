// app/components/home-component/Nav.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  Sun,
  Moon,
  LayoutDashboard,
  LogOut,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useUserContextData } from "@/app/context/userData";

const ZIDSTORE_HOST = process.env.NEXT_PUBLIC_ZIDSTORE_HOST;
const zidStore =
  process.env.NODE_ENV === "development" || !ZIDSTORE_HOST
    ? { href: "/online-store", external: false }
    : { href: `https://${ZIDSTORE_HOST}`, external: true };

const navLinks = [
  { name: "Invoice", href: "/features/invoice", external: false },
  { name: "Receipt", href: "/features/receipt", external: false },
  { name: "Schools", href: "/schools", external: false },
  { name: "ZidStore", href: zidStore.href, external: zidStore.external },
  { name: "Blog", href: "/blog", external: false },
  { name: "Contact", href: "contact", external: false },
];

export function Nav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [dark, setDark] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { userData, loading, handleSessionExpired } = useUserContextData();

  const isAuthenticated = !!userData?.id;

  // ─── Theme init ───
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const isDark = stored === "dark" || (stored === null && prefersDark);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const setTheme = (isDark: boolean) => {
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
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

  // ─── Close profile menu on outside click ───
  useEffect(() => {
    if (!profileMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-profile-menu]")) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [profileMenuOpen]);

  const handleNavigation = (href: string, external = false) => {
    if (external) {
      window.open(href, "_blank", "noopener,noreferrer");
      setIsMenuOpen(false);
      return;
    }
    if (href.startsWith("/")) {
      router.push(href);
    } else {
      if (window.location.pathname === "/") {
        const el = document.getElementById(href);
        if (el) {
          const yOffset = -96;
          const y =
            el.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: "smooth" });
        }
      } else {
        router.push(`/#${href}`);
      }
    }
    setIsMenuOpen(false);
  };

  const handleGoToDashboard = () => {
    router.push("/dashboard");
    setIsMenuOpen(false);
    setProfileMenuOpen(false);
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
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleNavigation(link.href, link.external)}
                className="font-medium text-[oklch(0.5_0_0)] dark:text-[oklch(0.7_0_0)] hover:text-[oklch(0.17_0_0)] dark:hover:text-[oklch(0.98_0_0)] transition-colors relative group font-['Be_Vietnam_Pro',system-ui,sans-serif] py-2"
              >
                {link.name}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[oklch(0.84_0.16_88)] transition-all duration-300 group-hover:w-full" />
              </button>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Desktop — auth-aware */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Theme toggle */}
              <div className="flex items-center gap-1 p-1 bg-[oklch(0.97_0_0)] dark:bg-[oklch(0.18_0_0)] rounded-xl">
                <button
                  onClick={() => setTheme(false)}
                  className={`p-2 rounded-lg transition-all ${
                    !dark
                      ? "bg-[oklch(0.84_0.16_88)] text-[oklch(0.17_0_0)]"
                      : "text-[oklch(0.5_0_0)] dark:text-[oklch(0.7_0_0)] hover:bg-black/5 dark:hover:bg-white/10"
                  }`}
                  aria-label="Switch to light mode"
                  aria-pressed={!dark}
                >
                  <Sun size={18} />
                </button>
                <button
                  onClick={() => setTheme(true)}
                  className={`p-2 rounded-lg transition-all ${
                    dark
                      ? "bg-[oklch(0.84_0.16_88)] text-[oklch(0.17_0_0)]"
                      : "text-[oklch(0.5_0_0)] dark:text-[oklch(0.7_0_0)] hover:bg-black/5 dark:hover:bg-white/10"
                  }`}
                  aria-label="Switch to dark mode"
                  aria-pressed={dark}
                >
                  <Moon size={18} />
                </button>
              </div>

              {/* Auth-aware section */}
              {loading ? (
                <div className="h-9 w-44 rounded-xl bg-[oklch(0.97_0_0)] dark:bg-[oklch(0.18_0_0)] animate-pulse" />
              ) : isAuthenticated ? (
                <div className="flex items-center gap-2">
                  {/* ⭐ Dashboard button — always visible */}
                  <button
                    onClick={handleGoToDashboard}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-[oklch(0.84_0.16_88)] text-[oklch(0.17_0_0)] hover:bg-[oklch(0.84_0.16_88)]/90 rounded-xl transition font-['Be_Vietnam_Pro',system-ui,sans-serif]"
                  >
                    <LayoutDashboard size={16} />
                    Dashboard
                  </button>

                  {/* Avatar → dropdown */}
                  <div className="relative" data-profile-menu>
                    <button
                      onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-xl border border-[oklch(0.85_0_0)] dark:border-[oklch(1_0_0)_/_12%] bg-[oklch(0.97_0_0)] dark:bg-[oklch(0.18_0_0)] hover:bg-[oklch(0.94_0_0)] dark:hover:bg-[oklch(0.22_0_0)] transition"
                      aria-label="Open profile menu"
                      aria-expanded={profileMenuOpen}
                    >
                      {userData?.profile_picture ? (
                        <img
                          src={userData.profile_picture}
                          alt={firstName}
                          className="h-7 w-7 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[oklch(0.84_0.16_88)] text-[oklch(0.17_0_0)] text-xs font-bold">
                          {initials}
                        </span>
                      )}
                      <span className="text-sm font-semibold text-[oklch(0.17_0_0)] dark:text-[oklch(0.98_0_0)] font-['Be_Vietnam_Pro',system-ui,sans-serif]">
                        {firstName}
                      </span>
                      <ChevronDown
                        size={14}
                        className="text-[oklch(0.5_0_0)]"
                      />
                    </button>

                    {profileMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-[oklch(0.85_0_0)] dark:border-[oklch(1_0_0)_/_12%] bg-[oklch(1_0_0)] dark:bg-[oklch(0.16_0_0)] shadow-lg overflow-hidden">
                        <div className="px-4 py-3 border-b border-[oklch(0.9_0_0)] dark:border-[oklch(1_0_0)_/_8%]">
                          <p className="text-sm font-bold text-[oklch(0.17_0_0)] dark:text-[oklch(0.98_0_0)] truncate">
                            {userData?.full_name || "Account"}
                          </p>
                          <p className="text-xs text-[oklch(0.5_0_0)] dark:text-[oklch(0.7_0_0)] truncate">
                            {userData?.email || ""}
                          </p>
                        </div>
                        <button
                          onClick={handleGoToDashboard}
                          className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-[oklch(0.17_0_0)] dark:text-[oklch(0.98_0_0)] hover:bg-[oklch(0.97_0_0)] dark:hover:bg-[oklch(0.2_0_0)] transition"
                        >
                          <LayoutDashboard size={16} />
                          Dashboard
                        </button>
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition border-t border-[oklch(0.9_0_0)] dark:border-[oklch(1_0_0)_/_8%]"
                        >
                          <LogOut size={16} />
                          Log out
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>

            {/* Hamburger */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-xl border border-[oklch(0.85_0_0)] dark:border-[oklch(1_0_0)_/_12%] bg-[oklch(0.97_0_0)] dark:bg-[oklch(0.18_0_0)] text-[oklch(0.17_0_0)] dark:text-[oklch(0.98_0_0)]"
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-[oklch(0.85_0_0)] dark:border-[oklch(1_0_0)_/_12%] animate-slide-in max-h-[calc(100vh-5rem)] overflow-y-auto">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => handleNavigation(link.href, link.external)}
                  className="w-full text-left text-sm font-medium text-[oklch(0.5_0_0)] dark:text-[oklch(0.7_0_0)] hover:text-[oklch(0.17_0_0)] dark:hover:text-[oklch(0.98_0_0)] transition-colors py-2 font-['Be_Vietnam_Pro',system-ui,sans-serif]"
                >
                  {link.name}
                </button>
              ))}

              {/* Theme toggle */}
              <div className="pt-4 mt-2 border-t border-[oklch(0.85_0_0)] dark:border-[oklch(1_0_0)_/_12%]">
                <p className="text-xs font-semibold uppercase tracking-wide text-[oklch(0.5_0_0)] dark:text-[oklch(0.7_0_0)] mb-2 font-['Be_Vietnam_Pro',system-ui,sans-serif]">
                  Theme
                </p>
                <div
                  role="group"
                  aria-label="Theme selection"
                  className="grid grid-cols-2 gap-2 p-1 bg-[oklch(0.97_0_0)] dark:bg-[oklch(0.18_0_0)] rounded-xl"
                >
                  <button
                    onClick={() => setTheme(false)}
                    aria-pressed={!dark}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      !dark
                        ? "bg-[oklch(0.84_0.16_88)] text-[oklch(0.17_0_0)] shadow-sm"
                        : "text-[oklch(0.5_0_0)] dark:text-[oklch(0.7_0_0)] hover:text-[oklch(0.17_0_0)] dark:hover:text-[oklch(0.98_0_0)]"
                    }`}
                  >
                    <Sun size={16} />
                    Light
                  </button>
                  <button
                    onClick={() => setTheme(true)}
                    aria-pressed={dark}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      dark
                        ? "bg-[oklch(0.84_0.16_88)] text-[oklch(0.17_0_0)] shadow-sm"
                        : "text-[oklch(0.5_0_0)] dark:text-[oklch(0.7_0_0)] hover:text-[oklch(0.17_0_0)] dark:hover:text-[oklch(0.98_0_0)]"
                    }`}
                  >
                    <Moon size={16} />
                    Dark
                  </button>
                </div>
              </div>

              {/* Auth — mobile */}
              <div className="flex flex-col gap-3 pt-4 border-t border-[oklch(0.85_0_0)] dark:border-[oklch(1_0_0)_/_12%]">
                {loading ? (
                  <div className="h-10 w-full rounded-xl bg-[oklch(0.97_0_0)] dark:bg-[oklch(0.18_0_0)] animate-pulse" />
                ) : isAuthenticated ? (
                  <>
                    {/* ⭐ Dashboard button — always visible on mobile too */}
                    <button
                      onClick={handleGoToDashboard}
                      className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold bg-[oklch(0.84_0.16_88)] text-[oklch(0.17_0_0)] hover:bg-[oklch(0.84_0.16_88)]/90 transition font-['Be_Vietnam_Pro',system-ui,sans-serif]"
                    >
                      <LayoutDashboard size={16} />
                      Dashboard
                    </button>

                    {/* Profile card */}
                    <button
                      onClick={handleGoToDashboard}
                      className="flex items-center gap-3 w-full text-left px-3 py-3 rounded-xl bg-[oklch(0.97_0_0)] dark:bg-[oklch(0.18_0_0)] hover:bg-[oklch(0.94_0_0)] dark:hover:bg-[oklch(0.22_0_0)] transition"
                    >
                      {userData?.profile_picture ? (
                        <img
                          src={userData.profile_picture}
                          alt={firstName}
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[oklch(0.84_0.16_88)] text-[oklch(0.17_0_0)] text-sm font-bold">
                          {initials}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[oklch(0.17_0_0)] dark:text-[oklch(0.98_0_0)] truncate">
                          {userData?.full_name || "Account"}
                        </p>
                        <p className="text-xs text-[oklch(0.5_0_0)] dark:text-[oklch(0.7_0_0)] truncate">
                          {userData?.email || ""}
                        </p>
                      </div>
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition font-['Be_Vietnam_Pro',system-ui,sans-serif]"
                    >
                      <LogOut size={16} />
                      Log out
                    </button>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}