import {
  CreditCard,
  Receipt,
  FileText,
  Upload,
  Wallet,
  Users,
  Gift,
  Shield,
  File,
  Book,
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: CreditCard,
    title: "Get Paid with Digital Invoice",
    description:
      "Our invoice works like a regular pdf invoice and also like a payment link",
    link: "/features/invoice",
  },
  {
    icon: Receipt,
    title: "Digital Proof of Payment ",
    description:
      "Send digital receipts as proof of payment to their customers. You sign, they sign, everyone is happy",
  link: "/features/receipt",
  },
  {
    icon: FileText,
    title: "Simple Contracts",
    description:
      "Create, send, receive and sign simple agreements to protect your business dealings all inside Zidwell. ",
      link: "/features/contract",
  },
  {
    icon: Upload,
    title: "Tax Manager",
    description:
      "A simple system to manage your taxes on Zidwell. Simple upload your bank statement and we handle the rest for you.",
      link: "/dashboard/services/tax-filing",
  },

  {
    icon: Book,
    title: "Bookkeeping",
    description:
      "Record your day-to-day income and expenses to make account reconciliation and tax filing easier.",
      link: "#",
  },
  {
    icon: Users,
    title: "Growth Community",
    description:
      "Join the financial wellness club (FinWell club) a community focused on growth, structure and smarter money habits.",
      link: "/finwell",
  },
];

const Features = () => {
  return (
    <section
      id="features"
      className="py-20 md:py-32 bg-gray-100/30 dark:bg-gray-900/30"
    >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6 text-gray-900 dark:text-gray-50">
            What <span className="text-[#C29307]">Zidwell</span> Does
          </h2>
          <p className="text-lg text-gray-500 dark:text-gray-400">
            Zidwell is not your regular fintech, its financial wellness for
            businesses that need a proper structure around how money comes in
            and goes out with proper records to show. You no longer need 5 apps
            to manage your business, you need ONE APP and it’s Zidwell.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3  gap-6">
          {features.map((feature, index) => (
            <Link
            href={feature.link}
              key={index}
              className="group bg-white dark:bg-gray-900 border-2 border-gray-900 dark:border-gray-50 p-6 shadow-[4px_4px_0px_#111827] dark:shadow-[4px_4px_0px_#fbbf24] hover:shadow-[6px_6px_0px_#111827] dark:hover:shadow-[6px_6px_0px_#fbbf24] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-150"
            >
              <div className="w-12 h-12 bg-[#C29307] border-2 border-gray-900 dark:border-gray-50 shadow-[4px_4px_0px_#111827] dark:shadow-[4px_4px_0px_#fbbf24] flex items-center justify-center mb-4 group-hover:bg-amber-400 transition-colors">
                <feature.icon className="w-6 h-6 text-gray-900" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-gray-50">
                {feature.title}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {feature.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
