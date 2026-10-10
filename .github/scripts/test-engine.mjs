import { mkdtempSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = mkdtempSync(join(tmpdir(), "claude-engine-ci-"));
const home = join(root, "home");
const temporary = join(root, "tmp");
mkdirSync(home);
mkdirSync(temporary);
const allowed = new Set(["path", "pathext", "systemroot", "windir", "comspec", "lang"]);
const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => allowed.has(key.toLowerCase())));
Object.assign(env, { HOME: home, USERPROFILE: home, TMPDIR: temporary, TMP: temporary, TEMP: temporary });
const result = spawnSync(process.execPath, ["node_modules/vitest/vitest.mjs", "run", "--reporter=verbose", "--testTimeout=30000"], { env, stdio: "inherit" });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;

if (result.status !== 0) {
  for (const entry of readdirSync(root, { recursive: true, withFileTypes: true })) {
    if (entry.isFile() && /(?:hook|engine)\.log$/.test(entry.name)) {
      const file = join(entry.parentPath, entry.name);
      console.error(file, readFileSync(file, "utf8").slice(-12000));
    }
  }
}
