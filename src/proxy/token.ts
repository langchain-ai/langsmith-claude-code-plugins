import { spawn } from "node:child_process";
import { endpoints, userHome, type ProxyConfig } from "./config.js";

// No inherited project-controlled endpoint, credential, proxy, or runtime variables.
export function cliEnvironment(): NodeJS.ProcessEnv {
  return { HOME: userHome(), PATH: "/usr/bin:/bin:/usr/sbin:/sbin" };
}
export function cliToken(
  config: ProxyConfig,
  timeoutMs = 10_000,
  signal?: AbortSignal,
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("LangSmith token unavailable"));
      return;
    }
    const child = spawn(
      config.cli,
      [
        ...(config.profile === undefined ? [] : ["--profile", config.profile]),
        "--api-url",
        endpoints(config).apiUrl,
        "--format=pretty",
        "auth",
        "token",
      ],
      { cwd: userHome(), env: cliEnvironment(), stdio: ["ignore", "pipe", "ignore"], shell: false },
    );
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
      if (output.length > 16384) {
        child.kill("SIGKILL");
        finish();
      }
    });
    child.on("error", () => finish());
    child.on("close", (code) => {
      const token = output.trim();
      finish(
        !signal?.aborted &&
          code === 0 &&
          /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)
          ? token
          : undefined,
      );
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
        if (typeof exp !== "number" || !Number.isFinite(exp) || exp * 1000 < this.now() + 5000)
          throw new Error("Expired token");
        this.cached = { token, until: Math.min(this.now() + 60_000, exp * 1000 - 60_000) };
        return token;
      })
      .catch(() => {
        this.cached = undefined;
        this.retryAt = this.now() + 2000;
        throw new Error("LangSmith token unavailable");
      })
      .finally(() => {
        this.pending = undefined;
      });
    return this.pending;
  }
}

export function loginGuidance(config: ProxyConfig): string {
  return `LangSmith authentication unavailable. Stop gateway sessions and other CLI writers, then log in in a separate terminal using your pinned CLI executable with: ${config.profile === undefined ? "" : `--profile ${config.profile} `}--api-url ${endpoints(config).apiUrl} auth login. Use a profile matching the selected API (optionally pin it with --profile): --api-url does not change an existing saved OAuth issuer. Review that issuer privately before login/refresh. Then retry the request; token lookup failures are cached for two seconds. Failed requests are not replayed automatically. Hooks never open a browser.\n`;
}
