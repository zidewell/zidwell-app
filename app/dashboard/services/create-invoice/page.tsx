"use client";

import Link from "next/link";
import { FileText, ArrowRight, ArrowLeft } from "lucide-react";

import DashboardSidebar from "@/app/components/dashboard-sidebar";
import DashboardHeader from "@/app/components/dashboard-hearder";

import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { usePathname, useRouter } from "next/navigation";
import InvoiceGen from "@/app/components/Invoice-components/InvoiceGen"; 
import Image from "next/image";

export default function invoicePage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-background fade-in">
      {/* Sidebar */}
      <DashboardSidebar />

      {/* Main Layout */}
      <div className="lg:ml-64">
        {/* Header */}
        <DashboardHeader />

        {/* Page Content */}
        <main className="p-6">
          <div className="container mx-auto px-4 py-5">
            {/* Hero Section */}
            <div className="flex items-start  space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="text-[#C29307] hover:bg-white/10 text-sm md:text-base"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="hidden md:block">Back</span>
              </Button>

              <div className="mb-4">
                <h1 className="md:text-3xl text-xl font-bold mb-2">
                  Invoice & Payment System
                </h1>
                <p className=" text-muted-foreground">
                  Create professional invoices and accept payments seamlessly.
                  Get paid faster with our elegant payment links.
                </p>
              </div>
            </div>

            {/* {typeof window !== "undefined" &&
            window.location.hostname.includes("zidwell.com") ? (
              <Image
                src={"/coming-soon.png"}
                alt="coming soon"
                className=" w-full object-contain"
                width={500}
                height={500}
              />
            ) : (
             
            )} */}

            <>
              {/* CTA Section */}
              <div className="max-w-4xl mx-auto">
                <Card className="p-8 md:p-12">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="h-12 w-12 rounded-lg bg-[#C29307]/10 flex items-center justify-center mb-4">
                        <FileText className="h-6 w-6 text-[#C29307]" />
                      </div>

                      <h3 className="text-2xl font-bold text-foreground">
                        Create Invoice
                      </h3>
                      <p className="text-muted-foreground">
                        Generate professional invoices with itemized billing,
                        automatic calculations, and instant payment links.
                      </p>

                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-[#C29307] mr-2" />
                          Live preview as you create
                        </li>
                        <li className="flex items-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-[#C29307] mr-2" />
                          Custom business branding
                        </li>
                        <li className="flex items-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-[#C29307] mr-2" />
                          Shareable payment links
                        </li>
                        <li className="flex items-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-[#C29307] mr-2" />
                          PDF download option
                        </li>
                      </ul>

                      <Link href="/dashboard/services/create-invoice/create">
                        <Button
                          className="bg-[#C29307] hover:bg-[#b38606] text-white"
                          size="lg"
                        >
                          Create Invoice
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-muted/50 rounded-lg p-6 border border-border">
                        <h4 className="font-semibold text-foreground mb-3">
                          How it works
                        </h4>

                        <ol className="space-y-3 text-sm text-muted-foreground">
                          {[
                            "Fill in your business details and add invoice items",
                            "Generate invoice and copy the payment link",
                            "Share via WhatsApp or email with your client",
                            "Client pays securely and you get instant notification",
                          ].map((text, i) => (
                            <li key={i} className="flex gap-3">
                              <span className="shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-[#C29307] text-white text-xs font-bold">
                                {i + 1}
                              </span>
                              <span>{text}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      <div className="bg-[#C29307]/10 rounded-lg p-4 border border-[#C29307]/20">
                        <p className="text-sm text-foreground">
                          <span className="font-semibold">Platform fee:</span>{" "}
                          Only 2% per transaction, capped at ₦2,000,
                          transferable to the customer.
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Invoice History */}
              <div className="max-w-4xl mx-auto mt-16">
                <InvoiceGen />
              </div>
            </>
          </div>
        </main>
      </div>
    </div>
  );
}
