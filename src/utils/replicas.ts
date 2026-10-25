import { sdkSetting } from "@langchain/plugins-base/auth";
import type { Config } from "../types.js";

export function hasOwnApiKey(replica: NonNullable<Config["replicas"]>[number]): boolean {
  return !Array.isArray(replica) && sdkSetting(replica.apiKey) !== undefined;
}

export function hasUsableDestination(
  config: Pick<Config, "credentialProblem" | "replicas">,
): boolean {
  return !config.credentialProblem || Boolean(config.replicas?.some(hasOwnApiKey));
}
