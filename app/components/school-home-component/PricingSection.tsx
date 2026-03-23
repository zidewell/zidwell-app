"use client"
import { Check } from "lucide-react";

const plans = [
  {
    name: "Cohort-Based Virtual Class",
    price: "₦80,000",
    features: [
      "Live virtual classes",
      "Group learning environment",
      "Access to recordings",
      "Certificate of completion",
    ],
    cta: "Enroll Now",
    featured: false,
  },
  {
    name: "Private Coaching",
    price: "₦250,000",
    features: [
      "Personalized mentorship",
      "Private strategy sessions",
      "Custom growth plan",
      "Priority support",
    ],
    cta: "Apply for Coaching",
    featured: true,
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-20">
      <div className="container">
        <div className="mb-12 text-center">
          <span className="brutal-button bg-secondary text-secondary-foreground px-4 py-1 text-xs inline-block mb-4">
            Pricing
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
            Choose Your Learning Format
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`brutal-card p-8 flex flex-col ${
                plan.featured ? "bg-primary text-primary-foreground" : "bg-card"
              }`}
            >
              <h3 className="font-display text-lg font-bold mb-2">
                {plan.name}
              </h3>
              <p
                className={`font-display text-4xl font-bold mb-6 ${
                  plan.featured ? "text-secondary" : ""
                }`}
              >
                {plan.price}
              </p>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm font-body">
                    <Check
                      size={16}
                      className={plan.featured ? "text-secondary" : "text-secondary"}
                    />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className={`brutal-button w-full py-3 text-sm ${
                  plan.featured
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
