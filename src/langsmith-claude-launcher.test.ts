import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  lutimesSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  realpathSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { setTimeout as after } from "node:timers/promises";
import {
  age,
  build,
  deadProcess,
  environment,
  EVENT,
  executableName,
  gatewayPlugin,
  installed,
  partials,
  place,
  repack,
  root,
  run,
  runAtOnce,
  runnable,
  sandbox,
  settles,
  STAND_IN,
  tracingPlugin,
  unpackFinished,
  unpacks,
  unpackSettled,
} from "./fixtures/launcher-sandbox.js";

const TEAM_REQUIREMENT = 'anchor apple generic and certificate leaf[subject.OU] = "H253X88X9F"';
const TEST_TIMEOUT_MS = 30_000;

describe("the shared launcher", { timeout: TEST_TIMEOUT_MS }, () => {
  it.each(["langsmith-gateway", "langsmith-tracing"])(
    "reaches the packed build through a link from %s, so the repository keeps one copy",
    (plugin) => {
      const link = join(root, "plugins", plugin, "binary", `${executableName}.tar.xz`);
      expect(lstatSync(link).isSymbolicLink()).toBe(true);
      expect(join(realpathSync(join(link, "..")), readlinkSync(link))).toBe(
        join(realpathSync(root), "shared", `${executableName}.tar.xz`),
      );
    },
  );

  it("gives tracing the gateway's launcher with only its plugin and Node entry changed", () => {
    const launcher = (plugin: string) =>
      readFileSync(join(plugin, "hooks/langsmith-claude-launcher"), "utf8").split("\n");
    const gateway = launcher(gatewayPlugin);
    const tracing = launcher(tracingPlugin);
    const changed = gateway.flatMap((line, index) =>
      line === tracing[index] ? [] : [[line, tracing[index]]],
    );
    expect(tracing).toHaveLength(gateway.length);
    expect(changed).toEqual([
      ['PLUGIN="gateway"', 'PLUGIN="tracing"'],
      ['NODE_ENTRY="bundle/gateway.js"', 'NODE_ENTRY="bundle/dispatch.js"'],
    ]);
  });

  it("unpacks this version's build on the first hook, then runs it as the gateway", () => {
    const dir = sandbox();
    const result = run(dir);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout.trim()).toBe(`build --plugin gateway ${EVENT.length} bytes`);
    expect(readFileSync(installed(dir), "utf8")).toBe(STAND_IN);
    expect(partials(dir)).toEqual([]);
  });

  it("never runs a build not signed by our Apple team, and never unpacks this version again", async () => {
    const dir = sandbox();
    run(dir, { CODESIGN_RESULT: "3" });
    expect(await unpackSettled(dir)).toBe(true);
    expect(runnable(dir)).toBe(false);
    expect(readFileSync(join(dir, "codesign.log"), "utf8")).toContain(`-R=${TEAM_REQUIREMENT}`);
    const later = run(dir);
    expect(later.stdout.trim()).toBe(`node --plugin gateway ${EVENT.length} bytes`);
    expect(later.stderr).toContain("refused");
    await after(500);
    expect(unpacks(dir)).toHaveLength(1);
  });

  it("never runs a build reporting another version, until a new bundle lands behind its link", async () => {
    const dir = sandbox();
    const link = join(dir, "binary", `${executableName}.tar.xz`);
    mkdirSync(join(dir, "shared"));
    renameSync(link, join(dir, "shared", `${executableName}.tar.xz`));
    symlinkSync(`../shared/${executableName}.tar.xz`, link);
    expect(run(dir, { FAKE_BUILD_VERSION: "0.0.1" }).stdout.trim()).toBe(
      `node --plugin gateway ${EVENT.length} bytes`,
    );
    expect(runnable(dir)).toBe(false);
    age(installed(dir), 1);
    age(link, 2, lutimesSync);
    repack(dir);
    expect(run(dir).stdout.trim()).toBe(`build --plugin gateway ${EVENT.length} bytes`);
  });

  it("tries a refused version again after six hours", async () => {
    const dir = sandbox();
    run(dir, { CODESIGN_RESULT: "3" });
    expect(await unpackSettled(dir)).toBe(true);
    age(installed(dir), 7 * 60);
    age(join(dir, "binary", `${executableName}.tar.xz`), 8 * 60);
    run(dir);
    expect(await unpackFinished(dir)).toBe(true);
    expect(unpacks(dir)).toHaveLength(2);
  });

  it("takes over an unpack claimed ten minutes ago, even if its process id now belongs to someone else", async () => {
    const dir = sandbox();
    const claim = `${installed(dir)}.unpacking`;
    symlinkSync(String(process.pid), claim);
    age(claim, 11, lutimesSync);
    run(dir);
    expect(await unpackFinished(dir)).toBe(true);
  });

  it("hands Node the event when the build cannot run, and stops using that build", async () => {
    const dir = sandbox();
    place(dir, build);
    const result = run(dir, { FAKE_BUILD: "refuses" });
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe(`node --plugin gateway ${EVENT.length} bytes`);
    expect(result.stderr.trim().split("\n")).toHaveLength(1);
    expect(runnable(dir)).toBe(false);
    run(dir);
    await after(500);
    expect(unpacks(dir)).toEqual([]);
  });

  it("stays on Node and unpacks nothing off a Mac", async () => {
    const dir = sandbox();
    const result = run(dir, { FAKE_SYSTEM: "Linux" });
    expect(result.stdout.trim()).toBe(`node --plugin gateway ${EVENT.length} bytes`);
    expect(result.stderr).toBe("");
    await after(500);
    expect(unpacks(dir)).toEqual([]);
  });

  it("stays on Node quietly when the plugin carries no packed build yet", async () => {
    const dir = sandbox();
    rmSync(join(dir, "binary", `${executableName}.tar.xz`));
    const result = run(dir);
    expect(result.stdout.trim()).toBe(`node --plugin gateway ${EVENT.length} bytes`);
    expect(result.stderr).toBe("");
    await after(500);
    expect(unpacks(dir)).toEqual([]);
  });

  it("leaves nothing behind when the unpack fails, so the next hook tries again", async () => {
    const dir = sandbox();
    writeFileSync(join(dir, "binary", `${executableName}.tar.xz`), "not an archive");
    run(dir);
    expect(await settles(() => unpacks(dir).length === 1 && partials(dir).length === 0)).toBe(true);
    await after(200);
    expect(readdirSync(join(dir, "binary"))).toEqual([`${executableName}.tar.xz`]);
  });

  it("unpacks once when several hooks start at the same moment, and every one of them runs the build", async () => {
    const dir = sandbox();
    const outputs = await runAtOnce(dir, 5);
    expect(outputs).toEqual(Array(5).fill(`build --plugin gateway ${EVENT.length} bytes`));
    expect(unpacks(dir)).toHaveLength(1);
  });

  it("falls back to Node when another hook's unpack never finishes", () => {
    const dir = sandbox();
    symlinkSync(String(process.pid), `${installed(dir)}.unpacking`);
    const started = Date.now();
    expect(run(dir).stdout.trim()).toBe(`node --plugin gateway ${EVENT.length} bytes`);
    expect(Date.now() - started).toBeGreaterThanOrEqual(4000);
    expect(unpacks(dir)).toEqual([]);
  });

  it("clears a killed unpack's claim and leftovers, even when the next unpack is refused", async () => {
    const dir = sandbox();
    const killedProcess = deadProcess();
    const killed = `${installed(dir)}.partial.${killedProcess}`;
    writeFileSync(killed, "half a build");
    symlinkSync(killedProcess, `${installed(dir)}.unpacking`);
    run(dir, { CODESIGN_RESULT: "3" });
    expect(await unpackSettled(dir)).toBe(true);
    expect(existsSync(killed)).toBe(false);
  });

  it("runs Node without complaint when the hook's input is closed", () => {
    const dir = sandbox();
    place(dir, build);
    const result = spawnSync(
      "/bin/sh",
      ["-c", 'exec <&- && exec "$0" "$@"', join(dir, "hooks/langsmith-claude-launcher")],
      { encoding: "utf8", env: environment(dir) },
    );
    expect(result.stdout.trim()).toBe("node --plugin gateway 0 bytes");
    expect(result.stderr).toBe("");
  });

  it("deletes other versions' builds once this one works, and leaves running unpacks alone", async () => {
    const dir = sandbox();
    const older = `${executableName}-0.0.1`;
    const running = `${older}.partial.${process.pid}`;
    const unrelated = `${executableName}-unrelated`;
    place(dir, older);
    place(dir, unrelated);
    writeFileSync(join(dir, "binary", running), "");
    writeFileSync(join(dir, "binary", `${older}.partial.${deadProcess()}`), "");
    run(dir);
    const settled = [`${executableName}.tar.xz`, build, running, unrelated].toSorted().join(" ");
    expect(
      await settles(() => readdirSync(join(dir, "binary")).toSorted().join(" ") === settled),
    ).toBe(true);
  });
});
