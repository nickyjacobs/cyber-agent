// src/utils/export.ts
import type { ScanResult } from '../core/types';
import * as fs from 'fs';

export type ExportFormat = 'json' | 'md' | 'csv';

export function exportResults(
  results: ScanResult[],
  format: ExportFormat,
  mode: string
): string {
  const date = new Date().toISOString().slice(0, 10);
  const ext = format === 'md' ? 'md' : format;
  const filename = `scan-results/scan-${date}-${mode}.${ext}`;

  fs.mkdirSync('scan-results', { recursive: true });

  const content =
    format === 'json' ? toJson(results) :
    format === 'md'   ? toMarkdown(results, mode, date) :
                        toCsv(results);

  fs.writeFileSync(filename, content, 'utf-8');
  return filename;
}

function toJson(results: ScanResult[]): string {
  return JSON.stringify(results, null, 2);
}

function toMarkdown(results: ScanResult[], mode: string, date: string): string {
  const icons: Record<string, string> = {
    info: 'ℹ️', low: '🟡', medium: '🟠', high: '🔴', critical: '🚨',
  };

  const table = [
    '| Severity | Tool | Titel | Aanbeveling |',
    '|----------|------|-------|-------------|',
    ...results.map(r =>
      `| ${icons[r.severity]} ${r.severity} | ${r.tool} | ${r.title} | ${r.recommendation ?? '-'} |`
    ),
  ].join('\n');

  const details = results.map(r => [
    `### ${icons[r.severity]} ${r.title}`,
    `**Tool:** ${r.tool} | **Severity:** ${r.severity}`,
    '',
    r.description,
    r.recommendation ? `\n**Aanbeveling:** ${r.recommendation}` : '',
    r.mitreAttackId  ? `**MITRE ATT&CK:** ${r.mitreAttackId}` : '',
  ].filter(Boolean).join('\n')).join('\n\n');

  return [
    `# Cyber Agent Security Rapport`,
    `**Datum:** ${date} | **Mode:** ${mode}`,
    '',
    '## Overzicht',
    '',
    table,
    '',
    '## Details',
    '',
    details,
  ].join('\n');
}

function toCsv(results: ScanResult[]): string {
  const header = 'severity,tool,title,description,recommendation,mitreAttackId';
  const rows = results.map(r =>
    [r.severity, r.tool, r.title, r.description, r.recommendation ?? '', r.mitreAttackId ?? '']
      .map(v => `"${String(v).replace(/"/g, '""')}"`)
      .join(',')
  );
  return [header, ...rows].join('\n');
}
