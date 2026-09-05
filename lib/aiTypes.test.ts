import { describe, expect, it } from "vitest";
import type { ContentBlock } from "@anthropic-ai/sdk/resources/messages";
import { getFirstText } from "./aiTypes";

describe("getFirstText", () => {
  it("returns the text of the first text block", () => {
    const content = [{ type: "text", text: "Hello!" } as ContentBlock];
    expect(getFirstText(content)).toBe("Hello!");
  });

  it("skips non-text blocks to find the text", () => {
    const content = [
      { type: "thinking", thinking: "..." },
      { type: "text", text: "Actual answer" },
    ] as unknown as ContentBlock[];
    expect(getFirstText(content)).toBe("Actual answer");
  });

  it("throws a clear error when there is no text block", () => {
    const content = [{ type: "thinking", thinking: "..." }] as unknown as ContentBlock[];
    expect(() => getFirstText(content)).toThrow("Model returned no text");
  });
});
