/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";

interface ArtifactBadgeProps {
  svg: string;
  title: string;
  date: any;
  onClick?: () => void;
}

export const ArtifactBadge = ({ svg, title, onClick }: ArtifactBadgeProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Clean the SVG for that "Artistical" look
  const processedSvg = svg
    .replace(/<rect.*?\/?>/g, "")
    .replace(/fill=".*?"/g, 'fill="none"')
    .replace(/stroke=".*?"/g, 'stroke="currentColor"')
    .replace(/stroke-width=".*?"/g, 'stroke-width="1.2"');

  const handleBadgeClick = () => {
    setIsOpen(true);
    if (onClick) onClick();
  };

  return (
    <>
      {/* THE SMALL ICON (In Grid) */}
      <div
        onClick={handleBadgeClick}
        className="cursor-pointer group relative flex items-center justify-center p-3 transition-all duration-500 hover:scale-125"
      >
        <div className="absolute inset-0 bg-cyan-500/5 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        <div
          className="w-10 h-10 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]"
          dangerouslySetInnerHTML={{ __html: processedSvg }}
        />
      </div>

      {/* THE POP-UP (Only shows when isOpen is true) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-999 flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in duration-300"
          onClick={() => setIsOpen(false)}
        >
          {/* THE SVG - Large and Glowing */}
          <div
            className="w-64 h-64 text-cyan-400 drop-shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-transform animate-in zoom-in duration-500"
            dangerouslySetInnerHTML={{ __html: processedSvg }}
          />

          {/* THE TEXT - Minimalist Title */}
          <div className="mt-12 text-center animate-in slide-in-from-bottom-4 duration-700">
            <h3 className="text-2xl font-black tracking-[0.5em] text-white uppercase italic">
              {title}
            </h3>
            <p className="text-[10px] font-mono text-zinc-500 mt-4 tracking-[0.3em]">
              AUTHENTICATED_FRAGMENT
            </p>
          </div>

          {/* Close hint */}
          <div className="absolute bottom-10 text-zinc-600 font-mono text-[9px] tracking-widest uppercase">
            Click anywhere to close
          </div>
        </div>
      )}
    </>
  );
};
