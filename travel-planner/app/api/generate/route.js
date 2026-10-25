import { NextResponse } from "next/server";
import { askOpenAI } from "@/lib/openai";

export async function POST(request) {
  const { destination, budget, days, liked = [] } = await request.json();

  const likedLine = liked.length
    ? `The traveller swiped right on these: ${liked.join(", ")}. Build the itinerary mainly around them, spread sensibly across the days. You may add essentials like meals and transport, but do not add other major attractions. The "places" list must be these liked places.`
    : "Use 5 places.";

  const prompt = `You are a travel planner. Plan a ${days}-day trip to ${destination} with a total budget of ₹${budget} (Indian rupees).
${likedLine}
Return ONLY valid JSON in exactly this shape:
{
  "summary": "2 sentence overview",
  "places": [{"name": "", "description": ""}],
  "restaurants": [{"name": "", "dish": "", "priceRange": "", "lat": 0, "lng": 0}],
  "stays": [{"tier": "Budget", "name": "", "pricePerNight": 0}, {"tier": "Mid", "name": "", "pricePerNight": 0}, {"tier": "Luxury", "name": "", "pricePerNight": 0}],
  "itinerary": [{"day": 1, "title": "", "morning": "", "afternoon": "", "evening": ""}],
  "budgetBreakdown": {"stay": 0, "food": 0, "travel": 0, "activities": 0},
  "stops": [{"day": 1, "name": "", "lat": 0, "lng": 0}]
}
Use 4 restaurants. All prices are estimates in rupees. Keep the plan within the budget.
"stops" must list every place visited, in visiting order, for each day (2 to 5 per day), with latitude and longitude as decimal degrees, as accurate as you can. Never leave lat or lng as 0.
Each restaurant must also have latitude and longitude as decimal degrees, as accurate as you can, and should be near the places in the itinerary.`;

  try {
    const data = await askOpenAI(prompt);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: "AI request failed" }, { status: 500 });
  }
}