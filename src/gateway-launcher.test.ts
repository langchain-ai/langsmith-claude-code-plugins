import { describe, expect, it } from "vitest";
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { once } from "node:events";
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as after } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const launcher = join(root, "plugins/langsmith-gateway/hooks/langsmith-gateway");
const { executableName } = JSON.parse(
  readFileSync(join(root, "gateway.binary.config.json"), "utf8"),
);
const { version } = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const asset = `${executableName}-darwin-arm64-${version}`;
const RELEASE_URL = `https://github.com/langchain-ai/langsmith-claude-code-plugins/releases/download/${version}`;
const DOWNLOAD_WAIT_MS = 10_000;
type Hooks = Record<string, { hooks: { command: string }[] }[]>;
const EVENT = JSON.stringify({ hook_event_name: "SessionStart", session_id: "launcher" });

const FAKE_CURL = `#!/bin/sh
out=""
url=""
while [ $# -gt 0 ]; do
  case "$1" in
    -o) out="$2"; shift 2 ;;
    --proto|--max-time) shift 2 ;;
    -*) shift ;;
    *) url="$1"; shift ;;
  esac
done
echo "$url" >> "$CURL_LOG"
sleep "\${CURL_DELAY:-0}"
file="$RELEASE/\${url##*/}"
[ -f "$file" ] || exit 22
if [ -n "$out" ]; then cp "$file" "$out"; else cat "$file"; fi
`;

const builds = {
  works: "#!/bin/sh\necho \"build $(wc -c | tr -d ' ') bytes\"\n",
  refuses: "#!/bin/sh\nexit 3\n",
};

function sandbox({ release = builds.works, checksum = undefined as string | undefined } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "langsmith-gateway-launcher-"));
  for (const folder of ["hooks", "bundle", "machine", "release", "data"]) {
    mkdirSync(join(dir, folder));
  }
  cpSync(launcher, join(dir, "hooks/langsmith-gateway"));
  writeFileSync(
    join(dir, "bundle/gateway.js"),
    'let n = 0; process.stdin.on("data", (c) => (n += c.length)).on("end", () => console.log(`node ${n} bytes`));\n',
  );
  writeFileSync(join(dir, "machine/curl"), FAKE_CURL);
  chmodSync(join(dir, "machine/curl"), 0o755);
  writeFileSync(join(dir, "release", asset), release);
  const digest = checksum ?? createHash("sha256").update(release).digest("hex");
  writeFileSync(join(dir, "release", `${asset}.sha256`), `${digest}  ${asset}\n`);
  machine(dir, "Darwin");
  return dir;
}

function machine(dir: string, system: string) {
  const path = join(dir, "machine/uname");
  writeFileSync(path, `#!/bin/sh\nif [ "$1" = "-m" ]; then echo arm64; else echo ${system}; fi\n`);
  chmodSync(path, 0o755);
}

function environment(dir: string, extra: Record<string, string> = {}) {
  return {
    ...process.env,
    CLAUDE_PLUGIN_ROOT: dir,
    CLAUDE_PLUGIN_DATA: join(dir, "data"),
    PATH: `${join(dir, "machine")}:${process.env.PATH ?? ""}`,
    RELEASE: join(dir, "release"),
    CURL_LOG: join(dir, "curl.log"),
    ...extra,
  };
}

function run(dir: string, extra: Record<string, string> = {}) {
  return spawnSync(join(dir, "hooks/langsmith-gateway"), [], {
    encoding: "utf8",
    input: EVENT,
    env: environment(dir, extra),
  });
}

const installed = (dir: string) => join(dir, "data/bin", asset);
const requested = (dir: string) =>
  existsSync(join(dir, "curl.log"))
    ? readFileSync(join(dir, "curl.log"), "utf8").trim().split("\n")
    : [];

async function downloadFinished(dir: string) {
  const deadline = Date.now() + DOWNLOAD_WAIT_MS;
  while (existsSync(`${installed(dir)}.lock`) && Date.now() < deadline) await after(50);
  expect(existsSync(`${installed(dir)}.lock`)).toBe(false);
}

