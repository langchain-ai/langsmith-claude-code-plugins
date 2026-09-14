import http from "node:http";
import { connect } from "node:net";
import { spawn } from "node:child_process";
import { KEY_HEADER, loadConfig, userHome, type ProxyConfig } from "./config.js";
import { identity } from "./server.js";
import { configuredScope } from "./scopes.js";
import { cliEnvironment } from "./token.js";

export function control(
  config: ProxyConfig,
  method: string,
  path: string,
  timeoutMs = 500,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: config.port,
        method,
        path,
        agent: false,
        headers: { [KEY_HEADER]: config.secret, "content-length": "0" },
      },
      (res) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          data += chunk;
          if (data.length > 1024) req.destroy();
        });
        res.on("error", () => reject(new Error("Local proxy unavailable")));
        res.on("end", () =>
          res.statusCode === 200 || res.statusCode === 204
            ? resolve(data)
            : reject(new Error("Local proxy unavailable")),
        );
      },
    );
    // Wall-clock timeout, not a socket-inactivity timer.
    const timer = setTimeout(() => req.destroy(new Error("Local proxy unavailable")), timeoutMs);
    req.on("close", () => clearTimeout(timer));
    req.on("error", () => reject(new Error("Local proxy unavailable")));
    req.end();
  });
}
export async function healthy(config: ProxyConfig): Promise<boolean> {
  try {
    return (await control(config, "GET", "/_langsmith/health")) === identity(config);
  } catch {
    return false;
  }
}

export async function ensure(config: ProxyConfig, entry: string): Promise<void> {
  if (await healthy(config)) return;
  // The exclusive loopback listen is the startup lock. Unlike PID/filesystem locks,
  // the OS atomically arbitrates it and releases it even after SIGKILL. Concurrent
  // candidates losing EADDRINUSE exit without reading tokens or touching sessions.
  const child = spawn(process.execPath, [entry, "daemon"], {
    detached: true,
    stdio: "ignore",
    cwd: userHome(),
    env: cliEnvironment(),
  });
  child.on("error", () => {});
  child.unref();
  const deadline = Date.now() + 4000;
  do {
    if (await healthy(config)) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  } while (Date.now() < deadline);
  // Never kill a process merely because a port is occupied or a PID was reused.
  throw new Error("Local proxy unavailable");
}

export async function gatewayHook(
  event: unknown,
  session: unknown,
  entry: string,
  home = userHome(),
  cwd?: string,
): Promise<void> {
  const config = loadConfig(home);
  if (!config) return;
  if (
    !["SessionStart", "UserPromptSubmit", "SessionEnd"].includes(String(event)) ||
    typeof session !== "string" ||
    !/^[a-zA-Z0-9_-]{1,128}$/.test(session)
  )
    return;
  if (event === "SessionEnd") {
    // Record the end even before registration/health completes. Never spawn here.
    // If no listener exists yet, lease expiry is the fallback (no persistent state).
    await control(config, "DELETE", `/_langsmith/sessions/${session}`);
  } else {
    if (!configuredScope(home, cwd, config)) return;
    await ensure(config, entry);
    await control(config, "PUT", `/_langsmith/sessions/${session}`);
  }
}

// Keep config disabled until the old listener has released the OS startup lock.
// This also works for pre-preview daemons, which already poll disabled config.
// No credentials, signals, control commands or new CLI processes go to a listener.
export async function waitForStopped(config: ProxyConfig, timeoutMs = 36_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  do {
    const stopped = await new Promise<boolean>((resolve) => {
      const socket = connect({ host: "127.0.0.1", port: config.port });
      const finish = (free: boolean) => {
        socket.destroy();
        resolve(free);
      };
      socket.once("connect", () => finish(false));
      socket.once("error", (error: NodeJS.ErrnoException) => finish(error.code === "ECONNREFUSED"));
      socket.setTimeout(500, () => finish(false));
    });
    if (stopped) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  } while (Date.now() < deadline);
  throw new Error("Old proxy still draining or local port occupied");
}
