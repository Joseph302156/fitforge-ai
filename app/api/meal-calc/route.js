import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request) {
  try {
    const { messages } = await request.json();

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: `You are a nutrition expert AI assistant. The user will describe a meal or food they ate and you will estimate the nutritional content.

When the user describes a meal, respond with ONLY this JSON format, no extra text, no markdown:
{
  "type": "estimate",
  "message": "A friendly 1-2 sentence explanation of your estimate and any assumptions made",
  "meal": {
    "name": "Short descriptive name for the meal",
    "calories": 450,
    "protein": 32,
    "carbs": 48,
    "fat": 12
  }
}

If the user asks a follow-up question, wants to adjust something, or is just chatting (not describing a meal yet), respond with:
{
  "type": "message",
  "message": "Your conversational response here"
}

Rules for estimates:
- Be realistic and use standard portion sizes if not specified
- Always provide all four values: calories, protein, carbs, fat (all as integers)
- If the user mentions a specific restaurant or brand, use that context
- Round all numbers to the nearest integer
- If unsure about portions, assume a typical serving size and mention it in the message`,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const raw = response.content[0].text;
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    return Response.json(parsed);
  } catch (error) {
    console.error("Meal calc error:", error);
    return Response.json({
      type: "message",
      message: "Sorry, I couldn't calculate that. Please try describing your meal again.",
    });
  }
}