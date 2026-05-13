"use client";

import { motion } from "framer-motion";
import { 
  GraduationCap, 
  Heart, 
  Package, 
  FileDown, 
  Briefcase, 
  Building2, 
  LineChart, 
  PiggyBank, 
  Bitcoin, 
  AlertTriangle 
} from "lucide-react";
import type { PageType } from "@/app/hooks/useStore";

const types: { value: PageType; label: string; icon: typeof GraduationCap; description: string }[] = [
  { value: "school", label: "School Fees", icon: GraduationCap, description: "Collect tuition, fees & levies with student tracking" },
  { value: "donation", label: "Donation", icon: Heart, description: "Accept donations with suggested amounts & donor messages" },
  { value: "physical", label: "Physical Product", icon: Package, description: "Sell items with variants, quantity & shipping" },
  { value: "digital", label: "Digital Product", icon: FileDown, description: "Sell downloads, links or files with instant delivery" },
  { value: "services", label: "Services", icon: Briefcase, description: "Offer services with optional booking & customer notes" },
];

const investmentTypes: { value: PageType; label: string; icon: typeof Building2; description: string }[] = [
  { value: "real_estate", label: "Real Estate", icon: Building2, description: "Collect property investments with structured terms" },
  { value: "stock", label: "Stock Investment", icon: LineChart, description: "Manage stock portfolio contributions" },
  { value: "savings", label: "Savings / Ajo", icon: PiggyBank, description: "Run thrift, cooperative or savings groups" },
  { value: "crypto", label: "Crypto", icon: Bitcoin, description: "Accept crypto investment contributions" },
];

interface Props {
  onSelect: (type: PageType) => void;
}

const PageTypeSelector = ({ onSelect }: Props) => (
  <div className="space-y-8">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        What are you selling?
      </h2>
      <p className="text-[var(--text-secondary)] mt-1">Choose the type that best fits your use case</p>
    </div>
    
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {types.map((t, i) => (
        <motion.button
          key={t.value}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => onSelect(t.value)}
          className="p-5 rounded-2xl border-2 border-[var(--border-color)] bg-[var(--bg-primary)] text-left hover:border-[var(--color-accent-yellow)] hover:bg-[var(--color-accent-yellow)]/5 transition-all group squircle-lg"
        >
          <t.icon className="h-7 w-7 text-[var(--color-accent-yellow)] mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-base mb-1 text-[var(--text-primary)]">{t.label}</h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{t.description}</p>
        </motion.button>
      ))}
    </div>

    {/* Investment & Savings Section */}
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1 bg-[var(--border-color)]" />
        <span className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Investment & Savings</span>
        <div className="h-px flex-1 bg-[var(--border-color)]" />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {investmentTypes.map((t, i) => (
          <motion.button
            key={t.value}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (types.length + i) * 0.05 }}
            onClick={() => onSelect(t.value)}
            className="p-5 rounded-2xl border-2 border-[var(--border-color)] bg-[var(--bg-primary)] text-left hover:border-[var(--color-accent-yellow)] hover:bg-[var(--color-accent-yellow)]/5 transition-all group relative squircle-lg"
          >
            <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--color-accent-yellow)]/10 text-[var(--color-accent-yellow)] text-[10px] font-bold">
              <AlertTriangle className="h-3 w-3" /> Disclaimer
            </div>
            <t.icon className="h-7 w-7 text-[var(--color-accent-yellow)] mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-base mb-1 text-[var(--text-primary)]">{t.label}</h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{t.description}</p>
          </motion.button>
        ))}
      </div>
    </div>
  </div>
);

export default PageTypeSelector;