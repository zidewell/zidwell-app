// app/components/payment-page-components/utils/helpers.ts

import confetti from "canvas-confetti";

export const typeLabels: Record<string, string> = {
  school: "School Fees",
  donation: "Donation",
  physical: "Physical Product",
  digital: "Digital Product",
  services: "Service",
  real_estate: "Real Estate Investment",
  stock: "Stock Investment",
  savings: "Savings / Ajo",
  crypto: "Crypto Investment",
  link: "Payment Link",
};

export const IMAGE_SPECS: Record<
  string,
  { width: number; height: number; ratio: string; description: string }
> = {
  school: {
    width: 1200,
    height: 600,
    ratio: "2:1",
    description: "1200 x 600px (2:1 ratio) - Best for school banners",
  },
  donation: {
    width: 1200,
    height: 628,
    ratio: "1.91:1",
    description: "1200 x 628px (Facebook style) - Great for sharing",
  },
  physical: {
    width: 1200,
    height: 1200,
    ratio: "1:1",
    description: "1200 x 1200px (Square) - Perfect for product display",
  },
  digital: {
    width: 1200,
    height: 800,
    ratio: "3:2",
    description: "1200 x 800px (3:2 ratio) - Ideal for course thumbnails",
  },
  services: {
    width: 1200,
    height: 675,
    ratio: "16:9",
    description: "1200 x 675px (16:9 ratio) - Great for service banners",
  },
  real_estate: {
    width: 1600,
    height: 900,
    ratio: "16:9",
    description: "1600 x 900px (Wide) - Showcase properties beautifully",
  },
  stock: {
    width: 1200,
    height: 630,
    ratio: "1.91:1",
    description: "1200 x 630px - Standard investment banner",
  },
  savings: {
    width: 1200,
    height: 630,
    ratio: "1.91:1",
    description: "1200 x 630px - Perfect for savings campaigns",
  },
  crypto: {
    width: 1200,
    height: 630,
    ratio: "1.91:1",
    description: "1200 x 630px - Modern crypto banner",
  },
  link: {
    width: 1200,
    height: 630,
    ratio: "1.91:1",
    description: "1200 x 630px - Perfect for payment links",
  },
};

export const PRODUCT_TYPES_WITH_IMAGES: string[] = [
  "physical",
  "digital",
  "services",
  "real_estate",
  "stock",
  "savings",
  "crypto",
];

export const getPlaceholderText = (
  pageType: string | null,
  field: "title" | "description",
): string => {
  if (!pageType)
    return field === "title"
      ? "Enter page title"
      : "Describe your product or service...";

  const placeholders: Record<string, { title: string; description: string }> = {
    school: {
      title: "Harmony International School - Term Fees 2025",
      description:
        "Quality education for every child. Pay your child's school fees securely online. Includes tuition, sports, and library fees.",
    },
    donation: {
      title: "Help Build a School in Africa",
      description:
        "Your donation helps provide quality education to underprivileged children. Every naira counts! Join us in making a difference.",
    },
    physical: {
      title: "Premium Leather Backpack",
      description:
        "Handcrafted genuine leather backpack with multiple compartments. Perfect for work, travel, or everyday use. Limited stock available.",
    },
    digital: {
      title: "Pastry Baking Course",
      description:
        "Master the art of pastry baking with our comprehensive online course. Get instant access to video tutorials, recipes, and certification upon completion.",
    },
    services: {
      title: "Professional Web Design Service",
      description:
        "Custom website design tailored to your business needs. Includes responsive design, SEO optimization, and 1 year of support.",
    },
    real_estate: {
      title: "Luxury 4-Bedroom Villa",
      description:
        "Modern luxury villa with swimming pool, smart home features, and stunning ocean views. Located in prime neighborhood. Schedule a viewing today.",
    },
    stock: {
      title: "Tech Growth Investment Fund",
      description:
        "Invest in Africa's fastest-growing tech startups. Minimum investment ₦50,000. Projected returns of 15-20% annually. Start building wealth today.",
    },
    savings: {
      title: "High-Yield Savings Plan",
      description:
        "Save towards your financial goals with competitive interest rates. Flexible withdrawal options. Start saving for your future today.",
    },
    crypto: {
      title: "Bitcoin Investment Package",
      description:
        "Start your crypto journey with our secure investment packages. Expert managed funds with proven returns. Join the crypto revolution.",
    },
    link: {
      title: "Premium Service Payment",
      description:
        "Secure payment link for your premium service. Fast, easy, and secure checkout.",
    },
  };

  return (
    placeholders[pageType]?.[field] ||
    (field === "title"
      ? `Enter ${typeLabels[pageType]} title`
      : `Describe ${typeLabels[pageType].toLowerCase()}...`)
  );
};

export const validateTitleForVirtualAccount = (
  title: string,
  className?: string,
): { isValid: boolean; message: string; cleanedName: string } => {
  let fullName = title;
  if (className && className.trim()) {
    fullName = `${className} ${title}`;
  }

  let cleaned = fullName.toUpperCase();
  cleaned = cleaned.replace(/[^A-Z0-9\s]/g, "");
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  const length = cleaned.length;

  if (length < 8) {
    return {
      isValid: false,
      message: `Account name will be "${cleaned}" (${length} chars). Minimum 8 characters required. Please make your title longer.`,
      cleanedName: cleaned,
    };
  }

  if (length > 64) {
    return {
      isValid: false,
      message: `Account name will be "${cleaned.substring(0, 50)}..." (${length} chars). Maximum 64 characters allowed. Please shorten your title.`,
      cleanedName: cleaned.substring(0, 64),
    };
  }

  return {
    isValid: true,
    message: `✓ Account name will be "${cleaned}" (${length} chars)`,
    cleanedName: cleaned,
  };
};

export const triggerConfetti = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: [
      "var(--color-accent-yellow)",
      "var(--color-ink)",
      "var(--bg-secondary)",
      "var(--color-accent-yellow)",
    ],
  });

  setTimeout(() => {
    confetti({
      particleCount: 50,
      spread: 100,
      origin: { y: 0.6, x: 0.3 },
      startVelocity: 25,
    });
    confetti({
      particleCount: 50,
      spread: 100,
      origin: { y: 0.6, x: 0.7 },
      startVelocity: 25,
    });
  }, 150);
};

export const copyToClipboard = async (
  text: string,
  setCopied: (value: boolean) => void,
) => {
  try {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  } catch (err) {
    console.error("Failed to copy:", err);
  }
};

export const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");