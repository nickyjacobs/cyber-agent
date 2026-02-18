// src/workflows/webapp-scan.ts
import { CyberAgent } from '../core/agent';
import { NiktoScanner } from '../tools/nikto-scanner';
import { SslScanner } from '../tools/ssl-scanner';
import { runCommand, isToolAvailable } from '../utils/shell';
import type { ScanResult, Severity } from '../core/types';
import ora from 'ora';

export async function runWebappScan(agent: CyberAgent, target: string): Promise<ScanResult[]> {
  console.log(`\n🌐 = WEB APP SCAN: ${target} =\n`);
  const allResults: ScanResult[] = [];

  // Nikto
  const niktoSpinner = ora('Nikto: web vulnerability scan...').start();
  const nikto = new NiktoScanner();
  const niktoResults = await nikto.run({ target });
  niktoSpinner.succeed(`Nikto: ${niktoResults.length} bevindingen`);
  allResults.push(...niktoResults);

  // WhatWeb
  if (isToolAvailable('whatweb')) {
    const whatwebSpinner = ora('WhatWeb: technologie detectie...').start();
    const whatweb = runCommand(`whatweb -v ${target} 2>/dev/null`, { timeout: 30_000, silent: true });
    allResults.push({
      tool: 'whatweb',
      severity: 'info',
      title: `Technologie stack: ${target}`,
      description: whatweb.stdout || 'Geen output',
      raw: whatweb.stdout,
    });
    whatwebSpinner.succeed('WhatWeb: compleet');
  }

  // SSL/TLS scan (alleen voor HTTPS targets)
  if (!target.startsWith('http://')) {
    const hostname = target.replace(/^https?:\/\//, '').split('/')[0];
    const sslSpinner = ora('SSL/TLS: certificaat en cipher scan...').start();
    const ssl = new SslScanner();
    const sslResults = await ssl.run({ target: hostname });
    sslSpinner.succeed(`SSL/TLS: ${sslResults.length} bevindingen`);
    allResults.push(...sslResults);
  }

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
  const aiSpinner = ora('AI analyseert web scan resultaten...').start();
  const analysis = await agent.analyzeResults(`Web App Scan: ${target}`, allResults);
  aiSpinner.succeed('AI-analyse compleet');

  console.log('\n🤖 = AI ANALYSE =\n');
  console.log(analysis);

  return allResults;
}
