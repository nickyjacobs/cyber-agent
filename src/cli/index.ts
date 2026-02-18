// src/cli/index.ts
import { showBanner } from './banner';
import { startInteractive } from './interactive';
import { CyberAgent } from '../core/agent';
import type { AgentMode } from '../core/types';

async function main(): Promise<void> {
  const modeArg = process.argv[2] as AgentMode | undefined;
  const validModes: AgentMode[] = ['general', 'redteam', 'blueteam', 'osint', 'webpentest', 'smartcontract'];
  const initialMode: AgentMode = (modeArg && validModes.includes(modeArg)) ? modeArg : 'general';

  const tempAgent = new CyberAgent({ mode: initialMode });
  showBanner(tempAgent.getConfig());

  await startInteractive(initialMode);
}

main().catch((err) => {
  console.error('Fatale fout:', err);
  process.exit(1);
});
