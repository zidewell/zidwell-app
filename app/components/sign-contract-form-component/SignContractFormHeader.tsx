// app/components/sign-contract-form-component/SignContractFormHeader.tsx
import React from "react";

const SignContractFormHeader: React.FC = () => (
  <header className="text-center">
    <div className="inline-flex items-center justify-center bg-(--bg-primary) px-4 py-2 rounded-full shadow-sm">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6 text-(--color-accent-yellow)"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m2 0a2 2 0 002-2V7a2 2 0 00-2-2h-3M3 7a2 2 0 012-2h3m0 0v2a2 2 0 002 2h2"
        />
      </svg>
    </div>
    <h1 className="text-2xl md:text-3xl font-semibold mt-4 text-(--text-primary)">
      Create &amp; Sign Contracts
    </h1>
    <p className="text-sm text-(--text-secondary) mt-1">
      Create professional contracts, send for signatures, and get them legally
      witnessed — all in one place.
    </p>
  </header>
);

export default SignContractFormHeader;
