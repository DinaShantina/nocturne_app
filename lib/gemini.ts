import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateVanguardReport(
  // Only ask for what Gemini actually needs to avoid serialization errors
  stamps: { venue: string; city: string }[],
) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // Now venueList only uses the simple strings
  const venueList = stamps.map((s) => `${s.venue} (${s.city})`).join(", ");

  const prompt = `Analyze these deployments: ${venueList}. Write a one-sentence "Intelligence Report" (max 20 words). Tone: Mysterious, spy-like. Output: Just the sentence.`;

  try {
    const result = await model.generateContent(prompt);
    return (await result.response).text().trim();
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Operational patterns suggest high-tier resonance. Status: ELITE.";
  }
}
