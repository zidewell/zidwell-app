const styles = `
  @keyframes floatY {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-12px); }
  }
  
  @keyframes floatYSlow {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
  }
  
  .animate-float {
    animation: floatY 6s ease-in-out infinite;
  }
  
  .animate-float-slow {
    animation: floatYSlow 9s ease-in-out infinite;
  }
`;

export function FloatingCard({
  className = "",
  title,
  amount,
  tone,
}: {
  className?: string;
  title: string;
  amount: string;
  tone: "leaf" | "gold" | "ink";
}) {
  const dotColor = 
    tone === "leaf" ? "bg-[oklch(0.66_0.18_148)]" : 
    tone === "gold" ? "bg-[oklch(0.84_0.16_88)]" : 
    "bg-[oklch(0.17_0_0)] dark:bg-[oklch(0.98_0_0)]";
  
  const textColor = 
    tone === "leaf" ? "text-[oklch(0.66_0.18_148)]" : 
    tone === "gold" ? "text-[oklch(0.84_0.16_88)]" : 
    "text-[oklch(0.17_0_0)] dark:text-[oklch(0.98_0_0)]";

  return (
    <>
      <style>{styles}</style>
      <div className={`flex items-center gap-3 rounded-[20px] bg-[oklch(1_0_0)] dark:bg-[oklch(0.18_0_0)] border border-[oklch(0.85_0_0)] dark:border-[oklch(1_0_0)_/_12%] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.18)] px-4 py-3 ${className}`}>
        <span className={`h-8 w-8 rounded-full shrink-0 ${dotColor}`} />
        <div className="min-w-0">
          <p className="text-[10px] text-[oklch(0.5_0_0)] dark:text-[oklch(0.7_0_0)] truncate font-['Be_Vietnam_Pro',system-ui,sans-serif]">{title}</p>
          <p className={`text-sm font-semibold font-['Space_Grotesk','Cy_Grotesk_Key',system-ui,sans-serif] whitespace-nowrap ${textColor}`}>{amount}</p>
        </div>
      </div>
    </>
  );
}