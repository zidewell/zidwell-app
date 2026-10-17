// app/components/home-component/Footer.tsx
"use client";

import { Instagram, Linkedin, Facebook } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-surface py-12 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
          <div className="sm:col-span-2 lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 mb-4 cursor-pointer">
              <Image
                src="/logo.png"
                alt="Zidwell"
                width={40}
                height={32}
                className="w-8 object-contain"
              />
              <span className="text-lg font-bold tracking-tight uppercase font-display text-foreground">
                Zidwell
              </span>
            </Link>

            <p className="text-sm font-semibold text-foreground mb-2">
              The Business Owner&apos;s Toolkit.
            </p>
            <p className="text-xs text-muted-foreground mb-6 leading-relaxed max-w-md">
              Manage your money. Organize your business. Sell online. Build with
              structure.
            </p>

            <div className="flex gap-2">
              {[
                { icon: Instagram, href: "https://www.instagram.com/zidwellfinance" },
                { icon: Linkedin, href: "https://www.linkedin.com/company/zidwellfinance" },
                { icon: Facebook, href: "https://facebook.com/zidwellfinance" },
              ].map(({ icon: Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-background border border-border flex items-center justify-center hover:bg-primary-custom hover:border-primary-custom transition-colors cursor-pointer"
                >
                  <Icon className="w-4 h-4 text-foreground" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4 text-foreground">Product</h4>
            <ul className="space-y-2">
              {[
                { l: "Features", h: "/#tools" },
                { l: "Pricing", h: "/#pricing" },
                { l: "FAQ", h: "/#faq" },
                { l: "Changelog", h: "/changelog" },
              ].map((link) => (
                <li key={link.l}>
                  <Link
                    href={link.h}
                    className="text-xs text-muted-foreground hover:text-primary-custom transition-colors"
                  >
                    {link.l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4 text-foreground">Legal</h4>
            <ul className="space-y-2">
              {[
                { l: "Privacy", h: "/privacy" },
                { l: "Terms", h: "/terms" },
                { l: "Status", h: "/status" },
                { l: "Support", h: "mailto:support@zidwell.com" },
              ].map((link) => (
                <li key={link.l}>
                  <Link
                    href={link.h}
                    className="text-xs text-muted-foreground hover:text-primary-custom transition-colors"
                  >
                    {link.l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

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