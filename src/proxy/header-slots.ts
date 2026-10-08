import type { IncomingMessage } from "node:http";
import { BEARER_PREFIX } from "./proxy-constants.js";

export const slotPresent = (req: IncomingMessage, name: string): boolean =>
  req.rawHeaders.some((header, i) => i % 2 === 0 && header.toLowerCase() === name);

export function slotValue(req: IncomingMessage, name: string): string | undefined {
  const count = req.rawHeaders.filter(
    (header, i) => i % 2 === 0 && header.toLowerCase() === name,
  ).length;
  const value = req.headers[name];
  if (count !== 1 || typeof value !== "string") return;
  return value;
}

export function bearerCredential(value: string | undefined): string | undefined {
  if (value === undefined || !BEARER_PREFIX.test(value)) return;
  return value.slice("Bearer ".length);
}
