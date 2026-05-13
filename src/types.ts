export interface OpenSpecPluginConfig {
  enabled: boolean;
  command: string;
  args: string[];
  env: Record<string, string>;
  readOnly: boolean;
  allowedRoots: string[];
  timeoutMs: number;
}

export interface RunResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  command: string;
}
