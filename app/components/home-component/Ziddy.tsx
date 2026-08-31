import { Sparkles, ArrowUp, Zap, Clock } from "lucide-react";

const prompts = [
  "How much did I spend on food this month?",
  "Show my profit for last 90 days.",
  "What category takes most of my money?",
];

export function Ziddy() {
  return (
    <section id="ziddy" className="py-24 sm:py-32 bg-surface">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-ink text-background px-3 py-1.5 text-xs font-medium">
              <Clock className="h-3.5 w-3.5 text-gold" /> Coming soon
            </span>
            <h2 className="mt-5 font-display text-4xl sm:text-5xl font-semibold tracking-tight">
              Ziddy, your AI finance assistant.
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Ask your money anything. Get real answers in plain English — no spreadsheets, no formulas.
            </p>
            <ul className="mt-8 space-y-3">
              {prompts.map((p) => (
                <li
                  key={p}
                  className="squircle bg-background border border-border shadow-soft px-4 py-3 text-sm flex items-start gap-3"
                >
                  <Sparkles className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                  <span>“{p}”</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-7">
            <div className="relative">
              <div
                aria-hidden
                className="absolute -inset-6 rounded-[3rem] blur-3xl opacity-50 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(at 30% 20%, oklch(0.84 0.16 88 / 0.45), transparent 60%), radial-gradient(at 80% 80%, oklch(0.66 0.18 148 / 0.4), transparent 60%)",
                }}
              />
              <div
                className="relative squircle-lg p-5 sm:p-7 border border-white/10 overflow-hidden"
                style={{ background: "linear-gradient(180deg, oklch(0.22 0 0), oklch(0.12 0 0))" }}
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inset-0 rounded-full bg-leaf opacity-75 animate-ping" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-leaf" />
                    </span>
                    <p className="text-xs text-white/70 font-medium">Ziddy · preview</p>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-2.5 py-1 text-[10px] text-white/60">
                    <Zap className="h-3 w-3 text-gold" /> Coming soon
                  </div>
                </div>

                <div className="space-y-3">
                  <Bubble role="user">How much did I spend on food this month?</Bubble>
                  <Bubble role="ai">
                    You spent <span className="text-gold font-semibold">₦86,400</span> on food this month —{" "}
                    <span className="text-leaf font-semibold">14% less</span> than last month.
                  </Bubble>
                  <Bubble role="user">Show my profit for last 90 days.</Bubble>
                  <Bubble role="ai">
                    Profit: <span className="text-leaf font-semibold">₦2,140,000</span>. Top earner:{" "}
                    <span className="text-gold font-semibold">Online Sales</span>.
                    <div className="mt-3 flex items-end gap-1.5 h-10">
                      {[40, 65, 35, 80, 55, 90, 70].map((h, i) => (
                        <span
                          key={i}
                          className="w-2 rounded-sm bg-gradient-to-t from-gold to-leaf"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </Bubble>

                  <div className="flex justify-start">
                    <div className="rounded-3xl rounded-bl-md bg-white/5 border border-white/10 px-4 py-3 flex items-center gap-1">
                      <Dot delay="0s" />
                      <Dot delay="0.15s" />
                      <Dot delay="0.3s" />
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-3">
                  <Sparkles className="h-4 w-4 text-gold shrink-0" />
                  <input
                    disabled
                    placeholder="Ask Ziddy anything about your money…"
                    className="flex-1 bg-transparent text-sm text-white/80 placeholder:text-white/40 outline-none"
                  />
                  <button
                    disabled
                    aria-label="Send"
                    className="h-9 w-9 rounded-full bg-gradient-to-br from-gold to-leaf text-ink flex items-center justify-center shadow-float opacity-80"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                </div>

                <p className="mt-4 text-center text-[11px] text-white/40">
                  Preview · Rolling out to Zidwell users soon
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Bubble({ role, children }: { role: "user" | "ai"; children: React.ReactNode }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[82%] rounded-3xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-white/10 text-white rounded-br-md border border-white/10"
            : "bg-gold text-ink rounded-bl-md shadow-float"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="h-1.5 w-1.5 rounded-full bg-white/60"
      style={{ animation: "float-y 1.2s ease-in-out infinite", animationDelay: delay }}
    />
  );
}
