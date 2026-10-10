import { isAbsolute } from "node:path";
import {
  TURN_RECORD_ORIGIN_NULL_CHARACTER,
  TURN_RECORD_VALIDATION_LIMITS,
} from "../../constants.js";

export function isValidRecordOrigin(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= TURN_RECORD_VALIDATION_LIMITS.originLength
  );
}

export function isValidOriginPath(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= TURN_RECORD_VALIDATION_LIMITS.pathLength &&
    !value.includes(TURN_RECORD_ORIGIN_NULL_CHARACTER) &&
    isAbsolute(value)
  );
}
