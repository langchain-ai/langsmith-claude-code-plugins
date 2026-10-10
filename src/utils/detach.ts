import { spawn } from "node:child_process";
import { runningCompiledBinary } from "./binary-runtime.js";
import { FLUSH_QUEUE_ARG } from "../constants.js";
import { debug, warn } from "../logger.js";

export function startQueueFlusher(cwd: string, sessionId: string, projectName?: string): void {
  void launchQueueFlusher(cwd, sessionId, projectName).catch(() => {});
}

export function launchQueueFlusher(
  cwd: string,
  sessionId: string,
  projectName?: string,
): Promise<number> {
  return new Promise((resolve, reject) => {
    const self = runningCompiledBinary() || !process.argv[1] ? [] : [process.argv[1]];
    const child = spawn(
      process.execPath,
      [
        ...self,
        FLUSH_QUEUE_ARG,
        cwd,
        sessionId,
        ...(projectName === undefined ? [] : [projectName]),
      ],
      {
        detached: true,
        stdio: "ignore",
        windowsHide: true,
      },
    );
    child.once("spawn", () => {
      if (!child.pid) {
        reject(new Error("The queue flusher did not start"));
        return;
      }
      child.unref();
      debug(`Started detached queue flusher (pid ${child.pid})`);
      resolve(child.pid);
    });
    child.once("error", (err) => {
      warn(`The queue flusher could not start: ${err}`);
      reject(err);
    });
  });
}
