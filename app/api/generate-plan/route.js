import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function profileContext(p) {
  if (!p) return "";
  const bf = p.bodyFatPct ? ` / ~${p.bodyFatPct}% body fat` : "";
  return `
User profile (personalise the plan accordingly):
- Gender: ${p.gender}, ${p.heightFt}'${p.heightIn}" tall, ${p.weightLbs} lbs, Build: ${p.build}${bf}
- Primary fitness goal: ${p.fitnessGoal}
- Target physique: ${p.targetPhysique}
- Additional context from user: ${p.aiNotes || "None provided"}`.trim();
}

export async function POST(request) {
  try {
    const { goal, level, userPrompt, currentDay, pastDays, userProfile, workoutHistory } = await request.json();

    const pastDaysNote = pastDays && pastDays.length > 0
      ? `CRITICAL: The user is building this plan on ${currentDay}. The days ${pastDays.join(", ")} have already passed this week. You MUST set these days to type "rest" — do not schedule any workout on them under any circumstances.`
      : `The user is starting their plan on ${currentDay || "Monday"}.`;

    const profileNote = profileContext(userProfile);

    const historyNote = workoutHistory && workoutHistory.length > 0
      ? `\nExercises this user has done recently (incorporate their favourites and build on them):\n${workoutHistory.join(", ")}`
      : "";

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: `You are an expert personal trainer. Generate a personalized 7-day workout plan.

${profileNote ? profileNote + "\n" : ""}${historyNote ? historyNote + "\n\n" : ""}${pastDaysNote}

Respond with ONLY valid JSON, no markdown, no extra text:
{
  "days": [
    { "day": "Monday", "type": "rest", "name": "Rest day" },
    { "day": "Tuesday", "type": "workout", "name": "Upper body strength", "duration": "40 min", "exercises": ["Push-ups 3x15"] }
  ],
  "tip": "Short personalised tip based on the user's profile and history"
}

Rules:
- Return exactly 7 days Monday through Sunday
- Any day in [${(pastDays || []).join(", ")}] MUST be type "rest" — never "workout"
- Honour every restriction in the user's profile notes (injuries, schedule, preferences)
- Use exercises from their history where they fit — vary them to avoid staleness
- Scale difficulty to their build, goal, and fitness level`,
      messages: [{
        role: "user",
        content: `Goal: ${goal}
Fitness level: ${level}
Today is: ${currentDay}
Days already passed this week (must be rest): ${pastDays && pastDays.length > 0 ? pastDays.join(", ") : "none"}
${userPrompt ? "Additional notes: " + userPrompt + "\n" : ""}${profileNote ? "\n" + profileNote : ""}${historyNote}

Generate my personalised plan.`,
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