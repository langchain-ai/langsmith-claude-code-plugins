import { describe, expect, it } from "vitest";

import { queueOrigin } from "./queue.js";

describe("the account fingerprint on a queued run", () => {
  // Catches a fingerprint that only notices the key, which lets one project upload
  // another's runs to extra endpoints or with the wrong redaction applied.
  it("changes when anything deciding where or how the run is sent changes", () => {
    const account = { apiBaseUrl: "https://api.smith.langchain.com", apiKey: "key-a" };
    const fingerprints = new Set([
      queueOrigin(account),
      queueOrigin({ ...account, apiBaseUrl: "https://eu.api.smith.langchain.com" }),
      queueOrigin({ ...account, apiKey: "key-b" }),
      queueOrigin({ ...account, replicas: [{ apiUrl: "https://elsewhere" }] }),
      queueOrigin({ ...account, redact: true }),
      queueOrigin({ ...account, redact: true, redactExtraRules: [{ pattern: "secret" }] }),
    ]);

    expect(fingerprints.size).toBe(6);
  });
});
