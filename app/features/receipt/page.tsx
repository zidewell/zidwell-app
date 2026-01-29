"use client";

import Link from "next/link";
import {
  Receipt,
  FileText,
  Shield,
  Zap,
  CheckCircle,
  Download,
  Search,
  Bell,
  Lock,
  CreditCard,
  ArrowLeft,
} from "lucide-react";

import { Button } from "@/app/components/ui/button";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { useRouter } from "next/navigation";

export default function ReceiptPage() {
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
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-[#FEF9C2] mb-6">
            <Receipt className="h-8 w-8 text-[#C29307]" />
          </div>
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-4xl md:text-5xl font-bold">
              Professional Receipt Management
            </h1>
            <span className="bg-[#FEF9C2] text-[#C29307] text-sm font-semibold px-3 py-1 rounded-full">
              ₦100 per receipt
            </span>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Pay only for what you use. Create professional digital receipts
            on-demand with our pay-per-create system. No subscriptions, no
            hidden fees.
          </p>
        </div>

        {/* Key Benefits */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Professional Quality</h3>
            <p className="text-muted-foreground">
              Create receipts that build trust and reflect your brand's
              professionalism
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Secure & Verifiable</h3>
            <p className="text-muted-foreground">
              Every receipt is digitally signed and tamper-proof for
              authenticity
            </p>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            Simple 4-Step Process
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Create & Customize",
                description: "Fill in receipt details and customize design",
                icon: FileText,
                color: "bg-blue-500",
              },
              {
                step: "2",
                title: "Preview & Confirm",
                description: "Review your receipt before payment",
                icon: Search,
                color: "bg-green-500",
              },

              {
                step: "4",
                title: "Download & Share",
                description:
                  "Get your receipt instantly as PDF or shareable link",
                icon: Download,
                color: "bg-orange-500",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="relative mb-4">
                  <div
                    className={`h-16 w-16 rounded-full ${item.color} text-white flex items-center justify-center text-2xl font-bold mx-auto`}
                  >
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
            What You Get for ₦100 per Receipt
          </h2>

          <div className="grid md:grid-cols-2  gap-6">
            {[
              {
                title: "Professional Templates",
                description:
                  "Multiple design templates for different business types",
                icon: <FileText className="h-5 w-5 text-[#C29307]" />,
              },
              {
                title: "Custom Branding",
                description: "Add your logo and business information",
                icon: <Receipt className="h-5 w-5 text-green-600" />,
              },
              {
                title: "Digital Security",
                description: "Unique receipt ID and digital signature",
                icon: <Lock className="h-5 w-5 text-purple-600" />,
              },
              {
                title: "PDF Export",
                description: "Download in multiple formats or share as link",
                icon: <Download className="h-5 w-5 text-orange-600" />,
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    {feature.icon}
                  </div>
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

        {/* Pricing Comparison */}
        <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 md:p-12 mb-16">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">
                Cost-Effective Solution
              </h2>
              <p className="text-xl text-muted-foreground">
                Compare our pay-per-use model with traditional options
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border-2">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-[#FEF9C2] mb-3">
                  <CreditCard className="h-6 w-6 text-[#C29307]" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Digital Receipts</h3>
                <div className="text-3xl font-bold text-[#C29307]">₦100</div>
                <p className="text-sm text-gray-500">per receipt only</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-4 w-4 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  </div>
                  <span>Pay only when you use</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-4 w-4 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  </div>
                  <span>Secure cloud storage</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-4 w-4 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  </div>
                  <span>Professional & customizable</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-4 w-4 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  </div>
                  <span>Easy to search & share</span>
                </div>
              </div>
            </div>

            <div className="text-center mt-8 p-4 bg-white rounded-lg border border-blue-200">
              <p className="font-semibold text-[#C29307]">
                💡 Save money with our pay-per-use model. Only pay for receipts
                you actually create!
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-6">
            Start Creating Professional Receipts Today
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            No subscriptions, no commitments. Create your first receipt for just
            ₦100.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard/services/receipt">
              <Button
                className="bg-[#C29307] hover:bg-[#FEF9C2] text-white hover:text-black px-8 py-6 text-lg"
                size="lg"
              >
                Create Receipt (₦100)
              </Button>
            </Link>
          </div>

          <div className="mt-8 p-4 bg-green-50 rounded-lg inline-block">
            <p className="text-sm text-green-700 font-medium">
              💰 Cost Example: If you create 10 receipts per month, you pay only
              ₦1,000 vs ₦3,000+ with subscription services
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
