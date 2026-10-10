// lib/subscription-emails.ts — updated display names and features

const getPlanDisplayName = (tier: string): string => {
  const planNames: Record<string, string> = {
    starter: "Starter",
    sme: "SME",
    enterprise: "Enterprise",
    console: "Console",
  };
  return planNames[tier] || tier.charAt(0).toUpperCase() + tier.slice(1);
};

const getPlanFeatures = (tier: string): string[] => {
  const features: Record<string, string[]> = {
    starter: [
      "Business bank account",
      "Business Plan Template",
      "Automatic Bookkeeping",
      "Invoice Tool",
      "Receipt Tool",
      "Online storefront",
      "Document Vault",
    ],
    sme: [
      "Business bank account",
      "Business Plan Template",
      "Automatic Bookkeeping",
      "Invoice Tool",
      "Receipt Tool",
      "International payments",
      "Online storefront",
      "Document Vault",
      "One Extra User",
    ],
    enterprise: [
      "Business bank account",
      "Increased transaction limits",
      "Business Plan Template",
      "Automatic Bookkeeping",
      "Connect Your Bank Accounts",
      "Invoice Tool",
      "Receipt Tool",
      "International payments",
      "Online storefront",
      "Document Vault",
      "Three Extra Users",
      "Dedicated support team",
    ],
    console: [
      "Everything in Enterprise",
      "Sub Accounts",
      "Roles & Permissions",
      "Approvals",
      "Unlimited users",
      "Custom pricing",
    ],
  };
  return features[tier] || [];
};