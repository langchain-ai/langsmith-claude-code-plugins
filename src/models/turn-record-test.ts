import type { CaptureScope } from "@langchain/plugins-base/storage/capture";

export type TurnRecordTestCaptureScope = CaptureScope;

export interface TurnRecordTestLine {
  k: string;
  origin?: string;
  ackOrigin?: string;
  run?: { run_id?: string };
}
