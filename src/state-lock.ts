import {
  acquireCompatibleDirectoryFileLock,
  FileLockTimeoutError,
} from "@langchain/plugins-base/storage";
import type { FileLockHandle } from "@langchain/plugins-base/storage";
import { STATE_LOCK_BUSY_WARNING, STATE_LOCK_RELEASE_WARNING } from "./constants.js";
import { warn } from "./logger.js";

export async function withStateFileLock(
  stateFilePath: string,
  callback: () => void | Promise<void>,
  waitMs: number,
): Promise<boolean> {
  let lock: FileLockHandle;
  try {
    lock = await acquireCompatibleDirectoryFileLock(stateFilePath, { timeoutMs: waitMs });
  } catch (error) {
    if (!(error instanceof FileLockTimeoutError)) throw error;
    warn(STATE_LOCK_BUSY_WARNING);
    return false;
  }
  try {
    await callback();
  } finally {
    await releaseStateLock(lock);
  }
  return true;
}

async function releaseStateLock(lock: FileLockHandle): Promise<void> {
  try {
    await lock.release();
  } catch (error) {
    warn(`${STATE_LOCK_RELEASE_WARNING}: ${error}`);
  }
}
