// app/components/tax-filling-components/TaxCalculator.tsx
"use client";

import { useState, useEffect } from "react";
import { TaxCard } from "./TaxCard";
import { CurrencyInput } from "./CurrencyInput";
import { InfoTooltip } from "./InfoTooltip";
import { PremiumModal } from "./premiumModal";
import {
  calculateCIT,
  calculateVAT,
  calculateWHT,
  calculatePIT,
  formatNaira,
} from "@/app/utils/tax-calculation";
import { Sparkles, Crown, Zap, Star, AlertCircle, Lock } from "lucide-react";
import { useSubscription } from "@/app/hooks/useSubscripion";
import Link from "next/link";

const DISCLAIMER =
  "This is only an estimate. For accurate calculation and tax filing assistance, contact our finance managers.";

interface TaxCalculatorProps {
  userTier?: "free" | "solopreneur" | "sme" | "enterprise" | "corporation";
}

const TaxCalculator = ({ userTier = "free" }: TaxCalculatorProps) => {
  const [showModal, setShowModal] = useState(false);

  // Define tier-based access
  const isFree = userTier === "free";
  const isStarterUser = userTier === "solopreneur";
  const isSMEUser = userTier === "sme";
  const isEnterpriseUser = userTier === "enterprise";
  const isCorporationUser = userTier === "corporation";

  const hasTaxCalculatorAccess =
    isSMEUser || isEnterpriseUser || isCorporationUser;
  const hasTaxSupport = isEnterpriseUser || isCorporationUser;
  const hasFullTaxFiling = isCorporationUser;

  // CIT state
  const [citRevenue, setCitRevenue] = useState("");
  const [citExpenses, setCitExpenses] = useState("");
  const [citCompanyType, setCitCompanyType] = useState("small");
  const [citResult, setCitResult] = useState<number | null>(null);

  // VAT state
  const [vatSales, setVatSales] = useState("");
  const [vatInput, setVatInput] = useState("");
  const [vatResult, setVatResult] = useState<{
    outputVAT: number;
    vatPayable: number;
  } | null>(null);

  // WHT state
  const [whtValue, setWhtValue] = useState("");
  const [whtType, setWhtType] = useState("consultancy");
  const [whtResult, setWhtResult] = useState<{
    wht: number;
    netAmount: number;
  } | null>(null);

  // PIT state
  const [pitIncome, setPitIncome] = useState("");
  const [pitResult, setPitResult] = useState<number | null>(null);

  const openModal = () => setShowModal(true);

  // Tier info banner
  const getTierInfo = () => {
    if (isCorporationUser) {
      return {
        icon: Sparkles,
        text: "Corporation Plan - Full Tax Filing Support",
        bgColor: "bg-purple-100 dark:bg-purple-900/20",
        textColor: "text-purple-700 dark:text-purple-400",
        borderColor: "border-purple-200 dark:border-purple-800",
        action: null,
        actionLink: null,
        subtext:
          "Full tax filing including VAT, PAYE, and WHT. Contact our team for assistance.",
      };
    }
    if (isEnterpriseUser) {
      return {
        icon: Crown,
        text: "Enterprise Plan - Tax Filing Support Available",
        bgColor: "bg-amber-100 dark:bg-amber-900/20",
        textColor: "text-amber-700 dark:text-amber-400",
        borderColor: "border-amber-200 dark:border-amber-800",
        action: "Upgrade to Corporation",
        actionLink: "/pricing?upgrade=corporation",
        subtext:
          "You have access to tax filing support. Upgrade to Corporation for full VAT, PAYE & WHT filing.",
      };
    }
    if (isSMEUser) {
      return {
        icon: Star,
        text: "SME Plan - Basic Tax Calculator",
        bgColor: "bg-(--color-accent-yellow)/10",
        textColor: "text-(--color-accent-yellow)",
        borderColor: "border-(--color-accent-yellow)/30",
        action: "Upgrade to Enterprise",
        actionLink: "/pricing?upgrade=enterprise",
        subtext:
          "You have access to basic tax calculations. Upgrade to Enterprise for tax filing support.",
      };
    }
    if (isStarterUser) {
      return {
        icon: Zap,
        text: "Solopreneur Plan - Tax Calculator requires SME",
        bgColor: "bg-blue-100 dark:bg-blue-900/20",
        textColor: "text-blue-700 dark:text-blue-400",
        borderColor: "border-blue-200 dark:border-blue-800",
        action: "Upgrade to SME",
        actionLink: "/pricing?upgrade=sme",
        subtext:
          "Get accurate tax estimates and filing support with our SME plan and above.",
      };
    }
    // Free
    return {
      icon: Star,
      text: "Tax Calculator requires SME plan",
      bgColor: "bg-gray-100 dark:bg-gray-800",
      textColor: "text-gray-700 dark:text-gray-300",
      borderColor: "border-gray-200 dark:border-gray-700",
      action: "Upgrade to SME",
      actionLink: "/pricing?upgrade=sme",
      subtext:
        "Get accurate tax estimates and filing support with our SME plan and above.",
    };
  };

  const tierInfo = getTierInfo();

  return (
    <div className="space-y-12">
      {/* Tier Status Banner */}
      {tierInfo && (
        <div
          className={`p-4 rounded-lg border-2 ${tierInfo.borderColor} ${tierInfo.bgColor} flex items-center justify-between flex-wrap gap-4`}
        >
          <div className="flex items-center gap-3">
            <tierInfo.icon className={`w-5 h-5 ${tierInfo.textColor}`} />
            <div>
              <p className={`font-medium ${tierInfo.textColor}`}>
                {tierInfo.text}
              </p>
              <p className="text-sm text-(--text-secondary) mt-1">
                {tierInfo.subtext}
              </p>
            </div>
          </div>
          {tierInfo.action && tierInfo.actionLink && (
            <Link href={tierInfo.actionLink}>
              <button
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  isEnterpriseUser
                    ? "bg-amber-600 text-white hover:bg-amber-700"
                    : "bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90"
                }`}
              >
                {tierInfo.action}
              </button>
            </Link>
          )}
        </div>
      )}

      {/* Title */}
      <div>
        <h1 className="text-4xl md:text-5xl font-heading text-(--text-primary)">
          SME Tax Dashboard
        </h1>
        <p className="mt-2 text-(--text-secondary)">
          Estimate your business taxes in minutes. Free for everyone.
        </p>
        <p className="mt-3 text-xs text-(--text-secondary)/70 italic">
          Answer accurately. You can&apos;t lie to the government.
        </p>
      </div>

      {/* 1. CIT */}
      <TaxCard
        title="Company Income Tax (CIT)"
        description="Tax on company profit after allowable expenses."
        isPremium={true}
        onPremiumClick={openModal}
        onCalculate={() =>
          setCitResult(
            calculateCIT(
              Number(citRevenue) || 0,
              Number(citExpenses) || 0,
              citCompanyType,
            ),
          )
        }
        onReset={() => {
          setCitRevenue("");
          setCitExpenses("");
          setCitCompanyType("small");
          setCitResult(null);
        }}
        documents={[
          "Financial Statement",
          "Profit & Loss Statement",
          "Balance Sheet",
          "Audited Accounts (if applicable)",
          "Tax Identification Number (TIN)",
        ]}
        disclaimer={DISCLAIMER}
        statusLabel={
          citResult !== null
            ? citResult > 0
              ? "You may owe tax"
              : "No tax payable"
            : null
        }
        result={
          citResult !== null ? (
            <p className="text-lg font-heading text-(--text-primary)">
              Estimated CIT:{" "}
              <span className="text-(--color-accent-yellow)">
                {formatNaira(citResult)}
              </span>
            </p>
          ) : null
        }
        userTier={userTier}
      >
        <CurrencyInput
          label="Annual Revenue"
          value={citRevenue}
          onChange={setCitRevenue}
          tooltip={
            <InfoTooltip content="Total income your company generated from business operations in the financial year." />
          }
        />
        <CurrencyInput
          label="Allowable Business Expenses"
          value={citExpenses}
          onChange={setCitExpenses}
          tooltip={
            <InfoTooltip content="Costs directly related to running your business — salaries, rent, utilities, etc." />
          }
        />
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-(--text-primary) flex items-center gap-1">
            Company Type
            <InfoTooltip content="Small companies have ≤ ₦100m turnover and pay 0% CIT. Medium/Large companies pay 25%." />
          </label>
          <select
            value={citCompanyType}
            onChange={(e) => setCitCompanyType(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-(--border-color) bg-(--bg-primary) text-(--text-primary) text-sm focus:outline-none focus:ring-2 focus:ring-(--color-accent-yellow)"
            style={{ outline: "none", boxShadow: "none" }}
          >
            <option value="small">Small Company (≤ ₦100m turnover)</option>
            <option value="large">Medium/Large Company (&gt; ₦100m)</option>
          </select>
        </div>
      </TaxCard>

      {/* 2. VAT */}
      <TaxCard
        title="Value Added Tax (VAT)"
        description="7.5% consumption tax charged on goods and services."
        isPremium={true}
        onPremiumClick={openModal}
        onCalculate={() =>
          setVatResult(
            calculateVAT(Number(vatSales) || 0, Number(vatInput) || 0),
          )
        }
        onReset={() => {
          setVatSales("");
          setVatInput("");
          setVatResult(null);
        }}
        documents={[
          "VAT Sales Invoices",
          "Purchase Invoices",
          "VAT Ledger",
          "Monthly Sales Report",
        ]}
        disclaimer={DISCLAIMER}
        statusLabel={
          vatResult !== null
            ? vatResult.vatPayable > 0
              ? "You may owe tax"
              : "No VAT payable"
            : null
        }
        result={
          vatResult !== null ? (
            <div className="space-y-1">
              <p className="text-sm text-(--text-secondary)">
                Output VAT: {formatNaira(vatResult.outputVAT)}
              </p>
              <p className="text-lg font-heading text-(--text-primary)">
                VAT Payable:{" "}
                <span className="text-(--color-accent-yellow)">
                  {vatResult.vatPayable > 0
                    ? formatNaira(vatResult.vatPayable)
                    : "₦0"}
                </span>
              </p>
              {vatResult.vatPayable < 0 && (
                <p className="text-xs text-(--text-secondary)">
                  No VAT payable. Excess carried forward.
                </p>
              )}
            </div>
          ) : null
        }
        userTier={userTier}
      >
        <CurrencyInput
          label="Total Taxable Sales"
          value={vatSales}
          onChange={setVatSales}
          tooltip={
            <InfoTooltip content="The total value of goods and services sold that are subject to VAT." />
          }
        />
        <CurrencyInput
          label="Total Input VAT Paid"
          value={vatInput}
          onChange={setVatInput}
          tooltip={
            <InfoTooltip content="VAT you already paid on business purchases and expenses." />
          }
        />
      </TaxCard>

      {/* 3. WHT */}
      <TaxCard
        title="Withholding Tax (WHT)"
        description="Advance tax deducted at source."
        isPremium={true}
        onPremiumClick={openModal}
        onCalculate={() =>
          setWhtResult(calculateWHT(Number(whtValue) || 0, whtType))
        }
        onReset={() => {
          setWhtValue("");
          setWhtType("consultancy");
          setWhtResult(null);
        }}
        documents={["Contract Agreement", "Invoice", "WHT Credit Note"]}
        disclaimer={DISCLAIMER}
        statusLabel={whtResult !== null ? "Tax deducted at source" : null}
        result={
          whtResult !== null ? (
            <div className="space-y-1">
              <p className="text-lg font-heading text-(--text-primary)">
                WHT Deducted:{" "}
                <span className="text-(--color-accent-yellow)">
                  {formatNaira(whtResult.wht)}
                </span>
              </p>
              <p className="text-sm text-(--text-secondary)">
                Net Amount Receivable: {formatNaira(whtResult.netAmount)}
              </p>
            </div>
          ) : null
        }
        userTier={userTier}
      >
        <CurrencyInput
          label="Contract Value"
          value={whtValue}
          onChange={setWhtValue}
        />
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-(--text-primary)">
            Transaction Type
          </label>
          <select
            value={whtType}
            onChange={(e) => setWhtType(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-(--border-color) bg-(--bg-primary) text-(--text-primary) text-sm focus:outline-none focus:ring-2 focus:ring-(--color-accent-yellow)"
            style={{ outline: "none", boxShadow: "none" }}
          >
            <option value="consultancy">Consultancy (10%)</option>
            <option value="rent">Rent (10%)</option>
            <option value="dividend">Dividend (10%)</option>
            <option value="contract">Contract (5%)</option>
          </select>
        </div>
      </TaxCard>

      {/* 4. PIT */}
      <TaxCard
        title="Personal Income Tax (Sole Proprietors)"
        description="Tax on personal business income using progressive bands."
        isPremium={true}
        onPremiumClick={openModal}
        onCalculate={() =>
          setPitResult(calculatePIT(Number(pitIncome) || 0))
        }
        onReset={() => {
          setPitIncome("");
          setPitResult(null);
        }}
        documents={[
          "Income Statement",
          "Expense Breakdown",
          "Bank Statements",
          "Tax Identification Number (TIN)",
        ]}
        disclaimer={DISCLAIMER}
        statusLabel={
          pitResult !== null
            ? pitResult > 0
              ? "You may owe tax"
              : "No tax payable"
            : null
        }
        result={
          pitResult !== null ? (
            <p className="text-lg font-heading text-(--text-primary)">
              Estimated PIT:{" "}
              <span className="text-(--color-accent-yellow)">
                {formatNaira(pitResult)}
              </span>
            </p>
          ) : null
        }
        userTier={userTier}
      >
        <CurrencyInput
          label="Annual Taxable Income"
          value={pitIncome}
          onChange={setPitIncome}
          tooltip={
            <InfoTooltip content="Your total personal business income after allowable deductions for the year." />
          }
        />
      </TaxCard>

      {/* Filing Integration Notice */}
      <div className="rounded-2xl border border-(--border-color) bg-(--bg-primary) p-6 space-y-3">
        <h4 className="font-subheading text-(--text-primary) flex items-center gap-2">
          🔗 Tax Filing Integration
          {hasTaxSupport && (
            <span className="text-xs bg-(--color-accent-yellow) text-(--color-ink) px-2 py-1 rounded-full">
              Available in Enterprise
            </span>
          )}
          {hasFullTaxFiling && (
            <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded-full">
              Full Filing Included
            </span>
          )}
        </h4>
        <p className="text-sm text-(--text-secondary) leading-relaxed">
          Zidwell Finance provides tax estimates based on user inputs. These
          calculations are not legally binding.{" "}
          {hasTaxSupport
            ? "As an Enterprise/Corporation user, you can proceed to file your taxes with our assistance."
            : "Upgrade to Enterprise for tax filing support and professional assistance."}
        </p>
        {hasTaxSupport ? (
          <div className="mt-4 flex gap-3">
            <Link href="/dashboard/services/tax-filing/file">
              <button className="px-4 py-2 bg-(--color-accent-yellow) text-(--color-ink) rounded-lg text-sm font-semibold hover:bg-(--color-accent-yellow)/90 transition-colors">
                File Your Taxes
              </button>
            </Link>
            <Link href="/dashboard/services/tax-filing/consultation">
              <button className="px-4 py-2 border border-(--color-accent-yellow) text-(--color-accent-yellow) rounded-lg text-sm font-semibold hover:bg-(--color-accent-yellow)/10 transition-colors">
                Book Consultation
              </button>
            </Link>
          </div>
        ) : (
          <div className="mt-4">
            <Link href="/pricing?upgrade=enterprise">
              <button className="px-4 py-2 bg-(--color-accent-yellow) text-(--color-ink) rounded-lg text-sm font-semibold hover:bg-(--color-accent-yellow)/90 transition-colors">
                Upgrade to Enterprise for Tax Filing
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* Premium Modal */}
      <PremiumModal
        open={showModal}
        onClose={() => setShowModal(false)}
        currentTier={userTier}
      />
    </div>
  );
};

export default TaxCalculator;