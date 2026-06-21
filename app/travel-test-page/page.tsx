// app/page.tsx
"use client";

import { useState, createContext, useContext, ReactNode } from "react";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import { Button } from "../components/ui/button"; 
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  ArrowRight,
  Compass,
  CreditCard,
  Globe2,
  Instagram,
  MapPin,
  MessageCircle,
  Plane,
  ShieldCheck,
  Sparkles,
  Twitter,
  Code2,
  Check,
} from "lucide-react";

// ============================================================
// 1. PAYMENT CONTEXT
// ============================================================
interface PaymentContextType {
  embedCode: string;
  setEmbedCode: (code: string) => void;
  isCustomCode: boolean;
  setIsCustomCode: (value: boolean) => void;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

function PaymentProvider({ children }: { children: ReactNode }) {
  const [embedCode, setEmbedCode] = useState<string>(
    `<a href="https://www.zidwell.com/pay/web-dev-9188" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 24px;background:#2563eb;color:white;text-decoration:none;border-radius:8px;font-weight:600;">Pay Now</a>`
  );
  const [isCustomCode, setIsCustomCode] = useState(false);

  return (
    <PaymentContext.Provider
      value={{ embedCode, setEmbedCode, isCustomCode, setIsCustomCode }}
    >
      {children}
    </PaymentContext.Provider>
  );
}

function usePayment() {
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error("usePayment must be used within a PaymentProvider");
  }
  return context;
}

