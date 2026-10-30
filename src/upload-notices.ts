import { readLoginNotice, refusedLoginReplicas, sdkSetting } from "@langchain/plugins-base/auth";
import { engineStorageRoot, writerOptions } from "./engine-writer.js";
import type { Config, UploadNotices } from "./types.js";

export function readUploadNotices(config: Config): UploadNotices {
  const apiKey = sdkSetting(config.apiKey);
  const loginNotice = readLoginNotice(
    engineStorageRoot(config.stateFilePath),
    process.env,
    config.login || apiKey === undefined ? undefined : { apiKey, apiUrl: config.apiBaseUrl },
    config.profile,
  );
  const credentialNotice = config.login
    ? refusedLoginReplicas(writerOptions(config).replicas, config.apiBaseUrl)
    : undefined;
  return { loginNotice, credentialNotice };
}
