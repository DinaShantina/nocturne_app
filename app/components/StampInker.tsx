/* eslint-disable react/no-danger */
import React from "react";

interface StampInkerProps {
  svgCode?: string;
  city: string;
  className?: string;
  style?: React.CSSProperties;
}

const StampInker = ({ svgCode, city, className, style }: StampInkerProps) => {
  // Fallback SVG if Gemini hasn't generated one yet
  const defaultSvg = `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3 2" />
      <text x="50" y="55" font-family="monospace" font-size="8" text-anchor="middle" fill="currentColor">
        ${city.toUpperCase()}
      </text>
    </svg>
  `;

  return (
    <div
      className={`mix-blend-multiply opacity-80 ${className}`}
      style={{
        filter: "contrast(1.2) brightness(0.9) blur(0.2px)", // Subtle ink bleed effect
        ...style,
      }}
      dangerouslySetInnerHTML={{ __html: svgCode || defaultSvg }}
    />
  );
};

export default StampInker;