// ============================================================
// 2. PAYMENT CODE EDITOR
// ============================================================
function PaymentCodeEditor() {
  const { embedCode, setEmbedCode, isCustomCode, setIsCustomCode } = usePayment();
  const [tempCode, setTempCode] = useState(embedCode);
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [buttonText, setButtonText] = useState("Pay Now");
  const [bgColor, setBgColor] = useState("#2563eb");
  const [textColor, setTextColor] = useState("#ffffff");

  const generateButtonCode = () => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 24px;background:${bgColor};color:${textColor};text-decoration:none;border-radius:8px;font-weight:600;">${buttonText}</a>`;
  };

  const handleApply = () => {
    if (url) {
      const newCode = generateButtonCode();
      setEmbedCode(newCode);
      setTempCode(newCode);
      setIsCustomCode(true);
      setIsOpen(false);
    }
  };

  const handleReset = () => {
    const defaultCode = `<a href="https://www.zidwell.com/pay/web-dev-9188" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 24px;background:#2563eb;color:white;text-decoration:none;border-radius:8px;font-weight:600;">Pay Now</a>`;
    setEmbedCode(defaultCode);
    setTempCode(defaultCode);
    setIsCustomCode(false);
    setUrl("https://www.zidwell.com/pay/web-dev-9188");
    setButtonText("Pay Now");
    setBgColor("#2563eb");
    setTextColor("#ffffff");
    setIsOpen(false);
  };

  const handleCustomCodeApply = () => {
    setEmbedCode(tempCode);
    setIsCustomCode(true);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-xs text-muted-foreground hover:text-foreground">
          <Code2 className="h-3.5 w-3.5" />
          Customize Button
          {isCustomCode && (
            <span className="ml-1 inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5" />
            Customize Payment Button
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="builder" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="builder">Visual Builder</TabsTrigger>
            <TabsTrigger value="code">HTML Code</TabsTrigger>
          </TabsList>

          <TabsContent value="builder" className="space-y-4 mt-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="payment-url">Payment URL</Label>
                <Input
                  id="payment-url"
                  placeholder="https://your-payment-link.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter the URL where users should be redirected to complete payment
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="button-text">Button Text</Label>
                <Input
                  id="button-text"
                  placeholder="Pay Now"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="bg-color">Background Color</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="bg-color"
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="text-color">Text Color</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="text-color"
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-2">
                <Label>Preview</Label>
                <div className="flex justify-center p-4 bg-muted rounded-lg">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: url ? generateButtonCode() : '<span class="text-muted-foreground">Enter a URL to preview</span>',
                    }}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  Reset to Default
                </Button>
                <Button onClick={handleApply}>
                  Apply Changes
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="code" className="space-y-4 mt-4">
            <div className="grid gap-2">
              <Label htmlFor="custom-code">Paste your custom HTML code</Label>
              <Textarea
                id="custom-code"
                value={tempCode}
                onChange={(e) => setTempCode(e.target.value)}
                rows={8}
                className="font-mono text-sm"
                placeholder="<a href='https://...' target='_blank'>Pay Now</a>"
              />
              <p className="text-xs text-muted-foreground">
                Paste any HTML button code (anchor tag, button, form, etc.)
              </p>
            </div>

            <div className="border rounded-lg p-4 space-y-2">
              <Label>Preview</Label>
              <div className="flex justify-center p-4 bg-muted rounded-lg">
                <div
                  dangerouslySetInnerHTML={{
                    __html: tempCode || '<span class="text-muted-foreground">Enter HTML code to preview</span>',
                  }}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Reset to Default
              </Button>
              <Button onClick={handleCustomCodeApply}>
                Apply Custom Code
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {isCustomCode && (
          <div className="mt-2 p-2 bg-green-50 dark:bg-green-950/20 rounded-lg flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
            <Check className="h-4 w-4" />
            Using custom payment button
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 3. PAYMENT EMBED SLOT
// ============================================================
type PaymentEmbedSlotProps = {
  packageName: string;
  price: string;
  ctaText: string;
};

function PaymentEmbedSlot({ packageName, price, ctaText }: PaymentEmbedSlotProps) {
  const [mode, setMode] = useState<"full" | "installment">("full");
  const { embedCode } = usePayment();

  return (
    <div className="payment-widget-placeholder rounded-2xl border border-border bg-surface/80 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground">
            <Plane className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Skyline Travels</p>
            <p className="text-sm font-medium text-foreground">{packageName}</p>
          </div>
        </div>
        <p className="font-display text-2xl text-foreground">{price}</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 rounded-full bg-background p-1 text-sm">
        <button
          type="button"
          onClick={() => setMode("full")}
          className={`rounded-full py-1.5 transition ${
            mode === "full"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Full payment
        </button>
        <button
          type="button"
          onClick={() => setMode("installment")}
          className={`rounded-full py-1.5 transition ${
            mode === "installment"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Installments
        </button>
      </div>

      <div className="mt-4 grid gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor={`${packageName}-name`}>Full name</Label>
          <Input id={`${packageName}-name`} placeholder="As shown on passport" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor={`${packageName}-email`}>Email</Label>
            <Input id={`${packageName}-email`} type="email" placeholder="you@example.com" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`${packageName}-phone`}>Phone</Label>
            <Input id={`${packageName}-phone`} type="tel" placeholder="+234 …" />
          </div>
        </div>
      </div>

      {/* Dynamic Payment Button */}
      <div className="mt-5 flex flex-col items-center gap-3">
        <div
          dangerouslySetInnerHTML={{ __html: embedCode }}
          className="inline-block"
        />
        
        {/* Customize button - now below the payment button */}
        <PaymentCodeEditor />
      </div>

      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" />
        Secure checkout · Embedded payment area
      </p>
    </div>
  );
}

// ============================================================
// 4. PACKAGE CARD
// ============================================================
type Package = {
  id: string;
  title: string;
  location: string;
  meta: string;
  price: string;
  cta: string;
  image: string;
  blurb: string;
};

function PackageCard({ pkg }: { pkg: Package }) {
  const [open, setOpen] = useState(false);

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)] transition hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_16px_40px_-16px_rgba(0,0,0,0.18)]">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={pkg.image}
          alt={`${pkg.title} — ${pkg.location}`}
          loading="lazy"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-background/90 px-3 py-1 text-xs font-medium text-foreground backdrop-blur">
          <MapPin className="h-3 w-3" />
          {pkg.location}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div>
          <h3 className="font-display text-2xl leading-tight text-foreground">{pkg.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{pkg.meta}</p>
          <p className="mt-3 text-sm text-foreground/80">{pkg.blurb}</p>
        </div>

        <div className="mt-auto flex items-end justify-between border-t border-border pt-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">From</p>
            <p className="font-display text-2xl text-foreground">{pkg.price}</p>
          </div>
          <Button onClick={() => setOpen((v) => !v)} variant={open ? "outline" : "default"}>
            {open ? "Close" : pkg.cta}
          </Button>
        </div>

        {open && (
          <div className="animate-in fade-in slide-in-from-top-2">
            <PaymentEmbedSlot packageName={pkg.title} price={pkg.price} ctaText={pkg.cta} />
          </div>
        )}
      </div>
    </article>
  );
}

// ============================================================
// 5. SITE NAV
// ============================================================
function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <a href="#top" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground">
            <Plane className="h-4 w-4 -rotate-45" />
          </span>
          <span className="font-display text-xl">Skyline</span>
        </a>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#packages" className="hover:text-foreground">Packages</a>
          <a href="#services" className="hover:text-foreground">Services</a>
          <a href="#why" className="hover:text-foreground">Why us</a>
          <a href="#faq" className="hover:text-foreground">FAQ</a>
        </nav>
        <Button asChild size="sm">
          <a href="#packages">Book Your Trip</a>
        </Button>
      </div>
    </header>
  );
}

