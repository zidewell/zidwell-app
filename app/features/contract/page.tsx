"use client";

import Link from "next/link";
import {
  FileText,
  Shield,
  Zap,
  CheckCircle,
  Edit,
  Clock,
  Users,
  Lock,
  ArrowLeft,
} from "lucide-react";

import { Button } from "@/app/components/ui/button";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { useRouter } from "next/navigation";

export default function SmartContractPage() {
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
            <FileText className="h-8 w-8 text-[#C29307]" />
          </div>
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-4xl md:text-5xl font-bold">
              Professional Smart Contracts
            </h1>
            <span className="bg-[#FEF9C2] text-[#C29307] text-sm font-semibold px-3 py-1 rounded-full">
              ₦1,000 Only
            </span>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Create legally binding smart contracts for any business need. One
            flat rate of ₦1,000 for all contract types - simple, transparent,
            affordable.
          </p>
        </div>

        {/* Key Benefits */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">One Flat Rate</h3>
            <p className="text-muted-foreground">
              All contracts cost ₦1,000 only. No hidden fees, no tiered pricing
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Blockchain Security</h3>
            <p className="text-muted-foreground">
              Tamper-proof contracts stored securely on the blockchain
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Automated Execution</h3>
            <p className="text-muted-foreground">
              Self-executing contracts that trigger automatically
            </p>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            Simple 4-Step Process
          </h2>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Choose Template",
                description: "Select from 20+ professional contract templates",
                icon: FileText,
                color: "bg-[#C29307]",
              },
              {
                step: "2",
                title: "Customize Terms",
                description: "Edit terms, add parties, set conditions",
                icon: Edit,
                color: "bg-blue-500",
              },
              {
                step: "3",
                title: "Pay ₦1,000",
                description: "Complete payment to deploy your contract",
                icon: Shield,
                color: "bg-green-500",
              },
              {
                step: "4",
                title: "Deploy & Sign",
                description: "Deploy to blockchain and get digital signatures",
                icon: Users,
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

        {/* Contract Types Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            All Contracts: ₦1,000 Each
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Service Agreements",
                description:
                  "Freelance contracts, consulting agreements, project work",
                icon: <Users className="h-5 w-5 text-blue-600" />,
              },
              {
                title: "Rental Contracts",
                description:
                  "Property rentals, equipment leasing, space agreements",
                icon: <FileText className="h-5 w-5 text-green-600" />,
              },
              {
                title: "NDA Agreements",
                description:
                  "Non-disclosure agreements to protect sensitive info",
                icon: <Lock className="h-5 w-5 text-[#C29307]" />,
              },
              {
                title: "Partnership Agreements",
                description:
                  "Business partnerships, joint ventures, collaborations",
                icon: <Users className="h-5 w-5 text-orange-600" />,
              },
              {
                title: "Payment Agreements",
                description:
                  "Installment plans, payment terms, escrow contracts",
                icon: <Clock className="h-5 w-5 text-red-600" />,
              },
              {
                title: "Custom Contracts",
                description:
                  "Tailored agreements for your specific business needs",
                icon: <Edit className="h-5 w-5 text-indigo-600" />,
              },
            ].map((contract, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    {contract.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">
                        {contract.title}
                      </h3>
                      <span className="bg-[#FEF9C2] text-[#C29307] text-sm font-semibold px-2 py-1 rounded">
                        ₦1,000
                      </span>
                    </div>
                    <p className="text-muted-foreground">
                      {contract.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Comparison */}
        <div className="bg-linear-to-r from-purple-50 to-blue-50 rounded-2xl p-8 md:p-12 mb-16">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Unbeatable Value</h2>
              <p className="text-xl text-muted-foreground">
                Save up to 90% compared to traditional legal fees
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Traditional Lawyers */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-center mb-4">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-3">
                    <FileText className="h-6 w-6 text-gray-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    Traditional Lawyers
                  </h3>
                  <div className="text-3xl font-bold text-gray-700">
                    ₦10,000+
                  </div>
                  <p className="text-sm text-gray-500">per contract</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-4 w-4 rounded-full bg-red-100 flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-red-500"></div>
                    </div>
                    <span>Expensive hourly rates</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-4 w-4 rounded-full bg-red-100 flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-red-500"></div>
                    </div>
                    <span>Days to prepare</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-4 w-4 rounded-full bg-red-100 flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-red-500"></div>
                    </div>
                    <span>Paper-based tracking</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-4 w-4 rounded-full bg-red-100 flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-red-500"></div>
                    </div>
                    <span>Manual follow-ups</span>
                  </div>
                </div>
              </div>

              {/* Our Solution */}
              <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-[#C29307] relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-[#C29307] text-white text-sm font-semibold px-3 py-1 rounded-full">
                    Best Value
                  </span>
                </div>
                <div className="text-center mb-4">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-[#FEF9C2] mb-3">
                    <Shield className="h-6 w-6 text-[#C29307]" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    Smart Contracts
                  </h3>
                  <div className="text-3xl font-bold text-[#C29307]">
                    ₦1,000
                  </div>
                  <p className="text-sm text-[#C29307]">all contracts</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-4 w-4 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    </div>
                    <span>One flat rate</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-4 w-4 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    </div>
                    <span>Minutes to create</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-4 w-4 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    </div>
                    <span>Blockchain secure</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-4 w-4 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    </div>
                    <span>Automated execution</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-4 w-4 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    </div>
                    <span>Digital tracking</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-8 p-4 bg-white rounded-lg border border-purple-200">
              <p className="font-semibold text-[#C29307] text-lg">
                💰 Save ₦9,000+ per contract compared to traditional legal
                services!
              </p>
            </div>
          </div>
        </div>

        {/* Additional Services */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            Additional Services
          </h2>

          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Edit className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold">Contract Edits</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Need to modify an existing contract? We make it easy and
                    affordable.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">Price:</span>
                    <span className="text-2xl font-bold text-[#C29307]">
                      ₦500
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold">Multi-party Setup</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Add multiple signatories to your contract with ease.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">Price:</span>
                    <span className="text-2xl font-bold text-[#C29307]">
                      ₦200/party
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-6">
            Create Your First Smart Contract Today
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Professional contracts, blockchain security, automated execution -
            all for just ₦1,000. No lawyers, no complications, no hidden fees.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard/services/contract">
              <Button
                className="bg-[#C29307] hover:bg-[#FEF9C2] text-white hover:text-black px-8 py-6 text-lg"
                size="lg"
              >
                Create Contract (₦1,000)
              </Button>
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span>₦1,000 flat rate</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span>20+ contract types</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span>Blockchain secured</span>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
