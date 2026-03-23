"use client"
import { useState } from "react";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Programs", href: "#programs" },
  { label: "Pricing", href: "#pricing" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Why DBS", href: "#why-dbs" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b-2 border-primary">
      <div className="container flex items-center justify-between h-16">
        <a href="#" className="font-display text-xl font-bold tracking-tight text-foreground">
          DBS<span className="text-secondary">.</span>
        </a>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="font-display text-sm font-semibold text-foreground hover:text-secondary transition-colors"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#pricing"
            className="brutal-button bg-secondary text-secondary-foreground px-5 py-2 text-sm"
          >
            Enroll Now
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden brutal-border p-2 bg-card"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-card border-t-2 border-primary">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block px-6 py-3 font-display text-sm font-semibold border-b border-muted hover:bg-muted"
            >
              {link.label}
            </a>
          ))}
          <div className="p-4">
            <a
              href="#pricing"
              onClick={() => setOpen(false)}
              className="brutal-button bg-secondary text-secondary-foreground px-5 py-2 text-sm block text-center"
            >
              Enroll Now
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
