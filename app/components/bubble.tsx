export default function Bubble({ role, children }: { role: "user" | "ai"; children: React.ReactNode }) {
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