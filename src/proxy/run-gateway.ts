import { fileURLToPath } from "node:url";
import { ConfigError, loadConfig } from "./config.js";
import { initLogger, warn } from "../logger.js";
import { createProxy, identity } from "./server.js";
import { COMMAND_GUIDANCE } from "./proxy-constants.js";
import { SetupError } from "./options.js";
import { handleGatewayInput } from "./commands.js";
import { readStdin } from "../utils/stdin.js";

const entry = fileURLToPath(import.meta.url);
async function main(argv: string[]): Promise<void> {
  const [command, ...args] = argv;
  if (command !== undefined && (command !== "daemon" || args.length !== 0))
    throw new SetupError(COMMAND_GUIDANCE);
  if (command === undefined) {
    const input: Parameters<typeof handleGatewayInput>[0] = await readStdin();
    await handleGatewayInput(input, entry);
    return;
  }
  const config = loadConfig();
  if (!config) return;
  if (command === "daemon") {
    // The same bundle runs in a separate background process so later model
    // requests and streams can be served after the short-lived hooks exit.
    initLogger(false);
    const { server, drain } = createProxy(config, { log: warn });
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
export function runGateway(argv: string[]): Promise<void> {
  return main(argv).catch((error) => {
    process.stderr.write(
      error instanceof SetupError || error instanceof ConfigError
        ? error.message + "\n"
        : "Experimental LangSmith proxy unavailable; check private config, settings permissions/symlinks, and local port conflicts. No sensitive error details are printed. " +
            COMMAND_GUIDANCE +
            "\n",
    );
    if (argv.length > 0) process.exitCode = 1;
  });
}
