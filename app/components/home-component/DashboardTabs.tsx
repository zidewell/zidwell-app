// app/components/home-component/DashboardTabs.tsx
"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { DashboardChart } from "./DashboardChart";
import { MoneyFlow } from "./MoneyFlow";
import { HealthScore } from "./HealthScore";

const tabs = [
  { id: "balance", label: "Where is my money?" },
  { id: "flow", label: "Where did it go?" },
  { id: "health", label: "Am I healthy?" },
];

export function DashboardTabs() {
  const [active, setActive] = useState("balance");

  return (
    <section id="dashboard" className="py-28 bg-background">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-24">
              <p className="text-xs font-semibold uppercase tracking-widest text-leaf mb-4">
                The dashboard
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">
                See your money clearly.
              </h2>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                No charts you don&apos;t understand. Just three views that answer
                the three questions every founder asks.
              </p>

              <div className="mt-8 flex flex-col gap-1">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActive(t.id)}
                    className={`text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-200 flex items-center gap-2 cursor-pointer ${
                      active === t.id
                        ? "bg-surface text-foreground border border-border"
                        : "text-muted-foreground hover:text-foreground hover:bg-surface/50"
                    }`}
                  >
                    <ArrowRight
                      className={`h-3.5 w-3.5 transition-all ${
                        active === t.id
                          ? "text-primary-custom rotate-0 opacity-100"
                          : "-rotate-90 opacity-0"
                      }`}
                    />
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="mt-8 squircle-sm bg-surface border border-border p-4">
                <p className="text-xs text-muted-foreground italic leading-relaxed">
                  &ldquo;I check it every Monday morning like a ritual. It&apos;s
                  how I know if the week is going to be good.&rdquo;
                </p>
                <p className="mt-2 text-[11px] font-medium text-foreground not-italic">
                  — Amaka O., retail, Lagos
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            {active === "balance" && <DashboardChart />}
            {active === "flow" && <MoneyFlow />}
            {active === "health" && <HealthScore />}
          </div>
        </div>
      </div>
    </section>
  );
}