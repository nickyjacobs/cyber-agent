// src/workflows/osint-gather.ts
import { CyberAgent } from '../core/agent';
import { OsintTools } from '../tools/osint-tools';
import type { ScanResult, Severity } from '../core/types';
import ora from 'ora';

export async function runOsintGather(agent: CyberAgent, domain: string): Promise<ScanResult[]> {
  console.log(`\n🔍 = OSINT RECONNAISSANCE: ${domain} =\n`);
  const allResults: ScanResult[] = [];

  const spinner = ora(`OSINT tools draaien voor ${domain}...`).start();
  const osint = new OsintTools();
  const results = await osint.run({ domain });
  spinner.succeed(`OSINT: ${results.length} bevindingen`);
  allResults.push(...results);

  // Toon bevindingen
  console.log('\n📋 Bevindingen:\n');
  const icons: Record<Severity, string> = {
    info: 'ℹ️', low: '🟡', medium: '🟠', high: '🔴', critical: '🚨',
  };
  for (const r of allResults) {
    if (r.severity !== 'info' || allResults.length < 10) {
      console.log(`  ${icons[r.severity]} [${r.severity.toUpperCase()}] ${r.title}`);
    }
  }

  // AI analyse
  const aiSpinner = ora('AI analyseert OSINT data...').start();
  const analysis = await agent.analyzeResults(`OSINT: ${domain}`, allResults);
  aiSpinner.succeed('AI-analyse compleet');

  console.log('\n🤖 = AI ANALYSE =\n');
  console.log(analysis);

  return allResults;
}
