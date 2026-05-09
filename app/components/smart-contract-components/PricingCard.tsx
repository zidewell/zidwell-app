// app/components/smart-contract/PricingCard.tsx
import React, { useState } from "react";
import ButtonPrimary from "./ButtonPrimary";
import ButtonGhost from "./ButtonGhost";
import { CircleCheck } from "lucide-react";

const PricingCard: React.FC<{
  title: string;
  desc: string;
  price: string;
  features: string[];
  featured?: boolean;
}> = ({ title, desc, price, features, featured }) => {
  const [selected, setSelected] = useState(false);

  return (
    <div
      className={`p-6 rounded-lg shadow-soft ${featured ? "border-2 border-(--color-accent-yellow) bg-(--color-accent-yellow)/5" : "bg-(--bg-primary) border border-(--border-color)"} `}
    >
      <h4 className="text-2xl text-(--text-primary)">{title}</h4>
      <p className="text-(--text-secondary)">{desc}</p>

      <div className="mt-4 text-4xl text-(--text-primary)">
        {price}
        <span className="text-sm font-normal text-(--text-secondary)">
          /contracts
        </span>
      </div>

      <ul className="mt-4 space-y-2 text-sm text-(--text-secondary)">
        {features.map((f, i) => (
          <li className="flex gap-1" key={i}>
            <CircleCheck className="text-(--color-accent-yellow)" size={16} />{" "}
            {f}
          </li>
        ))}
      </ul>
      {/* 
      <div className="mt-6">
        {selected ? (
          <ButtonPrimary className='w-[300px] '>Get Started</ButtonPrimary>
        ) : (
          <ButtonGhost>Get Started</ButtonGhost>
        )}
      </div> */}

      <div
        className="mt-4 cursor-pointer"
        onClick={() => setSelected(!selected)}
      ></div>
    </div>
  );
};

export default PricingCard;
