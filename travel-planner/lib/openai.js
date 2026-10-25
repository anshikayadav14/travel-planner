export async function askOpenAI(prompt) {
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
      return JSON.parse(data.choices[0].message.content);
    }

    lastError = await res.text();
    console.error(res.status, lastError);

    // retry only when busy / rate limited
    if (res.status !== 429 && res.status !== 503) break;
    await new Promise((r) => setTimeout(r, 1500));
  }

  throw new Error(lastError || "AI request failed");
}