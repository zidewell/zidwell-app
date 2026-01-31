"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button2 } from "../ui/button2";
import ConsultationModal from "./ConsultationModal"; 

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);

  const navLinks = [
    { label: "Blog", href: "/blog", type: "link" },
    { label: "Talk to Expert", href: "#talk-to-expert", type: "modal", variant: "heroOutline" as const },
    { label: "Get Started", href: "/f-onboarding", type: "external" },
  ];

  const handleActionClick = (label: string, href?: string, type?: string) => {
    console.log(`${label} clicked`);
    
    if (type === "modal") {
      setIsConsultationOpen(true);
      setIsMenuOpen(false);
    } else if (type === "external" && href) {
      // Open external link in new tab
      window.open(href, '_blank', 'noopener,noreferrer');
      setIsMenuOpen(false);
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b-2 border-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Left Side: Logo and Auth Buttons (Desktop) */}
            <div className="flex items-center gap-6">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2">
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

              {/* Desktop Auth Buttons */}
              <div className="hidden md:flex items-center gap-3">
                <Button2
                  variant="ghost"
                  size="sm"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground"
                  asChild
                >
                  <Link href="/auth/login">Sign In</Link>
                </Button2>
                <Button2
                  variant="heroOutline"
                  size="sm"
                  className="text-sm"
                  asChild
                >
                  <Link href="/app">Go to App</Link>
                </Button2>
              </div>
            </div>

            {/* Right Side: Navigation Links and Buttons (Desktop) */}
            <div className="hidden md:flex items-center gap-4">
              {navLinks.map((link) => (
                <div key={link.label}>
                  {link.type === "link" ? (
                    <Link
                      href={link.href}
                      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group px-3 py-2"
                    >
                      {link.label}
                      <span className="absolute -bottom-1 left-3 right-3 w-[calc(100%-1.5rem)] h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                    </Link>
                  ) : link.type === "external" ? (
                    <Button2
                      onClick={() => handleActionClick(link.label, link.href, link.type)}
                      size="sm"
                      
                    >
                      {link.label}
                    </Button2>
                  ) : (
                    <Button2
                      onClick={() => handleActionClick(link.label, link.href, link.type)}
                      variant={link.variant}
                      size="sm"
                      
                    >
                      {link.label}
                    </Button2>
                  )}
                </div>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden border-t-2 border-foreground py-4 animate-fade-in">
              <div className="flex flex-col gap-4">
                {/* Mobile Auth Buttons */}
                <div className="flex flex-col gap-3 pb-4 border-b border-gray-200">
                  <Button2
                    variant="ghost"
                    className="w-full justify-start text-base"
                    asChild
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Link href="/auth/login">Sign In</Link>
                  </Button2>
                  <Button2
                    className="w-full justify-start text-base"
                    asChild
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Link href="/app">Go to App</Link>
                  </Button2>
                </div>

                {/* Mobile Navigation Links and Buttons */}
                {navLinks.map((link) => (
                  <div key={link.label} className="py-1">
                    {link.type === "link" ? (
                      <Link
                        href={link.href}
                        className="text-lg font-medium py-3 text-muted-foreground hover:text-foreground transition-colors block"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {link.label}
                      </Link>
                    ) : link.type === "external" ? (
                      <Button2
                        onClick={() => handleActionClick(link.label, link.href, link.type)}
                        className="w-full justify-start text-lg py-3 font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        {link.label}
                      </Button2>
                    ) : (
                      <Button2
                        onClick={() => handleActionClick(link.label, link.href, link.type)}
                        variant={link.variant}
                        className="w-full justify-start text-lg py-3 font-medium transition-all"
                      >
                        {link.label}
                      </Button2>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Consultation Modal */}
      <ConsultationModal 
        open={isConsultationOpen} 
        onOpenChange={setIsConsultationOpen} 
      />
    </>
  );
};

export default Navbar;