// components/Features.tsx
import {
  CreditCard,
  Receipt,
  FileText,
  Upload,
  Wallet,
  Users,
  Gift,
  Shield,
  Book,
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: CreditCard,
    title: "Invoice",
    description:
      "Our invoice works like a regular pdf invoice and also like a payment link",
    link: "/features/invoice",
  },
  {
    icon: Gift,
    title: "Earn Cashback & Rewards",
    description:
      "Become an affiliate marketer and earn as much as 20% of all subscriptions fees for 3 months.",
    link: "/#",
  },
  {
    icon: Receipt,
    title: "Receipts",
    description:
      "Send digital receipts as proof of payment to their customers. You sign, they sign, everyone is happy",
    link: "/features/receipt",
  },
  {
    icon: FileText,
    title: "Simple Contracts",
    description:
      "Create simple to understand terms of service for your clients as well as content agreements for your events or website.",
    link: "/features/contract",
  },
  {
    icon: Upload,
    title: "Tax Manager",
    description:
      "A simple system to manage your taxes on Zidwell. Simply upload your bank statement and we handle the rest for you.",
    link: "/dashboard/services/tax-filing",
  },
  {
    icon: Wallet,
    title: "Prepaid Debit Cards",
    description:
      "Access prepaid cards for everyday business and personal spending.",
    link: "/#",
  },
  {
    icon: Book,
    title: "Automatic Bookkeeping",
    description:
      "Automatically Record your day-to-day income and expenses to make account reconciliation and tax filing easier.",
    link: "/bookkeeping",
  },
  {
    icon: Users,
    title: "Payment pages",
    description:
      "Join the financial wellness club (FinWell club) a community focused on growth, structure and smarter money habits.",
    link: "/features/payment-page",
  },
  {
    icon: Shield,
    title: "Secure & Protected",
    description:
      "All your financial records and transactions have end to end encryption and is 100% safe and protected.",
    link: "/#",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-20 md:py-32 bg-(--bg-primary)">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6 text-(--text-primary)">
            What <span className="text-(--color-accent-yellow)">Zidwell</span>{" "}
            Does
          </h2>
          <p className="text-lg text-(--text-secondary)">
            Zidwell is not your regular fintech, its financial wellness for
            businesses that need a proper structure around how money comes in
            and goes out with proper records to show. You no longer need 5 apps
            to manage your business, you need ONE APP and it's Zidwell.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Link
              href={feature.link}
              key={index}
              className="group bg-(--bg-primary) border-2 border-(--border-color) p-6 shadow-[4px_4px_0px_var(--border-color)] dark:shadow-[4px_4px_0px_var(--color-accent-yellow)] hover:shadow-[6px_6px_0px_var(--border-color)] dark:hover:shadow-[6px_6px_0px_var(--color-accent-yellow)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-150 squircle-lg"
            >
              <div className="w-12 h-12 bg-(--color-accent-yellow) border-2 border-(--border-color) shadow-[4px_4px_0px_var(--border-color)] dark:shadow-[4px_4px_0px_var(--color-accent-yellow)] flex items-center justify-center mb-4 group-hover:bg-(--color-accent-yellow)/80 transition-colors squircle-md">
                <feature.icon className="w-6 h-6 text-(--color-ink)" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-(--text-primary)">
                {feature.title}
              </h3>
              <p className="text-(--text-secondary) text-sm">
                {feature.description}
              </p>
            </Link>
          ))}
        </div>

        <div className="max-w-2xl mx-auto text-center mt-16">
          <p className="text-xl font-semibold text-(--text-primary)">
            Save Time and Money by Using Zidwell to Manage Your Financial
            Operations as a Business. It's{" "}
            <span className="text-(--color-accent-yellow)">10x cheaper</span>{" "}
            than hiring your own accountant.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Features;
