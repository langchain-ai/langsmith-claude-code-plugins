declare const LS_COMPILED_BINARY: string | undefined;

export function builtAsBinary(): boolean {
  return typeof LS_COMPILED_BINARY !== "undefined";
}
