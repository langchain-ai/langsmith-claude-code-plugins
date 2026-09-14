import {
  constants,
  closeSync,
  fstatSync,
  fsyncSync,
  lstatSync,
  linkSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { randomBytes } from "node:crypto";

// The OS home is trusted; never follow user-config path components through links.
export function directory(path: string, create = false, privateMode = false): void {
  if (create) {
    try {
      mkdirSync(path, { mode: 0o700 });
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e;
    }
  }
  const s = lstatSync(path);
  if (!s.isDirectory() || s.uid !== process.getuid?.() || s.mode & (privateMode ? 0o077 : 0o022))
    throw new Error("Unsafe settings directory");
}
export function directories(home: string, create = false): void {
  directory(home);
  directory(join(home, ".claude"), create);
}
export interface Snapshot {
  text: string;
  ino: number;
  dev: number;
  mtime: number;
  mode: number;
}
export function snapshot(path: string, privateMode = false): Snapshot | undefined {
  let fd: number;
  try {
    fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return;
    throw e;
  }
  try {
    const s = fstatSync(fd);
    if (
      !s.isFile() ||
      s.nlink !== 1 ||
      s.uid !== process.getuid?.() ||
      s.mode & (privateMode ? 0o077 : 0o022) ||
      s.size > 1024 * 1024
    )
      throw new Error("Unsafe settings file");
    return {
      text: readFileSync(fd, "utf8"),
      ino: s.ino,
      dev: s.dev,
      mtime: s.mtimeMs,
      mode: s.mode,
    };
  } finally {
    closeSync(fd);
  }
}
export function unchanged(path: string, prior: Snapshot | undefined, privateMode = false): void {
  if (JSON.stringify(snapshot(path, privateMode)) !== JSON.stringify(prior))
    throw new Error("Settings changed concurrently; retry");
}
export function atomic(path: string, text: string, prior: Snapshot | undefined): void {
  const temp = join(dirname(path), `.gateway-${randomBytes(16).toString("hex")}.tmp`);
  const fd = openSync(
    temp,
    constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW,
    0o600,
  );
  try {
    try {
      writeFileSync(fd, text);
      fsyncSync(fd);
    } finally {
      closeSync(fd);
    }
    unchanged(path, prior);
    if (prior === undefined) {
      // Publish a new file exclusively: a racing creator must never be replaced.
      linkSync(temp, path);
      unlinkSync(temp);
    } else renameSync(temp, path);
    const dir = openSync(dirname(path), constants.O_RDONLY);
    try {
      fsyncSync(dir);
    } finally {
      closeSync(dir);
    }
  } finally {
    try {
      unlinkSync(temp);
    } catch {
      // After rename the temp no longer exists. Cleanup failure must not hide
      // the original write error; any orphan temp remains private (0600).
    }
  }
}
export const jsonText = (value: unknown) => JSON.stringify(value, null, 2) + "\n";

// Write-ahead order is supplied by the caller. Roll back only our exact writes,
// never overwrite concurrent user edits. Receipts remain recoverable after a crash.
export function transaction(
  writes: { path: string; text: string; prior: Snapshot | undefined }[],
): void {
  const completed: { path: string; prior: Snapshot | undefined; written: Snapshot }[] = [];
  for (const item of writes) unchanged(item.path, item.prior);
  try {
    for (const item of writes) {
      atomic(item.path, item.text, item.prior);
      completed.push({ ...item, written: snapshot(item.path)! });
    }
  } catch (error) {
    for (const item of completed.reverse()) {
      try {
        unchanged(item.path, item.written);
        if (item.prior) atomic(item.path, item.prior.text, item.written);
        else unlinkSync(item.path);
      } catch {
        /* Preserve concurrent changes; write-ahead receipt supports recovery. */
      }
    }
    throw error;
  }
}
