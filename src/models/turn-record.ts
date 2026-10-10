import type { TracingMode } from "../types.js";
import type { TURN_RECORD_LINE } from "../constants.js";
import type { RecordedRun } from "../types.js";
import type { ClaudeRecordedToolOrigin } from "./tracing-engine.js";
import type { NativeRunRouting } from "./native-routing.js";

export type TurnRecordLine =
  | {
      k: typeof TURN_RECORD_LINE.run;
      root?: boolean;
      origin?: string;
      ackOrigin?: string;
      run: RecordedRun;
    }
  | {
      k: typeof TURN_RECORD_LINE.toolOrigin;
      origin?: string;
      toolOrigin: ClaudeRecordedToolOrigin;
    }
  | { k: typeof TURN_RECORD_LINE.closed; turn_id?: string }
  | { k: typeof TURN_RECORD_LINE.delivered; id: string; origin?: string; ackOrigin?: string }
  | { k: typeof TURN_RECORD_LINE.reconciled; id: string };

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
