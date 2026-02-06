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
    <div
      id="passport-share-card"
      className="relative w-90 h-185 bg-black text-zinc-400 p-8 flex flex-col overflow-hidden rounded-[30px] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,1)]"
    >
      {/* 1. CYBER SCAN LINES BACKGROUND */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />

      {/* 2. HEADER - DYNAMIC DATA */}
      <div className="relative z-10 font-mono text-[10px] space-y-1 mb-6 uppercase">
        <div className="flex justify-between text-[#ff00ff] font-bold tracking-widest">
          {/* Dynamically shows the country of your last visit */}
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
        <div className="h-px w-full bg-white/10 mt-4" />
      </div>

      {/* 3. STAMPS LAYER */}
      <div className="absolute inset-0 z-10">
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
              color: ["#00f3ff", "#ff00ff", "#bcff00", "#00ff9f", "#7000ff"][
                i % 5
              ],
              opacity: i < 3 ? 0.9 : 0.45,
            }}
          >
            {/* THE GEOMETRIC SHAPE */}
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {i % 3 === 0 && (
                <rect
                  x="5"
                  y="25"
                  width="90"
                  height="50"
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
                y="42"
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
                y="56"
                fontSize="11"
                textAnchor="middle"
                fill="currentColor"
                fontFamily="monospace"
                fontWeight="black"
              >
                {stamp.city.toUpperCase()}
              </text>
            </svg>

            {/* THE FIX: MOVE THE DATE OUT OF SVG INTO HTML */}
            <div
              className="absolute w-full text-center font-mono font-bold"
              style={{
                top: "68px",
                fontSize: "8px",
                color: "inherit",
                textShadow: "0 0 2px rgba(0,0,0,0.5)", // Helps visibility
              }}
            >
              {(stamp.date || "2026.02.06").replaceAll("-", ".")}
            </div>
          </div>
        ))}
      </div>

      {/* 4. GEMINI INTELLIGENCE REPORT BOX */}
      <div className="mt-auto relative z-10 border-2 border-[#ff00ff] bg-black/80 p-5 mb-8 backdrop-blur-md">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[#ff00ff]">✨</span>
          <p className="text-[10px] font-black text-[#ff00ff] uppercase tracking-tighter">
            Gemini Report / 08.02.2026
          </p>
        </div>
        <p className="text-[12px] leading-tight text-white/90 font-mono italic">
          &quot;{intelligenceReport || "Initiating pattern decryption..."}&quot;
        </p>
      </div>

      {/* 5. FOOTER STATS */}
      <div className="relative z-10 flex justify-between items-end border-t border-white/10 pt-4">
        <div>
          <p className="text-5xl font-black text-white leading-none tracking-tighter">
            {stamps.length}
          </p>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500">
            Logs Issued
          </p>
        </div>
        <div className="text-right">
          <img
            src="/logo.png"
            className="w-8 ml-auto mb-2 opacity-30 grayscale invert"
            alt="logo"
          />
          <p className="text-[8px] font-mono tracking-widest opacity-30">
            NOCTURNE PROTOCOL
          </p>
        </div>
      </div>
    </div>
  );
};

export default PassportShareCard;
