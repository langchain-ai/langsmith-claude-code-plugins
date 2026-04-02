import { build } from "esbuild";
import { chmodSync } from "node:fs";

const entryPoints = [
  "dist/hooks/user-prompt-submit.js",
  "dist/hooks/pre-tool-use.js",
  "dist/hooks/post-tool-use.js",
  "dist/hooks/stop.js",
  "dist/hooks/stop-failure.js",
  "dist/hooks/subagent-stop.js",
  "dist/hooks/pre-compact.js",
  "dist/hooks/post-compact.js",
  "dist/hooks/session-end.js",
];

await build({
  entryPoints,
  bundle: true,
  platform: "node",
  format: "esm",
  outdir: "bundle",
  // tsc output already has shebangs; esbuild strips them during bundling
  // Mark node builtins as external (they're available at runtime)
  external: ["node:*"],
});

// Make hooks executable
for (const entry of entryPoints) {
  const filename = entry.split("/").pop();
  chmodSync(`bundle/${filename}`, 0o755);
}

console.log(`Bundled ${entryPoints.length} hooks into bundle/`);
