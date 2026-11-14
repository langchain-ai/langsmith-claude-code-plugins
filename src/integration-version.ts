/**
 * Plugin version, injected at build time by esbuild `define` (no runtime
 * package.json). `typeof` guards the non-bundled case; env is the fallback.
 */
import { DEVELOPMENT_VERSION } from "./constants.js";

declare const __LS_INTEGRATION_VERSION__: string;
export const LS_INTEGRATION_VERSION: string | undefined =
  typeof __LS_INTEGRATION_VERSION__ !== "undefined"
    ? __LS_INTEGRATION_VERSION__
    : process.env.CC_LANGSMITH_INTEGRATION_VERSION || undefined;

export const PLUGIN_VERSION = LS_INTEGRATION_VERSION ?? DEVELOPMENT_VERSION;

declare const LS_COMPILED_BINARY: string | undefined;

export function builtAsBinary(): boolean {
  return typeof LS_COMPILED_BINARY !== "undefined";
}
