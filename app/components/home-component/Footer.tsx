import {
  Mail,
  Phone,
  MapPin,
  Twitter,
  Instagram,
  Linkedin,
  Facebook,
} from "lucide-react";
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
    company: [
      { label: "About Us", href: "#" },
      // { label: "Careers", href: "#" },
      // { label: "Blog", href: "#" },
      // { label: "Press", href: "#" },
    ],
    legal: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/privacy" },
      { label: "Cookie Policy", href: "#" },
    ],
  };

  const socialLinks = [
    // { icon: Twitter, href: "#", label: "Twitter" },
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
    <footer className="bg-[#01402e] dark:bg-[#f7f0e5] text-[#f7f0e5] dark:text-[#01402e] py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-[#f4c600] border-2 border-[#f7f0e5] dark:border-[#01402e] shadow-[4px_4px_0px_#f4c600] flex items-center justify-center">
                  <span className="text-[#01402e] font-black text-xl">Z</span>
                </div>
                <span className="font-black text-xl tracking-tight text-[#f7f0e5] dark:text-[#01402e]">
                  Zidwell
                </span>
              </Link>
            </div>
            <p className="text-[#f7f0e5]/70 dark:text-[#01402e]/70 text-sm mb-6">
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
                  className="w-10 h-10 bg-[#f7f0e5]/10 dark:bg-[#01402e]/10 border border-[#f7f0e5]/20 dark:border-[#01402e]/20 flex items-center justify-center hover:bg-[#f4c600] hover:border-[#f4c600] transition-colors"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-bold mb-4">Product</h4>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-[#f7f0e5]/70 dark:text-[#01402e]/70 hover:text-[#f4c600] transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-bold mb-4">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-[#f7f0e5]/70 dark:text-[#01402e]/70 hover:text-[#f4c600] transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-bold mb-4">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-[#f7f0e5]/70 dark:text-[#01402e]/70 hover:text-[#f4c600] transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold mb-4">Contact</h4>
            <ul className="space-y-3">
              {/* <li className="flex items-start gap-2 text-sm text-[#f7f0e5]/70 dark:text-[#01402e]/70">
                <Mail className="w-4 h-4 mt-0.5 shrink-0" />
                <span>hello@zidwell.com</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-[#f7f0e5]/70 dark:text-[#01402e]/70">
                <Phone className="w-4 h-4 mt-0.5 shrink-0" />
                <span>+234 XXX XXX XXXX</span>
              </li> */}
              <li className="flex items-start gap-2 text-sm text-[#f7f0e5]/70 dark:text-[#01402e]/70">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Lagos, Nigeria</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#f7f0e5]/20 dark:border-[#01402e]/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-[#f7f0e5]/70 dark:text-[#01402e]/70">
              © {currentYear} Zidwell. All rights reserved.
            </p>
            <p className="text-sm text-[#f7f0e5]/70 dark:text-[#01402e]/70">
              Built with ❤️ for Nigerian businesses
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;