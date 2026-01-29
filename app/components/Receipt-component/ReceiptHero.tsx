import { ArrowRight, FileText, Zap } from "lucide-react";
import React from "react";
import { Button } from "../ui/button";
import Link from "next/link";

function ReceiptHero() {
  return (
    <section className="relative overflow-hidden">
      {/* <div className="absolute inset-0 bg-linear-to-br from-[#C29307] to-transparent" /> */}
      <div className="container relative py-16 sm:py-24">
        <div className="max-w-2xl mx-auto text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium mb-6 bg-[#C29307]/15 border border-[#C29307]/30 text-[#C29307]">
            <Zap className="h-4 w-4" />
            Simple. Secure. Professional.
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 tracking-tight">
            Create Receipts That{" "}
            <span className="text-[#C29307]">Prove Delivery</span>
          </h1>

          <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
            Generate professional receipts for your business transactions.
            Sellers declare delivery, receivers confirm — simple, clear, legally
            sound.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard/services/receipt/create-receipt">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-[#C29307] hover:bg-[#C29307]/90 text-white"
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
