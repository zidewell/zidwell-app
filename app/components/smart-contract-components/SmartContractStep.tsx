// app/components/smart-contract/SmartContractStep.tsx
import React from "react";
import Step from "./Step";

const SmartContractStep: React.FC = () => (
  <section className="py-12">
    <div className="container mx-auto px-6 md:px-12 lg:px-20 text-center">
      <h3 className="text-xl lg:text-4xl font-semibold mb-4 text-(--text-primary)">
        Simple Process, Professional Results
      </h3>
      <p className="text-lg text-(--text-secondary) mb-8 ">
        Get your contracts signed in three easy steps
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <div className="bg-(--bg-primary) p-6 rounded-lg shadow-soft border border-(--border-color)">
          <Step
            num="01"
            title="Create Your Contract"
            desc="Use our templates or start from scratch. Add recipients and details in minutes."
          />
        </div>
        <div className="bg-(--bg-primary) p-6 rounded-lg shadow-soft border border-(--border-color)">
          <Step
            num="02"
            title="Send for Signature"
            desc="Add signer fields and send a secure link. Track status in realtime."
          />
        </div>
        <div className="bg-(--bg-primary) p-6 rounded-lg shadow-soft border border-(--border-color)">
          <Step
            num="03"
            title="Get Signed & Download"
            desc="Signed copies are stored securely and available for download any time."
          />
        </div>
      </div>
    </div>
  </section>
);

export default SmartContractStep;
