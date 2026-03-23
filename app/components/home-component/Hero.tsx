"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { Menu, X, ArrowRight, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button"; 
import heroCorporateImg from "../../../public/hero-corporate-right.jpg";
import heroCorporate2Img from "../../../public/hero-corporate-right2.jpg";
import { useUserContextData } from "@/app/context/userData";
import { Button2 } from "../ui/button2";

const Hero = () => {
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
    <>
      {/* Header */}
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
              <div className="w-10 h-10 border-2 border-[#01402e] dark:border-[#f7f0e5] shadow-[4px_4px_0px_#01402e] dark:shadow-[4px_4px_0px_#f4c600] bg-[#01402e] dark:bg-[#f7f0e5] p-1">
                <div className="w-full h-full bg-[#f4c600] dark:bg-[#01402e]" />
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
                <Button
                  onClick={() => router.push("/dashboard")}
                  size="sm"
                >
                  Dashboard
                </Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => router.push("/auth/login")}
                  size="sm"
                >
                  Log In
                </Button>
                <Button
                  onClick={() => router.push("/auth/signup")}
                  size="sm"
                >
                  Get Started Free
                </Button>
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
                    <Button
                      onClick={() => {
                        router.push("/dashboard");
                        setIsMenuOpen(false);
                      }}
                      className="w-full"
                    >
                      Dashboard
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          router.push("/auth/login");
                          setIsMenuOpen(false);
                        }}
                      >
                        Log In
                      </Button>
                      <Button
                        onClick={() => {
                          router.push("/auth/signup");
                          setIsMenuOpen(false);
                        }}
                        className="w-full"
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

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 bg-[#f7f0e5] dark:bg-[#01402e]">
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(#01402e 1px, transparent 1px), linear-gradient(90deg, #01402e 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />

        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="max-w-xl">
              {/* Badge */}
              <div className="animate-fade-up inline-flex items-center gap-2 px-4 py-2 bg-[#f4c600]/10 border-2 border-[#01402e] dark:border-[#f7f0e5] shadow-[4px_4px_0px_#01402e] dark:shadow-[4px_4px_0px_#f4c600] mb-8">
                <span className="w-2 h-2 bg-[#f4c600] rounded-full animate-pulse" />
                <span className="text-sm font-semibold text-[#01402e] dark:text-[#f7f0e5]">The OneApp for Business Finance</span>
              </div>

              {/* Main Heading */}
              <h1 className="animate-fade-up-delay-1 text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6 text-balance text-[#01402e] dark:text-[#f7f0e5]">
                Tax and Finance Management App for{" "}
                <span className="relative inline-block">
                  <span className="relative z-10 text-[#f4c600]">SMEs</span>
                  <span className="absolute bottom-2 left-0 right-0 h-4 bg-[#f4c600]/40 z-0" />
                </span>
              </h1>

              {/* Subheading */}
              <p className="animate-fade-up-delay-2 text-lg md:text-xl text-[#01402e]/70 dark:text-[#f7f0e5]/70 mb-8 text-balance">
                Everything You Need to be Tax Ready All-in-One Place: Invoices, Receipts, Income and Expense Reports, Bookkeeping, Tax Calculator, Contracts and Payments, it's all here.
              </p>

              {/* CTA Buttons */}
              <div className="animate-fade-up-delay-3 flex flex-col sm:flex-row items-start gap-4 mb-8">
                {user ? (
                  <Button2
                    variant="hero"
                    size="xl"
                    onClick={() => router.push("/dashboard")}
                  >
                    Go to Dashboard
                    <ArrowRight className="ml-2" />
                  </Button2>
                ) : (
                  <>
                    <Button2
                      variant="hero"
                      size="xl"
                      onClick={() => router.push("/auth/signup")}
                    >
                      Get Started Free
                      <ArrowRight className="ml-2" />
                    </Button2>
                    <Button2
                      variant="heroOutline"
                      size="xl"
                      onClick={() => router.push("/auth/login")}
                    >
                      <Users className="mr-2" />
                      Join our Community
                    </Button2>
                  </>
                )}
              </div>

              {/* Trust Indicators */}
              <div className="animate-fade-up-delay-3 flex flex-wrap items-center gap-6 text-sm text-[#01402e]/60 dark:text-[#f7f0e5]/60">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>No hidden fees</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Start for free</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>

            {/* Right - Image Collage */}
            <div className="animate-fade-up-delay-2 relative hidden lg:block">
              {/* Main image */}
              <div className="relative border-2 border-[#01402e] dark:border-[#f7f0e5] shadow-[8px_8px_0px_#01402e] dark:shadow-[8px_8px_0px_#f4c600] overflow-hidden">
                <img
                  src={heroCorporateImg.src}
                  alt="Nigerian business professionals"
                  className="w-full h-[400px] object-cover"
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-linear-to-t from-[#01402e]/30 to-transparent" />
              </div>

              {/* Floating smaller image */}
              <div className="absolute -bottom-8 -left-8 w-48 h-48 border-2 border-[#01402e] dark:border-[#f7f0e5] shadow-[6px_6px_0px_#f4c600] overflow-hidden">
                <img
                  src={heroCorporate2Img.src}
                  alt="Nigerian business professional"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-[#f4c600] border-2 border-[#01402e] dark:border-[#f7f0e5] shadow-[4px_4px_0px_#01402e] dark:shadow-[4px_4px_0px_#f4c600]" />
              <div className="absolute top-1/2 -right-6 w-8 h-8 bg-[#01402e] dark:bg-[#f7f0e5]" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Hero;