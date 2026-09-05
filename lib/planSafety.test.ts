import { describe, expect, it } from "vitest";
import { enforcePastDaysRest, type WorkoutPlan } from "./planSafety";

function makePlan(): WorkoutPlan {
  return {
    days: [
      { day: "Monday", type: "workout", name: "Upper body strength", duration: "40 min", exercises: ["Push-ups 3x15"] },
      { day: "Tuesday", type: "workout", name: "Leg day", duration: "45 min", exercises: ["Squats 3x12"] },
      { day: "Wednesday", type: "workout", name: "Push day", duration: "40 min", exercises: ["Bench press 4x8"] },
      { day: "Thursday", type: "workout", name: "Pull day", duration: "40 min", exercises: ["Pull-ups 3x8"] },
      { day: "Friday", type: "rest", name: "Rest day" },
      { day: "Saturday", type: "workout", name: "Full body", duration: "50 min", exercises: ["Deadlift 3x5"] },
      { day: "Sunday", type: "rest", name: "Rest day" },
    ],
    tip: "Stay hydrated",
  };
}

describe("enforcePastDaysRest", () => {
  it("forces a past day the AI scheduled as workout back to rest", () => {
    const result = enforcePastDaysRest(makePlan(), ["Monday", "Tuesday"]);

    expect(result.days[0]).toEqual({ day: "Monday", type: "rest", name: "Rest day" });
    expect(result.days[1]).toEqual({ day: "Tuesday", type: "rest", name: "Rest day" });
  });

  it("leaves future days untouched, including their exercises", () => {
    const result = enforcePastDaysRest(makePlan(), ["Monday"]);

    expect(result.days[2]).toEqual({
      day: "Wednesday",
      type: "workout",
      name: "Push day",
      duration: "40 min",
      exercises: ["Bench press 4x8"],
    });
    expect(result.days[5].type).toBe("workout");
  });

  it("returns the plan unchanged when pastDays is empty", () => {
    const plan = makePlan();
    expect(enforcePastDaysRest(plan, [])).toBe(plan);
  });

  it("returns the plan unchanged when pastDays is missing (week starts today)", () => {
    const plan = makePlan();
    expect(enforcePastDaysRest(plan, undefined)).toBe(plan);
    expect(enforcePastDaysRest(plan, null)).toBe(plan);
  });

  it("keeps the tip and all 7 days in order", () => {
    const result = enforcePastDaysRest(makePlan(), ["Monday", "Tuesday", "Wednesday"]);

    expect(result.days).toHaveLength(7);
    expect(result.days.map((d) => d.day)).toEqual([
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ]);
    expect(result.tip).toBe("Stay hydrated");
  });

  it("does not mutate the original plan object", () => {
    const plan = makePlan();
    enforcePastDaysRest(plan, ["Monday"]);

    expect(plan.days[0].type).toBe("workout");
    expect(plan.days[0].name).toBe("Upper body strength");
  });

  it("handles a mid-week start: every day before today becomes rest", () => {
    const result = enforcePastDaysRest(makePlan(), ["Monday", "Tuesday", "Wednesday", "Thursday"]);

    const restDays = result.days.filter((d) => d.type === "rest").map((d) => d.day);
    expect(restDays).toEqual(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Sunday"]);
    expect(result.days.find((d) => d.day === "Saturday")?.type).toBe("workout");
  });
});
