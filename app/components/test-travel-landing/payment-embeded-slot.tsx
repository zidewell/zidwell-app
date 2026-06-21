// components/PaymentEmbedSlot.tsx
"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input"; 
import { Label } from "../ui/label"; 
import { Plane, ShieldCheck } from "lucide-react";
import { usePayment } from "./PaymentContext"; 
import { PaymentCodeEditor } from "./PaymentCodeEditor"; 

type Props = {
  packageName: string;
  price: string;
  ctaText: string;
};

export function PaymentEmbedSlot({ packageName, price, ctaText }: Props) {
  const [mode, setMode] = useState<"full" | "installment">("full");
  const { embedCode } = usePayment();

  return (
    <div className="payment-widget-placeholder rounded-2xl border border-border bg-surface/80 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground">
            <Plane className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Skyline Travels</p>
            <p className="text-sm font-medium text-foreground">{packageName}</p>
          </div>
        </div>
        <p className="font-display text-2xl text-foreground">{price}</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 rounded-full bg-background p-1 text-sm">
        <button
          type="button"
          onClick={() => setMode("full")}
          className={`rounded-full py-1.5 transition ${
            mode === "full"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Full payment
        </button>
        <button
          type="button"
          onClick={() => setMode("installment")}
          className={`rounded-full py-1.5 transition ${
            mode === "installment"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Installments
        </button>
      </div>

      <div className="mt-4 grid gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor={`${packageName}-name`}>Full name</Label>
          <Input id={`${packageName}-name`} placeholder="As shown on passport" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor={`${packageName}-email`}>Email</Label>
            <Input id={`${packageName}-email`} type="email" placeholder="you@example.com" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`${packageName}-phone`}>Phone</Label>
            <Input id={`${packageName}-phone`} type="tel" placeholder="+234 …" />
          </div>
        </div>
      </div>

      {/* Dynamic Payment Button */}
      <div className="mt-5 flex justify-center">
        <div
          dangerouslySetInnerHTML={{ __html: embedCode }}
          className="inline-block"
        />
      </div>

      {/* Customize button - now below the payment button */}
      <div className="mt-4 flex justify-center">
        <PaymentCodeEditor />
      </div>

      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" />
        Secure checkout · Embedded payment area
      </p>
    </div>
  );
}