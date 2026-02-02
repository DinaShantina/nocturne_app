"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ThemeToggle() {
  // Set default state to true (Dark Mode)
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="relative flex h-9 w-18 items-center rounded-full bg-zinc-800 p-1 transition-colors duration-500 dark:bg-zinc-800 border border-white/10"
    >
      {/* Moving Slider */}
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 700, damping: 30 }}
        className={`z-10 h-7 w-7 rounded-full flex items-center justify-center shadow-lg ${
          isDark ? "bg-teal-400 ml-auto" : "bg-white mr-auto"
        }`}
      >
        {isDark ? (
           <svg className="h-4 w-4 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
        ) : (
           <svg className="h-4 w-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
        )}
      </motion.div>
      
      <div className="absolute inset-0 flex justify-between items-center px-2 pointer-events-none">
         <span className={`text-[7px] font-black tracking-tighter ${!isDark ? 'text-black opacity-40' : 'text-white opacity-0'}`}>LIGHT</span>
         <span className={`text-[7px] font-black tracking-tighter ${isDark ? 'text-white opacity-40' : 'text-black opacity-0'}`}>DARK</span>
      </div>
    </button>
  );
}