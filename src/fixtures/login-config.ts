import { mkdtempSync, rmdirSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { onTestFinished } from "vitest";

export function writeLoginConfig(apiUrl: string): string {
  const root = tmpdir();
  const folder = mkdtempSync(join(root, "ls-login-"));
  const path = join(folder, "config.json");
  onTestFinished(() => {
    if (dirname(folder) !== root) throw new Error(`Refusing to delete ${folder} outside ${root}`);
    unlinkSync(path);
    rmdirSync(folder);
  });
  const profile = { api_url: apiUrl, oauth: { access_token: "synthetic-access" } };
  writeFileSync(path, JSON.stringify({ current_profile: "work", profiles: { work: profile } }));
  return path;
}
