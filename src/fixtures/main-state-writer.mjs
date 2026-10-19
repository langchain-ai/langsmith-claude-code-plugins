import {
  closeSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname } from "node:path";

const [statePath, key, count] = process.argv.slice(2);
const lock = `${statePath}.lock`;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function acquireLock() {
  const deadline = Date.now() + 5_000;
  mkdirSync(dirname(statePath), { recursive: true });
  while (Date.now() < deadline) {
    try {
      closeSync(openSync(lock, "wx", 0o600));
      return;
    } catch {
      await sleep(20);
    }
  }
  try {
    unlinkSync(lock);
  } catch {}
}

for (let update = 0; update < Number(count); update += 1) {
  await acquireLock();
  try {
    let state = {};
    try {
      state = JSON.parse(readFileSync(statePath, "utf-8"));
    } catch {}
    const session = state[key] ?? { last_line: 0, turn_count: 0, updated: "" };
    state[key] = { ...session, last_line: session.last_line + 1 };
    const staged = `${statePath}.${process.pid}.state.tmp`;
    writeFileSync(staged, JSON.stringify(state, null, 2), { mode: 0o600 });
    renameSync(staged, statePath);
  } finally {
    try {
      unlinkSync(lock);
    } catch {}
  }
}
