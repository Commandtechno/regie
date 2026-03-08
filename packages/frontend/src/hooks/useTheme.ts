import { useState, useEffect, useCallback } from "react";

type Theme = "light" | "dark";

export function useTheme(): { theme: Theme; toggle: () => void } {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem("theme");
      const parsed = stored ? (JSON.parse(stored) as Theme | null) : null;
      if (parsed === "light" || parsed === "dark") {
        return parsed;
      }
      // Check system preference
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
      }
      return "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("theme", JSON.stringify(theme));
    } catch {
      /* quota exceeded */
    }

    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme(prev => (prev === "dark" ? "light" : "dark"));
  }, []);

  return { theme, toggle };
}
