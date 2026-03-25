"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useUserContextData } from "@/app/context/userData";
import { Button } from "../ui/button";
import { Button2 } from "../ui/button2";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const { user } = useUserContextData();
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
      // Regular route
      router.push(href);
    } else {
      // Anchor link
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        hasScrolled
          ? "bg-[#f7f0e5]/80 dark:bg-[#01402e]/80 backdrop-blur-md border-b-2 border-[#01402e] dark:border-[#f7f0e5]"
          : "bg-[#f7f0e5] dark:bg-[#01402e] border-b border-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link
            href={pathname === "/app" ? "/app" : "/"}
            className="flex items-center gap-2"
          >
            <div className="w-10 h-10 border-2 border-[#01402e] dark:border-[#f7f0e5] shadow-[4px_4px_0px_#01402e] dark:shadow-[4px_4px_0px_#f4c600] flex items-center justify-center">
              <span className="text-[#01402e] font-black text-xl">Z</span>
            </div>
            <span className="font-black text-xl tracking-tight text-[#01402e] dark:text-[#f7f0e5]">
              Zidwell
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleNavigation(link.href)}
                className="font-medium text-[#01402e]/80 dark:text-[#f7f0e5]/80 hover:text-[#01402e] dark:hover:text-[#f7f0e5] transition-colors relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#f4c600] transition-all group-hover:w-full" />
              </button>
            ))}
          </nav>

          {/* Auth Buttons */}
          {user ? (
            <div className="hidden md:flex items-center gap-3">
              <Button2
                onClick={() => router.push("/dashboard")}
                size="sm"
              >
                Dashboard
              </Button2>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-3">
              <Button2
                variant="ghost"
                onClick={() => router.push("/auth/login")}
                size="sm"
              >
                Log In
              </Button2>
              <Button2
                variant="default"
                onClick={() => router.push("/auth/signup")}
                size="sm"
              >
                Get Started Free
              </Button2>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 border-2 border-[#01402e] dark:border-[#f7f0e5] shadow-[4px_4px_0px_#01402e] dark:shadow-[4px_4px_0px_#f4c600] bg-[#f7f0e5] dark:bg-[#01402e]"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-[#01402e]/20 dark:border-[#f7f0e5]/20">
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => handleNavigation(link.href)}
                  className="w-full text-left font-medium text-[#01402e]/80 dark:text-[#f7f0e5]/80 hover:text-[#01402e] dark:hover:text-[#f7f0e5] transition-colors py-2"
                >
                  {link.name}
                </button>
              ))}

              {/* Auth Section */}
              <div className="flex flex-col gap-3 pt-4">
                {user ? (
                  <Button2
                    onClick={() => {
                      router.push("/dashboard");
                      setIsMenuOpen(false);
                    }}
                    className="w-full"
                  >
                    Dashboard
                  </Button2>
                ) : (
                  <>
                    <Button2
                      variant="ghost"
                      className="w-full justify-center"
                      onClick={() => {
                        router.push("/auth/login");
                        setIsMenuOpen(false);
                      }}
                    >
                      Log In
                    </Button2>
                    <Button2
                      variant="default"
                      className="w-full justify-center"
                      onClick={() => {
                        router.push("/auth/signup");
                        setIsMenuOpen(false);
                      }}
                    >
                      Get Started Free
                    </Button2>
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