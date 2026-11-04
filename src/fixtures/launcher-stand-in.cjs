#!/usr/bin/env node
const { appendFileSync, readFileSync } = require("node:fs");
const { spawnSync } = require("node:child_process");
const { basename } = require("node:path");

const name = basename(process.argv[1]);
const args = process.argv.slice(2);
const env = process.env;

function readStdinBytes() {
  try {
    return readFileSync(0).length;
  } catch {
    return 0;
  }
}

function sleep(seconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, seconds * 1000);
}

function tar() {
  appendFileSync(env.TAR_LOG, `${args.join(" ")}\n`);
  sleep(Number(env.TAR_DELAY ?? 0));
  process.exit(spawnSync("/usr/bin/tar", args, { stdio: "inherit" }).status ?? 1);
}

function codesign() {
  appendFileSync(env.CODESIGN_LOG, `${args.join(" ")}\n`);
  process.exit(Number(env.CODESIGN_RESULT ?? 0));
}

function uname() {
  console.log(env.FAKE_SYSTEM ?? "Darwin");
}

function nodeGateway() {
  console.log(`node ${args.join(" ")} ${readStdinBytes()} bytes`);
}

function build() {
  if (args[0] === "--version") return console.log(env.FAKE_BUILD_VERSION);
  if (env.FAKE_BUILD === "refuses") process.exit(3);
  console.log(`build ${args.join(" ")} ${readStdinBytes()} bytes`);
}

const standIns = { tar, codesign, uname, "gateway.js": nodeGateway };
(standIns[name] ?? build)();
