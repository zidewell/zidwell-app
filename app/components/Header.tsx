"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useUserContextData } from "../context/userData";
import { Button2 } from "./ui/button2";

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
    { name: "Contract", href: "/features/contract" },
    { name: "Blog", href: "/blog" },
    { name: "FAQ", href: "faq" },
    { name: "Contact", href: "contact" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-gray-50/80 dark:bg-gray-950/80 backdrop-blur-md transition-all duration-200 ${
        hasScrolled
          ? "border-b-2 border-gray-900 dark:border-gray-50"
          : "border-b border-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href={pathname === "/app" ? "/app" : "/"} className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Zidwell Logo"
              width={40}
              height={40}
              className="w-10 h-10 object-contain border-2 dark:border-gray-50 shadow-[4px_4px_0px_#111827] dark:shadow-[4px_4px_0px_#fbbf24] bg-black dark:bg-gray-950 p-1 border-[#C29307]"
            />
            <span className="font-black text-xl tracking-tight text-gray-900 dark:text-gray-50">
              Zidwell
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleNavigation(link.href)}
                className="font-medium text-gray-900/80 dark:text-gray-50/80 hover:text-gray-900 dark:hover:text-gray-50 transition-colors relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#C29307] transition-all group-hover:w-full" />
              </button>
            ))}
          </nav>

          {/* Auth Buttons */}
          {user ? (
            <div className="hidden md:flex items-center gap-3">
              <Button2 onClick={() => router.push("/dashboard")} size="sm">
                Dashboard
              </Button2>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-3">
              <Button2
                variant="heroOutline"
                onClick={() => router.push("/auth/login")}
                size="sm"
              >
                Log In
              </Button2>
              <Button2 onClick={() => router.push("/auth/signup")} size="sm">
                Get Started Free
              </Button2>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 border-2 border-gray-900 dark:border-gray-50 shadow-[4px_4px_0px_#111827] dark:shadow-[4px_4px_0px_#fbbf24] bg-gray-50 dark:bg-gray-950"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-200 dark:border-gray-800">
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => handleNavigation(link.href)}
                  className="w-full text-left font-medium text-gray-900/80 dark:text-gray-50/80 hover:text-gray-900 dark:hover:text-gray-50 transition-colors py-2"
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
                  >
                    Dashboard
                  </Button2>
                ) : (
                  <>
                    <Button2
                      variant="heroOutline"
                      className="w-full justify-center"
                      onClick={() => {
                        router.push("/auth/login");
                        setIsMenuOpen(false);
                      }}
                    >
                      Log In
                    </Button2>
                    <Button2
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