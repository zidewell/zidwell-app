import { useEffect, useRef, useState } from 'react';
import { Plus, Building2, Loader2, Eye, EyeOff, Copy, Shield } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { useTier } from '@/app/context/TierContext';
import { toast } from 'sonner';

export interface BankAccount {
  id: string;           // Mono account id
  bank: string;
  mask: string;
  syncedAt: string;
  fullAccountNumber: string;
  balance: number;
}

const STORAGE_KEY = 'zidwell_connected_banks'; // TODO: replace with backend persistence — see note below

function loadAccounts(): BankAccount[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as BankAccount[];
  } catch {
    return [];
  }
}

function saveAccounts(list: BankAccount[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function ConnectedAccounts() {
  const { accountLimit, tier } = useTier();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [connecting, setConnecting] = useState(false);
  const popupRef = useRef<Window | null>(null);

  useEffect(() => {
    setAccounts(loadAccounts());
  }, []);

  // Listen for the popup callback message
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (!event.data || typeof event.data !== "object") return;

      if (event.data.type === "mono_success" && event.data.code) {
        await finishConnection(event.data.code);
      } else if (event.data.type === "mono_error") {
        setConnecting(false);
        toast.error("Account connection failed", { description: event.data.error });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts]);

  const limitReached = accounts.length >= accountLimit;

  const finishConnection = async (code: string) => {
    try {
      // Step 1: exchange code for account id
      const exchangeRes = await fetch("/api/mono/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const exchangeData = await exchangeRes.json();

      if (!exchangeRes.ok) {
        throw new Error(exchangeData.error || "Failed to link account");
      }

      const accountId = exchangeData.id || exchangeData.data?.id;
      if (!accountId) {
        throw new Error("No account id returned from Mono");
      }

      // Step 2: fetch account details
      const detailsRes = await fetch(`/api/mono/accounts/${accountId}`);
      const detailsData = await detailsRes.json();

      if (!detailsRes.ok) {
        throw new Error(detailsData.error || "Failed to fetch account details");
      }

      // NOTE: adjust these field paths once you see Mono's actual response shape
      const accountInfo = detailsData.data || detailsData;
      const newAccount: BankAccount = {
        id: accountId,
        bank: accountInfo.institution?.name || "Connected Bank",
        mask: `•••• ${(accountInfo.accountNumber || "0000").slice(-4)}`,
        fullAccountNumber: accountInfo.accountNumber || "",
        balance: accountInfo.balance ? accountInfo.balance / 100 : 0, // Mono often returns kobo
        syncedAt: new Date().toISOString(),
      };

      const updated = [...accounts, newAccount];
      setAccounts(updated);
      saveAccounts(updated); // TODO: persist to your backend instead of localStorage

      toast.success(`${newAccount.bank} connected`);
    } catch (err: any) {
      console.error(err);
      toast.error("Account connection failed", { description: err.message });
    } finally {
      setConnecting(false);
    }
  };

 const openConnect = async () => {
  // if (limitReached) {
  //   toast.error('Account limit reached', {
  //     description: `Your ${tier} plan supports ${accountLimit} connected accounts. Upgrade to add more.`,
  //   });
  //   return;
  // }

  setConnecting(true);

  // Open the popup FIRST, synchronously, while still inside the click handler.
  // Use about:blank as a placeholder — we'll redirect it once we have the Mono URL.
  const popup = window.open(
    "about:blank",
    "mono_connect",
    "width=433,height=700,left=200,top=100"
  );

  if (!popup) {
    toast.error("Popup blocked", {
      description: "Please allow popups for this site and try again.",
    });
    setConnecting(false);
    return;
  }

  popupRef.current = popup;

  try {
    const res = await fetch("/api/mono/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer: {
          name: "Zidwell User",
          email: "user@zidwell.com",
        },
        meta: { ref: `zidwell-${Date.now()}` },
        scope: "auth",
        redirect_url: `${window.location.origin}/mono/callback`,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to start Mono connection");
    }

    const monoUrl = data.mono_url || data.data?.mono_url;
    if (!monoUrl) {
      throw new Error("No Mono URL returned");
    }

    // Now that we have the real URL, navigate the already-open popup to it.
    popup.location.href = monoUrl;
  } catch (err: any) {
    console.error(err);
    toast.error("Could not start account connection", { description: err.message });
    popup.close();
    setConnecting(false);
  }
};

  const removeAccount = (id: string) => {
    const updated = accounts.filter((a) => a.id !== id);
    setAccounts(updated);
    saveAccounts(updated); // TODO: also remove server-side
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

  const formatMoney = (n: number) => '₦' + n.toLocaleString('en-NG');

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
          disabled={connecting}
          className="bg-foreground text-background hover:opacity-90 font-semibold squircle-sm disabled:opacity-50"
        >
          {connecting ? (
            <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Connecting…</>
          ) : (
            <><Plus className="h-4 w-4 mr-1.5" /> Connect Account</>
          )}
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
                <div className="w-12 h-12 squircle-sm flex items-center justify-center font-display font-bold text-white text-lg bg-primary">
                  {acc.bank.slice(0, 2).toUpperCase()}
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
                  {isRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
            <p className="text-xs text-center max-w-xs flex items-center gap-1.5 justify-center">
              <Shield className="h-3.5 w-3.5 text-success" />
              Bank-grade, read-only, revoke any time.
            </p>
          </button>
        )}
      </div>

      {limitReached && Number.isFinite(accountLimit) && (
        <p className="text-xs text-muted-foreground text-center pt-2">
          You've reached your {accountLimit}-account limit. Upgrade your plan to connect more.
        </p>
      )}
    </section>
  );
}