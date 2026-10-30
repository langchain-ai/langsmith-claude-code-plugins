import { spawn } from "node:child_process";
import { join } from "node:path";
import { endpoints, userHome } from "./config.js";
import { bearerCredential } from "./header-slots.js";
import {
  BEARER_TOKEN,
  CREDENTIAL_TIMEOUT_MS,
  DEFAULT_IDENTITY_TOKEN_TTL_MS,
  EXPIRED_TOKEN_REASON,
  EXPIRY_MARGIN_MS,
  EXPIRY_SKEW_MS,
  GATEWAY_REFUSED_LOG,
  LOGIN_CONFIG_PATH,
  LOGIN_TOKEN_TTL_MS,
  MAX_REFRESH_ERROR_CHARS,
  MAX_TOKEN_BYTES,
  NO_LOGIN_REASON,
  REFRESH_FAILED_REASON,
  REJECTION_RECHECK_MS,
  RETRY_AFTER_MS,
  SHELL,
  TOKEN_COMMAND_REASON,
  UNUSABLE_LOGIN_REASON,
} from "./proxy-constants.js";
import type { CredentialState, ProxyConfig } from "./proxy-models.js";

// No inherited project-controlled endpoint, credential, proxy, or runtime variables.
export function cliEnvironment(): NodeJS.ProcessEnv {
  return { HOME: userHome(), PATH: "/usr/bin:/bin:/usr/sbin:/sbin" };
}
export async function loginToken(config: ProxyConfig): Promise<string> {
  const { loadProfileClientConfig } = await import("langsmith/lib/utils/profiles");
  const { profileAuth } = loadProfileClientConfig({
    configPath: join(userHome(), ...LOGIN_CONFIG_PATH),
    profile: config.profile,
  });
  if (profileAuth === undefined) throw new Error(NO_LOGIN_REASON);
  let refreshFailure: string | undefined;
  const recordingFetch: typeof fetch = async (input, init) => {
    try {
      const response = await fetch(input, init);
      if (!response.ok)
        refreshFailure = `${response.status} ${(await response.clone().text()).slice(0, MAX_REFRESH_ERROR_CHARS)}`;
      return response;
    } catch (error) {
      refreshFailure = String(error);
      throw error;
    }
  };
  const token = bearerCredential((await profileAuth.getAuthHeader(recordingFetch))?.value);
  if (token === undefined || !BEARER_TOKEN.test(token)) throw new Error(UNUSABLE_LOGIN_REASON);
  if (refreshFailure !== undefined && expiryMs(token) < Date.now() + EXPIRY_SKEW_MS)
    throw new Error(REFRESH_FAILED_REASON + refreshFailure);
  return token;
}

function expiryMs(token: string): number {
  const exp = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString()).exp;
  return typeof exp === "number" && Number.isFinite(exp) ? exp * 1000 : 0;
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
      else reject(new Error(TOKEN_COMMAND_REASON));
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

export class TokenCache {
  private cached?: { token: string; until: number };
  private pending?: Promise<string>;
  private retryAt = 0;
  private succeededAt?: number;
  private failedAt?: number;
  private refusedAt?: number;
  private rejectedAt = 0;
  private lastFailure = "";
  constructor(
    private readonly load: () => Promise<string>,
    private readonly now = Date.now,
    private readonly ttlMs = LOGIN_TOKEN_TTL_MS,
    private readonly log: (message: string) => void = () => undefined,
  ) {}
  get loading(): boolean {
    return this.pending !== undefined;
  }
  get failure(): string {
    return this.lastFailure;
  }
  state(): CredentialState {
    const now = this.now();
    const since = (at?: number) => (at === undefined ? undefined : now - at);
    return {
      sinceSuccessMs: since(this.succeededAt),
      sinceFailureMs: since(this.failedAt),
      sinceRefusalMs: since(this.refusedAt),
    };
  }
  reject(token: string): void {
    this.refusedAt = this.now();
    if (this.cached?.token !== token) return;
    if (this.now() < this.rejectedAt + REJECTION_RECHECK_MS) return;
    this.cached = undefined;
    this.rejectedAt = this.now();
    this.log(GATEWAY_REFUSED_LOG);
  }
  get(): Promise<string> {
    if (this.cached && this.now() < this.cached.until) return Promise.resolve(this.cached.token);
    if (this.pending) return this.pending;
    if (this.now() < this.retryAt) return Promise.reject(new Error("LangSmith token unavailable"));
    this.pending = this.load()
      .then((token) => {
        const expiresAt = expiryMs(token);
        if (expiresAt < this.now() + EXPIRY_SKEW_MS) throw new Error(EXPIRED_TOKEN_REASON);
        this.succeededAt = this.now();
        this.cached = {
          token,
          until: Math.min(this.now() + this.ttlMs, expiresAt - EXPIRY_MARGIN_MS),
        };
        return token;
      })
      .catch((error: unknown) => {
        this.lastFailure = error instanceof Error ? error.message : String(error);
        this.cached = undefined;
        this.failedAt = this.now();
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
  const reused = (config.identityTokenTtlMs ?? DEFAULT_IDENTITY_TOKEN_TTL_MS) / 1000;
  return `LangSmith authentication unavailable. Your configured identity token command did not print one unexpired bearer token on standard output, so it exited non-zero, printed something else, or ran past ${CREDENTIAL_TIMEOUT_MS / 1000} seconds. It runs with ${SHELL} from your home directory and gets only HOME and a standard PATH, so anything your shell profile or virtual environment normally sets up is missing even when the same command works in your terminal. A good result is reused for ${reused} seconds, or less when the token expires sooner, and a failure is remembered for ${RETRY_AFTER_MS / 1000} seconds. Fix the command and send the request again, since nothing is replayed for you.\n`;
}

export function loginGuidance(config: ProxyConfig): string {
  return `LangSmith authentication unavailable. Stop gateway sessions and other CLI writers, then log in in a separate terminal using the LangSmith CLI with: ${config.profile === undefined ? "" : `--profile ${config.profile} `}--api-url ${endpoints(config).apiUrl} auth login. Use a profile matching the selected API (optionally pin it with --profile): --api-url does not change an existing saved OAuth issuer. Review that issuer privately before login/refresh. Then retry the request; token lookup failures are cached for two seconds. Failed requests are not replayed automatically. Hooks never open a browser.\n`;
}
