import { BUNDLE_USAGE, GATEWAY_PLUGIN, PLUGIN_FLAG, TRACING_PLUGIN } from "../constants.js";
import { LS_INTEGRATION_VERSION } from "../integration-version.js";
import { runGateway } from "../proxy/run-gateway.js";
import { runTracing } from "./dispatch.js";

const [flag, plugin, ...rest] = process.argv.slice(2);

if (flag === "--version" && plugin === undefined) {
  process.stdout.write(`${LS_INTEGRATION_VERSION ?? "development"}\n`);
} else if (flag === PLUGIN_FLAG && plugin === GATEWAY_PLUGIN) {
  await runGateway(rest);
} else if (flag === PLUGIN_FLAG && plugin === TRACING_PLUGIN) {
  await runTracing(rest);
} else {
  process.stderr.write(BUNDLE_USAGE);
}
