// src/workflows/quick-scan.ts
import { CyberAgent } from '../core/agent';
import { NmapScanner } from '../tools/nmap-scanner';
import { runCommand, checkKaliTools } from '../utils/shell';
import type { ScanResult, Severity } from '../core/types';
import ora from 'ora';

export async function runQuickScan(agent: CyberAgent): Promise<ScanResult[]> {
  console.log('\n🔍 = QUICK SECURITY SCAN (Kali Linux) =\n');
  const allResults: ScanResult[] = [];

  // --- Stap 1: Check beschikbare tools ---
  const tools = checkKaliTools();
  console.log('📦 Beschikbare Kali tools:');
  for (const [tool, available] of Object.entries(tools)) {
    console.log(`  ${available ? '✅' : '❌'} ${tool}`);
  }
  console.log();

  // --- Stap 2: Nmap scan (top poorten) ---
  const nmapSpinner = ora('Nmap: poorten scannen...').start();
  const nmapScanner = new NmapScanner();
  const nmapResults = await nmapScanner.run({ target: 'localhost', scanType: 'quick' });
  nmapSpinner.succeed(`Nmap: ${nmapResults.length} resultaten`);
  allResults.push(...nmapResults);

  // --- Stap 3: Systeem checks (ss, ufw, ssh) ---
  const sysSpinner = ora('Systeem: configuratie checken...').start();

  // Open verbindingen
  const ss = runCommand('ss -tlnp', { silent: true });
  const listenCount = ss.stdout.split('\n').filter(l => l.includes('LISTEN')).length;
  allResults.push({
    tool: 'system-check',
    severity: listenCount > 15 ? 'medium' : 'info',
    title: `${listenCount} luisterende TCP poorten`,
    description: ss.stdout,
  });

  // Firewall status
  const ufw = runCommand('ufw status', { silent: true, sudo: true });
  if (ufw.stdout.includes('inactive') || ufw.exitCode !== 0) {
    allResults.push({
      tool: 'system-check',
      severity: 'high',
      title: 'Firewall niet actief',
      description: 'UFW firewall is niet actief.',
      recommendation: 'Activeer met: sudo ufw enable',
    });
  }

  // SSH configuratie
  const ssh = runCommand('cat /etc/ssh/sshd_config 2>/dev/null', { silent: true });
  if (ssh.stdout.includes('PermitRootLogin yes')) {
    allResults.push({
      tool: 'system-check',
      severity: 'high',
      title: 'SSH root login toegestaan',
      description: 'Root kan direct via SSH inloggen.',
      recommendation: 'Zet PermitRootLogin op "no" in /etc/ssh/sshd_config',
      mitreAttackId: 'T1021.004',
    });
  }

  sysSpinner.succeed('Systeem: checks compleet');

  // --- Stap 4: Toon ruwe resultaten ---
  console.log('\n📋 Bevindingen:\n');
  const icons: Record<Severity, string> = {
    info: 'ℹ️',
    low: '🟡',
    medium: '🟠',
    high: '🔴',
    critical: '🚨',
  };
  for (const r of allResults) {
    if (r.severity !== 'info' || allResults.length < 10) {
      console.log(`  ${icons[r.severity]} [${r.severity.toUpperCase()}] ${r.title}`);
      if (r.recommendation) console.log(`     💡 ${r.recommendation}`);
    }
  }

  // --- Stap 5: AI analyse ---
  const aiSpinner = ora('AI analyseert bevindingen...').start();
  const analysis = await agent.analyzeResults('Quick Scan', allResults);
  aiSpinner.succeed('AI-analyse compleet');

  console.log('\n🤖 = AI ANALYSE =\n');
  console.log(analysis);

  return allResults;
}
