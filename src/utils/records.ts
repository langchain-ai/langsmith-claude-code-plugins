export function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function jsonField(text: string, key: string): string | undefined {
  try {
    return stringValue((JSON.parse(text) as Record<string, unknown>)[key]);
  } catch {
    return undefined;
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
