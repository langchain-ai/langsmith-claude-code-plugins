import { spawn } from "node:child_process";
import { endpoints, userHome } from "./config.js";
import {
  BEARER_TOKEN,
  CLI_TOKEN_TTL_MS,
  CREDENTIAL_TIMEOUT_MS,
  DEFAULT_CREDENTIAL_TTL_MS,
  EXPIRY_MARGIN_MS,
  EXPIRY_SKEW_MS,
  MAX_TOKEN_BYTES,
  RETRY_AFTER_MS,
  SHELL,
} from "./proxy-constants.js";
import type { ProxyConfig } from "./proxy-models.js";

// No inherited project-controlled endpoint, credential, proxy, or runtime variables.
export function cliEnvironment(): NodeJS.ProcessEnv {
  return { HOME: userHome(), PATH: "/usr/bin:/bin:/usr/sbin:/sbin" };
}
export function cliToken(
  config: ProxyConfig,
  timeoutMs = CREDENTIAL_TIMEOUT_MS,
  signal?: AbortSignal,
): Promise<string> {
  return spawnToken(
    config.cli,
    [
      ...(config.profile === undefined ? [] : ["--profile", config.profile]),
      "--api-url",
      endpoints(config).apiUrl,
      "--format=pretty",
      "auth",
      "token",
    ],
    timeoutMs,
    signal,
  );
}

export function commandToken(
  command: string,
  timeoutMs = CREDENTIAL_TIMEOUT_MS,
  signal?: AbortSignal,
): Promise<string> {
  return spawnToken(SHELL, ["-c", command], timeoutMs, signal);
}

function spawnToken(
  command: string,
  args: string[],
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("LangSmith token unavailable"));
      return;
    }
    const child = spawn(command, args, {
      cwd: userHome(),
      env: cliEnvironment(),
      stdio: ["ignore", "pipe", "ignore"],
      shell: false,
    });
    let output = "";
    let settled = false;
    const finish = (token?: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener("abort", cancel);
      output = "";
      if (token) resolve(token);
      else reject(new Error("LangSmith token unavailable"));
    };
    // Wait for child close after cancellation before releasing the drain lock.
    const cancel = () => {
      child.kill("SIGKILL");
    };
    signal?.addEventListener("abort", cancel, { once: true });
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      finish();
    }, timeoutMs);
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      output += chunk;
      if (output.length > MAX_TOKEN_BYTES) {
        child.kill("SIGKILL");
        finish();
      }
    });
    child.on("error", () => finish());
    child.on("close", (code) => {
      const token = output.trim();
      finish(!signal?.aborted && code === 0 && BEARER_TOKEN.test(token) ? token : undefined);
    });
  });
}

// One token, one in-flight subprocess, short negative cache. JWT parsing only bounds
// cache lifetime; signature/authentication verification belongs to the gateway.
export class TokenCache {
  private cached?: { token: string; until: number };
  private pending?: Promise<string>;
  private retryAt = 0;
  constructor(
    private readonly load: () => Promise<string>,
    private readonly now = Date.now,
    private readonly ttlMs = CLI_TOKEN_TTL_MS,
  ) {}
  get loading(): boolean {
    return this.pending !== undefined;
  }
  get(): Promise<string> {
    if (this.cached && this.now() < this.cached.until) return Promise.resolve(this.cached.token);
    if (this.pending) return this.pending;
    if (this.now() < this.retryAt) return Promise.reject(new Error("LangSmith token unavailable"));
    this.pending = this.load()
      .then((token) => {
        const exp = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString()).exp;
        if (
          typeof exp !== "number" ||
          !Number.isFinite(exp) ||
          exp * 1000 < this.now() + EXPIRY_SKEW_MS
        )
          throw new Error("Expired token");
        this.cached = {
          token,
          until: Math.min(this.now() + this.ttlMs, exp * 1000 - EXPIRY_MARGIN_MS),
        };
        return token;
      })
      .catch(() => {
        this.cached = undefined;
        this.retryAt = this.now() + RETRY_AFTER_MS;
        throw new Error("LangSmith token unavailable");
      })
      .finally(() => {
        this.pending = undefined;
      });
    return this.pending;
  }
}

export function commandGuidance(config: ProxyConfig): string {
  const reused = (config.credentialTtlMs ?? DEFAULT_CREDENTIAL_TTL_MS) / 1000;
  return `LangSmith authentication unavailable. Your configured credential command did not print one unexpired bearer token on standard output, so it exited non-zero, printed something else, or ran past ${CREDENTIAL_TIMEOUT_MS / 1000} seconds. It runs with ${SHELL} from your home directory and gets only HOME and a standard PATH, so anything your shell profile or virtual environment normally sets up is missing even when the same command works in your terminal. A good result is reused for ${reused} seconds, or less when the token expires sooner, and a failure is remembered for ${RETRY_AFTER_MS / 1000} seconds. Fix the command and send the request again, since nothing is replayed for you.\n`;
}

export function loginGuidance(config: ProxyConfig): string {
  return `LangSmith authentication unavailable. Stop gateway sessions and other CLI writers, then log in in a separate terminal using your pinned CLI executable with: ${config.profile === undefined ? "" : `--profile ${config.profile} `}--api-url ${endpoints(config).apiUrl} auth login. Use a profile matching the selected API (optionally pin it with --profile): --api-url does not change an existing saved OAuth issuer. Review that issuer privately before login/refresh. Then retry the request; token lookup failures are cached for two seconds. Failed requests are not replayed automatically. Hooks never open a browser.\n`;
}
