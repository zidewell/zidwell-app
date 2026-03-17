import React from "react";
import FeatureCard from "./FeatureCard";
import { FileText, Shield, Zap } from "lucide-react";

const Features: React.FC = () => (
  <section className="py-12 bg-gray-50">
    <div className="container mx-auto px-6 md:px-12 lg:px-20">
      <h1 className="text-center text-xl lg:text-4xl mb-6">
        Why Choose Zidwell Contracts?
      </h1>
      <p className="text-center text-sm text-gray-500 mb-8">
        Everything you need for professional contract management
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <FeatureCard
          title="Lightning Fast"
          desc="Create and share contracts in minutes, not hours. Our templates and signing flows cut time to signature."
          icon={<Zap color="#2b825b" />}
        />
        <FeatureCard
          title="Legally Binding"
          desc="Secure e-signatures and compliant audit trails ensure your contracts are enforceable."
          icon={<Shield color="#2b825b" />}
        />
        <FeatureCard
          title="Professional Templates"
          desc="Ready-made templates for NDAs, employment, service agreements and more."
          icon={<FileText color="#2b825b" />}
        />
      </div>
    </div>
  </section>
);

export default Features;
