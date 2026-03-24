import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request) {
  try {
    const { goal, level, userPrompt } = await request.json();

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: `You are an expert personal trainer. Generate a personalized 7-day workout plan based on the user's goal, fitness level, and any restrictions or situation they describe.

Always respond with ONLY a valid JSON object in this exact format, no markdown, no extra text:
{
  "days": [
    {
      "day": "Monday",
      "type": "workout",
      "name": "Upper body strength",
      "duration": "40 min",
      "exercises": [
        "Push-ups 3x15",
        "Dumbbell rows 3x12",
        "Shoulder press 3x10"
      ]
    },
    {
      "day": "Tuesday",
      "type": "rest",
      "name": "Rest day"
    }
  ],
  "tip": "A short personalized tip based on their restrictions or goals"
}

Rules:
- Always return exactly 7 days Monday through Sunday
- Respect ALL restrictions and limitations mentioned
- Match the difficulty to the fitness level
- Only include exercises that match available equipment
- Rest days should have type rest, workout days should have type workout`,
      messages: [
        {
          role: "user",
          content: `Goal: ${goal}
Fitness level: ${level}
My situation: ${userPrompt || "No additional restrictions."}

Generate my 7-day workout plan.`,
        },
      ],
    });

    const raw = message.content[0].text;
    const clean = raw.replace(/```json|```/g, "").trim();
    const plan = JSON.parse(clean);

    return Response.json(plan);
  } catch (error) {
    console.error("Error generating plan:", error);
    return Response.json(
      { error: "Failed to generate plan. Please try again." },
      { status: 500 }
    );
  }
}