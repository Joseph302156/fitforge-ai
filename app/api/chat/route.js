import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request) {
  try {
    const { goal, level, planSummary, currentDay, pastDays, userPrompt, messages } = await request.json();

    const daysOfWeek = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
    const currentDayIndex = daysOfWeek.indexOf(currentDay);
    const futureDays = currentDayIndex >= 0 ? daysOfWeek.slice(currentDayIndex) : daysOfWeek;
    const lockedDays = pastDays && pastDays.length > 0 ? pastDays : [];

    const system = `You are a friendly, expert personal trainer AI assistant. The user has an existing 7-day workout plan and is chatting with you to refine or ask questions about it.

Current plan context:
- Goal: ${goal}
- Fitness level: ${level}
- Today is: ${currentDay || "Monday"}
- User's original restrictions: ${userPrompt || "none"}
- Current plan:
${planSummary}

CRITICAL SCHEDULING RULES — follow these without exception:
1. Today is ${currentDay || "Monday"}. You may only schedule workouts on: ${futureDays.join(", ")}.
2. Locked past days (${lockedDays.length > 0 ? lockedDays.join(", ") : "none"}) MUST stay as type "rest" in any updated plan — never change them to workouts, no matter what the user asks.
3. The plan must always contain exactly 7 days in this order: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday.
4. Always remember the user's original restrictions: "${userPrompt || "none"}". Honor these in every update — if they said no Sunday workouts, no Sunday workouts. Ever.
5. If the user requests something that would require modifying a past day, politely explain you can only update today and future days.

You have two modes:
1. ANSWER: If the user asks a general fitness question or wants advice, reply conversationally in 1-3 sentences. Do not update the plan.
2. UPDATE: If the user asks to change, adjust, modify, swap, add, remove, or rebuild any part of the plan, generate a full updated plan respecting ALL rules above.

When updating, respond with ONLY this JSON (no markdown, no extra text):
{
  "message": "Short friendly message explaining what changed (1-2 sentences)",
  "updatedPlan": {
    "days": [
      { "day": "Monday", "type": "rest", "name": "Rest day" },
      { "day": "Tuesday", "type": "workout", "name": "Upper body strength", "duration": "40 min", "exercises": ["Push-ups 3x15", "Rows 3x12"] }
    ],
    "tip": "Updated tip"
  }
}

When just answering (no plan change), respond with ONLY this JSON:
{
  "message": "Your conversational reply here"
}

Always respond with valid JSON only. No markdown. No extra text outside the JSON.`;

    // Server-side safety net: force past days to rest in any updatedPlan returned
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    });

    const raw = response.content[0].text;
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    // Enforce past days as rest regardless of what the AI returned
    if (parsed.updatedPlan && lockedDays.length > 0) {
      parsed.updatedPlan.days = parsed.updatedPlan.days.map(d =>
        lockedDays.includes(d.day)
          ? { day: d.day, type: "rest", name: "Rest day" }
          : d
      );
    }

    return Response.json(parsed);
  } catch (error) {
    console.error("Chat error:", error);
    return Response.json(
      { message: "Sorry, I couldn't process that. Please try again." },
      { status: 500 }
    );
  }
}
