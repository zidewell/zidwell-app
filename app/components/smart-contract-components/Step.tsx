// app/components/smart-contract/Step.tsx
import React from "react";

const Step: React.FC<{ num: string; title: string; desc: string }> = ({
  num,
  title,
  desc,
}) => (
  <div className="flex flex-col gap-4 items-start">
    <div className="w-12 h-12 flex items-center justify-center rounded-full text-6xl opacity-20 text-[var(--color-accent-yellow)] font-bold">
      {num}
    </div>
    <div>
      <h4 className="font-semibold text-[var(--text-primary)]">{title}</h4>
      <p className="text-sm text-[var(--text-secondary)]">{desc}</p>
    </div>
  </div>
);

export default Step;