// app/components/journal/UpgradePrompt.tsx

import { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { UpgradeModal } from './UpgradeModal'; 
import { UserTier } from '@/types/tier'; 
import { cn } from '@/lib/utils';

interface UpgradePromptProps {
  title: string;
  description: string;
  highlight?: UserTier;
  className?: string;
}

export function UpgradePrompt({ title, description, highlight = 'premium', className }: UpgradePromptProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'group w-full text-left squircle p-5 flex items-center gap-4 transition-all',
          'bg-gradient-to-r from-primary/10 via-primary/5 to-transparent',
          'border border-primary/20 hover:border-primary/50 hover:shadow-[var(--shadow-premium)]',
          className
        )}
      >
        <div className="p-2.5 squircle-sm bg-primary/15 text-primary flex-shrink-0">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold text-sm">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" />
      </button>
      <UpgradeModal open={open} onOpenChange={setOpen} highlight={highlight} />
    </>
  );
}