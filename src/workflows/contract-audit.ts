// src/workflows/contract-audit.ts
import { CyberAgent } from '../core/agent';
import type { ScanResult } from '../core/types';
import * as fs from 'fs';
import ora from 'ora';

export async function runContractAudit(agent: CyberAgent, contractPath: string): Promise<ScanResult[]> {
  console.log(`\n📜 = SMART CONTRACT AUDIT: ${contractPath} =\n`);

  if (!fs.existsSync(contractPath)) {
    console.error(`❌ Bestand niet gevonden: ${contractPath}`);
    return [];
  }

  const code = fs.readFileSync(contractPath, 'utf-8');
  const lineCount = code.split('\n').length;
  console.log(`📄 Contract geladen: ${lineCount} regels Solidity\n`);

  // Geen Kali tools — puur AI code review
  const aiSpinner = ora('AI analyseert smart contract op kwetsbaarheden...').start();

  const prompt = `Je voert een smart contract security audit uit op de volgende Solidity code.

Analyseer op kwetsbaarheden: reentrancy, integer overflows, access control problemen,
front-running, denial of service, onveilige randomness, en andere bekende Solidity issues.

Geef per kwetsbaarheid:
- Locatie (functie/regelnummer)
- Severity (Critical/High/Medium/Low)
- Beschrijving van het risico
- Concrete aanbeveling

Smart Contract (${contractPath}):
\`\`\`solidity
${code}
\`\`\``;

  const analysis = await agent.chat(prompt);
  aiSpinner.succeed('Smart contract audit compleet');

  console.log('\n🤖 = AUDIT RAPPORT =\n');
  console.log(analysis);

  return [{
    tool: 'contract-audit',
    severity: 'info',
    title: `Smart Contract Audit: ${contractPath}`,
    description: analysis,
  }];
}
