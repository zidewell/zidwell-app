"use client";

import { PiggyBank, HeartPulse, Sunrise, LucideIcon } from "lucide-react";

interface Goal {
  title: string;
  tag: string;
  desc: string;
  balance: string;
  target: string;
  progress: number;
  icon: LucideIcon;
}

const goals: Goal[] = [
  {
    title: "Savings",
    tag: "Reserve",
    desc: "Set aside money for taxes, salaries, or emergencies",
    balance: "₦3,400,000",
    target: "₦5,000,000",
    progress: 68,
    icon: PiggyBank,
  },
  {
    title: "HMO",
    tag: "Health",
    desc: "Health insurance for you and your team",
    balance: "₦820,000",
    target: "₦2,000,000",
    progress: 41,
    icon: HeartPulse,
  },
  {
    title: "Retirement",
    tag: "Life Goal",
    desc: "Build your future pension",
    balance: "₦6,150,000",
    target: "₦25,000,000",
    progress: 25,
    icon: Sunrise,
  },
];

const GoalCircle = ({ goal }: { goal: Goal }) => {
  const r = 132;
  const c = 2 * Math.PI * r;
  return (
    <div className="group flex flex-col items-center text-center">
      <div className="relative grid aspect-square w-full max-w-[19rem] place-items-center rounded-full bg-(--bg-primary) border-2 border-(--border-color) shadow-[4px_4px_0px_var(--border-color)] transition-all duration-500 ease-out hover:shadow-[6px_6px_0px_var(--border-color)] hover:-translate-x-px hover:-translate-y-px">
        <svg viewBox="0 0 300 300" className="absolute inset-0 h-full w-full -rotate-90">
          <circle cx="150" cy="150" r={r} fill="none" stroke="var(--border-color)" strokeWidth="10" />
          <circle
            cx="150"
            cy="150"
            r={r}
            fill="none"
            stroke="#00B64F"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - goal.progress / 100)}
            className="transition-all duration-700"
          />
        </svg>
        <div className="flex flex-col items-center px-14">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-[#00B64F]/12 text-[#00B64F]">
            <goal.icon className="h-6 w-6" strokeWidth={1.4} />
          </span>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-(--text-secondary)">
            {goal.tag}
          </p>
          <p className="mt-1 text-xl font-extrabold tracking-tight text-(--text-primary)">{goal.title}</p>
          <p className="mt-3 text-2xl font-bold text-(--text-primary) leading-none sm:text-[1.7rem]">
            {goal.balance}
          </p>
          <p className="mt-2 text-xs text-(--text-secondary)">
            {goal.progress}% of {goal.target}
          </p>
        </div>
      </div>
      <p className="mt-6 max-w-[19rem] text-sm leading-relaxed text-(--text-secondary)">{goal.desc}</p>
    </div>
  );
};

const FutureMoney = () => (
  <div className="space-y-10">
    <section className="bg-(--bg-primary) border-2 border-(--border-color) rounded-md p-8 shadow-[4px_4px_0px_var(--border-color)] relative overflow-hidden">
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#00B64F]/25 blur-3xl" />
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-(--text-secondary)">
        Total Future Money
      </p>
      <p className="text-[clamp(2.75rem,7vw,5.5rem)] font-bold leading-none text-(--text-primary) mt-4">
        ₦10,370,000
      </p>
      <p className="mt-5 max-w-xl text-base leading-relaxed text-(--text-secondary)">
        Money you have already promised to your future — reserves, health cover and retirement, kept
        separate from today's spending.
      </p>
    </section>

    <section className="grid justify-items-center gap-10 sm:grid-cols-2 xl:grid-cols-3">
      {goals.map((g) => (
        <GoalCircle key={g.title} goal={g} />
      ))}
    </section>
  </div>
);

export default FutureMoney;