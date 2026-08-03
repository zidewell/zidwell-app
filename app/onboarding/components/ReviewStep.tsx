// app/onboarding/components/ReviewStep.tsx
import { ArrowRight, Shield, Sparkles } from "lucide-react";

type Purpose = "personal" | "business";

type BvnData = {
  fullName: string;
  bvn: string;
  phone: string;
};

type BusinessState = {
  isRegistered: boolean | null;
  businessName: string;
  cacNumber: string;
  businessAddress: string;
  businessCategory: string;
  cacData: {
    companyName: string;
    rcNumber: string;
  } | null;
};

export default function ReviewStep({
  purpose,
  bvnData,
  business,
}: {
  purpose: Purpose;
  bvnData: BvnData;
  business: BusinessState;
}) {
  const rows: { label: string; value: string }[] = [
    {
      label: "Account type",
      value: purpose === "business" ? "Business" : "Personal",
    },
    { label: "Full name", value: bvnData.fullName },
    { label: "Phone", value: bvnData.phone },
    { label: "BVN", value: `••••••• ${bvnData.bvn.slice(-4)}` },
  ];

  if (purpose === "business") {
    rows.push(
      { label: "Business", value: business.businessName || "—" },
      {
        label: "CAC",
        value: business.isRegistered
          ? business.cacData?.rcNumber || "—"
          : "Not registered",
      },
      { label: "Address", value: business.businessAddress || "—" },
      { label: "Category", value: business.businessCategory || "—" }
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Review & activate
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Confirm everything looks right, then activate your wallet.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
        <dl className="divide-y divide-gray-200 dark:divide-gray-700">
          {rows.map((r) => (
            <div
              key={r.label}
              className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              <dt className="text-sm text-gray-500 dark:text-gray-400">
                {r.label}
              </dt>
              <dd
                className="text-sm font-medium text-gray-900 dark:text-gray-100 text-right truncate max-w-[60%]"
                title={r.value}
              >
                {r.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="relative overflow-hidden rounded-2xl border-2 border-yellow-400 bg-black p-6 text-white">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-yellow-400/20 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-400" />
              <p className="text-xs font-semibold uppercase tracking-widest text-yellow-400">
                One-time activation
              </p>
            </div>
            <h3 className="mt-2 text-xl font-bold">
              Activate your Zidwell wallet
            </h3>
            <p className="mt-1 max-w-md text-sm text-white/70">
              Fund with <span className="font-semibold text-yellow-400">₦2,000</span>. We debit{" "}
              <span className="font-semibold text-yellow-400">₦1,000</span> for KYC verification —
              the rest stays in your wallet.
            </p>
          </div>
          <div className="rounded-xl bg-yellow-400 px-4 py-2 text-lg font-bold text-black shadow-lg">
            ₦1,000
          </div>
        </div>

        <ul className="relative mt-5 grid gap-2 text-sm text-white/80 sm:grid-cols-2">
          {[
            "Dedicated NUBAN account number",
            "Send & receive nationwide",
            "Pay bills, buy airtime & data",
            "Bank-grade encryption",
          ].map((f) => (
            <li key={f} className="flex items-center gap-2">
              <ArrowRight className="h-3.5 w-3.5 text-yellow-400" />
              {f}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
        <Shield className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400" />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Insured by NDIC. Zidwell is a licensed partner and never has direct
          access to funds outside your wallet.
        </p>
      </div>
    </div>
  );
}
