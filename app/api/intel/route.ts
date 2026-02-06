import { NextResponse } from "next/server";
import { generateVanguardReport } from "@/lib/gemini"; // Adjust path to where you saved step 1

export async function POST(req: Request) {
  try {
    const { venues } = await req.json();
    const report = await generateVanguardReport(venues);
    return NextResponse.json({ report });
  } catch (error) {
    return NextResponse.json(
      { report: "Deployment stabilized." },
      { status: 500 },
    );
  }
}
