import { build } from "esbuild";
import { chmodSync, readFileSync } from "node:fs";

// Read the plugin version at BUILD TIME and inject it as a global constant.
// The runtime bundle has no package.json, so we cannot require("./package.json")
// at runtime — esbuild `define` substitutes the literal into the bundle instead.
const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf-8"));

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
  "dist/commands/trace-link.js",
];

await build({
  entryPoints,
  bundle: true,
  platform: "node",
  format: "esm",
  outdir: "bundle",
  // Flat output (bundle/<name>.js) regardless of entry subdir (hooks/, commands/).
  entryNames: "[name]",
  // tsc output already has shebangs; esbuild strips them during bundling
  // Mark node builtins as external (they're available at runtime)
  external: ["node:*"],
  define: {
    // Build-time injection of the plugin (integration) version. Consumed by
    // config.ts via `typeof __LS_INTEGRATION_VERSION__`.
    __LS_INTEGRATION_VERSION__: JSON.stringify(pkg.version),
  },
});

// Make hooks executable
for (const entry of entryPoints) {
  const filename = entry.split("/").pop();
  chmodSync(`bundle/${filename}`, 0o755);
}

console.log(`Bundled ${entryPoints.length} hooks into bundle/`);
