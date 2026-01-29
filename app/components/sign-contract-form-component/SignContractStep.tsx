import React from "react";

const SignContractStep: React.FC<{
  num: number;
  title: string;
  children?: React.ReactNode;
}> = ({ num, title, children }) => (
  <div className="flex items-start gap-3 p-3 rounded border border-gray-100">
    <div className="shrink-0 h-8 w-8 rounded-full bg-yellow-50 text-[#C29307] flex items-center justify-center font-semibold">
      {num}
    </div>
    <div>
      <div className="text-sm font-medium">{title}</div>
      <div className="text-xs text-gray-500 mt-1">{children}</div>
    </div>
  </div>
);

export default SignContractStep;
