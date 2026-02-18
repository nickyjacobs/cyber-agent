// src/workflows/network-analysis.ts
import { CyberAgent } from '../core/agent';
import { TsharkAnalyzer } from '../tools/tshark-analyzer';
import type { ScanResult, Severity } from '../core/types';
import ora from 'ora';

export async function runNetworkAnalysis(agent: CyberAgent, pcapFile: string): Promise<ScanResult[]> {
  console.log(`\n📡 = PCAP ANALYSE: ${pcapFile} =\n`);
  const allResults: ScanResult[] = [];

  const spinner = ora('tshark: PCAP bestand analyseren...').start();
  const analyzer = new TsharkAnalyzer();
  const results = await analyzer.run({ pcapFile });
  spinner.succeed(`PCAP analyse: ${results.length} bevindingen`);
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
  const aiSpinner = ora('AI analyseert netwerkverkeer...').start();
  const analysis = await agent.analyzeResults(`PCAP Analyse: ${pcapFile}`, allResults);
  aiSpinner.succeed('AI-analyse compleet');

  console.log('\n🤖 = AI ANALYSE =\n');
  console.log(analysis);

  return allResults;
}
