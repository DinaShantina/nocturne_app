/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useMemo } from "react";

interface Stamp {
  venue: string;
  city: string;
  country: string;
}

interface PassportShareCardProps {
  stamps: Stamp[];
}

const PassportShareCard = ({ stamps }: PassportShareCardProps) => {
  const latest = stamps[0];
  const total = stamps.length;

  const passportId = useMemo(
    // eslint-disable-next-line react-hooks/purity
    () => `#NC-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    [],
  );

  return (
    <div
      id="passport-share-card"
      className="w-[360px] h-[640px] bg-black text-white p-10 flex flex-col justify-between border border-white/10 relative overflow-hidden"
      style={{ fontFamily: "'Courier New', Courier, monospace" }}
    >
      {/* Background Decorative Gradient */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/20 rounded-full blur-[120px] -mr-40 -mt-40" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-zinc-500/10 rounded-full blur-[80px] -ml-20 -mb-20" />

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-16">
          <img
            src="/logo.png"
            alt="Nocturne"
            className="w-12 h-12 object-contain"
          />
          <div className="text-right">
            <p className="text-[10px] font-mono text-teal-500 tracking-[0.3em] font-bold">
              VERIFIED VANGUARD
            </p>
            <p className="text-[10px] font-mono text-zinc-500 uppercase">
              ID: {passportId}
            </p>
          </div>
        </div>

        <h2 className="text-5xl font-black italic uppercase tracking-tighter leading-[0.85] mb-4 text-white">
          VANGUARD
          <br />
          COLLECTION
        </h2>
        <div className="h-1.5 w-16 bg-teal-500 mb-12" />

        <div className="space-y-8">
          <div>
            <p className="text-[11px] font-mono text-zinc-500 uppercase mb-2 tracking-[0.2em]">
              Latest Deployment
            </p>
            <p className="text-2xl font-bold uppercase text-white leading-tight">
              {latest?.venue || "NO LOGS FOUND"}
            </p>
            <p className="text-sm text-teal-500/80 uppercase tracking-widest mt-1">
              {latest?.city || "Unknown Location"}
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10 border-t border-white/10 pt-10 flex justify-between items-end">
        <div>
          <p className="text-5xl font-black text-white leading-none">
            {total.toString().padStart(2, "0")}
          </p>
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em] mt-2">
            STAMPS ISSUED
          </p>
        </div>

        <div className="text-right">
          <p className="text-[9px] font-mono text-zinc-600 mb-3 uppercase tracking-tighter">
            NETWORK: NOCTURNE.APP
          </p>
          <div className="bg-white text-black px-3 py-1.5 text-[11px] font-black uppercase tracking-tighter">
            PASSPORT v1.0
          </div>
        </div>
      </div>
    </div>
  );
};

export default PassportShareCard;
