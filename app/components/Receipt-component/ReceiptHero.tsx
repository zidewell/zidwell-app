import { ArrowRight, FileText, Zap } from "lucide-react";
import React from "react";
import { Button } from "../ui/button";
import Link from "next/link";

function ReceiptHero() {
  return (
    <section className="relative overflow-hidden">
      <div className="container relative py-16 sm:py-24">
        <div className="max-w-2xl mx-auto text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium mb-6 bg-(--color-accent-yellow)/15 border border-(--color-accent-yellow)/30 text-(--color-accent-yellow)">
            <Zap className="h-4 w-4" />
            Simple. Secure. Professional.
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-(--text-primary) mb-4 tracking-tight">
            Create Receipts That{" "}
            <span className="text-(--color-accent-yellow)">Prove Delivery</span>
          </h1>

          <p className="text-lg text-(--text-secondary) mb-8 max-w-lg mx-auto">
            Generate professional receipts for your business transactions.
            Sellers declare delivery, receivers confirm, simple, clear, legally
            sound.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard/services/receipt/create-receipt">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-(--color-accent-yellow) hover:bg-(--color-accent-yellow)/90 text-(--color-ink) squircle-md"
              >
                <FileText className="h-5 w-5 mr-2" />
                Create Receipt
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ReceiptHero;
