// app/components/sign-contract-form-component/SignContractStep.tsx
import React from "react";

const SignContractStep: React.FC<{
  num: number;
  title: string;
  children?: React.ReactNode;
}> = ({ num, title, children }) => (
  <div className="flex items-start gap-3 p-3 rounded border border-(--border-color) bg-(--bg-primary)">
    <div className="shrink-0 h-8 w-8 rounded-full bg-(--color-accent-yellow)/10 text-(--color-accent-yellow) flex items-center justify-center font-semibold">
      {num}
    </div>
    <div>
      <div className="text-sm font-medium text-(--text-primary)">{title}</div>
      <div className="text-xs text-(--text-secondary) mt-1">{children}</div>
    </div>
  </div>
);

export default SignContractStep;
