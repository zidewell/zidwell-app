"use client";

interface AmbientBackgroundProps {
  tone: "gold" | "green";
}

const AmbientBackground = ({ tone }: AmbientBackgroundProps) => {
  const isGold = tone === "gold";
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0 transition-colors duration-700"
        style={{
          background: isGold
            ? "linear-gradient(160deg, var(--bg-primary) 0%, hsl(43 60% 96% / 0.3) 45%, var(--bg-primary) 100%)"
            : "linear-gradient(160deg, var(--bg-primary) 0%, hsl(148 45% 95% / 0.3) 45%, var(--bg-primary) 100%)",
        }}
      />
      <div
        className="absolute -top-40 -left-32 h-[36rem] w-[36rem] rounded-full blur-3xl opacity-60 animate-float"
        style={{ background: isGold ? "hsl(var(--gold) / 0.28)" : "hsl(var(--brand-green) / 0.22)" }}
      />
      <div
        className="absolute top-1/3 -right-40 h-[32rem] w-[32rem] rounded-full blur-3xl opacity-50 animate-float"
        style={{ background: "hsl(var(--brand-blue) / 0.2)", animationDelay: "-6s" }}
      />
      <div
        className="absolute -bottom-48 left-1/3 h-[34rem] w-[34rem] rounded-full blur-3xl opacity-40 animate-float"
        style={{ background: "hsl(var(--brand-purple) / 0.18)", animationDelay: "-12s" }}
      />
    </div>
  );
};

export default AmbientBackground;