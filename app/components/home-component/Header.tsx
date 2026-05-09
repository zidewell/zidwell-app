"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Users, X, Sun, Moon, Laptop } from "lucide-react";
import Link from "next/link";
import { useUserContextData } from "@/app/context/userData";
import { Button } from "../ui/button";
import Image from "next/image";
import { useTheme } from "@/app/components/ThemeProvider";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const { user } = useUserContextData();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

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

  const navLinks = [
    { name: "Invoice", href: "/features/invoice" },
    { name: "Receipt", href: "/features/receipt" },
    { name: "Contract", href: "/features/contract" },
    { name: "Blog", href: "/blog" },
    { name: "FAQ", href: "faq" },
    { name: "Contact", href: "contact" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        hasScrolled
          ? "bg-(--bg-primary)/80 backdrop-blur-md border-b border-(--border-color) shadow-soft"
          : "bg-(--bg-primary) border-b border-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <Image
              src="/logo.png"
              alt="Zidwell Logo"
              width={49}
              height={40}
              className="w-10 object-contain transition-transform group-hover:scale-105"
            />
            <span className="text-xl font-bold tracking-tight text-(--text-primary) uppercase">
              Zidwell
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleNavigation(link.href)}
                className="font-medium text-(--text-secondary) hover:text-(--text-primary) transition-colors relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-(--color-accent-yellow) transition-all duration-300 group-hover:w-full" />
              </button>
            ))}
          </nav>

          {/* Right Section - Theme Toggle & Auth Buttons */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <div className="hidden md:flex items-center gap-1 p-1 bg-(--bg-secondary) rounded-xl">
              <button
                onClick={() => setTheme("light")}
                className={`p-2 rounded-lg transition-all ${
                  theme === "light"
                    ? "bg-(--color-accent-yellow) text-(--color-ink)"
                    : "text-(--text-secondary) hover:bg-(--bg-secondary)"
                }`}
                aria-label="Light mode"
              >
                <Sun size={18} />
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`p-2 rounded-lg transition-all ${
                  theme === "dark"
                    ? "bg-(--color-accent-yellow) text-(--color-ink)"
                    : "text-(--text-secondary) hover:bg-(--bg-secondary)"
                }`}
                aria-label="Dark mode"
              >
                <Moon size={18} />
              </button>
            </div>

            {/* Auth Buttons */}
            {user ? (
              <Button
                onClick={() => router.push("/dashboard")}
                size="sm"
                className="bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90 rounded-xl"
              >
                Dashboard
              </Button>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <Button
                  variant="ghost"
                  onClick={() => router.push("/auth/login")}
                  size="sm"
                  className="text-(--text-primary) hover:bg-(--bg-secondary) rounded-xl"
                >
                  Log In
                </Button>
                <Button
                  variant="default"
                  onClick={() => router.push("/auth/signup")}
                  size="sm"
                  className="bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90 rounded-xl"
                >
                  Get Started Free
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-xl border border-(--border-color) bg-(--bg-secondary) text-(--text-primary)"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-(--border-color) animate-slide-in">
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => handleNavigation(link.href)}
                  className="w-full text-left font-medium text-(--text-secondary) hover:text-(--text-primary) transition-colors py-2"
                >
                  {link.name}
                </button>
              ))}

              {/* Mobile Theme Toggle */}
              <div className="flex items-center gap-2 pt-4 border-t border-(--border-color)">
                <span className="text-sm text-(--text-secondary)">
                  Theme:
                </span>
                <div className="flex items-center gap-1 p-1 bg-(--bg-secondary) rounded-xl">
                  <button
                    onClick={() => setTheme("light")}
                    className={`p-2 rounded-lg transition-all ${
                      theme === "light"
                        ? "bg-(--color-accent-yellow) text-(--color-ink)"
                        : "text-(--text-secondary) hover:bg-(--bg-secondary)"
                    }`}
                  >
                    <Sun size={16} />
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={`p-2 rounded-lg transition-all ${
                      theme === "dark"
                        ? "bg-(--color-accent-yellow) text-(--color-ink)"
                        : "text-(--text-secondary) hover:bg-(--bg-secondary)"
                    }`}
                  >
                    <Moon size={16} />
                  </button>
                </div>
              </div>

              {/* Auth Section Mobile */}
              <div className="flex flex-col gap-3 pt-4">
                {user ? (
                  <Button
                    onClick={() => {
                      router.push("/dashboard");
                      setIsMenuOpen(false);
                    }}
                    className="w-full bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90 rounded-xl"
                  >
                    Dashboard
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      className="w-full justify-center text-(--text-primary) hover:bg-(--bg-secondary) rounded-xl"
                      onClick={() => {
                        router.push("/auth/login");
                        setIsMenuOpen(false);
                      }}
                    >
                      Log In
                    </Button>
                    <Button
                      variant="default"
                      className="w-full justify-center bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90 rounded-xl"
                      onClick={() => {
                        router.push("/auth/signup");
                        setIsMenuOpen(false);
                      }}
                    >
                      Get Started Free
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;