// ============================================================
// 6. HERO
// ============================================================
function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="font-display text-2xl text-foreground">{value}</dt>
      <dd className="text-xs text-muted-foreground">{label}</dd>
    </div>
  );
}

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-20 pt-16 lg:grid-cols-2 lg:pt-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3 text-[color:var(--color-gold)]" />
            Trusted by 2,000+ Nigerian travelers
          </span>
          <h1 className="mt-6 font-display text-5xl leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Travel More.
            <br />
            <span className="italic text-primary">Stress Less.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Helping Nigerians explore the world with vacation packages, visa assistance, hotel
            bookings and travel experiences designed for unforgettable memories.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <a href="#packages">
                Book Your Trip <ArrowRight className="ml-1.5 h-4 w-4" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#packages">View Packages</a>
            </Button>
          </div>
          <dl className="mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-border pt-6">
            <Stat value="2,000+" label="Happy travelers" />
            <Stat value="98%" label="Visa success" />
            <Stat value="40+" label="Destinations" />
          </dl>
        </div>

        <div className="relative">
          <div className="relative overflow-hidden rounded-[2rem] border border-border shadow-[0_30px_60px_-30px_rgba(0,0,0,0.3)]">
            <img
              src="https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1400&q=80"
              alt="Happy African travelers exploring the world"
              className="aspect-[4/5] w-full object-cover"
            />
          </div>
          <div className="absolute -left-6 bottom-10 hidden w-56 rounded-2xl border border-border bg-card p-4 shadow-xl md:block">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Next departure</p>
            <p className="mt-1 font-display text-lg">Dubai · 12 July</p>
            <p className="text-xs text-muted-foreground">8 seats left</p>
          </div>
          <div className="absolute -right-4 top-12 hidden rounded-2xl border border-border bg-card px-4 py-3 shadow-xl md:block">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="text-sm">Visa fully handled</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// 7. PACKAGES
// ============================================================
const packagesData: Package[] = [
  {
    id: "dubai",
    title: "Dubai Summer Escape",
    location: "United Arab Emirates",
    meta: "5 Days · Hotel Included · Visa Assistance",
    price: "₦2,500,000",
    cta: "Book Now",
    image:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80",
    blurb: "Skyline-view hotels, desert safaris and a fast-tracked visa.",
  },
  {
    id: "zanzibar",
    title: "Zanzibar Couple Retreat",
    location: "Tanzania",
    meta: "7 Days · Resort Included",
    price: "₦1,800,000",
    cta: "Reserve Your Spot",
    image:
      "https://images.unsplash.com/photo-1589197331516-4d84b72ebde3?auto=format&fit=crop&w=1200&q=80",
    blurb: "Turquoise water, beach-front suites and private island tours.",
  },
  {
    id: "london",
    title: "London Experience",
    location: "United Kingdom",
    meta: "Visa Support · Hotel · Airport Pickup",
    price: "₦3,700,000",
    cta: "Pay Deposit",
    image:
      "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80",
    blurb: "Central London stay, full visa handling and a curated itinerary.",
  },
  {
    id: "capetown",
    title: "Cape Town Adventure",
    location: "South Africa",
    meta: "6 Days · Group Package",
    price: "₦1,250,000",
    cta: "Book Now",
    image:
      "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=1200&q=80",
    blurb: "Table Mountain hikes, wine country and ocean-side group dinners.",
  },
];

