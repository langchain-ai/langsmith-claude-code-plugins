import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["src/fixtures/no-managed-config-setup.ts"],
    server: {
      deps: { inline: ["@langchain/plugins-base"] },
    },
  },
});
