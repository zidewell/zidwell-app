"use client";

import { useState } from "react";
import {
  ChevronDown,
  FileText,
  Receipt,
  TrendingUp,
  Smartphone,
} from "lucide-react";

const services = [
  {
    icon: FileText,
    title: "Accounting & Financial Reporting",
    shortDescription:
      "We help you keep clean, accurate financial records so you always know how your business is performing and where your money is going.",
    expandedDescription:
      "At Zidwell, we take your raw financial data — bank statements, expenses, income records — and turn it into proper accounting records. We organize your transactions, track income and expenses, and prepare clear financial statements that actually make sense to you.\n\nOur goal is simple: give you visibility and peace of mind. With proper records in place, you can make better business decisions, avoid financial mistakes, and be ready whenever banks, investors, or regulators ask for your numbers.",
  },
  {
    icon: Receipt,
    title: "Tax Management & Compliance",
    shortDescription:
      "We calculate, file, and manage your business taxes so you stay compliant and avoid penalties, stress, or surprises from the tax authorities.",
    expandedDescription:
      "Many businesses get into trouble not because they don't want to pay tax, but because they don't understand what they owe or how to structure things properly. We review your financial records, calculate your correct tax obligations, and guide you on what you should be paying and when.\n\nWhen you're ready, we handle the filing process for you and provide the necessary tax documents and receipts. This way, you can run your business confidently knowing you're on the right side of the law.",
  },
  {
    icon: TrendingUp,
    title: "Business Growth Advisory",
    shortDescription:
      "We help you make smarter financial decisions that support sustainable growth, not guesswork.",
    expandedDescription:
      "Beyond compliance, we work with you to understand your business numbers and what they mean for growth. We look at your cash flow, costs, pricing, and profitability, then help you identify areas where you're losing money or missing opportunities.\n\nOur advisory is practical and grounded in your real numbers — not theory. Whether it's planning for expansion, managing cash better, or preparing for funding, we help you grow with clarity and control.",
  },
  {
    icon: Smartphone,
    title: "Business Finance Software",
    shortDescription:
      "Zidwell also provides a simple financial tool that helps you manage payments, invoices, contracts, receipts, and other financial records in ONE APP.",
    expandedDescription:
      "Our software is built to make financial management easy for business owners who don't want complexity. You can create invoices and receipts, manage payments, track transactions, and access your financial records without juggling multiple tools.\n\nBehind the scenes, our platform is designed to work hand-in-hand with our finance and accounting services. This means your data stays organized, accurate, and ready for reporting, tax filing, or business review at any time.",
  },
];

const ServiceCard = ({
  service,
  index,
}: {
  service: (typeof services)[0];
  index: number;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = service.icon;

  return (
    <div
      className="group bg-card border-2 border-neutral-900 p-6 md:p-8 transition-all duration-300 hover:shadow-[6px_6px_0px_#2b825b]"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Icon */}
      <div className="w-14 h-14 bg-[#2b825b] border-2 border-neutral-900 flex items-center justify-center mb-6">
        <Icon className="w-7 h-7 text-neutral-900" />
      </div>

      {/* Title */}
      <h3 className="text-xl md:text-2xl font-bold mb-4">{service.title}</h3>

      {/* Short description */}
      <p className="text-muted-neutral-900 leading-relaxed mb-4">
        {service.shortDescription}
      </p>

      {/* Expanded content */}
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="pt-4 border-t border-border">
          {service.expandedDescription.split("\n\n").map((paragraph, i) => (
            <p key={i} className="text-muted-neutral-900 leading-relaxed mb-3">
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      {/* Expand button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm font-semibold text-neutral-900 mt-4 hover:text-[#2b825b] transition-colors"
      >
        {isExpanded ? "Read Less" : "Read More"}
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-300 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>
    </div>
  );
};

const ServicesSection = () => {
  return (
    <section id="services" className="py-20 md:py-28 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-block px-4 py-1 bg-[#2b825b]/20 border border-[#2b825b] text-sm font-semibold mb-4">
            OUR SERVICES
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6">
            Our Key Services
          </h2>
          <p className="text-lg text-muted-neutral-900">
            Comprehensive financial solutions tailored for Nigerian businesses
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {services.map((service, index) => (
            <ServiceCard key={service.title} service={service} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
