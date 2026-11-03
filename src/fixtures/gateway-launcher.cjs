#!/usr/bin/env node
const {
  appendFileSync,
  copyFileSync,
  existsSync,
  readFileSync,
  writeFileSync,
} = require("node:fs");
const { basename, join } = require("node:path");

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

function curl() {
  let output = "";
  let address = "";
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "-o") output = args[++i];
    else if (args[i] === "--proto" || args[i] === "--max-time") i++;
    else if (!args[i].startsWith("-")) address = args[i];
  }
  appendFileSync(env.CURL_LOG, `${address}\n`);
  if (output) writeFileSync(output, "");
  sleep(Number(env.CURL_DELAY ?? 0));
  const file = join(env.RELEASE, basename(address));
  if (!existsSync(file)) process.exit(22);
  if (output) copyFileSync(file, output);
  else process.stdout.write(readFileSync(file));
}

function codesign() {
  appendFileSync(env.CODESIGN_LOG, `${args.join(" ")}\n`);
  process.exit(Number(env.CODESIGN_RESULT ?? 0));
}

function uname() {
  console.log(args[0] === "-m" ? (env.FAKE_HARDWARE ?? "arm64") : (env.FAKE_SYSTEM ?? "Darwin"));
}

function nodeGateway() {
  console.log(`node ${readStdinBytes()} bytes`);
}

function build() {
  if (env.FAKE_BUILD === "refuses") process.exit(3);
  console.log(`build ${readStdinBytes()} bytes`);
}

const standIns = { curl, codesign, uname, "gateway.js": nodeGateway };
(standIns[name] ?? build)();
