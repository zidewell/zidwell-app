import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/app/hooks/useTheme"; 

export function ThemeToggle() {
  const { isDark, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg border border-[#e6e6e6] dark:border-[#2e2e2e] bg-[#ffffff] dark:bg-[#161616] hover:bg-[#f5f5f5] dark:hover:bg-[#242424] transition-colors"
      aria-label="Toggle theme"
    >
      {isDark ? <Sun className="w-5 h-5 text-[#6b6b6b] dark:text-[#b3b3b3]" /> : <Moon className="w-5 h-5 text-[#6b6b6b] dark:text-[#b3b3b3]" />}
    </button>
  );
}
