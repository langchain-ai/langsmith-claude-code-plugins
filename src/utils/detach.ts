import { spawn } from "node:child_process";
import { runningCompiledBinary } from "./binary-runtime.js";
import { FLUSH_QUEUE_ARG } from "../constants.js";
import { debug, warn } from "../logger.js";

export function startQueueFlusher(cwd: string, sessionId: string): void {
  try {
    const self = runningCompiledBinary() ? [] : [process.argv[1]];
    const child = spawn(process.execPath, [...self, FLUSH_QUEUE_ARG, cwd, sessionId], {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    });
    // A spawn that fails reports it as an event, which Node turns into a crash if nobody listens.
    child.on("error", (err) => warn(`The queue flusher could not start: ${err}`));
    child.unref();
    debug(`Started detached queue flusher (pid ${child.pid})`);
  } catch (err) {
    warn(`Could not start the queue flusher: ${err}`);
  }
}
