import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request) {
  try {
    const { goal, level, planSummary, messages } = await request.json();

    const system = `You are a friendly, expert personal trainer AI assistant. The user has an existing 7-day workout plan and is chatting with you to refine or ask questions about it.

Current plan context:
- Goal: ${goal}
- Fitness level: ${level}
- Current plan:
${planSummary}

You have two modes:
1. ANSWER: If the user asks a general fitness question or wants advice, reply conversationally in 1-3 sentences. Do not update the plan.
2. UPDATE: If the user asks to change, adjust, modify, swap, add, remove, or rebuild any part of the plan, generate a full updated plan.

When updating, respond with ONLY this JSON format, no extra text:
{
  "message": "A short friendly message explaining what you changed (1-2 sentences)",
  "updatedPlan": {
    "days": [
      { "day": "Monday", "type": "workout", "name": "Upper body strength", "duration": "40 min", "exercises": ["Push-ups 3x15", "Rows 3x12"] },
      { "day": "Tuesday", "type": "rest", "name": "Rest day" }
    ],
    "tip": "Updated tip relevant to the changes made"
  }
}

When just answering (no plan change), respond with ONLY this JSON format:
{
  "message": "Your conversational reply here"
}

Always respond with valid JSON only. No markdown. No extra text outside the JSON.`;

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

    return Response.json(parsed);
  } catch (error) {
    console.error("Chat error:", error);
    return Response.json(
      { message: "Sorry, I couldn't process that. Please try again." },
      { status: 500 }
    );
  }
}