import { build } from "esbuild";
import { chmodSync, readFileSync, writeFileSync } from "node:fs";

// Read the plugin version at BUILD TIME and inject it as a global constant.
// The plugin's package.json carries no version, so we cannot read it at runtime and
// esbuild `define` substitutes the literal into the bundle instead.
const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf-8"));

await build({
  // One entry bundles the LangSmith SDK once rather than once per hook.
  entryPoints: ["dist/src/hooks/langsmith-claude.js"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: "plugins/langsmith-tracing/bundle/dispatch.js",
  // Mark node builtins as external (they're available at runtime)
  external: ["node:*"],
  define: {
    // Build-time injection of the plugin (integration) version. Consumed by
    // constants.ts via `typeof __LS_INTEGRATION_VERSION__`.
    __LS_INTEGRATION_VERSION__: JSON.stringify(pkg.version),
  },
});

chmodSync("plugins/langsmith-tracing/bundle/dispatch.js", 0o755);

console.log("Bundled the tracing hook dispatcher into plugins/langsmith-tracing/bundle/");

// A separate installable plugin; all runtime code is bundled within its root.
// Its package.json supplies ESM mode on Node 20 without the tracing package.
await build({
  entryPoints: ["dist/src/hooks/langsmith-claude.js"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: "plugins/langsmith-gateway/bundle/gateway.js",
  external: ["node:*"],
});
chmodSync("plugins/langsmith-gateway/bundle/gateway.js", 0o755);
console.log("Bundled experimental gateway into plugins/langsmith-gateway/bundle/");

for (const plugin of ["langsmith-gateway", "langsmith-tracing"]) {
  const launcher = `plugins/${plugin}/hooks/langsmith-claude-launcher`;
  writeFileSync(
    launcher,
    readFileSync(launcher, "utf-8").replace(/^VERSION=".*"$/m, `VERSION="${pkg.version}"`),
  );
}
