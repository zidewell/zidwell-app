import {
  Instagram,
  Linkedin,
  MessageCircle,
  MapPin,
  Phone,
} from "lucide-react";

const Footer = () => {
  return (
    <footer id="contact" className="bg-neutral-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-[#C29307] border-2 border-white flex items-center justify-center">
                <span className="font-black text-lg text-neutral-900">Z</span>
              </div>
              <span className="font-bold text-xl">Zidwell Finance</span>
            </div>
            <p className="text-white/70 mb-6 max-w-md">
              Financial health & wellness for your business. Your trusted
              partner for accounting, tax management, and financial advisory in
              Nigeria.
            </p>

            {/* Social Links */}
            <div className="flex gap-4">
              <a
                href="https://wa.me/7069175399"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 hover:bg-[#C29307] hover:text-neutral-900 border border-white/20 flex items-center justify-center transition-all"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com/zidwellfinance"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 hover:bg-[#C29307] hover:text-neutral-900 border border-white/20 flex items-center justify-center transition-all"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com/company/zidwell"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 hover:bg-[#C29307] hover:text-neutral-900 border border-white/20 flex items-center justify-center transition-all"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-lg mb-6">Quick Links</h4>
            <ul className="space-y-3">
              {["About Us", "Services", "Pricing", "Contact"].map((link) => (
                <li key={link}>
                  <a
                    href={`#${link.toLowerCase().replace(" ", "-")}`}
                    className="text-white/70 hover:text-[#C29307] transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-lg mb-6">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-[#C29307] shrink-0 mt-0.5" />
                <div>
                  <p className="text-white/70">WhatsApp</p>
                  <a
                    href="tel:+234"
                    className="hover:text-[#C29307] transition-colors"
                  >
                    +234-7069175399
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#C29307] shrink-0 mt-0.5" />
                <div>
                  <p className="text-white/70">Office</p>
                  <p>
                    Herbert Macaulay Way,
                    <br />
                    Sabo Yaba, Lagos Nigeria
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/50 text-sm">
            © {new Date().getFullYear()} Zidwell Finance. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <a
              href="#"
              className="text-white/50 hover:text-[#C29307] transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="text-white/50 hover:text-[#C29307] transition-colors"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
