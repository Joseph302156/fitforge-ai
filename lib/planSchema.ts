import { z } from "zod";

export const PlanDaySchema = z.object({
  day: z.string(),
  type: z.string(),
  name: z.string(),
  duration: z.string().optional(),
  exercises: z.array(z.string()).optional(),
});

export const WorkoutPlanSchema = z.object({
  days: z.array(PlanDaySchema).length(7),
  tip: z.string().optional(),
});

export type PlanDay = z.infer<typeof PlanDaySchema>;
export type WorkoutPlan = z.infer<typeof WorkoutPlanSchema>;

// Parse Claude's raw text response into a validated plan.
// Strips markdown fences, parses JSON, then validates shape.
// Throws an Error with a clear message on any failure.
export function parsePlanJson(raw: string): WorkoutPlan {
  const clean = raw.replace(/```json|```/g, "").trim();
  let json: unknown;
  try {
    json = JSON.parse(clean);
  } catch {
    throw new Error("Model returned invalid JSON");
  }
  const result = WorkoutPlanSchema.safeParse(json);
  if (!result.success) {
    throw new Error("Model returned a malformed plan");
  }
  return result.data;
}
