import { useEffect, useState } from 'react';
import { Plus, Check, Shield, Building2, Lock, Loader2, Eye, EyeOff, Copy } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { useTier } from '@/app/context/TierContext'; 
import { useJournal } from '@/app/context/JournalContext'; 
import { JournalEntry } from './types'; 
import { toast } from 'sonner';

export interface BankAccount {
  id: string;
  bank: string;
  logo: string;
  color: string;
  mask: string;
  syncedAt: string;
  fullAccountNumber: string;
  balance: number;
}

interface DiscoveredAccount {
  key: string;
  bank: string;
  logo: string;
  color: string;
  accountNumber: string;
}

const STORAGE_KEY = 'zidwell_connected_banks';
const AUTH_KEY = 'zidwell_bank_auth_done';

const BANK_POOL = [
  { id: 'gtbank', name: 'GTBank', logo: 'GT', color: '#E84C3D' },
  { id: 'zenith', name: 'Zenith Bank', logo: 'Z', color: '#E60012' },
  { id: 'access', name: 'Access Bank', logo: 'A', color: '#0066B3' },
  { id: 'uba', name: 'UBA', logo: 'U', color: '#D81F26' },
  { id: 'firstbank', name: 'First Bank', logo: 'FB', color: '#003B7A' },
  { id: 'opay', name: 'Opay', logo: 'O', color: '#00B074' },
  { id: 'palmpay', name: 'PalmPay', logo: 'P', color: '#7A37D6' },
  { id: 'kuda', name: 'Kuda', logo: 'K', color: '#40196D' },
];

// Sample transactions auto-synced when a bank account is connected.
const SAMPLE_FEED: Array<Omit<JournalEntry, 'id' | 'createdAt' | 'date'> & { daysAgo: number }> = [
  { type: 'income', amount: 250000, categoryId: 'sales', note: 'POS settlement', journalType: 'business', daysAgo: 0 },
  { type: 'income', amount: 85000, categoryId: 'services', note: 'Client transfer', journalType: 'business', daysAgo: 1 },
  { type: 'expense', amount: 12500, categoryId: 'food', note: 'Card purchase — restaurant', journalType: 'personal', daysAgo: 1 },
  { type: 'expense', amount: 6500, categoryId: 'transportation', note: 'Fuel — debit alert', journalType: 'personal', daysAgo: 2 },
  { type: 'expense', amount: 3200, categoryId: 'data-airtime', note: 'Airtime top-up', journalType: 'personal', daysAgo: 3 },
  { type: 'expense', amount: 45000, categoryId: 'utilities', note: 'Electricity bill', journalType: 'business', daysAgo: 4 },
];

function loadAccounts(): BankAccount[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as Array<Partial<BankAccount>>;
    return raw.map((a) => ({
      id: a.id || crypto.randomUUID(),
      bank: a.bank || 'Unknown',
      logo: a.logo || '',
      color: a.color || '#000',
      mask: a.mask || '•••• 0000',
      syncedAt: a.syncedAt || new Date().toISOString(),
      fullAccountNumber: a.fullAccountNumber || randomAccountNumber(),
      balance: typeof a.balance === 'number' ? a.balance : Math.floor(50000 + Math.random() * 950000),
    })) as BankAccount[];
  } catch {
    return [];
  }
}

