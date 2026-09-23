import { defineBinaryTarget } from "@langchain/langsmith-plugin-binary";
import config from "../binary.config.json" with { type: "json" };

export const binary = defineBinaryTarget({
  executableName: config.executableName,
  repository: config.repository,
  userAgent: "langsmith-claude-code",
  releasesApiOverrideEnvVar: "CC_LANGSMITH_RELEASES_API",
});
