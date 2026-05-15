"use client";
import Head from "next/head";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  const router = useRouter();
  const primaryColor = "#FDC020";

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Head>
        <title>ZIDWELL Privacy Policy and Terms of Use</title>
        <meta
          name="description"
          content="ZIDWELL Privacy Policy and Terms of Use"
        />
      </Head>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-(--color-accent-yellow) hover:bg-white/10 text-sm md:text-base flex items-center px-4 py-2 rounded-lg transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="hidden md:block">Back</span>
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ZIDWELL PRIVACY POLICY AND TERMS OF USE
          </h1>
          <p className="text-lg text-gray-600">November 2025</p>
        </div>

        {/* Introduction */}
        <section
          className="bg-white rounded-lg shadow-sm p-6 mb-6 border-l-4"
          style={{ borderLeftColor: primaryColor }}
        >
          <p className="text-gray-700 mb-4">
            Welcome to Zidwell. By using our app, website, products, or
            services, you agree to the terms written below. Please read them
            carefully.
          </p>

          <h2
            className="text-2xl font-semibold text-gray-900 mb-4"
            style={{ color: primaryColor }}
          >
            1. INTRODUCTION
          </h2>
          <p className="text-gray-700 mb-4">
            Zidwell ("we", "us", "our") is a financial management and wellness
            platform that helps individuals and businesses make payments, manage
            finances, access investment opportunities, generate receipts, create
            contracts, file taxes, and earn rewards.
          </p>
          <p className="text-gray-700 mb-4">This document explains:</p>
          <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
            <li>What information we collect</li>
            <li>How we use it</li>
            <li>What you're allowed and not allowed to do</li>
            <li>What we are responsible for</li>
            <li>What we are NOT responsible for</li>
            <li>The rules that guide your use of Zidwell</li>
          </ul>
          <p className="text-gray-700 font-medium">
            If you do not agree with these terms, do not use Zidwell.
          </p>
        </section>

        {/* Information We Collect */}
        <section
          className="bg-white rounded-lg shadow-sm p-6 mb-6 border-l-4"
          style={{ borderLeftColor: primaryColor }}
        >
          <h2
            className="text-2xl font-semibold text-gray-900 mb-4"
            style={{ color: primaryColor }}
          >
            2. INFORMATION WE COLLECT
          </h2>
          <p className="text-gray-700 mb-4">
            We collect the following information to provide our services:
          </p>

          <div className="mb-6">
            <h3 className="text-xl font-medium text-gray-900 mb-3">
              Personal Information
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-700">
              <li className="flex items-center">
                <span
                  className="w-2 h-2 rounded-full mr-2 shrink-0"
                  style={{ backgroundColor: primaryColor }}
                ></span>
                Name
              </li>
              <li className="flex items-center">
                <span
                  className="w-2 h-2 rounded-full mr-2 shrink-0"
                  style={{ backgroundColor: primaryColor }}
                ></span>
                Phone number
              </li>
              <li className="flex items-center">
                <span
                  className="w-2 h-2 rounded-full mr-2 shrink-0"
                  style={{ backgroundColor: primaryColor }}
                ></span>
                Email
              </li>
              <li className="flex items-center">
                <span
                  className="w-2 h-2 rounded-full mr-2 shrink-0"
                  style={{ backgroundColor: primaryColor }}
                ></span>
                Date of birth
              </li>
              <li className="flex items-center">
                <span
                  className="w-2 h-2 rounded-full mr-2 shrink-0"
                  style={{ backgroundColor: primaryColor }}
                ></span>
                Home or business address
              </li>
              <li className="flex items-center">
                <span
                  className="w-2 h-2 rounded-full mr-2 shrink-0"
                  style={{ backgroundColor: primaryColor }}
                ></span>
                ID documents (NIN, Driver's License, Passport, etc.)
              </li>
            </ul>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-medium text-gray-900 mb-3">
              Financial Information
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-700">
              <li className="flex items-center">
                <span
                  className="w-2 h-2 rounded-full mr-2 shrink-0"
                  style={{ backgroundColor: primaryColor }}
                ></span>
                Linked bank accounts
              </li>
              <li className="flex items-center">
                <span
                  className="w-2 h-2 rounded-full mr-2 shrink-0"
                  style={{ backgroundColor: primaryColor }}
                ></span>
                Virtual account and wallet transactions
              </li>
              <li className="flex items-center">
                <span
                  className="w-2 h-2 rounded-full mr-2 shrink-0"
                  style={{ backgroundColor: primaryColor }}
                ></span>
                Payment history
              </li>
              <li className="flex items-center">
                <span
                  className="w-2 h-2 rounded-full mr-2 shrink-0"
                  style={{ backgroundColor: primaryColor }}
                ></span>
                Investment and savings activity
              </li>
              <li className="flex items-center">
                <span
                  className="w-2 h-2 rounded-full mr-2 shrink-0"
                  style={{ backgroundColor: primaryColor }}
                ></span>
                Contract, receipt, invoice uploads
              </li>
              <li className="flex items-center">
                <span
                  className="w-2 h-2 rounded-full mr-2 shrink-0"
                  style={{ backgroundColor: primaryColor }}
                ></span>
                Tax filing records
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-medium text-gray-900 mb-3">
              Technical Data
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-center">
                <span
                  className="w-2 h-2 rounded-full mr-2 shrink-0"
                  style={{ backgroundColor: primaryColor }}
                ></span>
                IP address
              </li>
              <li className="flex items-center">
                <span
                  className="w-2 h-2 rounded-full mr-2 shrink-0"
                  style={{ backgroundColor: primaryColor }}
                ></span>
                Device information
              </li>
              <li className="flex items-center">
                <span
                  className="w-2 h-2 rounded-full mr-2 shrink-0"
                  style={{ backgroundColor: primaryColor }}
                ></span>
                App usage statistics
              </li>
            </ul>
          </div>

          <p className="text-gray-700 mt-4">
            We collect this to verify your identity, prevent fraud, and provide
            a secure financial platform.
          </p>
        </section>

        {/* How We Use Your Information */}
        <section
          className="bg-white rounded-lg shadow-sm p-6 mb-6 border-l-4"
          style={{ borderLeftColor: primaryColor }}
        >
          <h2
            className="text-2xl font-semibold text-gray-900 mb-4"
            style={{ color: primaryColor }}
          >
            3. HOW WE USE YOUR INFORMATION
          </h2>
          <p className="text-gray-700 mb-4">We use your data to:</p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700 mb-4">
            <li className="flex items-start">
              <span
                className="w-2 h-2 rounded-full mr-2 mt-2 shrink-0"
                style={{ backgroundColor: primaryColor }}
              ></span>
              Create and manage your Zidwell account
            </li>
            <li className="flex items-start">
              <span
                className="w-2 h-2 rounded-full mr-2 mt-2 shrink-0"
                style={{ backgroundColor: primaryColor }}
              ></span>
              Provide wallet, payments, invoicing, receipts, contract and tax
              services
            </li>
            <li className="flex items-start">
              <span
                className="w-2 h-2 rounded-full mr-2 mt-2 shrink-0"
                style={{ backgroundColor: primaryColor }}
              ></span>
              Facilitate investments and savings
            </li>
            <li className="flex items-start">
              <span
                className="w-2 h-2 rounded-full mr-2 mt-2 shrink-0"
                style={{ backgroundColor: primaryColor }}
              ></span>
              Communicate with you about updates
            </li>
            <li className="flex items-start">
              <span
                className="w-2 h-2 rounded-full mr-2 mt-2 shrink-0"
                style={{ backgroundColor: primaryColor }}
              ></span>
              Prevent fraud and misuse
            </li>
            <li className="flex items-start">
              <span
                className="w-2 h-2 rounded-full mr-2 mt-2 shrink-0"
                style={{ backgroundColor: primaryColor }}
              ></span>
              Improve our products
            </li>
            <li className="flex items-start">
              <span
                className="w-2 h-2 rounded-full mr-2 mt-2 shrink-0"
                style={{ backgroundColor: primaryColor }}
              ></span>
              Comply with Nigerian laws and regulations
            </li>
          </ul>
          <p className="text-gray-700 font-medium">
            We do not sell your personal data to anyone.
          </p>
        </section>

        {/* How We Store & Protect Your Information */}
        <section
          className="bg-white rounded-lg shadow-sm p-6 mb-6 border-l-4"
          style={{ borderLeftColor: primaryColor }}
        >
          <h2
            className="text-2xl font-semibold text-gray-900 mb-4"
            style={{ color: primaryColor }}
          >
            4. HOW WE STORE & PROTECT YOUR INFORMATION
          </h2>
          <p className="text-gray-700 mb-4">
            We implement bank-level security, including:
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700 mb-4">
            <li className="flex items-center">
              <span
                className="w-2 h-2 rounded-full mr-2 shrink-0"
                style={{ backgroundColor: primaryColor }}
              ></span>
              Encrypted data storage
            </li>
            <li className="flex items-center">
              <span
                className="w-2 h-2 rounded-full mr-2 shrink-0"
                style={{ backgroundColor: primaryColor }}
              ></span>
              Secure servers
            </li>
            <li className="flex items-center">
              <span
                className="w-2 h-2 rounded-full mr-2 shrink-0"
                style={{ backgroundColor: primaryColor }}
              ></span>
              Limited staff access
            </li>
            <li className="flex items-center">
              <span
                className="w-2 h-2 rounded-full mr-2 shrink-0"
                style={{ backgroundColor: primaryColor }}
              ></span>
              Audit trails
            </li>
            <li className="flex items-center">
              <span
                className="w-2 h-2 rounded-full mr-2 shrink-0"
                style={{ backgroundColor: primaryColor }}
              ></span>
              Regular security reviews
            </li>
          </ul>
          <p className="text-gray-700">
            However, no system is 100% secure, and users are responsible for
            keeping their passwords and devices safe.
          </p>
        </section>

        {/* Your Rights */}
        <section
          className="bg-white rounded-lg shadow-sm p-6 mb-6 border-l-4"
          style={{ borderLeftColor: primaryColor }}
        >
          <h2
            className="text-2xl font-semibold text-gray-900 mb-4"
            style={{ color: primaryColor }}
          >
            5. YOUR RIGHTS
          </h2>
          <p className="text-gray-700 mb-4">You have the right to:</p>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-center">
              <span
                className="w-2 h-2 rounded-full mr-2 shrink-0"
                style={{ backgroundColor: primaryColor }}
              ></span>
              Access your information
            </li>
            <li className="flex items-center">
              <span
                className="w-2 h-2 rounded-full mr-2 shrink-0"
                style={{ backgroundColor: primaryColor }}
              ></span>
              Update your details
            </li>
            <li className="flex items-center">
              <span
                className="w-2 h-2 rounded-full mr-2 shrink-0"
                style={{ backgroundColor: primaryColor }}
              ></span>
              Request deletion of your account
            </li>
          </ul>
        </section>

        {/* Footer */}
        <div
          className="bg-white rounded-lg shadow-sm p-6 border-l-4"
          style={{ borderLeftColor: primaryColor }}
        >
          {/* <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm text-gray-600">
            <div className="mb-4 sm:mb-0">
              <p className="font-medium">Prepared by: Coach Attah</p>
              <p>Date: 20th November 2025</p>
            </div>
            <p className="text-xs">Last updated: November 2025</p>
          </div> */}
        </div>
      </div>
    </div>
  );
}
