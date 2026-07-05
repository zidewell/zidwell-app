export default function Donut() {
  const segs = [
    { v: 32, c: "var(--gold)" },
    { v: 24, c: "var(--leaf)" },
    { v: 22, c: "var(--ink)" },
    { v: 22, c: "#cbd5e1" },
  ];
  const r = 42;
  const C = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg viewBox="0 0 120 120" className="h-36 w-36">
      <circle cx="60" cy="60" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="14" />
      {segs.map((s, i) => {
        const len = (s.v / 100) * C;
        const dasharray = `${len} ${C - len}`;
        const el = (
          <circle
            key={i}
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke={s.c}
            strokeWidth="14"
            strokeDasharray={dasharray}
            strokeDashoffset={-offset}
            transform="rotate(-90 60 60)"
            strokeLinecap="butt"
          />
        );
        offset += len;
        return el;
      })}
      <text x="60" y="58" textAnchor="middle" className="fill-foreground" style={{ fontSize: 11, fontWeight: 600 }}>
        ₦ 3.4M
      </text>
      <text x="60" y="72" textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 8 }}>
        total spent
      </text>
    </svg>
  );
}