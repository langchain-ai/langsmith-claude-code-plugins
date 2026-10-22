import { createHash } from "node:crypto";

export function hashPrompt(prompt: string): string {
  return createHash("sha256").update(prompt).digest("hex");
}
