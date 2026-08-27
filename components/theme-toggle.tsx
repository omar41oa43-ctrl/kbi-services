"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn("w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40", className)}>
        <Sun className="w-4 h-4" />
      </div>
    );
  }

  const isDark = theme === "dark" || resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 cursor-pointer group shadow-sm",
        "bg-white/10 hover:bg-white/20 border border-white/15 text-white/80 hover:text-white",
        "dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:text-white/80",
        className
      )}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 group-hover:scale-110 transition-transform duration-300" />
      ) : (
        <Moon className="w-4 h-4 text-cyan-300 group-hover:-rotate-12 group-hover:scale-110 transition-transform duration-300" />
      )}
    </button>
  );
}
