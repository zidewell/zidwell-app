// app/tax-filing-info/page.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  ArrowLeft,
  CheckCircle,
  Download,
  Upload,
  CreditCard,
  Mail,
  File,
  ListChecks,
} from "lucide-react";

const TaxFilingInfoPage = () => {
  const router = useRouter();

  const reasons = [
    "You'll get a detailed financial report every month of the financial health of your business",
    "We take the headache out of tax calculations so you can focus on your business",
    "You'll pay the lowest tax possible with our guidance",
    "You'll sit in your office, we'll do the running around the state and federal tax offices",
  ];

  const steps = [
    {
      icon: <Download />,
      title: "Download Your Bank Statement",
      description: (
        <ul className="text-(--text-secondary) space-y-1">
          <li>
            • If this is your first time tax filing, download the last 6 months
            of statements from your business bank app (or request it from your
            bank).
          </li>
          <li>
            • If you're a returning user, just download last month's statement.
          </li>
        </ul>
      ),
    },
    {
      icon: <File />,
      title: "Choose Your Filing Type",
      description: (
        <ul className="text-(--text-secondary) space-y-1">
          <li>
            • Click "First-Time Tax Filing" if this is your first submission
            with us.
          </li>
          <li>
            • Click "Returning Tax Filing" if you filed with us last month and
            are filing again.
          </li>
        </ul>
      ),
    },
    {
      icon: <Upload />,
      title: "Upload Your Documents",
      description: (
        <p className="text-(--text-secondary)">
          Upload your bank statement (and any required documents if you're a
          first-time filer).
        </p>
      ),
    },
    {
      icon: <CreditCard />,
      title: "Submit & Make Payment",
      description: (
        <p className="text-(--text-secondary)">
          Click Submit and Pay to process your request securely.
        </p>
      ),
    },
    {
      icon: <CheckCircle />,
      title: "Get Confirmation",
      description: (
        <p className="text-(--text-secondary)">
          You'll receive an instant success message on screen and a confirmation
          email.
        </p>
      ),
    },
    {
      icon: <Mail />,
      title: "Receive Your Filing Summary",
      description: (
        <ul className="text-(--text-secondary) space-y-1 ml-4">
          <li>
            • A summarized financial statement for the month, explaining how
            your business is doing financially from an accountant's perspective.
          </li>
          <li>
            • An invoice showing how much tax you owe, including our service
            charge.
          </li>
        </ul>
      ),
    },
    {
      icon: <ListChecks />,
      title: "Complete Your Tax Filing",
      description: (
        <p className="text-(--text-secondary)">
          Once you pay the tax invoice, we'll file your taxes and send you the
          official tax receipt via email.
        </p>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-(--bg-primary)">
      {/* Header */}
      <header className="py-6">
        <div className="container mx-auto px-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/")}
            className="text-(--color-accent-yellow) hover:bg-(--bg-secondary)"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-(--text-primary)">
            Tax Manager Information
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Hero Section */}
        <div className="mb-12 rounded-2xl overflow-hidden shadow-soft">
          <div className="relative h-[400px]">
            <Image
              src="https://plus.unsplash.com/premium_photo-1679923906285-386991e8d862?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=870"
              alt="Professional tax service"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center">
              <div className="px-8 text-white max-w-2xl">
                <h1 className="text-4xl font-bold mb-4">
                  Professional Tax Filing Services
                </h1>
                <p className="text-lg leading-relaxed">
                  Let professionals handle your bookkeeping and tax filing while
                  you grow your business.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Value Proposition */}
        <div className="text-center mb-12">
          <p className="text-lg text-(--text-primary) max-w-4xl mx-auto leading-relaxed">
            We have standby professionals to help you with your basic accounting
            and tax filing for the state and federal government.
          </p>
        </div>

        {/* 4 Reasons Section */}
        <Card className="mb-12 shadow-soft bg-(--bg-primary) border border-(--border-color)">
          <CardHeader>
            <CardTitle className="text-2xl text-(--text-primary)">
              4 Reasons You Need Proper Accounting and Tax Filing With Us
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {reasons.map((text, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-(--color-accent-yellow) rounded-full flex items-center justify-center shrink-0 mt-1">
                    <span className="text-(--color-ink) font-bold text-sm">
                      {i + 1}
                    </span>
                  </div>
                  <p className="text-(--text-secondary)">{text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* How It Works Section */}
        <Card className="mb-12 shadow-soft bg-(--bg-primary) border border-(--border-color)">
          <CardHeader>
            <CardTitle className="text-2xl text-(--text-primary)">
              How It Works (Tax Filing Made Easy)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {steps.map((step, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 bg-(--color-accent-yellow) rounded-full flex items-center justify-center shrink-0`}
                  >
                    {React.isValidElement(step.icon)
                      ? React.cloneElement(
                          step.icon as React.ReactElement<
                            React.SVGProps<SVGSVGElement>
                          >,
                          { className: "w-6 h-6 text-(--color-ink)" },
                        )
                      : step.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-(--text-primary) mb-2">{`Step ${
                      i + 1
                    }: ${step.title}`}</h3>
                    {step.description}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="bg-(--color-accent-yellow) text-(--color-ink) shadow-pop">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-(--color-ink)" />
            <h2 className="text-2xl font-bold mb-4">
              Just like that, your business taxes are up to date, with no
              stress.
            </h2>
            <Button
              size="lg"
              onClick={() => router.push("/dashboard")}
              className="bg-(--color-ink) text-(--color-accent-yellow) hover:bg-(--color-ink)/90"
            >
              Start Tax Filing Process
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TaxFilingInfoPage;
