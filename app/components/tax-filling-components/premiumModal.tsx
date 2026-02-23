import { X, Sparkles } from "lucide-react";

interface PremiumModalProps {
  open: boolean;
  onClose: () => void;
}

export function PremiumModal({ open, onClose }: PremiumModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-[#ffffff]/80 dark:bg-[#0e0e0e]/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md mx-4 rounded-2xl border border-[#e6e6e6] dark:border-[#2e2e2e] bg-[#ffffff] dark:bg-[#161616] p-8 shadow-2xl animate-fade-in-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#6b6b6b] dark:text-[#b3b3b3] hover:text-[#242424] dark:hover:text-[#ffffff] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-[#C29307]/10 dark:bg-[#ffffff]/10 flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-[#C29307] dark:text-[#ffffff]" />
          </div>
          <h3 className="text-2xl font-heading">Unlock Tax Estimation</h3>
          <p className="text-[#6b6b6b] dark:text-[#b3b3b3] text-sm">
            Get instant tax calculations, detailed breakdowns, and filing support for your business.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          {[
            { name: "Starter", price: "₦5,000/mo", features: "CIT + VAT calculators" },
            { name: "Professional", price: "₦12,000/mo", features: "All calculators + Filing support" },
            { name: "Enterprise", price: "₦25,000/mo", features: "Everything + Dedicated advisor" },
          ].map((tier) => (
            <div
              key={tier.name}
              className="flex items-center justify-between p-4 rounded-xl border border-[#e6e6e6] dark:border-[#2e2e2e] hover:border-[#C29307]/50 dark:hover:border-[#ffffff]/50 transition-colors cursor-pointer group"
            >
              <div>
                <p className="font-subheading font-semibold text-[#242424] dark:text-[#ffffff]">{tier.name}</p>
                <p className="text-xs text-[#6b6b6b] dark:text-[#b3b3b3]">{tier.features}</p>
              </div>
              <span className="text-sm font-semibold text-[#C29307]  dark:text-[#ffffff]">{tier.price}</span>
            </div>
          ))}
        </div>

        <button className="mt-6 w-full py-3 rounded-xl bg-[#C29307] cursor-pointer dark:bg-[#ffffff] text-[#ffffff] dark:text-[#0e0e0e] font-semibold hover:opacity-90 transition-opacity">
          Upgrade Now
        </button>
      </div>
    </div>
  );
}
