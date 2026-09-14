#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { loadConfig } from "../proxy/config.js";
import { createProxy, identity } from "../proxy/server.js";
import { COMMAND_GUIDANCE } from "../proxy/options.js";
import { enable, disable, modeSummary, setupPlan, SetupError } from "../proxy/settings.js";
import { handleGatewayInput } from "../proxy/commands.js";

const entry = fileURLToPath(import.meta.url);
async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);
  if (command === "plan") {
    process.stdout.write(JSON.stringify(setupPlan(args)) + "\n");
    return;
  }
  if (command === "enable") {
    const { settingsChanged, useClaudeSubscription, modeChanged } = await enable(entry, args);
    process.stderr.write(
      (settingsChanged
        ? "Gateway settings saved for the selected scope; "
        : "Gateway settings already configured for the selected scope; ") +
        modeSummary(useClaudeSubscription, modeChanged) +
        "local proxy healthy. Authentication is checked on the first model request, not during setup; deployment compatibility is not verified." +
        (settingsChanged ? " Restart Claude to apply the settings." : "") +
        " Use /langsmith-gateway:disable --scope global|project to undo owned settings.\n",
    );
    return;
  }
  if (command === "disable") {
    disable(args);
    process.stderr.write(
      "Gateway disabled for the selected scope; only owned transport values were undone and later edits preserved. After the last active scope is disabled, the daemon drains after its next config check (within 5 seconds, up to 30 seconds for active work). Restart all Claude sessions without local proxy shell overrides. Keep private config for re-enable.\n",
    );
    return;
  }
  if (command !== undefined && command !== "daemon") throw new SetupError(COMMAND_GUIDANCE);
  if (command === undefined) {
    let data = "";
    const timer = setTimeout(() => process.stdin.destroy(), 1000);
    try {
      for await (const chunk of process.stdin) {
        data += chunk;
        if (data.length > 65536) {
          process.stdout.write(
            JSON.stringify({
              decision: "block",
              reason: "Gateway hook input too large; no changes made.",
            }) + "\n",
          );
          return;
        }
      }
      await handleGatewayInput(JSON.parse(data), entry);
    } finally {
      clearTimeout(timer);
    }
    return;
  }
  const config = loadConfig();
  if (!config) return;
  if (command === "daemon") {
    const { server, drain } = createProxy(config);
    const watch = setInterval(() => {
      try {
        const current = loadConfig();
        if (!current || identity(current) !== identity(config)) drain();
      } catch {
        drain();
      }
    }, 5000);
    watch.unref();
    server.on("close", () => clearInterval(watch));
    process.on("SIGTERM", drain);
    process.on("SIGINT", drain);
    // Exclusive bind is the OS-owned startup lock; no stale lock file to recover.
    server.once("error", () => process.exit(1));
    server.listen({ host: "127.0.0.1", port: config.port, exclusive: true });
  }
}
void main().catch((error) => {
  // Hook errors never block tracing/Claude and never include tokens, CLI stderr,
  // request bodies, or configuration. Daemon stdio is detached to /dev/null.
  process.stderr.write(
    error instanceof SetupError
      ? error.message + "\n"
      : "Experimental LangSmith proxy unavailable; check private config, CLI executable, settings ownership/permissions/symlinks, and local port conflicts. No sensitive error details are printed. " +
          COMMAND_GUIDANCE +
          "\n",
  );
  if (process.argv[2]) process.exitCode = 1;
});
