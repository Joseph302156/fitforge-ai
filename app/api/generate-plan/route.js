import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request) {
  try {
    const { goal, level, userPrompt, currentDay, pastDays } = await request.json();

    const pastDaysNote = pastDays && pastDays.length > 0
      ? `CRITICAL: The user is building this plan on ${currentDay}. The days ${pastDays.join(", ")} have already passed this week. You MUST set these days to type "rest" — do not schedule any workout on them under any circumstances.`
      : `The user is starting their plan on ${currentDay || "Monday"}.`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: `You are an expert personal trainer. Generate a personalized 7-day workout plan.

${pastDaysNote}

Respond with ONLY valid JSON, no markdown, no extra text:
{
  "days": [
    { "day": "Monday", "type": "rest", "name": "Rest day" },
    { "day": "Tuesday", "type": "workout", "name": "Upper body strength", "duration": "40 min", "exercises": ["Push-ups 3x15"] }
  ],
  "tip": "Short tip"
}

Rules:
- Return exactly 7 days Monday through Sunday
- Any day in [${(pastDays || []).join(", ")}] MUST be type "rest" — never "workout"
- Respect all user restrictions
- Match difficulty to fitness level`,
      messages: [{
        role: "user",
        content: `Goal: ${goal}
Fitness level: ${level}
Today is: ${currentDay}
Days already passed this week (must be rest): ${pastDays && pastDays.length > 0 ? pastDays.join(", ") : "none"}
My situation: ${userPrompt || "No additional restrictions."}

Generate my plan. Remember: ${pastDays && pastDays.length > 0 ? pastDays.join(", ") : "no days"} must be rest days.`,
      }],
    });

    const raw = message.content[0].text;
    const clean = raw.replace(/```json|```/g, "").trim();
    const plan = JSON.parse(clean);

    // Safety net: force past days to rest on the server side
    if (pastDays && pastDays.length > 0) {
      plan.days = plan.days.map((d) =>
        pastDays.includes(d.day)
          ? { day: d.day, type: "rest", name: "Rest day" }
          : d
      );
    }

    return Response.json(plan);
  } catch (error) {
    console.error("Error:", error);
    return Response.json(
      { error: "Failed to generate plan. Please try again." },
      { status: 500 }
    );
  }
}