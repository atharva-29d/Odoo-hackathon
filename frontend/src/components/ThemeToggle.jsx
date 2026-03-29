import { Moon, SunMedium } from "lucide-react";

import { useTheme } from "../hooks/useTheme";

function ThemeToggle({ compact = false }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 ${
        compact ? "px-3 py-2" : ""
      }`}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
    >
      {isDark ? <SunMedium size={16} /> : <Moon size={16} />}
      <span>{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}

export default ThemeToggle;
