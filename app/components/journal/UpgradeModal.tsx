// app/components/journal/UpgradeModal.tsx

import { Dialog, DialogContent } from '../ui/dialog';
import { PlanSelection } from './PlanSelection';
import { useTier } from '@/app/context/TierContext';
import { UserTier } from '@/types/tier';
import { toast } from 'sonner';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  highlight?: UserTier;
}

export function UpgradeModal({ open, onOpenChange }: UpgradeModalProps) {
  const { tier, setTier } = useTier();

  const handleSelect = (t: UserTier) => {
    setTier(t);
    toast.success(`Switched to ${t === 'free' ? 'Free' : t} plan`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl squircle-lg border-border max-h-[92vh] overflow-y-auto p-0">
        <PlanSelection isSwitcher currentTier={tier} onSelect={handleSelect} onCancel={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}