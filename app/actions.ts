// actions.ts
"use server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export type FormState = {
  success: boolean;
  message: string;
  location?: string;
  city?: string;
  country?: string;
  lat?: number;
  lng?: number;
  timestamp: number;
} | null;

const apiKey = process.env.GOOGLE_GEMINI_API_KEY || "";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const genAI = new GoogleGenerativeAI(apiKey);

export async function submitEvent(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const city = ((formData.get("city") as string) || "").toUpperCase();
  const country = ((formData.get("country") as string) || "").toUpperCase();
  const venue = ((formData.get("venue") as string) || "").toUpperCase();
  const activity = (formData.get("activity") as string) || "";
  const now = Date.now();

  try {
    let lat, lng;
    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city + ", " + country)}&limit=1`,
        {
          headers: { "User-Agent": "Nocturne_App_2026" },
          next: { revalidate: 3600 },
        },
      );
      const geoData = await geoRes.json();
      if (geoData?.[0]) {
        lat = parseFloat(geoData[0].lat);
        lng = parseFloat(geoData[0].lon);
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      console.error("Geocoding suppressed");
    }

    return {
      success: true,
      message: activity,
      location: venue,
      city,
      country,
      lat,
      lng,
      timestamp: now,
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (criticalError) {
    return {
      success: true,
      message: activity,
      location: venue,
      city,
      country,
      timestamp: now,
    };
  }
}
