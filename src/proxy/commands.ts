import { parseGatewayCommand, SetupError, COMMAND_GUIDANCE } from "./options.js";
import { enable, disable, modeSummary } from "./settings.js";
import { gatewayHook } from "./lifecycle.js";
import { userHome } from "./config.js";

export async function handleGatewayInput(
  input: { hook_event_name?: unknown; prompt?: unknown; session_id?: unknown; cwd?: string },
  entry: string,
  env = process.env,
  home = userHome(),
  output = (value: unknown) => process.stdout.write(JSON.stringify(value) + "\n"),
): Promise<void> {
  // Same supported UserPromptSubmit decision:block protocol as tracing mute/unmute.
  // Parse and consume even errors BEFORE config/disabled checks; no model/tool turn.
  if (
    input.hook_event_name === "UserPromptSubmit" &&
    typeof input.prompt === "string" &&
    /^\/langsmith-gateway:(setup|disable)(?=\s|$)/.test(input.prompt)
  ) {
    let reason: string;
    try {
      const command = parseGatewayCommand(input.prompt);
      if (!command) return;
      if (command.command === "setup") {
        const { settingsChanged, useClaudeSubscription, modeChanged } = await enable(
          entry,
          ["--yes", ...command.args],
          env,
          home,
          input.cwd ?? "",
        );
        reason =
          (settingsChanged
            ? "Gateway settings saved for the selected scope; "
            : "Gateway settings already configured for the selected scope; ") +
          modeSummary(useClaudeSubscription, modeChanged) +
          "local daemon healthy. Authentication is checked on the first model request, not setup." +
          (settingsChanged ? " Restart Claude to apply the settings." : "");
      } else {
        disable(["--yes", ...command.args], env, home, input.cwd ?? "");
        reason =
          "Gateway disabled for the selected scope; owned settings restored and later edits preserved. The last active scope disables the daemon (up to 5 seconds to notice, then up to 30 seconds to drain). Restart affected Claude sessions.";
      }
    } catch (error) {
      reason =
        error instanceof SetupError
          ? error.message
          : "Gateway command failed; check private config, CLI installation, permissions, links, concurrent edits and port conflicts privately. " +
            COMMAND_GUIDANCE;
    }
    try {
      output({ decision: "block", reason });
    } catch {
      process.exitCode = 2;
    }
    return;
  }
  await gatewayHook(input.hook_event_name, input.session_id, entry, home, input.cwd);
}
