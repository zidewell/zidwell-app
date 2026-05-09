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
import { useRouter } from "next/navigation";

import { Button } from "@/app/components/ui/button";
import Header from "@/app/components/home-component/Header";
import Footer from "@/app/components/home-component/Footer";

export default function InvoicePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-(--bg-primary) fade-in">
      <Header />

      {/* Back Button */}
      <div className="max-w-6xl mx-auto px-4 pt-24 md:pt-28">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="text-(--color-accent-yellow) hover:bg-(--bg-secondary) text-sm md:text-base squircle-md"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span className="hidden md:block">Back</span>
        </Button>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12 md:py-20">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center h-16 w-16 squircle-full bg-(--color-accent-yellow)/10 mb-6">
            <FileText className="h-8 w-8 text-(--color-accent-yellow)" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-(--text-primary)">
            Professional Invoices &{" "}
            <span className="text-(--color-accent-yellow)">Payment System</span>
          </h1>
          <p className="text-xl text-(--text-secondary) max-w-3xl mx-auto">
            Create beautiful invoices, accept payments instantly, and get paid
            faster with our complete billing solution. No stress, no hassle.
          </p>
        </div>

        {/* How It Works Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12 text-(--text-primary)">
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
              <div key={item.step} className="text-center group">
                <div className="relative mb-4">
                  <div className="h-16 w-16 squircle-full bg-(--color-accent-yellow) text-(--color-ink) flex items-center justify-center text-2xl font-bold mx-auto shadow-soft group-hover:shadow-pop transition-all">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-(--text-primary)">
                  {item.title}
                </h3>
                <p className="text-(--text-secondary)">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12 text-(--text-primary)">
            Why Choose Our Invoice System
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Professional Templates",
                description:
                  "Customizable invoice templates that reflect your brand identity",
                icon: FileText,
              },
              {
                title: "Instant Payment Links",
                description:
                  "Generate secure links for immediate payment collection from clients",
                icon: CreditCard,
              },
              {
                title: "Real-time Notifications",
                description:
                  "Get notified instantly when clients view or pay your invoices",
                icon: Bell,
              },
              {
                title: "PDF Download",
                description:
                  "Download professional PDF copies of invoices for your records",
                icon: Download,
              },
              {
                title: "Secure & Reliable",
                description:
                  "Bank-level security for all transactions and sensitive data",
                icon: Shield,
              },
              {
                title: "Fast Processing",
                description:
                  "Quick invoice creation and instant payment processing",
                icon: Zap,
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-(--bg-primary) p-6 border border-(--border-color) shadow-soft hover:shadow-pop transition-all hover:-translate-y-1 squircle-lg"
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 squircle-md bg-(--color-accent-yellow)/10 flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-(--color-accent-yellow)" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-(--text-primary)">
                      {feature.title}
                    </h3>
                    <p className="text-(--text-secondary)">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Section */}
        <div className="bg-linear-to-r from-(--color-accent-yellow)/5 to-(--color-accent-yellow)/10 squircle-lg p-8 md:p-12 mb-20">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4 text-(--text-primary)">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-(--text-secondary) mb-8">
              Pay only when you get paid. No hidden fees, no monthly
              subscriptions.
            </p>

            <div className="bg-(--bg-primary) squircle-lg p-8 shadow-pop border border-(--border-color)">
              <div className="text-5xl font-bold text-(--color-accent-yellow) mb-2">
                2%
              </div>
              <div className="text-2xl font-semibold mb-4 text-(--text-primary)">
                per transaction
              </div>
              <div className="text-lg text-(--text-secondary)">
                Capped at ₦2,000 maximum fee per invoice
              </div>
              <div className="mt-6 text-sm text-(--text-secondary)">
                * Fee can be optionally transferred to the customer
              </div>
            </div>

            <div className="mt-8 grid md:grid-cols-3 gap-6">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-5 w-5 text-(--color-lemon-green)" />
                <span className="text-(--text-secondary)">No setup fees</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-5 w-5 text-(--color-lemon-green)" />
                <span className="text-(--text-secondary)">
                  No monthly charges
                </span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-5 w-5 text-(--color-lemon-green)" />
                <span className="text-(--text-secondary)">Pay-as-you-go</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="text-center p-6 bg-(--bg-secondary) squircle-lg border border-(--border-color)">
            <div className="text-4xl font-bold text-(--color-accent-yellow) mb-2">
              10,000+
            </div>
            <div className="text-(--text-secondary)">Businesses Trust Us</div>
          </div>
          <div className="text-center p-6 bg-(--bg-secondary) squircle-lg border border-(--border-color)">
            <div className="text-4xl font-bold text-(--color-accent-yellow) mb-2">
              ₦500M+
            </div>
            <div className="text-(--text-secondary)">Processed Payments</div>
          </div>
          <div className="text-center p-6 bg-(--bg-secondary) squircle-lg border border-(--border-color)">
            <div className="text-4xl font-bold text-(--color-accent-yellow) mb-2">
              98%
            </div>
            <div className="text-(--text-secondary)">Customer Satisfaction</div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-6 text-(--text-primary)">
            Ready to Get Paid Faster?
          </h2>
          <p className="text-xl text-(--text-secondary) max-w-2xl mx-auto mb-8">
            Join thousands of businesses that trust our invoice and payment
            system to streamline their billing process.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button
                className="bg-(--color-accent-yellow) hover:bg-(--color-accent-yellow)/90 text-(--color-ink) px-8 py-6 text-lg font-semibold squircle-md transition-all hover:-translate-y-0.5 hover:shadow-pop"
                size="lg"
              >
                Start Free Trial
                <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-6 text-lg border-2 border-(--color-accent-yellow) text-(--color-accent-yellow) bg-transparent hover:bg-(--color-accent-yellow) hover:text-(--color-ink) squircle-md transition-all"
              >
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
