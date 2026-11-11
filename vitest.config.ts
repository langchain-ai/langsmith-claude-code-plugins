import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["src/fixtures/no-managed-config-setup.ts"],
    testTimeout: 20_000,
    server: {
      deps: { inline: ["@langchain/plugins-base"] },
    },
  },
});
