import { NextResponse } from "next/server";
import { generateVanguardReport } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const { venues } = await req.json();

    const stamps = (venues || []).map((venue: string) => ({ venue, city: "" }));
    const report = await generateVanguardReport(stamps);

    return NextResponse.json({ report });
  } catch {
    return NextResponse.json(
      { report: "Deployment stabilized." },
      { status: 500 },
    );
  }
}
