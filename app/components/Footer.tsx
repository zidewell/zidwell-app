// import {
//   Github,
//   Twitter,
//   Linkedin,
//   Mail,
//   Code,
//   Facebook,
//   Instagram,
// } from "lucide-react";
// import Image from "next/image";
// import Link from "next/link";

// const Footer = () => {
//   return (
//     <footer data-aos="fade-down" className="bg-gray-900 text-white py-16">
//       <div className="container mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
//           <div className="col-span-1 md:col-span-2">
//             <div className="mb-4 flex items-center">
//               <Image
//                 src="/logo.png"
//                 alt="Zidwell Logo"
//                 className="w-10 h-10 md:w-14 md:h-14 mr-2"
//                 width={500}
//                 height={500}
//               />
//               <h1 className="font-bold text-3xl">Zidwell</h1>
//             </div>
//             <p className="text-gray-400 mb-6 max-w-md">
//               Easily and securely pay for everything from cable TV, airtime, and
//               electricity to data bundles. Plus, access AI-powered accounting
//               tools and generate professional invoices in minutes.
//             </p>
//           </div>

//           <div>
//             <h3 className="text-lg font-semibold mb-4">Bill Payment</h3>
//             <ul className="space-y-2">
//               <li>
//                 <a
//                   href="/dashboard/services/buy-cable-tv"
//                   className="text-gray-400 hover:text-white transition-colors"
//                 >
//                   Cable TV{" "}
//                 </a>
//               </li>
//               <li>
//                 <a
//                   href="/dashboard/services/buy-airtime"
//                   className="text-gray-400 hover:text-white transition-colors"
//                 >
//                   Buy Airtime{" "}
//                 </a>
//               </li>
//               <li>
//                 <a
//                   href="/dashboard/services/buy-data"
//                   className="text-gray-400 hover:text-white transition-colors"
//                 >
//                   Buy Data Bundle{" "}
//                 </a>
//               </li>
//               <li>
//                 <a
//                   href="/dashboard/services/buy-power"
//                   className="text-gray-400 hover:text-white transition-colors"
//                 >
//                   Power Payment{" "}
//                 </a>
//               </li>
//               {/* <li>
//                 <a
//                   href="/dashboard/services/ai-accountant"
//                   className="text-gray-400 hover:text-white transition-colors"
//                 >
//                   AI Accountant
//                 </a>
//               </li> */}
//             </ul>
//           </div>

//            <div>
//             <h3 className="font-semibold mb-4">Support</h3>
//             <ul className="space-y-2">
//               <li>
//                 <Link
//                   href="/support/create-ticket"
//                   className="hover:text-white text-gray-400 transition-colors"
//                 >
//                   Create Ticket
//                 </Link>
//               </li>
//               {/* <li>
//                 <Link
//                   href="/support/tickets"
//                   className="hover:text-white text-gray-400 transition-colors"
//                 >
//                   My Tickets
//                 </Link>
//               </li> */}
//               <li>
//                 <Link
//                   href="https://wa.me/7069175399"
//                   className="hover:text-white text-gray-400 transition-colors"
//                 >
//                   Help Center
//                 </Link>
//               </li>
//               <li>
//                 <Link
//                   href="#contact"
//                   className="hover:text-white text-gray-400 transition-colors"
//                 >
//                   Contact Us
//                 </Link>
//               </li>
//               <li>
//                 <Link
//                   href="/privacy"
//                   className="hover:text-white text-gray-400 transition-colors"
//                 >
//                   Privacy Policy
//                 </Link>
//               </li>
//             </ul>
//           </div>
//         </div>

//         <div className="border-t border-gray-800 pt-8">
//           <div className="flex  justify-between items-center">
//             <p className="text-gray-400 text-sm mb-4 md:mb-0">
//               © 2025 Zidwell. All rights reserved.
//             </p>

//             <div className="flex space-x-4">
//               <a
//                 href="https://facebook.com/zidwellfinance"
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="text-gray-400 hover:text-white transition-colors"
//               >
//                 <Facebook className="h-6 w-6" />
//               </a>

//               <a
//                 href="https://www.instagram.com/zidwellfinance"
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="text-gray-400 hover:text-white transition-colors"
//               >
//                 <Instagram className="h-6 w-6" />
//               </a>

//               <a
//                 href="https://www.linkedin.com/company/zidwellfinance"
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="text-gray-400 hover:text-white transition-colors"
//               >
//                 <Linkedin className="h-6 w-6" />
//               </a>
//             </div>
//           </div>
//         </div>
//       </div>
//     </footer>
//   );
// };

// export default Footer;

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
    <footer className="bg-gray-900 dark:bg-gray-50 text-gray-50 dark:text-gray-900 py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/logo.png"
                  alt="Zidwell Logo"
                  width={40}
                  height={40}
                  className="w-10 h-10 object-contain border-2 border-gray-900 dark:border-gray-50 shadow-[4px_4px_0px_#111827] dark:shadow-[4px_4px_0px_#fbbf24] bg-gray-50 dark:bg-gray-950 p-1"
                />
                <span className="font-black text-xl tracking-tight text-gray-900 dark:text-gray-50">
                  Zidwell
                </span>
              </Link>
            </div>
            <p className="text-gray-50/70 dark:text-gray-900/70 text-sm mb-6">
              Financial wellness for businesses with a vision to grow.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  target="_blank"
                  className="w-10 h-10 bg-gray-50/10 dark:bg-gray-900/10 border border-gray-50/20 dark:border-gray-900/20 flex items-center justify-center hover:bg-[#2b825b] hover:border-[#2b825b] transition-colors"
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
                    className="text-gray-50/70 dark:text-gray-900/70 hover:text-[#2b825b] transition-colors text-sm"
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
                    className="text-gray-50/70 dark:text-gray-900/70 hover:text-[#2b825b] transition-colors text-sm"
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
                    className="text-gray-50/70 dark:text-gray-900/70 hover:text-[#2b825b] transition-colors text-sm"
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
              {/* <li className="flex items-start gap-2 text-sm text-gray-50/70 dark:text-gray-900/70">
                <Mail className="w-4 h-4 mt-0.5 shrink-0" />
                <span>hello@zidwell.com</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-50/70 dark:text-gray-900/70">
                <Phone className="w-4 h-4 mt-0.5 shrink-0" />
                <span>+234 XXX XXX XXXX</span>
              </li> */}
              <li className="flex items-start gap-2 text-sm text-gray-50/70 dark:text-gray-900/70">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Lagos, Nigeria</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-50/20 dark:border-gray-900/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-50/70 dark:text-gray-900/70">
              © {currentYear} Zidwell. All rights reserved.
            </p>
            <p className="text-sm text-gray-50/70 dark:text-gray-900/70">
              Built with ❤️ for Nigerian businesses
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
