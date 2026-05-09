// app/components/smart-contract/FeatureCard.tsx
import React from "react";
import Icon from "./Icon";

const FeatureCard: React.FC<{
  title: string;
  desc: string;
  icon: React.ReactNode;
}> = ({ title, desc, icon }) => (
  <div className="p-6 border border-(--border-color) rounded-lg shadow-soft bg-(--bg-primary)">
    <div className="w-12 h-12 rounded-full bg-(--color-accent-yellow)/10 flex items-center justify-center mb-4">
      <Icon>{icon}</Icon>
    </div>
    <h4 className="text-2xl text-(--text-primary)">{title}</h4>
    <p className="text-sm text-(--text-secondary) mt-2">{desc}</p>
  </div>
);

export default FeatureCard;
