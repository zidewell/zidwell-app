"use client";

import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  BookOpen,
  Wallet,
  Receipt,
  FileText,
  FileSignature,
  ArrowLeftRight,
  DollarSign,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const primarySections = [
  {
    label: "Bookkeeping",
    cards: [
      {
        title: "Today's Income",
        value: "₦1,245,000",
        icon: TrendingUp,
        indicator: "bg-[#2b825b]",
        change: "+12%",
      },
      {
        title: "Today's Expenses",
        value: "₦342,500",
        icon: TrendingDown,
        indicator: "bg-[#db3a34]",
        change: "-8%",
      },
      {
        title: "Monthly Net Balance",
        value: "₦4,820,000",
        icon: DollarSign,
        indicator: "bg-[#2b825b]",
        change: "+18%",
      },
      {
        title: "Total Records",
        value: "312",
        icon: BookOpen,
        indicator: "bg-[#2b825b]",
        change: "+45",
      },
    ],
  },
  {
    label: "Wallet",
    cards: [
      {
        title: "Wallet Balance",
        value: "₦2,150,000",
        icon: Wallet,
        indicator: "bg-[#2b825b]",
        change: "+₦50k",
      },
      {
        title: "All-Time Balance",
        value: "₦18,430,000",
        icon: DollarSign,
        indicator: "bg-[#2b825b]",
        change: "",
      },
      {
        title: "Wallet Transactions",
        value: "89",
        icon: ArrowLeftRight,
        indicator: "bg-[#3b82f6]",
        change: "+14",
      },
      {
        title: "Last Funded",
        value: "₦500,000",
        icon: TrendingUp,
        indicator: "bg-[#2b825b]",
        change: "Today",
      },
    ],
  },
];

const secondarySections = [
  {
    label: "Receipts",
    cards: [
      {
        title: "Receipts Issued",
        value: "18",
        icon: Receipt,
        indicator: "bg-[#2b825b]",
        change: "+5",
      },
      {
        title: "Receipts (Month)",
        value: "124",
        icon: Receipt,
        indicator: "bg-[#2b825b]",
        change: "+32",
      },
      {
        title: "Total Value",
        value: "₦3,200,000",
        icon: DollarSign,
        indicator: "bg-[#2b825b]",
        change: "+15%",
      },
      {
        title: "Pending",
        value: "3",
        icon: Receipt,
        indicator: "bg-[#f5b041]",
        change: "-2",
      },
    ],
  },
  {
    label: "Invoices",
    cards: [
      {
        title: "Invoices Sent",
        value: "24",
        icon: FileText,
        indicator: "bg-[#3b82f6]",
        change: "+3",
      },
      {
        title: "Invoices (Month)",
        value: "98",
        icon: FileText,
        indicator: "bg-[#3b82f6]",
        change: "+18",
      },
      {
        title: "Total Billed",
        value: "₦7,650,000",
        icon: DollarSign,
        indicator: "bg-[#3b82f6]",
        change: "+22%",
      },
      {
        title: "Overdue",
        value: "5",
        icon: FileText,
        indicator: "bg-[#db3a34]",
        change: "+1",
      },
    ],
  },
  {
    label: "Contracts",
    cards: [
      {
        title: "Active Contracts",
        value: "7",
        icon: FileSignature,
        indicator: "bg-[#f5b041]",
        change: "0",
      },
      {
        title: "Total Value",
        value: "₦12,400,000",
        icon: DollarSign,
        indicator: "bg-[#f5b041]",
        change: "+₦2M",
      },
      {
        title: "Expiring Soon",
        value: "2",
        icon: FileSignature,
        indicator: "bg-[#db3a34]",
        change: "",
      },
      {
        title: "Completed",
        value: "15",
        icon: FileSignature,
        indicator: "bg-[#2b825b]",
        change: "+3",
      },
    ],
  },
];

const SectionGrid = ({ section }: { section: (typeof primarySections)[0] }) => (
  <div>
    <h4 className="text-sm  font-bold text-[#6b6b6b] dark:text-[#a6a6a6] uppercase tracking-widest mb-4">
      {section.label}
    </h4>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
      {section.cards.map((s) => (
        <div
          key={s.title}
          className="relative bg-[#ffffff] dark:bg-[#171717] border-2 border-[#242424] dark:border-[#474747] rounded-md p-6 overflow-hidden
                     shadow-[2px_2px_0px_#242424] dark:shadow-[2px_2px_0px_#000000] cursor-pointer transition-all duration-150
                     hover:shadow-[6px_6px_0px_#242424] dark:hover:shadow-[6px_6px_0px_rgba(43,130,91,0.4)] hover:-translate-x-[1px] hover:-translate-y-[1px]
                     active:shadow-none active:translate-x-0.5 active:translate-y-0.5"
        >
          <div
            className={`absolute top-0 left-0 right-0 h-1.5 ${s.indicator}`}
          />

          <div className="flex items-start justify-between mb-5">
            <div className="p-3 rounded-md bg-[#f0efe7] dark:bg-[#242424] border-2 border-[#242424] dark:border-[#474747]">
              <s.icon className="w-5 h-5 text-[#141414] dark:text-[#f5f5f5]" />
            </div>
            {s.change && (
              <span
                className={`text-sm  font-bold ${
                  s.change.startsWith("+")
                    ? "text-[#2b825b]"
                    : s.change.startsWith("-")
                      ? "text-[#db3a34]"
                      : "text-[#6b6b6b] dark:text-[#a6a6a6]"
                }`}
              >
                {s.change}
              </span>
            )}
          </div>

          <p className=" text-2xl font-bold text-[#141414] dark:text-[#f5f5f5] leading-tight">
            {s.value}
          </p>
          <p className="text-sm text-[#6b6b6b] dark:text-[#a6a6a6] mt-2  font-medium">
            {s.title}
          </p>
        </div>
      ))}
    </div>
  </div>
);

const DataOverviewCards = () => {
  const [showMore, setShowMore] = useState(false);

  return (
    <div className="space-y-8">
      {primarySections.map((section) => (
        <SectionGrid key={section.label} section={section} />
      ))}

      {showMore &&
        secondarySections.map((section) => (
          <SectionGrid key={section.label} section={section} />
        ))}

      <button
        onClick={() => setShowMore(!showMore)}
        className="flex items-center gap-2 px-5 py-3 bg-[#ffffff] dark:bg-[#171717] border-2 border-[#242424] dark:border-[#474747] rounded-md  font-bold text-sm text-[#141414] dark:text-[#f5f5f5] uppercase tracking-wide
                   shadow-[2px_2px_0px_#242424] dark:shadow-[2px_2px_0px_#000000] hover:shadow-[6px_6px_0px_#242424] dark:hover:shadow-[6px_6px_0px_rgba(43,130,91,0.4)] hover:-translate-x-[1px] hover:-translate-y-[1px]
                   active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all"
      >
        {showMore ? (
          <>
            Show Less <ChevronUp className="w-4 h-4" />
          </>
        ) : (
          <>
            See More Stats <ChevronDown className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
};

export default DataOverviewCards;
