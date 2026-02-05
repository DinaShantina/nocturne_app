// lib/utils.ts
import { COUNTRY_MAPPINGS } from "./constants";

export const normalizeCountryName = (name: string): string => {
  if (!name) return "";
  const upperName = name.toUpperCase().trim();

  // 1. Check for direct match (e.g., "USA" -> "USA")
  if (COUNTRY_MAPPINGS[upperName]) {
    return COUNTRY_MAPPINGS[upperName];
  }

  // 2. Check for partial match (e.g., "The United States" contains "UNITED STATES")
  // Sort keys by length descending to match longer phrases first (e.g., "United Kingdom" before "UK")
  const sortedKeys = Object.keys(COUNTRY_MAPPINGS).sort(
    (a, b) => b.length - a.length,
  );

  for (const key of sortedKeys) {
    if (upperName.includes(key)) {
      return COUNTRY_MAPPINGS[key];
    }
  }

  return upperName;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getValidCoordinates = (stamp: any): [number, number] => {
  // If GPS gave us something real (not exactly 0)
  if (stamp.lat !== 0 && stamp.lng !== 0 && stamp.lat && stamp.lng) {
    return [Number(stamp.lng), Number(stamp.lat)];
  }

  // Fallback Dictionary
  const CITY_COORDS: Record<string, [number, number]> = {
    AMSTERDAM: [4.9041, 52.3676], // [lng, lat]
    BELGRADE: [20.4489, 44.7866],
    SKOPJE: [21.4254, 41.9981],
    // Add more as needed
  };

  const fallback = CITY_COORDS[stamp.city?.toUpperCase().trim()];
  return fallback || [0, 0];
};

export const getRank = (count: number) => {
  if (count >= 50) return { name: "GHOST", color: "#ffffff", level: "05" };
  if (count >= 30) return { name: "OPERATIVE", color: "#ff4d4d", level: "04" };
  if (count >= 15) return { name: "VANGUARD", color: "#bc13fe", level: "03" };
  if (count >= 5) return { name: "RESIDENT", color: "#00f2ff", level: "02" };
  return { name: "INITIATE", color: "#71717a", level: "01" };
};

export const getRankData = (count: number) => {
  if (count >= 50)
    return {
      title: "Ghost",
      level: "V",
      color: "text-white shadow-[0_0_10px_#fff]",
    };
  if (count >= 30)
    return { title: "Operative", level: "IV", color: "text-red-500" };
  if (count >= 15)
    return { title: "Vanguard", level: "III", color: "text-purple-500" };
  if (count >= 5)
    return { title: "Resident", level: "II", color: "text-teal-500" };
  return { title: "Initiate", level: "I", color: "text-zinc-500" };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const handleSharePassport = async (stamps: any[]) => {
  const totalStamps = stamps.length;
  const uniqueCountries = new Set(stamps.map((s) => s.country)).size;

  // Create a cool text summary
  const shareText =
    `🌐 NOCTURNE PASSPORT EXPORT\n` +
    `--------------------------\n` +
    `Rank: VANGUARD\n` +
    `Total Logs: ${totalStamps}\n` +
    `Countries Explored: ${uniqueCountries}\n\n` +
    `Latest Entry: ${stamps[0]?.venue} | ${stamps[0]?.city}, ${stamps[0]?.country}\n` +
    `--------------------------\n` +
    `Sent from Nocturne App`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: "My Nocturne Passport",
        text: shareText,
        url: window.location.href,
      });
    } catch (err) {
      console.log("Share cancelled or failed", err);
    }
  } else {
    // Fallback: Copy to clipboard
    await navigator.clipboard.writeText(shareText);
    alert("Passport summary copied to clipboard!");
  }
};
