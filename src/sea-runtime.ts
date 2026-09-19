export async function runningCompiledBinary(): Promise<boolean> {
  const sea = await import("node:sea").catch(() => undefined);
  return sea?.isSea() === true;
}
