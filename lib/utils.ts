// lib/utils.ts
import { COUNTRY_MAPPINGS } from "./constants";
import { toJpeg } from "html-to-image";
import { Share } from "@capacitor/share";
import { Filesystem, Directory } from "@capacitor/filesystem";

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
  const node = document.getElementById("passport-share-card");
  if (!node) return;

  try {
    // 1. Generate the Image
    const dataUrl = await toJpeg(node, {
      quality: 0.95,
      backgroundColor: "#000000",
      cacheBust: true, // Prevents old images from sticking around
    });

    // 2. Convert DataURL to a physical file in the phone's temporary storage
    const fileName = `nocturne-passport-${Date.now()}.jpg`;
    const base64Data = dataUrl.split(",")[1]; // Remove the "data:image/jpeg;base64," part

    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Cache,
    });

    // 3. Prepare the summary text
    const shareText =
      `🌐 NOCTURNE PASSPORT EXPORT\n` +
      `Rank: VANGUARD\n` +
      `Total Logs: ${stamps.length}\n` +
      `Latest: ${stamps[0]?.venue} | ${stamps[0]?.city}`;
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    `--------------------------\n` +
      `Join the network: nocturne.app\n` +
      `#NocturneProtocol #Vanguard`;

    // 4. 🔥 Open the Native Android Share Drawer
    await Share.share({
      title: "My Nocturne Passport",
      text: shareText, // Now this will include the "Join the network" line!
      url: savedFile.uri,
      dialogTitle: "Export Passport Card",
    });
  } catch (err) {
    console.error("Export failed:", err);
    alert("Could not generate export card.");
  }
};
