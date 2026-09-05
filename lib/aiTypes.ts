import type { ContentBlock } from "@anthropic-ai/sdk/resources/messages";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

// Claude returns a list of content blocks (text, thinking, tool calls...).
// Pull out the first text block instead of blindly reading content[0].
export function getFirstText(content: ContentBlock[]): string {
  const block = content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("Model returned no text");
  return block.text;
}
