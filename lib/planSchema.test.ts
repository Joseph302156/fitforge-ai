import { describe, expect, it } from "vitest";
import { parsePlanJson } from "./planSchema";

function validPlanJson(): string {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    .map((day) => `{"day": "${day}", "type": "workout", "name": "Training", "duration": "40 min", "exercises": ["Push-ups 3x15"]}`)
    .join(",");
  return `{"days": [${days}], "tip": "Stay hydrated"}`;
}

describe("parsePlanJson", () => {
  it("parses a valid plan and returns typed data", () => {
    const plan = parsePlanJson(validPlanJson());

    expect(plan.days).toHaveLength(7);
    expect(plan.days[0].day).toBe("Monday");
    expect(plan.days[0].exercises).toEqual(["Push-ups 3x15"]);
    expect(plan.tip).toBe("Stay hydrated");
  });

  it("strips markdown fences Claude sometimes adds", () => {
    const plan = parsePlanJson("```json\n" + validPlanJson() + "\n```");

    expect(plan.days).toHaveLength(7);
  });

  it("throws a clear error when the model returns non-JSON", () => {
    expect(() => parsePlanJson("Sorry, I cannot help with that.")).toThrow(
      "Model returned invalid JSON"
    );
  });

  it("throws a clear error when days are missing", () => {
    expect(() => parsePlanJson('{"tip": "no days here"}')).toThrow(
      "Model returned a malformed plan"
    );
  });

  it("throws when the plan does not cover all 7 days", () => {
    expect(() =>
      parsePlanJson('{"days": [{"day": "Monday", "type": "rest", "name": "Rest day"}]}')
    ).toThrow("Model returned a malformed plan");
  });

  it("throws when a day is missing required fields", () => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
      .map((day, i) =>
        i === 3
          ? `{"day": "${day}"}`
          : `{"day": "${day}", "type": "rest", "name": "Rest day"}`
      )
      .join(",");
    expect(() => parsePlanJson(`{"days": [${days}]}`)).toThrow(
      "Model returned a malformed plan"
    );
  });

  it("accepts rest days without duration or exercises", () => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
      .map((day) => `{"day": "${day}", "type": "rest", "name": "Rest day"}`)
      .join(",");
    const plan = parsePlanJson(`{"days": [${days}]}`);

    expect(plan.days).toHaveLength(7);
    expect(plan.tip).toBeUndefined();
  });
});
