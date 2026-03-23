const Footer = () => {
  return (
    <footer className="py-8 border-t-2 border-primary bg-background">
      <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="font-display text-sm font-bold">
          DBS<span className="text-secondary">.</span> — Digital Business School
        </p>
        <p className="text-xs text-muted-foreground font-body">
          © {new Date().getFullYear()} Zidwell Finance. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
