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
    <footer className="bg-(--bg-secondary) py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
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
            </div>
            <p className="text-(--text-secondary) text-sm mb-6">
              Financial wellness for businesses with a vision to grow.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-(--bg-primary) border border-(--border-color) flex items-center justify-center hover:bg-(--color-accent-yellow) hover:border-(--color-accent-yellow) transition-colors squircle-md"
                >
                  <social.icon className="w-5 h-5 text-(--text-primary)" />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-(--text-primary)">Product</h4>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-(--text-secondary) hover:text-(--color-accent-yellow) transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-(--text-primary)">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-(--text-secondary) hover:text-(--color-accent-yellow) transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-(--text-primary)">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-(--text-secondary) hover:text-(--color-accent-yellow) transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-(--text-primary)">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-(--text-secondary)">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Lagos, Nigeria</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-(--border-color)">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-(--text-secondary)">
              © {currentYear} Zidwell. All rights reserved.
            </p>
            <p className="text-sm text-(--text-secondary)">
              Built with ❤️ for Nigerian businesses
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
