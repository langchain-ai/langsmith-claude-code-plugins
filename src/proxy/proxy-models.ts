export interface CredentialIdentity {
  credentialCommand?: string;
  credentialTtlMs?: number;
  workspaceId?: string;
}

export interface ProxyConfig extends CredentialIdentity {
  enabled: boolean;
  useClaudeSubscription: boolean;
  cli: string;
  // Omission delegates to the CLI’s persisted current/default profile.
  profile?: string;
  port: number;
  secret: string;
  // Optional discovery index only; never credentials, previous values or authorization.
  settingsTargets?: string[];
  apiUrl?: string;
  gatewayUrl?: string;
}

export interface SetupOptions extends CredentialIdentity {
  scope: "global" | "project";
  // Explicit setup only: omission selects OAuth-only, never the saved mode.
  useClaudeSubscription: boolean;
  cli?: string;
  profile?: string;
  port?: number;
  apiUrl?: string;
  gatewayUrl?: string;
}

export interface Endpoints {
  apiUrl: string;
  gatewayUrl: string;
}

export type ObjectValue = Record<string, unknown>;
