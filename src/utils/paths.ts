import { realpathSync } from "node:fs";

export function isTheSameFile(one: string, other: string): boolean {
  try {
    return realpathSync(one) === realpathSync(other);
  } catch {
    return one === other;
  }
}

export function underHome(path: string, home: string): string {
  if (path === home) return "~";
  return path.startsWith(`${home}/`) ? `~/${path.slice(home.length + 1)}` : path;
}
