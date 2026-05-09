// app/components/sign-contract-form-component/HowItWorks.tsx
import SignContractStep from "./SignContractStep";

const HowItWorks: React.FC = () => (
  <section className="border border-(--border-color) rounded p-4 mb-6 bg-(--bg-primary)">
    <h3 className="text-sm font-medium text-(--text-primary)">How It Works</h3>
    <p className="text-xs text-(--text-secondary) mt-1">
      Three simple steps to get your contract signed
    </p>
    <ol className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
      <SignContractStep num={1} title="Create Contract">
        Write or use our templates to create your contract
      </SignContractStep>
      <SignContractStep num={2} title="Send for Signature">
        Add signers' details and send via email
      </SignContractStep>
      <SignContractStep num={3} title="Get Signed">
        Receive legally witnessed signed documents
      </SignContractStep>
    </ol>
  </section>
);

export default HowItWorks;
