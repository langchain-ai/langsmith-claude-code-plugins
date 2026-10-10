import { mkdtempSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = mkdtempSync(join(tmpdir(), "gateway-baseline-"));
const home = join(root, "home");
mkdirSync(home);
const allowed = new Set(["path", "pathext", "systemroot", "windir", "comspec"]);
const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => allowed.has(key.toLowerCase())));
Object.assign(env, { CI: "1", HOME: home, USERPROFILE: home, TMPDIR: root, TMP: root, TEMP: root });
for (const args of [["node_modules/typescript/bin/tsc"], ["esbuild.config.mjs"], ["node_modules/vitest/vitest.mjs", "run", "src/packaging.test.ts", "--reporter=verbose"]]) {
  const result = spawnSync(process.execPath, args, { env, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