function place(dir: string, name: string, body: string) {
  mkdirSync(join(dir, "data/bin"), { recursive: true });
  writeFileSync(join(dir, "data/bin", name), body);
  chmodSync(join(dir, "data/bin", name), 0o755);
}

describe("the gateway launcher", () => {
  it("is what every gateway hook starts, with Node on the next line for Windows", () => {
    const hooks: Hooks = JSON.parse(
      readFileSync(join(root, "plugins/langsmith-gateway/hooks/hooks.json"), "utf8"),
    ).hooks;
    const commands = Object.values(hooks).flatMap((groups) =>
      groups.flatMap((group) => group.hooks.map((hook) => hook.command)),
    );
    expect(commands).toHaveLength(3);
    for (const command of commands) {
      expect(command.split("\n")).toEqual([
        'exec "${CLAUDE_PLUGIN_ROOT}/hooks/langsmith-gateway"',
        'node "${CLAUDE_PLUGIN_ROOT}/bundle/gateway.js"',
      ]);
    }
  });

  it("lets Node answer while it downloads this version's build and its checksum", async () => {
    const dir = sandbox();
    const result = run(dir);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout.trim()).toBe(`node ${EVENT.length} bytes`);
    await downloadFinished(dir);
    expect(requested(dir)).toEqual([`${RELEASE_URL}/${asset}`, `${RELEASE_URL}/${asset}.sha256`]);
    expect(readFileSync(installed(dir), "utf8")).toBe(builds.works);
    expect(run(dir).stdout.trim()).toBe(`build ${EVENT.length} bytes`);
  });

  it("refuses a download whose checksum does not match and leaves nothing behind", async () => {
    const dir = sandbox({ checksum: "0".repeat(64) });
    expect(run(dir).stdout.trim()).toBe(`node ${EVENT.length} bytes`);
    await downloadFinished(dir);
    expect(readdirSync(join(dir, "data/bin"))).toEqual([]);
  });

  it("hands Node the whole event when the downloaded build cannot run it", () => {
    const dir = sandbox();
    place(dir, asset, builds.refuses);
    const result = run(dir);
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe(`node ${EVENT.length} bytes`);
    expect(result.stderr.trim().split("\n")).toHaveLength(1);
    expect(requested(dir)).toEqual([]);
  });

  it("stays on Node and downloads nothing off a Mac", async () => {
    const dir = sandbox();
    machine(dir, "Linux");
    expect(run(dir).stdout.trim()).toBe(`node ${EVENT.length} bytes`);
    await after(500);
    expect(requested(dir)).toEqual([]);
  });

  it("starts one download when several hooks fire at once", async () => {
    const dir = sandbox();
    const hooks = Array.from({ length: 5 }, () => {
      const child = spawn(join(dir, "hooks/langsmith-gateway"), [], {
        env: environment(dir, { CURL_DELAY: "1" }),
        stdio: ["pipe", "ignore", "ignore"],
      });
      child.stdin.end(EVENT);
      return once(child, "exit");
    });
    await Promise.all(hooks);
    await downloadFinished(dir);
    expect(requested(dir).filter((url) => url.endsWith(asset))).toHaveLength(1);
  });

  it("retries a download that was killed part way, but not one still running", async () => {
    const dir = sandbox();
    mkdirSync(`${installed(dir)}.lock`, { recursive: true });
    run(dir);
    await after(500);
    expect(requested(dir)).toEqual([]);

    const longAgo = new Date(Date.now() - 60 * 60 * 1000);
    utimesSync(`${installed(dir)}.lock`, longAgo, longAgo);
    run(dir);
    await downloadFinished(dir);
    expect(existsSync(installed(dir))).toBe(true);
  });

  it("deletes the previous version's build once this one is in", async () => {
    const dir = sandbox();
    const previous = `${executableName}-darwin-arm64-0.0.1`;
    place(dir, previous, builds.works);
    run(dir);
    await downloadFinished(dir);
    expect(readdirSync(join(dir, "data/bin"))).toEqual([asset]);
  });
});
