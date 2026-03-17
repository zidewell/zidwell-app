import React from "react";
import Icon from "./Icon";

const FeatureCard: React.FC<{
  title: string;
  desc: string;
  icon: React.ReactNode;
}> = ({ title, desc, icon }) => (
  <div className="p-6 border rounded-lg bg-white shadow-sm">
    <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-4">
      <Icon>{icon}</Icon>
    </div>
    <h4 className="text-2xl">{title}</h4>
    <p className="text-sm text-gray-600 mt-2">{desc}</p>
  </div>
);

export default FeatureCard;
