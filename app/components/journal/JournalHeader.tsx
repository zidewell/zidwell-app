import { format } from 'date-fns';
import { JournalTabs } from './JournalTabs';
import { TierBadge } from './TierBadge';
import { useJournal } from '@/app/context/JournalContext'; 
import { useTier } from '@/app/context/TierContext'; 
import { useRegion } from '@/app/context/RegionContext';
import { UserTier } from '@/types/tier';
import { useState } from 'react';
import { UpgradeModal } from './UpgradeModal';
import { ChevronDown, Globe, MapPin } from 'lucide-react';

export function JournalHeader() {
  const { activeJournalType, setActiveJournalType } = useJournal();
  const { tier, setTier, clearSelection } = useTier();
  const { region, clearRegion } = useRegion();
  const availableTiers: UserTier[] = region === 'nigeria' ? ['free', 'lite', 'premium', 'business'] : ['free', 'lite'];
  const [openTier, setOpenTier] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const today = new Date();

  const getGreeting = () => {
    const hour = today.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <header className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground font-medium">{format(today, 'EEEE, MMMM d, yyyy')}</p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">{getGreeting()}</h1>
          <p className="text-muted-foreground">Your bookkeeping, with calm clarity.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowSwitcher((s) => !s)}
              className="inline-flex items-center gap-1"
              aria-label="Switch tier"
            >
              <TierBadge tier={tier} size="md" />
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
            {showSwitcher && (
              <div className="absolute right-0 top-full mt-2 squircle-sm bg-card border border-border shadow-[var(--shadow-elevated)] p-1 z-50 min-w-[160px]">
                {availableTiers.map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTier(t);
                      setShowSwitcher(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-secondary capitalize flex items-center justify-between"
                  >
                    {t}
                    {tier === t && <span className="text-xs text-success">●</span>}
                  </button>
                ))}
                <div className="border-t border-border my-1" />
                <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  {region === 'nigeria' ? <MapPin className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                  Zidwell {region === 'nigeria' ? 'Nigeria' : 'Global'}
                </div>
                <button
                  onClick={() => {
                    setShowSwitcher(false);
                    clearRegion();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-secondary text-muted-foreground"
                >
                  Switch region
                </button>
                <div className="border-t border-border my-1" />
                <button
                  onClick={() => {
                    setShowSwitcher(false);
                    setOpenTier(true);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-secondary text-primary font-medium"
                >
                  Change plan
                </button>
                <button
                  onClick={() => {
                    setShowSwitcher(false);
                    clearSelection();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-secondary text-muted-foreground"
                >
                  Back to onboarding
                </button>
              </div>
            )}
          </div>
      
        </div>
      </div>

      <JournalTabs activeTab={activeJournalType} onTabChange={setActiveJournalType} />

      <UpgradeModal open={openTier} onOpenChange={setOpenTier} />
    </header>
  );
}
