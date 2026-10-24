import { NextResponse } from "next/server";

export async function POST(request) {
  const { destination, budget, days } = await request.json();

  const prompt = `You are a travel planner. Plan a ${days}-day trip to ${destination} with a total budget of ₹${budget} (Indian rupees).
Return ONLY valid JSON in exactly this shape:
{
  "summary": "2 sentence overview",
  "places": [{"name": "", "description": ""}],
  "restaurants": [{"name": "", "dish": "", "priceRange": ""}],
  "stays": [{"tier": "Budget", "name": "", "pricePerNight": 0}, {"tier": "Mid", "name": "", "pricePerNight": 0}, {"tier": "Luxury", "name": "", "pricePerNight": 0}],
  "itinerary": [{"day": 1, "title": "", "morning": "", "afternoon": "", "evening": ""}],
  "budgetBreakdown": {"stay": 0, "food": 0, "travel": 0, "activities": 0}
}
Use 5 places and 4 restaurants. All prices are estimates in rupees. Keep the plan within the budget.`;

  let lastError = "";

  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(JSON.parse(data.choices[0].message.content));
    }

    lastError = await res.text();
    console.error(res.status, lastError);

    // retry only if busy / rate limited
    if (res.status !== 429 && res.status !== 503) break;
    await new Promise((r) => setTimeout(r, 1500));
  }

  return NextResponse.json(
    { error: "AI request failed", details: lastError },
    { status: 500 }
  );
}