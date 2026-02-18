// src/test-workflow.ts
import { CyberAgent } from './core/agent';
import { runQuickScan } from './workflows/quick-scan';

async function main() {
  const agent = new CyberAgent({ mode: 'blueteam' });
  await runQuickScan(agent);
}

main().catch(console.error);
