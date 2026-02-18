// src/workflows/hardening.ts
import { CyberAgent } from '../core/agent';
import { SystemChecker } from '../tools/system-checker';
import type { ScanResult, Severity } from '../core/types';
import ora from 'ora';

export async function runHardening(agent: CyberAgent): Promise<ScanResult[]> {
  console.log('\n🛡️  = HARDENING SCAN (Kali Linux) =\n');
  const allResults: ScanResult[] = [];

  const spinner = ora('Systeemconfiguratie analyseren...').start();
  const checker = new SystemChecker();
  const results = await checker.run();
  spinner.succeed(`Systeem checks: ${results.length} bevindingen`);
  allResults.push(...results);

  // Toon bevindingen
  console.log('\n📋 Bevindingen:\n');
  const icons: Record<Severity, string> = {
    info: 'ℹ️', low: '🟡', medium: '🟠', high: '🔴', critical: '🚨',
  };
  for (const r of allResults) {
    if (r.severity !== 'info') {
      console.log(`  ${icons[r.severity]} [${r.severity.toUpperCase()}] ${r.title}`);
      if (r.recommendation) console.log(`     💡 ${r.recommendation}`);
    }
  }

  // AI analyse
  const aiSpinner = ora('AI analyseert hardening bevindingen...').start();
  const analysis = await agent.analyzeResults('Hardening Scan', allResults);
  aiSpinner.succeed('AI-analyse compleet');

  console.log('\n🤖 = AI ANALYSE =\n');
  console.log(analysis);

  return allResults;
}
