// app/components/home-component/Footer.tsx
"use client";

import { Instagram, Linkedin, Facebook, Mail, Phone, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { label: "Features", href: "#tools" },   // ← section id, bare hash
      { label: "Pricing", href: "/pricing" },  // ← dedicated page
      { label: "Blog", href: "/blog" },
      { label: "FAQ", href: "#faq" },          // ← section id, bare hash
    ],
    legal: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Status", href: "/status" },
      { label: "Support", href: "mailto:support@zidwell.com" },
    ],
  };

  const socialLinks = [
    { icon: Instagram, href: "https://www.instagram.com/zidwellfinance", label: "Instagram" },
    { icon: Linkedin, href: "https://www.linkedin.com/company/zidwellfinance", label: "LinkedIn" },
    { icon: Facebook, href: "https://facebook.com/zidwellfinance", label: "Facebook" },
  ];

  return (
    <footer className="bg-surface py-12 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 mb-4 cursor-pointer">
              <Image src="/logo.png" alt="Zidwell" width={40} height={32} className="w-8 object-contain" />
              <span className="text-lg font-bold tracking-tight uppercase font-display text-foreground">
                Zidwell
              </span>
            </Link>

            <p className="text-sm font-semibold text-foreground mb-2">
              The Business Owner&apos;s Toolkit.
            </p>
            <p className="text-xs text-muted-foreground mb-6 leading-relaxed max-w-md">
              Manage your money. Organize your business. Sell online. Build with structure.
            </p>

            <div className="flex gap-2">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-xl bg-background border border-border flex items-center justify-center hover:bg-primary-custom hover:border-primary-custom transition-colors cursor-pointer"
                >
                  <Icon className="w-4 h-4 text-foreground" />
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-foreground">Product</h4>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => {
                // bare hash → smooth scroll via native anchor
                const isHash = link.href.startsWith("#");
                return (
                  <li key={link.label}>
                    {isHash ? (
                      <a
                        href={link.href}
                        className="text-xs text-muted-foreground hover:text-primary-custom transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-xs text-muted-foreground hover:text-primary-custom transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-foreground">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-xs text-muted-foreground hover:text-primary-custom transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact */}
        <div className="border-t border-border pt-6 mb-6">
          <ul className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4 sm:gap-8">
            <li className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="w-4 h-4 shrink-0 text-primary-custom" />
              <span>Lagos, Nigeria</span>
            </li>
            <li className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="w-4 h-4 shrink-0 text-primary-custom" />
              <a href="mailto:support@zidwell.com" className="hover:text-primary-custom transition-colors">
                support@zidwell.com
              </a>
            </li>
            <li className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="w-4 h-4 shrink-0 text-primary-custom" />
              <a href="tel:+2347069175399" className="hover:text-primary-custom transition-colors">
                +234 706 917 5399
              </a>
            </li>
          </ul>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {currentYear} Zidwell · Made in Lagos. Used in 14 countries.
          </p>
          <p className="text-[11px] text-muted-foreground max-w-md sm:text-right">
            Zidwell is a financial technology company, not a bank. Banking
            services are provided by our licensed partner institutions.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;