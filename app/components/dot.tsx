export default function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="h-1.5 w-1.5 rounded-full bg-white/60"
      style={{
        animation: "float-y 1.2s ease-in-out infinite",
        animationDelay: delay,
      }}
    />
  );
}