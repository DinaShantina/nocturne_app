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
