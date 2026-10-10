export interface NativeRunRouting {
  cwd: string;
}

export interface LegacySessionRoute extends NativeRunRouting {
  projectName: string;
  sessionId: string;
}
