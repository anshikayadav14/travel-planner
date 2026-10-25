import { NextResponse } from "next/server";
import { askOpenAI } from "@/lib/openai";

export async function POST(request) {
  const { destination, budget, days } = await request.json();

  const prompt = `You are a travel planner. Suggest 10 varied things to do in ${destination} for a ${days}-day trip with a total budget of ₹${budget}.
Do not repeat similar places. Include a mix of famous spots and lesser-known local ones: about 5 famous must-sees and 5 hidden local gems that most tourists miss (local markets, neighbourhood cafés, quiet viewpoints, small temples, local experiences). Only suggest real places that exist.
Mix categories: sights, food, adventure, culture, relaxation, nightlife, shopping.
Return ONLY valid JSON in exactly this shape:
{"cards":[{"name":"","emoji":"","category":"","type":"famous","blurb":"one short sentence","estCost":0}]}
"type" must be either "famous" or "hidden gem". estCost is the approximate cost per person in rupees (0 if free). Use one fitting emoji per card.`;

  try {
    const data = await askOpenAI(prompt);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: "AI request failed" }, { status: 500 });
  }
}