function saveAccounts(list: BankAccount[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function randomAccountNumber() {
  return Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join('');
}

function buildDiscovered(existing: BankAccount[]): DiscoveredAccount[] {
  const connectedBanks = new Set(existing.map((a) => a.bank));
  const pool = BANK_POOL.filter((b) => !connectedBanks.has(b.name));
  const count = Math.min(pool.length, 4 + Math.floor(Math.random() * 3));
  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, count);
  return shuffled.map((b) => ({
    key: b.id,
    bank: b.name,
    logo: b.logo,
    color: b.color,
    accountNumber: randomAccountNumber(),
  }));
}

type Step = 'authenticate' | 'select';

export function ConnectedAccounts() {
  const { accountLimit, tier } = useTier();
  const { addEntry } = useJournal();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [authDone, setAuthDone] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<Step>('authenticate');

  const [bvn, setBvn] = useState('');
  const [nin, setNin] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);

  const [discovered, setDiscovered] = useState<DiscoveredAccount[]>([]);
  const [connectingKey, setConnectingKey] = useState<string | null>(null);
  const [discovering, setDiscovering] = useState(false);

  useEffect(() => {
    setAccounts(loadAccounts());
    setAuthDone(localStorage.getItem(AUTH_KEY) === 'true');
  }, []);

  const limitReached = accounts.length >= accountLimit;
  const remaining = Number.isFinite(accountLimit) ? Math.max(0, accountLimit - accounts.length) : Infinity;

  const resetModal = () => {
    setBvn('');
    setNin('');
    setAgreed(false);
    setAuthenticating(false);
    setDiscovered([]);
    setConnectingKey(null);
    setDiscovering(false);
  };

  const runDiscovery = (existing: BankAccount[]) => {
    setDiscovering(true);
    setStep('select');
    setTimeout(() => {
      setDiscovered(buildDiscovered(existing));
      setDiscovering(false);
    }, 900);
  };

  const openConnect = () => {
    if (limitReached) {
      toast.error('Account limit reached', {
        description: `Your ${tier} plan supports ${accountLimit} connected ${accountLimit === 1 ? 'account' : 'accounts'}. Upgrade to add more.`,
      });
      return;
    }
    resetModal();
    setShowModal(true);
    if (authDone) {
      runDiscovery(accounts);
    } else {
      setStep('authenticate');
    }
  };

  const handleAuthenticate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{11}$/.test(bvn)) {
      toast.error('BVN must be 11 digits');
      return;
    }
    if (!/^\d{11}$/.test(nin)) {
      toast.error('NIN must be 11 digits');
      return;
    }
    if (!agreed) {
      toast.error('Please accept the terms of use to continue');
      return;
    }
    setAuthenticating(true);
    setTimeout(() => {
      localStorage.setItem(AUTH_KEY, 'true');
      setAuthDone(true);
      setAuthenticating(false);
      runDiscovery(accounts);
    }, 1400);
  };

  const seedSampleEntries = (bankName: string) => {
    const today = new Date();
    // pick 3 random samples per connected account
    const picks = [...SAMPLE_FEED].sort(() => Math.random() - 0.5).slice(0, 3);
    picks.forEach((s) => {
      const d = new Date(today);
      d.setDate(d.getDate() - s.daysAgo);
      addEntry({
        type: s.type,
        amount: s.amount,
        categoryId: s.categoryId,
        note: `${s.note} · ${bankName}`,
        journalType: s.journalType,
        date: d.toISOString().split('T')[0],
      });
    });
  };

  const handleConnectBank = (acc: DiscoveredAccount) => {
    if (accounts.length >= accountLimit) {
      toast.error('Account limit reached', { description: 'Upgrade your plan to connect more accounts.' });
      return;
    }
    setConnectingKey(acc.key);
    setTimeout(() => {
      const newAccount: BankAccount = {
        id: crypto.randomUUID(),
        bank: acc.bank,
        logo: acc.logo,
        color: acc.color,
        mask: `•••• ${acc.accountNumber.slice(-4)}`,
        syncedAt: new Date().toISOString(),
        fullAccountNumber: acc.accountNumber,
        balance: Math.floor(50000 + Math.random() * 950000),
      };
      const updated = [...accounts, newAccount];
      setAccounts(updated);
      saveAccounts(updated);
      seedSampleEntries(acc.bank);
      setDiscovered((prev) => prev.filter((d) => d.key !== acc.key));
      setConnectingKey(null);
      toast.success(`${acc.bank} connected`, {
        description: 'Recent transactions auto-synced to your bookkeeping.',
      });
    }, 900);
  };

  const removeAccount = (id: string) => {
    const updated = accounts.filter((a) => a.id !== id);
    setAccounts(updated);
    saveAccounts(updated);
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const toggleReveal = (id: string) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Unable to copy');
    }
  };

  const formatMoney = (n: number) =>
    '₦' + n.toLocaleString('en-NG');

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-xl font-semibold">Connected Accounts</h2>
          <p className="text-sm text-muted-foreground">
            Your external bank accounts feed bookkeeping automatically.{' '}
            <span className="font-medium text-foreground">
              {accounts.length}
              {Number.isFinite(accountLimit) ? ` / ${accountLimit}` : ''} connected
            </span>
          </p>
        </div>
        <Button
          onClick={openConnect}
          disabled={limitReached}
          className="bg-foreground text-background hover:opacity-90 font-semibold squircle-sm disabled:opacity-50"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Connect Account
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((acc) => {
          const isRevealed = revealed.has(acc.id);
          return (
            <div
              key={acc.id}
              className="squircle p-5 bg-card border border-border shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card)] transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-12 h-12 squircle-sm flex items-center justify-center font-display font-bold text-white text-lg"
                  style={{ background: acc.color }}
                >
                  {acc.logo}
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="text-success font-medium">Connected</span>
                </div>
              </div>
              <p className="font-display font-semibold">{acc.bank}</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-muted-foreground tabular-nums">
                  {isRevealed ? acc.fullAccountNumber : acc.mask}
                </p>
                {isRevealed && (
                  <button
                    onClick={() => copyToClipboard(acc.fullAccountNumber)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="Copy account number"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className="font-display font-semibold text-lg">
                  {isRevealed ? formatMoney(acc.balance) : '••••••'}
                </p>
                <button
                  onClick={() => toggleReveal(acc.id)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1"
                  title={isRevealed ? 'Hide details' : 'Show balance & account number'}
                >
                  {isRevealed ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <span className="text-xs text-muted-foreground">Last synced {timeAgo(acc.syncedAt)}</span>
                <button
                  onClick={() => removeAccount(acc.id)}
                  className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
                >
                  Disconnect
                </button>
              </div>
            </div>
          );
        })}

        {accounts.length === 0 && (
          <button
            onClick={openConnect}
            className="squircle p-5 border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 min-h-[160px] text-muted-foreground hover:text-primary col-span-full sm:col-span-2 lg:col-span-3"
          >
            <Building2 className="h-8 w-8" />
            <p className="font-display font-semibold text-sm">Connect your first bank account</p>
            <p className="text-xs text-center max-w-xs">
              Authenticate with your BVN & NIN — bank-grade, read-only, revoke any time.
            </p>
          </button>
        )}
      </div>

      {limitReached && Number.isFinite(accountLimit) && (
        <p className="text-xs text-muted-foreground text-center pt-2">
          You've reached your {accountLimit}-account limit. Upgrade your plan to connect more.
        </p>
      )}

      <Dialog
        open={showModal}
        onOpenChange={(o) => {
          setShowModal(o);
          if (!o) resetModal();
        }}
      >
        <DialogContent className="sm:max-w-md squircle-lg border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {step === 'authenticate' ? 'Authenticate to connect' : 'Accounts linked to your BVN'}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-success" />
              Secured by Nigeria's Open Banking System — read-only access.
            </DialogDescription>
          </DialogHeader>

          {step === 'authenticate' && (
            <form onSubmit={handleAuthenticate} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <Label htmlFor="bvn" className="text-sm font-medium">BVN</Label>
                <Input
                  id="bvn"
                  inputMode="numeric"
                  maxLength={11}
                  placeholder="11-digit Bank Verification Number"
                  value={bvn}
                  onChange={(e) => setBvn(e.target.value.replace(/\D/g, ''))}
                  className="squircle-sm tabular-nums"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nin" className="text-sm font-medium">NIN</Label>
                <Input
                  id="nin"
                  inputMode="numeric"
                  maxLength={11}
                  placeholder="11-digit National Identification Number"
                  value={nin}
                  onChange={(e) => setNin(e.target.value.replace(/\D/g, ''))}
                  className="squircle-sm tabular-nums"
                />
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                <Checkbox
                  checked={agreed}
                  onCheckedChange={(v) => setAgreed(v === true)}
                  className="mt-0.5"
                />
                <span className="text-sm text-muted-foreground leading-snug">
                  I have read the{' '}
                  <span className="text-foreground font-medium underline-offset-2 underline">terms of use</span>{' '}
                  for this service and I totally agree with it.
                </span>
              </label>

              <Button
                type="submit"
                disabled={authenticating}
                className="w-full bg-primary text-primary-foreground font-semibold hover:opacity-90"
              >
                {authenticating ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Authenticating…</>
                ) : (
                  <><Lock className="h-4 w-4 mr-2" /> Authenticate & proceed</>
                )}
              </Button>
            </form>
          )}

          {step === 'select' && (
            <div className="space-y-3 pt-1">
              {Number.isFinite(accountLimit) && (
                <p className="text-xs text-muted-foreground">
                  You can connect{' '}
                  <span className="font-semibold text-foreground">
                    {remaining} more {remaining === 1 ? 'account' : 'accounts'}
                  </span>{' '}
                  on your {tier} plan.
                </p>
              )}
              {discovering ? (
                <div className="py-12 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">Fetching accounts linked to your BVN…</p>
                </div>
              ) : discovered.length === 0 ? (
                <div className="py-10 text-center">
                  <Check className="h-8 w-8 mx-auto text-success mb-2" />
                  <p className="font-display font-semibold">All discovered accounts are connected</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    You can close this window — your books will auto-sync.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {discovered.map((acc) => {
                    const isConnecting = connectingKey === acc.key;
                    const disabled = isConnecting || accounts.length >= accountLimit;
                    return (
                      <div
                        key={acc.key}
                        className="squircle-sm p-3 border border-border bg-card flex items-center gap-3"
                      >
                        <div
                          className="w-10 h-10 squircle-sm flex items-center justify-center font-display font-bold text-white text-sm flex-shrink-0"
                          style={{ background: acc.color }}
                        >
                          {acc.logo}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{acc.bank}</p>
                          <p className="text-xs text-muted-foreground tabular-nums">{acc.accountNumber}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleConnectBank(acc)}
                          disabled={disabled}
                          className="bg-foreground text-background hover:opacity-90 font-semibold h-8 px-3 text-xs"
                        >
                          {isConnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Connect'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
                className="w-full font-medium"
              >
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
