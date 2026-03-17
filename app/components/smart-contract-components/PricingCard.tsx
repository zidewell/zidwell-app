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
      className={`p-6 rounded-lg shadow ${featured ? "border-2 border-[#2b825b]  bg-green-50" : "bg-white border"} `}
    >
      <h4 className=" text-2xl ">{title}</h4>
      <p className="text-gray-600">{desc}</p>

      <div className="mt-4 text-4xl">
        {price}
        <span className="text-sm font-normal ">/contracts</span>
      </div>

      <ul className="mt-4 space-y-2 text-sm text-gray-600">
        {features.map((f, i) => (
          <li className="flex gap-1 " key={i}>
            <CircleCheck color="#2b825b" /> {f}
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
