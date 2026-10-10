import { withFileLock } from "@langchain/plugins-base/storage";
import { STATE_LOCK_RELEASE_WARNING } from "../../constants.js";

export async function withStateFileLock<T>(
  stateFilePath: string,
  callback: () => T | Promise<T>,
): Promise<T> {
  let callbackCompleted = false;
  let callbackFailed = false;
  let callbackResult: T | undefined;
  let callbackError: unknown;

  try {
    return await withFileLock(stateFilePath, async () => {
      try {
        callbackResult = await callback();
        callbackCompleted = true;
        return callbackResult;
      } catch (error) {
        callbackFailed = true;
        callbackError = error;
        throw error;
      }
    });
  } catch (error) {
    if (callbackFailed) {
      if (error !== callbackError) warnStateLockReleaseFailure(error);
      throw callbackError;
    }
    if (callbackCompleted) {
      warnStateLockReleaseFailure(error);
      return callbackResult as T;
    }
    throw error;
  }
}

function warnStateLockReleaseFailure(error: unknown): void {
  try {
    console.warn(STATE_LOCK_RELEASE_WARNING, error);
  } catch {
    return;
  }
}
