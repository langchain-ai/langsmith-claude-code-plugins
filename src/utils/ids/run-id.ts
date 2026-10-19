import { createHash } from "node:crypto";

export function stableRunId(time: string | number, ...identity: unknown[]): string {
  const stamp = new Date(time).getTime().toString(16).padStart(12, "0");
  const hash = createHash("sha256").update(JSON.stringify(identity)).digest("hex");
  const variant = (8 + (Number.parseInt(hash[3], 16) % 4)).toString(16);
  return `${stamp.slice(0, 8)}-${stamp.slice(8)}-7${hash.slice(0, 3)}-${variant}${hash.slice(4, 7)}-${hash.slice(7, 19)}`;
}
