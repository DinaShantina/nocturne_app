import { NextResponse } from "next/server";
console.log(
  "gemini env",
  !!process.env.GEMINI_API_KEY,
  !!process.env.GOOGLE_GEMINI_API_KEY,
);

export async function POST(req: Request) {
  try {
    const { venues } = await req.json();

    const stamps = (venues || []).map((venue: string) => ({ venue, city: "" }));

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Build-safe fallback (and safe runtime behavior if env is missing)
      return NextResponse.json({ report: "Deployment stabilized." });
    }

    // IMPORTANT: import only when needed, after env check
    const { generateVanguardReport } = await import("@/lib/gemini");

    const report = await generateVanguardReport(stamps);

    return NextResponse.json({ report });
  } catch {
    return NextResponse.json(
      { report: "Deployment stabilized." },
      { status: 500 },
    );
  }
}
