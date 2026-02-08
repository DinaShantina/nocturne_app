/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { GoogleGenerativeAI } from "@google/generative-ai";

interface Stamp {
  venue: string;
  city: string;
  country: string;
}

const getApiKey = () =>
  process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || "";

/**
 * NEW: counts the amount of primitives in the SVG
 * This lets us reject "too simple" generations and fallback safely.
 */
const countSvgPrimitives = (svg: string) => {
  const circles = (svg.match(/<circle\b/g) || []).length;
  const lines = (svg.match(/<line\b/g) || []).length;
  const paths = (svg.match(/<path\b/g) || []).length;
  return circles + lines + paths;
};

/**
 * NEW: basic quality gate
 * - must contain a valid viewBox
 * - must have enough line primitives to look "badge-like"
 * - must not contain forbidden tags
 */
const isSvgTooSimple = (svg: string) => {
  const clean = svg.trim();
  const hasViewBox = /viewBox="0 0 100 100"/.test(clean);
  const primitives = countSvgPrimitives(clean);
  const hasForbidden = /<rect\b|<image\b|<text\b|<polygon\b|<polyline\b/.test(
    clean,
  );

  // tweak these thresholds if needed
  return !hasViewBox || hasForbidden || primitives < 14;
};

export async function generateVanguardReport(stamps: Stamp[]) {
  const apiKey = getApiKey();

  try {
    if (!apiKey) throw new Error("No API Key");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

    if (!stamps?.length) return "Awaiting deployment data...";

    const venueList = stamps.map((s) => `${s.venue} (${s.city})`).join(", ");
    const prompt = `Deployments: ${venueList}. Write a one-sentence spy report (max 15 words). No poetic talk.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error: any) {
    console.log("System Note: Using local intelligence (API Quota reached)");

    const latest = stamps[0];
    const mockReports = [
      `Sector scan complete. High signal density detected in ${latest?.city || "unknown zone"}.`,
      `Protocol 08 active. Vanguard tracking remains stable across ${stamps.length} nodes.`,
      `Infiltration patterns confirmed in ${latest?.country || "International waters"}. Nocturne active.`,
      `Anomaly detected in deployment sequence. Intelligence suggests caution in ${latest?.city}.`,
      `Vanguard status verified. Encryption sync successful for ${latest?.venue}.`,
    ];

    return mockReports[Math.floor(Math.random() * mockReports.length)];
  }
}

// lib/gemini.ts
export async function generateUniqueArtifact(theme: string, level: number = 1) {
  const apiKey = getApiKey();
  if (!apiKey) return getFallbackSvg(theme, level);

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const artifactPrompt = `Generate a unique high-end geometric SVG seal.
  Theme: ${theme}. Rank: Level ${level}.
  
  ARTISTIC COLOR RULE:
  - Assign a unique vibrant neon hex color (e.g. #22d3ee, #818cf8, #f472b6, #fbbf24) based on the vibe of ${theme}.
  - Use this hex color for the 'stroke' attribute of all elements.
  
  TECHNICAL RULES:
  - NO <rect>, NO background, NO fill.
  - Viewbox "0 0 100 100", stroke-width "0.8".
  - Output raw SVG only.`;

  try {
    const result = await model.generateContent(artifactPrompt);

    // UPDATED: clean + validate before returning
    const text = result.response.text();
    const cleaned = text.replace(/```svg|```/g, "").trim();

    // NEW: quality gate -> if too simple, return procedural fallback instead
    if (!cleaned || isSvgTooSimple(cleaned)) {
      console.warn("AI badge too simple, using fallback", {
        theme,
        level,
        primitives: countSvgPrimitives(cleaned || ""),
      });
      return getFallbackSvg(theme, level);
    }

    return cleaned;
  } catch (error) {
    console.error("AI Badge Error:", error);
    return getFallbackSvg(theme, level);
  }
}

function getFallbackSvg(theme: string = "RECON", level: number = 1) {
  const seed = theme
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const rotation = seed % 360;
  const complexity = (seed % 5) + 3;

  const points = [];
  for (let i = 0; i < complexity; i++) {
    const angle = (i / complexity) * Math.PI * 2;
    const r = 30 + (seed % 15);
    const x = 50 + r * Math.cos(angle);
    const y = 50 + r * Math.sin(angle);
    points.push(`${i === 0 ? "M" : "L"} ${x} ${y}`);
  }
  const pathData = points.join(" ") + " Z";

  return `
    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1.2">
      <circle cx="50" cy="50" r="${20 + level * 5}" stroke-dasharray="2 2" opacity="0.5" />
      <path d="${pathData}" transform="rotate(${rotation} 50 50)" />
      <circle cx="50" cy="50" r="2" fill="currentColor" />
      <path d="M50 10 L50 20 M90 50 L80 50 M50 90 L50 80 M10 50 L20 50" opacity="0.3" />
    </svg>
  `;
}
