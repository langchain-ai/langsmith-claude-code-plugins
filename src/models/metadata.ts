import type {
  CodingAgentAgentType,
  CodingAgentMetadataOptions as SharedCodingAgentMetadataOptions,
} from "@langchain/plugins-base/metadata";

export type LSAgentType = CodingAgentAgentType;
export type CodingAgentMetadataOptions = Omit<
  SharedCodingAgentMetadataOptions,
  "integration" | "integrationVersion" | "threadId"
> & { sessionId: string };
