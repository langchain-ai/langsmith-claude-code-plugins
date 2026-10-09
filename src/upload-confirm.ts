/**
 * Proof that LangSmith accepted an upload.
 *
 * Both RunTree.postRun and RunTree.patchRun report success whichever way the
 * request went, so the call underneath is the only place a refusal shows.
 */

import type { Client } from "langsmith";

export interface UploadWatch {
  failure(): unknown;
}

export function watchUploads(client: Client): UploadWatch {
  let failure: unknown;
  const createRun = client.createRun.bind(client);
  const updateRun = client.updateRun.bind(client);
  client.createRun = async (...args: Parameters<Client["createRun"]>) => {
    try {
      return await createRun(...args);
    } catch (err) {
      failure = err;
      throw err;
    }
  };
  client.updateRun = async (...args: Parameters<Client["updateRun"]>) => {
    try {
      return await updateRun(...args);
    } catch (err) {
      failure = err;
      throw err;
    }
  };
  return {
    failure() {
      const seen = failure;
      failure = undefined;
      return seen;
    },
  };
}
