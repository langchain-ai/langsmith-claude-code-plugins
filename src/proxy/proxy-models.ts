export interface CredentialIdentity {
  identityTokenCommand?: string;
  identityTokenTtlMs?: number;
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
  settingsTargets?: string[];
  apiUrl?: string;
  gatewayUrl?: string;
}

export interface SetupOptions extends CredentialIdentity {
  scope: "global" | "project";
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
