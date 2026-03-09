import React from 'react'
import PricingCard from './PricingCard';

const Pricing: React.FC = () => (
  <section id='contract-pricing' className="py-12 bg-gray-50">
    <div className="container mx-auto px-6 md:px-12 lg:px-20">
      <h3 className="text-center text-xl lg:text-4xl font-bold mb-6 ">Simple, Transparent Pricing</h3>
      <p className="text-center text-lg text-gray-500 mb-8 ">Pay only for what you need. No hidden fees.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <PricingCard title="Standard Contract" desc="Perfect for most business agreements" price="₦1,000" features={["Unlimited contract templates", "Email delivery to signees", "NIN identity verification","Digital signatures","PDF download"]} />
        <PricingCard title="With Lawyer Signature" desc="Add legal witness for maximum authenticity" price="₦10,000" features={["Everything in Standard", "Official lawyer signature & seal", "Enhanced legal standing","Professional notarization"]} featured />
      </div>
    </div>
  </section>
);

export default Pricing
