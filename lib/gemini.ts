import { GoogleGenAI } from "@google/genai";

let cachedClient: GoogleGenAI | null = null;

const getApiKey = () =>
  process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || "";

const getClient = () => {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  if (!cachedClient) {
    cachedClient = new GoogleGenAI({
      apiKey,
      httpOptions: { apiVersion: "v1" },
    });
  }

  return cachedClient;
};

export async function generateVanguardReport(
  stamps: Array<{ venue: string; city: string }>,
) {
  if (!stamps?.length) return "Awaiting deployment data...";

  const ai = getClient();
  if (!ai) return "Deployment stabilized.";

  const venueList = stamps.map((s) => `${s.venue} (${s.city})`).join(", ");
  const prompt = `Deployments: ${venueList}. Write a one-sentence spy report (max 15 words).`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
    });

    return (response.text || "").trim() || "Deployment stabilized.";
  } catch {
    return "Deployment stabilized.";
  }
}
