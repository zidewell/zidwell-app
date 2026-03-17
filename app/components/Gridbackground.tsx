const GridBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Curved grid lines */}
      <svg
        className="absolute inset-0 w-full h-full opacity-30 dark:opacity-20"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#111827" stopOpacity="0" />
            <stop offset="50%" stopColor="#111827" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#111827" stopOpacity="0" />
          </linearGradient>
          <linearGradient
            id="lineGradientDark"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#f9fafb" stopOpacity="0" />
            <stop offset="50%" stopColor="#f9fafb" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#f9fafb" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0" />
            <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Horizontal curved lines */}
        {[...Array(12)].map((_, i) => (
          <path
            key={`h-${i}`}
            d={`M0 ${60 + i * 60} Q300 ${30 + i * 60} 600 ${
              60 + i * 60
            } T1200 ${60 + i * 60}`}
            fill="none"
            stroke={i % 3 === 0 ? "url(#goldGradient)" : "url(#lineGradient)"}
            strokeWidth={i % 3 === 0 ? "1.5" : "1"}
            className="dark:hidden"
          />
        ))}
        {[...Array(12)].map((_, i) => (
          <path
            key={`h-dark-${i}`}
            d={`M0 ${60 + i * 60} Q300 ${30 + i * 60} 600 ${
              60 + i * 60
            } T1200 ${60 + i * 60}`}
            fill="none"
            stroke={
              i % 3 === 0 ? "url(#goldGradient)" : "url(#lineGradientDark)"
            }
            strokeWidth={i % 3 === 0 ? "1.5" : "1"}
            className="hidden dark:block"
          />
        ))}

        {/* Vertical curved lines */}
        {[...Array(16)].map((_, i) => (
          <path
            key={`v-${i}`}
            d={`M${75 + i * 75} 0 Q${50 + i * 75} 400 ${75 + i * 75} 800`}
            fill="none"
            stroke={i % 4 === 0 ? "url(#goldGradient)" : "url(#lineGradient)"}
            strokeWidth={i % 4 === 0 ? "1.5" : "1"}
            className="dark:hidden"
          />
        ))}
        {[...Array(16)].map((_, i) => (
          <path
            key={`v-dark-${i}`}
            d={`M${75 + i * 75} 0 Q${50 + i * 75} 400 ${75 + i * 75} 800`}
            fill="none"
            stroke={
              i % 4 === 0 ? "url(#goldGradient)" : "url(#lineGradientDark)"
            }
            strokeWidth={i % 4 === 0 ? "1.5" : "1"}
            className="hidden dark:block"
          />
        ))}
      </svg>

      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#2b825b]/5 via-transparent to-transparent" />
    </div>
  );
};

export default GridBackground;
