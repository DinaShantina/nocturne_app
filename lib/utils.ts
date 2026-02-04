// lib/utils.ts
export const normalizeCountryName = (name: string): string => {
  if (!name) return "";

  // Convert to upper and remove all extra spaces
  const upperName = name.toUpperCase().trim();

  // Aggressive checks
  if (upperName.includes("NETHERLANDS")) return "NETHERLANDS";
  if (upperName.includes("MACEDONIA")) return "MACEDONIA";
  if (upperName.includes("UNITED STATES") || upperName === "USA") return "USA";
  if (upperName.includes("UNITED KINGDOM") || upperName === "UK") return "UK";
  if (upperName.includes("SERBIA")) return "SERBIA";

  return upperName;
};
