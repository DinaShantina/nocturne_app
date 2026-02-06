"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const THEME_STORAGE_KEY = "nocturne-theme";

type Theme = "light" | "dark";

const readSavedTheme = (): Theme | null => {
  if (typeof window === "undefined") return null;
  const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === "dark" || saved === "light") return saved;
  return null;
};

export default function ThemeToggle() {
  // NEW/UPDATED: derive initial state without an effect (avoids cascading render warning)
  const [isDark, setIsDark] = useState<boolean | null>(() => {
    const saved = readSavedTheme();
    if (saved === "dark") return true;
    if (saved === "light") return false;

    // first visit default
    return false;
  });

  // NEW/UPDATED: effect only syncs external systems (DOM + localStorage)
  useEffect(() => {
    if (isDark === null) return;

    const root = window.document.documentElement;

    if (isDark) {
      root.classList.add("dark");
      window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
      return;
    }

    root.classList.remove("dark");
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");
  }, [isDark]);

  // keep SSR-safe behavior (client will render immediately with correct initial value)
  if (isDark === null) return null;

  return (
    <button
      onClick={() => setIsDark((prev) => !prev)}
      className="relative flex h-9 w-18 items-center rounded-full bg-zinc-200 p-1 transition-colors duration-500 dark:bg-zinc-800 border border-black/10 dark:border-white/10"
      aria-label="Toggle theme"
    >
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 700, damping: 30 }}
        className={`z-10 h-7 w-7 rounded-full flex items-center justify-center shadow-lg ${
          isDark ? "bg-teal-400 ml-auto" : "bg-white mr-auto"
        }`}
      >
        {isDark ? (
          <svg
            className="h-4 w-4 text-black"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
          </svg>
        ) : (
          <svg
            className="h-4 w-4 text-amber-500"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="5" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        )}
      </motion.div>

      <div className="absolute inset-0 flex justify-between items-center px-2 pointer-events-none">
        <span
          className={`text-[7px] font-black tracking-tighter ${
            !isDark ? "text-black opacity-40" : "text-white opacity-0"
          }`}
        >
          LIGHT
        </span>
        <span
          className={`text-[7px] font-black tracking-tighter ${
            isDark ? "text-white opacity-40" : "text-black opacity-0"
          }`}
        >
          DARK
        </span>
      </div>
    </button>
  );
}
