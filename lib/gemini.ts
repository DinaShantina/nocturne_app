// NEW: uses the recommended SDK and forces v1
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("Missing GEMINI_API_KEY in env");
}

const ai = new GoogleGenAI({
  apiKey,
  httpOptions: { apiVersion: "v1" }, // <- forces stable v1
});

export async function generateVanguardReport(
  stamps: Array<{ venue: string; city: string }>,
) {
  if (!stamps?.length) return "Awaiting deployment data...";

  const venueList = stamps.map((s) => `${s.venue} (${s.city})`).join(", ");
  const prompt = `Deployments: ${venueList}. Write a one-sentence spy report (max 15 words).`;

  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: prompt,
  });

  return (response.text || "").trim() || "Deployment stabilized.";
}
