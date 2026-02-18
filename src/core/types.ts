// src/core/types.ts

export type AgentMode =
  | 'general'
  | 'redteam'
  | 'blueteam'
  | 'osint'
  | 'webpentest'
  | 'smartcontract';

export type Severity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export interface ScanResult {
  tool: string;
  severity: Severity;
  title: string;
  description: string;
  recommendation?: string;
  mitreAttackId?: string;
  raw?: string;
}

export interface AgentConfig {
  mode: AgentMode;
  model: string;
  outputFormat: 'text' | 'json' | 'markdown';
  verbose: boolean;
  autoConfirm: boolean;
}

export interface SecurityTool {
  name: string;
  description: string;
  run(args?: Record<string, unknown>): Promise<ScanResult[]>;
}
