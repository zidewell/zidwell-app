// app/components/ToasterProvider.tsx
"use client";

import { Toaster } from "sonner";
import { useTheme } from "@/app/components/ThemeProvider";

export function ToasterProvider() {
  const { theme } = useTheme();

  // Resolve "system" → actual current theme
  const resolvedTheme =
    theme === "system"
      ? typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : (theme as "light" | "dark") || "light";

  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      duration={5000}
      theme={resolvedTheme}
      toastOptions={{
        style: {
          fontSize: "14px",
        },
      }}
    />
  );
}
