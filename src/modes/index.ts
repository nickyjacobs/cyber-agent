// src/modes/index.ts
import { AgentMode } from '../core/types';
import * as general from './general';
import * as redteam from './redteam';
import * as blueteam from './blueteam';
import * as osint from './osint';
import * as webpentest from './webpentest';
import * as smartcontract from './smartcontract';

const MODES: Record<AgentMode, { prompt: string; label: string }> = {
  general,
  redteam,
  blueteam,
  osint,
  webpentest,
  smartcontract,
};

export function getModePrompt(mode: AgentMode): string {
  return MODES[mode]?.prompt ?? MODES.general.prompt;
}

export function getAvailableModes(): { mode: AgentMode; label: string }[] {
  return (Object.keys(MODES) as AgentMode[]).map((mode) => ({
    mode,
    label: MODES[mode].label,
  }));
}
