import { Sparkles, ArrowUp, Mic, Waves, Zap } from "lucide-react";
import Bubble from "../bubble";
import Dot from "../dot";

export function AIChat() {
  return (
    <div className="relative">
      {/* Glow halo */}
      <div
        aria-hidden
        className="absolute -inset-6 rounded-[3rem] blur-3xl opacity-60 pointer-events-none"
        style={{
          background:
            "radial-gradient(at 30% 20%, oklch(0.84 0.16 88 / 0.5), transparent 60%), radial-gradient(at 80% 80%, oklch(0.66 0.18 148 / 0.45), transparent 60%)",
        }}
      />

      <div
        className="relative squircle-lg p-5 sm:p-7 border border-white/10 overflow-hidden"
        style={{ background: "linear-gradient(180deg, oklch(0.22 0 0), oklch(0.12 0 0))" }}
      >
        {/* Animated top bar */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inset-0 rounded-full bg-leaf opacity-75 animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-leaf" />
            </span>
            <p className="text-xs text-white/70 font-medium">Zidwell AI · online</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-2.5 py-1 text-[10px] text-white/60">
            <Zap className="h-3 w-3 text-gold" /> GPT-grade finance brain
          </div>
        </div>

        <div className="space-y-3">
          <Bubble role="user">How much did I spend on food this month?</Bubble>
          <Bubble role="ai">
            You spent <span className="text-gold font-semibold">₦ 86,400</span> on food in August — <span className="text-leaf font-semibold">14% less</span> than July. Want a weekly breakdown?
          </Bubble>
          <Bubble role="user">Show my profit for last 90 days</Bubble>
          <Bubble role="ai">
            Profit (Jun–Aug): <span className="text-leaf font-semibold">₦ 2,140,000</span>. Top earner: <span className="text-gold font-semibold">Online Sales</span>.
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

          {/* Typing indicator */}
          <div className="flex justify-start">
            <div className="rounded-3xl rounded-bl-md bg-white/5 border border-white/10 px-4 py-3 flex items-center gap-1">
              <Dot delay="0s" />
              <Dot delay="0.15s" />
              <Dot delay="0.3s" />
            </div>
          </div>
        </div>

        {/* Suggestion chips */}
        <div className="mt-5 flex flex-wrap gap-2">
          {[
            "What's my biggest expense?",
            "Compare June vs August",
            "Forecast next month",
          ].map((s) => (
            <button
              key={s}
              className="text-[11px] text-white/80 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Composer */}
        <div className="mt-5 flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-3">
          <Sparkles className="h-4 w-4 text-gold shrink-0" />
          <input
            disabled
            placeholder="Ask anything about your money…"
            className="flex-1 bg-transparent text-sm text-white/80 placeholder:text-white/40 outline-none"
          />
          <button className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 flex items-center justify-center transition">
            <Mic className="h-4 w-4" />
          </button>
          <button className="h-9 w-9 rounded-full bg-gradient-to-br from-gold to-leaf text-ink flex items-center justify-center shadow-float">
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-white/40">
          <Waves className="h-3 w-3" />
          Preview · Coming soon for all Zidwell users
        </div>
      </div>
    </div>
  );
}




