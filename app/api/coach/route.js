import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request) {
  try {
    const { messages, context } = await request.json();

    const systemPrompt = `You are FitForge AI, a friendly and knowledgeable personal fitness coach. You have full context about the user's current fitness situation and give personalized, actionable advice.

Here is the user's current data:
${context}

Your personality:
- Encouraging and positive but honest
- Concise — keep responses under 3 sentences unless the user asks for detail
- Specific — reference their actual workout names, nutrition numbers, and goals
- Knowledgeable about fitness, nutrition, exercise form, and workout programming
- Helpful for finding resources — you can suggest searching YouTube for specific exercise tutorials, recommend reputable fitness websites like examine.com for supplements, bodybuilding.com for exercises, etc.

When giving the opening daily summary (first message), naturally mention:
- How they're doing on their workout streak and weekly progress
- Today's scheduled workout if they have one
- A quick nutrition callout if relevant
- An encouraging note for the week ahead

Keep it conversational and warm, like a coach who actually knows them.`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    return Response.json({ message: response.content[0].text });
  } catch (error) {
    console.error("Coach API error:", error);
    return Response.json({
      message: "Sorry, I couldn't connect right now. Try again in a moment!",
    });
  }
}