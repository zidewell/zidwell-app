// app/components/journal/LockedOverlay.tsx

import { ReactNode, useState } from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { Button } from '../ui/button'; 
import { UpgradeModal } from './UpgradeModal';
import { UserTier } from '@/types/tier'; 
import { cn } from '@/lib/utils';

interface LockedOverlayProps {
  children: ReactNode;
  requiredTier: UserTier;
  title?: string;
  description?: string;
  className?: string;
}

export function LockedOverlay({
  children,
  requiredTier,
  title = 'Unlock Financial Intelligence',
  description,
  className,
}: LockedOverlayProps) {
  const [open, setOpen] = useState(false);
  const tierLabel =
    requiredTier === 'business' ? 'Business' : requiredTier === 'premium' ? 'Premium' : 'Lite';
  const defaultDesc =
    requiredTier === 'business'
      ? 'Available on Business — AI statements, automatic tax calculation, and unlimited bank accounts.'
      : requiredTier === 'premium'
      ? 'Available on Premium — connect up to 8 accounts plus health score and PDF statements.'
      : 'Available on Lite — connect up to 3 bank accounts and auto-feed transactions into your books.';

  return (
    <>
      <div className={cn('relative squircle overflow-hidden', className)}>
        <div className="pointer-events-none select-none opacity-40 blur-[3px]">{children}</div>

        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center"
          style={{
            background:
              'radial-gradient(circle at center, hsl(var(--background) / 0.85) 0%, hsl(var(--background) / 0.95) 100%)',
            boxShadow: 'inset 0 0 0 1px hsl(var(--primary) / 0.3)',
          }}
        >
          <div
            className="p-3 squircle-sm bg-primary/15 text-primary"
            style={{ boxShadow: '0 0 24px -4px hsl(var(--primary) / 0.4)' }}
          >
            <Lock className="h-5 w-5" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="font-display text-lg font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description ?? defaultDesc}</p>
          </div>
          <Button
            onClick={() => setOpen(true)}
            className="bg-primary text-primary-foreground hover:opacity-90 font-semibold"
            size="sm"
          >
            <Sparkles className="h-4 w-4 mr-1.5" />
            Unlock {tierLabel}
          </Button>
        </div>
      </div>

      <UpgradeModal open={open} onOpenChange={setOpen} highlight={requiredTier} />
    </>
  );
}