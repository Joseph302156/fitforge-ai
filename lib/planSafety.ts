import type { WorkoutPlan } from "./planSchema";

// Safety net: force already-passed days of the week to rest, even if the
// AI scheduled workouts on them. Past days are in the past — the user
// cannot work out on Monday when today is Wednesday.
export function enforcePastDaysRest(plan: WorkoutPlan, pastDays: string[] | undefined | null): WorkoutPlan {
  if (!pastDays || pastDays.length === 0) return plan;
  return {
    ...plan,
    days: plan.days.map((d) =>
      pastDays.includes(d.day) ? { day: d.day, type: "rest", name: "Rest day" } : d
    ),
  };
}