function Packages() {
  return (
    <section id="packages" className="border-t border-border bg-surface/50 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Featured packages
            </p>
            <h2 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
              Hand-picked trips, ready to book.
            </h2>
          </div>
          <p className="max-w-sm text-sm text-muted-foreground">
            Tap any card to open the embedded checkout and pay directly — no redirects.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2 xl:grid-cols-2">
          {packagesData.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// 8. WHY US
// ============================================================
function WhyUs() {
  const items = [
    {
      icon: ShieldCheck,
      title: "Visa Support",
      desc: "We simplify your travel process from start to finish — forms, biometrics and embassy handling.",
    },
    {
      icon: CreditCard,
      title: "Flexible Payment Plans",
      desc: "Pay in installments or make a single full payment. Lock your seat with a small deposit.",
    },
    {
      icon: Compass,
      title: "Curated Experiences",
      desc: "Hand-picked destinations, hotels and local guides we'd send our own family to.",
    },
  ];
  return (
    <section id="why" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Why Skyline</p>
          <h2 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
            Built for the modern Nigerian traveler.
          </h2>
        </div>
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {items.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-3xl border border-border bg-card p-8">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-6 font-display text-2xl">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// 9. SERVICES
// ============================================================
const servicesData = [
  { title: "Tourist Visa Processing", desc: "Document review, biometrics booking and submission." },
  { title: "Yellow Fever Cards", desc: "Same-week issuance at certified partner clinics." },
  { title: "Hotel Reservations", desc: "Negotiated rates at trusted hotels worldwide." },
  { title: "Airport Pickup", desc: "Private transfers waiting the moment you land." },
  { title: "Honeymoon Packages", desc: "Romantic escapes designed around you." },
  { title: "Group Tours", desc: "Curated trips for friends, family and corporates." },
];

function Services() {
  return (
    <section id="services" className="border-t border-border bg-surface/50 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Additional services
            </p>
            <h2 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
              Everything you need for the journey.
            </h2>
          </div>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {servicesData.map((s) => (
            <div
              key={s.title}
              className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-6 transition hover:border-primary/40"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                <Globe2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// 10. TESTIMONIALS
// ============================================================
const testimonialsData = [
  {
    name: "Tolu A.",
    trip: "Dubai · December 2024",
    quote:
      "Skyline handled my visa, hotel and even airport pickup. I literally just packed my bag and flew.",
    avatar:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=200&q=80",
  },
  {
    name: "Chinaza & Ifeanyi",
    trip: "Zanzibar Honeymoon",
    quote:
      "From the resort to the sunset cruise, every detail was thought through. The best money we've ever spent.",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
  },
  {
    name: "Femi O.",
    trip: "London Business Trip",
    quote:
      "I needed a UK visa in 3 weeks. Skyline made it look easy. Will book every future trip with them.",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
  },
];

function Testimonials() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Stories</p>
          <h2 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
            Loved by travelers across Nigeria.
          </h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {testimonialsData.map((t) => (
            <figure
              key={t.name}
              className="flex h-full flex-col justify-between rounded-3xl border border-border bg-card p-7"
            >
              <blockquote className="font-display text-xl leading-snug text-foreground">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-5">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="h-10 w-10 rounded-full object-cover"
                  loading="lazy"
                />
                <div>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.trip}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// 11. FAQ
// ============================================================
const faqsData = [
  {
    q: "How do I book a trip?",
    a: "Pick a package above, click the booking button and complete payment directly on the page. Our team will reach out within an hour to confirm the next steps.",
  },
  {
    q: "Can I pay in installments?",
    a: "Yes. Most packages allow a deposit to lock your spot, with the balance spread over flexible installments before your travel date.",
  },
  {
    q: "What documents are required?",
    a: "Typically a valid international passport, recent passport photographs, proof of funds and a completed visa form. Specific requirements depend on the destination — we guide you through each one.",
  },
  {
    q: "Do you process visas?",
    a: "Yes. We handle tourist visa processing for the UK, Schengen, UAE, USA, Canada and most popular destinations.",
  },
];

function FAQ() {
  return (
    <section id="faq" className="border-t border-border bg-surface/50 py-24">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-[1fr_2fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">FAQ</p>
          <h2 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
            Questions, answered.
          </h2>
          <p className="mt-4 text-sm text-muted-foreground">
            Still curious? WhatsApp us at +234 800 SKYLINE — we reply within the hour.
          </p>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {faqsData.map((f, i) => (
            <AccordionItem key={f.q} value={`item-${i}`}>
              <AccordionTrigger className="text-left font-display text-lg">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

// ============================================================
// 12. SITE FOOTER
// ============================================================
function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground">
                <Plane className="h-4 w-4 -rotate-45" />
              </span>
              <span className="font-display text-xl">Skyline Travels & Tours</span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              Helping Nigerians travel the world with confidence — visas, flights, hotels and
              experiences, all in one place.
            </p>
            <div className="mt-5 flex items-center gap-3 text-muted-foreground">
              <a href="#" aria-label="Instagram" className="hover:text-foreground">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" aria-label="Twitter" className="hover:text-foreground">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" aria-label="WhatsApp" className="hover:text-foreground">
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium">Explore</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><a href="#packages" className="hover:text-foreground">Packages</a></li>
              <li><a href="#services" className="hover:text-foreground">Services</a></li>
              <li><a href="#why" className="hover:text-foreground">Why us</a></li>
              <li><a href="#faq" className="hover:text-foreground">FAQ</a></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium">Contact</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>hello@skylinetravels.ng</li>
              <li>+234 800 SKYLINE</li>
              <li>14 Awolowo Road, Ikoyi, Lagos</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Skyline Travels & Tours. All rights reserved.</p>
          <p>Lagos · London · Dubai · Cape Town</p>
        </div>
      </div>
    </footer>
  );
}

// ============================================================
// 13. MAIN PAGE COMPONENT
// ============================================================
export default function Home() {
  return (
    <PaymentProvider>
      <div className="min-h-screen bg-background font-sans text-foreground antialiased">
        <SiteNav />
        <Hero />
        <Packages />
        <WhyUs />
        <Services />
        <Testimonials />
        <FAQ />
        <SiteFooter />
      </div>
    </PaymentProvider>
  );
}