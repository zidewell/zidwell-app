"use client";

import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { TaxCard } from "./TaxCard";
import { CurrencyInput } from "./CurrencyInput";
import { InfoTooltip } from "./InfoTooltip";
import { PremiumModal } from "./premiumModal"; 
import { calculateCIT, calculateVAT, calculateWHT, calculatePIT, formatNaira } from "@/app/utils/tax-calculation"; 
import { Sparkles } from "lucide-react";

const DISCLAIMER = "This is only an estimate. For accurate calculation and tax filing assistance, contact our finance managers.";

const TaxCalculator = () => {
  const [isPremium, setIsPremium] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // CIT state
  const [citRevenue, setCitRevenue] = useState("");
  const [citExpenses, setCitExpenses] = useState("");
  const [citCompanyType, setCitCompanyType] = useState("small");
  const [citResult, setCitResult] = useState<number | null>(null);

  // VAT state
  const [vatSales, setVatSales] = useState("");
  const [vatInput, setVatInput] = useState("");
  const [vatResult, setVatResult] = useState<{ outputVAT: number; vatPayable: number } | null>(null);

  // WHT state
  const [whtValue, setWhtValue] = useState("");
  const [whtType, setWhtType] = useState("consultancy");
  const [whtResult, setWhtResult] = useState<{ wht: number; netAmount: number } | null>(null);

  // PIT state
  const [pitIncome, setPitIncome] = useState("");
  const [pitResult, setPitResult] = useState<number | null>(null);

  const openModal = () => setShowModal(true);

  return (
    <div className="space-y-12">
      {/* Premium Badge */}
      {!isPremium && (
        <button
          onClick={openModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#000000]/10 dark:bg-[#ffffff]/10 text-[#000000] dark:text-[#ffffff] text-xs font-semibold hover:bg-[#000000]/20 dark:hover:bg-[#ffffff]/20 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" /> Premium Feature
        </button>
      )}

      {/* Title */}
      <div>
        <h1 className="text-4xl md:text-5xl font-heading text-[#242424] dark:text-[#ffffff]">SME Tax Dashboard</h1>
        <p className="mt-2 text-[#6b6b6b] dark:text-[#b3b3b3]">Estimate your business taxes in minutes.</p>
        <p className="mt-3 text-xs text-[#6b6b6b]/70 dark:text-[#b3b3b3]/70 italic">
          Answer accurately. You can't lie to the government.
        </p>
      </div>

      {/* DEV toggle for testing */}
      <label className="flex items-center gap-2 text-xs text-[#6b6b6b] dark:text-[#b3b3b3] cursor-pointer select-none">
        <input
          type="checkbox"
          checked={isPremium}
          onChange={(e) => setIsPremium(e.target.checked)}
          className="accent-[#000000] dark:accent-[#ffffff]"
        />
        Simulate premium access
      </label>

      {/* 1. CIT */}
      <TaxCard
        title="Company Income Tax (CIT)"
        description="Tax on company profit after allowable expenses."
        isPremium={isPremium}
        onPremiumClick={openModal}
        onCalculate={() => setCitResult(calculateCIT(Number(citRevenue) || 0, Number(citExpenses) || 0, citCompanyType))}
        onReset={() => { setCitRevenue(""); setCitExpenses(""); setCitCompanyType("small"); setCitResult(null); }}
        documents={["Financial Statement", "Profit & Loss Statement", "Balance Sheet", "Audited Accounts (if applicable)", "Tax Identification Number (TIN)"]}
        disclaimer={DISCLAIMER}
        statusLabel={citResult !== null ? (citResult > 0 ? "You may owe tax" : "No tax payable") : null}
        result={
          citResult !== null ? (
            <p className="text-lg font-heading text-[#242424] dark:text-[#ffffff]">
              Estimated CIT: <span className="text-[#000000] dark:text-[#ffffff]">{formatNaira(citResult)}</span>
            </p>
          ) : null
        }
      >
        <CurrencyInput
          label="Annual Revenue"
          value={citRevenue}
          onChange={setCitRevenue}
          disabled={!isPremium}
          tooltip={<InfoTooltip content="Total income your company generated from business operations in the financial year." />}
        />
        <CurrencyInput
          label="Allowable Business Expenses"
          value={citExpenses}
          onChange={setCitExpenses}
          disabled={!isPremium}
          tooltip={<InfoTooltip content="Costs directly related to running your business — salaries, rent, utilities, etc." />}
        />
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#242424] dark:text-[#ffffff] flex items-center gap-1">
            Company Type
            <InfoTooltip content="Small companies have ≤ ₦100m turnover and pay 0% CIT. Medium/Large companies pay 25%." />
          </label>
          <select
            value={citCompanyType}
            onChange={(e) => setCitCompanyType(e.target.value)}
            disabled={!isPremium}
            className="w-full px-4 py-3 rounded-lg border border-[#e6e6e6] dark:border-[#2e2e2e] bg-[#ffffff] dark:bg-[#0e0e0e] text-[#242424] dark:text-[#ffffff] text-sm disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#29a36c] dark:focus:ring-[#2eb87a]"
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
        isPremium={isPremium}
        onPremiumClick={openModal}
        onCalculate={() => setVatResult(calculateVAT(Number(vatSales) || 0, Number(vatInput) || 0))}
        onReset={() => { setVatSales(""); setVatInput(""); setVatResult(null); }}
        documents={["VAT Sales Invoices", "Purchase Invoices", "VAT Ledger", "Monthly Sales Report"]}
        disclaimer={DISCLAIMER}
        statusLabel={vatResult !== null ? (vatResult.vatPayable > 0 ? "You may owe tax" : "No VAT payable") : null}
        result={
          vatResult !== null ? (
            <div className="space-y-1">
              <p className="text-sm text-[#6b6b6b] dark:text-[#b3b3b3]">Output VAT: {formatNaira(vatResult.outputVAT)}</p>
              <p className="text-lg font-heading text-[#242424] dark:text-[#ffffff]">
                VAT Payable: <span className="text-[#000000] dark:text-[#ffffff]">{vatResult.vatPayable > 0 ? formatNaira(vatResult.vatPayable) : "₦0"}</span>
              </p>
              {vatResult.vatPayable < 0 && (
                <p className="text-xs text-[#6b6b6b] dark:text-[#b3b3b3]">No VAT payable. Excess carried forward.</p>
              )}
            </div>
          ) : null
        }
      >
        <CurrencyInput
          label="Total Taxable Sales"
          value={vatSales}
          onChange={setVatSales}
          disabled={!isPremium}
          tooltip={<InfoTooltip content="The total value of goods and services sold that are subject to VAT." />}
        />
        <CurrencyInput
          label="Total Input VAT Paid"
          value={vatInput}
          onChange={setVatInput}
          disabled={!isPremium}
          tooltip={<InfoTooltip content="VAT you already paid on business purchases and expenses." />}
        />
      </TaxCard>

      {/* 3. WHT */}
      <TaxCard
        title="Withholding Tax (WHT)"
        description="Advance tax deducted at source."
        isPremium={isPremium}
        onPremiumClick={openModal}
        onCalculate={() => setWhtResult(calculateWHT(Number(whtValue) || 0, whtType))}
        onReset={() => { setWhtValue(""); setWhtType("consultancy"); setWhtResult(null); }}
        documents={["Contract Agreement", "Invoice", "WHT Credit Note"]}
        disclaimer={DISCLAIMER}
        statusLabel={whtResult !== null ? "Tax deducted at source" : null}
        result={
          whtResult !== null ? (
            <div className="space-y-1">
              <p className="text-lg font-heading text-[#242424] dark:text-[#ffffff]">
                WHT Deducted: <span className="text-[#000000] dark:text-[#ffffff]">{formatNaira(whtResult.wht)}</span>
              </p>
              <p className="text-sm text-[#6b6b6b] dark:text-[#b3b3b3]">
                Net Amount Receivable: {formatNaira(whtResult.netAmount)}
              </p>
            </div>
          ) : null
        }
      >
        <CurrencyInput
          label="Contract Value"
          value={whtValue}
          onChange={setWhtValue}
          disabled={!isPremium}
        />
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#242424] dark:text-[#ffffff]">Transaction Type</label>
          <select
            value={whtType}
            onChange={(e) => setWhtType(e.target.value)}
            disabled={!isPremium}
            className="w-full px-4 py-3 rounded-lg border border-[#e6e6e6] dark:border-[#2e2e2e] bg-[#ffffff] dark:bg-[#0e0e0e] text-[#242424] dark:text-[#ffffff] text-sm disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#29a36c] dark:focus:ring-[#2eb87a]"
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
        isPremium={isPremium}
        onPremiumClick={openModal}
        onCalculate={() => setPitResult(calculatePIT(Number(pitIncome) || 0))}
        onReset={() => { setPitIncome(""); setPitResult(null); }}
        documents={["Income Statement", "Expense Breakdown", "Bank Statements", "Tax Identification Number (TIN)"]}
        disclaimer={DISCLAIMER}
        statusLabel={pitResult !== null ? (pitResult > 0 ? "You may owe tax" : "No tax payable") : null}
        result={
          pitResult !== null ? (
            <p className="text-lg font-heading text-[#242424] dark:text-[#ffffff]">
              Estimated PIT: <span className="text-[#000000] dark:text-[#ffffff]">{formatNaira(pitResult)}</span>
            </p>
          ) : null
        }
      >
        <CurrencyInput
          label="Annual Taxable Income"
          value={pitIncome}
          onChange={setPitIncome}
          disabled={!isPremium}
          tooltip={<InfoTooltip content="Your total personal business income after allowable deductions for the year." />}
        />
      </TaxCard>

      {/* Filing Integration Notice */}
      <div className="rounded-2xl border border-[#e6e6e6] dark:border-[#2e2e2e] bg-[#ffffff] dark:bg-[#161616] p-6 space-y-3">
        <h4 className="font-subheading text-[#242424] dark:text-[#ffffff]">🔗 Tax Filing Integration</h4>
        <p className="text-sm text-[#6b6b6b] dark:text-[#b3b3b3] leading-relaxed">
          Zidwell Finance provides tax estimates based on user inputs. These calculations are not legally binding. Always consult our certified tax professionals before filing.
        </p>
      </div>

      <PremiumModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
};

export default TaxCalculator;