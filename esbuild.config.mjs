import { build } from "esbuild";
import { chmodSync, readFileSync } from "node:fs";

// Read the plugin version at BUILD TIME and inject it as a global constant.
// The runtime bundle has no package.json, so we cannot require("./package.json")
// at runtime — esbuild `define` substitutes the literal into the bundle instead.
const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf-8"));

// esbuild keeps every key of an imported JSON file, so drop the build and signing
// sections here rather than ship them to users who only need the two names.
const runtimeBinaryConfig = {
  name: "runtime-binary-config",
  setup(bundler) {
    bundler.onLoad({ filter: /binary\.config\.json$/ }, ({ path }) => {
      const runtime = JSON.parse(readFileSync(path, "utf-8"));
      for (const section of ["installer", "build", "sign"]) delete runtime[section];
      return { loader: "json", contents: JSON.stringify(runtime) };
    });
  },
};

await build({
  // One entry bundles the LangSmith SDK once rather than once per hook.
  entryPoints: ["dist/src/hooks/dispatch.js"],
  bundle: true,
  platform: "node",
  format: "esm",
  outdir: "bundle",
  // Mark node builtins as external (they're available at runtime)
  external: ["node:*"],
  plugins: [runtimeBinaryConfig],
  define: {
    // Build-time injection of the plugin (integration) version. Consumed by
    // config.ts via `typeof __LS_INTEGRATION_VERSION__`.
    __LS_INTEGRATION_VERSION__: JSON.stringify(pkg.version),
    __LS_BINARY_HOOKS__: JSON.stringify(
      readFileSync(new URL("./hooks/hooks.binary.json", import.meta.url), "utf-8"),
    ),
  },
});

chmodSync("bundle/dispatch.js", 0o755);

console.log("Bundled the tracing hook dispatcher into bundle/");

// A separate installable plugin; all runtime code is bundled within its root.
// Its package.json supplies ESM mode on Node 20 without the tracing package.
await build({
  entryPoints: ["dist/src/hooks/gateway.js"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: "plugins/langsmith-gateway/bundle/gateway.js",
  external: ["node:*"],
});
chmodSync("plugins/langsmith-gateway/bundle/gateway.js", 0o755);
console.log("Bundled experimental gateway into plugins/langsmith-gateway/bundle/");
