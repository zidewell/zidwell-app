// app/components/smart-contract/Features.tsx
import React from "react";
import FeatureCard from "./FeatureCard";
import { FileText, Shield, Zap } from "lucide-react";

const Features: React.FC = () => (
  <section className="py-12 bg-[var(--bg-secondary)]">
    <div className="container mx-auto px-6 md:px-12 lg:px-20">
      <h1 className="text-center text-xl lg:text-4xl mb-6 text-[var(--text-primary)]">
        Why Choose Zidwell Contracts?
      </h1>
      <p className="text-center text-sm text-[var(--text-secondary)] mb-8">
        Everything you need for professional contract management
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <FeatureCard
          title="Lightning Fast"
          desc="Create and share contracts in minutes, not hours. Our templates and signing flows cut time to signature."
          icon={<Zap className="text-[var(--color-accent-yellow)]" />}
        />
        <FeatureCard
          title="Legally Binding"
          desc="Secure e-signatures and compliant audit trails ensure your contracts are enforceable."
          icon={<Shield className="text-[var(--color-accent-yellow)]" />}
        />
        <FeatureCard
          title="Professional Templates"
          desc="Ready-made templates for NDAs, employment, service agreements and more."
          icon={<FileText className="text-[var(--color-accent-yellow)]" />}
        />
      </div>
    </div>
  </section>
);

export default Features;