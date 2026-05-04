// components/GridBackground.tsx
const GridBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg className="absolute inset-0 w-full h-full opacity-30 dark:opacity-20" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="var(--border-color)" stopOpacity="0" /><stop offset="50%" stopColor="var(--border-color)" stopOpacity="0.3" /><stop offset="100%" stopColor="var(--border-color)" stopOpacity="0" /></linearGradient>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="var(--color-accent-yellow)" stopOpacity="0" /><stop offset="50%" stopColor="var(--color-accent-yellow)" stopOpacity="0.5" /><stop offset="100%" stopColor="var(--color-accent-yellow)" stopOpacity="0" /></linearGradient>
        </defs>
        {[...Array(12)].map((_, i) => (<path key={`h-${i}`} d={`M0 ${60 + i * 60} Q300 ${30 + i * 60} 600 ${60 + i * 60} T1200 ${60 + i * 60}`} fill="none" stroke={i % 3 === 0 ? "url(#goldGradient)" : "url(#lineGradient)"} strokeWidth={i % 3 === 0 ? "1.5" : "1"} />))}
        {[...Array(16)].map((_, i) => (<path key={`v-${i}`} d={`M${75 + i * 75} 0 Q${50 + i * 75} 400 ${75 + i * 75} 800`} fill="none" stroke={i % 4 === 0 ? "url(#goldGradient)" : "url(#lineGradient)"} strokeWidth={i % 4 === 0 ? "1.5" : "1"} />))}
      </svg>
      <div className="absolute inset-0 bg-linear-to-b from-[var(--color-accent-yellow)]/5 via-transparent to-transparent" />
    </div>
  );
};

export default GridBackground;