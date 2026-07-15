// components/Footer.tsx
import {
  Mail,
  Phone,
  MapPin,
  Twitter,
  Instagram,
  Linkedin,
  Facebook,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const footerLinks = {
    product: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "ZidCoin", href: "#zidcoin" },
      { label: "FAQ", href: "#faq" },
    ],
    company: [{ label: "About Us", href: "#" }],
    legal: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/privacy" },
      { label: "Cookie Policy", href: "#" },
    ],
  };
  const socialLinks = [
    {
      icon: Instagram,
      href: "https://www.instagram.com/zidwellfinance",
      label: "Instagram",
    },
    {
      icon: Linkedin,
      href: "https://www.linkedin.com/company/zidwellfinance",
      label: "LinkedIn",
    },
    {
      icon: Facebook,
      href: "https://facebook.com/zidwellfinance",
      label: "Facebook",
    },
  ];

  return (
    <footer className="bg-(--bg-secondary) py-8 sm:py-12 md:py-16">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12 mb-8 sm:mb-12">
          {/* Brand Section - Full width on mobile, spans 2 cols on desktop */}
          <div className="sm:col-span-2 lg:col-span-2">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Link href="/dashboard" className="flex items-center gap-2 group">
                <Image
                  src="/logo.png"
                  alt="Zidwell Logo"
                  width={49}
                  height={40}
                  className="w-8 sm:w-10 object-contain transition-transform group-hover:scale-105"
                />
                <span className="text-lg sm:text-xl font-bold tracking-tight text-(--text-primary) uppercase">
                  Zidwell
                </span>
              </Link>
            </div>

            {/* Paragraph */}
            <p className="text-xs sm:text-sm text-(--text-secondary) mb-4 sm:mb-6 leading-relaxed max-w-2xl">
              Zidwell operates as a financial technology company and does not provide banking services or hold depositor funds. All financial transactions facilitated by Zidwell are conducted in partnership with licensed financial institutions. Zidwell does not engage in traditional banking activities. By accessing or using Zidwell's website and services, you acknowledge and agree that Zidwell is not a bank, and all financial services are provided through third-party partners.
            </p>

            {/* Social Links */}
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 sm:w-10 sm:h-10 bg-(--bg-primary) border border-(--border-color) flex items-center justify-center hover:bg-(--color-accent-yellow) hover:border-(--color-accent-yellow) transition-all duration-300 squircle-md hover:scale-105"
                >
                  <social.icon className="w-4 h-4 sm:w-5 sm:h-5 text-(--text-primary)" />
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-bold text-base sm:text-lg mb-3 sm:mb-4 text-(--text-primary)">
              Product
            </h4>
            <ul className="space-y-2 sm:space-y-2.5">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-xs sm:text-sm text-(--text-secondary) hover:text-(--color-accent-yellow) transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-bold text-base sm:text-lg mb-3 sm:mb-4 text-(--text-primary)">
              Legal
            </h4>
            <ul className="space-y-2 sm:space-y-2.5">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-xs sm:text-sm text-(--text-secondary) hover:text-(--color-accent-yellow) transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-base sm:text-lg mb-3 sm:mb-4 text-(--text-primary)">
              Contact
            </h4>
            <ul className="space-y-2 sm:space-y-3">
              <li className="flex items-start gap-2 text-xs sm:text-sm text-(--text-secondary)">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Lagos, Nigeria</span>
              </li>
              <li className="flex items-start gap-2 text-xs sm:text-sm text-(--text-secondary)">
                <Mail className="w-4 h-4 mt-0.5 shrink-0" />
                <a href="mailto:support@zidwell.com" className="hover:text-(--color-accent-yellow) transition-colors">
                  support@zidwell.com
                </a>
              </li>
              <li className="flex items-start gap-2 text-xs sm:text-sm text-(--text-secondary)">
                <Phone className="w-4 h-4 mt-0.5 shrink-0" />
                <a href="tel:+2348000000000" className="hover:text-(--color-accent-yellow) transition-colors">
                  +234 706 917 5399
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 sm:pt-8 border-t border-(--border-color)">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <p className="text-xs sm:text-sm text-(--text-secondary) text-center sm:text-left">
              © {currentYear} Zidwell. All rights reserved.
            </p>
            <p className="text-xs sm:text-sm text-(--text-secondary) text-center sm:text-right">
              Built with ❤️ for Nigerian businesses
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;