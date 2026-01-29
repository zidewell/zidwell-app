"use client";

import Link from "next/link";
import {
  FileText,
  ArrowRight,
  CheckCircle,
  Shield,
  Zap,
  CreditCard,
  Bell,
  Download,
  ArrowLeft,
} from "lucide-react";

import { Button } from "@/app/components/ui/button";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { useRouter } from "next/navigation";

export default function InvoicePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background fade-in">
      <Header />

      {/* Back Button */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="text-[#C29307] hover:bg-white/10 text-sm md:text-base"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span className="hidden md:block">Back</span>
        </Button>
      </div>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-12 md:py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-[#C29307]/10 mb-6">
            <FileText className="h-8 w-8 text-[#C29307]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Professional Invoices & Payment System
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Create beautiful invoices, accept payments instantly, and get paid
            faster with our complete billing solution.
          </p>
        </div>

        {/* How It Works Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            Simple & Effective Process
          </h2>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Create Invoice",
                description:
                  "Fill in your business details and add items with automatic calculations",
                icon: FileText,
              },
              {
                step: "2",
                title: "Generate Link",
                description:
                  "Get a secure payment link instantly for your invoice",
                icon: CreditCard,
              },
              {
                step: "3",
                title: "Share with Client",
                description:
                  "Send via WhatsApp, email, or any messaging platform",
                icon: Bell,
              },
              {
                step: "4",
                title: "Get Paid",
                description:
                  "Receive instant notification when payment is completed",
                icon: Zap,
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="relative mb-4">
                  <div className="h-16 w-16 rounded-full bg-[#C29307] text-white flex items-center justify-center text-2xl font-bold mx-auto">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose Our Invoice System
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Professional Templates",
                description:
                  "Customizable invoice templates that reflect your brand",
                icon: (
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                ),
              },
              {
                title: "Instant Payment Links",
                description:
                  "Generate secure links for immediate payment collection",
                icon: (
                  <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-green-600" />
                  </div>
                ),
              },
              {
                title: "Real-time Notifications",
                description:
                  "Get notified instantly when clients view or pay invoices",
                icon: (
                  <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Bell className="h-5 w-5 text-purple-600" />
                  </div>
                ),
              },
              {
                title: "PDF Download",
                description:
                  "Download professional PDF copies for your records",
                icon: (
                  <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Download className="h-5 w-5 text-orange-600" />
                  </div>
                ),
              },
              {
                title: "Secure & Reliable",
                description:
                  "Bank-level security for all transactions and data",
                icon: (
                  <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-red-600" />
                  </div>
                ),
              },
              {
                title: "Fast Processing",
                description: "Quick invoice creation and payment processing",
                icon: (
                  <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-yellow-600" />
                  </div>
                ),
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {feature.icon}
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Section */}
        <div className="bg-linear-to-r from-[#C29307]/5 to-[#C29307]/10 rounded-2xl p-8 md:p-12 mb-16">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Transparent Pricing</h2>
            <p className="text-xl mb-8">
              Pay only when you get paid. No hidden fees, no monthly
              subscriptions.
            </p>

            <div className="bg-white rounded-xl p-8 shadow-lg inline-block">
              <div className="text-5xl font-bold text-[#C29307] mb-2">2%</div>
              <div className="text-2xl font-semibold mb-4">per transaction</div>
              <div className="text-lg text-muted-foreground">
                Capped at ₦2,000 maximum fee per invoice
              </div>
              <div className="mt-6 text-sm text-gray-500">
                * Fee can be optionally transferred to the customer
              </div>
            </div>

            <div className="mt-8 grid md:grid-cols-3 gap-6">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>No setup fees</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>No monthly charges</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Pay-as-you-go</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Paid Faster?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Join thousands of businesses that trust our invoice and payment
            system to streamline their billing process.
          </p>

          <Link href="/dashboard/services/create-invoice">
            <Button
              className="bg-[#C29307] hover:bg-[#b38606] text-white px-8 py-6 text-lg"
              size="lg"
            >
              Create Your First Invoice
              <ArrowRight className="ml-3 h-5 w-5" />
            </Button>
          </Link>

          <p className="mt-4 text-sm text-muted-foreground">
            No credit card required to get started
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
