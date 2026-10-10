import type { TracingMode } from "../types.js";
import type { NativeRunRouting } from "./native-routing.js";

export interface RecordRunOptions {
  path: string;
  run: Record<string, unknown>;
  tracing: TracingMode;
  origin: string;
  toolUseId?: string;
  shared?: boolean;
  root?: boolean;
  closesAt?: string;
  routing?: NativeRunRouting;
}
