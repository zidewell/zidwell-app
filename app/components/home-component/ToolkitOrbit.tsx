// app/components/home-component/ToolkitOrbit.tsx
import {
  BookOpen,
  Calculator,
  FileChartColumn,
  Landmark,
  Store,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const tools = [
  { icon: Store, label: "Online Store", angle: 0, tone: "gold" },
  { icon: Landmark, label: "Business Bank Account", angle: 51.4, tone: "leaf" },
  { icon: BookOpen, label: "Bookkeeping Tool", angle: 102.8, tone: "gold" },
  { icon: Calculator, label: "Tax Manager", angle: 154.2, tone: "leaf" },
  { icon: FileChartColumn, label: "Invoices", angle: 205.6, tone: "gold" },
  { icon: Users, label: "Multi-signatory Account", angle: 257, tone: "leaf" },
  { icon: FileChartColumn, label: "Business Plan", angle: 308.4, tone: "gold" },
];

const styles = `
  .zm-orbit {
    position: relative;
    width: min(78vw, 34rem);
    aspect-ratio: 1;
    margin-inline: auto;
    display: grid;
    place-items: center;
    color: var(--ink);
  }

  /* Outer ring — mix from foreground so it shows on both themes */
  .zm-orbit::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 999px;
    border: 1px solid color-mix(in oklab, var(--ink) 18%, transparent);
    pointer-events: none;
  }

  .zm-orbit-ring {
    position: absolute;
    inset: 10%;
    border-radius: 999px;
    border: 1px solid color-mix(in oklab, var(--gold) 35%, transparent);
    pointer-events: none;
  }

  .zm-orbit-ring-inner {
    position: absolute;
    inset: 23%;
    border-radius: 999px;
    border: 1px solid color-mix(in oklab, var(--gold) 22%, transparent);
    opacity: 0.55;
    pointer-events: none;
  }

  .zm-orbit-rotor {
    position: absolute;
    inset: 0;
    animation: zm-orbit-spin 54s linear infinite;
    transform-origin: center center;
    will-change: transform;
    pointer-events: none;
  }

  @keyframes zm-orbit-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  .zm-orbit-nodes {
    position: absolute;
    inset: 0;
    animation: zm-orbit-spin 54s linear infinite;
    transform-origin: center center;
    will-change: transform;
    pointer-events: none;
  }

  .zm-orbit-node-counter {
    animation: zm-orbit-spin-reverse 54s linear infinite;
    transform-origin: center center;
    will-change: transform;
  }

  @keyframes zm-orbit-spin-reverse {
    from { transform: rotate(0deg); }
    to   { transform: rotate(-360deg); }
  }

  /* Node card — surface + border so it adapts to theme */
  .zm-orbit-node {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 7.25rem;
    margin-left: -3.625rem;
    margin-top: -2.675rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.65rem;
    border-radius: 1.25rem;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--ink);
    box-shadow: var(--shadow-float);
    text-align: center;
    min-height: 5.35rem;
    z-index: 3;
    transform-origin: center center;
    transition: transform 0.25s ease;
    pointer-events: auto;
  }

  .zm-orbit-node:hover {
    transform: scale(1.06);
  }

  .zm-orbit-node span {
    max-width: 6.4rem;
    font-size: 0.6rem;
    font-weight: 600;
    line-height: 1.2;
  }

  .zm-orbit-node-gold svg { color: var(--gold); }
  .zm-orbit-node-leaf svg { color: var(--leaf); }

  /* Core — inverted look that adapts automatically */
  .zm-orbit-core {
    position: relative;
    z-index: 4;
    width: 42%;
    aspect-ratio: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    border-radius: 999px;
    border: 1px solid color-mix(in oklab, var(--gold) 40%, transparent);
    background: var(--background);
    color: var(--ink);
    text-align: center;
    box-shadow:
      0 0 0 12px color-mix(in oklab, var(--gold) 8%, transparent),
      var(--shadow-float);
    padding: 1.5rem;
  }

  .zm-orbit-core p {
    max-width: 9rem;
    font-family: var(--font-display, "Space Grotesk", system-ui, sans-serif);
    font-size: clamp(0.8rem, 2vw, 1.1rem);
    font-weight: 600;
    line-height: 1.15;
  }

  @media (max-width: 520px) {
    .zm-orbit { width: min(94vw, 26rem); }
    .zm-orbit-node {
      width: 5.5rem;
      margin-left: -2.75rem;
      margin-top: -2.075rem;
      min-height: 4.15rem;
      border-radius: 0.9rem;
      padding: 0.4rem;
    }
    .zm-orbit-node span { font-size: 0.48rem; max-width: 4.8rem; }
    .zm-orbit-core { width: 38%; padding: 0.8rem; }
  }

  @media (prefers-reduced-motion: reduce) {
    .zm-orbit-rotor,
    .zm-orbit-nodes,
    .zm-orbit-node-counter {
      animation: none;
    }
  }
`;

export function ToolkitOrbit() {
  const radiusPct = 42;

  return (
    <div className="zm-orbit" aria-label="Zidwell Business Owners Toolkit">
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <div className="zm-orbit-ring" />
      <div className="zm-orbit-ring-inner" />

      {/* Slow-rotating spoke dots */}
      <div className="zm-orbit-rotor" aria-hidden="true">
        {tools.map(({ angle }) => {
          const rad = ((angle - 90) * Math.PI) / 180;
          const x = 50 + Math.cos(rad) * radiusPct;
          const y = 50 + Math.sin(rad) * radiusPct;
          return (
            <span
              key={angle}
              style={{
                position: "absolute",
                top: `${y}%`,
                left: `${x}%`,
                width: 6,
                height: 6,
                marginLeft: -3,
                marginTop: -3,
                borderRadius: 999,
                background: "var(--gold)",
                opacity: 0.55,
                transform: "translateZ(0)",
              }}
            />
          );
        })}
      </div>

      {/* Rotating tool nodes — the whole node travels, counter-rotor keeps
          the card upright. */}
      <div className="zm-orbit-nodes" aria-hidden={false}>
        {tools.map(({ icon: Icon, label, angle, tone }) => {
          const rad = ((angle - 90) * Math.PI) / 180;
          const x = 50 + Math.cos(rad) * radiusPct;
          const y = 50 + Math.sin(rad) * radiusPct;
          return (
            <div
              key={label}
              style={{ position: "absolute", top: `${y}%`, left: `${x}%` }}
            >
              <div className="zm-orbit-node-counter">
                <div
                  className={`zm-orbit-node zm-orbit-node-${tone}`}
                  style={{ top: 0, left: 0 }}
                >
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span>{label}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="zm-orbit-core">
        <Link href="/" className="flex items-center flex-col gap-2 cursor-pointer">
          <Image
            src="/logo.png"
            alt="Zidwell"
            width={32}
            height={26}
            className="md:w-16 object-contain"
          />
          <span className="font-bold tracking-tight uppercase font-display">
            Business Toolkit
          </span>
        </Link>
      </div>
    </div>
  );
}