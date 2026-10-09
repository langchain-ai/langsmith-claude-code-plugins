/**
 * Waiting on work a detached uploader only finishes after the hook has returned.
 */

export async function waitFor(predicate: () => boolean, ms = 20_000): Promise<boolean> {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline && !predicate()) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return predicate();
}
