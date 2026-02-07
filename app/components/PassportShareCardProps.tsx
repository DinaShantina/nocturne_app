/* eslint-disable react-hooks/purity */
/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useMemo } from "react";

interface Stamp {
  venue: string;
  city: string;
  country: string;
  aiSvgCode?: string;
  type?: "circle" | "rect" | "octo";
  color?: string;
  date?: string;
}

const PassportShareCard = ({
  stamps,
  intelligenceReport,
}: {
  stamps: Stamp[];
  intelligenceReport?: string;
}) => {
  const latest = stamps[0];
  const passportId = useMemo(
    () => `#NC-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    [],
  );

  return (
    <div className="relative w-[420px] h-[820px] bg-white text-zinc-700 dark:bg-black dark:text-zinc-400 p-8 flex flex-col overflow-hidden rounded-[30px] border border-black/10 dark:border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.1)] dark:shadow-[0_0_50px_rgba(0,0,0,1)]">
      {/* 1. CYBER SCAN LINES BACKGROUND (Dark Mode Only) */}
      <div className="absolute inset-0 opacity-10 pointer-events-none hidden dark:block bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-size-[100%_2px,3px_100%]" />

      {/* 2. HEADER - DYNAMIC DATA */}
      <div className="relative z-10 font-mono text-[10px] space-y-1 mb-6 uppercase">
        <div className="flex justify-between text-[#ff00ff] font-bold tracking-widest">
          <p>ZONE: {latest?.country || "SCANNING..."}</p>
          <p className="opacity-50">{passportId}</p>
        </div>
        <p className="opacity-70">
          LAST DEPLOYMENT: {latest?.city || "UNKNOWN"}
        </p>
        <p>
          CLASS: {stamps.length > 10 ? "ELITE OPERATIVE" : "RECONNAISSANCE"}
        </p>
        <p className="text-[#ff00ff]">
          SUBJECT: {stamps.length > 30 ? "VANGUARD PRIME" : "RECON UNIT"}
          <span className="ml-2 opacity-50">ID-{passportId.split("-")[1]}</span>
        </p>
        <div className="h-px w-full bg-black/5 dark:bg-white/10 mt-4" />
      </div>

      {/* 3. STAMPS LAYER */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {stamps.slice(0, 12).map((stamp, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              width: "90px",
              height: "90px",
              left: `${(i % 3) * 30 + (i % 2 === 0 ? 5 : 10)}%`,
              top: `${120 + Math.floor(i / 3) * 110}px`,
              transform: `rotate(${((i * 13) % 60) - 30}deg)`,
              // Color logic: Bright colors for dark mode, darker variants for light mode
              color: ["#00f3ff", "#ff00ff", "#bcff00", "#00ff9f", "#7000ff"][
                i % 5
              ],
              opacity: i < 3 ? 0.9 : 0.45,
            }}
          >
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)] dark:drop-shadow-none"
            >
              {i % 3 === 0 && (
                <rect
                  x="5"
                  y="25"
                  width="90"
                  height="55"
                  rx="4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                />
              )}
              {i % 3 === 1 && (
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeDasharray="4 2"
                />
              )}
              {i % 3 === 2 && (
                <path
                  d="M30 5 L70 5 L95 30 L95 70 L70 95 L30 95 L5 70 L5 30 Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                />
              )}

              <text
                x="50"
                y="40"
                fontSize="7"
                textAnchor="middle"
                fill="currentColor"
                fontFamily="monospace"
                fontWeight="bold"
              >
                {stamp.venue.substring(0, 10).toUpperCase()}
              </text>
              <text
                x="50"
                y="54"
                fontSize="11"
                textAnchor="middle"
                fill="currentColor"
                fontFamily="monospace"
                fontWeight="black"
              >
                {stamp.city.toUpperCase()}
              </text>
              <text
                x="50"
                y="68"
                fontSize="7"
                textAnchor="middle"
                fill="currentColor"
                fontFamily="monospace"
                fontWeight="bold"
                opacity="0.8"
              >
                {(stamp.date || "2026.02.06").replaceAll("-", ".")}
              </text>
            </svg>
          </div>
        ))}
      </div>

      {/* 4. GEMINI INTELLIGENCE REPORT BOX */}
      <div className="mt-auto relative z-20 border-2 border-[#ff00ff] bg-white/90 dark:bg-black/80 p-5 mb-8 backdrop-blur-md shadow-lg dark:shadow-none">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[#ff00ff]">✨</span>
          <p className="text-[10px] font-black text-[#ff00ff] uppercase tracking-tighter">
            Gemini Report / 08.02.2026
          </p>
        </div>
        <p className="text-[12px] leading-tight text-zinc-800 dark:text-white font-mono italic">
          &quot;{intelligenceReport || "Initiating pattern decryption..."}&quot;
        </p>
      </div>

      {/* 5. FOOTER STATS */}
      <div className="relative z-10 flex justify-between items-end border-t border-black/10 dark:border-white/10 pt-4">
        <div>
          <p className="text-5xl font-black text-zinc-900 dark:text-white leading-none tracking-tighter">
            {stamps.length}
          </p>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-500">
            Logs Issued
          </p>
        </div>
        <div className="text-right">
          {/* Logo toggles automatically based on dark mode class */}
          <div className="ml-auto mb-2 w-8 h-8 relative opacity-40">
            <img src="/logo.png" className="w-8 dark:invert" alt="logo" />
          </div>

          <p className="text-[8px] font-mono tracking-widest opacity-40 text-zinc-900 dark:text-white">
            NOCTURNE PROTOCOL
          </p>
        </div>
      </div>
    </div>
  );
};

export default PassportShareCard;
