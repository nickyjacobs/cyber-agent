// src/utils/format.ts
import chalk from 'chalk';
import type { ScanResult, Severity } from '../core/types';

export const SEVERITY_ICONS: Record<Severity, string> = {
  info:     'ℹ️ ',
  low:      '🟡',
  medium:   '🟠',
  high:     '🔴',
  critical: '🚨',
};

const SEVERITY_COLORS: Record<Severity, (s: string) => string> = {
  info:     chalk.gray,
  low:      chalk.yellow,
  medium:   chalk.hex('#FFA500'),
  high:     chalk.red,
  critical: chalk.bgRed.white,
};

export function printResult(r: ScanResult): void {
  const icon = SEVERITY_ICONS[r.severity];
  const color = SEVERITY_COLORS[r.severity];
  console.log(`  ${icon} ${color(`[${r.severity.toUpperCase()}]`)} ${r.title}`);
  if (r.recommendation) console.log(chalk.dim(`     💡 ${r.recommendation}`));
  if (r.mitreAttackId)  console.log(chalk.dim(`     🗺️  MITRE: ${r.mitreAttackId}`));
}

export function printResults(results: ScanResult[]): void {
  const nonInfo = results.filter(r => r.severity !== 'info');
  const display = nonInfo.length > 0 ? nonInfo : results;
  for (const r of display) printResult(r);
}
