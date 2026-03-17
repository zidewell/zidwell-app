import { FileText, Shield, Smartphone } from "lucide-react";
import React from "react";

function ReceiptFeature() {
  return (
    <section className="py-16 sm:py-20">
      <div className="container">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-foreground mb-12">
          Everything You Need
        </h2>

        <div className="grid gap-6 sm:grid-cols-3 max-w-4xl mx-auto">
          {[
            {
              icon: FileText,
              title: "Multiple Receipt Types",
              description:
                "Products, services, bookings, rentals, funds transfers — all covered.",
            },
            {
              icon: Shield,
              title: "Legal Proof",
              description:
                "Both parties sign and acknowledge. Clear record of delivery.",
            },
            {
              icon: Smartphone,
              title: "Mobile Friendly",
              description: "Create and sign receipts on any device, anywhere.",
            },
          ].map((feature, index) => (
            <div
              key={feature.title}
              className="p-6 rounded-xl bg-card border border-border transition-all duration-300 animate-slide-up hover:border-[#2b825b]/80 hover:shadow-gold"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="h-12 w-12 rounded-lg flex items-center justify-center mb-4 bg-[#2b825b]/15">
                <feature.icon className="h-6 w-6 text-[#2b825b]" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ReceiptFeature;
